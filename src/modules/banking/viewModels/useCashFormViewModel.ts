// Banking Module - Cash Form ViewModel
// Manages state and logic for cash transaction form with Data Connect integration

import { useState, useMemo, useCallback, useEffect } from 'react';
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
  location: string;
}

interface ValidationErrors {
  date?: string;
  company?: string;
  subCategory?: string;
  amount?: string;
  location?: string;
}

export interface UseCashFormViewModelReturn {
  // Form State
  formData: CashFormData;
  errors: ValidationErrors;
  isLoading: boolean;
  isSaving: boolean;
  
  // Meta
  pageTitle: string;
  submitButtonText: string;
  
  // Data
  availableLocations: string[];
  
  // Actions
  setFormField: (field: keyof CashFormData, value: any) => void;
  clearFieldError: (field: keyof ValidationErrors) => void;
  handleSubmit: () => void;
  handleCancel: () => void;
  
  // Utils
  formatCurrency: (amount: number) => string;
  isValid: boolean;
}

const CASH_INFLOW_CATEGORIES = ['Sales', 'Service Income', 'Investment', 'Loan Received', 'Other Income'];
const CASH_OUTFLOW_CATEGORIES = ['Purchases', 'Expenses', 'Salaries', 'Rent', 'Utilities', 'Other Expenses'];

// Available locations for cash tracking
const AVAILABLE_LOCATIONS = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad'];

export function useCashFormViewModel({
  cashTransactions,
  setCashTransactions
}: UseCashFormViewModelProps): UseCashFormViewModelReturn {
  const navigate = useNavigate();
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<CashFormData>({
    date: new Date().toISOString().split('T')[0],
    company: '',
    mainCategory: 'Cash Inflow',
    subCategory: '',
    amount: 0,
    note: '',
    location: 'Karachi' // Default location
  });
  
  // Validation errors
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Get available subcategories based on main category
  const availableSubCategories = useMemo(() => {
    return formData.mainCategory === 'Cash Inflow' 
      ? CASH_INFLOW_CATEGORIES 
      : CASH_OUTFLOW_CATEGORIES;
  }, [formData.mainCategory]);

  // Set form field
  const setFormField = useCallback((field: keyof CashFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when field is updated
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Reset subcategory when main category changes
    if (field === 'mainCategory') {
      setFormData(prev => ({ ...prev, [field]: value, subCategory: '' }));
    }
  }, [errors]);

  // Clear field error
  const clearFieldError = useCallback((field: keyof ValidationErrors) => {
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    
    if (!formData.company.trim()) {
      newErrors.company = 'Company/Party is required';
    }
    
    if (!formData.subCategory) {
      newErrors.subCategory = 'Category is required';
    }
    
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    
    if (!formData.location) {
      newErrors.location = 'Location is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Check if form is valid
  const isValid = useMemo(() => {
    return !!formData.date && 
           !!formData.company.trim() && 
           !!formData.subCategory && 
           formData.amount > 0 &&
           !!formData.location;
  }, [formData]);

  // Handle form submission with Data Connect
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      
      // Create transaction object for Data Connect
      const newTransaction: Omit<CashTransaction, 'id'> = {
        date: formData.date,
        company: formData.company,
        mainCategory: formData.mainCategory,
        subCategory: formData.subCategory,
        amount: formData.amount,
        mode: 'Cash',
        note: formData.note
      };

      // Create transaction in Data Connect
      const createdTransaction = await BankingService.createCashTransactionInDataConnect(newTransaction);

      // Add transaction to local state
      setCashTransactions([createdTransaction, ...cashTransactions]);
      
      console.log('✅ Cash transaction created in Data Connect');
      navigate('/banking/cash');
    } catch (error) {
      console.error('Error creating cash transaction:', error);
      alert('Failed to create transaction. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [formData, cashTransactions, setCashTransactions, navigate, validateForm]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    navigate('/banking/cash');
  }, [navigate]);

  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return BankingService.formatCurrency(amount);
  }, []);

  return {
    formData,
    errors,
    isLoading,
    isSaving,
    pageTitle: 'Add Cash Transaction',
    submitButtonText: 'Save Transaction',
    availableLocations: AVAILABLE_LOCATIONS,
    setFormField,
    clearFieldError,
    handleSubmit,
    handleCancel,
    formatCurrency,
    isValid
  };
}
