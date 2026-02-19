// Bills Module - ViewModel Layer
// List page logic and state management

import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Bill, BillFilters } from '../models/types';
import { BillsService } from '../models/billsService';

interface BillsContext {
  transactions: any[];
  setTransactions: (transactions: any[]) => void;
  banks: any[];
  setBanks: (banks: any[]) => void;
}

interface UseBillsListViewModelReturn {
  // Data
  bills: Bill[];
  allBills: Bill[];
  
  // Filters
  filters: BillFilters;
  showFilters: boolean;
  activeFilterCount: number;
  
  // View State
  viewingBill: Bill | null;
  viewingSlip: Bill | null;
  
  // Stats
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
  
  // Actions
  setFilter: (key: keyof BillFilters, value: any) => void;
  clearFilters: () => void;
  toggleFilters: () => void;
  setViewingBill: (bill: Bill | null) => void;
  setViewingSlip: (bill: Bill | null) => void;
  handleDelete: (id: string) => void;
  handleAdd: () => void;
  handlePrint: (bill: Bill) => void;
  getCategoryColor: (category: string) => string;
  getCategoryIconName: (category: string) => 'Zap' | 'Wifi' | 'Droplets' | 'Receipt';
}

export function useBillsListViewModel(): UseBillsListViewModelReturn {
  const navigate = useNavigate();
  const { transactions, setTransactions, banks, setBanks } = useOutletContext<BillsContext>();

  // Filter bills from all transactions
  const allBills = useMemo(() => {
    return transactions.filter((t: any) => t.mainCategory === 'Bills') as Bill[];
  }, [transactions]);

  // State
  const [filters, setFilters] = useState<BillFilters>({
    searchTerm: '',
    categoryFilter: 'all',
    dateFrom: null,
    dateTo: null,
    paymentMethodFilter: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [viewingBill, setViewingBill] = useState<Bill | null>(null);
  const [viewingSlip, setViewingSlip] = useState<Bill | null>(null);

  // Computed
  const bills = useMemo(() => {
    return BillsService.filterBills(allBills, filters);
  }, [allBills, filters]);

  const stats = useMemo(() => {
    return BillsService.calculateStats(bills);
  }, [bills]);

  const activeFilterCount = useMemo(() => {
    return BillsService.countActiveFilters(filters);
  }, [filters]);

  // Actions
  const setFilter = useCallback((key: keyof BillFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      categoryFilter: 'all',
      dateFrom: null,
      dateTo: null,
      paymentMethodFilter: ''
    });
  }, []);

  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  const handleDelete = useCallback((id: string) => {
    const billToDelete = BillsService.findById(allBills, id);
    if (!billToDelete) return;

    if (confirm('Are you sure you want to delete this bill?')) {
      // Reverse bank transaction if it was a bank payment
      if ((billToDelete.mode === 'Bank' || billToDelete.mode === 'Cheque') && billToDelete.bankName && setBanks) {
        const updatedBanks = banks.map((bank: any) => {
          if (bank.name === billToDelete.bankName) {
            return { ...bank, balance: bank.balance + billToDelete.amount };
          }
          return bank;
        });
        setBanks(updatedBanks);
      }

      const updatedTransactions = transactions.filter((t: any) => t.id !== id);
      setTransactions(updatedTransactions);
    }
  }, [allBills, transactions, setTransactions, banks, setBanks]);

  const handleAdd = useCallback(() => {
    navigate('/bills/create');
  }, [navigate]);

  const handlePrint = useCallback((bill: Bill) => {
    window.print();
  }, []);

  const getCategoryColor = useCallback((category: string) => {
    return BillsService.getCategoryColor(category);
  }, []);

  const getCategoryIconName = useCallback((category: string) => {
    return BillsService.getCategoryIconName(category);
  }, []);

  return {
    bills,
    allBills,
    filters,
    showFilters,
    activeFilterCount,
    viewingBill,
    viewingSlip,
    stats: {
      totalBills: stats.totalBills,
      totalAmount: stats.totalAmount,
      electricityCount: stats.electricityCount,
      electricityTotal: stats.electricityTotal,
      internetCount: stats.internetCount,
      internetTotal: stats.internetTotal,
      utilitiesCount: stats.utilitiesCount,
      utilitiesTotal: stats.utilitiesTotal
    },
    setFilter,
    clearFilters,
    toggleFilters,
    setViewingBill,
    setViewingSlip,
    handleDelete,
    handleAdd,
    handlePrint,
    getCategoryColor,
    getCategoryIconName
  };
}
