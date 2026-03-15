// Invoice Module - Model Layer
// Data interfaces and types

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
// VIEW MODEL - useInvoiceListViewModel
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { InvoiceFirebaseService } from '../models/InvoiceFirebaseService';

// Props type matching InvoiceListView (inline to avoid circular imports)
interface ViewModelProps {
  invoices: Invoice[];
  filteredInvoices: Invoice[];
  stats: InvoiceStats;
  filters: InvoiceFilters;
  viewingInvoice: Invoice | null;
  isLoading: boolean;
  onSearch: (searchTerm: string) => void;
  onStatusFilter: (status: 'all' | 'Paid' | 'Unpaid') => void;
  onViewInvoice: (invoice: Invoice) => void;
  onCloseView: () => void;
  onEditInvoice: (id: string) => void;
  onDeleteInvoice: (id: string) => void;
  onCreateInvoice: () => void;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

export function useInvoiceListViewModel(): ViewModelProps {
  const navigate = useNavigate();

  // State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filters, setFilters] = useState<InvoiceFilters>({
    searchTerm: '',
    statusFilter: 'all' as const,
    dateFrom: '',
    dateTo: '',
    cityFilter: '',
    salespersonFilter: '',
  });
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch invoices
  useEffect(() => {
    async function fetchInvoices() {
      try {
        setIsLoading(true);
        const data = await InvoiceFirebaseService.fetchAllInvoices();
        setInvoices(data);
      } catch (error) {
        console.error('Failed to fetch invoices:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchInvoices();
  }, []);

  // Computed filtered invoices
  const filteredInvoices = useMemo(() => {
    let result = [...invoices];

    // Search filter
    if (filters.searchTerm.trim()) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(invoice =>
        invoice.invoiceNumber.toLowerCase().includes(term) ||
        invoice.customerName.toLowerCase().includes(term) ||
        invoice.customerPhone.includes(term) ||
        invoice.customerPhone2?.includes(term)
      );
    }

    // Status filter
    if (filters.statusFilter !== 'all') {
      result = result.filter(invoice => invoice.status === filters.statusFilter);
    }

    return result;
  }, [invoices, filters.searchTerm, filters.statusFilter]);

  // Computed stats
  const stats: InvoiceStats = useMemo(() => {
    const totalCount = invoices.length;
    const paidCount = invoices.filter(i => i.status === 'Paid').length;
    const unpaidCount = invoices.filter(i => i.status === 'Unpaid').length;
    const totalAmount = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalDeductionCharges = invoices.reduce((sum, i) => sum + i.deductionCharges, 0);
    const netAmount = totalAmount - totalDeductionCharges;

    return { totalCount, paidCount, unpaidCount, totalAmount, totalDeductionCharges, netAmount };
  }, [invoices]);

  // Handlers
  const onSearch = useCallback((searchTerm: string) => {
    setFilters(prev => ({ ...prev, searchTerm }));
  }, []);

  const onStatusFilter = useCallback((status: 'all' | 'Paid' | 'Unpaid') => {
    setFilters(prev => ({ ...prev, statusFilter: status }));
  }, []);

  const onViewInvoice = useCallback((invoice: Invoice) => {
    setViewingInvoice(invoice);
  }, []);

  const onCloseView = useCallback(() => {
    setViewingInvoice(null);
  }, []);

  const onEditInvoice = useCallback((id: string) => {
    navigate(`/invoices/${id}/edit`);
  }, [navigate]);

  const onDeleteInvoice = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) return;

    try {
      await InvoiceFirebaseService.deleteInvoice(id);
      // Refetch invoices
      const updated = await InvoiceFirebaseService.fetchAllInvoices();
      setInvoices(updated);
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      alert('Failed to delete invoice. Please try again.');
    }
  }, []);

  const onCreateInvoice = useCallback(() => {
    navigate('/invoices/new');
  }, [navigate]);

  // Formatters
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
    }).format(amount);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, []);

  // Return props for InvoiceListView
  return {
    invoices,
    filteredInvoices,
    stats,
    filters,
    viewingInvoice,
    isLoading,
    onSearch,
    onStatusFilter,
    onViewInvoice,
    onCloseView,
    onEditInvoice,
    onDeleteInvoice,
    onCreateInvoice,
    formatCurrency,
    formatDate,
  };
}

