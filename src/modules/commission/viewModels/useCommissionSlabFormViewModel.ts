// Commission Slab Form ViewModel

import { useState, useCallback } from 'react';
import type { CommissionSlab, CreateCommissionSlabDTO, UpdateCommissionSlabDTO } from '../models/types';
import {
  createCommissionSlab,
  updateCommissionSlab,
  validateCommissionSlab,
  checkSlabOverlap,
  CITIES
} from '../models/commissionService';

interface FormData {
  salesperson: string;
  city: string;
  fromAmount: number;
  toAmount: number;
  commissionPercentage: number;
}

interface UseCommissionSlabFormViewModelReturn {
  // Form state
  formData: FormData;
  setFormData: (data: Partial<FormData>) => void;
  resetForm: () => void;
  
  // UI state
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  isFullScreen: boolean;
  setIsFullScreen: (full: boolean) => void;
  isSubmitting: boolean;
  errors: string[];
  
  // Editing
  editingSlab: CommissionSlab | null;
  setEditingSlab: (slab: CommissionSlab | null) => void;
  startEdit: (slab: CommissionSlab) => void;
  
  // Actions
  handleAdd: () => void;
  handleSave: () => { success: boolean; error?: string };
  
  // Constants
  cities: readonly string[];
}

const initialFormData: FormData = {
  salesperson: '',
  city: '',
  fromAmount: 0,
  toAmount: 0,
  commissionPercentage: 0
};

export function useCommissionSlabFormViewModel(
  onSuccess: () => void,
  employees: any[]
): UseCommissionSlabFormViewModelReturn {
  const [formData, setFormDataState] = useState<FormData>(initialFormData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [editingSlab, setEditingSlab] = useState<CommissionSlab | null>(null);

  // Set form data partially
  const setFormData = useCallback((data: Partial<FormData>) => {
    setFormDataState(prev => ({ ...prev, ...data }));
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setFormDataState(initialFormData);
    setErrors([]);
    setEditingSlab(null);
  }, []);

  // Start editing
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

  // Handle add new
  const handleAdd = useCallback(() => {
    resetForm();
    setIsFullScreen(false);
    setIsModalOpen(true);
  }, [resetForm]);

  // Handle save
  const handleSave = useCallback(() => {
    setIsSubmitting(true);
    setErrors([]);

    try {
      if (editingSlab) {
        // Update existing
        const updateDto: UpdateCommissionSlabDTO = {
          id: editingSlab.id,
          salesperson: formData.salesperson,
          city: formData.city,
          fromAmount: formData.fromAmount,
          toAmount: formData.toAmount,
          commissionPercentage: formData.commissionPercentage
        };
        
        updateCommissionSlab(updateDto);
      } else {
        // Create new
        const createDto: CreateCommissionSlabDTO = {
          salesperson: formData.salesperson,
          city: formData.city,
          fromAmount: formData.fromAmount,
          toAmount: formData.toAmount,
          commissionPercentage: formData.commissionPercentage
        };
        
        // Validate
        const validation = validateCommissionSlab(createDto);
        if (!validation.isValid) {
          setErrors(validation.errors);
          setIsSubmitting(false);
          return { success: false, error: validation.errors.join(', ') };
        }
        
        // Check overlap
        const overlap = checkSlabOverlap(createDto);
        if (overlap.exists) {
          const error = 'Commission slabs cannot overlap for the same salesperson and city';
          setErrors([error]);
          setIsSubmitting(false);
          return { success: false, error };
        }
        
        createCommissionSlab(createDto);
      }
      
      setIsModalOpen(false);
      resetForm();
      onSuccess();
      setIsSubmitting(false);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setErrors([errorMessage]);
      setIsSubmitting(false);
      return { success: false, error: errorMessage };
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
