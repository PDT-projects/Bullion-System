// Banking Module - Bank List ViewModel

import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { Bank, BankStats, BankFilters } from '../models/types';
import { BankingService } from '../models/bankingService';
import { BankFirebaseService } from '../models/bankFirebaseService';
import { TransferFirebaseService } from '../models/Transferfirebaseservice';

interface TransferModalData {
  fromBankId: string;
  toBankId: string;
  amount: number;
  date: string;
  note: string;
}

export function useBankListViewModel() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransferSaving, setIsTransferSaving] = useState(false);
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

  // Full transfer: saves to bank_transfers collection AND updates both bank balances
  const handleTransfer = useCallback(async (data: TransferModalData) => {
    const fromBank = banks.find(b => b.id === data.fromBankId);
    const toBank = banks.find(b => b.id === data.toBankId);

    if (!fromBank || !toBank) { toast.error('Bank not found'); return; }
    if (data.amount <= 0) { toast.error('Amount must be greater than 0'); return; }
    if (fromBank.balance < data.amount) { toast.error('Insufficient balance'); return; }

    setIsTransferSaving(true);
    try {
      // 1. Save transfer record to Firestore (bank_transfers collection)
      await TransferFirebaseService.createTransfer({
        date: data.date,
        fromBankId: data.fromBankId,
        fromBankName: fromBank.name,
        toBankId: data.toBankId,
        toBankName: toBank.name,
        amount: data.amount,
        note: data.note || ''
      });

      // 2. Update both bank balances in Firestore
      await BankFirebaseService.updateMultipleBanks([
        { ...fromBank, balance: fromBank.balance - data.amount },
        { ...toBank, balance: toBank.balance + data.amount }
      ]);

      // 3. Update local state to reflect new balances immediately
      setBanks(prev => prev.map(b => {
        if (b.id === data.fromBankId) return { ...b, balance: b.balance - data.amount };
        if (b.id === data.toBankId) return { ...b, balance: b.balance + data.amount };
        return b;
      }));

      setIsTransferModalOpen(false);
      toast.success('Transfer completed successfully');
    } catch (err) {
      toast.error('Failed to complete transfer');
    } finally {
      setIsTransferSaving(false);
    }
  }, [banks]);

  return {
    banks,
    filteredBanks,
    stats,
    isLoading,
    isTransferSaving,
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