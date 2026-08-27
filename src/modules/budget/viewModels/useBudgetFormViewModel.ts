// Budget Module - ViewModel Layer
// Create/Edit form logic and state management with Firebase Firestore

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Budget, CreateBudgetDTO, UpdateBudgetDTO } from '../models/types';
import { BudgetService } from '../models/budgetService';
import { BudgetFirebaseService } from '../models/Budgetfirebaseservice';

interface UseBudgetFormViewModelReturn {
  // Form State
  formData: Partial<Budget>;
  isEditing: boolean;
  isSubmitting: boolean;
  errors: { [key: string]: string };

  // UI State
  subCategories: string[];

  // Actions
  setFormField: (field: keyof Budget, value: any) => void;
  handleSubmit: () => Promise<void>;
  handleCancel: () => void;
}

export function useBudgetFormViewModel(): UseBudgetFormViewModelReturn {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const isEditing = !!id;

  // ==================== STATE ====================

  const [formData, setFormData] = useState<Partial<Budget>>(
    BudgetService.getDefaultFormData()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const subCategories = useMemo(() => {
    const defaults = [
      'Salaries',
      'Office Rent',
      'Supplier / Vendor Payments',
      'Utilities',
      'Marketing',
      'Equipment',
      'Travel',
      'Miscellaneous'
    ];
    return defaults.sort();
  }, []);

  // ==================== EFFECTS ====================

  useEffect(() => {
    if (isEditing && id) {
      const loadBudget = async () => {
        try {
          console.log(`🔄 Loading budget ${id} for editing...`);
          const budget = await BudgetFirebaseService.fetchBudgetById(id);
          if (budget) {
            setFormData(budget);
            console.log('✅ Budget loaded for editing:', budget.subCategory);
          } else {
            toast.error('Budget not found');
            navigate('/budgets');
          }
        } catch (error) {
          console.error('❌ Error loading budget:', error);
          toast.error('Failed to load budget');
          navigate('/budgets');
        }
      };
      loadBudget();
    }
  }, [isEditing, id, navigate]);

  // ==================== ACTIONS ====================

  const setFormField = useCallback((field: keyof Budget, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [errors]);

  const handleSubmit = useCallback(async () => {
    const validation = BudgetService.validateBudget(formData);
    if (!validation.isValid) {
      setErrors(validation.fieldErrors || {});
      toast.error(validation.error || 'Please fix the errors');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && id) {
        const updateData: UpdateBudgetDTO = {
          id,
          category: 'Expenses',
          subCategory: formData.subCategory!,
          period: formData.period!,
          budgetLimit: formData.budgetLimit!
        };

        await BudgetFirebaseService.updateBudget(updateData);
        console.log('✅ Budget updated in Firestore:', id);
        toast.success('Budget updated successfully!');
      } else {
        const createData: CreateBudgetDTO = {
          category: 'Expenses',
          subCategory: formData.subCategory!,
          period: formData.period!,
          budgetLimit: formData.budgetLimit!
        };

        const created = await BudgetFirebaseService.createBudget(createData);
        console.log('✅ Budget created in Firestore:', created.id);
        toast.success('Budget created successfully!');
      }

      navigate('/budgets');
    } catch (error) {
      console.error('❌ Error saving budget:', error);
      toast.error('Failed to save budget. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isEditing, id, navigate]);

  const handleCancel = useCallback(() => {
    navigate('/budgets');
  }, [navigate]);

  // ==================== RETURN ====================

  return {
    formData,
    isEditing,
    isSubmitting,
    errors,
    subCategories,
    setFormField,
    handleSubmit,
    handleCancel
  };
}