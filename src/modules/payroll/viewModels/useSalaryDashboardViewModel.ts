// Payroll Module - Salary Dashboard ViewModel
// Navigation paths updated from /salary/* → /payroll/salary/*

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Salary } from '../models/types';
import { PayrollFirebaseService } from '../models/payrollFirebaseService';

interface UseSalaryDashboardViewModelReturn {
  stats: {
    totalSalariesPaid: number;
    advanceSalaries: number;
    thisMonth: number;
    pendingPayments: number;
  };
  isLoading: boolean;
  navigateToAllSalaries: () => void;
  navigateToRegularSalaries: () => void;
  navigateToAdvanceSalaries: () => void;
  navigateToCreateRegular: () => void;
  navigateToCreateAdvance: () => void;
}

export function useSalaryDashboardViewModel(): UseSalaryDashboardViewModelReturn {
  const navigate = useNavigate();
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await PayrollFirebaseService.fetchAllSalaries();
        setSalaries(data);
      } catch {
        toast.error('Failed to load salary data');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return {
      totalSalariesPaid: salaries.reduce((sum, s) => sum + (s.amount || 0), 0),
      advanceSalaries:   salaries.filter(s => s.subCategory?.toLowerCase().includes('advance')).reduce((sum, s) => sum + (s.amount || 0), 0),
      thisMonth:         salaries.filter(s => s.salaryMonth === currentMonth).reduce((sum, s) => sum + (s.amount || 0), 0),
      pendingPayments:   salaries.filter(s => !s.paymentStatus || s.paymentStatus === 'Partial').length,
    };
  }, [salaries]);

  return {
    stats,
    isLoading,
    navigateToAllSalaries:      () => navigate('/payroll/salary/all'),
    navigateToRegularSalaries:  () => navigate('/payroll/salary/regular'),
    navigateToAdvanceSalaries:  () => navigate('/payroll/salary/advance'),
    navigateToCreateRegular:    () => navigate('/payroll/salary/create-regular'),
    navigateToCreateAdvance:    () => navigate('/payroll/salary/create-advance'),
  };
}