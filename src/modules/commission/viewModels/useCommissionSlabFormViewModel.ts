// Commission Slab Form ViewModel — saves to Firestore

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { CommissionSlab, CreateCommissionSlabDTO } from '../models/types';
import { validateCommissionSlab, CITIES } from '../models/commissionService';
import { CommissionFirebaseService } from '../models/Commissionfirebaseservice';

interface FormData {
  salesperson: string;
  city: string;
  fromAmount: number;
  toAmount: number;
  commissionPercentage: number;
}

const initialFormData: FormData = {
  salesperson: '',
  city: '',
  fromAmount: 0,
  toAmount: 0,
  commissionPercentage: 0
};

interface UseCommissionSlabFormViewModelReturn {
  formData: FormData;
  setFormData: (data: Partial<FormData>) => void;
  resetForm: () => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  isFullScreen: boolean;
  setIsFullScreen: (full: boolean) => void;
  isSubmitting: boolean;
  errors: string[];
  editingSlab: CommissionSlab | null;
  setEditingSlab: (slab: CommissionSlab | null) => void;
  startEdit: (slab: CommissionSlab) => void;
  handleAdd: () => void;
  handleSave: (existingSlabs: CommissionSlab[]) => Promise<void>;
  cities: readonly string[];
}

export function useCommissionSlabFormViewModel(
  onSuccess: () => void
): UseCommissionSlabFormViewModelReturn {
  const [formData, setFormDataState] = useState<FormData>(initialFormData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [editingSlab, setEditingSlab] = useState<CommissionSlab | null>(null);

  const setFormData = useCallback((data: Partial<FormData>) => {
    setFormDataState(prev => ({ ...prev, ...data }));
  }, []);

  const resetForm = useCallback(() => {
    setFormDataState(initialFormData);
    setErrors([]);
    setEditingSlab(null);
  }, []);

  const startEdit = useCallback((slab: CommissionSlab) => {
    setEditingSlab(slab);
    setFormDataState({
      salesperson: slab.salesperson,
      city: slab.city,
      fromAmount: slab.fromAmount,
      toAmount: slab.toAmount,
      commissionPercentage: slab.commissionPercentage
    });
    setIsFullScreen(false);
    setIsModalOpen(true);
  }, []);

  const handleAdd = useCallback(() => {
    resetForm();
    setIsFullScreen(false);
    setIsModalOpen(true);
  }, [resetForm]);

  const handleSave = useCallback(async (existingSlabs: CommissionSlab[]) => {
    setIsSubmitting(true);
    setErrors([]);

    try {
      if (editingSlab) {
        const validation = validateCommissionSlab(
          formData as CreateCommissionSlabDTO,
          existingSlabs,
          editingSlab.id
        );
        if (!validation.isValid) {
          setErrors(validation.errors);
          return;
        }
        await CommissionFirebaseService.updateSlab(editingSlab.id, {
          salesperson: formData.salesperson,
          city: formData.city,
          fromAmount: formData.fromAmount,
          toAmount: formData.toAmount,
          commissionPercentage: formData.commissionPercentage
        });
        toast.success('Commission slab updated');
      } else {
        const validation = validateCommissionSlab(
          formData as CreateCommissionSlabDTO,
          existingSlabs
        );
        if (!validation.isValid) {
          setErrors(validation.errors);
          return;
        }
        await CommissionFirebaseService.createSlab({
          salesperson: formData.salesperson,
          city: formData.city,
          fromAmount: formData.fromAmount,
          toAmount: formData.toAmount,
          commissionPercentage: formData.commissionPercentage
        });
        toast.success('Commission slab created');
      }

      setIsModalOpen(false);
      resetForm();
      onSuccess();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'An error occurred';
      setErrors([msg]);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [editingSlab, formData, onSuccess, resetForm]);

  return {
    formData,
    setFormData,
    resetForm,
    isModalOpen,
    setIsModalOpen,
    isFullScreen,
    setIsFullScreen,
    isSubmitting,
    errors,
    editingSlab,
    setEditingSlab,
    startEdit,
    handleAdd,
    handleSave,
    cities: CITIES
  };
}