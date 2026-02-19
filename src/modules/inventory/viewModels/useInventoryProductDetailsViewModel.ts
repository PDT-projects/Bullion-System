// Inventory Module - ViewModel Layer
// useInventoryProductDetailsViewModel - Step 2: Product details with conditional costing fields

import { useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ProductFormData, CostingOption, BuyType, ProductStatus } from '../models/types';
import { InventoryService } from '../models/inventoryService';

export interface UseInventoryProductDetailsViewModelReturn {
  // State
  formData: ProductFormData;
  costingOption: CostingOption;
  
  // Serial number management
  serialInputs: string[];
  
  // Validation
  validationErrors: { [key: string]: string };
  isValid: boolean;
  
  // Actions - Basic fields
  setBrandName: (value: string) => void;
  setModelName: (value: string) => void;
  setCategory: (value: string) => void;
  setSellPrice: (value: number) => void;
  setBuyType: (value: BuyType) => void;
  setWarrantyYears: (value: number) => void;
  setStock: (value: number) => void;
  setDescription: (value: string) => void;
  setStatus: (value: ProductStatus) => void;
  setIsDamaged: (value: boolean) => void;
  
  // Actions - Costing fields (only when costingOption === 'with')
  setCostingUnits: (value: number) => void;
  setUnitCostUSD: (value: number) => void;
  setTotalCostUSD: (value: number) => void;
  setPercentage: (value: number) => void;
  setCustomPerModel: (value: number) => void;
  setCustomPerUnit: (value: number) => void;
  setFreightPerModel: (value: number) => void;
  setFreightPerUnit: (value: number) => void;
  setUnitCostPKR: (value: number) => void;
  setTotalUnitCost: (value: number) => void;
  setTotalShipmentValuePKR: (value: number) => void;
  
  // Actions - Serial numbers
  updateSerialNumber: (index: number, value: string) => void;
  updateSerialCity: (index: number, value: string) => void;
  
  // Navigation
  handleNext: () => void;
  handleBack: () => void;
  
  // Utilities
  showCostingFields: boolean;
  categories: string[];
  cities: string[];
}

const CATEGORIES = [
  'Detection Equipment',
  'Security Equipment',
  'Imaging Equipment',
  'Surveillance Systems',
  'Access Control',
  'Other'
];

const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Bullion RND/SITE'];

