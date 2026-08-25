// Budget Module - ViewModel Layer
// Delete confirmation logic and state management with Firebase Firestore

import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Budget } from '../models/types';
import { BudgetService } from '../models/budgetService';
import { BudgetFirebaseService } from '../models/Budgetfirebaseservice';

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

  const [budget, setBudget] = useState<Budget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ==================== EFFECTS ====================

  useEffect(() => {
    if (id) {
      const loadBudget = async () => {
        try {
          console.log(`🔄 Loading budget ${id} for deletion...`);
          const found = await BudgetFirebaseService.fetchBudgetById(id);
          if (found) {
            setBudget(found);
            console.log('✅ Budget loaded for deletion:', found.subCategory);
          } else {
            toast.error('Budget not found');
            navigate('/budgets');
          }
        } catch (error) {
          console.error('❌ Error loading budget:', error);
          toast.error('Failed to load budget');
          navigate('/budgets');
        }
      };
      loadBudget();
    } else {
      toast.error('Invalid budget ID');
      navigate('/budgets');
    }
  }, [id, navigate]);

  // ==================== COMPUTED ====================

  const budgetStatus = budget ? BudgetService.getBudgetStatus(budget) : null;
  const remaining = budget ? budget.budgetLimit - budget.spent : 0;

  // ==================== ACTIONS ====================

  const handleConfirmDelete = useCallback(async () => {
    if (!id || !budget) return;

    setIsDeleting(true);

    try {
      console.log('🗑️ Deleting budget:', id);
      await BudgetFirebaseService.deleteBudget(id);
      toast.success(`Budget "${budget.subCategory}" deleted successfully!`);
      console.log('✅ Budget deleted, navigating to /budgets');
      navigate('/budgets');
    } catch (error) {
      console.error('❌ Error deleting budget:', error);
      toast.error('Failed to delete budget. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }, [id, budget, navigate]);

  const handleCancel = useCallback(() => {
    navigate('/budgets');
  }, [navigate]);

  // ==================== RETURN ====================

  return {
    budget,
    isDeleting,
    budgetStatus,
    remaining,
    handleConfirmDelete,
    handleCancel
  };
}