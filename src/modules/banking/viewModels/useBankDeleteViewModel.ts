// Banking Module - Bank Delete ViewModel
// Manages state and logic for delete bank confirmation

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Bank } from '../models/types';
import { BankingService } from '../models/bankingService';

interface UseBankDeleteViewModelProps {
  banks: Bank[];
  setBanks: (banks: Bank[]) => void;
}

interface UseBankDeleteViewModelReturn {
  // Data
  bank: Bank | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  handleDelete: () => void;
  handleCancel: () => void;
  
  // Utils
  formatCurrency: (amount: number) => string;
}

export function useBankDeleteViewModel({
  banks,
  setBanks
}: UseBankDeleteViewModelProps): UseBankDeleteViewModelReturn {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [bank, setBank] = useState<Bank | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load bank data
  useEffect(() => {
    if (id) {
      const foundBank = banks.find(b => b.id === id);
      if (foundBank) {
        setBank(foundBank);
        setError(null);
      } else {
        setError('Bank account not found');
      }
      setIsLoading(false);
    }
  }, [id, banks]);

  // Handle delete
  const handleDelete = useCallback(() => {
    if (!bank) return;
    
    // Check if bank has balance
    if (bank.balance > 0) {
      if (!confirm(`This bank has a balance of ${formatCurrency(bank.balance)}. Are you sure you want to delete it? The balance will be lost.`)) {
        return;
      }
    }
    
    setBanks(banks.filter(b => b.id !== bank.id));
    navigate('/banking/banks');
  }, [bank, banks, setBanks, navigate]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    navigate('/banking/banks');
  }, [navigate]);

  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return BankingService.formatCurrency(amount);
  }, []);

  return {
    bank,
    isLoading,
    error,
    handleDelete,
    handleCancel,
    formatCurrency
  };
}
