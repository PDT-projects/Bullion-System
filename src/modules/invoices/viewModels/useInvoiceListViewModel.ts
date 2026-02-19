// Invoice Module - List ViewModel
// Manages invoice list state, filtering, and operations

import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Invoice,
  InvoiceFilters,
  InvoiceStats,
  ProductInfo
} from '../models/types';
import {
  filterInvoices,
  calculateInvoiceStats,
  formatCurrency,
  formatDate
} from '../models/invoiceService';

interface UseInvoiceListViewModelProps {
  invoices: Invoice[];
  products: ProductInfo[];
  setInvoices: (invoices: Invoice[]) => void;
  setProducts: (products: ProductInfo[]) => void;
}

interface UseInvoiceListViewModelReturn {
  // State
  filters: InvoiceFilters;
  viewingInvoice: Invoice | null;
  
  // Derived state
  filteredInvoices: Invoice[];
  stats: InvoiceStats;
  
  // Actions
  setFilters: (filters: Partial<InvoiceFilters>) => void;
  handleSearch: (searchTerm: string) => void;
  handleStatusFilter: (status: 'all' | 'Paid' | 'Unpaid') => void;
  handleViewInvoice: (invoice: Invoice) => void;
  handleCloseView: () => void;
  handleEditInvoice: (id: string) => void;
  handleDeleteInvoice: (id: string) => void;
  handleCreateInvoice: () => void;
  
  // Helpers
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

export const useInvoiceListViewModel = ({
  invoices,
  products,
  setInvoices,
  setProducts
}: UseInvoiceListViewModelProps): UseInvoiceListViewModelReturn => {
  const navigate = useNavigate();
  
  // Filter state
  const [filters, setFiltersState] = useState<InvoiceFilters>({
    searchTerm: '',
    statusFilter: 'all',
    dateFrom: '',
    dateTo: '',
    cityFilter: '',
    salespersonFilter: ''
  });
  
  // View modal state
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  
  // Update filters helper
  const setFilters = useCallback((partialFilters: Partial<InvoiceFilters>) => {
    setFiltersState(prev => ({ ...prev, ...partialFilters }));
  }, []);
  
  // Derived state - filtered invoices
  const filteredInvoices = useMemo(() => {
    return filterInvoices(invoices, filters);
  }, [invoices, filters]);
  
  // Derived state - statistics
  const stats = useMemo(() => {
    return calculateInvoiceStats(filteredInvoices);
  }, [filteredInvoices]);
  
  // Search handler
  const handleSearch = useCallback((searchTerm: string) => {
    setFilters({ searchTerm });
  }, [setFilters]);
  
  // Status filter handler
  const handleStatusFilter = useCallback((status: 'all' | 'Paid' | 'Unpaid') => {
    setFilters({ statusFilter: status });
  }, [setFilters]);
  
  // View invoice handler
  const handleViewInvoice = useCallback((invoice: Invoice) => {
    setViewingInvoice(invoice);
  }, []);
  
  // Close view modal
  const handleCloseView = useCallback(() => {
    setViewingInvoice(null);
  }, []);
  
  // Edit invoice handler
  const handleEditInvoice = useCallback((id: string) => {
    navigate(`/invoices/${id}/edit`);
  }, [navigate]);
  
  // Delete invoice handler
  const handleDeleteInvoice = useCallback((id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) {
      return;
    }
    
    const invoiceToDelete = invoices.find(inv => inv.id === id);
    if (!invoiceToDelete) return;
    
    // Return products to inventory
    const updatedProducts = products.map(product => {
      const returnedProduct = invoiceToDelete.products.find(p => p.productId === product.id);
      if (returnedProduct && returnedProduct.serialNumbers) {
        return {
          ...product,
          serialNumbers: [...product.serialNumbers, ...returnedProduct.serialNumbers],
          stock: product.stock + returnedProduct.quantity
        };
      }
      return product;
    });
    
    setProducts(updatedProducts);
    setInvoices(invoices.filter(inv => inv.id !== id));
    toast.success('Invoice deleted successfully');
  }, [invoices, products, setInvoices, setProducts]);
  
  // Create invoice handler
  const handleCreateInvoice = useCallback(() => {
    navigate('/invoices/new');
  }, [navigate]);
  
  return {
    filters,
    viewingInvoice,
    filteredInvoices,
    stats,
    setFilters,
    handleSearch,
    handleStatusFilter,
    handleViewInvoice,
    handleCloseView,
    handleEditInvoice,
    handleDeleteInvoice,
    handleCreateInvoice,
    formatCurrency,
    formatDate
  };
};
