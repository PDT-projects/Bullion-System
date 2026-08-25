// Payroll Module - Salary Delete ViewModel
// Navigation paths updated from /salary/* → /payroll/salary/*

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Salary } from '../models/types';
import { PayrollFirebaseService } from '../models/payrollFirebaseService';

interface UseSalaryDeleteViewModelReturn {
  salary: Salary | null;
  isLoading: boolean;
  onDelete: () => void;
  onCancel: () => void;
}

export function useSalaryDeleteViewModel(): UseSalaryDeleteViewModelReturn {
  const navigate = useNavigate();
  const { id }   = useParams<{ id: string }>();

  const [salary,    setSalary]    = useState<Salary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) { navigate('/payroll/salary'); return; }
    const load = async () => {
      try {
        const data = await PayrollFirebaseService.fetchSalaryById(id);
        if (!data) { toast.error('Salary record not found'); navigate('/payroll/salary'); return; }
        setSalary(data);
      } catch {
        toast.error('Failed to load salary record');
        navigate('/payroll/salary');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      await PayrollFirebaseService.deleteSalary(id);
      toast.success('Salary record deleted successfully');
      const isAdvance = salary?.subCategory === 'Advance salary';
      navigate(isAdvance ? '/payroll/salary/advance' : '/payroll/salary/regular');
    } catch {
      toast.error('Failed to delete salary record');
      setIsLoading(false);
    }
  }, [id, salary, navigate]);

  const handleCancel = useCallback(() => {
    const isAdvance = salary?.subCategory === 'Advance salary';
    navigate(isAdvance ? '/payroll/salary/advance' : '/payroll/salary/regular');
  }, [salary, navigate]);

  return { salary, isLoading, onDelete: handleDelete, onCancel: handleCancel };
}