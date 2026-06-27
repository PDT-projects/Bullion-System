// Banking Module - Bank Form ViewModel

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Bank, BankFormData } from '../models/types';
import { BankingService } from '../models/bankingService';
import { BankFirebaseService } from '../models/bankFirebaseService';

interface Props {
  mode: 'create' | 'edit';
}

export function useBankFormViewModel({ mode }: Props) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = mode === 'edit';

  const [formData, setFormData] = useState<BankFormData>(BankingService.getDefaultBankFormData());
  const [allBanks, setAllBanks] = useState<Bank[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const banks = await BankFirebaseService.fetchAllBanks();
        setAllBanks(banks);
        if (isEditMode && id) {
          const bank = banks.find(b => b.id === id);
          if (bank) {
            setFormData({ name: bank.name, accountNumber: bank.accountNumber, balance: bank.balance, currency: bank.currency || 'AED' });
          } else {
            toast.error('Bank not found');
            navigate('/banking/banks');
          }
        }
      } catch (err) {
        toast.error('Failed to load bank data');
        navigate('/banking/banks');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [isEditMode, id, navigate]);

  const setFormField = useCallback((field: keyof BankFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
  }, []);

  const isValid = useMemo(() => {
    return !!formData.name.trim() && !!formData.accountNumber.trim() && formData.balance >= 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    const validationErrors = BankingService.validateBankForm(formData, allBanks, isEditMode ? id : undefined);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setIsSaving(true);
    try {
      if (isEditMode && id) {
        await BankFirebaseService.updateBank({ id, ...formData });
        toast.success('Bank account updated successfully');
      } else {
        await BankFirebaseService.createBank(formData);
        toast.success('Bank account created successfully');
      }
      navigate('/banking/banks');
    } catch (err) {
      toast.error(isEditMode ? 'Failed to update bank' : 'Failed to create bank');
    } finally {
      setIsSaving(false);
    }
  }, [formData, allBanks, isEditMode, id, navigate]);

  const handleCancel = useCallback(() => navigate('/banking/banks'), [navigate]);

  return {
    formData,
    errors,
    isLoading,
    isSaving,
    isEditMode,
    isValid,
    pageTitle: isEditMode ? 'Edit Bank Account' : 'Add Bank Account',
    submitButtonText: isEditMode ? 'Update Account' : 'Create Account',
    setFormField,
    clearFieldError,
    handleSubmit,
    handleCancel,
    formatCurrency: BankingService.formatCurrency
  };
}