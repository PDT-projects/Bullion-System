/**
 * Loans Dashboard ViewModel
 * Manages dashboard statistics and navigation.
 * Backed by Firebase Firestore.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Loan, LoanStatistics, LoanDashboardCard, LoanQuickAction } from '../models/types';
import { calculateStatistics, getTotalReceivable, getTotalPayable, getNetLoanPosition, getOverdueLoans, getUpcomingPayments, formatCurrency } from '../models/loanService';
import { LoanFirebaseService } from '../models/Loanfirebaseservice';

export function useLoanDashboardViewModel() {
  const navigate = useNavigate();

  // ==================== STATE ====================

  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ==================== DATA FETCHING ====================

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔄 Fetching loans for dashboard...');
      const allLoans = await LoanFirebaseService.fetchAllLoans();
      setLoans(allLoans);
      console.log(`✅ Dashboard loaded ${allLoans.length} loans`);
    } catch (err) {
      console.error('❌ Dashboard load error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ==================== COMPUTED ====================

  const statistics = useMemo(() => calculateStatistics(loans), [loans]);
  const totalReceivable = useMemo(() => getTotalReceivable(loans), [loans]);
  const totalPayable = useMemo(() => getTotalPayable(loans), [loans]);
  const netPosition = useMemo(() => getNetLoanPosition(loans), [loans]);
  const overdueCount = useMemo(() => getOverdueLoans(loans).length, [loans]);
  const upcomingCount = useMemo(() => getUpcomingPayments(loans).length, [loans]);

  const dashboardCards = useMemo<LoanDashboardCard[]>(() => [
    {
      id: 'all-loans',
      title: 'All Loans',
      description: `Total: ${statistics.totalLoans} loans`,
      icon: 'Wallet',
      path: '/loans/all',
      color: 'blue',
      count: statistics.totalLoans,
      amount: statistics.totalAmount,
    },
    {
      id: 'payable',
      title: 'Payable Loans',
      description: `We owe: ${formatCurrency(totalPayable)}`,
      icon: 'ArrowUpRight',
      path: '/loans/payable',
      color: 'red',
      count: statistics.payableCount,
      amount: totalPayable,
    },
    {
      id: 'receivable',
      title: 'Receivable Loans',
      description: `Owed to us: ${formatCurrency(totalReceivable)}`,
      icon: 'ArrowDownLeft',
      path: '/loans/receivable',
      color: 'green',
      count: statistics.receivableCount,
      amount: totalReceivable,
    },
    {
      id: 'overdue',
      title: 'Overdue Loans',
      description: `${overdueCount} loans past 90 days`,
      icon: 'AlertTriangle',
      path: '/loans/overdue',
      color: 'orange',
      count: overdueCount,
    },
    {
      id: 'upcoming',
      title: 'Upcoming Payments',
      description: `${upcomingCount} due within 30 days`,
      icon: 'Calendar',
      path: '/loans/upcoming',
      color: 'purple',
      count: upcomingCount,
    },
  ], [statistics, totalPayable, totalReceivable, overdueCount, upcomingCount]);

  const quickActions = useMemo<LoanQuickAction[]>(() => [
    { id: 'create-payable', title: 'Create Payable Loan', description: 'Record a loan we need to pay', icon: 'Plus', path: '/loans/create-payable', color: 'red' },
    { id: 'create-receivable', title: 'Create Receivable Loan', description: 'Record money owed to us', icon: 'Plus', path: '/loans/create-receivable', color: 'green' },
  ], []);

  // ==================== NAVIGATION ====================

  const navigateToAllLoans = useCallback(() => navigate('/loans/all'), [navigate]);
  const navigateToPayableLoans = useCallback(() => navigate('/loans/payable'), [navigate]);
  const navigateToReceivableLoans = useCallback(() => navigate('/loans/receivable'), [navigate]);
  const navigateToCreatePayable = useCallback(() => navigate('/loans/create-payable'), [navigate]);
  const navigateToCreateReceivable = useCallback(() => navigate('/loans/create-receivable'), [navigate]);
  const navigateToOverdueLoans = useCallback(() => navigate('/loans/overdue'), [navigate]);

  // ==================== RETURN ====================

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
    refreshData: loadData,
    navigateToAllLoans,
    navigateToPayableLoans,
    navigateToReceivableLoans,
    navigateToCreatePayable,
    navigateToCreateReceivable,
    navigateToOverdueLoans,
  };
}