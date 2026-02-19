/**
 * Loans List ViewModel
 * 
 * Manages loan list state, filtering, sorting, pagination, and list actions.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { 
  Loan, 
  Bank, 
  LoanFilters, 
  LoanSortField, 
  SortOrder,
  LoanType,
  LoanStatus,
  LoanCategory
} from '../models/types';
import {
  getAllLoans,
  saveLoans,
  filterLoans,
  sortLoans,
  deleteLoan,
  formatCurrency,
  exportLoansToCSV,
  downloadCSV,
  calculateStatistics
} from '../models/loanService';

export interface UseLoanListViewModelReturn {
  // State
  loans: Loan[];
  filteredLoans: Loan[];
  isLoading: boolean;
  error: string | null;
  
  // Filters
  filters: LoanFilters;
  setSearchTerm: (term: string) => void;
  setTypeFilter: (type: LoanType | 'all') => void;
  setStatusFilter: (status: LoanStatus | 'all') => void;
  setCategoryFilter: (category: LoanCategory | 'all') => void;
  setDateRange: (from?: string, to?: string) => void;
  clearFilters: () => void;
  
  // Sorting
  sortField: LoanSortField;
  sortOrder: SortOrder;
  setSortField: (field: LoanSortField) => void;
  toggleSortOrder: () => void;
  
  // Pagination
  currentPage: number;
  pageSize: number;
  totalPages: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  
  // Selection
  selectedLoans: string[];
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  
  // Actions
  refreshData: () => void;
  handleDelete: (id: string) => Promise<boolean>;
  handleBulkDelete: () => Promise<boolean>;
  handleExport: () => void;
  navigateToCreate: () => void;
  navigateToEdit: (id: string) => void;
  navigateToView: (id: string) => void;
  navigateToPayment: (id: string) => void;
  
  // Stats
  totalCount: number;
  totalAmount: number;
}

export const useLoanListViewModel = (
  banks: Bank[],
  setBanks: (banks: Bank[]) => void,
  initialType?: LoanType
): UseLoanListViewModelReturn => {
  const navigate = useNavigate();
  
  // State
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [filters, setFilters] = useState<LoanFilters>({
    searchTerm: '',
    type: initialType || 'all',
    status: 'all',
    loanCategory: 'all',
    dateFrom: undefined,
    dateTo: undefined
  });
  
  // Sorting
  const [sortField, setSortField] = useState<LoanSortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Selection
  const [selectedLoans, setSelectedLoans] = useState<string[]>([]);
  
  // Load data
  const loadData = useCallback(() => {
    try {
      setIsLoading(true);
      setError(null);
      const allLoans = getAllLoans();
      setLoans(allLoans);
      setSelectedLoans([]); // Clear selection on refresh
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load loans');
      toast.error('Failed to load loans');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // Filter and sort loans
  const filteredLoans = useMemo(() => {
    let result = filterLoans(loans, filters);
    result = sortLoans(result, sortField, sortOrder);
    return result;
  }, [loans, filters, sortField, sortOrder]);
  
  // Pagination
  const totalPages = useMemo(() => 
    Math.ceil(filteredLoans.length / pageSize) || 1
  , [filteredLoans.length, pageSize]);
  
  const paginatedLoans = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLoans.slice(start, start + pageSize);
  }, [filteredLoans, currentPage, pageSize]);
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortField, sortOrder]);
  
  // Filter handlers
  const setSearchTerm = useCallback((term: string) => {
    setFilters(prev => ({ ...prev, searchTerm: term }));
  }, []);
  
  const setTypeFilter = useCallback((type: LoanType | 'all') => {
    setFilters(prev => ({ ...prev, type }));
  }, []);
  
  const setStatusFilter = useCallback((status: LoanStatus | 'all') => {
    setFilters(prev => ({ ...prev, status }));
  }, []);
  
  const setCategoryFilter = useCallback((category: LoanCategory | 'all') => {
    setFilters(prev => ({ ...prev, loanCategory: category }));
  }, []);
  
  const setDateRange = useCallback((from?: string, to?: string) => {
    setFilters(prev => ({ ...prev, dateFrom: from, dateTo: to }));
  }, []);
  
  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      type: 'all',
      status: 'all',
      loanCategory: 'all',
      dateFrom: undefined,
      dateTo: undefined
    });
  }, []);
  
  // Sort handlers
  const handleSetSortField = useCallback((field: LoanSortField) => {
    setSortField(field);
  }, []);
  
  const toggleSortOrder = useCallback(() => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);
  
  // Pagination handlers
  const setPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);
  
  const handleSetPageSize = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);
  
  // Selection handlers
  const toggleSelection = useCallback((id: string) => {
    setSelectedLoans(prev => 
      prev.includes(id) 
        ? prev.filter(loanId => loanId !== id)
        : [...prev, id]
    );
  }, []);
  
  const selectAll = useCallback(() => {
    const allIds = paginatedLoans.map(l => l.id);
    setSelectedLoans(allIds);
  }, [paginatedLoans]);
  
  const clearSelection = useCallback(() => {
    setSelectedLoans([]);
  }, []);
  
  // Delete handler
  const handleDelete = useCallback(async (id: string): Promise<boolean> => {
    try {
      const result = deleteLoan(id, loans, banks, setBanks);
      
      if (result.success) {
        const updatedLoans = loans.filter(l => l.id !== id);
        setLoans(updatedLoans);
        saveLoans(updatedLoans);
        toast.success('Loan deleted successfully');
        return true;
      } else {
        toast.error(result.error || 'Failed to delete loan');
        return false;
      }
    } catch (err) {
      toast.error('An error occurred while deleting');
      return false;
    }
  }, [loans, banks, setBanks]);
  
  // Bulk delete handler
  const handleBulkDelete = useCallback(async (): Promise<boolean> => {
    if (selectedLoans.length === 0) {
      toast.error('No loans selected');
      return false;
    }
    
    try {
      let updatedLoans = [...loans];
      let updatedBanks = [...banks];
      
      for (const id of selectedLoans) {
        const result = deleteLoan(id, updatedLoans, updatedBanks, (b) => { updatedBanks = b; });
        if (result.success) {
          updatedLoans = updatedLoans.filter(l => l.id !== id);
          if (result.updatedBanks) {
            updatedBanks = result.updatedBanks;
          }
        }
      }
      
      setLoans(updatedLoans);
      saveLoans(updatedLoans);
      setBanks(updatedBanks);
      setSelectedLoans([]);
      
      toast.success(`${selectedLoans.length} loans deleted successfully`);
      return true;
    } catch (err) {
      toast.error('An error occurred during bulk delete');
      return false;
    }
  }, [selectedLoans, loans, banks, setBanks]);
  
  // Export handler
  const handleExport = useCallback(() => {
    try {
      const csv = exportLoansToCSV(filteredLoans);
      const timestamp = new Date().toISOString().split('T')[0];
      downloadCSV(csv, `loans_export_${timestamp}.csv`);
      toast.success(`Exported ${filteredLoans.length} loans to CSV`);
    } catch (err) {
      toast.error('Failed to export loans');
    }
  }, [filteredLoans]);
  
  // Navigation handlers
  const navigateToCreate = useCallback(() => {
    navigate('/loans/create');
  }, [navigate]);
  
  const navigateToEdit = useCallback((id: string) => {
    navigate(`/loans/${id}/edit`);
  }, [navigate]);
  
  const navigateToView = useCallback((id: string) => {
    navigate(`/loans/${id}`);
  }, [navigate]);
  
  const navigateToPayment = useCallback((id: string) => {
    navigate(`/loans/${id}/payment`);
  }, [navigate]);
  
  // Stats
  const stats = useMemo(() => calculateStatistics(filteredLoans), [filteredLoans]);
  
  return {
    loans: paginatedLoans,
    filteredLoans,
    isLoading,
    error,
    filters,
    setSearchTerm,
    setTypeFilter,
    setStatusFilter,
    setCategoryFilter,
    setDateRange,
    clearFilters,
    sortField,
    sortOrder,
    setSortField: handleSetSortField,
    toggleSortOrder,
    currentPage,
    pageSize,
    totalPages,
    setPage,
    setPageSize: handleSetPageSize,
    selectedLoans,
    toggleSelection,
    selectAll,
    clearSelection,
    refreshData: loadData,
    handleDelete,
    handleBulkDelete,
    handleExport,
    navigateToCreate,
    navigateToEdit,
    navigateToView,
    navigateToPayment,
    totalCount: filteredLoans.length,
    totalAmount: stats.totalAmount
  };
};
