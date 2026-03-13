// Inventory Module - ViewModel Layer
// useInventoryCostingDetailsViewModel - NEW Step 3: Costing Details only
// Handles multi-model costing inputs before moving to inventory details

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { CostingOption, InventoryEntryType, CostingModel, CostingInfo } from '../models/types';
import { 
  createEmptyCostingModel, 
  recalculateAllModels, 
  createInitialCostingInfo,
  calculateModelCosts
} from '../models/costingCalculator';
import { saveCostingToDataConnect, type CostingSaveResult } from '../../../api/dataconnect/brandModelDataConnectService';

export interface UseInventoryCostingDetailsViewModelReturn {
  // State
  costingInfo: CostingInfo | undefined;
  costingOption: CostingOption;
  inventoryType: InventoryEntryType;
  isSaving: boolean;
  saveError: string | null;
  
  // Validation
  validationErrors: { [key: string]: string };
  isValid: boolean;
  
  // Actions - Multi-Model Costing Global Inputs
  setCostingBrandName: (value: string) => void;
  setUsdRate: (value: number) => void;
  setTotalCustomsValue: (value: number) => void;
  setTotalFreightValue: (value: number) => void;
  
  // Actions - Model Management
  addModel: () => void;
  updateModelField: (modelId: string, field: keyof CostingModel, value: string | number) => void;
  removeModel: (modelId: string) => void;
  
  // Navigation
  handleNext: () => void;
  handleBack: () => void;
  
  // Utilities
  showCostingFields: boolean;
  
  // Costing summary (calculated)
  costingSummary: {
    totalUnitCostUSD: number;
    shipmentTotalUSD: number;
    consignmentValue: number;
    totalValueOfBrand: number;
  };
}

