// Inventory Module - ViewModel Layer
// useCreateInventoryViewModel - Multi-step inventory creation wizard

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ProductFormData, InventoryEntryStep, ValidationResult } from '../models/types';
import { InventoryFirebaseService } from '../models/InventoryFirebaseService';

export interface UseCreateInventoryViewModelReturn {
  currentStep: InventoryEntryStep;
  formData: ProductFormData;
  validation: ValidationResult;
  isSubmitting: boolean;
  serialInput: string;
  serialCity: string;
  setField: (field: string, value: any) => void;
  setCurrentStep: (step: InventoryEntryStep) => void;
  setSerialInput: (value: string) => void;
  setSerialCity: (value: string) => void;
  addSerialNumber: () => void;
  removeSerialNumber: (serial: string) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  handleSubmit: () => void;
  handleCancel: () => void;
}

export function useCreateInventoryViewModel(): UseCreateInventoryViewModelReturn {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<InventoryEntryStep>('details');
  const [formData, setFormData] = useState<ProductFormData>({
    brandId: '',
    brandName: '',
    modelId: '',
    modelName: '',
    category: '',
    costPrice: undefined,
    sellPrice: 0,
    buyType: 'Import',
    warrantyYears: 0,
    stock: 0,
    description: '',
    paymentMethod: undefined,
    paymentAmount: undefined,
    serialNumbers: [],
    serialCities: {},
    isDamaged: false,
    status: 'New',
    currentStep: 'details',
  });

  const [serialInput, setSerialInput] = useState('');
  const [serialCity, setSerialCity] = useState('');
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true, fieldErrors: {} });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const addSerialNumber = useCallback(() => {
    if (!serialInput.trim()) return;
    if (formData.serialNumbers.includes(serialInput)) {
      toast.error('Serial number already exists');
      return;
    }
    setFormData(prev => ({
      ...prev,
      serialNumbers: [...prev.serialNumbers, serialInput],
      serialCities: { ...prev.serialCities, [serialInput]: serialCity || '' },
      // Auto-sync stock count to number of serial numbers
      stock: prev.serialNumbers.length + 1,
    }));
    setSerialInput('');
    setSerialCity('');
  }, [serialInput, serialCity, formData.serialNumbers]);

  const removeSerialNumber = useCallback((serial: string) => {
    setFormData(prev => {
      const newSerials = prev.serialNumbers.filter(s => s !== serial);
      const newCities = { ...prev.serialCities };
      delete newCities[serial];
      return {
        ...prev,
        serialNumbers: newSerials,
        serialCities: newCities,
        // Keep stock in sync when removing
        stock: newSerials.length,
      };
    });
  }, []);

  const validateCurrentStep = useCallback((): boolean => {
    const fieldErrors: { [key: string]: string } = {};
    const validSerials = formData.serialNumbers.filter(s => s.trim() !== '');

    if (currentStep === 'details') {
      if (!formData.brandName) fieldErrors.brandName = 'Brand is required';
      if (!formData.modelName) fieldErrors.modelName = 'Model is required';
      if (!formData.category) fieldErrors.category = 'Category is required';
      if (!formData.sellPrice || formData.sellPrice <= 0) fieldErrors.sellPrice = 'Valid sell price required';
      if (validSerials.length !== formData.stock) fieldErrors.serialNumbers = `Provide ${formData.stock} serial numbers`;
    } else if (currentStep === 'payment') {
      if (!formData.paymentMethod) fieldErrors.paymentMethod = 'Payment method required';
    }

    setValidation({ isValid: Object.keys(fieldErrors).length === 0, fieldErrors });
    return Object.keys(fieldErrors).length === 0;
  }, [currentStep, formData]);

  const goToNextStep = useCallback(() => {
    if (!validateCurrentStep()) return;
    const steps: InventoryEntryStep[] = ['details', 'payment', 'confirmation'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  }, [currentStep, validateCurrentStep]);

  const goToPreviousStep = useCallback(() => {
    const steps: InventoryEntryStep[] = ['details', 'payment', 'confirmation'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  }, [currentStep]);

  // FIX: Actually save to Firebase — previously this was a TODO placeholder,
  // causing the list view to show nothing after "successful" creation.
  const handleSubmit = useCallback(async () => {
    if (!validateCurrentStep()) return;
    setIsSubmitting(true);
    try {
      await InventoryFirebaseService.createProduct(formData);
      toast.success('Inventory item created successfully!');
      navigate('/inventory');
    } catch (error) {
      console.error('Error creating inventory item:', error);
      toast.error('Failed to create inventory item');
    } finally {
      setIsSubmitting(false);
    }
  }, [validateCurrentStep, formData, navigate]);

  const handleCancel = useCallback(() => {
    navigate('/inventory');
  }, [navigate]);

  return {
    currentStep,
    formData,
    validation,
    isSubmitting,
    serialInput,
    serialCity,
    setField,
    setCurrentStep,
    setSerialInput,
    setSerialCity,
    addSerialNumber,
    removeSerialNumber,
    goToNextStep,
    goToPreviousStep,
    handleSubmit,
    handleCancel,
  };
}