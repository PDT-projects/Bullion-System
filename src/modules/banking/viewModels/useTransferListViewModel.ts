// Banking Module - Transfer List ViewModel
// Manages state and logic for bank transfer list page with Data Connect integration

import { useState, useMemo, useCallback, useEffect } from 'react';
import { BankTransfer, TransferStats, TransferFilters } from '../models/types';
import { BankingService } from '../models/bankingService';

interface UseTransferListViewModelProps {
  transfers: BankTransfer[];
  setTransfers: (transfers: BankTransfer[]) => void;
}

interface UseTransferListViewModelReturn {
  // Data
  transfers: BankTransfer[];
  dataConnectTransfers: BankTransfer[];
  filteredTransfers: BankTransfer[];
  stats: TransferStats;
  
  // Loading State
  isLoading: boolean;
  error: string | null;
  
  // Filters
  filters: TransferFilters;
  setSearchTerm: (term: string) => void;
  setDateRange: (startDate: string | null, endDate: string | null) => void;
  
  // Actions
  handleDeleteTransfer: (id: string) => Promise<void>;
  refreshTransfers: () => Promise<void>;
  
  // Utils
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
}

export function useTransferListViewModel({
  transfers: propTransfers,
  setTransfers
}: UseTransferListViewModelProps): UseTransferListViewModelReturn {
  // Data from Data Connect
  const [dataConnectTransfers, setDataConnectTransfers] = useState<BankTransfer[]>([]);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters state
  const [filters, setFilters] = useState<TransferFilters>({
    searchTerm: '',
    startDate: null,
    endDate: null
  });

  // Fetch transfers from Data Connect on mount
  useEffect(() => {
    fetchTransfersFromDataConnect();
  }, []);

  // Fetch transfers from Data Connect
  const fetchTransfersFromDataConnect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch transfers from Data Connect
      const transfers = await BankingService.fetchTransfersFromDataConnect();
      setDataConnectTransfers(transfers);
      
      // Update parent state if needed
      if (transfers.length > 0 && propTransfers.length === 0) {
        setTransfers(transfers);
      }
      
      console.log(`✅ Fetched ${transfers.length} transfers from Data Connect`);
    } catch (err) {
      console.error('Error fetching transfers:', err);
      setError('Failed to load transfers from database');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh transfers (public method)
  const refreshTransfers = useCallback(async () => {
    await fetchTransfersFromDataConnect();
  }, []);

  // Use Data Connect transfers for display, fallback to props
  const transfers = dataConnectTransfers.length > 0 ? dataConnectTransfers : propTransfers;

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

  // Delete transfer - from Data Connect
  const handleDeleteTransfer = useCallback(async (id: string) => {
    const transferToDelete = transfers.find(t => t.id === id);
    if (!transferToDelete) return;

    if (confirm('Are you sure you want to delete this transfer record?')) {
      try {
        await BankingService.deleteTransferFromDataConnect(id);
        
        // Update local state
        const updatedTransfers = transfers.filter(t => t.id !== id);
        setDataConnectTransfers(updatedTransfers);
        setTransfers(updatedTransfers);
        
        console.log('✅ Transfer deleted successfully');
      } catch (err) {
        console.error('Error deleting transfer:', err);
        alert('Failed to delete transfer. Please try again.');
      }
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
    dataConnectTransfers,
    filteredTransfers,
    stats,
    isLoading,
    error,
    filters,
    setSearchTerm,
    setDateRange,
    handleDeleteTransfer,
    refreshTransfers,
    formatCurrency,
    formatDate
  };
}
