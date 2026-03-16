// Transactions Module - List ViewModel

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Transaction, TransactionFilters, TransactionStats } from '../models/types';
import {
  filterTransactions, calculateStats, formatCurrency, formatDate,
  formatDateTime, getCategoryColor, exportToCSV, downloadCSV,
} from '../models/transactionsService';
import { TransactionFirebaseService } from '../models/transactionFirebaseService';

export interface UseTransactionListViewModelReturn {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  stats: TransactionStats;
  filters: TransactionFilters;
  isLoading: boolean;
  viewTransaction: Transaction | null;
  setFilters: (f: Partial<TransactionFilters>) => void;
  setViewTransaction: (t: Transaction | null) => void;
  handleDeleteTransaction: (id: string) => Promise<void>;
  handleCreateTransaction: () => void;
  handleEditTransaction: (id: string) => void;
  handleExportCSV: () => void;
  formatCurrency: (n: number) => string;
  formatDate: (d: string) => string;
  formatDateTime: (d: string, t?: string) => string;
  getCategoryColor: (c: string) => string;
  // Expose so wrappers can add partial payments
  refreshTransactions: () => Promise<void>;
  updateTransactionLocal: (id: string, data: Partial<Transaction>) => void;
}

const DEFAULT_FILTERS: TransactionFilters = {
  searchTerm: '', mainCategory: '', dateFrom: '', dateTo: '',
  paymentStatus: '', company: '',
};

export function useTransactionListViewModel(): UseTransactionListViewModelReturn {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [filters,      setFiltersState] = useState<TransactionFilters>(DEFAULT_FILTERS);
  const [viewTransaction, setViewTransaction] = useState<Transaction | null>(null);

  const loadTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await TransactionFirebaseService.fetchAllTransactions();
      setTransactions(data);
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  const filteredTransactions = useMemo(
    () => filterTransactions(transactions, filters),
    [transactions, filters]
  );
  const stats = useMemo(() => calculateStats(filteredTransactions), [filteredTransactions]);

  const setFilters = useCallback((f: Partial<TransactionFilters>) => {
    setFiltersState(prev => ({ ...prev, ...f }));
  }, []);

  const handleDeleteTransaction = useCallback(async (id: string) => {
    if (!window.confirm('Delete this transaction? This cannot be undone.')) return;
    try {
      await TransactionFirebaseService.deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
      toast.success('Transaction deleted');
    } catch {
      toast.error('Failed to delete transaction');
    }
  }, []);

  const handleCreateTransaction = useCallback(() => navigate('/transactions/new'), [navigate]);
  const handleEditTransaction    = useCallback((id: string) => navigate(`/transactions/${id}/edit`), [navigate]);

  const handleExportCSV = useCallback(() => {
    const csv = exportToCSV(filteredTransactions);
    downloadCSV(csv, `transactions-${new Date().toISOString().split('T')[0]}.csv`);
  }, [filteredTransactions]);

  const updateTransactionLocal = useCallback((id: string, data: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  }, []);

  return {
    transactions, filteredTransactions, stats, filters, isLoading, viewTransaction,
    setFilters, setViewTransaction,
    handleDeleteTransaction, handleCreateTransaction, handleEditTransaction, handleExportCSV,
    formatCurrency, formatDate, formatDateTime, getCategoryColor,
    refreshTransactions: loadTransactions, updateTransactionLocal,
  };
}