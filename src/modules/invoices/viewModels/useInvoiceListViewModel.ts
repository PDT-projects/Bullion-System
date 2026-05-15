// Invoice Module - ViewModel Layer

export interface InvoiceProduct {
  id: string;
  productId: string;
  productName: string;
  brandName: string;
  modelName: string;
  category: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
  serialNumbers: string[];
  serialCities?: { [serialNumber: string]: string };
  currency: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerPhone2?: string;
  customerCNIC: string;
  customerProvince: string;
  customerCity: string;
  customerAddress?: string;
  warrantyLocation?: string;
  products: InvoiceProduct[];
  exchangeWarrantyNote: string;
  deliveryStatus: 'Self-collect' | 'LCS' | 'Daewoo' | 'Delivered';
  deliveryReceivedStatus: 'Pending' | 'In Process' | 'Received';
  totalAmount: number;
  status: 'Paid' | 'Unpaid';
  salesperson?: string;
  salespersonLocation?: string;
  clientDealBy?: string;
  referralBy?: string;
  createdBy?: string;
  paymentMode?: 'Cash' | 'Online' | 'Cheque';
  bankId?: string;
  bankName?: string;
  bankAccountNumber?: string;
  paymentStatus?: 'Full' | 'Partial';
  paidAmount?: number;
  remainingAmount?: number;
  collectionMethod?: 'Self Collection' | 'TCS' | 'LCS' | 'Daewoo' | 'Others';
  deductionCharges: number;
  cargoAmount?: number;
  customsAmount?: number;
  agentDetails?: string;
  agentAmount?: number;
  digitalStamp?: boolean;
  imageUrl?: string;
  paidBy?: string;
  paidTo?: string;
  productLocation?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateInvoiceDTO {
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerPhone2?: string;
  customerCNIC: string;
  customerProvince: string;
  customerCity: string;
  customerAddress?: string;
  warrantyLocation?: string;
  products: InvoiceProduct[];
  exchangeWarrantyNote: string;
  deliveryStatus: 'Self-collect' | 'LCS' | 'Daewoo' | 'Delivered';
  status: 'Paid' | 'Unpaid';
  salesperson?: string;
  salespersonLocation?: string;
  clientDealBy?: string;
  referralBy?: string;
  createdBy?: string;
  paymentMode?: 'Cash' | 'Online';
  bankId?: string;
  bankName?: string;
  bankAccountNumber?: string;
  paymentStatus?: 'Full' | 'Partial';
  paidAmount?: number;
  remainingAmount?: number;
  collectionMethod?: 'Self Collection' | 'TCS' | 'LCS' | 'Daewoo' | 'Others';
  deductionCharges: number;
  digitalStamp?: boolean;
}

export interface UpdateInvoiceDTO extends CreateInvoiceDTO {
  id: string;
}

export interface InvoiceFilters {
  searchTerm: string;
  statusFilter: 'all' | 'Paid' | 'Unpaid';
  dateFrom: string;
  dateTo: string;
  cityFilter: string;
  salespersonFilter: string;
}

export interface InvoiceStats {
  totalCount: number;
  paidCount: number;
  unpaidCount: number;
  totalAmount: number;
  totalDeductionCharges: number;
  netAmount: number;
}

export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

export interface ProductInfo {
  id: string;
  brandName: string;
  modelName: string;
  category: string;
  sellPrice: number;
  stock: number;
  serialNumbers: string[];
  serialCities: { [serialNumber: string]: string };
  serialStatus?: { [serialNumber: string]: 'Available' | 'In Transit' | 'Damaged' | 'Returned' };
  description: string;
}

export interface CustomerSuggestion {
  customerName: string;
  customerPhone: string;
  customerPhone2?: string;
  customerCNIC: string;
  customerProvince: string;
  customerCity: string;
  customerAddress?: string;
  warrantyLocation?: string;
  exchangeWarrantyNote: string;
}

export interface ProvinceCities {
  [province: string]: string[];
}

// ──────────────────────────────────────────────────────────────────────────────
// VIEW MODEL
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { InvoiceFirebaseService } from '../models/InvoiceFirebaseService';
import { EmployeeFirebaseService } from '../../employee/models/employeeFirebaseService';

// Canonical branch cities — normalise any casing/spacing variant to these
const ALLOWED_CITIES = ['Saudia', 'Chad'] as const;

function normalizeCity(raw: string): string {
  if (!raw) return '';
  const key = raw.trim().toLowerCase();
  const match = ALLOWED_CITIES.find(c => c.toLowerCase() === key);
  return match ?? raw.trim();
}

interface ViewModelProps {
  invoices: Invoice[];
  filteredInvoices: Invoice[];
  stats: InvoiceStats;
  filters: InvoiceFilters;
  viewingInvoice: Invoice | null;
  isLoading: boolean;
  // Filter handlers — all six are now wired
  onSearch: (searchTerm: string) => void;
  onStatusFilter: (status: 'all' | 'Paid' | 'Unpaid') => void;
  onCityFilter: (city: string) => void;
  onSalespersonFilter: (sp: string) => void;
  onDateFromFilter: (date: string) => void;
  onDateToFilter: (date: string) => void;
  onClearFilters: () => void;
  // Dropdown options built from live data
  availableCities: string[];
  availableSalespersons: string[];
  // id → display name map for salespersons
  salespersonMap: Record<string, string>;
  // Actions
  onViewInvoice: (invoice: Invoice) => void;
  onCloseView: () => void;
  onEditInvoice: (id: string) => void;
  onCreateInvoice: () => void;
  // Formatters
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

export function useInvoiceListViewModel(): ViewModelProps {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filters, setFilters] = useState<InvoiceFilters>({
    searchTerm: '',
    statusFilter: 'all',
    dateFrom: '',
    dateTo: '',
    cityFilter: '',
    salespersonFilter: '',
  });
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [salespersonMap, setSalespersonMap] = useState<Record<string, string>>({});

