// Banking Module - Transfer Form ViewModel

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Bank, TransferFormData } from '../models/types';
import { BankingService } from '../models/bankingService';
import { BankFirebaseService } from '../models/bankFirebaseService';
import { TransferFirebaseService } from '../models/Transferfirebaseservice';

export function useTransferFormViewModel() {
  const navigate = useNavigate();
  const [formData, setFormDataState] = useState<TransferFormData>(BankingService.getDefaultTransferFormData());
  const [banks, setBanks] = useState<Bank[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    BankFirebaseService.fetchAllBanks()
      .then(setBanks)
      .catch(() => toast.error('Failed to load banks'))
      .finally(() => setIsLoading(false));
  }, []);

  const availableBanks = useMemo(
    () => banks.filter(b => b.balance > 0),
    [banks]
  );

  const setFormField = useCallback((field: keyof TransferFormData, value: any) => {
    setFormDataState(prev => ({ ...prev, [field]: value }));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
  }, []);

  const isValid = useMemo(() => {
    const errs = BankingService.validateTransferForm(formData, banks);
    return Object.keys(errs).length === 0;
  }, [formData, banks]);

  const handleSubmit = useCallback(async (): Promise<boolean> => {
    const validationErrors = BankingService.validateTransferForm(formData, banks);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return false;
    }

    const fromBank = banks.find(b => b.id === formData.fromBankId)!;
    const toBank = banks.find(b => b.id === formData.toBankId)!;

    setIsSaving(true);
    try {
      // Save transfer record
      await TransferFirebaseService.createTransfer({
        date: formData.date,
        fromBankId: formData.fromBankId,
        fromBankName: fromBank.name,
        toBankId: formData.toBankId,
        toBankName: toBank.name,
        amount: formData.amount,
        note: formData.note || ''
      });

      // Update bank balances
      await BankFirebaseService.updateMultipleBanks([
        { ...fromBank, balance: fromBank.balance - formData.amount },
        { ...toBank, balance: toBank.balance + formData.amount }
      ]);

      toast.success('Transfer completed successfully');
      navigate('/banking/transfers');
      return true;
    } catch (err) {
      toast.error('Failed to complete transfer');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [formData, banks, navigate]);

  const handleCancel = useCallback(() => navigate('/banking/transfers'), [navigate]);

  return {
    formData,
    errors,
    isLoading,
    isSaving,
    isValid,
    banks,
    availableBanks,
    pageTitle: 'New Bank Transfer',
    submitButtonText: 'Complete Transfer',
    setFormField,
    clearFieldError,
    handleSubmit,
    handleCancel,
    formatCurrency: BankingService.formatCurrency
  };
}