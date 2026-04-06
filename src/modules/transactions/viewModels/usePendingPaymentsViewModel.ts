// Transactions Module - Pending Payments ViewModel
// Fixes:
// 1. addPartialPayment now properly saves to Firestore AND updates bank balance
// 2. Filter logic for PartiallyPaid and Uncleared now works correctly
// 3. Pending Receivable category supported (Cash Inflow with remainingAmount > 0)

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
  transactions:          Transaction[];
  filteredTransactions:  Transaction[];
  viewTransaction:       Transaction | null;
  paymentModal:          boolean;
  selectedTransactionId: string | null;
  filterStatus:          'All' | 'Uncleared' | 'PartiallyPaid' | 'PendingReceivable';
  paymentData:           PendingPaymentData;
  banks:                 BankInfo[];
  isLoading:             boolean;
  isSaving:              boolean;
  summaryStats: {
    totalPending: number;
    totalReceivable: number;
    unclearedCount: number;
    totalTransactions: number;
  };
  setViewTransaction:       (t: Transaction | null) => void;
  setPaymentModal:          (v: boolean) => void;
  setSelectedTransactionId: (id: string | null) => void;
  setFilterStatus:          (s: 'All' | 'Uncleared' | 'PartiallyPaid' | 'PendingReceivable') => void;
  setPaymentData:           (d: Partial<PendingPaymentData>) => void;
  addPartialPayment:        () => Promise<void>;
  markPaymentAsCleared:     (transactionId: string, paymentId: string) => Promise<void>;
  markTransactionCleared:   (transactionId: string) => Promise<void>;
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
  const [isSaving,              setIsSaving]              = useState(false);
  const [viewTransaction,       setViewTransaction]       = useState<Transaction | null>(null);
  const [paymentModal,          setPaymentModal]          = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [filterStatus,          setFilterStatus]          = useState<'All' | 'Uncleared' | 'PartiallyPaid' | 'PendingReceivable'>('All');
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
        // Show all pending: outflow with remaining, inflow partially received, uncleared cheques
        setTransactions(txList.filter(isPending));
        setBanks(bankList as BankInfo[]);
      } catch {
        toast.error('Failed to load pending payments');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // FIX: Filter logic — each tab correctly matches its condition
  // Cheques: a transaction with mode=Cheque and isFullyCleared=false is "Uncleared"
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (filterStatus === 'All') return true;

      const { remainingAmount } = getTransactionTotals(t);
      // Uncleared: partial payments not yet cleared, OR main transaction is a cheque not yet cleared
      const hasUnclearedPayments = (t.partialPayments || []).some(
        p => !p.isCleared && p.method !== 'Bank'
      );
      const isUnclearedChequeTx = t.mode === 'Cheque' && !t.isFullyCleared;
      const hasUncleared = hasUnclearedPayments || isUnclearedChequeTx;
      const isReceivable = t.mainCategory === 'Cash Inflow' && remainingAmount > 0;

      if (filterStatus === 'Uncleared')         return hasUncleared;
      if (filterStatus === 'PartiallyPaid')     return remainingAmount > 0 && !isReceivable;
      if (filterStatus === 'PendingReceivable') return isReceivable;
      return true;
    });
  }, [transactions, filterStatus]);

  const summaryStats = useMemo(() => {
    const receivable = transactions.filter(t => t.mainCategory === 'Cash Inflow');
    const payable    = transactions.filter(t => t.mainCategory !== 'Cash Inflow');
    // Count uncleared: partial payments uncleared OR main tx is cheque not cleared
    const unclearedCount = transactions.filter(t => {
      const hasUnclearedPayments = (t.partialPayments || []).some(p => !p.isCleared && p.method !== 'Bank');
      const isUnclearedChequeTx  = t.mode === 'Cheque' && !t.isFullyCleared;
      return hasUnclearedPayments || isUnclearedChequeTx;
    }).length;
    return {
      totalPending:      payable.reduce((s, t) => s + getTransactionTotals(t).remainingAmount, 0),
      totalReceivable:   receivable.reduce((s, t) => s + getTransactionTotals(t).remainingAmount, 0),
      unclearedCount,
      totalTransactions: filteredTransactions.length,
    };
  }, [filteredTransactions, transactions]);

  const setPaymentData = useCallback((d: Partial<PendingPaymentData>) => {
    setPaymentDataState(prev => ({ ...prev, ...d }));
  }, []);

  // FIX: addPartialPayment now:
  // 1. Saves to Firestore via addPartialPayment
  // 2. Updates bank balance in Firestore when method = Bank
  // 3. Updates local state correctly
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

    setIsSaving(true);
    try {
      const bank = paymentData.method === 'Bank'
        ? banks.find(b => b.id === paymentData.bankId)
        : null;

      const newPayment: PartialPayment = {
        id:           `PAY-${Date.now()}`,
        amount:       paymentData.amount,
        date:         new Date().toISOString().split('T')[0],
        time:         new Date().toTimeString().split(' ')[0],
        method:       paymentData.method,
        bankId:       paymentData.method === 'Bank'   ? paymentData.bankId       : undefined,
        bankName:     paymentData.method === 'Bank'   ? bank?.name               : undefined,
        chequeNumber: paymentData.method === 'Cheque' ? paymentData.chequeNumber : undefined,
        chequeDate:   paymentData.method === 'Cheque' ? paymentData.chequeDate   : undefined,
        chequeBank:   paymentData.method === 'Cheque' ? paymentData.chequeBank   : undefined,
        // Bank payments are auto-cleared; cheque/cash are pending until manually cleared
        isCleared:    paymentData.method === 'Bank',
      };

      // 1. Save partial payment to Firestore (updates the transaction doc)
      await TransactionFirebaseService.addPartialPayment(selectedTransactionId, newPayment);

      // 2. If paid via bank, update bank balance in Firestore
      if (paymentData.method === 'Bank' && paymentData.bankId && bank) {
        const isReceivable = tx.mainCategory === 'Cash Inflow';
        // Receivable inflow: money comes IN to bank; payable outflow: money goes OUT
        const newBalance = isReceivable
          ? bank.balance + paymentData.amount
          : bank.balance - paymentData.amount;
        await BankFirebaseService.updateBankBalance(paymentData.bankId, newBalance);
        // Update local bank state
        setBanks(prev => prev.map(b =>
          b.id === paymentData.bankId ? { ...b, balance: newBalance } : b
        ));
      }

      // 3. Update local transaction state
      setTransactions(prev => prev.map(t => {
        if (t.id !== selectedTransactionId) return t;
        const payments  = [...(t.partialPayments || []), newPayment];
        const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
        const remaining = Math.max(0, t.amount - totalPaid);
        return {
          ...t,
          partialPayments: payments,
          totalPaid,
          remainingAmount: remaining,
          isFullyCleared:  remaining <= 0 && payments.every(p => p.isCleared),
          paymentStatus:   remaining <= 0 ? 'Full' : 'Partial',
        };
      }).filter(isPending)); // Remove fully cleared ones from pending list

      toast.success(`Payment of ${formatCurrency(paymentData.amount)} recorded`);
      setPaymentModal(false);
      setSelectedTransactionId(null);
      setPaymentDataState({ amount: 0, bankId: '', method: 'Cash' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to save payment — please try again');
    } finally {
      setIsSaving(false);
    }
  }, [selectedTransactionId, transactions, paymentData, banks]);

  const markPaymentAsCleared = useCallback(async (transactionId: string, paymentId: string) => {
    try {
      await TransactionFirebaseService.markPaymentCleared(transactionId, paymentId);
      setTransactions(prev => prev.map(t => {
        if (t.id !== transactionId) return t;
        const payments = (t.partialPayments || []).map(p =>
          p.id === paymentId ? { ...p, isCleared: true } : p
        );
        const remaining = Math.max(0, t.amount - payments.reduce((s, p) => s + p.amount, 0));
        return { ...t, partialPayments: payments, isFullyCleared: remaining <= 0 && payments.every(p => p.isCleared) };
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

  const markTransactionCleared = useCallback(async (transactionId: string) => {
    try {
      await TransactionFirebaseService.markTransactionCleared(transactionId);
      setTransactions(prev => prev.map(t =>
        t.id !== transactionId ? t : { ...t, isFullyCleared: true, paymentStatus: 'Full' }
      ).filter(isPending));
      toast.success('Cheque marked as cleared');
    } catch {
      toast.error('Failed to clear cheque');
    }
  }, []);

  return {
    transactions, filteredTransactions, viewTransaction, paymentModal,
    selectedTransactionId, filterStatus, paymentData, banks, isLoading, isSaving, summaryStats,
    setViewTransaction, setPaymentModal, setSelectedTransactionId, setFilterStatus, setPaymentData,
    addPartialPayment, markPaymentAsCleared, markTransactionCleared, deleteTransaction,
    getTransactionTotals, formatCurrency, formatDateTime, getCategoryColor, getPaymentStatusColor,
  };
}