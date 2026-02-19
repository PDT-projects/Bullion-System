// Commission Slab List ViewModel

import { useState, useEffect, useCallback } from 'react';
import type { CommissionSlab, CommissionSlabFilter } from '../models/types';
import {
  getAllCommissionSlabs,
  filterCommissionSlabs,
  deleteCommissionSlab,
  getCommissionStats,
  formatCurrency
} from '../models/commissionService';

interface UseCommissionSlabListViewModelReturn {
  // Data
  slabs: CommissionSlab[];
  filteredSlabs: CommissionSlab[];
  isLoading: boolean;
  
  // Filters
  filter: CommissionSlabFilter;
  setFilter: (filter: CommissionSlabFilter) => void;
  clearFilters: () => void;
  
  // Actions
  refreshSlabs: () => void;
  handleDelete: (id: string) => boolean;
  
  // Stats
  totalSlabs: number;
  
  // Utils
  getSalespersonName: (salespersonId: string, employees: any[]) => string;
  formatCurrency: (amount: number) => string;
}

export function useCommissionSlabListViewModel(): UseCommissionSlabListViewModelReturn {
  const [slabs, setSlabs] = useState<CommissionSlab[]>([]);
  const [filteredSlabs, setFilteredSlabs] = useState<CommissionSlab[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<CommissionSlabFilter>({});

  // Load slabs
  const loadSlabs = useCallback(() => {
    setIsLoading(true);
    try {
      const data = getAllCommissionSlabs();
      setSlabs(data);
      setFilteredSlabs(data);
    } catch (error) {
      console.error('Error loading commission slabs:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadSlabs();
  }, [loadSlabs]);

  // Apply filters
  useEffect(() => {
    if (Object.keys(filter).length === 0) {
      setFilteredSlabs(slabs);
    } else {
      const filtered = filterCommissionSlabs(filter);
      setFilteredSlabs(filtered);
    }
  }, [filter, slabs]);

  // Refresh slabs
  const refreshSlabs = useCallback(() => {
    loadSlabs();
  }, [loadSlabs]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilter({});
  }, []);

  // Handle delete
  const handleDelete = useCallback((id: string): boolean => {
    try {
      deleteCommissionSlab(id);
      refreshSlabs();
      return true;
    } catch (error) {
      console.error('Error deleting commission slab:', error);
      return false;
    }
  }, [refreshSlabs]);

  // Get salesperson name
  const getSalespersonName = useCallback((salespersonId: string, employees: any[]): string => {
    const employee = employees.find(emp => emp.id === salespersonId);
    return employee ? employee.name : salespersonId;
  }, []);

  return {
    slabs,
    filteredSlabs,
    isLoading,
    filter,
    setFilter,
    clearFilters,
    refreshSlabs,
    handleDelete,
    totalSlabs: slabs.length,
    getSalespersonName,
    formatCurrency
  };
}
