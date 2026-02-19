// Banking Module - Dashboard ViewModel
// Manages state and logic for banking dashboard

import { useState, useMemo, useCallback } from 'react';
import { Bank, BankTransfer, CashTransaction, DashboardStats } from '../models/types';
import { BankingService } from '../models/bankingService';

interface UseBankingDashboardViewModelProps {
  banks: Bank[];
  transfers: BankTransfer[];
  cashTransactions: CashTransaction[];
}

interface UseBankingDashboardViewModelReturn {
  // Data
  stats: DashboardStats;
  recentTransfers: BankTransfer[];
  recentCashTransactions: CashTransaction[];
  
  // Quick Actions
  showTransferModal: boolean;
  setShowTransferModal: (show: boolean) => void;
  
  // Utils
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
}

export function useBankingDashboardViewModel({
  banks,
  transfers,
  cashTransactions
}: UseBankingDashboardViewModelProps): UseBankingDashboardViewModelReturn {
  // Modal state
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Calculate dashboard statistics
  const stats = useMemo(() => {
    return BankingService.calculateDashboardStats(banks, cashTransactions);
  }, [banks, cashTransactions]);

  // Get recent transfers (last 5)
  const recentTransfers = useMemo(() => {
    return BankingService.sortTransactionsByDate(transfers).slice(0, 5);
  }, [transfers]);

  // Get recent cash transactions (last 5)
  const recentCashTransactions = useMemo(() => {
    return BankingService.sortTransactionsByDate(cashTransactions).slice(0, 5);
  }, [cashTransactions]);

  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return BankingService.formatCurrency(amount);
  }, []);

  // Format date
  const formatDate = useCallback((date: string) => {
    return BankingService.formatDate(date);
  }, []);

  return {
    stats,
    recentTransfers,
    recentCashTransactions,
    showTransferModal,
    setShowTransferModal,
    formatCurrency,
    formatDate
  };
}
