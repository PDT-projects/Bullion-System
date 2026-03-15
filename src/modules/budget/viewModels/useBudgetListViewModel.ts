// Budget Module - ViewModel Layer
// List page logic and state management with Firebase Firestore

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Budget, BudgetFilters } from '../models/types';
import { BudgetService } from '../models/budgetService';
import { BudgetFirebaseService } from '../models/Budgetfirebaseservice';

interface UseBudgetListViewModelReturn {
  // Data
  budgets: Budget[];

  // Filters
  filters: BudgetFilters;
  showFilters: boolean;
  activeFilterCount: number;

  // View State
  viewBudget: Budget | null;
  isLoading: boolean;
  error: string | null;

  // Stats
  stats: {
    totalCount: number;
    totalBudget: number;
    totalSpent: number;
    remaining: number;
    alerts: number;
    onTrackCount: number;
    closeToLimitCount: number;
    overBudgetCount: number;
  };

  // Actions
  setFilter: (key: keyof BudgetFilters, value: any) => void;
  clearFilters: () => void;
  toggleFilters: () => void;
  setViewBudget: (budget: Budget | null) => void;
  handleEdit: (id: string) => void;
  handleDelete: (id: string) => void;
  handleAdd: () => void;
  refreshBudgets: () => Promise<void>;
  getBudgetStatus: (budget: Budget) => {
    status: 'On Track' | 'Close to Limit' | 'Over Budget';
    color: string;
    bgColor: string;
    percentage: number;
  };
}

export function useBudgetListViewModel(): UseBudgetListViewModelReturn {
  const navigate = useNavigate();

  // ==================== STATE ====================

  const [allBudgets, setAllBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<BudgetFilters>({
    subCategorySearch: '',
    periodFilter: '',
    minBudgetLimit: null,
    maxBudgetLimit: null,
    statusFilter: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [viewBudget, setViewBudget] = useState<Budget | null>(null);

  // ==================== DATA FETCHING ====================

  const fetchBudgets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔄 Fetching budgets from Firestore...');

      const fetched = await BudgetFirebaseService.fetchAllBudgets();
      setAllBudgets(fetched);

      console.log(`✅ Loaded ${fetched.length} budgets`);
    } catch (err) {
      console.error('❌ Error loading budgets:', err);
      setError('Failed to load budgets. Please try again.');
      toast.error('Failed to load budgets');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  // ==================== COMPUTED VALUES ====================

  const budgets = useMemo(() => {
    return BudgetService.filterBudgets(allBudgets, filters);
  }, [allBudgets, filters]);

  const stats = useMemo(() => {
    return BudgetService.calculateStats(budgets);
  }, [budgets]);

  const activeFilterCount = useMemo(() => {
    return BudgetService.countActiveFilters(filters);
  }, [filters]);

  // ==================== ACTIONS ====================

  const setFilter = useCallback((key: keyof BudgetFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      subCategorySearch: '',
      periodFilter: '',
      minBudgetLimit: null,
      maxBudgetLimit: null,
      statusFilter: ''
    });
  }, []);

  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  const handleEdit = useCallback((id: string) => {
    navigate(`/budgets/${id}/edit`);
  }, [navigate]);

  const handleDelete = useCallback((id: string) => {
    navigate(`/budgets/${id}/delete`);
  }, [navigate]);

  const handleAdd = useCallback(() => {
    navigate('/budgets/create');
  }, [navigate]);

  const refreshBudgets = useCallback(async () => {
    await fetchBudgets();
    toast.success('Budget list refreshed');
  }, [fetchBudgets]);

  const getBudgetStatus = useCallback((budget: Budget) => {
    return BudgetService.getBudgetStatus(budget);
  }, []);

  // ==================== RETURN ====================

  return {
    budgets,
    filters,
    showFilters,
    activeFilterCount,
    viewBudget,
    isLoading,
    error,
    stats: {
      totalCount: stats.totalCount,
      totalBudget: stats.totalBudget,
      totalSpent: stats.totalSpent,
      remaining: stats.remaining,
      alerts: stats.alerts,
      onTrackCount: stats.onTrackCount,
      closeToLimitCount: stats.closeToLimitCount,
      overBudgetCount: stats.overBudgetCount
    },
    setFilter,
    clearFilters,
    toggleFilters,
    setViewBudget,
    handleEdit,
    handleDelete,
    handleAdd,
    refreshBudgets,
    getBudgetStatus
  };
}