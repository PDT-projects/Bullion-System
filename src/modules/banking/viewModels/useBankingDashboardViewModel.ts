// Banking Module - Dashboard ViewModel
// Manages state and logic for banking dashboard with Data Connect integration

import { useState, useMemo, useCallback, useEffect } from 'react';
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
  cashRecords: CashTransaction[];
  firebaseBanks: Bank[];
  
  // Loading State
  isLoading: boolean;
  error: string | null;
  
  // Quick Actions
  showTransferModal: boolean;
  setShowTransferModal: (show: boolean) => void;
  
  // Actions
  refreshData: () => Promise<void>;
  
  // Utils
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
}

export function useBankingDashboardViewModel({
  banks: localBanks,
  transfers,
  cashTransactions
}: UseBankingDashboardViewModelProps): UseBankingDashboardViewModelReturn {
  // Modal state
  const [showTransferModal, setShowTransferModal] = useState(false);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data from Data Connect
  const [cashRecords, setCashRecords] = useState<CashTransaction[]>([]);
  const [dataConnectBanks, setDataConnectBanks] = useState<Bank[]>([]);

  // Fetch all data from Data Connect on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Fetch all data from Data Connect
  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch both cash transactions and banks from Data Connect in parallel
      const [cashData, banksData] = await Promise.all([
        BankingService.fetchCashTransactionsFromDataConnect(),
        BankingService.fetchBanksFromDataConnect()
      ]);
      
      setCashRecords(cashData);
      setDataConnectBanks(banksData);
      
      console.log(`✅ Dashboard fetched ${cashData.length} cash transactions and ${banksData.length} banks from Data Connect`);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load data from database');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh all data (public method)
  const refreshData = useCallback(async (): Promise<void> => {
    await fetchAllData();
  }, []);

  // Calculate total cash balance from cash transactions
  const totalCashBalance = useMemo(() => {
    const stats = BankingService.calculateCashStats(cashRecords, 0);
    return stats.totalCashInHand;
  }, [cashRecords]);

  // Calculate total bank balance from Data Connect banks
  const totalBankBalance = useMemo(() => {
    return dataConnectBanks.reduce((sum, bank) => sum + bank.balance, 0);
  }, [dataConnectBanks]);

  // Calculate dashboard statistics using Data Connect data
  const stats = useMemo(() => {
    return {
      totalBankBalance,
      totalCashInHand: totalCashBalance,
      totalLiquidity: totalBankBalance + totalCashBalance,
      bankCount: dataConnectBanks.length
    };
  }, [totalBankBalance, totalCashBalance, dataConnectBanks.length]);

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
    cashRecords,
    firebaseBanks: dataConnectBanks,
    isLoading,
    error,
    showTransferModal,
    setShowTransferModal,
    refreshData,
    formatCurrency,
    formatDate
  };
}
