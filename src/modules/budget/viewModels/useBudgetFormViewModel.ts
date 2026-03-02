// Budget Module - ViewModel Layer
// Create/Edit form logic and state management with Firebase Data Connect

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import { Budget, CreateBudgetDTO, UpdateBudgetDTO } from '../models/types';
import { BudgetService } from '../models/budgetService';

interface BudgetContext {
  budgets: Budget[];
  setBudgets: (budgets: Budget[]) => void;
}

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
  const { budgets, setBudgets } = useOutletContext<BudgetContext>();
  
  const isEditing = !!id;
  
  // Form state
  const [formData, setFormData] = useState<Partial<Budget>>(
    BudgetService.getDefaultFormData()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Get unique sub-categories for dropdown
  const subCategories = useMemo(() => {
    const existing = BudgetService.getUniqueSubCategories(budgets);
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
    return Array.from(new Set([...defaults, ...existing])).sort();
  }, [budgets]);

  // Load existing budget data if editing
  useEffect(() => {
    if (isEditing && id) {
      const existingBudget = BudgetService.findById(budgets, id);
      if (existingBudget) {
        setFormData(existingBudget);
      } else {
        toast.error('Budget not found');
        navigate('/budgets');
      }
    }
  }, [isEditing, id, budgets, navigate]);

  const setFormField = useCallback((field: keyof Budget, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user changes it
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const handleSubmit = useCallback(async () => {
    // Validate
    const validation = BudgetService.validateBudget(formData);
    if (!validation.isValid) {
      setErrors(validation.fieldErrors || {});
      toast.error(validation.error || 'Please fix the errors');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && id) {
        // Update existing budget in Data Connect
        const updateData: UpdateBudgetDTO = {
          id,
          category: 'Expenses',
          subCategory: formData.subCategory!,
          period: formData.period!,
          budgetLimit: formData.budgetLimit!
        };
        
        const existingBudget = BudgetService.findById(budgets, id);
        if (existingBudget) {
          const updatedBudget = await BudgetService.updateBudgetInDataConnect(existingBudget, updateData);
          
          // Update local state
          const updatedBudgets = BudgetService.updateBudget(budgets, id, updateData);
          setBudgets(updatedBudgets);
          
          console.log('✅ Budget updated in Data Connect:', updatedBudget.id);
          toast.success('Budget updated successfully!');
        }
      } else {
        // Create new budget in Data Connect
        const createData: CreateBudgetDTO = {
          category: 'Expenses',
          subCategory: formData.subCategory!,
          period: formData.period!,
          budgetLimit: formData.budgetLimit!
        };
        
        const createdBudget = await BudgetService.createBudgetInDataConnect(createData);
        
        // Update local state
        const updatedBudgets = BudgetService.createBudget(budgets, createData);
        setBudgets(updatedBudgets);
        
        console.log('✅ Budget created in Data Connect:', createdBudget.id);
        toast.success('Budget created successfully!');
      }
      
      navigate('/budgets');
    } catch (error) {
      console.error('Error saving budget:', error);
      toast.error('Failed to save budget. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isEditing, id, budgets, setBudgets, navigate]);

  const handleCancel = useCallback(() => {
    navigate('/budgets');
  }, [navigate]);

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
