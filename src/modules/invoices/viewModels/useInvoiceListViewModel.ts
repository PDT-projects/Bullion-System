// Invoice Module - List ViewModel  (cleaned)
//
// CHANGES vs previous version
//   1. CLEANUP: removed ~160 lines of duplicated type definitions — the file
//      redefined Invoice / InvoiceProduct / DTOs locally instead of importing
//      the single source of truth in models/types.ts. Now imported.
//   2. Row selection (checkbox + "select all filtered") and a live summary of
//      the selected (or, if none selected, the filtered) invoices.
//   3. Payment recording: open a payment modal on a row, submit a payment →
//      InvoicePaymentService.recordPayment (books a transaction inflow).
//   4. AED currency formatter (was incorrectly PKR).
//
// Interface is a SUPERSET of the previous one so the current InvoiceListView
// keeps compiling until the new list view ships.

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Invoice, InvoiceStats, InvoiceFilters, InvoiceSelectionSummary, PaymentMode,
} from '../models/types';
import {
  calculateInvoiceStats, summarizeInvoices, formatCurrency, formatDate,
} from '../models/invoiceService';
import { InvoiceFirebaseService } from '../models/InvoiceFirebaseService';
import { InvoicePaymentService } from '../models/InvoicePaymentService';
import { EmployeeFirebaseService } from '../../employee/models/employeeFirebaseService';
import { BankFirebaseService } from '../../banking/models/bankFirebaseService';
import { TxCompany } from '../../transactions/models/transactionBridgeService';
import { useAuth } from '../../../providers/context/AuthContext';

const ALLOWED_CITIES = ['Saudia', 'Chad'] as const;
const VALID_COMPANIES = [
  'Bullion Electronics - Saudia', 'Bullion Electronics - Dubai',
  'Bullion Electronics - Chad', 'Bullion Electronics - Sudan',
  'Bullion Electronics - Other',
];

function normalizeCity(raw: string): string {
  if (!raw) return '';
  const key = raw.trim().toLowerCase();
  const match = ALLOWED_CITIES.find(c => c.toLowerCase() === key);
  return match ?? raw.trim();
}

function companyFromInvoice(inv: Invoice): TxCompany {
  const candidate = `Bullion Electronics - ${inv.branch || ''}`;
  return (VALID_COMPANIES.includes(candidate) ? candidate : 'Bullion Electronics - Other') as TxCompany;
}

export interface Bank { id: string; name: string; accountNumber: string; balance: number; currency?: string; }

export interface PaymentFormInput {
  amount: number;
  mode: PaymentMode;
  date: string;
  bankId?: string;
  note?: string;
}

export interface UseInvoiceListViewModelReturn {
  invoices: Invoice[];
  filteredInvoices: Invoice[];
  stats: InvoiceStats;
  filters: InvoiceFilters;
  viewingInvoice: Invoice | null;
  isLoading: boolean;
  onSearch: (searchTerm: string) => void;
  onStatusFilter: (status: 'all' | 'Paid' | 'Unpaid' | 'Partial') => void;
  onCityFilter: (city: string) => void;
  onSalespersonFilter: (sp: string) => void;
  onDateFromFilter: (date: string) => void;
  onDateToFilter: (date: string) => void;
  onClearFilters: () => void;
  availableCities: string[];
  availableSalespersons: string[];
  salespersonMap: Record<string, string>;
  onViewInvoice: (invoice: Invoice) => void;
  onCloseView: () => void;
  onEditInvoice: (id: string) => void;
  onCreateInvoice: () => void;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;

  // ── Selection + summary (NEW) ──
  selectedIds: string[];
  isSelected: (id: string) => boolean;
  toggleSelect: (id: string) => void;
  toggleSelectAll: () => void;
  allFilteredSelected: boolean;
  clearSelection: () => void;
  selectionSummary: InvoiceSelectionSummary;   // selected rows, or filtered if none selected
  hasSelection: boolean;

  // ── Payment (NEW) ──
  banks: Bank[];
  paymentInvoice: Invoice | null;
  isRecordingPayment: boolean;
  openPayment: (invoice: Invoice) => void;
  closePayment: () => void;
  submitPayment: (input: PaymentFormInput) => Promise<void>;
}

