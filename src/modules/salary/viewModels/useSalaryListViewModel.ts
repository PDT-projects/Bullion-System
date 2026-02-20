// Salary Module - ViewModel Layer
// List page logic and state management

import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Salary, SalaryFilters } from '../models/types';
import { SalaryService } from '../models/salaryService';

interface SalaryContext {
  transactions: any[];
  setTransactions: (transactions: any[]) => void;
  employees: any[];
  banks: any[];
  setBanks: (banks: any[]) => void;
}

interface UseSalaryListViewModelReturn {
  // Data
  salaries: Salary[];
  allSalaries: Salary[];
  
  // Filters
  filters: SalaryFilters;
  showFilters: boolean;
  activeFilterCount: number;
  
  // View State
  viewingSalary: Salary | null;
  
  // Stats
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
  
  // Lists for filters
  uniqueEmployees: { id: string; name: string }[];
  uniqueMonths: string[];
  
  // Actions
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
  const { transactions, setTransactions, employees, banks, setBanks } = useOutletContext<SalaryContext>();

  // Filter salary transactions from all transactions
  // Salary transactions can have mainCategory as 'Cash Outflow' with subCategory containing 'salary'
  const allSalaries = useMemo(() => {
    return transactions.filter((t: any) => {
      // Check if mainCategory is 'Salary' OR if it's 'Cash Outflow' with salary-related subCategory
      if (t.mainCategory === 'Salary') return true;
      if (t.mainCategory === 'Cash Outflow' && t.subCategory && 
          (t.subCategory.toLowerCase().includes('salary') || 
           t.subCategory.toLowerCase() === 'advance salary')) return true;
      return false;
    }) as Salary[];
  }, [transactions]);

  // State
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

  // Computed
  const salaries = useMemo(() => {
    return SalaryService.filterSalaries(allSalaries, filters);
  }, [allSalaries, filters]);

  const stats = useMemo(() => {
    return SalaryService.calculateStats(salaries);
  }, [salaries]);

  const activeFilterCount = useMemo(() => {
    return SalaryService.countActiveFilters(filters);
  }, [filters]);

  const uniqueEmployees = useMemo(() => {
    return SalaryService.getUniqueEmployees(allSalaries);
  }, [allSalaries]);

  const uniqueMonths = useMemo(() => {
    return SalaryService.getUniqueMonths(allSalaries);
  }, [allSalaries]);

  // Actions
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

  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  const handleDelete = useCallback((id: string) => {
    const salaryToDelete = SalaryService.findById(allSalaries, id);
    if (!salaryToDelete) return;

    if (confirm('Are you sure you want to delete this salary record?')) {
      // Reverse bank transaction if it was a bank payment
      if ((salaryToDelete.mode === 'Bank' || salaryToDelete.mode === 'Cheque') && salaryToDelete.bankName && setBanks) {
        const updatedBanks = banks.map((bank: any) => {
          if (bank.name === salaryToDelete.bankName) {
            return { ...bank, balance: bank.balance + salaryToDelete.amount };
          }
          return bank;
        });
        setBanks(updatedBanks);
      }

      const updatedTransactions = transactions.filter((t: any) => t.id !== id);
      setTransactions(updatedTransactions);
    }
  }, [allSalaries, transactions, setTransactions, banks, setBanks]);

  const handleAdd = useCallback((type: 'regular' | 'advance') => {
    if (type === 'regular') {
      navigate('/salary/create-regular');
    } else {
      navigate('/salary/create-advance');
    }
  }, [navigate]);

  const handleEdit = useCallback((id: string) => {
    navigate(`/salary/${id}/edit`);
  }, [navigate]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const getSalaryTypeColor = useCallback((subCategory: string) => {
    return SalaryService.getSalaryTypeColor(subCategory);
  }, []);

  const getEmployeeTotalPaid = useCallback((employeeId: string, month: string) => {
    return SalaryService.getEmployeeTotalPaid(allSalaries, employeeId, month);
  }, [allSalaries]);

  const isEmployeeFullyPaid = useCallback((employeeId: string, month: string, fullSalary: number) => {
    return SalaryService.isEmployeeFullyPaid(allSalaries, employeeId, month, fullSalary);
  }, [allSalaries]);

  return {
    salaries,
    allSalaries,
    filters,
    showFilters,
    activeFilterCount,
    viewingSalary,
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
