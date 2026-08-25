// Salary Module - ViewModel Layer
// Delete confirmation page logic — fetches from Firestore

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Salary } from '../models/types';
import { SalaryFirebaseService } from '../models/salaryFirebaseService';

interface UseSalaryDeleteViewModelReturn {
  salary: Salary | null;
  isLoading: boolean;
  onDelete: () => void;
  onCancel: () => void;
}

export function useSalaryDeleteViewModel(): UseSalaryDeleteViewModelReturn {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [salary, setSalary] = useState<Salary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      navigate('/salary');
      return;
    }
    const load = async () => {
      try {
        const data = await SalaryFirebaseService.fetchSalaryById(id);
        if (!data) {
          toast.error('Salary record not found');
          navigate('/salary');
          return;
        }
        setSalary(data);
      } catch (error) {
        toast.error('Failed to load salary record');
        navigate('/salary');
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
      await SalaryFirebaseService.deleteSalary(id);
      toast.success('Salary record deleted successfully');
      const isAdvance = salary?.subCategory === 'Advance salary';
      navigate(isAdvance ? '/salary/advance' : '/salary/regular');
    } catch (error) {
      toast.error('Failed to delete salary record');
      setIsLoading(false);
    }
  }, [id, salary, navigate]);

  const handleCancel = useCallback(() => {
    const isAdvance = salary?.subCategory === 'Advance salary';
    navigate(isAdvance ? '/salary/advance' : '/salary/regular');
  }, [salary, navigate]);

  return {
    salary,
    isLoading,
    onDelete: handleDelete,
    onCancel: handleCancel
  };
}