// Commission Report ViewModel — fetches from Firestore

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type { Commission, CommissionFilter, CommissionStats } from '../models/types';
import {
  filterCommissions,
  getCommissionStats,
  formatCurrency,
  formatMonth,
  exportCommissionsToCSV
} from '../models/commissionService';
import { CommissionFirebaseService } from '../models/Commissionfirebaseservice';

const initialFilters: CommissionFilter = {
  salesperson: '',
  city: '',
  month: '',
  status: undefined
};

interface UseCommissionReportViewModelReturn {
  commissions: Commission[];
  filteredCommissions: Commission[];
  isLoading: boolean;
  filters: CommissionFilter;
  setFilters: (filters: CommissionFilter) => void;
  updateFilter: (key: keyof CommissionFilter, value: string) => void;
  clearFilters: () => void;
  activeFilterCount: number;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  stats: CommissionStats;
  refreshCommissions: () => void;
  exportToCSV: () => string;
  formatCurrency: (amount: number) => string;
  formatMonth: (monthStr: string) => string;
}

export function useCommissionReportViewModel(): UseCommissionReportViewModelReturn {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<CommissionFilter>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);

  const loadCommissions = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await CommissionFirebaseService.fetchAllCommissions();
      setCommissions(data);
    } catch (error) {
      console.error('Error loading commissions:', error);
      toast.error('Failed to load commission records');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadCommissions(); }, [loadCommissions]);

  const filteredCommissions = useMemo(
    () => filterCommissions(commissions, filters),
    [commissions, filters]
  );

  const updateFilter = useCallback((key: keyof CommissionFilter, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => setFilters(initialFilters), []);

  const activeFilterCount = Object.values(filters).filter(v => v !== '' && v !== undefined).length;

  const refreshCommissions = useCallback(() => loadCommissions(), [loadCommissions]);

  const exportToCSV = useCallback(
    () => exportCommissionsToCSV(filteredCommissions),
    [filteredCommissions]
  );

  const stats = useMemo(
    () => getCommissionStats(filteredCommissions),
    [filteredCommissions]
  );

  return {
    commissions,
    filteredCommissions,
    isLoading,
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    activeFilterCount,
    showFilters,
    setShowFilters,
    stats,
    refreshCommissions,
    exportToCSV,
    formatCurrency,
    formatMonth
  };
}