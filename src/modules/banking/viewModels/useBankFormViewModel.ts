// Banking Module - Bank Form ViewModel
// Manages state and logic for create/edit bank form

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Bank, BankFormData } from '../models/types';
import { BankingService } from '../models/bankingService';

interface UseBankFormViewModelProps {
  banks: Bank[];
  setBanks: (banks: Bank[]) => void;
  mode: 'create' | 'edit';
}

interface UseBankFormViewModelReturn {
  // Form State
  formData: BankFormData;
  errors: Record<string, string>;
  isLoading: boolean;
  bank: Bank | null;
  
  // Meta
  isEditMode: boolean;
  pageTitle: string;
  submitButtonText: string;
  
  // Actions
  setFormField: (field: keyof BankFormData, value: any) => void;
  clearFieldError: (field: string) => void;
  handleSubmit: () => boolean;
  handleCancel: () => void;
  
  // Utils
  formatCurrency: (amount: number) => string;
  isValid: boolean;
}

export function useBankFormViewModel({
  banks,
  setBanks,
  mode
}: UseBankFormViewModelProps): UseBankFormViewModelReturn {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const isEditMode = mode === 'edit';
  
  // Find existing bank if in edit mode
  const [bank, setBank] = useState<Bank | null>(null);
  const [isLoading, setIsLoading] = useState(isEditMode);
  
  // Form state
  const [formData, setFormData] = useState<BankFormData>(
    BankingService.getDefaultBankFormData()
  );
  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load bank data in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const foundBank = banks.find(b => b.id === id);
      if (foundBank) {
        setBank(foundBank);
        setFormData({
          name: foundBank.name,
          accountNumber: foundBank.accountNumber,
          balance: foundBank.balance
        });
      }
      setIsLoading(false);
    }
  }, [isEditMode, id, banks]);

  // Set form field value
  const setFormField = useCallback((field: keyof BankFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    const validationErrors = BankingService.validateBankForm(
      formData,
      banks,
      isEditMode ? id : undefined
    );
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [formData, banks, isEditMode, id]);

  // Check if form is valid (for button state)
  const isValid = useMemo(() => {
    return formData.name.trim() !== '' && formData.accountNumber.trim() !== '';
  }, [formData]);

  // Handle form submission
  const handleSubmit = useCallback((): boolean => {
    if (!validateForm()) {
      return false;
    }

    if (isEditMode && bank) {
      // Update existing bank
      const updatedBank = BankingService.updateBank(bank, formData);
      setBanks(banks.map(b => b.id === bank.id ? updatedBank : b));
    } else {
      // Create new bank
      const newBank = BankingService.createBank(formData);
      setBanks([...banks, newBank]);
    }

    navigate('/banking/banks');
    return true;
  }, [validateForm, isEditMode, bank, formData, banks, setBanks, navigate]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    navigate('/banking/banks');
  }, [navigate]);

  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return BankingService.formatCurrency(amount);
  }, []);

  // Page metadata
  const pageTitle = isEditMode ? 'Edit Bank Account' : 'Add Bank Account';
  const submitButtonText = isEditMode ? 'Update Bank Account' : 'Create Bank Account';

  return {
    formData,
    errors,
    isLoading,
    bank,
    isEditMode,
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
