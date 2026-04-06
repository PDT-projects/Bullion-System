// Bills Module - ViewModel Layer
// FIX: Fetches bills from BOTH the /bills collection AND /transactions collection
// (transactions with linkedType === 'bill' added via the Transactions screen)
// so the Bills list always shows a unified view regardless of where the record was created.

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Bill, BillFilters } from '../models/types';
import { BillsService } from '../models/billsService';
import { BillsFirebaseService } from '../models/Billsfirebaseservice';
import { TransactionFirebaseService } from '../../transactions/models/transactionFirebaseService';
import { Transaction } from '../../transactions/models/types';

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
  handleEdit: (id: string) => void;
  handlePrint: (bill: Bill) => void;
  getCategoryColor: (category: string) => string;
  getCategoryIconName: (category: string) => 'Zap' | 'Wifi' | 'Droplets' | 'Receipt';
}

// Convert a Transaction record (added via Transactions screen with a Bills sub-category)
// into a Bill shape so it can be displayed in the Bills list.
function transactionToBill(t: Transaction): Bill {
  return {
    id:              t.id,
    transactionId:   t.transactionId,
    date:            t.date,
    time:            t.time,
    company:         t.company,
    mainCategory:    'Bills',
    subCategory:     t.subCategory as Bill['subCategory'],
    amount:          t.amount,
    amountPaid:      t.amountPaid ?? t.amount,
    remainingAmount: t.remainingAmount ?? 0,
    mode:            t.mode,
    bankId:          t.bankId,
    bankName:        t.bankName ?? '',
    chequeNumber:    t.chequeNumber,
    chequeDate:      t.chequeDate,
    chequeBank:      t.chequeBank,
    paidBy:          t.paidBy ?? '',
    paidTo:          t.paidTo ?? '',
    transactionBy:   t.transactionBy ?? '',
    billMonth:       '',
    note:            t.note,
    imageUrl:        '',
    paymentStatus:   t.paymentStatus ?? 'Full',
    createdAt:       t.createdAt,
    updatedAt:       t.updatedAt,
  };
}

// Bill sub-categories that can appear in the Transactions module
const BILL_SUB_CATEGORIES = new Set([
  'Electricity', 'Internet', 'Utilities', 'Purchase Order',
  'Electricity Bill', 'Internet Bill', 'PTCL Bill',
]);

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

        // 1. Fetch dedicated bills collection
        const billsData = await BillsFirebaseService.fetchAllBills();

        // 2. Fetch all transactions and pick ones that are bill-related
        //    Either: explicitly linked (linkedType === 'bill')
        //    Or:     mainCategory is 'Bills' / subCategory is a known bill category
        //    But exclude any whose transactionId already exists in billsData
        //    to avoid duplicates when the Bills form creates both records.
        const txData = await TransactionFirebaseService.fetchAllTransactions().catch(() => [] as Transaction[]);
        const existingIds = new Set(billsData.map(b => b.transactionId));

        const txBills: Bill[] = txData
          .filter(t =>
            (t.linkedType === 'bill' || BILL_SUB_CATEGORIES.has(t.subCategory)) &&
            !existingIds.has(t.transactionId)
          )
          .map(transactionToBill);

        setAllBills([...billsData, ...txBills]);
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
      // Try bills collection first; if not found try transactions collection
      try {
        await BillsFirebaseService.deleteBill(id);
      } catch {
        await TransactionFirebaseService.deleteTransaction(id);
      }
      setAllBills(prev => prev.filter(b => b.id !== id));
      toast.success('Bill deleted successfully');
    } catch {
      toast.error('Failed to delete bill');
    }
  }, []);

  const handleAdd  = useCallback(() => navigate('/bills/create'), [navigate]);
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