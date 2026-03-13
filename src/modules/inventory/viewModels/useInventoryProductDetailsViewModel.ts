// Inventory Module - ViewModel Layer
// useInventoryProductDetailsViewModel - Step 2: Product details with conditional costing fields
// Supports multi-model costing with real-time calculations
// Updated: Percentage calculation now uses unitCostUSD / totalUnitCostUSD

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ProductFormData, CostingOption, BuyType, ProductStatus, InventoryEntryType, CostingModel, CostingInfo, BrandWithModels } from '../models/types';
import { 
  createEmptyCostingModel, 
  recalculateAllModels, 
  createInitialCostingInfo,
  generateModelId,
  calculateModelCosts
} from '../models/costingCalculator';

export interface UseInventoryProductDetailsViewModelReturn {
  // Single model for 'without costing'
  singleModel: {
    brandName: string;
    modelName: string;
    costPrice: number;
    sellPrice: number;
    quantity: number;
  };
  setSingleModelField: (field: keyof UseInventoryProductDetailsViewModelReturn['singleModel'], value: string | number) => void;

  // State
  formData: ProductFormData;
  costingOption: CostingOption;
  inventoryType: InventoryEntryType;
  
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
  
  // Actions - Multi-Model Costing Global Inputs
  setCostingBrandName: (value: string) => void;
  setUsdRate: (value: number) => void;
  setTotalCustomsValue: (value: number) => void;
  setTotalFreightValue: (value: number) => void;
  
  // Actions - Model Management
  addModel: () => void;
  updateModelField: (modelId: string, field: keyof CostingModel, value: string | number) => void;
  removeModel: (modelId: string) => void;
  
  // Actions - Serial numbers
  updateSerialNumber: (index: number, value: string) => void;
  updateSerialCity: (index: number, value: string) => void;
  
  // Navigation
  handleNext: (selectedModels?: Array<{ modelId: string; modelName: string; costPrice: number; salePrice: number; quantity: number }>) => void;
  handleBack: () => void;
  
  // Utilities
  showCostingFields: boolean;
  categories: string[];
  cities: string[];
  
  // Costing summary (calculated)
  costingSummary: {
    totalUnitCostUSD: number;
    shipmentTotalUSD: number;
    consignmentValue: number;
    totalValueOfBrand: number;
  };
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
  const inventoryType = (searchParams.get('type') as InventoryEntryType) || 'in-stock';

  // Single model state for 'without costing'
  const [singleModel, setSingleModel] = useState({
    brandName: '',
    modelName: '',
    costPrice: 0,
    sellPrice: 0,
    quantity: 1,
  });
  
