// Banking Module - Transfer List ViewModel
// Manages state and logic for bank transfer list page

import { useState, useMemo, useCallback } from 'react';
import { BankTransfer, TransferStats, TransferFilters } from '../models/types';
import { BankingService } from '../models/bankingService';

interface UseTransferListViewModelProps {
  transfers: BankTransfer[];
  setTransfers: (transfers: BankTransfer[]) => void;
}

interface UseTransferListViewModelReturn {
  // Data
  transfers: BankTransfer[];
  filteredTransfers: BankTransfer[];
  stats: TransferStats;
  
  // Filters
  filters: TransferFilters;
  setSearchTerm: (term: string) => void;
  setDateRange: (startDate: string | null, endDate: string | null) => void;
  
  // Actions
  handleDeleteTransfer: (id: string) => void;
  
  // Utils
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
}

export function useTransferListViewModel({
  transfers,
  setTransfers
}: UseTransferListViewModelProps): UseTransferListViewModelReturn {
  // Filters state
  const [filters, setFilters] = useState<TransferFilters>({
    searchTerm: '',
    startDate: null,
    endDate: null
  });

  // Filter transfers
  const filteredTransfers = useMemo(() => {
    return BankingService.filterTransfers(transfers, filters.searchTerm);
  }, [transfers, filters.searchTerm]);

  // Calculate statistics
  const stats = useMemo(() => {
    return BankingService.calculateTransferStats(transfers);
  }, [transfers]);

  // Set search term
  const setSearchTerm = useCallback((term: string) => {
    setFilters(prev => ({ ...prev, searchTerm: term }));
  }, []);

  // Set date range
  const setDateRange = useCallback((startDate: string | null, endDate: string | null) => {
    setFilters(prev => ({ ...prev, startDate, endDate }));
  }, []);

  // Delete transfer
  const handleDeleteTransfer = useCallback((id: string) => {
    const transferToDelete = transfers.find(t => t.id === id);
    if (!transferToDelete) return;

    if (confirm('Are you sure you want to delete this transfer record?')) {
      setTransfers(transfers.filter(t => t.id !== id));
    }
  }, [transfers, setTransfers]);

  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return BankingService.formatCurrency(amount);
  }, []);

  // Format date
  const formatDate = useCallback((date: string) => {
    return BankingService.formatDate(date);
  }, []);

  return {
    transfers,
    filteredTransfers,
    stats,
    filters,
    setSearchTerm,
    setDateRange,
    handleDeleteTransfer,
    formatCurrency,
    formatDate
  };
}
