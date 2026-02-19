// Inventory Module - ViewModel Layer
// useCreateInventoryViewModel - Business logic for creating new inventory

import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import { Product, CreateProductDTO, ProductFormData, ValidationResult } from '../models/types';
import { InventoryService } from '../models/inventoryService';

/**
 * Context type from InventoryLayout
 */
interface InventoryContext {
  products: Product[];
  setProducts: (products: Product[]) => void;
}

/**
 * Inventory entry step
 */
type InventoryStep = 'details' | 'payment' | 'confirmation';

/**
 * Return type for useCreateInventoryViewModel
 */
interface UseCreateInventoryViewModelReturn {
  // Form State
  formData: ProductFormData;
  currentStep: InventoryStep;
  validation: ValidationResult;
  isSubmitting: boolean;
  
  // Serial numbers management
  serialInput: string;
  serialCity: string;
  
  // Actions
  setField: (field: string, value: any) => void;

  setCurrentStep: (step: InventoryStep) => void;
  setSerialInput: (value: string) => void;
  setSerialCity: (value: string) => void;
  addSerialNumber: () => void;
  removeSerialNumber: (serial: string) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  handleSubmit: () => void;
  handleCancel: () => void;
}

/**
 * ViewModel hook for Create New Inventory page
 * Multi-step wizard for creating new products
 */
export function useCreateInventoryViewModel(): UseCreateInventoryViewModelReturn {
  const navigate = useNavigate();
  const { products, setProducts } = useOutletContext<InventoryContext>();

  // ==================== STATE ====================
  
  const [formData, setFormData] = useState<ProductFormData>(
    InventoryService.getDefaultProductFormData()
  );
  const [currentStep, setCurrentStep] = useState<InventoryStep>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Serial number input state
  const [serialInput, setSerialInput] = useState('');
  const [serialCity, setSerialCity] = useState('');

  // ==================== COMPUTED VALUES ====================
  
  const validation = useCallback((): ValidationResult => {
    if (currentStep === 'details') {
      return InventoryService.validateProduct(formData);
    }
    if (currentStep === 'payment') {
      if (!formData.paymentMethod) {
        return { isValid: false, error: 'Payment method is required' };
      }
      if (formData.paymentMethod === 'Bank' && !formData.bankId) {
        return { isValid: false, error: 'Bank selection is required' };
      }
      return { isValid: true };
    }
    return { isValid: true };
  }, [formData, currentStep]);

  // ==================== ACTIONS ====================
  
  /**
   * Update a form field
   */
  const setField = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);


  /**
   * Add a serial number with city
   */
  const addSerialNumber = useCallback(() => {
    if (!serialInput.trim()) {
      toast.error('Please enter a serial number');
      return;
    }
    
    if (formData.serialNumbers?.includes(serialInput.trim())) {
      toast.error('Serial number already exists');
      return;
    }

    setFormData(prev => ({
      ...prev,
      serialNumbers: [...(prev.serialNumbers || []), serialInput.trim()],
      serialCities: {
        ...prev.serialCities,
        [serialInput.trim()]: serialCity.trim() || 'Unknown'
      },
      stock: (prev.stock || 0) + 1
    }));

    setSerialInput('');
    setSerialCity('');
    toast.success('Serial number added');
  }, [serialInput, serialCity, formData.serialNumbers]);

  /**
   * Remove a serial number
   */
  const removeSerialNumber = useCallback((serial: string) => {
    setFormData(prev => {
      const newSerials = prev.serialNumbers?.filter(s => s !== serial) || [];
      const newCities = { ...prev.serialCities };
      delete newCities[serial];
      
      return {
        ...prev,
        serialNumbers: newSerials,
        serialCities: newCities,
        stock: Math.max(0, (prev.stock || 0) - 1)
      };
    });
  }, []);

  /**
   * Navigate to next step
   */
  const goToNextStep = useCallback(() => {
    const currentValidation = validation();
    if (!currentValidation.isValid) {
      toast.error(currentValidation.error || 'Please fix the errors');
      return;
    }
    
    if (currentStep === 'details') {
      setCurrentStep('payment');
    } else if (currentStep === 'payment') {
      setCurrentStep('confirmation');
    }
  }, [currentStep, validation]);

  /**
   * Navigate to previous step
   */
  const goToPreviousStep = useCallback(() => {
    if (currentStep === 'payment') {
      setCurrentStep('details');
    } else if (currentStep === 'confirmation') {
      setCurrentStep('payment');
    }
  }, [currentStep]);

  /**
   * Submit the form and create product
   */
  const handleSubmit = useCallback(() => {
    setIsSubmitting(true);
    
    try {
      const createData: CreateProductDTO = {
        brandName: formData.brandName || '',
        modelName: formData.modelName || '',
        category: formData.category || '',
        costPrice: formData.costPrice || 0,
        sellPrice: formData.sellPrice || 0,
        buyType: formData.buyType || 'Import',
        warrantyYears: formData.warrantyYears || 1,
        stock: formData.stock || 0,
        serialNumbers: formData.serialNumbers || [],
        serialCities: formData.serialCities || {},
        description: formData.description || '',
        status: 'New'
      };

      const updatedProducts = InventoryService.createProduct(products, createData);
      setProducts(updatedProducts);
      
      toast.success('Product created successfully');
      navigate('/inventory/view');
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, products, setProducts, navigate]);

  /**
   * Cancel and go back
   */
  const handleCancel = useCallback(() => {
    navigate('/inventory');
  }, [navigate]);

  return {
    formData,
    currentStep,
    validation: validation(),
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
    handleCancel
  };
}
