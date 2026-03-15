// Banking Module - Transfer List ViewModel

import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { BankTransfer, TransferStats, TransferFilters } from '../models/types';
import { BankingService } from '../models/bankingService';
import { TransferFirebaseService } from '../models/Transferfirebaseservice';

export function useTransferListViewModel() {
  const [transfers, setTransfers] = useState<BankTransfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TransferFilters>({ searchTerm: '', startDate: null, endDate: null });

  const loadTransfers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await TransferFirebaseService.fetchAllTransfers();
      setTransfers(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load transfers';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadTransfers(); }, [loadTransfers]);

  const filteredTransfers = useMemo(
    () => BankingService.filterTransfers(transfers, filters.searchTerm, filters.startDate, filters.endDate),
    [transfers, filters]
  );

  const stats: TransferStats = useMemo(
    () => BankingService.calculateTransferStats(transfers),
    [transfers]
  );

  const setSearchTerm = useCallback((term: string) => {
    setFilters(prev => ({ ...prev, searchTerm: term }));
  }, []);

  const setDateRange = useCallback((startDate: string | null, endDate: string | null) => {
    setFilters(prev => ({ ...prev, startDate, endDate }));
  }, []);

  const handleDeleteTransfer = useCallback(async (id: string) => {
    if (!confirm('Delete this transfer record?')) return;
    try {
      await TransferFirebaseService.deleteTransfer(id);
      setTransfers(prev => prev.filter(t => t.id !== id));
      toast.success('Transfer deleted');
    } catch (err) {
      toast.error('Failed to delete transfer');
    }
  }, []);

  return {
    transfers,
    filteredTransfers,
    stats,
    isLoading,
    error,
    filters,
    setSearchTerm,
    setDateRange,
    handleDeleteTransfer,
    refreshTransfers: loadTransfers,
    formatCurrency: BankingService.formatCurrency,
    formatDate: BankingService.formatDate
  };
}