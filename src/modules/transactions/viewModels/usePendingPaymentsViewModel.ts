// // Transactions Module - Pending Payments ViewModel

// import { useState, useMemo, useCallback } from 'react';
// import { Transaction, PartialPayment, PendingPaymentData } from '../models/types';
// import { TransactionService } from '../models/transactionsService';

// export interface PendingPaymentsViewModel {
//   // State
//   transactions: Transaction[];
//   viewTransaction: Transaction | null;
//   paymentModal: boolean;
//   selectedTransactionId: string | null;
//   filterStatus: 'All' | 'Uncleared' | 'PartiallyPaid';
//   paymentData: PendingPaymentData;
  
//   // Filtered transactions
//   pendingTransactions: Transaction[];
//   filteredTransactions: Transaction[];
  
//   // Summary stats
//   summaryStats: {
//     totalPending: number;
//     unclearedCount: number;
//     totalTransactions: number;
//   };
  
//   // Actions
//   setViewTransaction: (transaction: Transaction | null) => void;
//   setPaymentModal: (open: boolean) => void;
//   setSelectedTransactionId: (id: string | null) => void;
//   setFilterStatus: (status: 'All' | 'Uncleared' | 'PartiallyPaid') => void;
//   setPaymentData: (data: Partial<PendingPaymentData>) => void;
  
//   // Actions
//   addPartialPayment: () => void;
//   markPaymentAsCleared: (transactionId: string, paymentId: string) => void;
//   deleteTransaction: (id: string) => void;
  
//   // Utils
//   getTransactionTotals: (transaction: Transaction) => { totalPaid: number; remainingAmount: number };
//   formatCurrency: (amount: number) => string;
//   formatDateTime: (date: string, time?: string) => string;
//   getCategoryColor: (category: string) => string;
//   getPaymentStatusColor: (transaction: Transaction) => string;
// }

// export const usePendingPaymentsViewModel = (
//   transactions: Transaction[],
//   setTransactions: (transactions: Transaction[]) => void,
//   banks: { id: string; name: string; balance: number }[]
// ): PendingPaymentsViewModel => {
//   const [viewTransaction, setViewTransaction] = useState<Transaction | null>(null);
//   const [paymentModal, setPaymentModal] = useState(false);
//   const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
//   const [filterStatus, setFilterStatus] = useState<'All' | 'Uncleared' | 'PartiallyPaid'>('All');

//   const [paymentData, setPaymentData] = useState<PendingPaymentData>({
//     amount: 0,
//     bankId: '',
//     method: 'Cash'
//   });

//   // Filter pending transactions
//   const pendingTransactions = useMemo(() => {
//     return TransactionService.getPendingTransactions(transactions);
//   }, [transactions]);

//   // Filter based on status
//   const filteredTransactions = useMemo(() => {
//     return TransactionService.filterPendingByStatus(pendingTransactions, filterStatus);
//   }, [pendingTransactions, filterStatus]);

//   // Summary stats
//   const summaryStats = useMemo(() => {
//     const totalPending = filteredTransactions.reduce((sum, t) => {
//       const { remainingAmount } = TransactionService.getTransactionTotals(t);
//       return sum + remainingAmount;
//     }, 0);

//     const unclearedCount = filteredTransactions.filter(t => 
//       t.partialPayments?.some(p => !p.isCleared)
//     ).length;

//     return {
//       totalPending,
//       unclearedCount,
//       totalTransactions: filteredTransactions.length
//     };
//   }, [filteredTransactions]);

//   // Add partial payment
//   const addPartialPaymentAction = useCallback(() => {
//     const transaction = transactions.find(t => t.id === selectedTransactionId);
//     if (!transaction) return;

//     const { remainingAmount } = TransactionService.getTransactionTotals(transaction);

//     if (paymentData.amount <= 0) {
//       throw new Error('Enter a valid amount');
//     }

//     if (paymentData.amount > remainingAmount) {
//       throw new Error('Amount exceeds remaining balance');
//     }

//     if (paymentData.method === 'Bank' && !paymentData.bankId) {
//       throw new Error('Select a bank');
//     }

//     if (paymentData.method === 'Cheque' && !paymentData.chequeNumber) {
//       throw new Error('Enter cheque number');
//     }

//     const newPayment: Omit<PartialPayment, 'id'> = {
//       amount: paymentData.amount,
//       date: new Date().toISOString().split('T')[0],
//       time: new Date().toTimeString().split(' ')[0],
//       method: paymentData.method,
//       bankId: paymentData.method === 'Bank' ? paymentData.bankId : undefined,
//       chequeNumber: paymentData.method === 'Cheque' ? paymentData.chequeNumber : undefined,
//       isCleared: paymentData.method === 'Bank'
//     };

//     setTransactions(TransactionService.addPartialPayment(transactions, selectedTransactionId!, newPayment));
    
//     // Reset payment modal
//     setPaymentModal(false);
//     setSelectedTransactionId(null);
//     setPaymentData({ amount: 0, bankId: '', method: 'Cash' });
//   }, [transactions, setTransactions, selectedTransactionId, paymentData]);

//   // Mark payment as cleared
//   const markPaymentAsClearedAction = useCallback((transactionId: string, paymentId: string) => {
//     setTransactions(TransactionService.markPaymentAsCleared(transactions, transactionId, paymentId));
//   }, [transactions, setTransactions]);

//   // Delete transaction
//   const deleteTransactionAction = useCallback((id: string) => {
//     setTransactions(TransactionService.deleteTransaction(transactions, id));
//   }, [transactions, setTransactions]);

//   // Open payment modal
//   const openPaymentModal = useCallback((transactionId: string) => {
//     setSelectedTransactionId(transactionId);
//     setPaymentModal(true);
//     setPaymentData({ amount: 0, bankId: '', method: 'Cash' });
//   }, []);

//   return {
//     // State
//     transactions,
//     viewTransaction,
//     paymentModal,
//     selectedTransactionId,
//     filterStatus,
//     paymentData,
    
//     // Filtered
//     pendingTransactions,
//     filteredTransactions,
    
//     // Stats
//     summaryStats,
    
//     // Actions
//     setViewTransaction,
//     setPaymentModal,
//     setSelectedTransactionId,
//     setFilterStatus,
//     setPaymentData: (data: Partial<PendingPaymentData>) => setPaymentData(prev => ({ ...prev, ...data })),
    
//     // Actions
//     addPartialPayment: addPartialPaymentAction,
//     markPaymentAsCleared: markPaymentAsClearedAction,
//     deleteTransaction: deleteTransactionAction,
    
//     // Utils
//     getTransactionTotals: TransactionService.getTransactionTotals,
//     formatCurrency: TransactionService.formatCurrency,
//     formatDateTime: TransactionService.formatDateTime,
//     getCategoryColor: TransactionService.getCategoryColor,
//     getPaymentStatusColor: TransactionService.getPaymentStatusColor
//   };
// };
