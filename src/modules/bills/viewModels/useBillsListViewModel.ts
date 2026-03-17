// Bills Module - ViewModel Layer
// List page logic — fetches directly from Firestore

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Bill, BillFilters } from '../models/types';
import { BillsService } from '../models/billsService';
import { BillsFirebaseService } from '../models/Billsfirebaseservice';

interface UseBillsListViewModelReturn {
  bills: Bill[];
  allBills: Bill[];
  filters: BillFilters;
  showFilters: boolean;
  activeFilterCount: number;
  viewingBill: Bill | null;
  viewingSlip: Bill | null;
  isLoading: boolean;
  stats: {
    totalBills: number;
    totalAmount: number;
    electricityCount: number;
    electricityTotal: number;
    internetCount: number;
    internetTotal: number;
    utilitiesCount: number;
    utilitiesTotal: number;
  };
  setFilter: (key: keyof BillFilters, value: any) => void;
  clearFilters: () => void;
  toggleFilters: () => void;
  setViewingBill: (bill: Bill | null) => void;
  setViewingSlip: (bill: Bill | null) => void;
  handleDelete: (id: string) => void;
  handleAdd: () => void;
  handleEdit: (id: string) => void;         // ← new
  handlePrint: (bill: Bill) => void;
  getCategoryColor: (category: string) => string;
  getCategoryIconName: (category: string) => 'Zap' | 'Wifi' | 'Droplets' | 'Receipt';
}

export function useBillsListViewModel(): UseBillsListViewModelReturn {
  const navigate = useNavigate();

  const [allBills,  setAllBills]  = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters,   setFilters]   = useState<BillFilters>({
    searchTerm:          '',
    categoryFilter:      'all',
    dateFrom:            null,
    dateTo:              null,
    paymentMethodFilter: '',
  });
  const [showFilters,  setShowFilters]  = useState(false);
  const [viewingBill,  setViewingBill]  = useState<Bill | null>(null);
  const [viewingSlip,  setViewingSlip]  = useState<Bill | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await BillsFirebaseService.fetchAllBills();
        setAllBills(data);
      } catch (error) {
        console.error('❌ Error loading bills:', error);
        toast.error('Failed to load bills');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const bills = useMemo(
    () => BillsService.filterBills(allBills, filters),
    [allBills, filters]
  );

  const stats = useMemo(() => BillsService.calculateStats(bills), [bills]);
  const activeFilterCount = useMemo(
    () => BillsService.countActiveFilters(filters),
    [filters]
  );

  const setFilter = useCallback((key: keyof BillFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm:          '',
      categoryFilter:      'all',
      dateFrom:            null,
      dateTo:              null,
      paymentMethodFilter: '',
    });
  }, []);

  const toggleFilters = useCallback(() => setShowFilters(prev => !prev), []);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this bill?')) return;
    try {
      await BillsFirebaseService.deleteBill(id);
      setAllBills(prev => prev.filter(b => b.id !== id));
      toast.success('Bill deleted successfully');
    } catch {
      toast.error('Failed to delete bill');
    }
  }, []);

  const handleAdd  = useCallback(() => navigate('/bills/create'), [navigate]);
  // ── NEW: navigate to edit route ──────────────────────────────────────────
  const handleEdit = useCallback((id: string) => navigate(`/bills/${id}/edit`), [navigate]);
  const handlePrint = useCallback(() => window.print(), []);

  const getCategoryColor    = useCallback((c: string) => BillsService.getCategoryColor(c),    []);
  const getCategoryIconName = useCallback((c: string) => BillsService.getCategoryIconName(c), []);

  return {
    bills,
    allBills,
    filters,
    showFilters,
    activeFilterCount,
    viewingBill,
    viewingSlip,
    isLoading,
    stats: {
      totalBills:        stats.totalBills,
      totalAmount:       stats.totalAmount,
      electricityCount:  stats.electricityCount,
      electricityTotal:  stats.electricityTotal,
      internetCount:     stats.internetCount,
      internetTotal:     stats.internetTotal,
      utilitiesCount:    stats.utilitiesCount,
      utilitiesTotal:    stats.utilitiesTotal,
    },
    setFilter,
    clearFilters,
    toggleFilters,
    setViewingBill,
    setViewingSlip,
    handleDelete,
    handleAdd,
    handleEdit,
    handlePrint,
    getCategoryColor,
    getCategoryIconName,
  };
}