  // Real-time listener: any Firestore change (add/update/delete) instantly
  // reflects in the UI without needing a manual refresh.
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = InvoiceFirebaseService.subscribeToInvoices(
      (data) => {
        setInvoices(data);
        setIsLoading(false);
      },
      (error) => {
        console.error('Invoice listener error:', error);
        setIsLoading(false);
      }
    );
    // Cleanup: unsubscribe when component unmounts
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const employees = await EmployeeFirebaseService.fetchAllEmployees();
        const map: Record<string, string> = {};
        employees.forEach(emp => {
          if (emp.id) map[emp.id] = emp.name;
        });
        setSalespersonMap(map);
      } catch (error) {
        console.error('Failed to fetch employees for salesperson map:', error);
      }
    }
    fetchEmployees();
  }, []);

  // ── Dropdown options ──────────────────────────────────────────────────
  const availableCities = useMemo(() => {
    // Always include the 3 canonical branch cities; add any extra cities found in data
    const s = new Set<string>(ALLOWED_CITIES);
    invoices.forEach(inv => {
      const c = normalizeCity(inv.customerCity);
      if (c) s.add(c);
    });
    return Array.from(s).sort();
  }, [invoices]);

  const availableSalespersons = useMemo(() => {
    const s = new Set<string>();
    invoices.forEach(inv => {
      if (!inv.salesperson) return;
      // Resolve UID → name; if not found yet, skip (will re-run when salespersonMap loads)
      const name = salespersonMap[inv.salesperson] || inv.salesperson;
      // Only add if it looks like a real name (not a raw UID)
      if (name && !/^[A-Za-z0-9]{20,}$/.test(name)) s.add(name);
    });
    return Array.from(s).sort();
  }, [invoices, salespersonMap]);

  // ── Filtered invoices — ALL six filters active ────────────────────────
  const filteredInvoices = useMemo(() => {
    let result = [...invoices];

    // 1. Free-text search across multiple fields
    if (filters.searchTerm.trim()) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(inv =>
        inv.invoiceNumber.toLowerCase().includes(term) ||
        inv.customerName.toLowerCase().includes(term) ||
        inv.customerPhone.includes(term) ||
        (inv.customerPhone2 ?? '').includes(term) ||
        (inv.salesperson ?? '').toLowerCase().includes(term) ||
        (inv.customerCity ?? '').toLowerCase().includes(term)
      );
    }

    // 2. Paid / Unpaid
    if (filters.statusFilter !== 'all') {
      result = result.filter(inv => inv.status === filters.statusFilter);
    }

    // 3. Date from (inclusive)
    if (filters.dateFrom) {
      result = result.filter(inv => inv.date >= filters.dateFrom);
    }

    // 4. Date to (inclusive)
    if (filters.dateTo) {
      result = result.filter(inv => inv.date <= filters.dateTo);
    }

    // 5. City — normalise both sides so any casing variant matches correctly
    if (filters.cityFilter) {
      const target = normalizeCity(filters.cityFilter).toLowerCase();
      result = result.filter(inv =>
        normalizeCity(inv.customerCity).toLowerCase() === target
      );
    }

    // 6. Salesperson — compare resolved name on both sides
    if (filters.salespersonFilter) {
      result = result.filter(inv => {
        const name = salespersonMap[inv.salesperson ?? ''] || inv.salesperson || '';
        return name === filters.salespersonFilter;
      });
    }

    return result;
  }, [invoices, filters]);

  // ── Stats (from all invoices, not filtered) ───────────────────────────
  const stats: InvoiceStats = useMemo(() => {
    const totalCount = invoices.length;
    const paidCount = invoices.filter(i => i.status === 'Paid').length;
    const unpaidCount = invoices.filter(i => i.status === 'Unpaid').length;
    const totalAmount = invoices.reduce((s, i) => s + i.totalAmount, 0);
    const totalDeductionCharges = invoices.reduce((s, i) => s + (i.deductionCharges || 0), 0);
    const netAmount = totalAmount - totalDeductionCharges;
    return { totalCount, paidCount, unpaidCount, totalAmount, totalDeductionCharges, netAmount };
  }, [invoices]);

  // ── Handlers ──────────────────────────────────────────────────────────
  const onSearch = useCallback((searchTerm: string) =>
    setFilters(prev => ({ ...prev, searchTerm })), []);

  const onStatusFilter = useCallback((statusFilter: 'all' | 'Paid' | 'Unpaid') =>
    setFilters(prev => ({ ...prev, statusFilter })), []);

  const onCityFilter = useCallback((cityFilter: string) =>
    setFilters(prev => ({ ...prev, cityFilter })), []);

  const onSalespersonFilter = useCallback((salespersonFilter: string) =>
    setFilters(prev => ({ ...prev, salespersonFilter })), []);

  const onDateFromFilter = useCallback((dateFrom: string) =>
    setFilters(prev => ({ ...prev, dateFrom })), []);

  const onDateToFilter = useCallback((dateTo: string) =>
    setFilters(prev => ({ ...prev, dateTo })), []);

  const onClearFilters = useCallback(() =>
    setFilters({ searchTerm: '', statusFilter: 'all', dateFrom: '', dateTo: '', cityFilter: '', salespersonFilter: '' }),
  []);

  const onViewInvoice = useCallback((invoice: Invoice) => setViewingInvoice(invoice), []);
  const onCloseView = useCallback(() => setViewingInvoice(null), []);
  const onEditInvoice = useCallback((id: string) => navigate(`/invoices/${id}/edit`), [navigate]);
  const onCreateInvoice = useCallback(() => navigate('/invoices/new'), [navigate]);

  const formatCurrency = useCallback((amount: number) =>
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(amount), []);

  const formatDate = useCallback((dateString: string) =>
    new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), []);

  return {
    invoices,
    filteredInvoices,
    stats,
    filters,
    viewingInvoice,
    isLoading,
    onSearch,
    onStatusFilter,
    onCityFilter,
    onSalespersonFilter,
    onDateFromFilter,
    onDateToFilter,
    onClearFilters,
    availableCities,
    availableSalespersons,
    salespersonMap,
    onViewInvoice,
    onCloseView,
    onEditInvoice,
    onCreateInvoice,
    formatCurrency,
    formatDate,
  };
}