import { useState, useEffect, useCallback } from 'react';
import { TransactionFirebaseService } from '../../modules/transactions/models/transactionFirebaseService';
import { calculateStats } from '../../modules/transactions/models/transactionsService';
import { Transaction } from '../../modules/transactions/models/types';
import type { TransactionStats } from '../../modules/transactions/models/types';
import { db } from '../../api/firebase/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

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
    const unsubTransactions = onSnapshot(collection(db, 'transactions'), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
      setTransactions(data);
    }, (err) => setError(`Transactions: ${err.message}`));

    const unsubs = [
      onSnapshot(collection(db, 'banks'), (snap) => setBanks(snap.docs.map(d => ({ id: d.id, ...d.data() }))), err => {}),
      onSnapshot(collection(db, 'loans'), (snap) => setLoans(snap.docs.map(d => ({ id: d.id, ...d.data() }))), err => {}),
      onSnapshot(collection(db, 'invoices'), (snap) => setInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() }))), err => {}),
      onSnapshot(collection(db, 'commissions'), (snap) => setCommissions(snap.docs.map(d => ({ id: d.id, ...d.data() }))), err => {}),
      onSnapshot(collection(db, 'products'), (snap) => setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() }))), err => {}),
    ];

    setLoading(false);
    return () => {
      unsubTransactions();
      unsubs.forEach(unsub => unsub());
    };
  }, []);

  const rawStats = calculateStats(transactions);
  const stats = {
    ...rawStats,
    cashInflow: rawStats.totalInflow,
    cashOutflow: rawStats.totalOutflow,
    cashBalance: rawStats.netBalance,
    totalBankBalance: banks.reduce((sum, b: any) => sum + (b.balance || 0), 0),
    overallBalance: rawStats.netBalance + banks.reduce((sum, b: any) => sum + (b.balance || 0), 0),
    pendingTransactions: rawStats.pendingCount,
    pendingAmount: rawStats.totalPending,
    totalLoansReceivable: loans.filter((l: any) => l.type === 'Receivable').reduce((sum: number, l: any) => sum + (l.remaining || 0), 0),
    totalLoansPayable: loans.filter((l: any) => l.type === 'Payable').reduce((sum: number, l: any) => sum + (l.remaining || 0), 0),
    pendingBills: 0,
    pendingBillsAmount: 0,
  };

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
          net: 0 
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

