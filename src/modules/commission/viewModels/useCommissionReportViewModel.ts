// Commission Report ViewModel

import { useState, useEffect, useCallback } from 'react';
import type { Commission, CommissionFilter, CommissionStats } from '../models/types';
import {
  getAllCommissions,
  filterCommissions,
  getCommissionStats,
  formatCurrency,
  formatMonth,
  exportCommissionsToCSV
} from '../models/commissionService';

interface UseCommissionReportViewModelReturn {
  // Data
  commissions: Commission[];
  filteredCommissions: Commission[];
  isLoading: boolean;
  
  // Filters
  filters: CommissionFilter;
  setFilters: (filters: CommissionFilter) => void;
  updateFilter: (key: keyof CommissionFilter, value: string) => void;
  clearFilters: () => void;
  activeFilterCount: number;
  
  // UI state
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  
  // Stats
  stats: CommissionStats;
  
  // Actions
  refreshCommissions: () => void;
  exportToCSV: () => string;
  
  // Utils
  formatCurrency: (amount: number) => string;
  formatMonth: (monthStr: string) => string;
}

const initialFilters: CommissionFilter = {
  salesperson: '',
  city: '',
  month: '',
  status: undefined
};


export function useCommissionReportViewModel(): UseCommissionReportViewModelReturn {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [filteredCommissions, setFilteredCommissions] = useState<Commission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<CommissionFilter>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);

  // Load commissions
  const loadCommissions = useCallback(() => {
    setIsLoading(true);
    try {
      const data = getAllCommissions();
      setCommissions(data);
      setFilteredCommissions(data);
    } catch (error) {
      console.error('Error loading commissions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadCommissions();
  }, [loadCommissions]);

  // Apply filters
  useEffect(() => {
    if (Object.values(filters).every(v => !v)) {
      setFilteredCommissions(commissions);
    } else {
      const filtered = filterCommissions(filters);
      setFilteredCommissions(filtered);
    }
  }, [filters, commissions]);

  // Update single filter
  const updateFilter = useCallback((key: keyof CommissionFilter, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  // Calculate active filter count
  const activeFilterCount = Object.values(filters).filter(value => value !== '').length;

  // Refresh commissions
  const refreshCommissions = useCallback(() => {
    loadCommissions();
  }, [loadCommissions]);

  // Export to CSV
  const exportToCSV = useCallback(() => {
    return exportCommissionsToCSV(filteredCommissions);
  }, [filteredCommissions]);

  // Calculate stats
  const stats: CommissionStats = getCommissionStats(filteredCommissions);

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
