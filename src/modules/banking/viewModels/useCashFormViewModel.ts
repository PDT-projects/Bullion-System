// Banking Module - Cash Form ViewModel

import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CashFormData } from '../models/types';
import { BankingService, CASH_LOCATIONS } from '../models/bankingService';
import { CashFirebaseService } from '../models/cashFirebaseService';

export function useCashFormViewModel() {
  const navigate = useNavigate();
  const [formData, setFormDataState] = useState<CashFormData>(BankingService.getDefaultCashFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const setFormField = useCallback((field: keyof CashFormData, value: any) => {
    setFormDataState(prev => ({ ...prev, [field]: value }));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
  }, []);

  const isValid = useMemo(() => {
    const errs = BankingService.validateCashForm(formData);
    return Object.keys(errs).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    const validationErrors = BankingService.validateCashForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setIsSaving(true);
    try {
      await CashFirebaseService.createCashTransaction({
        date: formData.date,
        company: formData.company,
        mainCategory: formData.mainCategory,
        subCategory: formData.subCategory,
        amount: formData.amount,
        mode: 'Cash',
        note: formData.note || undefined,
        location: formData.location
      });
      toast.success('Cash transaction recorded successfully');
      navigate('/banking/cash');
    } catch (err) {
      toast.error('Failed to save cash transaction');
    } finally {
      setIsSaving(false);
    }
  }, [formData, navigate]);

  const handleCancel = useCallback(() => navigate('/banking/cash'), [navigate]);

  return {
    formData,
    errors,
    isLoading,
    isSaving,
    isValid,
    pageTitle: 'Add Cash Transaction',
    submitButtonText: 'Save Transaction',
    availableLocations: CASH_LOCATIONS as unknown as string[],
    setFormField,
    clearFieldError,
    handleSubmit,
    handleCancel,
    formatCurrency: BankingService.formatCurrency
  };
}