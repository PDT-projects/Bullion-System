// Salary Module - ViewModel Layer
// Form page logic for create/edit

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import { Salary, CreateSalaryDTO, UpdateSalaryDTO, SalaryTransaction } from '../models/types';
import { SalaryService } from '../models/salaryService';

interface SalaryContext {
  transactions: any[];
  setTransactions: (transactions: any[]) => void;
  employees: any[];
  banks: any[];
  setBanks: (banks: any[]) => void;
}

interface UseSalaryFormViewModelProps {
  mode: 'create' | 'edit';
  type: 'regular' | 'advance';
}

interface UseSalaryFormViewModelReturn {
  // Form State
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
  
  // Meta
  isEditMode: boolean;
  pageTitle: string;
  submitButtonText: string;
  
  // Data
  employees: any[];
  banks: any[];
  selectedEmployee: any | null;
  calculatedNetAmount: number;
  
  // Actions
  onFieldChange: (field: string, value: any) => void;
  onTransactionChange: (index: number, field: keyof SalaryTransaction, value: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function useSalaryFormViewModel({ 
  mode, 
  type 
}: UseSalaryFormViewModelProps): UseSalaryFormViewModelReturn {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { transactions, setTransactions, employees, banks, setBanks } = useOutletContext<SalaryContext>();

  // ==================== STATE ====================
  
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

  // ==================== COMPUTED VALUES ====================
  
  const isEditMode = mode === 'edit';
  const pageTitle = isEditMode 
    ? 'Edit Salary' 
    : (type === 'regular' ? 'Pay Regular Salary' : 'Pay Advance Salary');
  const submitButtonText = isEditMode ? 'Update Salary' : 'Save Salary';

  // Find selected employee
  const selectedEmployee = useMemo(() => {
    return employees.find(e => e.id === formData.employeeId) || null;
  }, [employees, formData.employeeId]);

  // Calculate net amount
  const calculatedNetAmount = useMemo(() => {
    return formData.baseSalary + formData.commission - formData.deductions;
  }, [formData.baseSalary, formData.commission, formData.deductions]);

  // Validation
  const validation = useMemo(() => {
    const salaryData: Partial<Salary> = {
      ...formData,
      amount: calculatedNetAmount
    };
    return SalaryService.validateSalary(salaryData, transactionsList);
  }, [formData, calculatedNetAmount, transactionsList]);

  const isValid = validation.isValid;
  const errorMessage = validation.error;
  const fieldErrors = validation.fieldErrors || {};

  // ==================== EFFECTS ====================
  
  // Load existing salary data when in edit mode
  useEffect(() => {
    if (isEditMode && id && transactions.length > 0) {
      const salary = transactions.find((t: any) => t.id === id) as Salary;
      if (salary) {
        setFormData({
          employeeId: salary.employeeId || '',
          subCategory: salary.subCategory,
          date: salary.date,
          note: salary.note || '',
          baseSalary: salary.baseSalary || 0,
          commission: salary.commission || 0,
          deductions: salary.deductions || 0
        });
        
        // Restore transaction data
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
      } else {
        toast.error('Salary record not found');
        navigate('/salary');
      }
    }
  }, [isEditMode, id, transactions, navigate]);

  // Auto-populate base salary when employee is selected
  useEffect(() => {
    if (!isEditMode && selectedEmployee && type === 'regular') {
      setFormData(prev => ({
        ...prev,
        baseSalary: selectedEmployee.salary || 0
      }));
    }
  }, [selectedEmployee, isEditMode, type]);

  // Update transaction amount when net amount changes
  useEffect(() => {
    setTransactionsList(prev => prev.map((t, i) => 
      i === 0 ? { ...t, amount: calculatedNetAmount } : t
    ));
  }, [calculatedNetAmount]);

  // ==================== ACTIONS ====================
  
  /**
   * Update a specific form field
   */
  const setField = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  /**
   * Update a specific transaction field
   */
  const setTransactionField = useCallback((index: number, field: keyof SalaryTransaction, value: any) => {
    setTransactionsList(prev => prev.map((t, i) => 
      i === index ? { ...t, [field]: value } : t
    ));
  }, []);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(() => {
    // Validate
    const salaryData: Partial<Salary> = {
      ...formData,
      amount: calculatedNetAmount
    };
    const validation = SalaryService.validateSalary(salaryData, transactionsList);
    
    if (!validation.isValid) {
      toast.error(validation.error || 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      // Update bank balance if bank payment
      const transaction = transactionsList[0];
      if ((transaction.mode === 'Bank' || transaction.mode === 'Cheque') && transaction.bankName) {
        const bank = banks.find((b: any) => b.name === transaction.bankName);
        if (bank) {
          if (bank.balance < transaction.amount) {
            toast.error('Insufficient bank balance');
            setIsLoading(false);
            return;
          }
          
          const updatedBanks = banks.map((b: any) => {
            if (b.name === transaction.bankName) {
              const newBalance = isEditMode 
                ? b.balance + (transactions.find((t: any) => t.id === id)?.amount || 0) - transaction.amount
                : b.balance - transaction.amount;
              return { ...b, balance: newBalance };
            }
            return b;
          });
          setBanks(updatedBanks);
        }
      }

      if (isEditMode && id) {
        // Update existing salary
        const updateData: UpdateSalaryDTO = {
          ...formData,
          id,
          transactions: transactionsList
        };
        const updatedTransactions = SalaryService.updateSalary(transactions, id, updateData);
        setTransactions(updatedTransactions);
        toast.success('Salary updated successfully');
      } else {
        // Create new salary
        const createData: CreateSalaryDTO = {
          ...formData,
          transactions: transactionsList
        };
        const updatedTransactions = SalaryService.createSalaries(transactions, createData);
        setTransactions(updatedTransactions);
        toast.success('Salary payment recorded successfully');
      }

      // Navigate back
      if (type === 'advance') {
        navigate('/salary/advance');
      } else {
        navigate('/salary/regular');
      }
    } catch (error) {
      console.error('Error saving salary:', error);
      toast.error('An error occurred while saving the salary');
    } finally {
      setIsLoading(false);
    }
  }, [formData, transactionsList, calculatedNetAmount, isEditMode, id, transactions, setTransactions, banks, setBanks, navigate, type]);

  /**
   * Handle cancel action
   */
  const handleCancel = useCallback(() => {
    if (type === 'advance') {
      navigate('/salary/advance');
    } else {
      navigate('/salary/regular');
    }
  }, [navigate, type]);

  // ==================== RETURN ====================
  
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