export function useInventoryCostingDetailsViewModel(): UseInventoryCostingDetailsViewModelReturn {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const costingOption = (searchParams.get('costing') as CostingOption) || 'without';
  const inventoryType = (searchParams.get('type') as InventoryEntryType) || 'in-stock';

  // Initialize costing info (only when costingOption is 'with')
  const [costingInfo, setCostingInfo] = useState<CostingInfo | undefined>(() => {
    if (costingOption === 'with') {
      return createInitialCostingInfo();
    }
    return undefined;
  });

  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Auto-recalculate when costing inputs change
  useEffect(() => {
    if (costingOption === 'with' && costingInfo && costingInfo.models.length > 0) {
      const { models, usdRate, totalCustomsValue, totalFreightValue } = costingInfo;
      const result = recalculateAllModels(models, usdRate, totalCustomsValue, totalFreightValue);
      
      setCostingInfo(prev => prev ? {
        ...prev,
        models: result.models,
        totalUnitCostUSD: result.summary.totalUnitCostUSD,
        shipmentTotalUSD: result.summary.shipmentTotalUSD,
        consignmentValue: result.summary.consignmentValue,
        totalValueOfBrand: result.summary.totalValueOfBrand,
      } : undefined);
    }
  }, [costingInfo?.usdRate, costingInfo?.totalCustomsValue, costingInfo?.totalFreightValue, costingOption]);

  // Multi-Model Costing Global Input Setters
  const setCostingBrandName = useCallback((value: string) => {
    setCostingInfo(prev => prev ? { ...prev, brandName: value } : undefined);
  }, []);

  const setUsdRate = useCallback((value: number) => {
    setCostingInfo(prev => prev ? { ...prev, usdRate: value } : undefined);
  }, []);

  const setTotalCustomsValue = useCallback((value: number) => {
    setCostingInfo(prev => prev ? { ...prev, totalCustomsValue: value } : undefined);
  }, []);

  const setTotalFreightValue = useCallback((value: number) => {
    setCostingInfo(prev => prev ? { ...prev, totalFreightValue: value } : undefined);
  }, []);

  // Model Management Functions
  const addModel = useCallback(() => {
    const newModel = createEmptyCostingModel();
    setCostingInfo(prev => prev ? { ...prev, models: [...prev.models, newModel] } : undefined);
  }, []);

  const updateModelField = useCallback((modelId: string, field: keyof CostingModel, value: string | number) => {
    setCostingInfo(prev => {
      if (!prev) return prev;
      
      // Calculate totals for percentage calculation
      const totalUnitCostUSD = prev.models.reduce((sum, m) => sum + m.unitCostUSD, 0);
      const shipmentTotalUSD = prev.models.reduce((sum, m) => sum + m.units * m.unitCostUSD, 0);
      
      const updatedModels = prev.models.map(model => {
        if (model.id === modelId) {
          const updatedModel = { ...model, [field]: value };
          
          // Recalculate this model's costs with 6 arguments
          return calculateModelCosts(
            updatedModel,
            totalUnitCostUSD,
            shipmentTotalUSD,
            prev.usdRate,
            prev.totalCustomsValue,
            prev.totalFreightValue
          );
        }
        return model;
      });
      
      // Recalculate summary
      const result = recalculateAllModels(
        updatedModels,
        prev.usdRate,
        prev.totalCustomsValue,
        prev.totalFreightValue
      );
      
      return {
        ...prev,
        models: result.models,
        totalUnitCostUSD: result.summary.totalUnitCostUSD,
        shipmentTotalUSD: result.summary.shipmentTotalUSD,
        consignmentValue: result.summary.consignmentValue,
        totalValueOfBrand: result.summary.totalValueOfBrand,
      };
    });
  }, []);

  const removeModel = useCallback((modelId: string) => {
    setCostingInfo(prev => {
      if (!prev) return prev;
      
      const updatedModels = prev.models.filter(m => m.id !== modelId);
      
      // Recalculate if there are remaining models
      if (updatedModels.length > 0) {
        const result = recalculateAllModels(
          updatedModels,
          prev.usdRate,
          prev.totalCustomsValue,
          prev.totalFreightValue
        );
        
        return {
          ...prev,
          models: result.models,
          totalUnitCostUSD: result.summary.totalUnitCostUSD,
          shipmentTotalUSD: result.summary.shipmentTotalUSD,
          consignmentValue: result.summary.consignmentValue,
          totalValueOfBrand: result.summary.totalValueOfBrand,
        };
      }
      
      // If no models left, reset summary
      return {
        ...prev,
        models: [],
        totalUnitCostUSD: 0,
        shipmentTotalUSD: 0,
        consignmentValue: 0,
        totalValueOfBrand: 0,
      };
    });
  }, []);

  // Validation
  const validateForm = useCallback((): boolean => {
    const errors: { [key: string]: string } = {};
    
    // Validate costing if enabled
    if (costingOption === 'with' && costingInfo) {
      if (costingInfo.models.length === 0) {
        errors.models = 'At least one model is required';
      }
      
      costingInfo.models.forEach((model, index) => {
        if (!model.modelName.trim()) {
          errors[`model_${index}`] = `Model ${index + 1} name is required`;
        }
        if (model.units <= 0) {
          errors[`units_${index}`] = `Model ${index + 1} units must be greater than 0`;
        }
        if (model.unitCostUSD <= 0) {
          errors[`unitCost_${index}`] = `Model ${index + 1} unit cost must be greater than 0`;
        }
      });
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [costingInfo, costingOption]);

  const isValid = useMemo(() => {
    if (costingOption !== 'with') {
      // If "without costing", always valid to proceed
      return true;
    }
    
    // For "with costing", validate models
    if (!costingInfo || costingInfo.models.length === 0) return false;
    
    return costingInfo.models.every(model => 
      model.modelName.trim() !== '' && model.units > 0 && model.unitCostUSD > 0
    );
  }, [costingInfo, costingOption]);

  // Costing summary for display
  const costingSummary = useMemo(() => ({
    totalUnitCostUSD: costingInfo?.totalUnitCostUSD || 0,
    shipmentTotalUSD: costingInfo?.shipmentTotalUSD || 0,
    consignmentValue: costingInfo?.consignmentValue || 0,
    totalValueOfBrand: costingInfo?.totalValueOfBrand || 0,
  }), [costingInfo?.totalUnitCostUSD, costingInfo?.shipmentTotalUSD, costingInfo?.consignmentValue, costingInfo?.totalValueOfBrand]);

// Navigation - Go to Product Details (with DataConnect save)
  const handleNext = useCallback(async () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      // Build base query params
      const queryParams = new URLSearchParams({
        type: inventoryType,
        costing: costingOption,
      });
      
      if (costingOption === 'with' && costingInfo) {
        // Save to DataConnect
        const dcResult: CostingSaveResult = await saveCostingToDataConnect(costingInfo);
        
        // Pass DC references instead of full data
        queryParams.set('brandId', dcResult.brandId);
        queryParams.set('modelIds', JSON.stringify(dcResult.modelIds));
        queryParams.set('costingBrandName', dcResult.brandName);
        
        // Keep essential summary for display
        queryParams.set('usdRate', costingInfo.usdRate.toString());
        queryParams.set('totalCustomsValue', costingInfo.totalCustomsValue.toString());
        queryParams.set('consignmentValue', costingInfo.consignmentValue.toString());
      }
      
      navigate(`/inventory/create-new/details?${queryParams.toString()}`);
    } catch (error) {
      console.error('Failed to save costing:', error);
      const errorMsg = 'Failed to save costing details. Please check your inputs and try again.';
      setSaveError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  }, [navigate, costingInfo, costingOption, validateForm, inventoryType]);

  const handleBack = useCallback(() => {
    navigate(`/inventory/create-new/costing?type=${inventoryType}`);
  }, [navigate, inventoryType]);

  return {
    costingInfo,
    costingOption,
    inventoryType,
    isSaving,
    saveError,
    validationErrors,
    isValid,
    setCostingBrandName,
    setUsdRate,
    setTotalCustomsValue,
    setTotalFreightValue,
    addModel,
    updateModelField,
    removeModel,
    handleNext,
    handleBack,
    showCostingFields: costingOption === 'with',
    costingSummary,
  };
}