  const setSingleModelField = useCallback((field: keyof typeof singleModel, value: string | number) => {
    setSingleModel(prev => ({ ...prev, [field]: value }));
  }, []);

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
    costing: costingOption === 'with' ? createInitialCostingInfo() : undefined,
  });

  // Serial inputs state
  const [serialInputs, setSerialInputs] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  
  // DC brandId/modelIds from URL params (costing screen)
  const dcBrandId = searchParams.get('brandId') || '';
  const dcModelIdsStr = searchParams.get('modelIds') || '[]';
  const dcModelIds: string[] = JSON.parse(dcModelIdsStr);

  // Auto-recalculate when costing inputs change
  useEffect(() => {
    if (costingOption === 'with' && formData.costing && formData.costing.models.length > 0) {
      const { models, usdRate, totalCustomsValue, totalFreightValue } = formData.costing;
      const result = recalculateAllModels(models, usdRate, totalCustomsValue, totalFreightValue);
      
      setFormData(prev => ({
        ...prev,
        costing: prev.costing ? {
          ...prev.costing,
          models: result.models,
          totalUnitCostUSD: result.summary.totalUnitCostUSD,
          shipmentTotalUSD: result.summary.shipmentTotalUSD,
          consignmentValue: result.summary.consignmentValue,
          totalValueOfBrand: result.summary.totalValueOfBrand,
        } : undefined,
      }));
    }
  }, [formData.costing?.usdRate, formData.costing?.totalCustomsValue, formData.costing?.totalFreightValue, costingOption]);

  // Update serial inputs when stock changes
  const handleStockChange = useCallback((newStock: number) => {
    setFormData(prev => ({ ...prev, stock: newStock }));
    
    setSerialInputs(prev => {
      if (newStock > prev.length) {
        const toAdd = newStock - prev.length;
        return [...prev, ...Array(toAdd).fill('')];
      } else if (newStock < prev.length) {
        const removedSerials = prev.slice(newStock);
        const keptSerials = prev.slice(0, newStock);
        
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

  // Multi-Model Costing Global Input Setters
  const setCostingBrandName = useCallback((value: string) => {
    setFormData(prev => ({
      ...prev,
      costing: prev.costing ? { ...prev.costing, brandName: value } : undefined,
    }));
  }, []);

  const setUsdRate = useCallback((value: number) => {
    setFormData(prev => ({
      ...prev,
      costing: prev.costing ? { ...prev.costing, usdRate: value } : undefined,
    }));
  }, []);

  const setTotalCustomsValue = useCallback((value: number) => {
    setFormData(prev => ({
      ...prev,
      costing: prev.costing ? { ...prev.costing, totalCustomsValue: value } : undefined,
    }));
  }, []);

  const setTotalFreightValue = useCallback((value: number) => {
    setFormData(prev => ({
      ...prev,
      costing: prev.costing ? { ...prev.costing, totalFreightValue: value } : undefined,
    }));
  }, []);

  // Model Management Functions
  const addModel = useCallback(() => {
    const newModel = createEmptyCostingModel();
    setFormData(prev => ({
      ...prev,
      costing: prev.costing 
        ? { ...prev.costing, models: [...prev.costing.models, newModel] }
        : undefined,
    }));
  }, []);

  const updateModelField = useCallback((modelId: string, field: keyof CostingModel, value: string | number) => {
    setFormData(prev => {
      if (!prev.costing) return prev;
      
      const totalUnitCostUSD = prev.costing.models.reduce((sum, m) => sum + m.unitCostUSD, 0);
      const shipmentTotalUSD = prev.costing.models.reduce((sum, m) => sum + m.units * m.unitCostUSD, 0);
      
      const updatedModels = prev.costing.models.map(model => {
        if (model.id === modelId) {
          const updatedModel = { ...model, [field]: value };
          return calculateModelCosts(
            updatedModel,
            totalUnitCostUSD,
            shipmentTotalUSD,
            prev.costing!.usdRate,
            prev.costing!.totalCustomsValue,
            prev.costing!.totalFreightValue
          );
        }
        return model;
      });
      
      const result = recalculateAllModels(
        updatedModels,
        prev.costing!.usdRate,
        prev.costing!.totalCustomsValue,
        prev.costing!.totalFreightValue
      );
      
      return {
        ...prev,
        costing: {
          ...prev.costing,
          models: result.models,
          totalUnitCostUSD: result.summary.totalUnitCostUSD,
          shipmentTotalUSD: result.summary.shipmentTotalUSD,
          consignmentValue: result.summary.consignmentValue,
          totalValueOfBrand: result.summary.totalValueOfBrand,
        },
      };
    });
  }, []);

  const removeModel = useCallback((modelId: string) => {
    setFormData(prev => {
      if (!prev.costing) return prev;
      
      const updatedModels = prev.costing.models.filter(m => m.id !== modelId);
      
      if (updatedModels.length > 0) {
        const result = recalculateAllModels(
          updatedModels,
          prev.costing!.usdRate,
          prev.costing!.totalCustomsValue,
          prev.costing!.totalFreightValue
        );
        
        return {
          ...prev,
          costing: {
            ...prev.costing,
            models: result.models,
            totalUnitCostUSD: result.summary.totalUnitCostUSD,
            shipmentTotalUSD: result.summary.shipmentTotalUSD,
            consignmentValue: result.summary.consignmentValue,
            totalValueOfBrand: result.summary.totalValueOfBrand,
          },
        };
      }
      
      return {
        ...prev,
        costing: {
          ...prev.costing,
          models: [],
          totalUnitCostUSD: 0,
          shipmentTotalUSD: 0,
          consignmentValue: 0,
          totalValueOfBrand: 0,
        },
      };
    });
  }, []);

  // Serial number management
  const updateSerialNumber = useCallback((index: number, value: string) => {
    setSerialInputs(prev => {
      const updated = [...prev];
      const oldSerial = updated[index];
      updated[index] = value;
      
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
  const validateForm = useCallback((
    selectedModels?: Array<{ modelId: string; modelName: string; costPrice: number; salePrice: number; quantity: number }>
  ): boolean => {
    const errors: { [key: string]: string } = {};
    
    if (!formData.brandName.trim()) {
      errors.brandName = 'Brand name is required';
    }
    
    if (costingOption !== 'with' && !formData.modelName.trim()) {
      errors.modelName = 'Model name is required';
    }
    
    if (!formData.category.trim()) {
      errors.category = 'Category is required';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    // For 'with costing', validate selectedModels passed from view
    if (costingOption === 'with') {
      const modelsToCheck = selectedModels || [];
      if (modelsToCheck.length === 0) {
        errors.models = 'At least one model must be selected';
      }
    }
    
    const validSerials = serialInputs.filter(s => s.trim() !== '');
    if (validSerials.length !== formData.stock) {
      errors.serialNumbers = `Please provide ${formData.stock} unique serial numbers`;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, serialInputs, costingOption]);

  // isValid - for 'with costing', does NOT require selectedModels (view handles that separately)
  const isValid = useMemo(() => {
    const hasBasic =
      formData.brandName.trim() !== '' &&
      formData.category.trim() !== '' &&
      formData.description.trim() !== '' &&
      serialInputs.filter(s => s.trim() !== '').length === formData.stock;

    if (costingOption !== 'with') {
      // Without costing: modelName also required
      return formData.modelName.trim() !== '' && hasBasic;
    }

    // With costing: basic fields only - selectedModels check is in the View
    return hasBasic;
  }, [formData, serialInputs, costingOption]);

  // Costing summary for display
  const costingSummary = useMemo(() => ({
    totalUnitCostUSD: formData.costing?.totalUnitCostUSD || 0,
    shipmentTotalUSD: formData.costing?.shipmentTotalUSD || 0,
    consignmentValue: formData.costing?.consignmentValue || 0,
    totalValueOfBrand: formData.costing?.totalValueOfBrand || 0,
  }), [formData.costing?.totalUnitCostUSD, formData.costing?.shipmentTotalUSD, formData.costing?.consignmentValue, formData.costing?.totalValueOfBrand]);

  // Navigation - accepts selectedModels from the View for 'with costing' path
  const handleNext = useCallback((
    selectedModels?: Array<{ modelId: string; modelName: string; costPrice: number; salePrice: number; quantity: number }>
  ) => {
    if (!validateForm(selectedModels)) return;

    // For 'with costing', require at least one model selected in the view
    if (costingOption === 'with' && (!selectedModels || selectedModels.length === 0)) {
      setValidationErrors(prev => ({ ...prev, models: 'At least one model must be selected' }));
      return;
    }

    const validSerials = serialInputs.filter(s => s.trim() !== '');
    const queryParams = new URLSearchParams({
      type: inventoryType,
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
      queryParams.set('usdRate', formData.costing.usdRate.toString());
      queryParams.set('totalCustomsValue', formData.costing.totalCustomsValue.toString());
      queryParams.set('totalFreightValue', formData.costing.totalFreightValue.toString());
      queryParams.set('totalUnitCostUSD', formData.costing.totalUnitCostUSD.toString());
      queryParams.set('shipmentTotalUSD', formData.costing.shipmentTotalUSD.toString());
      queryParams.set('consignmentValue', formData.costing.consignmentValue.toString());
      queryParams.set('totalValueOfBrand', formData.costing.totalValueOfBrand.toString());
      queryParams.set('costingModels', JSON.stringify(formData.costing.models));
    }

    // Pass selected models from view to payment screen
    if (selectedModels && selectedModels.length > 0) {
      queryParams.set('selectedModels', JSON.stringify(selectedModels));
    }
    
    navigate(`/inventory/create-new/payment?${queryParams.toString()}`);
  }, [navigate, formData, serialInputs, costingOption, validateForm, inventoryType]);

  const handleBack = useCallback(() => {
    if (costingOption === 'with') {
      navigate(`/inventory/create-new/costing-details?type=${inventoryType}&costing=${costingOption}`);
    } else {
      navigate(`/inventory/create-new/costing?type=${inventoryType}`);
    }
  }, [navigate, inventoryType, costingOption]);

  return {
    singleModel,
    setSingleModelField,
    formData,
    costingOption,
    inventoryType,
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
    setCostingBrandName,
    setUsdRate,
    setTotalCustomsValue,
    setTotalFreightValue,
    addModel,
    updateModelField,
    removeModel,
    updateSerialNumber,
    updateSerialCity,
    handleNext,
    handleBack,
    showCostingFields: false,
    categories: CATEGORIES,
    cities: CITIES,
    costingSummary,
  };
}
