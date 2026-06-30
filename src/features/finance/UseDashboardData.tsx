import { useState, useEffect, useCallback } from 'react';
import { TransactionFirebaseService } from '../../modules/transactions/models/transactionFirebaseService';
import { calculateStats } from '../../modules/transactions/models/transactionsService';
import { Transaction } from '../../modules/transactions/models/types';
import type { TransactionStats } from '../../modules/transactions/models/types';
import { db } from '../../api/firebase/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

// ── Legacy data passthrough ────────────────────────────────────────────────
// Magnitude-based PKR detection (amount > 50000) was unreliable and caused
// real corruption: it could mis-tag a genuinely large AED transaction, or
// (combined with other parts of the app double-converting) produce wildly
// wrong totals. All transactions are written in AED already — pass through
// untouched. If truly old PKR-era docs ever need conversion, do it via a
// one-time migration script, not on every read.
function normTransaction(t: any): any { return t; }
function normInvoice(inv: any): any { return inv; }
function normProduct(p: any): any { return p; }

interface DashboardData {
  transactions: Transaction[];
  banks: any[];
  loans: any[];
  invoices: any[];
  commissions: any[];
  products: any[];
  stats: TransactionStats & {
    cashInflow: number;
    cashOutflow: number;
    cashBalance: number;
    totalBankBalance: number;
    overallBalance: number;
    pendingTransactions: number;
    pendingAmount: number;
    totalLoansReceivable: number;
    totalLoansPayable: number;
    pendingBills: number;
    pendingBillsAmount: number;
  };
  monthlyChartData: Array<{
    month: string;
    inflow: number;
    outflow: number;
    net: number;
  }>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/** Returns true if the transaction's date falls within the current calendar month */
function isCurrentMonth(dateStr: string): boolean {
  const now = new Date();
  const txDate = new Date(dateStr);
  return (
    txDate.getFullYear() === now.getFullYear() &&
    txDate.getMonth() === now.getMonth()
  );
}

export function useDashboardData(): DashboardData {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Track how many collections have received their first snapshot.
    // Only clear loading once ALL 6 have arrived.
    let loaded = 0;
    const TOTAL = 6;
    const markLoaded = () => { loaded += 1; if (loaded >= TOTAL) setLoading(false); };

    const unsubTransactions = onSnapshot(
      collection(db, 'transactions'),
      (snap) => {
        const data = snap.docs.map(doc => normTransaction({ id: doc.id, ...doc.data() })) as Transaction[];
        setTransactions(data);
        markLoaded();
      },
      (err) => { setError(`Transactions: ${err.message}`); markLoaded(); }
    );

    const unsubs = [
      onSnapshot(collection(db, 'banks'),
        (snap) => { setBanks(snap.docs.map(d => ({ id: d.id, ...d.data() }))); markLoaded(); },
        () => markLoaded()),
      onSnapshot(collection(db, 'loans'),
        (snap) => { setLoans(snap.docs.map(d => ({ id: d.id, ...d.data() }))); markLoaded(); },
        () => markLoaded()),
      onSnapshot(collection(db, 'invoices'),
        (snap) => { setInvoices(snap.docs.map(d => normInvoice({ id: d.id, ...d.data() }))); markLoaded(); },
        () => markLoaded()),
      onSnapshot(collection(db, 'commissions'),
        (snap) => { setCommissions(snap.docs.map(d => ({ id: d.id, ...d.data() }))); markLoaded(); },
        () => markLoaded()),
      onSnapshot(collection(db, 'products'),
        (snap) => { setProducts(snap.docs.map(d => normProduct({ id: d.id, ...d.data() }))); markLoaded(); },
        () => markLoaded()),
    ];

    return () => {
      unsubTransactions();
      unsubs.forEach(unsub => unsub());
    };
  }, []);

  // ── Current-month transactions only (for the stat cards) ─────────────────
  const currentMonthTransactions = transactions.filter(t => isCurrentMonth(t.date));

  // Stats cards show current month figures only
  const rawStats = calculateStats(currentMonthTransactions);

  const totalBankBalance = banks.reduce((sum, b: any) => sum + (b.balance || 0), 0);

  const stats = {
    ...rawStats,
    cashInflow: rawStats.totalInflow,
    cashOutflow: rawStats.totalOutflow,
    cashBalance: rawStats.netBalance,
    totalBankBalance,
    // Overall balance = this month's net cash movement + current bank balances
    overallBalance: rawStats.netBalance + totalBankBalance,
    pendingTransactions: rawStats.pendingCount,
    pendingAmount: rawStats.totalPending,
    // Loans are running totals (not time-bound), so still use all loans
    totalLoansReceivable: loans
      .filter((l: any) => l.type === 'Receivable')
      .reduce((sum: number, l: any) => sum + (l.remaining || 0), 0),
    totalLoansPayable: loans
      .filter((l: any) => l.type === 'Payable')
      .reduce((sum: number, l: any) => sum + (l.remaining || 0), 0),
    pendingBills: 0,
    pendingBillsAmount: 0,
  };

  // ── Chart data uses ALL transactions (last 12 months) ────────────────────
  const monthlyChartData = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .reduce((acc: any[], t) => {
      const month = new Date(t.date).toLocaleDateString('en-PK', { year: 'numeric', month: 'short' });
      const idx = acc.findIndex(m => m.month === month);
      if (idx >= 0) {
        if (t.mainCategory === 'Cash Inflow') acc[idx].inflow += t.amount;
        else if (t.mainCategory === 'Cash Outflow') acc[idx].outflow += t.amount;
        acc[idx].net = acc[idx].inflow - acc[idx].outflow;
      } else {
        acc.push({
          month,
          inflow: t.mainCategory === 'Cash Inflow' ? t.amount : 0,
          outflow: t.mainCategory === 'Cash Outflow' ? t.amount : 0,
          net: 0,
        });
      }
      return acc;
    }, [])
    .slice(0, 12);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const txns = await TransactionFirebaseService.fetchAllTransactions();
      setTransactions(txns);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    transactions, banks, loans, invoices, commissions, products,
    stats,
    monthlyChartData,
    loading,
    error,
    refresh,
  };
}