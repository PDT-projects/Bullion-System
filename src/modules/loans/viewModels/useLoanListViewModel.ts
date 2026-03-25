/**
 * Loans List ViewModel
 * Manages loan list state, filtering, sorting, pagination, and actions.
 * Backed by Firebase Firestore.
 *
 * Change: accepts an optional `defaultType` ('Payable' | 'Receivable').
 * When provided, the type filter is pre-set and locked so the list only
 * ever shows that specific loan type.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { Loan, LoanFilters, LoanSortField, SortOrder, LoanType, LoanStatus, LoanCategory } from '../models/types';
import { filterLoans, sortLoans, calculateStatistics, exportLoansToCSV, downloadCSV } from '../models/loanService';
import { LoanFirebaseService } from '../models/Loanfirebaseservice';

export function useLoanListViewModel(defaultType?: LoanType) {
  const navigate = useNavigate();

  // ==================== STATE ====================

  const [allLoans, setAllLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<LoanFilters>({
    searchTerm: '',
    type: defaultType ?? 'all',   // ← pre-set to the locked type if provided
    status: 'all',
    loanCategory: 'all',
    dateFrom: undefined,
    dateTo: undefined,
  });

  const [sortField, setSortField] = useState<LoanSortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedLoans, setSelectedLoans] = useState<string[]>([]);

  // ==================== DATA FETCHING ====================

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const loans = await LoanFirebaseService.fetchAllLoans();
      setAllLoans(loans);
      setSelectedLoans([]);
    } catch (err) {
      console.error('❌ Error loading loans:', err);
      setError('Failed to load loans. Please try again.');
      toast.error('Failed to load loans');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ==================== COMPUTED ====================

  const filteredAndSorted = useMemo(() => {
    const filtered = filterLoans(allLoans, filters);
    return sortLoans(filtered, sortField, sortOrder);
  }, [allLoans, filters, sortField, sortOrder]);

  const totalPages = useMemo(() =>
    Math.ceil(filteredAndSorted.length / pageSize) || 1,
  [filteredAndSorted.length, pageSize]);

  const paginatedLoans = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSorted.slice(start, start + pageSize);
  }, [filteredAndSorted, currentPage, pageSize]);

  const stats = useMemo(() => calculateStatistics(filteredAndSorted), [filteredAndSorted]);

  useEffect(() => { setCurrentPage(1); }, [filters, sortField, sortOrder]);

  // ==================== FILTER ACTIONS ====================

  const setSearchTerm = useCallback((term: string) =>
    setFilters(prev => ({ ...prev, searchTerm: term })), []);

  // When a defaultType is locked, ignore external attempts to change the type filter
  const setTypeFilter = useCallback((type: LoanType | 'all') => {
    if (defaultType) return; // locked — type filter is not user-changeable
    setFilters(prev => ({ ...prev, type }));
  }, [defaultType]);

  const setStatusFilter = useCallback((status: LoanStatus | 'all') =>
    setFilters(prev => ({ ...prev, status })), []);

  const setCategoryFilter = useCallback((loanCategory: LoanCategory | 'all') =>
    setFilters(prev => ({ ...prev, loanCategory })), []);

  const setDateRange = useCallback((from?: string, to?: string) =>
    setFilters(prev => ({ ...prev, dateFrom: from, dateTo: to })), []);

  // clearFilters resets everything EXCEPT the locked type
  const clearFilters = useCallback(() =>
    setFilters({
      searchTerm: '',
      type: defaultType ?? 'all',
      status: 'all',
      loanCategory: 'all',
    }), [defaultType]);

  // ==================== SORT ACTIONS ====================

  const handleSetSortField = useCallback((field: LoanSortField) => setSortField(field), []);
  const toggleSortOrder = useCallback(() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'), []);

  // ==================== PAGINATION ====================

  const setPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  }, [totalPages]);

  const handleSetPageSize = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  // ==================== SELECTION ====================

  const toggleSelection = useCallback((id: string) => {
    setSelectedLoans(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const selectAll = useCallback(() => {
    setSelectedLoans(paginatedLoans.map(l => l.id));
  }, [paginatedLoans]);

  const clearSelection = useCallback(() => setSelectedLoans([]), []);

  // ==================== CRUD ACTIONS ====================

  const handleDelete = useCallback(async (id: string): Promise<boolean> => {
    try {
      await LoanFirebaseService.deleteLoan(id);
      setAllLoans(prev => prev.filter(l => l.id !== id));
      toast.success('Loan deleted successfully');
      return true;
    } catch {
      toast.error('Failed to delete loan');
      return false;
    }
  }, []);

  const handleBulkDelete = useCallback(async (): Promise<boolean> => {
    if (selectedLoans.length === 0) { toast.error('No loans selected'); return false; }
    try {
      await Promise.all(selectedLoans.map(id => LoanFirebaseService.deleteLoan(id)));
      setAllLoans(prev => prev.filter(l => !selectedLoans.includes(l.id)));
      setSelectedLoans([]);
      toast.success(`${selectedLoans.length} loans deleted`);
      return true;
    } catch {
      toast.error('Failed to delete selected loans');
      return false;
    }
  }, [selectedLoans]);

  const handleExport = useCallback(() => {
    try {
      const csv = exportLoansToCSV(filteredAndSorted);
      downloadCSV(csv, `loans_export_${new Date().toISOString().split('T')[0]}.csv`);
      toast.success(`Exported ${filteredAndSorted.length} loans`);
    } catch {
      toast.error('Failed to export loans');
    }
  }, [filteredAndSorted]);

  // ==================== NAVIGATION ====================

  const navigateToCreate  = useCallback(() => navigate('/loans/create'), [navigate]);
  const navigateToEdit    = useCallback((id: string) => navigate(`/loans/${id}/edit`), [navigate]);
  const navigateToView    = useCallback((id: string) => navigate(`/loans/${id}`), [navigate]);
  const navigateToPayment = useCallback((id: string) => navigate(`/loans/${id}/payment`), [navigate]);

  // ==================== RETURN ====================

  return {
    loans: paginatedLoans,
    filteredLoans: filteredAndSorted,
    isLoading,
    error,
    filters,
    // expose whether the type is locked so the View can hide the Type dropdown
    isTypeLocked: !!defaultType,
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
    totalCount: filteredAndSorted.length,
    totalAmount: stats.totalAmount,
  };
}