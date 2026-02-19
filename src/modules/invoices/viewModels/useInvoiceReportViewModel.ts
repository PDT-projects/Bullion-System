// Invoice Module - Report ViewModel
// Manages invoice report state, filtering, and export

import { useState, useMemo, useCallback } from 'react';
import { Invoice, InvoiceStats } from '../models/types';
import {
  filterInvoices,
  calculateInvoiceStats,
  formatCurrency,
  exportInvoicesToCSV,
  downloadCSV
} from '../models/invoiceService';

interface UseInvoiceReportViewModelProps {
  invoices: Invoice[];
}

interface UseInvoiceReportViewModelReturn {
  // State
  dateFrom: string;
  dateTo: string;
  selectedCity: string;
  selectedSalesperson: string;
  selectedStatus: string;
  viewInvoice: Invoice | null;
  
  // Derived state
  filteredInvoices: Invoice[];
  stats: InvoiceStats;
  cities: string[];
  salespersons: string[];
  statuses: string[];
  
  // Actions
  setDateFrom: (date: string) => void;
  setDateTo: (date: string) => void;
  setSelectedCity: (city: string) => void;
  setSelectedSalesperson: (salesperson: string) => void;
  setSelectedStatus: (status: string) => void;
  handleViewInvoice: (invoice: Invoice) => void;
  handleCloseView: () => void;
  handleClearFilters: () => void;
  handleExportCSV: () => void;
  
  // Helpers
  formatCurrency: (amount: number) => string;
}

export const useInvoiceReportViewModel = ({
  invoices
}: UseInvoiceReportViewModelProps): UseInvoiceReportViewModelReturn => {
  // Filter state
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedSalesperson, setSelectedSalesperson] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  
  // Get unique cities
  const cities = useMemo(() => {
    const citySet = new Set<string>();
    invoices.forEach(inv => {
      if (inv.customerCity) citySet.add(inv.customerCity);
    });
    return Array.from(citySet).sort();
  }, [invoices]);
  
  // Get unique salespersons
  const salespersons = useMemo(() => {
    const salespersonSet = new Set<string>();
    invoices.forEach(inv => {
      if (inv.salesperson) salespersonSet.add(inv.salesperson);
    });
    return Array.from(salespersonSet).sort();
  }, [invoices]);
  
  // Status options
  const statuses = ['Paid', 'Unpaid'];
  
  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return filterInvoices(invoices, {
      searchTerm: '',
      statusFilter: selectedStatus as any,
      dateFrom,
      dateTo,
      cityFilter: selectedCity,
      salespersonFilter: selectedSalesperson
    });
  }, [invoices, dateFrom, dateTo, selectedCity, selectedSalesperson, selectedStatus]);
  
  // Statistics
  const stats = useMemo(() => {
    return calculateInvoiceStats(filteredInvoices);
  }, [filteredInvoices]);
  
  // View invoice handler
  const handleViewInvoice = useCallback((invoice: Invoice) => {
    setViewInvoice(invoice);
  }, []);
  
  // Close view handler
  const handleCloseView = useCallback(() => {
    setViewInvoice(null);
  }, []);
  
  // Clear filters handler
  const handleClearFilters = useCallback(() => {
    setDateFrom('');
    setDateTo('');
    setSelectedCity('');
    setSelectedSalesperson('');
    setSelectedStatus('');
  }, []);
  
  // Export CSV handler
  const handleExportCSV = useCallback(() => {
    const csvContent = exportInvoicesToCSV(filteredInvoices);
    const filename = `invoice-report-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csvContent, filename);
  }, [filteredInvoices]);
  
  return {
    dateFrom,
    dateTo,
    selectedCity,
    selectedSalesperson,
    selectedStatus,
    viewInvoice,
    filteredInvoices,
    stats,
    cities,
    salespersons,
    statuses,
    setDateFrom,
    setDateTo,
    setSelectedCity,
    setSelectedSalesperson,
    setSelectedStatus,
    handleViewInvoice,
    handleCloseView,
    handleClearFilters,
    handleExportCSV,
    formatCurrency
  };
};
