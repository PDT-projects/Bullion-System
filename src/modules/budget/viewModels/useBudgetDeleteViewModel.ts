// Budget Module - ViewModel Layer
// Delete confirmation logic and state management

import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import { Budget } from '../models/types';
import { BudgetService } from '../models/budgetService';

interface BudgetContext {
  budgets: Budget[];
  setBudgets: (budgets: Budget[]) => void;
}

interface UseBudgetDeleteViewModelReturn {
  // State
  budget: Budget | null;
  isDeleting: boolean;
  
  // Budget Info
  budgetStatus: {
    status: 'On Track' | 'Close to Limit' | 'Over Budget';
    color: string;
    bgColor: string;
    percentage: number;
  } | null;
  remaining: number;
  
  // Actions
  handleConfirmDelete: () => void;
  handleCancel: () => void;
}

export function useBudgetDeleteViewModel(): UseBudgetDeleteViewModelReturn {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { budgets, setBudgets } = useOutletContext<BudgetContext>();
  
  const [budget, setBudget] = useState<Budget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load budget data
  useEffect(() => {
    if (id) {
      const foundBudget = BudgetService.findById(budgets, id);
      if (foundBudget) {
        setBudget(foundBudget);
      } else {
        toast.error('Budget not found');
        navigate('/budgets');
      }
    }
  }, [id, budgets, navigate]);

  // Calculate budget status
  const budgetStatus = budget ? BudgetService.getBudgetStatus(budget) : null;
  const remaining = budget ? budget.budgetLimit - budget.spent : 0;

  const handleConfirmDelete = useCallback(() => {
    if (!id || !budget) return;
    
    setIsDeleting(true);
    
    try {
      const updatedBudgets = BudgetService.deleteBudget(budgets, id);
      setBudgets(updatedBudgets);
      toast.success(`Budget "${budget.subCategory}" deleted successfully!`);
      navigate('/budgets');
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast.error('Failed to delete budget. Please try again.');
      setIsDeleting(false);
    }
  }, [id, budget, budgets, setBudgets, navigate]);

  const handleCancel = useCallback(() => {
    navigate('/budgets');
  }, [navigate]);

  return {
    budget,
    isDeleting,
    budgetStatus,
    remaining,
    handleConfirmDelete,
    handleCancel
  };
}
