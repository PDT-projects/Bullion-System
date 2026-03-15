// Banking Module - Bank List ViewModel

import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { Bank, BankStats, BankFilters } from '../models/types';
import { BankingService } from '../models/bankingService';
import { BankFirebaseService } from '../models/bankFirebaseService';

export function useBankListViewModel() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<BankFilters>({ searchTerm: '' });
  const [viewingBank, setViewingBank] = useState<Bank | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const loadBanks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await BankFirebaseService.fetchAllBanks();
      setBanks(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load banks';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadBanks(); }, [loadBanks]);

  const filteredBanks = useMemo(
    () => BankingService.filterBanks(banks, filters.searchTerm),
    [banks, filters.searchTerm]
  );

  const stats: BankStats = useMemo(
    () => BankingService.calculateBankStats(banks),
    [banks]
  );

  const setSearchTerm = useCallback((term: string) => {
    setFilters(prev => ({ ...prev, searchTerm: term }));
  }, []);

  const handleDeleteBank = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this bank account?')) return;
    try {
      await BankFirebaseService.deleteBank(id);
      setBanks(prev => prev.filter(b => b.id !== id));
      toast.success('Bank account deleted successfully');
    } catch (err) {
      toast.error('Failed to delete bank account');
    }
  }, []);

  const handleTransfer = useCallback(async (fromBankId: string, toBankId: string, amount: number) => {
    const fromBank = banks.find(b => b.id === fromBankId);
    const toBank = banks.find(b => b.id === toBankId);
    if (!fromBank || !toBank) { toast.error('Bank not found'); return; }
    if (amount <= 0) { toast.error('Amount must be greater than 0'); return; }
    if (fromBank.balance < amount) { toast.error('Insufficient balance'); return; }
    try {
      await BankFirebaseService.updateMultipleBanks([
        { ...fromBank, balance: fromBank.balance - amount },
        { ...toBank, balance: toBank.balance + amount }
      ]);
      setBanks(prev => prev.map(b => {
        if (b.id === fromBankId) return { ...b, balance: b.balance - amount };
        if (b.id === toBankId) return { ...b, balance: b.balance + amount };
        return b;
      }));
      setIsTransferModalOpen(false);
      toast.success('Transfer completed successfully');
    } catch (err) {
      toast.error('Failed to complete transfer');
    }
  }, [banks]);

  return {
    banks,
    filteredBanks,
    stats,
    isLoading,
    error,
    filters,
    setSearchTerm,
    viewingBank,
    setViewingBank,
    isTransferModalOpen,
    openTransferModal: () => setIsTransferModalOpen(true),
    closeTransferModal: () => setIsTransferModalOpen(false),
    handleDeleteBank,
    handleTransfer,
    refreshBanks: loadBanks,
    formatCurrency: BankingService.formatCurrency
  };
}