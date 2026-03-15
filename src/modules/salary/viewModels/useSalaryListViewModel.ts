// Salary Module - ViewModel Layer
// List page logic — fetches directly from Firestore

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Salary, SalaryFilters } from '../models/types';
import { SalaryService } from '../models/salaryService';
import { SalaryFirebaseService } from '../models/salaryFirebaseService';

interface UseSalaryListViewModelReturn {
  salaries: Salary[];
  allSalaries: Salary[];
  filters: SalaryFilters;
  showFilters: boolean;
  activeFilterCount: number;
  viewingSalary: Salary | null;
  isLoading: boolean;
  stats: {
    totalRecords: number;
    totalAmount: number;
    regularCount: number;
    regularTotal: number;
    advanceCount: number;
    advanceTotal: number;
    thisMonthTotal: number;
    pendingSlips: number;
  };
  uniqueEmployees: { id: string; name: string }[];
  uniqueMonths: string[];
  setFilter: (key: keyof SalaryFilters, value: any) => void;
  clearFilters: () => void;
  toggleFilters: () => void;
  setViewingSalary: (salary: Salary | null) => void;
  handleDelete: (id: string) => void;
  handleAdd: (type: 'regular' | 'advance') => void;
  handlePrint: (salary: Salary) => void;
  handleEdit: (id: string) => void;
  getSalaryTypeColor: (subCategory: string) => string;
  getEmployeeTotalPaid: (employeeId: string, month: string) => number;
  isEmployeeFullyPaid: (employeeId: string, month: string, fullSalary: number) => boolean;
}

export function useSalaryListViewModel(): UseSalaryListViewModelReturn {
  const navigate = useNavigate();

  const [allSalaries, setAllSalaries] = useState<Salary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<SalaryFilters>({
    searchTerm: '',
    typeFilter: 'all',
    dateFrom: null,
    dateTo: null,
    employeeFilter: '',
    monthFilter: '',
    paymentMethodFilter: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [viewingSalary, setViewingSalary] = useState<Salary | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await SalaryFirebaseService.fetchAllSalaries();
        setAllSalaries(data);
      } catch (error) {
        console.error('❌ Error loading salaries:', error);
        toast.error('Failed to load salary records');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const salaries = useMemo(
    () => SalaryService.filterSalaries(allSalaries, filters),
    [allSalaries, filters]
  );

  const stats = useMemo(() => SalaryService.calculateStats(salaries), [salaries]);
  const activeFilterCount = useMemo(
    () => SalaryService.countActiveFilters(filters),
    [filters]
  );
  const uniqueEmployees = useMemo(
    () => SalaryService.getUniqueEmployees(allSalaries),
    [allSalaries]
  );
  const uniqueMonths = useMemo(
    () => SalaryService.getUniqueMonths(allSalaries),
    [allSalaries]
  );

  const setFilter = useCallback((key: keyof SalaryFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      typeFilter: 'all',
      dateFrom: null,
      dateTo: null,
      employeeFilter: '',
      monthFilter: '',
      paymentMethodFilter: ''
    });
  }, []);

  const toggleFilters = useCallback(() => setShowFilters(prev => !prev), []);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this salary record?')) return;
    try {
      await SalaryFirebaseService.deleteSalary(id);
      setAllSalaries(prev => prev.filter(s => s.id !== id));
      toast.success('Salary record deleted successfully');
    } catch (error) {
      toast.error('Failed to delete salary record');
    }
  }, []);

  const handleAdd = useCallback((type: 'regular' | 'advance') => {
    navigate(type === 'regular' ? '/salary/create-regular' : '/salary/create-advance');
  }, [navigate]);

  const handleEdit = useCallback((id: string) => {
    navigate(`/salary/${id}/edit`);
  }, [navigate]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const getSalaryTypeColor = useCallback(
    (subCategory: string) => SalaryService.getSalaryTypeColor(subCategory),
    []
  );

  const getEmployeeTotalPaid = useCallback(
    (employeeId: string, month: string) =>
      SalaryService.getEmployeeTotalPaid(allSalaries, employeeId, month),
    [allSalaries]
  );

  const isEmployeeFullyPaid = useCallback(
    (employeeId: string, month: string, fullSalary: number) =>
      SalaryService.isEmployeeFullyPaid(allSalaries, employeeId, month, fullSalary),
    [allSalaries]
  );

  return {
    salaries,
    allSalaries,
    filters,
    showFilters,
    activeFilterCount,
    viewingSalary,
    isLoading,
    stats: {
      totalRecords: stats.totalRecords,
      totalAmount: stats.totalAmount,
      regularCount: stats.regularCount,
      regularTotal: stats.regularTotal,
      advanceCount: stats.advanceCount,
      advanceTotal: stats.advanceTotal,
      thisMonthTotal: stats.thisMonthTotal,
      pendingSlips: stats.pendingSlips
    },
    uniqueEmployees,
    uniqueMonths,
    setFilter,
    clearFilters,
    toggleFilters,
    setViewingSalary,
    handleDelete,
    handleAdd,
    handlePrint,
    handleEdit,
    getSalaryTypeColor,
    getEmployeeTotalPaid,
    isEmployeeFullyPaid
  };
}