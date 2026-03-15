// Banking Module - Dashboard ViewModel

import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { Bank, BankTransfer, CashTransaction, DashboardStats } from '../models/types';
import { BankingService } from '../models/bankingService';
import { BankFirebaseService } from '../models/bankFirebaseService';
import { TransferFirebaseService } from '../models/Transferfirebaseservice';
import { CashFirebaseService } from '../models/cashFirebaseService';

export function useBankingDashboardViewModel() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [transfers, setTransfers] = useState<BankTransfer[]>([]);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [banksData, transfersData, cashData, cashRecords] = await Promise.all([
        BankFirebaseService.fetchAllBanks(),
        TransferFirebaseService.fetchAllTransfers(),
        CashFirebaseService.fetchAllCashTransactions(),
        CashFirebaseService.fetchAllCashRecords()
      ]);
      setBanks(banksData);
      setTransfers(transfersData);
      setCashTransactions(cashData);
      if (cashRecords.length > 0) setOpeningBalance(cashRecords[0].balance);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load banking data';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const stats: DashboardStats = useMemo(
    () => BankingService.calculateDashboardStats(banks, cashTransactions, openingBalance),
    [banks, cashTransactions, openingBalance]
  );

  const recentTransfers = useMemo(
    () => BankingService.sortByDate(transfers).slice(0, 5),
    [transfers]
  );

  const recentCashTransactions = useMemo(
    () => BankingService.sortByDate(cashTransactions).slice(0, 5),
    [cashTransactions]
  );

  return {
    stats,
    recentTransfers,
    recentCashTransactions,
    firebaseBanks: banks,
    cashRecords: cashTransactions,
    isLoading,
    error,
    showTransferModal,
    setShowTransferModal,
    refreshData: loadData,
    formatCurrency: BankingService.formatCurrency,
    formatDate: BankingService.formatDate
  };
}