// Against the Invoice Module — ViewModel

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { AgainstInvoiceEntry, ATIFilters, ATIStats, InvoiceBalanceSummary } from '../models/types';
import { ATIFirebaseService } from '../models/atiFirebaseService';
import { InvoiceFirebaseService } from '../../invoices/models/InvoiceFirebaseService';
import { Invoice } from '../../invoices/models/types';
import { BillsFirebaseService, BillBranch } from '../../bills/models/Billsfirebaseservice';
import { BankFirebaseService } from '../../banking/models/bankFirebaseService';
import { Bank } from '../../banking/models/types';

export type ATIView = 'list' | 'balances' | 'create';

interface BranchInfo { id: string; name: string; }

const DEFAULT_BRANCHES: BranchInfo[] = [
  { id: '__default_sa__',   name: 'Saudi Arabia' },
  { id: '__default_sd__',   name: 'Sudan'        },
  { id: '__default_dxb__',  name: 'Dubai'        },
  { id: '__default_chad__', name: 'Chad'         },
];

const DEFAULT_FILTERS: ATIFilters = {
  searchTerm:    '',
  invoiceNumber: '',
  status:        '',
  dateFrom:      '',
  dateTo:        '',
};

function invoiceMatchesQuery(inv: Invoice, s: string): boolean {
  if (inv.invoiceNumber?.toLowerCase().includes(s)) return true;
  if (inv.customerName?.toLowerCase().includes(s))  return true;
  if (inv.customerPhone?.includes(s))               return true;
  if (inv.customerPhone2?.includes(s))              return true;
  if (inv.customerCNIC?.includes(s))                return true;
  if (inv.totalAmount?.toString().includes(s))      return true;
  if (inv.paidAmount?.toString().includes(s))       return true;
  if (inv.remainingAmount?.toString().includes(s))  return true;
  if (inv.status?.toLowerCase().includes(s))        return true;
  if (inv.paymentStatus?.toLowerCase().includes(s)) return true;
  if (inv.date?.includes(s))                        return true;
  if (inv.customerCity?.toLowerCase().includes(s))     return true;
  if (inv.customerProvince?.toLowerCase().includes(s)) return true;
  if (inv.salesperson?.toLowerCase().includes(s))   return true;
  return false;
}

