// Transactions Module - Service
// Business logic for transactions

import { Transaction, PartialPayment } from './types';

// Generate unique transaction ID
export const generateTransactionId = (): string => {
  return `TXN-${Date.now()}`;
};

// Generate unique payment ID
export const generatePaymentId = (): string => {
  return `PAY-${Date.now()}`;
};

// Calculate transaction totals
export const getTransactionTotals = (transaction: Transaction) => {
  const totalPaid = transaction.partialPayments?.reduce((sum, p) => sum + p.amount, 0) ?? 0;
  return {
    totalPaid,
    remainingAmount: transaction.amount - totalPaid
  };
};

// Filter pending transactions
export const getPendingTransactions = (transactions: Transaction[]) => {
  return transactions.filter(t => {
    const { remainingAmount } = getTransactionTotals(t);
    const hasUncleared = t.partialPayments?.some(
      p => !p.isCleared && p.method !== 'Bank'
    );
    return remainingAmount > 0 || hasUncleared;
  });
};

// Filter transactions by status
export const filterPendingByStatus = (
  transactions: Transaction[],
  status: 'All' | 'Uncleared' | 'PartiallyPaid'
) => {
  return transactions.filter(t => {
    const { remainingAmount } = getTransactionTotals(t);
    const hasUncleared = t.partialPayments?.some(
      p => !p.isCleared && p.method !== 'Bank'
    );

    if (status === 'All') return true;
    if (status === 'Uncleared') return hasUncleared;
    if (status === 'PartiallyPaid') return remainingAmount > 0;
    return true;
  });
};

// Calculate stats
export const calculateTransactionStats = (transactions: Transaction[]) => {
  const totalInflow = transactions
    .filter(t => t.mainCategory === 'Cash Inflow')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalOutflow = transactions
    .filter(t => t.mainCategory === 'Cash Outflow')
    .reduce((sum, t) => sum + t.amount, 0);
    
  return {
    totalInflow,
    totalOutflow,
    netBalance: totalInflow - totalOutflow,
    transactionCount: transactions.length
  };
};

// Search transactions
export const searchTransactions = (
  transactions: Transaction[],
  searchTerm: string
): Transaction[] => {
  const term = searchTerm.toLowerCase();
  return transactions.filter(trans =>
    trans.company.toLowerCase().includes(term) ||
    trans.mainCategory.toLowerCase().includes(term) ||
    trans.subCategory.toLowerCase().includes(term) ||
    trans.note.toLowerCase().includes(term) ||
    trans.transactionId?.toLowerCase().includes(term)
  );
};

// Add new transaction
export const createTransaction = (
  transactions: Transaction[],
  newTransaction: Omit<Transaction, 'id' | 'transactionId'>
): Transaction[] => {
  const transaction: Transaction = {
    ...newTransaction,
    id: Date.now().toString(),
    transactionId: generateTransactionId()
  };
  return [transaction, ...transactions];
};

// Update transaction
export const updateTransaction = (
  transactions: Transaction[],
  id: string,
  updates: Partial<Transaction>
): Transaction[] => {
  return transactions.map(t =>
    t.id === id ? { ...t, ...updates } : t
  );
};

// Delete transaction
export const deleteTransaction = (
  transactions: Transaction[],
  id: string
): Transaction[] => {
  return transactions.filter(t => t.id !== id);
};

// Add partial payment
export const addPartialPayment = (
  transactions: Transaction[],
  transactionId: string,
  payment: Omit<PartialPayment, 'id'>
): Transaction[] => {
  const newPayment: PartialPayment = {
    ...payment,
    id: generatePaymentId()
  };
  
  return transactions.map(t => {
    if (t.id !== transactionId) return t;
    
    const updatedPayments = [...(t.partialPayments ?? []), newPayment];
    const totalPaid = updatedPayments.reduce((s, p) => s + p.amount, 0);
    const remaining = t.amount - totalPaid;
    
    return {
      ...t,
      partialPayments: updatedPayments,
      totalPaid,
      remainingAmount: remaining,
      isFullyCleared: remaining === 0 && updatedPayments.every(p => p.isCleared || p.method === 'Bank')
    };
  });
};

// Mark payment as cleared
export const markPaymentAsCleared = (
  transactions: Transaction[],
  transactionId: string,
  paymentId: string
): Transaction[] => {
  return transactions.map(t => {
    if (t.id !== transactionId) return t;
    
    const updatedPayments =
      t.partialPayments?.map(p =>
        p.id === paymentId ? { ...p, isCleared: true } : p
      ) ?? [];
    
    const totalPaid = updatedPayments.reduce((s, p) => s + p.amount, 0);
    const remaining = t.amount - totalPaid;
    
    return {
      ...t,
      partialPayments: updatedPayments,
      totalPaid,
      remainingAmount: remaining,
      isFullyCleared: remaining === 0 && updatedPayments.every(p => p.isCleared)
    };
  });
};

// Format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0
  }).format(amount);
};

// Format date
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Format date time
export const formatDateTime = (date: string, time?: string): string => {
  const d = new Date(date);
  const dateStr = d.toLocaleDateString('en-PK');
  return time ? `${dateStr} ${time}` : dateStr;
};

// Get category color
export const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'Cash Inflow':
      return 'bg-green-100 text-green-800';
    case 'Cash Outflow':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-blue-100 text-blue-800';
  }
};

// Get payment status color
export const getPaymentStatusColor = (transaction: Transaction): string => {
  const { remainingAmount } = getTransactionTotals(transaction);
  const hasUnclearedPayments = transaction.partialPayments?.some(p => !p.isCleared);
  
  if (remainingAmount === 0 && !hasUnclearedPayments) {
    return 'bg-green-100 text-green-800 border-green-200';
  }
  if (hasUnclearedPayments) {
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  }
  return 'bg-orange-100 text-orange-800 border-orange-200';
};

// Transaction Service object for export
export const TransactionService = {
  generateTransactionId,
  generatePaymentId,
  getTransactionTotals,
  getPendingTransactions,
  filterPendingByStatus,
  calculateTransactionStats,
  searchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  addPartialPayment,
  markPaymentAsCleared,
  formatCurrency,
  formatDate,
  formatDateTime,
  getCategoryColor,
  getPaymentStatusColor
};
