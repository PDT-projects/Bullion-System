// Banking Module - Cash List ViewModel
// FIX: Now fetches from BOTH:
//   1. cash_transactions   (manual cash entries via banking module)
//   2. transactions         (transaction module entries where mode === 'Cash')
// Merged, deduped, sorted newest-first and shown in the ledger.

import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { toast } from 'sonner';
import { CashTransaction, CashStats, CashFilters } from '../models/types';
import { BankingService } from '../models/bankingService';
import { CashFirebaseService } from '../models/cashFirebaseService';
import { db } from '../../../api/firebase/firebase';

async function fetchCashModeTransactions(): Promise<CashTransaction[]> {
  try {
    const q = query(collection(db, 'transactions'), where('mode', '==', 'Cash'));
    const snap = await getDocs(q);
    return snap.docs.map(d => {
      const data = d.data() as any;
      return {
        id:           d.id,
        date:         data.date         || data.createdAt || new Date().toISOString(),
        company:      data.company      || '',
        mainCategory: data.mainCategory || 'Cash Outflow',
        subCategory:  data.subCategory  || '',
        amount:       data.amount       || 0,
        mode:         'Cash' as const,
        note:         data.note         || '',
        location:     '',
      } as CashTransaction;
    });
  } catch (err) {
    console.error('Failed to fetch cash-mode transactions:', err);
    return [];
  }
}

export function useCashListViewModel() {
  const [transactions,   setTransactions]   = useState<CashTransaction[]>([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [cashRecordId,   setCashRecordId]   = useState<string | null>(null);
  const [isLoading,      setIsLoading]      = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [filters,        setFilters]        = useState<CashFilters>({ searchTerm: '', filterType: 'all' });

  const loadCashData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [cashTxns, records, txnCash] = await Promise.all([
        CashFirebaseService.fetchAllCashTransactions(),
        CashFirebaseService.fetchAllCashRecords(),
        fetchCashModeTransactions(),
      ]);

      // Merge + deduplicate.
      // NOTE: the same sale can land in BOTH the 'cash_transactions' collection
      // and the 'transactions' collection (mode === 'Cash'), as two different
      // docs with different ids ("Invoice / Sale" + "Product sale received").
      // Deduping by id alone misses this, so dedupe by a business key
      // (invoice/note reference + amount), falling back to id if no note.
      const keyOf = (t: CashTransaction) => {
        const ref = (t.note || '').trim().toLowerCase();
        return ref ? `${ref}__${t.amount}` : `id__${t.id}`;
      };
      const seen   = new Set<string>();
      const merged: CashTransaction[] = [];
      for (const t of [...cashTxns, ...txnCash]) {
        const key = keyOf(t);
        if (!seen.has(key)) { seen.add(key); merged.push(t); }
      }

      // Sort newest first
      merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setTransactions(merged);

      if (records.length > 0) {
        setCashRecordId(records[0].id);
        setOpeningBalance(records[0].balance);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load cash data';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadCashData(); }, [loadCashData]);

  const filteredTransactions = useMemo(
    () => BankingService.filterCashTransactions(transactions, filters.searchTerm, filters.filterType),
    [transactions, filters]
  );

  const stats: CashStats = useMemo(
    () => BankingService.calculateCashStats(transactions, openingBalance),
    [transactions, openingBalance]
  );

  const setSearchTerm  = useCallback((term: string) =>
    setFilters(prev => ({ ...prev, searchTerm: term })), []);

  const setFilterType = useCallback((type: 'all' | 'inflow' | 'outflow') =>
    setFilters(prev => ({ ...prev, filterType: type })), []);

  const handleDeleteTransaction = useCallback(async (id: string) => {
    if (!confirm('Delete this cash transaction?')) return;
    try {
      try { await CashFirebaseService.deleteCashTransaction(id); } catch {}
      setTransactions(prev => prev.filter(t => t.id !== id));
      toast.success('Transaction deleted');
    } catch {
      toast.error('Failed to delete transaction');
    }
  }, []);

  const handleSetOpeningBalance = useCallback(async (amount: number) => {
    try {
      if (cashRecordId) {
        await CashFirebaseService.updateCashBalance(cashRecordId, amount);
      } else {
        const record = await CashFirebaseService.getOrCreateCashForLocation('Head Office - Islamabad');
        await CashFirebaseService.updateCashBalance(record.id, amount);
        setCashRecordId(record.id);
      }
      setOpeningBalance(amount);
      toast.success('Opening balance updated');
    } catch {
      toast.error('Failed to update opening balance');
    }
  }, [cashRecordId]);

  return {
    filteredTransactions,
    cashRecords: transactions,
    stats,
    isLoading,
    error,
    filters,
    setSearchTerm,
    setFilterType,
    handleDeleteTransaction,
    handleSetOpeningBalance,
    refreshCashData: loadCashData,
    formatCurrency: BankingService.formatCurrency,
    formatDate:     BankingService.formatDate,
  };
}