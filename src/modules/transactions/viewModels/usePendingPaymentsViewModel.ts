// Transactions Module - Pending Payments ViewModel
// Fixes:
// 1. addPartialPayment now properly saves to Firestore AND updates bank balance
// 2. Filter logic for PartiallyPaid, Uncleared, PendingReceivable, and Rejected
// 3. pending_approval transactions are blocked from payment actions (not yet approved)
// 4. Rejected transactions are shown in 'Rejected' tab for record-keeping only

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

// Added 'PendingApproval' and 'Rejected' to the filter union
export type PendingFilterStatus =
  | 'All'
  | 'Uncleared'
  | 'PartiallyPaid'
  | 'PendingReceivable'
  | 'PendingApproval'
  | 'Rejected';

export interface UsePendingPaymentsViewModelReturn {
  transactions:          Transaction[];
  filteredTransactions:  Transaction[];
  viewTransaction:       Transaction | null;
  paymentModal:          boolean;
  selectedTransactionId: string | null;
  filterStatus:          PendingFilterStatus;
  paymentData:           PendingPaymentData;
  banks:                 BankInfo[];
  isLoading:             boolean;
  isSaving:              boolean;
  summaryStats: {
    totalPending:        number;
    totalReceivable:     number;
    unclearedCount:      number;
    totalTransactions:   number;
    pendingApprovalCount:number;
    rejectedCount:       number;
  };
  setViewTransaction:       (t: Transaction | null) => void;
  setPaymentModal:          (v: boolean) => void;
  setSelectedTransactionId: (id: string | null) => void;
  setFilterStatus:          (s: PendingFilterStatus) => void;
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
  const [allTransactions,       setAllTransactions]       = useState<Transaction[]>([]);
  const [banks,                 setBanks]                 = useState<BankInfo[]>([]);
  const [isLoading,             setIsLoading]             = useState(true);
  const [isSaving,              setIsSaving]              = useState(false);
  const [viewTransaction,       setViewTransaction]       = useState<Transaction | null>(null);
  const [paymentModal,          setPaymentModal]          = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [filterStatus,          setFilterStatus]          = useState<PendingFilterStatus>('All');
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
        // Store ALL transactions; filtering happens in useMemo below.
        // We need pending (payment), pending_approval, and rejected all accessible.
        setAllTransactions(txList);
        setBanks(bankList as BankInfo[]);
      } catch {
        toast.error('Failed to load pending payments');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Derive the "transactions" view: show payment-pending + pending_approval + rejected
  const transactions = useMemo(() => {
    return allTransactions.filter(t =>
      isPending(t) ||
      t.approvalStatus === 'pending_approval' ||
      t.approvalStatus === 'rejected'
    );
  }, [allTransactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (filterStatus === 'All') {
        // 'All' shows only payment-pending (approved/not_required with remaining balance)
        // and NOT the approval/rejected queue — those have their own dedicated tabs
        return isPending(t);
      }

      if (filterStatus === 'PendingApproval') {
        return t.approvalStatus === 'pending_approval';
      }

      if (filterStatus === 'Rejected') {
        return t.approvalStatus === 'rejected';
      }

      // The tabs below only make sense for approved transactions with payment activity
      const { remainingAmount } = getTransactionTotals(t);
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
    const paymentPending = allTransactions.filter(isPending);
    const receivable     = paymentPending.filter(t => t.mainCategory === 'Cash Inflow');
    const payable        = paymentPending.filter(t => t.mainCategory !== 'Cash Inflow');

    const unclearedCount = paymentPending.filter(t => {
      const hasUnclearedPayments = (t.partialPayments || []).some(p => !p.isCleared && p.method !== 'Bank');
      const isUnclearedChequeTx  = t.mode === 'Cheque' && !t.isFullyCleared;
      return hasUnclearedPayments || isUnclearedChequeTx;
    }).length;

    return {
      totalPending:         payable.reduce((s, t) => s + getTransactionTotals(t).remainingAmount, 0),
      totalReceivable:      receivable.reduce((s, t) => s + getTransactionTotals(t).remainingAmount, 0),
      unclearedCount,
      totalTransactions:    filteredTransactions.length,
      pendingApprovalCount: allTransactions.filter(t => t.approvalStatus === 'pending_approval').length,
      rejectedCount:        allTransactions.filter(t => t.approvalStatus === 'rejected').length,
    };
  }, [filteredTransactions, allTransactions]);

  const setPaymentData = useCallback((d: Partial<PendingPaymentData>) => {
    setPaymentDataState(prev => ({ ...prev, ...d }));
  }, []);

  const addPartialPayment = useCallback(async () => {
    if (!selectedTransactionId) return;
    const tx = allTransactions.find(t => t.id === selectedTransactionId);
    if (!tx) return;

    // Guard: do not allow payment actions on transactions awaiting/rejected approval
    if (tx.approvalStatus === 'pending_approval') {
      toast.error('Cannot add payment — this transaction is still awaiting admin approval');
      return;
    }
    if (tx.approvalStatus === 'rejected') {
      toast.error('Cannot add payment — this transaction was rejected');
      return;
    }

    const { remainingAmount } = getTransactionTotals(tx);

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
        isCleared:    paymentData.method === 'Bank',
      };

      await TransactionFirebaseService.addPartialPayment(selectedTransactionId, newPayment);

      if (paymentData.method === 'Bank' && paymentData.bankId && bank) {
        const isReceivable = tx.mainCategory === 'Cash Inflow';
        const newBalance = isReceivable
          ? bank.balance + paymentData.amount
          : bank.balance - paymentData.amount;
        await BankFirebaseService.updateBankBalance(paymentData.bankId, newBalance);
        setBanks(prev => prev.map(b =>
          b.id === paymentData.bankId ? { ...b, balance: newBalance } : b
        ));
      }

      setAllTransactions(prev => prev.map(t => {
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
      }));

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
  }, [selectedTransactionId, allTransactions, paymentData, banks]);

  const markPaymentAsCleared = useCallback(async (transactionId: string, paymentId: string) => {
    try {
      await TransactionFirebaseService.markPaymentCleared(transactionId, paymentId);
      setAllTransactions(prev => prev.map(t => {
        if (t.id !== transactionId) return t;
        const payments = (t.partialPayments || []).map(p =>
          p.id === paymentId ? { ...p, isCleared: true } : p
        );
        const remaining = Math.max(0, t.amount - payments.reduce((s, p) => s + p.amount, 0));
        return { ...t, partialPayments: payments, isFullyCleared: remaining <= 0 && payments.every(p => p.isCleared) };
      }));
      toast.success('Payment marked as cleared');
    } catch {
      toast.error('Failed to mark payment as cleared');
    }
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await TransactionFirebaseService.deleteTransaction(id);
      setAllTransactions(prev => prev.filter(t => t.id !== id));
      toast.success('Transaction deleted');
    } catch {
      toast.error('Failed to delete transaction');
    }
  }, []);

  const markTransactionCleared = useCallback(async (transactionId: string) => {
    try {
      await TransactionFirebaseService.markTransactionCleared(transactionId);
      setAllTransactions(prev => prev.map(t =>
        t.id !== transactionId ? t : { ...t, isFullyCleared: true, paymentStatus: 'Full' }
      ));
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