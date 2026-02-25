// Banking Module - Dashboard ViewModel
// Manages state and logic for banking dashboard with Firebase integration

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Bank, BankTransfer, CashTransaction, DashboardStats } from '../models/types';
import { BankingService } from '../models/bankingService';
import { CashFirebaseService, CashInHandRecord } from '../models/cashFirebaseService';
import { BankFirebaseService } from '../models/bankFirebaseService';

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
  cashRecords: CashInHandRecord[];
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
  
  // Data from Firebase
  const [cashRecords, setCashRecords] = useState<CashInHandRecord[]>([]);
  const [firebaseBanks, setFirebaseBanks] = useState<Bank[]>([]);

  // Fetch all data from Firebase on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Fetch all data from Firebase
  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch both cash records and banks from Firebase in parallel
      const [cashRecordsData, banksData] = await Promise.all([
        CashFirebaseService.fetchAllCashRecords(),
        BankFirebaseService.fetchAllBanks()
      ]);
      
      setCashRecords(cashRecordsData);
      setFirebaseBanks(banksData);
      
      console.log(`✅ Dashboard fetched ${cashRecordsData.length} cash records and ${banksData.length} banks`);
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

  // Calculate total cash balance from Firebase records
  const totalCashBalance = useMemo(() => {
    return cashRecords.reduce((sum, record) => sum + record.balance, 0);
  }, [cashRecords]);

  // Calculate total bank balance from Firebase banks
  const totalBankBalance = useMemo(() => {
    return firebaseBanks.reduce((sum, bank) => sum + bank.balance, 0);
  }, [firebaseBanks]);

  // Calculate dashboard statistics using Firebase data
  const stats = useMemo(() => {
    return {
      totalBankBalance,
      totalCashInHand: totalCashBalance,
      totalLiquidity: totalBankBalance + totalCashBalance,
      bankCount: firebaseBanks.length
    };
  }, [totalBankBalance, totalCashBalance, firebaseBanks.length]);

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
    firebaseBanks,
    isLoading,
    error,
    showTransferModal,
    setShowTransferModal,
    refreshData,
    formatCurrency,
    formatDate
  };
}
