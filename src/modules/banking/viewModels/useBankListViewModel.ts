// Banking Module - Bank List ViewModel
// Manages state and logic for bank list page

import { useState, useMemo, useCallback } from 'react';
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
  handleDeleteBank: (id: string) => void;
  handleTransfer: (fromBankId: string, toBankId: string, amount: number) => void;
  
  // Utils
  formatCurrency: (amount: number) => string;
}

export function useBankListViewModel({
  banks,
  setBanks
}: UseBankListViewModelProps): UseBankListViewModelReturn {
  // Filters state
  const [filters, setFilters] = useState<BankFilters>({
    searchTerm: ''
  });
  
  // View state
  const [viewingBank, setViewingBank] = useState<Bank | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

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

  // Delete bank
  const handleDeleteBank = useCallback((id: string) => {
    const bankToDelete = banks.find(b => b.id === id);
    if (!bankToDelete) return;

    if (confirm(`Are you sure you want to delete ${bankToDelete.name}?`)) {
      setBanks(banks.filter(b => b.id !== id));
    }
  }, [banks, setBanks]);

  // Handle transfer between banks
  const handleTransfer = useCallback((fromBankId: string, toBankId: string, amount: number) => {
    if (!fromBankId || !toBankId || amount <= 0) return;
    if (fromBankId === toBankId) return;

    const fromBank = banks.find(b => b.id === fromBankId);
    if (!fromBank || fromBank.balance < amount) return;

    const updatedBanks = BankingService.updateBankBalancesForTransfer(
      banks,
      fromBankId,
      toBankId,
      amount
    );

    setBanks(updatedBanks);
    closeTransferModal();
  }, [banks, setBanks, closeTransferModal]);

  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return BankingService.formatCurrency(amount);
  }, []);

  return {
    banks,
    filteredBanks,
    stats,
    filters,
    setSearchTerm,
    viewingBank,
    isTransferModalOpen,
    setViewingBank,
    openTransferModal,
    closeTransferModal,
    handleDeleteBank,
    handleTransfer,
    formatCurrency
  };
}
