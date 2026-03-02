// Banking Module - Transfer Form ViewModel
// Manages state and logic for create transfer form with Data Connect integration

import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bank, BankTransfer, TransferFormData } from '../models/types';
import { BankingService } from '../models/bankingService';

interface UseTransferFormViewModelProps {
  banks: Bank[];
  setBanks: (banks: Bank[]) => void;
  transfers: BankTransfer[];
  setTransfers: (transfers: BankTransfer[]) => void;
}

interface UseTransferFormViewModelReturn {
  // Form State
  formData: TransferFormData;
  errors: Record<string, string>;
  isLoading: boolean;
  isSaving: boolean;
  
  // Meta
  pageTitle: string;
  submitButtonText: string;
  
  // Actions
  setFormField: (field: keyof TransferFormData, value: any) => void;
  clearFieldError: (field: string) => void;
  handleSubmit: () => Promise<boolean>;
  handleCancel: () => void;
  
  // Utils
  formatCurrency: (amount: number) => string;
  isValid: boolean;
  availableBanks: Bank[];
}

export function useTransferFormViewModel({
  banks,
  setBanks,
  transfers,
  setTransfers
}: UseTransferFormViewModelProps): UseTransferFormViewModelReturn {
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState<TransferFormData>(
    BankingService.getDefaultTransferFormData()
  );
  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Available banks (with balance > 0 for source)
  const availableBanks = useMemo(() => {
    return banks.filter(b => b.balance > 0);
  }, [banks]);

  // Set form field value
  const setFormField = useCallback((field: keyof TransferFormData, value: any) => {
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
    const validationErrors = BankingService.validateTransferForm(formData, banks);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [formData, banks]);

  // Check if form is valid (for button state)
  const isValid = useMemo(() => {
    return (
      formData.fromBankId !== '' &&
      formData.toBankId !== '' &&
      formData.fromBankId !== formData.toBankId &&
      formData.amount > 0 &&
      formData.date !== ''
    );
  }, [formData]);

  // Handle form submission with Data Connect
  const handleSubmit = useCallback(async (): Promise<boolean> => {
    if (!validateForm()) {
      return false;
    }

    const fromBank = banks.find(b => b.id === formData.fromBankId);
    const toBank = banks.find(b => b.id === formData.toBankId);

    if (!fromBank || !toBank) {
      setErrors({ submit: 'Selected banks not found' });
      return false;
    }

    try {
      setIsSaving(true);

      // Calculate new balances
      const fromBankNewBalance = fromBank.balance - formData.amount;
      const toBankNewBalance = toBank.balance + formData.amount;
      
      // Update banks in Data Connect
      const updatedFromBank = { ...fromBank, balance: fromBankNewBalance };
      const updatedToBank = { ...toBank, balance: toBankNewBalance };
      
      await BankingService.updateBankInDataConnect(updatedFromBank, {
        name: fromBank.name,
        accountNumber: fromBank.accountNumber,
        balance: fromBankNewBalance
      });
      
      await BankingService.updateBankInDataConnect(updatedToBank, {
        name: toBank.name,
        accountNumber: toBank.accountNumber,
        balance: toBankNewBalance
      });

      // Create transfer record in Data Connect
      const newTransfer: Omit<BankTransfer, 'id'> = {
        date: formData.date,
        fromBankId: formData.fromBankId,
        fromBankName: fromBank.name,
        toBankId: formData.toBankId,
        toBankName: toBank.name,
        amount: formData.amount,
        note: formData.note
      };

      const createdTransfer = await BankingService.createTransferInDataConnect(newTransfer);

      // Update local state
      const updatedBanks = banks.map(bank => {
        if (bank.id === formData.fromBankId) {
          return { ...bank, balance: fromBankNewBalance };
        }
        if (bank.id === formData.toBankId) {
          return { ...bank, balance: toBankNewBalance };
        }
        return bank;
      });

      setTransfers([createdTransfer, ...transfers]);
      setBanks(updatedBanks);

      console.log('✅ Transfer completed successfully in Data Connect');
      navigate('/banking/transfers');
      return true;
    } catch (error) {
      console.error('Error creating transfer:', error);
      setErrors({ submit: 'Failed to complete transfer. Please try again.' });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [validateForm, formData, banks, transfers, setTransfers, setBanks, navigate]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    navigate('/banking/transfers');
  }, [navigate]);

  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return BankingService.formatCurrency(amount);
  }, []);

  // Page metadata
  const pageTitle = 'New Bank Transfer';
  const submitButtonText = 'Create Transfer';

  return {
    formData,
    errors,
    isLoading,
    isSaving,
    pageTitle,
    submitButtonText,
    setFormField,
    clearFieldError,
    handleSubmit,
    handleCancel,
    formatCurrency,
    isValid,
    availableBanks
  };
}