export function useATIViewModel() {
  const [entries,          setEntries]          = useState<AgainstInvoiceEntry[]>([]);
  const [invoices,         setInvoices]         = useState<Invoice[]>([]);
  const [balanceSummaries, setBalanceSummaries] = useState<InvoiceBalanceSummary[]>([]);
  const [filters,          setFiltersState]     = useState<ATIFilters>(DEFAULT_FILTERS);
  const [isLoading,        setIsLoading]        = useState(true);
  const [isSubmitting,     setIsSubmitting]     = useState(false);
  const [activeView,       setActiveView]       = useState<ATIView>('list');
  const [selectedEntry,    setSelectedEntry]    = useState<AgainstInvoiceEntry | null>(null);
  const [branches,         setBranches]         = useState<BranchInfo[]>(DEFAULT_BRANCHES);
  const [banks,            setBanks]            = useState<Bank[]>([]);

  const invoicesCacheReady = useRef(false);

  // ── Load data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setIsLoading(true);
    invoicesCacheReady.current = false;
    try {
      const [atiData, invoiceData, summaryData, branchList, bankList] = await Promise.all([
        ATIFirebaseService.fetchAll(),
        InvoiceFirebaseService.fetchAllInvoices(),
        ATIFirebaseService.fetchInvoiceBalanceSummaries(),
        BillsFirebaseService.fetchAllBranches().catch(() => [] as BillBranch[]),
        BankFirebaseService.fetchAllBanks().catch(() => [] as Bank[]),
      ]);
      setEntries(atiData);
      setInvoices(invoiceData);
      setBalanceSummaries(summaryData);
      setBanks(bankList);

      // Merge defaults + Firestore-saved branches, deduplicated by name
      const combined = [...DEFAULT_BRANCHES, ...branchList].filter(
        (b, i, arr) => arr.findIndex(x => x.name.toLowerCase() === b.name.toLowerCase()) === i
      );
      setBranches(combined);
      invoicesCacheReady.current = true;
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load data');
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
  // Stats — uses atiPaidAmount-based summaries (independent of invoice paidAmount)
  const stats: ATIStats = useMemo(() => ({
    totalEntries:       entries.length,
    totalAmountPaid:    entries.reduce((s, e) => s + e.amount, 0),
    totalInvoiceValue:  balanceSummaries.reduce((s, b) => s + b.invoiceTotal, 0),
    totalRemaining:     balanceSummaries.reduce((s, b) => s + b.remaining, 0),
    settledCount:       balanceSummaries.filter(b => b.status === 'Settled').length,
    partialCount:       balanceSummaries.filter(b => b.status === 'Partial').length,
  }), [entries, balanceSummaries]);

  const setFilters    = useCallback((f: Partial<ATIFilters>) => setFiltersState(prev => ({ ...prev, ...f })), []);
  const resetFilters  = useCallback(() => setFiltersState(DEFAULT_FILTERS), []);

  // ── Invoice search — cache first, Firestore fallback ─────────────────────
  const searchInvoices = useCallback(async (query: string): Promise<Invoice[]> => {
    const s = query.toLowerCase().trim();

    const cacheHits = s
      ? invoices.filter(inv => invoiceMatchesQuery(inv, s))
      : [...invoices].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

    if (invoicesCacheReady.current && cacheHits.length > 0) {
      return cacheHits.slice(0, 20);
    }

    try {
      const fresh = await InvoiceFirebaseService.fetchAllInvoices();
      setInvoices(fresh);
      invoicesCacheReady.current = true;
      const freshHits = s ? fresh.filter(inv => invoiceMatchesQuery(inv, s)) : fresh.slice(0, 20);
      return freshHits.slice(0, 20);
    } catch {
      return cacheHits.slice(0, 20);
    }
  }, [invoices]);

  // ── Create entry ──────────────────────────────────────────────────────────
  const handleCreate = useCallback(async (dto: Omit<AgainstInvoiceEntry, 'id'>) => {
    setIsSubmitting(true);
    try {
      const created = await ATIFirebaseService.createEntry(dto);
      setEntries(prev => [created, ...prev]);
      toast.success(`Payment of AED ${dto.amount.toLocaleString('en-AE')} recorded against ${dto.invoiceNumber}`);
      setActiveView('list');
      // Refresh summaries and invoice cache so balances are up to date
      const [summaryData, freshInvoices] = await Promise.all([
        ATIFirebaseService.fetchInvoiceBalanceSummaries(),
        InvoiceFirebaseService.fetchAllInvoices(),
      ]);
      setBalanceSummaries(summaryData);
      setInvoices(freshInvoices);
    } catch (err: any) {
      // Show the real error from the transaction — not a generic message
      console.error('❌ handleCreate failed:', err?.message || err);
      toast.error(err?.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // ── Delete entry ──────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (entry: AgainstInvoiceEntry) => {
    if (!window.confirm(
      `Delete payment of AED ${entry.amount.toLocaleString('en-AE')} against ${entry.invoiceNumber}? This will reverse the invoice balance.`
    )) return;
    try {
      await ATIFirebaseService.deleteEntry(entry.id, entry);
      setEntries(prev => prev.filter(e => e.id !== entry.id));
      const [summaryData, freshInvoices] = await Promise.all([
        ATIFirebaseService.fetchInvoiceBalanceSummaries(),
        InvoiceFirebaseService.fetchAllInvoices(),
      ]);
      setBalanceSummaries(summaryData);
      setInvoices(freshInvoices);
      toast.success('Payment deleted and invoice balance reversed');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete entry');
    }
  }, []);

  // ── Add new branch ────────────────────────────────────────────────────────
  const onAddBranch = useCallback(async (name: string): Promise<string | null> => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    if (branches.some(b => b.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Branch already exists');
      return null;
    }
    try {
      const created = await BillsFirebaseService.createBranch(trimmed);
      setBranches(prev => [...prev, { id: created.id, name: created.name }]);
      toast.success(`Branch "${trimmed}" added`);
      return trimmed;
    } catch {
      toast.error('Failed to add branch');
      return null;
    }
  }, [branches]);

  return {
    entries,
    filteredEntries,
    invoices,
    availableInvoices: invoices,
    balanceSummaries,
    stats,
    filters,
    isLoading,
    isSubmitting,
    activeView,
    selectedEntry,
    branches,
    banks,
    setFilters,
    resetFilters,
    setActiveView,
    setSelectedEntry,
    handleCreate,
    handleSubmit: handleCreate,
    handleDelete,
    searchInvoices,
    onAddBranch,
    refresh: loadData,
  };
}