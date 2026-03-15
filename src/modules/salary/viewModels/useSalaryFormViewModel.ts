// Salary Module - ViewModel Layer
// Form page logic for create/edit — fetches from Firestore

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Salary, SalaryTransaction } from '../models/types';
import { SalaryService } from '../models/salaryService';
import { SalaryFirebaseService } from '../models/salaryFirebaseService';

interface UseSalaryFormViewModelProps {
  mode: 'create' | 'edit';
  type: 'regular' | 'advance';
  employees: any[];
  banks: any[];
}

interface UseSalaryFormViewModelReturn {
  formData: {
    employeeId: string;
    subCategory: 'Employee salary' | 'Advance salary';
    date: string;
    note: string;
    baseSalary: number;
    commission: number;
    deductions: number;
  };
  transactions: SalaryTransaction[];
  isValid: boolean;
  errorMessage: string | null;
  fieldErrors: { [key: string]: string };
  isLoading: boolean;
  isEditMode: boolean;
  pageTitle: string;
  submitButtonText: string;
  employees: any[];
  banks: any[];
  selectedEmployee: any | null;
  calculatedNetAmount: number;
  onFieldChange: (field: string, value: any) => void;
  onTransactionChange: (index: number, field: keyof SalaryTransaction, value: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function useSalaryFormViewModel({
  mode,
  type,
  employees,
  banks
}: UseSalaryFormViewModelProps): UseSalaryFormViewModelReturn {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [formData, setFormData] = useState({
    employeeId: '',
    subCategory: type === 'regular' ? 'Employee salary' as const : 'Advance salary' as const,
    date: new Date().toISOString().split('T')[0],
    note: '',
    baseSalary: 0,
    commission: 0,
    deductions: 0
  });

  const [transactionsList, setTransactionsList] = useState<SalaryTransaction[]>([
    SalaryService.getDefaultTransaction()
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = mode === 'edit';
  const pageTitle = isEditMode
    ? 'Edit Salary'
    : type === 'regular' ? 'Pay Regular Salary' : 'Pay Advance Salary';
  const submitButtonText = isEditMode ? 'Update Salary' : 'Save Salary';

  const selectedEmployee = useMemo(
    () => employees.find(e => e.id === formData.employeeId) || null,
    [employees, formData.employeeId]
  );

  const calculatedNetAmount = useMemo(
    () => formData.baseSalary + formData.commission - formData.deductions,
    [formData.baseSalary, formData.commission, formData.deductions]
  );

  const validation = useMemo(() => {
    return SalaryService.validateSalary(
      { ...formData, amount: calculatedNetAmount },
      transactionsList
    );
  }, [formData, calculatedNetAmount, transactionsList]);

  const isValid = validation.isValid;
  const errorMessage = validation.error;
  const fieldErrors = validation.fieldErrors || {};

  // Load existing salary in edit mode
  useEffect(() => {
    if (!isEditMode || !id) return;
    const load = async () => {
      try {
        setIsLoading(true);
        const salary = await SalaryFirebaseService.fetchSalaryById(id);
        if (!salary) {
          toast.error('Salary record not found');
          navigate('/salary');
          return;
        }
        setFormData({
          employeeId: salary.employeeId || '',
          subCategory: salary.subCategory,
          date: salary.date,
          note: salary.note || '',
          baseSalary: salary.baseSalary || 0,
          commission: salary.commission || 0,
          deductions: salary.deductions || 0
        });
        setTransactionsList([{
          id: salary.id,
          amount: salary.amount,
          paidBy: salary.paidBy,
          transactionBy: salary.transactionBy,
          mode: salary.mode,
          bankName: salary.bankName,
          imageUrl: salary.imageUrl,
          paymentStatus: salary.paymentStatus,
          remainingAmount: salary.remainingAmount,
          salaryMonth: salary.salaryMonth
        }]);
      } catch (error) {
        toast.error('Failed to load salary record');
        navigate('/salary');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [isEditMode, id, navigate]);

  // Auto-populate base salary from employee
  useEffect(() => {
    if (!isEditMode && selectedEmployee && type === 'regular') {
      setFormData(prev => ({ ...prev, baseSalary: selectedEmployee.salary || 0 }));
    }
  }, [selectedEmployee, isEditMode, type]);

  // Keep transaction amount in sync with net amount
  useEffect(() => {
    setTransactionsList(prev =>
      prev.map((t, i) => (i === 0 ? { ...t, amount: calculatedNetAmount } : t))
    );
  }, [calculatedNetAmount]);

  const setField = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const setTransactionField = useCallback(
    (index: number, field: keyof SalaryTransaction, value: any) => {
      setTransactionsList(prev =>
        prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
      );
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    const v = SalaryService.validateSalary(
      { ...formData, amount: calculatedNetAmount },
      transactionsList
    );
    if (!v.isValid) {
      toast.error(v.error || 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const txn = transactionsList[0];
      const employee = employees.find(e => e.id === formData.employeeId);

      const salaryPayload: Omit<Salary, 'id'> = {
        transactionId: `TXN-${Date.now()}${Math.random().toString().slice(-4)}`,
        date: formData.date,
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        employeeId: formData.employeeId,
        employeeName: employee?.name || '',
        mainCategory: 'Salary',
        subCategory: formData.subCategory,
        amount: txn.amount,
        baseSalary: formData.baseSalary,
        commission: formData.commission,
        deductions: formData.deductions,
        netAmount: calculatedNetAmount,
        mode: txn.mode,
        bankName: txn.bankName || '',
        paidBy: txn.paidBy,
        transactionBy: txn.transactionBy || '',
        salaryMonth: txn.salaryMonth,
        note: formData.note || '',
        imageUrl: txn.imageUrl || '',
        paymentStatus: txn.paymentStatus,
        remainingAmount: txn.remainingAmount || 0
      };

      if (isEditMode && id) {
        await SalaryFirebaseService.updateSalary(id, salaryPayload);
        toast.success('Salary updated successfully');
      } else {
        await SalaryFirebaseService.createSalary(salaryPayload);
        toast.success('Salary payment recorded successfully');
      }

      navigate(type === 'advance' ? '/salary/advance' : '/salary/regular');
    } catch (error) {
      console.error('Error saving salary:', error);
      toast.error('An error occurred while saving the salary');
    } finally {
      setIsLoading(false);
    }
  }, [formData, transactionsList, calculatedNetAmount, isEditMode, id, employees, navigate, type]);

  const handleCancel = useCallback(() => {
    navigate(type === 'advance' ? '/salary/advance' : '/salary/regular');
  }, [navigate, type]);

  return {
    formData,
    transactions: transactionsList,
    isValid,
    errorMessage,
    fieldErrors,
    isLoading,
    isEditMode,
    pageTitle,
    submitButtonText,
    employees,
    banks,
    selectedEmployee,
    calculatedNetAmount,
    onFieldChange: setField,
    onTransactionChange: setTransactionField,
    onSubmit: handleSubmit,
    onCancel: handleCancel
  };
}