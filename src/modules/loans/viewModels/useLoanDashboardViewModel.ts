/**
 * Loans Dashboard ViewModel
 * 
 * Manages dashboard state, statistics, and navigation for loans module.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { 
  Loan, 
  Bank, 
  LoanStatistics, 
  LoanDashboardCard, 
  LoanQuickAction 
} from '../models/types';
import {
  getAllLoans,
  calculateStatistics,
  getTotalReceivable,
  getTotalPayable,
  getNetLoanPosition,
  getOverdueLoans,
  getUpcomingPayments,
  formatCurrency
} from '../models/loanService';

export interface UseLoanDashboardViewModelReturn {
  // State
  loans: Loan[];
  statistics: LoanStatistics;
  isLoading: boolean;
  error: string | null;
  
  // Computed values
  totalReceivable: number;
  totalPayable: number;
  netPosition: number;
  overdueCount: number;
  upcomingCount: number;
  
  // Dashboard cards
  dashboardCards: LoanDashboardCard[];
  quickActions: LoanQuickAction[];
  
  // Actions
  refreshData: () => void;
  navigateToAllLoans: () => void;
  navigateToPayableLoans: () => void;
  navigateToReceivableLoans: () => void;
  navigateToCreatePayable: () => void;
  navigateToCreateReceivable: () => void;
  navigateToOverdueLoans: () => void;
}

export const useLoanDashboardViewModel = (
  banks: Bank[],
  employees: any[]
): UseLoanDashboardViewModelReturn => {
  const navigate = useNavigate();
  
  // State
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load data
  const loadData = useCallback(() => {
    try {
      setIsLoading(true);
      setError(null);
      const allLoans = getAllLoans();
      setLoans(allLoans);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load loans');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // Computed statistics
  const statistics = useMemo(() => calculateStatistics(loans), [loans]);
  const totalReceivable = useMemo(() => getTotalReceivable(loans), [loans]);
  const totalPayable = useMemo(() => getTotalPayable(loans), [loans]);
  const netPosition = useMemo(() => getNetLoanPosition(loans), [loans]);
  const overdueCount = useMemo(() => getOverdueLoans(loans).length, [loans]);
  const upcomingCount = useMemo(() => getUpcomingPayments(loans).length, [loans]);
  
  // Dashboard cards configuration
  const dashboardCards = useMemo<LoanDashboardCard[]>(() => [
    {
      id: 'all-loans',
      title: 'All Loans',
      description: `Total: ${statistics.totalLoans} loans`,
      icon: 'Wallet',
      path: '/loans/all',
      color: 'blue',
      count: statistics.totalLoans,
      amount: statistics.totalAmount
    },
    {
      id: 'payable',
      title: 'Payable Loans',
      description: `We owe: ${formatCurrency(totalPayable)}`,
      icon: 'ArrowUpRight',
      path: '/loans/payable',
      color: 'red',
      count: statistics.payableCount,
      amount: totalPayable
    },
    {
      id: 'receivable',
      title: 'Receivable Loans',
      description: `Owed to us: ${formatCurrency(totalReceivable)}`,
      icon: 'ArrowDownLeft',
      path: '/loans/receivable',
      color: 'green',
      count: statistics.receivableCount,
      amount: totalReceivable
    },
    {
      id: 'overdue',
      title: 'Overdue Loans',
      description: `${overdueCount} loans past 90 days`,
      icon: 'AlertTriangle',
      path: '/loans/overdue',
      color: 'orange',
      count: overdueCount
    },
    {
      id: 'upcoming',
      title: 'Upcoming Payments',
      description: `${upcomingCount} due within 30 days`,
      icon: 'Calendar',
      path: '/loans/upcoming',
      color: 'purple',
      count: upcomingCount
    }
  ], [statistics, totalPayable, totalReceivable, overdueCount, upcomingCount]);
  
  // Quick actions configuration
  const quickActions = useMemo<LoanQuickAction[]>(() => [
    {
      id: 'create-payable',
      title: 'Create Payable Loan',
      description: 'Record a loan we need to pay',
      icon: 'Plus',
      path: '/loans/create-payable',
      color: 'red'
    },
    {
      id: 'create-receivable',
      title: 'Create Receivable Loan',
      description: 'Record money owed to us',
      icon: 'Plus',
      path: '/loans/create-receivable',
      color: 'green'
    }
  ], []);
  
  // Navigation handlers
  const navigateToAllLoans = useCallback(() => navigate('/loans/all'), [navigate]);
  const navigateToPayableLoans = useCallback(() => navigate('/loans/payable'), [navigate]);
  const navigateToReceivableLoans = useCallback(() => navigate('/loans/receivable'), [navigate]);
  const navigateToCreatePayable = useCallback(() => navigate('/loans/create-payable'), [navigate]);
  const navigateToCreateReceivable = useCallback(() => navigate('/loans/create-receivable'), [navigate]);
  const navigateToOverdueLoans = useCallback(() => navigate('/loans/overdue'), [navigate]);
  
  // Refresh data
  const refreshData = useCallback(() => {
    loadData();
  }, [loadData]);
  
  return {
    loans,
    statistics,
    isLoading,
    error,
    totalReceivable,
    totalPayable,
    netPosition,
    overdueCount,
    upcomingCount,
    dashboardCards,
    quickActions,
    refreshData,
    navigateToAllLoans,
    navigateToPayableLoans,
    navigateToReceivableLoans,
    navigateToCreatePayable,
    navigateToCreateReceivable,
    navigateToOverdueLoans
  };
};
