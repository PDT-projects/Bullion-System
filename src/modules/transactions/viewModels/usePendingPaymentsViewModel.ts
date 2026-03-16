// Transactions Module - Pending Payments ViewModel

import { useState, useMemo, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Transaction, PartialPayment, PendingPaymentData } from '../models/types';
import {
  getTransactionTotals, isPending, formatCurrency, formatDateTime,
  getCategoryColor, getPaymentStatusColor,
} from '../models/transactionsService';
import { TransactionFirebaseService } from '../models/transactionFirebaseService';
import { BankFirebaseService } from '../../banking/models/bankFirebaseService';

interface BankInfo { id: string; name: string; balance: number; }

export interface UsePendingPaymentsViewModelReturn {
  transactions:         Transaction[];
  filteredTransactions: Transaction[];
  viewTransaction:      Transaction | null;
  paymentModal:         boolean;
  selectedTransactionId:string | null;
  filterStatus:         'All' | 'Uncleared' | 'PartiallyPaid';
  paymentData:          PendingPaymentData;
  banks:                BankInfo[];
  isLoading:            boolean;
  summaryStats: { totalPending: number; unclearedCount: number; totalTransactions: number };
  setViewTransaction:       (t: Transaction | null) => void;
  setPaymentModal:          (v: boolean) => void;
  setSelectedTransactionId: (id: string | null) => void;
  setFilterStatus:          (s: 'All' | 'Uncleared' | 'PartiallyPaid') => void;
  setPaymentData:           (d: Partial<PendingPaymentData>) => void;
  addPartialPayment:        () => Promise<void>;
  markPaymentAsCleared:     (transactionId: string, paymentId: string) => Promise<void>;
  deleteTransaction:        (id: string) => Promise<void>;
  getTransactionTotals:     typeof getTransactionTotals;
  formatCurrency:           (n: number) => string;
  formatDateTime:           (d: string, t?: string) => string;
  getCategoryColor:         (c: string) => string;
  getPaymentStatusColor:    (t: Transaction) => string;
}

export function usePendingPaymentsViewModel(): UsePendingPaymentsViewModelReturn {
  const [transactions,          setTransactions]          = useState<Transaction[]>([]);
  const [banks,                 setBanks]                 = useState<BankInfo[]>([]);
  const [isLoading,             setIsLoading]             = useState(true);
  const [viewTransaction,       setViewTransaction]       = useState<Transaction | null>(null);
  const [paymentModal,          setPaymentModal]          = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [filterStatus,          setFilterStatus]          = useState<'All' | 'Uncleared' | 'PartiallyPaid'>('All');
  const [paymentData,           setPaymentDataState]      = useState<PendingPaymentData>({
    amount: 0, bankId: '', method: 'Cash',
  });

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [txList, bankList] = await Promise.all([
          TransactionFirebaseService.fetchAllTransactions(),
          BankFirebaseService.fetchAllBanks().catch(() => []),
        ]);
        setTransactions(txList.filter(isPending));
        setBanks(bankList as any[]);
      } catch {
        toast.error('Failed to load pending payments');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const { remainingAmount } = getTransactionTotals(t);
      const hasUncleared = (t.partialPayments || []).some(p => !p.isCleared && p.method !== 'Bank');
      if (filterStatus === 'All')           return true;
      if (filterStatus === 'Uncleared')     return hasUncleared;
      if (filterStatus === 'PartiallyPaid') return remainingAmount > 0;
      return true;
    });
  }, [transactions, filterStatus]);

  const summaryStats = useMemo(() => ({
    totalPending:     filteredTransactions.reduce((s, t) => s + getTransactionTotals(t).remainingAmount, 0),
    unclearedCount:   filteredTransactions.filter(t => (t.partialPayments || []).some(p => !p.isCleared)).length,
    totalTransactions:filteredTransactions.length,
  }), [filteredTransactions]);

  const setPaymentData = useCallback((d: Partial<PendingPaymentData>) => {
    setPaymentDataState(prev => ({ ...prev, ...d }));
  }, []);

  const addPartialPayment = useCallback(async () => {
    if (!selectedTransactionId) return;
    const tx = transactions.find(t => t.id === selectedTransactionId);
    if (!tx) return;

    const { remainingAmount } = getTransactionTotals(tx);

    // Validate
    if (!paymentData.amount || paymentData.amount <= 0) {
      toast.error('Enter a valid amount'); return;
    }
    if (paymentData.amount > remainingAmount) {
      toast.error(`Amount exceeds remaining balance (${formatCurrency(remainingAmount)})`); return;
    }
    if (paymentData.method === 'Bank' && !paymentData.bankId) {
      toast.error('Select a bank'); return;
    }
    if (paymentData.method === 'Cheque' && !paymentData.chequeNumber?.trim()) {
      toast.error('Enter cheque number'); return;
    }

    const newPayment: PartialPayment = {
      id:            `PAY-${Date.now()}`,
      amount:        paymentData.amount,
      date:          new Date().toISOString().split('T')[0],
      time:          new Date().toTimeString().split(' ')[0],
      method:        paymentData.method,
      bankId:        paymentData.method === 'Bank'    ? paymentData.bankId       : undefined,
      chequeNumber:  paymentData.method === 'Cheque'  ? paymentData.chequeNumber : undefined,
      isCleared:     paymentData.method === 'Bank',
    };

    try {
      await TransactionFirebaseService.addPartialPayment(selectedTransactionId, newPayment);
      // Update local state
      setTransactions(prev => prev.map(t => {
        if (t.id !== selectedTransactionId) return t;
        const payments    = [...(t.partialPayments || []), newPayment];
        const totalPaid   = payments.reduce((s, p) => s + p.amount, 0);
        const remaining   = t.amount - totalPaid;
        const updated     = { ...t, partialPayments: payments, totalPaid, remainingAmount: remaining, isFullyCleared: remaining <= 0 };
        // Remove from list if fully cleared
        return updated;
      }).filter(isPending));
      toast.success('Payment added successfully');
      setPaymentModal(false);
      setSelectedTransactionId(null);
      setPaymentDataState({ amount: 0, bankId: '', method: 'Cash' });
    } catch {
      toast.error('Failed to add payment');
    }
  }, [selectedTransactionId, transactions, paymentData]);

  const markPaymentAsCleared = useCallback(async (transactionId: string, paymentId: string) => {
    try {
      await TransactionFirebaseService.markPaymentCleared(transactionId, paymentId);
      setTransactions(prev => prev.map(t => {
        if (t.id !== transactionId) return t;
        const payments = (t.partialPayments || []).map(p => p.id === paymentId ? { ...p, isCleared: true } : p);
        return { ...t, partialPayments: payments };
      }).filter(isPending));
      toast.success('Payment marked as cleared');
    } catch {
      toast.error('Failed to mark payment as cleared');
    }
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await TransactionFirebaseService.deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
      toast.success('Transaction deleted');
    } catch {
      toast.error('Failed to delete transaction');
    }
  }, []);

  return {
    transactions, filteredTransactions, viewTransaction, paymentModal,
    selectedTransactionId, filterStatus, paymentData, banks, isLoading, summaryStats,
    setViewTransaction, setPaymentModal, setSelectedTransactionId, setFilterStatus, setPaymentData,
    addPartialPayment, markPaymentAsCleared, deleteTransaction,
    getTransactionTotals, formatCurrency, formatDateTime, getCategoryColor, getPaymentStatusColor,
  };
}