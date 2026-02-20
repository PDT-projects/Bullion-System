// Banking Module - Cash List ViewModel
// Manages state and logic for cash transaction list page

import { useState, useMemo, useCallback } from 'react';
import { CashTransaction, CashStats, CashFilters } from '../models/types';
import { BankingService } from '../models/bankingService';

interface UseCashListViewModelProps {
  cashTransactions: CashTransaction[];
  setCashTransactions: (transactions: CashTransaction[]) => void;
  openingBalance?: number;
  setOpeningBalance?: (balance: number) => void;
}

interface UseCashListViewModelReturn {
  // Data
  transactions: CashTransaction[];
  filteredTransactions: CashTransaction[];
  stats: CashStats;
  
  // Filters
  filters: CashFilters;
  setSearchTerm: (term: string) => void;
  setFilterType: (type: 'all' | 'inflow' | 'outflow') => void;
  
  // Actions
  handleDeleteTransaction: (id: string) => void;
  handleSetOpeningBalance: (amount: number) => void;
  
  // Utils
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
}


export function useCashListViewModel({
  cashTransactions,
  setCashTransactions,
  openingBalance = 0,
  setOpeningBalance
}: UseCashListViewModelProps): UseCashListViewModelReturn {
  // Filters state
  const [filters, setFilters] = useState<CashFilters>({
    searchTerm: '',
    filterType: 'all'
  });


  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return BankingService.filterCashTransactions(
      cashTransactions,
      filters.searchTerm,
      filters.filterType
    );
  }, [cashTransactions, filters.searchTerm, filters.filterType]);

  // Calculate statistics
  const stats = useMemo(() => {
    return BankingService.calculateCashStats(cashTransactions, openingBalance);
  }, [cashTransactions, openingBalance]);


  // Set search term
  const setSearchTerm = useCallback((term: string) => {
    setFilters(prev => ({ ...prev, searchTerm: term }));
  }, []);

  // Set filter type
  const setFilterType = useCallback((type: 'all' | 'inflow' | 'outflow') => {
    setFilters(prev => ({ ...prev, filterType: type }));
  }, []);

  // Delete transaction
  const handleDeleteTransaction = useCallback((id: string) => {
    const txnToDelete = cashTransactions.find(t => t.id === id);
    if (!txnToDelete) return;

    if (confirm(`Are you sure you want to delete this ${txnToDelete.mainCategory.toLowerCase()} transaction?`)) {
      setCashTransactions(cashTransactions.filter(t => t.id !== id));
    }
  }, [cashTransactions, setCashTransactions]);

  // Set opening balance
  const handleSetOpeningBalance = useCallback((amount: number) => {
    if (setOpeningBalance) {
      setOpeningBalance(amount);
    }
  }, [setOpeningBalance]);


  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return BankingService.formatCurrency(amount);
  }, []);

  // Format date
  const formatDate = useCallback((date: string) => {
    return BankingService.formatDate(date);
  }, []);

  return {
    transactions: cashTransactions,
    filteredTransactions,
    stats,
    filters,
    setSearchTerm,
    setFilterType,
    handleDeleteTransaction,
    handleSetOpeningBalance,
    formatCurrency,
    formatDate
  };

}
