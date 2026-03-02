// Banking Module - Bank Form ViewModel
// Manages state and logic for create/edit bank form with Data Connect integration

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
  isSaving: boolean;
  bank: Bank | null;
  
  // Meta
  isEditMode: boolean;
  pageTitle: string;
  submitButtonText: string;
  
  // Actions
  setFormField: (field: keyof BankFormData, value: any) => void;
  clearFieldError: (field: string) => void;
  handleSubmit: () => Promise<boolean>;
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
  const [isSaving, setIsSaving] = useState(false);
  
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

  // Handle form submission with Data Connect
  const handleSubmit = useCallback(async (): Promise<boolean> => {
    if (!validateForm()) {
      return false;
    }

    try {
      setIsSaving(true);

      if (isEditMode && bank) {
        // Update existing bank in Data Connect
        const updatedBank = await BankingService.updateBankInFirebase(bank, formData);
        
        // Update local state
        setBanks(banks.map(b => b.id === bank.id ? updatedBank : b));
        
        console.log('✅ Bank updated successfully:', updatedBank.id);
      } else {
        // Create new bank in Data Connect
        const newBank = await BankingService.createBankInFirebase(formData);
        
        // Update local state
        setBanks([...banks, newBank]);
        
        console.log('✅ Bank created successfully:', newBank.id);
      }

      navigate('/banking/banks');
      return true;
    } catch (err) {
      console.error('Error saving bank:', err);
      alert('Failed to save bank. Please try again.');
      return false;
    } finally {
      setIsSaving(false);
    }
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
    isSaving,
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
