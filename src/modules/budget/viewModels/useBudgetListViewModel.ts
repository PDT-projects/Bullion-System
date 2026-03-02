// Budget Module - ViewModel Layer
// List page logic and state management with Firebase Data Connect

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Budget, BudgetFilters } from '../models/types';
import { BudgetService } from '../models/budgetService';

interface BudgetContext {
  budgets: Budget[];
  setBudgets: (budgets: Budget[]) => void;
}

interface UseBudgetListViewModelReturn {
  // Data
  budgets: Budget[];
  allBudgets: Budget[];
  
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
  const { budgets: allBudgets, setBudgets } = useOutletContext<BudgetContext>();

  // State
  const [filters, setFilters] = useState<BudgetFilters>({
    subCategorySearch: '',
    periodFilter: '',
    minBudgetLimit: null,
    maxBudgetLimit: null,
    statusFilter: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [viewBudget, setViewBudget] = useState<Budget | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch budgets from Data Connect on mount
  useEffect(() => {
    const fetchBudgets = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log('📡 Fetching budgets from Data Connect...');
        const fetchedBudgets = await BudgetService.fetchBudgetsFromDataConnect();
        setBudgets(fetchedBudgets);
        console.log(`✅ Loaded ${fetchedBudgets.length} budgets from Data Connect`);
      } catch (err) {
        console.error('Error fetching budgets:', err);
        setError('Failed to load budgets from database');
        // Fall back to local data if Data Connect fails
        if (allBudgets.length === 0) {
          console.log('Using local data as fallback');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchBudgets();
  }, []);

  // Computed
  const budgets = useMemo(() => {
    return BudgetService.filterBudgets(allBudgets, filters);
  }, [allBudgets, filters]);

  const stats = useMemo(() => {
    return BudgetService.calculateStats(budgets);
  }, [budgets]);

  const activeFilterCount = useMemo(() => {
    return BudgetService.countActiveFilters(filters);
  }, [filters]);

  // Refresh budgets from Data Connect
  const refreshBudgets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('📡 Refreshing budgets from Data Connect...');
      const fetchedBudgets = await BudgetService.fetchBudgetsFromDataConnect();
      setBudgets(fetchedBudgets);
      console.log(`✅ Refreshed ${fetchedBudgets.length} budgets from Data Connect`);
    } catch (err) {
      console.error('Error refreshing budgets:', err);
      setError('Failed to refresh budgets from database');
    } finally {
      setIsLoading(false);
    }
  }, [setBudgets]);

  // Actions
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

  const getBudgetStatus = useCallback((budget: Budget) => {
    return BudgetService.getBudgetStatus(budget);
  }, []);

  return {
    budgets,
    allBudgets,
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
