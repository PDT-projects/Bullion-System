// Banking Module - Bank List ViewModel
// Manages state and logic for bank list page with Firebase Data Connect integration

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Bank, BankStats, BankFilters } from '../models/types';
import { BankingService } from '../models/bankingService';

interface UseBankListViewModelProps {
  banks: Bank[];
  setBanks: (banks: Bank[]) => void;
}

interface UseBankListViewModelReturn {
  // Data
  banks: Bank[];
  filteredBanks: Bank[];
  stats: BankStats;
  
  // Loading State
  isLoading: boolean;
  error: string | null;
  
  // Filters
  filters: BankFilters;
  setSearchTerm: (term: string) => void;
  
  // View State
  viewingBank: Bank | null;
  isTransferModalOpen: boolean;
  setViewingBank: (bank: Bank | null) => void;
  openTransferModal: () => void;
  closeTransferModal: () => void;
  
  // Actions
  handleDeleteBank: (id: string) => Promise<void>;
  handleTransfer: (fromBankId: string, toBankId: string, amount: number) => Promise<void>;
  refreshBanks: () => Promise<void>;
  
  // Utils
  formatCurrency: (amount: number) => string;
}

export function useBankListViewModel({
  banks,
  setBanks
}: UseBankListViewModelProps): UseBankListViewModelReturn {
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters state
  const [filters, setFilters] = useState<BankFilters>({
    searchTerm: ''
  });
  
  // View state
  const [viewingBank, setViewingBank] = useState<Bank | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Fetch banks from Data Connect on mount
  useEffect(() => {
    fetchBanks();
  }, []);

  // Fetch banks from Data Connect
  const fetchBanks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedBanks = await BankingService.fetchBanksFromFirebase();
      setBanks(fetchedBanks);
    } catch (err) {
      console.error('Error fetching banks:', err);
      setError('Failed to load banks from database');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh banks (public method)
  const refreshBanks = useCallback(async () => {
    await fetchBanks();
  }, [setBanks]);

  // Filter banks based on search term
  const filteredBanks = useMemo(() => {
    return BankingService.filterBanks(banks, filters.searchTerm);
  }, [banks, filters.searchTerm]);

  // Calculate statistics
  const stats = useMemo(() => {
    return BankingService.calculateBankStats(banks);
  }, [banks]);

  // Set search term
  const setSearchTerm = useCallback((term: string) => {
    setFilters(prev => ({ ...prev, searchTerm: term }));
  }, []);

  // Open/Close transfer modal
  const openTransferModal = useCallback(() => {
    setIsTransferModalOpen(true);
  }, []);

  const closeTransferModal = useCallback(() => {
    setIsTransferModalOpen(false);
  }, []);

  // Delete bank with Data Connect
  const handleDeleteBank = useCallback(async (id: string) => {
    const bankToDelete = banks.find(b => b.id === id);
    if (!bankToDelete) return;

    if (!confirm(`Are you sure you want to delete ${bankToDelete.name}?`)) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Delete from Data Connect
      await BankingService.deleteBankFromFirebase(id);
      
      // Update local state
      setBanks(banks.filter(b => b.id !== id));
      
      console.log('✅ Bank deleted successfully:', id);
    } catch (err) {
      console.error('Error deleting bank:', err);
      setError('Failed to delete bank from database');
      alert('Failed to delete bank. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [banks, setBanks]);

  // Handle transfer between banks with Data Connect
  const handleTransfer = useCallback(async (fromBankId: string, toBankId: string, amount: number) => {
    if (!fromBankId || !toBankId || amount <= 0) return;
    if (fromBankId === toBankId) return;

    const fromBank = banks.find(b => b.id === fromBankId);
    if (!fromBank || fromBank.balance < amount) {
      alert('Insufficient balance in source bank');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Calculate updated banks
      const updatedBanks = BankingService.updateBankBalancesForTransfer(
        banks,
        fromBankId,
        toBankId,
        amount
      );

      // Get the two updated banks
      const updatedFromBank = updatedBanks.find(b => b.id === fromBankId)!;
      const updatedToBank = updatedBanks.find(b => b.id === toBankId)!;

      // Update both banks in Data Connect
      await BankingService.updateMultipleBanks([updatedFromBank, updatedToBank]);

      // Update local state
      setBanks(updatedBanks);
      
      console.log('✅ Transfer completed successfully');
      closeTransferModal();
    } catch (err) {
      console.error('Error during transfer:', err);
      setError('Failed to complete transfer');
      alert('Failed to complete transfer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [banks, setBanks, closeTransferModal]);

  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return BankingService.formatCurrency(amount);
  }, []);

  return {
    banks,
    filteredBanks,
    stats,
    isLoading,
    error,
    filters,
    setSearchTerm,
    viewingBank,
    isTransferModalOpen,
    setViewingBank,
    openTransferModal,
    closeTransferModal,
    handleDeleteBank,
    handleTransfer,
    refreshBanks,
    formatCurrency
  };
}
