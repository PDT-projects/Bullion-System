// Banking Module - Cash List ViewModel
// Manages state and logic for cash transaction list page with Firebase integration

import { useState, useMemo, useCallback, useEffect } from 'react';
import { CashTransaction, CashStats, CashFilters } from '../models/types';
import { BankingService } from '../models/bankingService';
import { CashFirebaseService, CashInHandRecord } from '../models/cashFirebaseService';

interface UseCashListViewModelProps {
  cashTransactions: CashTransaction[];
  setCashTransactions: (transactions: CashTransaction[]) => void;
  openingBalance?: number;
  setOpeningBalance?: (balance: number) => void;
}

interface UseCashListViewModelReturn {
  // Data
  transactions: CashTransaction[];
  filteredTransactions: CashTransaction[];
  stats: CashStats;
  cashRecords: CashInHandRecord[];
  
  // Loading State
  isLoading: boolean;
  error: string | null;
  
  // Filters
  filters: CashFilters;
  setSearchTerm: (term: string) => void;
  setFilterType: (type: 'all' | 'inflow' | 'outflow') => void;
  
  // Actions
  handleDeleteTransaction: (id: string) => void;
  handleSetOpeningBalance: (amount: number) => Promise<void>;
  refreshCashData: () => Promise<void>;
  updateCashBalance: (recordId: string, newBalance: number) => Promise<void>;
  
  // Utils
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
}


export function useCashListViewModel({
  cashTransactions,
  setCashTransactions,
  openingBalance = 0,
  setOpeningBalance
}: UseCashListViewModelProps): UseCashListViewModelReturn {
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cash records from Firebase
  const [cashRecords, setCashRecords] = useState<CashInHandRecord[]>([]);
  
  // Filters state
  const [filters, setFilters] = useState<CashFilters>({
    searchTerm: '',
    filterType: 'all'
  });

  // Fetch cash records from Firebase on mount
  useEffect(() => {
    fetchCashData();
  }, []);

  // Fetch cash data from Firebase
  const fetchCashData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch cash records from Firebase
      const records = await CashFirebaseService.fetchAllCashRecords();
      setCashRecords(records);
      
      // Calculate total cash balance from all locations
      const totalCashBalance = records.reduce((sum, record) => sum + record.balance, 0);
      
      // Update opening balance if setter provided
      if (setOpeningBalance) {
        setOpeningBalance(totalCashBalance);
      }
      
      console.log(`✅ Fetched ${records.length} cash records, total balance: ${totalCashBalance}`);
    } catch (err) {
      console.error('Error fetching cash records:', err);
      setError('Failed to load cash records from database');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh cash data (public method)
  const refreshCashData = useCallback(async (): Promise<void> => {
    await fetchCashData();
  }, [setOpeningBalance]);


  // Update cash balance in Firebase
  const updateCashBalance = useCallback(async (recordId: string, newBalance: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Update in Firebase
      await CashFirebaseService.updateCashBalance(recordId, newBalance, 'System');
      
      // Refresh data
      await fetchCashData();
      
      console.log('✅ Cash balance updated successfully');
    } catch (err) {
      console.error('Error updating cash balance:', err);
      setError('Failed to update cash balance');
      alert('Failed to update cash balance. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return BankingService.filterCashTransactions(
      cashTransactions,
      filters.searchTerm,
      filters.filterType
    );
  }, [cashTransactions, filters.searchTerm, filters.filterType]);

  // Calculate statistics
  const stats = useMemo(() => {
    return BankingService.calculateCashStats(cashTransactions, openingBalance);
  }, [cashTransactions, openingBalance]);


  // Set search term
  const setSearchTerm = useCallback((term: string) => {
    setFilters(prev => ({ ...prev, searchTerm: term }));
  }, []);

  // Set filter type
  const setFilterType = useCallback((type: 'all' | 'inflow' | 'outflow') => {
    setFilters(prev => ({ ...prev, filterType: type }));
  }, []);

  // Delete transaction
  const handleDeleteTransaction = useCallback((id: string) => {
    const txnToDelete = cashTransactions.find(t => t.id === id);
    if (!txnToDelete) return;

    if (confirm(`Are you sure you want to delete this ${txnToDelete.mainCategory.toLowerCase()} transaction?`)) {
      setCashTransactions(cashTransactions.filter(t => t.id !== id));
    }
  }, [cashTransactions, setCashTransactions]);

  // Set opening balance - saves to Firebase
  const handleSetOpeningBalance = useCallback(async (amount: number): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if there's already a cash record for "Head Office" or default location
      const defaultLocation = 'Head Office';
      let existingRecord = cashRecords.find(r => r.location === defaultLocation);
      
      if (existingRecord) {
        // Update existing record with new opening balance
        await CashFirebaseService.updateCashBalance(existingRecord.id, amount, 'System');
        console.log('✅ Opening balance updated in Firebase:', amount);
      } else {
        // Create new cash record with opening balance
        await CashFirebaseService.createCashRecord(defaultLocation, amount, 'System');
        console.log('✅ Opening balance created in Firebase:', amount);
      }
      
      // Update local state
      if (setOpeningBalance) {
        setOpeningBalance(amount);
      }
      
      // Refresh data from Firebase
      await fetchCashData();
      
      alert(`Opening balance of ${BankingService.formatCurrency(amount)} saved successfully!`);
    } catch (err) {
      console.error('Error saving opening balance:', err);
      setError('Failed to save opening balance to database');
      alert('Failed to save opening balance. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [cashRecords, setOpeningBalance]);

  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return BankingService.formatCurrency(amount);
  }, []);

  // Format date
  const formatDate = useCallback((date: string) => {
    return BankingService.formatDate(date);
  }, []);

  return {
    transactions: cashTransactions,
    filteredTransactions,
    stats,
    cashRecords,
    isLoading,
    error,
    filters,
    setSearchTerm,
    setFilterType,
    handleDeleteTransaction,
    handleSetOpeningBalance,
    refreshCashData,
    updateCashBalance,
    formatCurrency,
    formatDate
  };
}
