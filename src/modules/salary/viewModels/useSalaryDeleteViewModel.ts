// Salary Module - ViewModel Layer
// Delete confirmation page logic

import { useEffect, useCallback } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import { Salary } from '../models/types';
import { SalaryService } from '../models/salaryService';

interface SalaryContext {
  transactions: any[];
  setTransactions: (transactions: any[]) => void;
  banks: any[];
  setBanks: (banks: any[]) => void;
}

interface UseSalaryDeleteViewModelReturn {
  // Data
  salary: Salary | null;
  isLoading: boolean;
  
  // Actions
  onDelete: () => void;
  onCancel: () => void;
}

export function useSalaryDeleteViewModel(): UseSalaryDeleteViewModelReturn {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { transactions, setTransactions, banks, setBanks } = useOutletContext<SalaryContext>();

  // ==================== COMPUTED VALUES ====================
  
  // Find the salary to delete
  const allSalaries = transactions.filter((t: any) => t.mainCategory === 'Salary') as Salary[];
  const salary = id ? SalaryService.findById(allSalaries, id) || null : null;

  // ==================== EFFECTS ====================
  
  // Redirect if salary not found
  useEffect(() => {
    if (id && transactions.length > 0 && !salary) {
      toast.error('Salary record not found');
      navigate('/salary');
    }
  }, [id, transactions, salary, navigate]);

  // ==================== ACTIONS ====================
  
  /**
   * Handle delete confirmation
   */
  const handleDelete = useCallback(() => {
    if (!id) {
      toast.error('Invalid salary ID');
      return;
    }

    try {
      // Reverse bank transaction if it was a bank payment
      if (salary && (salary.mode === 'Bank' || salary.mode === 'Cheque') && salary.bankName && setBanks) {
        const updatedBanks = banks.map((bank: any) => {
          if (bank.name === salary.bankName) {
            return { ...bank, balance: bank.balance + salary.amount };
          }
          return bank;
        });
        setBanks(updatedBanks);
      }

      const updatedTransactions = transactions.filter((t: any) => t.id !== id);
      setTransactions(updatedTransactions);
      toast.success('Salary record deleted successfully');
      
      // Navigate back based on salary type
      if (salary?.subCategory === 'Advance salary') {
        navigate('/salary/advance');
      } else {
        navigate('/salary/regular');
      }
    } catch (error) {
      toast.error('An error occurred while deleting the salary record');
      console.error('Error deleting salary:', error);
    }
  }, [id, salary, transactions, setTransactions, banks, setBanks, navigate]);

  /**
   * Handle cancel action
   */
  const handleCancel = useCallback(() => {
    if (salary?.subCategory === 'Advance salary') {
      navigate('/salary/advance');
    } else {
      navigate('/salary/regular');
    }
  }, [navigate, salary]);

  // ==================== RETURN ====================
  
  return {
    salary,
    isLoading: false,
    onDelete: handleDelete,
    onCancel: handleCancel
  };
}
