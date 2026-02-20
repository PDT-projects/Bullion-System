// Salary Module - ViewModel Layer
// Dashboard page logic for salary cards

import { useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Salary } from '../models/types';

interface SalaryContext {
  transactions: any[];
  setTransactions: (transactions: any[]) => void;
  employees: any[];
  banks: any[];
  setBanks: (banks: any[]) => void;
}

interface UseSalaryDashboardViewModelReturn {
  // Stats
  stats: {
    totalSalariesPaid: number;
    advanceSalaries: number;
    thisMonth: number;
    pendingPayments: number;
  };
  
  // Navigation handlers
  navigateToAllSalaries: () => void;
  navigateToRegularSalaries: () => void;
  navigateToAdvanceSalaries: () => void;
  navigateToCreateRegular: () => void;
  navigateToCreateAdvance: () => void;
}

export function useSalaryDashboardViewModel(): UseSalaryDashboardViewModelReturn {
  const navigate = useNavigate();
  const { transactions } = useOutletContext<SalaryContext>();

  // Filter salary transactions from all transactions
  const salaryTransactions = useMemo(() => {
    return transactions.filter((t: any) => 
      t.mainCategory === 'Salary' ||
      (t.mainCategory === 'Cash Outflow' && t.subCategory === 'Advance Salary')
    );
  }, [transactions]);

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM

    // All salaries (regular + advance)
    const totalSalariesPaid = salaryTransactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
    
    // Advance salaries only
    const advanceSalaries = salaryTransactions
      .filter((t: any) => t.mainCategory === 'Cash Outflow' && t.subCategory === 'Advance Salary')
      .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
    
    // This month
    const thisMonth = salaryTransactions
      .filter((t: any) => t.salaryMonth === currentMonth)
      .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
    
    // Pending payments (partial payments)
    const pendingPayments = salaryTransactions
      .filter((t: any) => t.paymentStatus === 'Partial')
      .length;

    return {
      totalSalariesPaid,
      advanceSalaries,
      thisMonth,
      pendingPayments
    };
  }, [salaryTransactions]);

  // Navigation handlers
  const navigateToAllSalaries = () => navigate('/salary/all');
  const navigateToRegularSalaries = () => navigate('/salary/regular');
  const navigateToAdvanceSalaries = () => navigate('/salary/advance');
  const navigateToCreateRegular = () => navigate('/salary/create-regular');
  const navigateToCreateAdvance = () => navigate('/salary/create-advance');

  return {
    stats,
    navigateToAllSalaries,
    navigateToRegularSalaries,
    navigateToAdvanceSalaries,
    navigateToCreateRegular,
    navigateToCreateAdvance
  };
}