export function useInvoiceListViewModel(): UseInvoiceListViewModelReturn {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filters, setFilters] = useState<InvoiceFilters>({
    searchTerm: '', statusFilter: 'all', dateFrom: '', dateTo: '',
    cityFilter: '', salespersonFilter: '',
  });
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [salespersonMap, setSalespersonMap] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [banks, setBanks] = useState<Bank[]>([]);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  // Real-time listener — add/update/delete reflect instantly.
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = InvoiceFirebaseService.subscribeToInvoices(
      (data) => { setInvoices(data); setIsLoading(false); },
      (error) => { console.error('Invoice listener error:', error); setIsLoading(false); },
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    EmployeeFirebaseService.fetchAllEmployees()
      .then(employees => {
        const map: Record<string, string> = {};
        employees.forEach((emp: any) => { if (emp.id) map[emp.id] = emp.name; });
        setSalespersonMap(map);
      })
      .catch(err => console.error('Failed to fetch employees for salesperson map:', err));
    BankFirebaseService.fetchAllBanks()
      .then(list => setBanks(list as any[]))
      .catch(() => {});
  }, []);

  // ── Dropdown options ────────────────────────────────────────────────────
  const availableCities = useMemo(() => {
    const s = new Set<string>(ALLOWED_CITIES);
    invoices.forEach(inv => { const c = normalizeCity(inv.customerCity); if (c) s.add(c); });
    return Array.from(s).sort();
  }, [invoices]);

  const availableSalespersons = useMemo(() => {
    const s = new Set<string>();
    invoices.forEach(inv => {
      if (!inv.salesperson) return;
      const name = salespersonMap[inv.salesperson] || inv.salesperson;
      if (name && !/^[A-Za-z0-9]{20,}$/.test(name)) s.add(name);
    });
    return Array.from(s).sort();
  }, [invoices, salespersonMap]);

  // ── Filtering (all six filters) ───────────────────────────────────────────
  const filteredInvoices = useMemo(() => {
    let result = [...invoices];
    if (filters.searchTerm.trim()) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(inv =>
        inv.invoiceNumber.toLowerCase().includes(term) ||
        inv.customerName.toLowerCase().includes(term) ||
        inv.customerPhone.includes(term) ||
        (inv.customerPhone2 ?? '').includes(term) ||
        (inv.salesperson ?? '').toLowerCase().includes(term) ||
        (inv.customerCity ?? '').toLowerCase().includes(term));
    }
    if (filters.statusFilter !== 'all') result = result.filter(inv => inv.status === filters.statusFilter);
    if (filters.dateFrom) result = result.filter(inv => inv.date >= filters.dateFrom);
    if (filters.dateTo)   result = result.filter(inv => inv.date <= filters.dateTo);
    if (filters.cityFilter) {
      const target = normalizeCity(filters.cityFilter).toLowerCase();
      result = result.filter(inv => normalizeCity(inv.customerCity).toLowerCase() === target);
    }
    if (filters.salespersonFilter) {
      result = result.filter(inv => {
        const name = salespersonMap[inv.salesperson ?? ''] || inv.salesperson || '';
        return name === filters.salespersonFilter;
      });
    }
    return result;
  }, [invoices, filters, salespersonMap]);

  const stats: InvoiceStats = useMemo(() => calculateInvoiceStats(invoices), [invoices]);

  // ── Selection ─────────────────────────────────────────────────────────────
  // Prune selections that fall outside the current filter view.
  useEffect(() => {
    setSelectedIds(prev => {
      if (prev.size === 0) return prev;
      const visible = new Set(filteredInvoices.map(i => i.id));
      const next = new Set([...prev].filter(id => visible.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [filteredInvoices]);

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const allFilteredSelected = useMemo(
    () => filteredInvoices.length > 0 && filteredInvoices.every(i => selectedIds.has(i.id)),
    [filteredInvoices, selectedIds],
  );

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev => {
      const allSelected = filteredInvoices.length > 0 && filteredInvoices.every(i => prev.has(i.id));
      if (allSelected) return new Set();
      return new Set(filteredInvoices.map(i => i.id));
    });
  }, [filteredInvoices]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const hasSelection = selectedIds.size > 0;

  // Sum the selected rows; if nothing is explicitly selected, sum the filtered view.
  const selectionSummary = useMemo<InvoiceSelectionSummary>(() => {
    const subset = hasSelection
      ? filteredInvoices.filter(i => selectedIds.has(i.id))
      : filteredInvoices;
    return summarizeInvoices(subset);
  }, [filteredInvoices, selectedIds, hasSelection]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const onSearch = useCallback((searchTerm: string) => setFilters(p => ({ ...p, searchTerm })), []);
  const onStatusFilter = useCallback((statusFilter: 'all' | 'Paid' | 'Unpaid' | 'Partial') => setFilters(p => ({ ...p, statusFilter })), []);
  const onCityFilter = useCallback((cityFilter: string) => setFilters(p => ({ ...p, cityFilter })), []);
  const onSalespersonFilter = useCallback((salespersonFilter: string) => setFilters(p => ({ ...p, salespersonFilter })), []);
  const onDateFromFilter = useCallback((dateFrom: string) => setFilters(p => ({ ...p, dateFrom })), []);
  const onDateToFilter = useCallback((dateTo: string) => setFilters(p => ({ ...p, dateTo })), []);
  const onClearFilters = useCallback(() => setFilters({ searchTerm: '', statusFilter: 'all', dateFrom: '', dateTo: '', cityFilter: '', salespersonFilter: '' }), []);

  const onViewInvoice = useCallback((invoice: Invoice) => setViewingInvoice(invoice), []);
  const onCloseView = useCallback(() => setViewingInvoice(null), []);
  const onEditInvoice = useCallback((id: string) => navigate(`/invoices/${id}/edit`), [navigate]);
  const onCreateInvoice = useCallback(() => navigate('/invoices/new'), [navigate]);

  // ── Payment ───────────────────────────────────────────────────────────────
  const openPayment = useCallback((invoice: Invoice) => setPaymentInvoice(invoice), []);
  const closePayment = useCallback(() => setPaymentInvoice(null), []);

  const submitPayment = useCallback(async (input: PaymentFormInput) => {
    if (!paymentInvoice) return;
    if (!(input.amount > 0)) { toast.error('Enter a payment amount greater than zero'); return; }
    setIsRecordingPayment(true);
    try {
      const bank = input.mode === 'Bank' ? banks.find(b => b.id === input.bankId) : undefined;
      const result = await InvoicePaymentService.recordPayment({
        invoice:   paymentInvoice,
        amount:    input.amount,
        mode:      input.mode,
        date:      input.date,
        bankId:    bank?.id,
        bankName:  bank?.name,
        bankAccountNumber: bank?.accountNumber,
        note:      input.note,
        company:   companyFromInvoice(paymentInvoice),
        recordedBy: user ? { uid: user.uid, email: user.email || '' } : undefined,
      });
      toast.success(
        result.status === 'Paid'
          ? `Invoice fully paid — ${formatCurrency(result.paidAmount)} received`
          : `Payment recorded — ${formatCurrency(result.remainingAmount)} remaining`,
      );
      setPaymentInvoice(null);
      // The realtime listener refreshes the list automatically.
    } catch (err: any) {
      console.error('Payment failed:', err);
      toast.error(err?.message || 'Failed to record payment');
    } finally {
      setIsRecordingPayment(false);
    }
  }, [paymentInvoice, banks, user]);

  return {
    invoices, filteredInvoices, stats, filters, viewingInvoice, isLoading,
    onSearch, onStatusFilter, onCityFilter, onSalespersonFilter,
    onDateFromFilter, onDateToFilter, onClearFilters,
    availableCities, availableSalespersons, salespersonMap,
    onViewInvoice, onCloseView, onEditInvoice, onCreateInvoice,
    formatCurrency, formatDate,
    // selection
    selectedIds: Array.from(selectedIds), isSelected, toggleSelect, toggleSelectAll,
    allFilteredSelected, clearSelection, selectionSummary, hasSelection,
    // payment
    banks, paymentInvoice, isRecordingPayment, openPayment, closePayment, submitPayment,
  };
}