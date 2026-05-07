// Against the Invoice Module — ViewModel
// Manages state for the ATI dashboard (list + balance tracker)

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { AgainstInvoiceEntry, ATIFilters, ATIStats, InvoiceBalanceSummary } from '../models/types';
import { ATIFirebaseService } from '../models/atiFirebaseService';
import { InvoiceFirebaseService } from '../../invoices/models/InvoiceFirebaseService';
import { Invoice } from '../../invoices/models/types';

export type ATIView = 'list' | 'balances' | 'create';

const DEFAULT_FILTERS: ATIFilters = {
  searchTerm:    '',
  invoiceNumber: '',
  status:        '',
  dateFrom:      '',
  dateTo:        '',
};

export function useATIViewModel() {
  const [entries,         setEntries]         = useState<AgainstInvoiceEntry[]>([]);
  const [invoices,        setInvoices]        = useState<Invoice[]>([]);
  const [balanceSummaries, setBalanceSummaries] = useState<InvoiceBalanceSummary[]>([]);
  const [filters,         setFiltersState]    = useState<ATIFilters>(DEFAULT_FILTERS);
  const [isLoading,       setIsLoading]       = useState(true);
  const [isSubmitting,    setIsSubmitting]    = useState(false);
  const [activeView,      setActiveView]      = useState<ATIView>('list');
  const [selectedEntry,   setSelectedEntry]   = useState<AgainstInvoiceEntry | null>(null);

  // ── Load data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [atiData, invoiceData, summaryData] = await Promise.all([
        ATIFirebaseService.fetchAll(),
        InvoiceFirebaseService.fetchAllInvoices(),
        ATIFirebaseService.fetchInvoiceBalanceSummaries(),
      ]);
      setEntries(atiData);
      setInvoices(invoiceData);
      setBalanceSummaries(summaryData);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Filtered entries ──────────────────────────────────────────────────────
  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      if (filters.searchTerm) {
        const s = filters.searchTerm.toLowerCase();
        if (
          !e.invoiceNumber.toLowerCase().includes(s) &&
          !e.customerName.toLowerCase().includes(s) &&
          !e.transactionId.toLowerCase().includes(s) &&
          !(e.description || '').toLowerCase().includes(s)
        ) return false;
      }
      if (filters.invoiceNumber && e.invoiceNumber !== filters.invoiceNumber) return false;
      if (filters.status        && e.status !== filters.status)               return false;
      if (filters.dateFrom      && e.date < filters.dateFrom)                 return false;
      if (filters.dateTo        && e.date > filters.dateTo)                   return false;
      return true;
    });
  }, [entries, filters]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats: ATIStats = useMemo(() => ({
    totalEntries:       entries.length,
    totalAmountPaid:    entries.reduce((s, e) => s + e.amount, 0),
    totalInvoiceValue:  balanceSummaries.reduce((s, b) => s + b.invoiceTotal, 0),
    totalRemaining:     balanceSummaries.reduce((s, b) => s + b.remaining, 0),
    settledCount:       balanceSummaries.filter(b => b.status === 'Settled').length,
    partialCount:       balanceSummaries.filter(b => b.status === 'Partial').length,
  }), [entries, balanceSummaries]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const setFilters = useCallback((f: Partial<ATIFilters>) => {
    setFiltersState(prev => ({ ...prev, ...f }));
  }, []);

  const resetFilters = useCallback(() => setFiltersState(DEFAULT_FILTERS), []);

  // ── Create entry ──────────────────────────────────────────────────────────
  const handleCreate = useCallback(async (dto: Omit<AgainstInvoiceEntry, 'id'>) => {
    setIsSubmitting(true);
    try {
      const created = await ATIFirebaseService.createEntry(dto);
      setEntries(prev => [created, ...prev]);
      toast.success(`Payment of Rs ${dto.amount.toLocaleString()} recorded against ${dto.invoiceNumber}`);
      setActiveView('list');
      // Reload summaries to keep them fresh
      const summaryData = await ATIFirebaseService.fetchInvoiceBalanceSummaries();
      setBalanceSummaries(summaryData);
    } catch {
      toast.error('Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // ── Delete entry ──────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (entry: AgainstInvoiceEntry) => {
    if (!window.confirm(`Delete this payment of Rs ${entry.amount.toLocaleString()} against ${entry.invoiceNumber}? This will reverse the invoice balance.`)) return;
    try {
      await ATIFirebaseService.deleteEntry(entry.id, entry);
      setEntries(prev => prev.filter(e => e.id !== entry.id));
      const summaryData = await ATIFirebaseService.fetchInvoiceBalanceSummaries();
      setBalanceSummaries(summaryData);
      toast.success('Payment entry deleted and invoice balance reversed');
    } catch {
      toast.error('Failed to delete entry');
    }
  }, []);

  return {
    entries,
    filteredEntries,
    invoices,
    balanceSummaries,
    stats,
    filters,
    isLoading,
    isSubmitting,
    activeView,
    selectedEntry,
    setFilters,
    resetFilters,
    setActiveView,
    setSelectedEntry,
    handleCreate,
    handleDelete,
    refresh: loadData,
  };
}