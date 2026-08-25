// Salary Module - ViewModel Layer
// Dashboard page logic — fetches directly from Firestore

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Salary } from '../models/types';
import { SalaryFirebaseService } from '../models/salaryFirebaseService';

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
        const data = await SalaryFirebaseService.fetchAllSalaries();
        setSalaries(data);
      } catch (error) {
        toast.error('Failed to load salary data');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);

    const totalSalariesPaid = salaries.reduce((sum, s) => sum + (s.amount || 0), 0);

    const advanceSalaries = salaries
      .filter(s => s.subCategory?.toLowerCase().includes('advance'))
      .reduce((sum, s) => sum + (s.amount || 0), 0);

    const thisMonth = salaries
      .filter(s => s.salaryMonth === currentMonth)
      .reduce((sum, s) => sum + (s.amount || 0), 0);

    const pendingPayments = salaries.filter(
      s => !s.paymentStatus || s.paymentStatus === 'Partial'
    ).length;

    return { totalSalariesPaid, advanceSalaries, thisMonth, pendingPayments };
  }, [salaries]);

  return {
    stats,
    isLoading,
    navigateToAllSalaries: () => navigate('/salary/all'),
    navigateToRegularSalaries: () => navigate('/salary/regular'),
    navigateToAdvanceSalaries: () => navigate('/salary/advance'),
    navigateToCreateRegular: () => navigate('/salary/create-regular'),
    navigateToCreateAdvance: () => navigate('/salary/create-advance')
  };
}