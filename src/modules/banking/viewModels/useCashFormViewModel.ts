// Banking Module - Cash Form ViewModel
// Manages state and logic for create cash transaction form

import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CashTransaction } from '../models/types';
import { BankingService } from '../models/bankingService';

interface UseCashFormViewModelProps {
  cashTransactions: CashTransaction[];
  setCashTransactions: (transactions: CashTransaction[]) => void;
}

interface CashFormData {
  date: string;
  company: string;
  mainCategory: 'Cash Inflow' | 'Cash Outflow';
  subCategory: string;
  amount: number;
  note: string;
}

interface UseCashFormViewModelReturn {
  // Form State
  formData: CashFormData;
  errors: Record<string, string>;
  isLoading: boolean;
  
  // Meta
  pageTitle: string;
  submitButtonText: string;
  
  // Actions
  setFormField: (field: keyof CashFormData, value: any) => void;
  clearFieldError: (field: string) => void;
  handleSubmit: () => boolean;
  handleCancel: () => void;
  
  // Utils
  formatCurrency: (amount: number) => string;
  isValid: boolean;
}

const CASH_INFLOW_CATEGORIES = ['Sales', 'Service Income', 'Investment', 'Loan Received', 'Other Income'];
const CASH_OUTFLOW_CATEGORIES = ['Purchases', 'Expenses', 'Salaries', 'Rent', 'Utilities', 'Other Expenses'];

export function useCashFormViewModel({
  cashTransactions,
  setCashTransactions
}: UseCashFormViewModelProps): UseCashFormViewModelReturn {
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState<CashFormData>({
    date: new Date().toISOString().split('T')[0],
    company: '',
    mainCategory: 'Cash Inflow',
    subCategory: '',
    amount: 0,
    note: ''
  });
  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading] = useState(false);

  // Available sub-categories based on main category
  const availableSubCategories = useMemo(() => {
    return formData.mainCategory === 'Cash Inflow' 
      ? CASH_INFLOW_CATEGORIES 
      : CASH_OUTFLOW_CATEGORIES;
  }, [formData.mainCategory]);

  // Set form field value
  const setFormField = useCallback((field: keyof CashFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Reset sub-category when main category changes
    if (field === 'mainCategory') {
      setFormData(prev => ({ ...prev, [field]: value, subCategory: '' }));
    }
  }, []);

  // Clear field error
  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    if (!formData.company.trim()) {
      newErrors.company = 'Company is required';
    }
    if (!formData.subCategory) {
      newErrors.subCategory = 'Category is required';
    }
    if (formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Check if form is valid (for button state)
  const isValid = useMemo(() => {
    return (
      formData.date !== '' &&
      formData.company.trim() !== '' &&
      formData.subCategory !== '' &&
      formData.amount > 0
    );
  }, [formData]);

  // Handle form submission
  const handleSubmit = useCallback((): boolean => {
    if (!validateForm()) {
      return false;
    }

    const newTransaction: CashTransaction = {
      id: BankingService.generateId(),
      date: formData.date,
      company: formData.company,
      mainCategory: formData.mainCategory,
      subCategory: formData.subCategory,
      amount: formData.amount,
      mode: 'Cash',
      note: formData.note
    };

    setCashTransactions([newTransaction, ...cashTransactions]);
    navigate('/banking/cash');
    return true;
  }, [validateForm, formData, cashTransactions, setCashTransactions, navigate]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    navigate('/banking/cash');
  }, [navigate]);

  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return BankingService.formatCurrency(amount);
  }, []);

  // Page metadata
  const pageTitle = 'Add Cash Transaction';
  const submitButtonText = 'Record Transaction';

  return {
    formData,
    errors,
    isLoading,
    pageTitle,
    submitButtonText,
    setFormField,
    clearFieldError,
    handleSubmit,
    handleCancel,
    formatCurrency,
    isValid
  };
}