export function useInventoryProductDetailsViewModel(): UseInventoryProductDetailsViewModelReturn {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const costingOption = (searchParams.get('costing') as CostingOption) || 'without';

  // Initialize form data
  const [formData, setFormData] = useState<ProductFormData>({
    currentStep: 2,
    costingOption,
    brandName: '',
    modelName: '',
    category: '',
    sellPrice: 0,
    buyType: 'Import',
    warrantyYears: 0,
    stock: 0,
    description: '',
    status: 'New',
    isDamaged: false,
    serialNumbers: [],
    serialCities: {},
    costing: costingOption === 'with' ? {
      units: 0,
      unitCostUSD: 0,
      totalCostUSD: 0,
      percentage: 0,
      customPerModel: 0,
      customPerUnit: 0,
      freightPerModel: 0,
      freightPerUnit: 0,
      unitCostPKR: 0,
      totalUnitCost: 0,
      totalShipmentValuePKR: 0,
    } : undefined,
  });

  // Serial inputs state
  const [serialInputs, setSerialInputs] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  // Update serial inputs when stock changes
  const handleStockChange = useCallback((newStock: number) => {
    setFormData(prev => ({ ...prev, stock: newStock }));
    
    setSerialInputs(prev => {
      if (newStock > prev.length) {
        // Add empty slots
        const toAdd = newStock - prev.length;
        return [...prev, ...Array(toAdd).fill('')];
      } else if (newStock < prev.length) {
        // Remove excess slots
        const removedSerials = prev.slice(newStock);
        const keptSerials = prev.slice(0, newStock);
        
        // Clean up serialCities for removed serials
        setFormData(prevData => {
          const updatedCities = { ...prevData.serialCities };
          removedSerials.forEach(serial => {
            if (serial && updatedCities[serial]) {
              delete updatedCities[serial];
            }
          });
          return { ...prevData, serialCities: updatedCities };
        });
        
        return keptSerials;
      }
      return prev;
    });
  }, []);

  // Basic field setters
  const setBrandName = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, brandName: value }));
  }, []);

  const setModelName = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, modelName: value }));
  }, []);

  const setCategory = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, category: value }));
  }, []);

  const setSellPrice = useCallback((value: number) => {
    setFormData(prev => ({ ...prev, sellPrice: value }));
  }, []);

  const setBuyType = useCallback((value: BuyType) => {
    setFormData(prev => ({ ...prev, buyType: value }));
  }, []);

  const setWarrantyYears = useCallback((value: number) => {
    setFormData(prev => ({ ...prev, warrantyYears: value }));
  }, []);

  const setStock = useCallback((value: number) => {
    handleStockChange(value);
  }, [handleStockChange]);

  const setDescription = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, description: value }));
  }, []);

  const setStatus = useCallback((value: ProductStatus) => {
    setFormData(prev => ({ ...prev, status: value }));
  }, []);

  const setIsDamaged = useCallback((value: boolean) => {
    setFormData(prev => ({ ...prev, isDamaged: value }));
  }, []);

  // Costing field setters
  const setCostingField = useCallback((field: keyof NonNullable<ProductFormData['costing']>, value: number) => {
    setFormData(prev => ({
      ...prev,
      costing: prev.costing ? { ...prev.costing, [field]: value } : undefined,
    }));
  }, []);

  const setCostingUnits = useCallback((value: number) => setCostingField('units', value), [setCostingField]);
  const setUnitCostUSD = useCallback((value: number) => setCostingField('unitCostUSD', value), [setCostingField]);
  const setTotalCostUSD = useCallback((value: number) => setCostingField('totalCostUSD', value), [setCostingField]);
  const setPercentage = useCallback((value: number) => setCostingField('percentage', value), [setCostingField]);
  const setCustomPerModel = useCallback((value: number) => setCostingField('customPerModel', value), [setCostingField]);
  const setCustomPerUnit = useCallback((value: number) => setCostingField('customPerUnit', value), [setCostingField]);
  const setFreightPerModel = useCallback((value: number) => setCostingField('freightPerModel', value), [setCostingField]);
  const setFreightPerUnit = useCallback((value: number) => setCostingField('freightPerUnit', value), [setCostingField]);
  const setUnitCostPKR = useCallback((value: number) => setCostingField('unitCostPKR', value), [setCostingField]);
  const setTotalUnitCost = useCallback((value: number) => setCostingField('totalUnitCost', value), [setCostingField]);
  const setTotalShipmentValuePKR = useCallback((value: number) => setCostingField('totalShipmentValuePKR', value), [setCostingField]);

  // Serial number management
  const updateSerialNumber = useCallback((index: number, value: string) => {
    setSerialInputs(prev => {
      const updated = [...prev];
      const oldSerial = updated[index];
      updated[index] = value;
      
      // Update serialCities if old serial had a city
      if (oldSerial && formData.serialCities[oldSerial]) {
        setFormData(prevData => {
          const updatedCities = { ...prevData.serialCities };
          const city = updatedCities[oldSerial];
          delete updatedCities[oldSerial];
          if (value) {
            updatedCities[value] = city;
          }
          return { ...prevData, serialCities: updatedCities };
        });
      }
      
      return updated;
    });
  }, [formData.serialCities]);

  const updateSerialCity = useCallback((index: number, value: string) => {
    const serialKey = serialInputs[index];
    if (!serialKey) return;
    
    setFormData(prev => ({
      ...prev,
      serialCities: { ...prev.serialCities, [serialKey]: value },
    }));
  }, [serialInputs]);

  // Validation
  const validateForm = useCallback((): boolean => {
    const errors: { [key: string]: string } = {};
    
    if (!formData.brandName.trim()) {
      errors.brandName = 'Brand name is required';
    }
    
    if (!formData.modelName.trim()) {
      errors.modelName = 'Model name is required';
    }
    
    if (!formData.category.trim()) {
      errors.category = 'Category is required';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    const validSerials = serialInputs.filter(s => s.trim() !== '');
    if (validSerials.length !== formData.stock) {
      errors.serialNumbers = `Please provide ${formData.stock} unique serial numbers`;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, serialInputs]);

  const isValid = useMemo(() => {
    return formData.brandName.trim() !== '' &&
           formData.modelName.trim() !== '' &&
           formData.category.trim() !== '' &&
           formData.description.trim() !== '' &&
           serialInputs.filter(s => s.trim() !== '').length === formData.stock;
  }, [formData, serialInputs]);

  // Navigation
  const handleNext = useCallback(() => {
    if (!validateForm()) return;
    
    // Build query params for payment step
    const validSerials = serialInputs.filter(s => s.trim() !== '');
    const queryParams = new URLSearchParams({
      costing: costingOption,
      brandName: formData.brandName,
      modelName: formData.modelName,
      category: formData.category,
      sellPrice: formData.sellPrice.toString(),
      buyType: formData.buyType,
      warrantyYears: formData.warrantyYears.toString(),
      stock: formData.stock.toString(),
      description: formData.description,
      status: formData.status,
      isDamaged: formData.isDamaged.toString(),
      serialNumbers: JSON.stringify(validSerials),
      serialCities: JSON.stringify(formData.serialCities),
    });
    
    // Add costing fields if applicable
    if (costingOption === 'with' && formData.costing) {
      queryParams.set('costingUnits', formData.costing.units.toString());
      queryParams.set('unitCostUSD', formData.costing.unitCostUSD.toString());
      queryParams.set('totalCostUSD', formData.costing.totalCostUSD.toString());
      queryParams.set('percentage', formData.costing.percentage.toString());
      queryParams.set('customPerModel', formData.costing.customPerModel.toString());
      queryParams.set('customPerUnit', formData.costing.customPerUnit.toString());
      queryParams.set('freightPerModel', formData.costing.freightPerModel.toString());
      queryParams.set('freightPerUnit', formData.costing.freightPerUnit.toString());
      queryParams.set('unitCostPKR', formData.costing.unitCostPKR.toString());
      queryParams.set('totalUnitCost', formData.costing.totalUnitCost.toString());
      queryParams.set('totalShipmentValuePKR', formData.costing.totalShipmentValuePKR.toString());
    }
    
    navigate(`/inventory/create-new/payment?${queryParams.toString()}`);
  }, [navigate, formData, serialInputs, costingOption, validateForm]);

  const handleBack = useCallback(() => {
    navigate('/inventory/create-new');
  }, [navigate]);

  return {
    formData,
    costingOption,
    serialInputs,
    validationErrors,
    isValid,
    setBrandName,
    setModelName,
    setCategory,
    setSellPrice,
    setBuyType,
    setWarrantyYears,
    setStock,
    setDescription,
    setStatus,
    setIsDamaged,
    setCostingUnits,
    setUnitCostUSD,
    setTotalCostUSD,
    setPercentage,
    setCustomPerModel,
    setCustomPerUnit,
    setFreightPerModel,
    setFreightPerUnit,
    setUnitCostPKR,
    setTotalUnitCost,
    setTotalShipmentValuePKR,
    updateSerialNumber,
    updateSerialCity,
    handleNext,
    handleBack,
    showCostingFields: costingOption === 'with',
    categories: CATEGORIES,
    cities: CITIES,
  };
}
