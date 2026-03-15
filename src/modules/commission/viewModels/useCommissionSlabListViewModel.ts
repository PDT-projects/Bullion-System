// Commission Slab List ViewModel — fetches from Firestore

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type { CommissionSlab, CommissionSlabFilter } from '../models/types';
import { filterCommissionSlabs, formatCurrency } from '../models/commissionService';
import { CommissionFirebaseService } from '../models/Commissionfirebaseservice';

interface UseCommissionSlabListViewModelReturn {
  slabs: CommissionSlab[];
  filteredSlabs: CommissionSlab[];
  isLoading: boolean;
  filter: CommissionSlabFilter;
  setFilter: (filter: CommissionSlabFilter) => void;
  clearFilters: () => void;
  refreshSlabs: () => void;
  handleDelete: (id: string) => void;
  totalSlabs: number;
  getSalespersonName: (salespersonId: string, employees: any[]) => string;
  formatCurrency: (amount: number) => string;
}

export function useCommissionSlabListViewModel(): UseCommissionSlabListViewModelReturn {
  const [slabs, setSlabs] = useState<CommissionSlab[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<CommissionSlabFilter>({});

  const loadSlabs = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await CommissionFirebaseService.fetchAllSlabs();
      setSlabs(data);
    } catch (error) {
      console.error('Error loading slabs:', error);
      toast.error('Failed to load commission slabs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadSlabs(); }, [loadSlabs]);

  const filteredSlabs = useMemo(
    () => filterCommissionSlabs(slabs, filter),
    [slabs, filter]
  );

  const clearFilters = useCallback(() => setFilter({}), []);
  const refreshSlabs = useCallback(() => loadSlabs(), [loadSlabs]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this commission slab?')) return;
    try {
      await CommissionFirebaseService.deleteSlab(id);
      setSlabs(prev => prev.filter(s => s.id !== id));
      toast.success('Commission slab deleted');
    } catch (error) {
      toast.error('Failed to delete commission slab');
    }
  }, []);

  const getSalespersonName = useCallback(
    (salespersonId: string, employees: any[]) =>
      employees.find(e => e.id === salespersonId)?.name || salespersonId,
    []
  );

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