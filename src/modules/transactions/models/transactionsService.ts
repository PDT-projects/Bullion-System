// Transactions Module - Business Logic Service (no Firestore)

import { Transaction, TransactionFilters, TransactionStats, LOAN_SUB_CATEGORIES } from './types';

export const getTransactionTotals = (t: Transaction) => {
  const partialTotal = (t.partialPayments || []).reduce((s, p) => s + p.amount, 0);
  const totalPaid = partialTotal > 0 ? partialTotal : (t.amountPaid ?? t.amount ?? 0);
  const remaining = Math.max(0, (t.amount ?? 0) - totalPaid);
  return { totalPaid, remainingAmount: remaining };
};

export const isPending = (t: Transaction): boolean => {
  if (t.isFullyCleared)           return false;
  if (t.paymentStatus === 'Full') return false;
  const { remainingAmount } = getTransactionTotals(t);
  const hasUncleared = (t.partialPayments || []).some(p => !p.isCleared && p.method !== 'Bank');
  return remainingAmount > 0 || hasUncleared;
};

// FIX: When filtering by 'Loan', match both mainCategory === 'Loan'
// AND inflow/outflow transactions whose subCategory is a loan sub-category.
export const isLoanTransaction = (t: Transaction): boolean => {
  if (t.mainCategory === 'Loan') return true;
  if (LOAN_SUB_CATEGORIES.has(t.subCategory)) return true;
  return false;
};

export const filterTransactions = (transactions: Transaction[], filters: TransactionFilters): Transaction[] =>
  transactions.filter(t => {
    if (filters.searchTerm) {
      const s = filters.searchTerm.toLowerCase();
      if (!t.company.toLowerCase().includes(s) &&
          !t.mainCategory.toLowerCase().includes(s) &&
          !t.subCategory.toLowerCase().includes(s) &&
          !t.note.toLowerCase().includes(s) &&
          !(t.transactionId || '').toLowerCase().includes(s) &&
          !(t.paidBy || '').toLowerCase().includes(s) &&
          !(t.paidTo || '').toLowerCase().includes(s)) return false;
    }
    // FIX: Loan filter — match Loan main category OR loan sub-categories in inflow/outflow
    if (filters.mainCategory) {
      if (filters.mainCategory === 'Loan') {
        if (!isLoanTransaction(t)) return false;
      } else {
        if (t.mainCategory !== filters.mainCategory) return false;
      }
    }
    if (filters.dateFrom && t.date < filters.dateFrom) return false;
    if (filters.dateTo   && t.date > filters.dateTo)   return false;
    if (filters.company  && t.company !== filters.company) return false;
    if (filters.paymentStatus) {
      if (filters.paymentStatus === 'Pending' && !isPending(t)) return false;
      if (filters.paymentStatus === 'Full' && isPending(t)) return false;
    }
    return true;
  });

export const calculateStats = (transactions: Transaction[]): TransactionStats => {
  const totalInflow  = transactions.filter(t => t.mainCategory === 'Cash Inflow').reduce((s, t) => s + t.amount, 0);
  const totalOutflow = transactions.filter(t => t.mainCategory === 'Cash Outflow').reduce((s, t) => s + t.amount, 0);
  const pending      = transactions.filter(isPending);
  return {
    totalInflow, totalOutflow,
    netBalance:       totalInflow - totalOutflow,
    transactionCount: transactions.length,
    pendingCount:     pending.length,
    totalPending:     pending.reduce((s, t) => s + getTransactionTotals(t).remainingAmount, 0),
  };
};

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(amount);

export const formatDate = (d: string): string =>
  d ? new Date(d).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

export const formatDateTime = (date: string, time?: string): string => {
  const dateStr = formatDate(date);
  return time ? `${dateStr} ${time}` : dateStr;
};

export const getCategoryColor = (category: string): string => {
  if (category === 'Cash Inflow')  return 'bg-green-100 text-green-800';
  if (category === 'Cash Outflow') return 'bg-red-100 text-red-800';
  if (category === 'Loan')         return 'bg-blue-100 text-blue-800';
  return 'bg-gray-100 text-gray-800';
};

export const getPaymentStatusColor = (t: Transaction): string => {
  const { remainingAmount } = getTransactionTotals(t);
  const hasUncleared = (t.partialPayments || []).some(p => !p.isCleared);
  if (remainingAmount === 0 && !hasUncleared) return 'bg-green-100 text-green-800 border-green-200';
  if (hasUncleared) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  return 'bg-orange-100 text-orange-800 border-orange-200';
};

export const exportToCSV = (transactions: Transaction[]): string => {
  const headers = ['Transaction ID', 'Date', 'Time', 'Company', 'Main Category', 'Sub Category', 'Amount', 'Paid', 'Remaining', 'Mode', 'Paid By', 'Paid To', 'Status', 'Note'];
  const rows = transactions.map(t => {
    const { totalPaid, remainingAmount } = getTransactionTotals(t);
    return [
      t.transactionId, t.date, t.time, t.company, t.mainCategory, t.subCategory,
      t.amount.toString(), totalPaid.toString(), remainingAmount.toString(),
      t.mode, t.paidBy || '', t.paidTo || '',
      isPending(t) ? 'Pending' : 'Cleared', t.note,
    ];
  });
  return [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
};

export const downloadCSV = (csv: string, filename: string) => {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};