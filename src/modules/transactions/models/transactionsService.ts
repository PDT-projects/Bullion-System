// Transactions Module - Business Logic Service (no Firestore)

import { Transaction, TransactionFilters, TransactionStats, LOAN_SUB_CATEGORIES, BSMainCategory } from './types';

export const getTransactionTotals = (t: Transaction) => {
  const partialTotal = (t.partialPayments || []).reduce((s, p) => s + p.amount, 0);

  // Priority order for totalPaid:
  // 1. Sum of partialPayments (most accurate, set by addPartialPayment)
  // 2. t.remainingAmount stored in Firestore — if present, back-calculate paid amount
  // 3. t.amountPaid — explicitly stored paid amount
  // 4. If paymentStatus === 'Full', the whole amount is paid
  // 5. Default to 0 — NEVER fall back to t.amount (that would mean "fully paid")
  let totalPaid: number;
  if (partialTotal > 0) {
    totalPaid = partialTotal;
  } else if (t.remainingAmount != null) {
    totalPaid = Math.max(0, (t.amount ?? 0) - t.remainingAmount);
  } else if (t.amountPaid != null) {
    totalPaid = t.amountPaid;
  } else if (t.paymentStatus === 'Full') {
    totalPaid = t.amount ?? 0;
  } else {
    totalPaid = 0;
  }

  const remaining = Math.max(0, (t.amount ?? 0) - totalPaid);
  return { totalPaid, remainingAmount: remaining };
};

export const isPending = (t: Transaction): boolean => {
  // Transactions awaiting or rejected from approval are NEVER payment-pending.
  if (t.approvalStatus === 'pending_approval') return false;
  if (t.approvalStatus === 'rejected')         return false;

  // Fast-exit: Firestore already flagged it as fully cleared/paid.
  if (t.isFullyCleared)           return false;
  if (t.paymentStatus === 'Full') return false;

  // ── Source-of-truth: remaining balance ───────────────────────────────────
  // remainingAmount is persisted by addPartialPayment so it is always up to date.
  // If nothing is left to pay, the transaction is NOT pending — regardless of
  // isCleared flags on individual payments.
  //
  // WHY THIS MATTERS: Cash payments are saved with isCleared: false because they
  // haven't been manually "bank-confirmed", but the money is already paid/received.
  // The old logic checked hasUnclearedPartial BEFORE remainingAmount, which trapped
  // every Cash-paid transaction as Pending forever even at Rs 0 remaining.
  const { remainingAmount } = getTransactionTotals(t);
  if (remainingAmount <= 0) return false;

  // Still has an outstanding balance — it IS pending.
  return true;
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
    if (filters.approvalStatus) {
      if (t.approvalStatus !== filters.approvalStatus) return false;
    }
    return true;
  });

/**
 * Calculate stats for APPROVED / not_required transactions only.
 * pending_approval and rejected transactions have zero liquidity impact
 * and must not inflate inflow/outflow/balance figures.
 */
export const calculateStats = (transactions: Transaction[]): TransactionStats => {
  const liquid = transactions.filter(
    t => t.approvalStatus === 'approved' || t.approvalStatus === 'not_required' || !t.approvalStatus
  );

  const totalInflow  = liquid.filter(t => t.mainCategory === 'Cash Inflow').reduce((s, t) => s + t.amount, 0);
  const totalOutflow = liquid.filter(t => t.mainCategory === 'Cash Outflow').reduce((s, t) => s + t.amount, 0);
  const pending      = liquid.filter(isPending);
  return {
    totalInflow, totalOutflow,
    netBalance:            totalInflow - totalOutflow,
    transactionCount:      transactions.length,
    pendingCount:          pending.length,
    totalPending:          pending.reduce((s, t) => s + getTransactionTotals(t).remainingAmount, 0),
    pendingApprovalCount:  transactions.filter(t => t.approvalStatus === 'pending_approval').length,
  };
};

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', minimumFractionDigits: 0 }).format(amount);

export const formatDate = (d: string): string =>
  d ? new Date(d).toLocaleDateString('en-AE', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

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
  const headers = ['Transaction ID', 'Date', 'Time', 'Company', 'Main Category', 'Sub Category', 'Amount', 'Paid', 'Remaining', 'Mode', 'Paid By', 'Paid To', 'Status', 'Approval', 'Note'];
  const rows = transactions.map(t => {
    const { totalPaid, remainingAmount } = getTransactionTotals(t);
    return [
      t.transactionId, t.date, t.time, t.company, t.mainCategory, t.subCategory,
      t.amount.toString(), totalPaid.toString(), remainingAmount.toString(),
      t.mode, t.paidBy || '', t.paidTo || '',
      isPending(t) ? 'Pending' : 'Cleared',
      t.approvalStatus || 'not_required',
      t.note,
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

// ── Balance Sheet Bucket Resolver ─────────────────────────────────────────────
export const resolveBSBucket = (t: Transaction): { bsMain: string; bsSub: string } | null => {
  if (t.bsMainCategory && t.bsSubCategory) {
    return { bsMain: t.bsMainCategory!, bsSub: t.bsSubCategory! };
  }

  const sub = t.subCategory || '';

  if (t.mainCategory === 'Cash Inflow' && !LOAN_SUB_CATEGORIES.has(sub)) {
    return { bsMain: 'Assets', bsSub: 'Cash & Cash Equivalents' };
  }
  if (sub === 'Purchase') {
    return { bsMain: 'Assets', bsSub: 'Inventory' };
  }
  if (LOAN_SUB_CATEGORIES.has(sub) && t.mainCategory === 'Cash Inflow') {
    return { bsMain: 'Assets', bsSub: 'Accounts Receivable' };
  }
  if (t.mainCategory === 'Cash Outflow') {
    const payableSubs = [
      'Payment to company', 'Payment to person', 'Purchase',
      'Office Rent', 'Electricity Bill', 'Gas Bill'
    ];
    if (payableSubs.includes(sub)) {
      return { bsMain: 'Liabilities & Equity', bsSub: 'Accounts Payable' };
    }
  }
  if (LOAN_SUB_CATEGORIES.has(sub) && t.mainCategory === 'Cash Outflow') {
    return { bsMain: 'Liabilities & Equity', bsSub: 'Short-term Loans' };
  }
  const opExSubs = ['Employee salary', 'Office Rent', 'Utilities'];
  if (t.mainCategory === 'Cash Outflow' && opExSubs.some(s => sub.includes(s))) {
    return { bsMain: 'Liabilities & Equity', bsSub: 'Accrued Expenses' };
  }

  return null;
};