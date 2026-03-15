// Inventory Module - ViewModel Layer
// useInventoryProductDetailsViewModel - Step 4: Product details
// With costing: fetches ONLY the brand's models that were saved in the costing step
// directly from Firestore using costingBrandId + costingModelIds from URL params.
// No BrandModelDropdown interaction needed — models are pre-populated in the table.

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ProductFormData, CostingOption, BuyType, ProductStatus, InventoryEntryType, CostingModel } from '../models/types';
import { createInitialCostingInfo, calculateModelCosts, recalculateAllModels, createEmptyCostingModel } from '../models/costingCalculator';
import { BrandModelFirebaseService } from '../models/InventoryFirebaseService';

const CATEGORIES = ['Detection Equipment', 'Security Equipment', 'Imaging Equipment', 'Surveillance Systems', 'Access Control', 'Other'];
const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Bullion RND/SITE'];

export interface SelectedModel {
  modelId: string;
  modelName: string;
  costPrice: number;
  salePrice: number;
  quantity: number;
  serialNumbers: string[];                  // one per unit
  serialCities:  { [serial: string]: string }; // optional city per serial
}

export interface UseInventoryProductDetailsViewModelReturn {
  singleModel: { brandName: string; modelName: string; costPrice: number; sellPrice: number; quantity: number };
  setSingleModelField: (field: string, value: string | number) => void;
  formData: ProductFormData;
  costingOption: CostingOption;
  inventoryType: InventoryEntryType;
  costingBrandId: string;
  costingBrandName: string;
  // Pre-fetched models from Firestore — auto-populate the table
  preloadedModels: SelectedModel[];
  isLoadingModels: boolean;
  serialInputs: string[];
  validationErrors: { [key: string]: string };
  isValid: boolean;
  setBrandName: (v: string) => void;
  setModelName: (v: string) => void;
  setCategory: (v: string) => void;
  setSellPrice: (v: number) => void;
  setBuyType: (v: BuyType) => void;
  setWarrantyYears: (v: number) => void;
  setStock: (v: number) => void;
  setDescription: (v: string) => void;
  setStatus: (v: ProductStatus) => void;
  setIsDamaged: (v: boolean) => void;
  setCostingBrandName: (v: string) => void;
  setUsdRate: (v: number) => void;
  setTotalCustomsValue: (v: number) => void;
  setTotalFreightValue: (v: number) => void;
  addModel: () => void;
  updateModelField: (modelId: string, field: keyof CostingModel, value: string | number) => void;
  removeModel: (modelId: string) => void;
  updateSerialNumber: (index: number, value: string) => void;
  updateSerialCity: (index: number, value: string) => void;
  updateModelSerial: (modelIdx: number, serialIdx: number, value: string) => void;
  updateModelSerialCity: (modelIdx: number, serialIdx: number, city: string) => void;
  handleNext: (selectedModels?: SelectedModel[]) => void;
  handleBack: () => void;
  showCostingFields: boolean;
  categories: string[];
  cities: string[];
  costingSummary: { totalUnitCostUSD: number; shipmentTotalUSD: number; consignmentValue: number; totalValueOfBrand: number };
}

export function useInventoryProductDetailsViewModel(): UseInventoryProductDetailsViewModelReturn {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const costingOption  = (searchParams.get('costing') as CostingOption)   || 'without';
  const inventoryType  = (searchParams.get('type') as InventoryEntryType) || 'in-stock';
  const costingBrandId   = searchParams.get('costingBrandId')   || '';
  const costingBrandName = searchParams.get('costingBrandName') || '';
  // Model IDs saved to Firestore by the costing step
  const costingModelIds: string[] = JSON.parse(searchParams.get('costingModelIds') || '[]');

  // ── Pre-load models from Firestore ──────────────────────────────────────────
  // Fetch all models for costingBrandId then keep only those in costingModelIds.
  // This is the SOURCE OF TRUTH — the dropdown is NOT needed for the with-costing path.
  const [preloadedModels, setPreloadedModels] = useState<SelectedModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  useEffect(() => {
    if (costingOption !== 'with' || !costingBrandId) return;

    const fetchCostingModels = async () => {
      setIsLoadingModels(true);
      try {
        const allModels = await BrandModelFirebaseService.fetchModelsByBrand(costingBrandId);
        console.log(`✅ Fetched ${allModels.length} models for brand ${costingBrandId}, filtering to ${costingModelIds.length} costing IDs`);

        // If we have specific IDs, filter to them; otherwise show all models for the brand
        const filtered = costingModelIds.length > 0
          ? allModels.filter(m => costingModelIds.includes(m.id))
          : allModels;

        const mapped: SelectedModel[] = filtered.map(m => ({
          modelId:     m.id,
          modelName:   m.name,
          costPrice:   m.costPrice || 0,
          salePrice:   Math.round((m.costPrice || 0) * 1.3),
          quantity:    1,
          serialNumbers: [''],
          serialCities:  {},
        }));

        setPreloadedModels(mapped);
        console.log(`✅ Pre-loaded ${mapped.length} models:`, mapped.map(m => m.modelName));
      } catch (err) {
        console.error('❌ Failed to pre-load costing models:', err);
      } finally {
        setIsLoadingModels(false);
      }
    };

    fetchCostingModels();
    // costingModelIds is from URL — stable for this render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [costingBrandId, costingOption]);

  // ── Form state ───────────────────────────────────────────────────────────────
  const [singleModel, setSingleModel] = useState({ brandName: '', modelName: '', costPrice: 0, sellPrice: 0, quantity: 1 });
  const setSingleModelField = useCallback((field: string, value: string | number) => {
    setSingleModel(prev => ({ ...prev, [field]: value }));
  }, []);

  const [formData, setFormData] = useState<ProductFormData>({
    currentStep: 2,
    costingOption,
    brandName:     costingBrandName,
    modelName:     '',
    category:      '',
    sellPrice:     0,
    buyType:       'Import',
    warrantyYears: 0,
    stock:         0,
    description:   '',
    status:        'New',
    isDamaged:     false,
    serialNumbers: [],
    serialCities:  {},
    costing: costingOption === 'with' ? (() => {
      const c = createInitialCostingInfo();
      return {
        ...c,
        brandName:         costingBrandName,
        usdRate:           Number(searchParams.get('usdRate'))           || 0,
        totalCustomsValue: Number(searchParams.get('totalCustomsValue')) || 0,
        totalFreightValue: Number(searchParams.get('totalFreightValue')) || 0,
        shipmentTotalUSD:  Number(searchParams.get('shipmentTotalUSD'))  || 0,
        consignmentValue:  Number(searchParams.get('consignmentValue'))  || 0,
        totalValueOfBrand: Number(searchParams.get('totalValueOfBrand')) || 0,
        totalUnitCostUSD:  Number(searchParams.get('totalUnitCostUSD'))  || 0,
        models: JSON.parse(searchParams.get('costingModels') || '[]'),
      };
    })() : undefined,
  });

  const [serialInputs, setSerialInputs] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (costingOption === 'with' && formData.costing && formData.costing.models.length > 0) {
      const { models, usdRate, totalCustomsValue, totalFreightValue } = formData.costing;
      const result = recalculateAllModels(models, usdRate, totalCustomsValue, totalFreightValue);
      setFormData(prev => ({
        ...prev, costing: prev.costing ? {
          ...prev.costing, models: result.models,
          totalUnitCostUSD:  result.summary.totalUnitCostUSD,
          shipmentTotalUSD:  result.summary.shipmentTotalUSD,
          consignmentValue:  result.summary.consignmentValue,
          totalValueOfBrand: result.summary.totalValueOfBrand,
        } : undefined,
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.costing?.usdRate, formData.costing?.totalCustomsValue, formData.costing?.totalFreightValue, costingOption]);

  // ── Stock / serial handlers ──────────────────────────────────────────────────
  const handleStockChange = useCallback((newStock: number) => {
    setFormData(prev => ({ ...prev, stock: newStock }));
    setSerialInputs(prev => {
      if (newStock > prev.length) return [...prev, ...Array(newStock - prev.length).fill('')];
      if (newStock < prev.length) {
        const removed = prev.slice(newStock);
        setFormData(pd => ({
          ...pd,
          serialCities: Object.fromEntries(Object.entries(pd.serialCities).filter(([k]) => !removed.includes(k)))
        }));
        return prev.slice(0, newStock);
      }
      return prev;
    });
  }, []);

  // ── Field setters ────────────────────────────────────────────────────────────
  const setBrandName     = useCallback((v: string) => setFormData(p => ({ ...p, brandName: v })), []);
  const setModelName     = useCallback((v: string) => setFormData(p => ({ ...p, modelName: v })), []);
  const setCategory      = useCallback((v: string) => setFormData(p => ({ ...p, category: v })), []);
  const setSellPrice     = useCallback((v: number) => setFormData(p => ({ ...p, sellPrice: v })), []);
  const setBuyType       = useCallback((v: BuyType) => setFormData(p => ({ ...p, buyType: v })), []);
  const setWarrantyYears = useCallback((v: number) => setFormData(p => ({ ...p, warrantyYears: v })), []);
  const setStock         = useCallback((v: number) => handleStockChange(v), [handleStockChange]);
  const setDescription   = useCallback((v: string) => setFormData(p => ({ ...p, description: v })), []);
  const setStatus        = useCallback((v: ProductStatus) => setFormData(p => ({ ...p, status: v })), []);
  const setIsDamaged     = useCallback((v: boolean) => setFormData(p => ({ ...p, isDamaged: v })), []);

  const setCostingBrandNameFn = useCallback((v: string) => setFormData(p => ({ ...p, costing: p.costing ? { ...p.costing, brandName: v } : undefined })), []);
  const setUsdRate            = useCallback((v: number) => setFormData(p => ({ ...p, costing: p.costing ? { ...p.costing, usdRate: v } : undefined })), []);
  const setTotalCustomsValue  = useCallback((v: number) => setFormData(p => ({ ...p, costing: p.costing ? { ...p.costing, totalCustomsValue: v } : undefined })), []);
  const setTotalFreightValue  = useCallback((v: number) => setFormData(p => ({ ...p, costing: p.costing ? { ...p.costing, totalFreightValue: v } : undefined })), []);

  const addModel = useCallback(() => {
    setFormData(p => ({ ...p, costing: p.costing ? { ...p.costing, models: [...p.costing.models, createEmptyCostingModel()] } : undefined }));
  }, []);

  const updateModelField = useCallback((modelId: string, field: keyof CostingModel, value: string | number) => {
    setFormData(prev => {
      if (!prev.costing) return prev;
      const tot  = prev.costing.models.reduce((s, m) => s + m.unitCostUSD, 0);
      const ship = prev.costing.models.reduce((s, m) => s + m.units * m.unitCostUSD, 0);
      const updated = prev.costing.models.map(m => m.id !== modelId ? m :
        calculateModelCosts({ ...m, [field]: value }, tot, ship, prev.costing!.usdRate, prev.costing!.totalCustomsValue, prev.costing!.totalFreightValue)
      );
      const result = recalculateAllModels(updated, prev.costing.usdRate, prev.costing.totalCustomsValue, prev.costing.totalFreightValue);
      return { ...prev, costing: { ...prev.costing, models: result.models, totalUnitCostUSD: result.summary.totalUnitCostUSD, shipmentTotalUSD: result.summary.shipmentTotalUSD, consignmentValue: result.summary.consignmentValue, totalValueOfBrand: result.summary.totalValueOfBrand } };
    });
  }, []);

  const removeModel = useCallback((modelId: string) => {
    setFormData(prev => {
      if (!prev.costing) return prev;
      const updated = prev.costing.models.filter(m => m.id !== modelId);
      if (updated.length > 0) {
        const result = recalculateAllModels(updated, prev.costing.usdRate, prev.costing.totalCustomsValue, prev.costing.totalFreightValue);
        return { ...prev, costing: { ...prev.costing, models: result.models, totalUnitCostUSD: result.summary.totalUnitCostUSD, shipmentTotalUSD: result.summary.shipmentTotalUSD, consignmentValue: result.summary.consignmentValue, totalValueOfBrand: result.summary.totalValueOfBrand } };
      }
      return { ...prev, costing: { ...prev.costing, models: [], totalUnitCostUSD: 0, shipmentTotalUSD: 0, consignmentValue: 0, totalValueOfBrand: 0 } };
    });
  }, []);

  const updateSerialNumber = useCallback((index: number, value: string) => {
    setSerialInputs(prev => {
      const updated = [...prev];
      const old = updated[index];
      updated[index] = value;
      if (old && formData.serialCities[old]) {
        setFormData(pd => {
          const cities = { ...pd.serialCities };
          const city = cities[old]; delete cities[old];
          if (value) cities[value] = city;
          return { ...pd, serialCities: cities };
        });
      }
      return updated;
    });
  }, [formData.serialCities]);

  const updateSerialCity = useCallback((index: number, value: string) => {
    const key = serialInputs[index];
    if (!key) return;
    setFormData(prev => ({ ...prev, serialCities: { ...prev.serialCities, [key]: value } }));
  }, [serialInputs]);

  // ── These are passed to the View to handle per-model serial inputs ────────────
  // They live here so the view can call them and the updated selectedModels
  // flow through handleNext → URL params → payment ViewModel.
  // NOTE: selectedModels state lives in the VIEW (for with-costing path).
  // These helpers are passed down and called by the view's setter.
  // The view owns selectedModels state; we expose helpers here for validation only.

  // ── Validation ───────────────────────────────────────────────────────────────
  const validateForm = useCallback((selectedModels?: SelectedModel[]): boolean => {
    const errors: { [key: string]: string } = {};
    if (!formData.brandName.trim()) errors.brandName = 'Brand name is required';
    if (costingOption !== 'with' && !formData.modelName.trim()) errors.modelName = 'Model name is required';
    if (!formData.category.trim()) errors.category = 'Category is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (costingOption === 'with' && (!selectedModels || selectedModels.length === 0)) errors.models = 'At least one model is required';
    if (costingOption === 'with' && selectedModels) {
      // Validate per-model serial numbers
      selectedModels.forEach((m, i) => {
        const validSerials = m.serialNumbers.filter(s => s.trim() !== '');
        if (m.quantity > 0 && validSerials.length !== m.quantity) {
          errors[`serials_${i}`] = `${m.modelName}: provide ${m.quantity} serial number${m.quantity > 1 ? 's' : ''}`;
        }
      });
    } else {
      // without costing — single model serial validation
      const validSerials = serialInputs.filter(s => s.trim() !== '');
      if (formData.stock > 0 && validSerials.length !== formData.stock) errors.serialNumbers = `Please provide ${formData.stock} serial numbers`;
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, serialInputs, costingOption]);

  // Only block Next button on the minimum visible required fields
  const isValid = useMemo(() => {
    const hasBasic = formData.brandName.trim() !== '' && formData.category.trim() !== '';
    if (costingOption !== 'with') return formData.modelName.trim() !== '' && hasBasic;
    return hasBasic;
  }, [formData, costingOption]);

  const costingSummary = useMemo(() => ({
    totalUnitCostUSD:  formData.costing?.totalUnitCostUSD  || 0,
    shipmentTotalUSD:  formData.costing?.shipmentTotalUSD  || 0,
    consignmentValue:  formData.costing?.consignmentValue  || 0,
    totalValueOfBrand: formData.costing?.totalValueOfBrand || 0,
  }), [formData.costing]);

  // ── Navigation ───────────────────────────────────────────────────────────────
  const handleNext = useCallback((selectedModels?: SelectedModel[]) => {
    if (!validateForm(selectedModels)) return;
    const validSerials = serialInputs.filter(s => s.trim() !== '');
    const params = new URLSearchParams({
      type: inventoryType, costing: costingOption,
      brandName: formData.brandName, modelName: formData.modelName,
      category: formData.category, sellPrice: formData.sellPrice.toString(),
      buyType: formData.buyType, warrantyYears: formData.warrantyYears.toString(),
      stock: formData.stock.toString(), description: formData.description,
      status: formData.status, isDamaged: formData.isDamaged.toString(),
      serialNumbers: JSON.stringify(validSerials),
      serialCities:  JSON.stringify(formData.serialCities),
    });
    if (costingBrandId) params.set('costingBrandId', costingBrandId);
    if (costingOption === 'with' && formData.costing) {
      params.set('usdRate',           formData.costing.usdRate.toString());
      params.set('totalCustomsValue', formData.costing.totalCustomsValue.toString());
      params.set('totalFreightValue', formData.costing.totalFreightValue.toString());
      params.set('totalUnitCostUSD',  formData.costing.totalUnitCostUSD.toString());
      params.set('shipmentTotalUSD',  formData.costing.shipmentTotalUSD.toString());
      params.set('consignmentValue',  formData.costing.consignmentValue.toString());
      params.set('totalValueOfBrand', formData.costing.totalValueOfBrand.toString());
      params.set('costingModels',     JSON.stringify(formData.costing.models));
      params.set('costingBrandName',  formData.costing.brandName);
    }
    if (selectedModels?.length) {
      // selectedModels already contain serialNumbers + serialCities per model
      params.set('selectedModels', JSON.stringify(selectedModels));
    }
    navigate(`/inventory/create-new/payment?${params.toString()}`);
  }, [navigate, formData, serialInputs, costingOption, validateForm, inventoryType, costingBrandId]);

  const handleBack = useCallback(() => {
    if (costingOption === 'with') navigate(`/inventory/create-new/costing-details?type=${inventoryType}&costing=${costingOption}`);
    else navigate(`/inventory/create-new/costing?type=${inventoryType}`);
  }, [navigate, inventoryType, costingOption]);

  return {
    singleModel, setSingleModelField, formData, costingOption, inventoryType,
    costingBrandId, costingBrandName,
    preloadedModels, isLoadingModels,
    serialInputs, validationErrors, isValid,
    setBrandName, setModelName, setCategory, setSellPrice, setBuyType,
    setWarrantyYears, setStock, setDescription, setStatus, setIsDamaged,
    setCostingBrandName: setCostingBrandNameFn, setUsdRate, setTotalCustomsValue, setTotalFreightValue,
    addModel, updateModelField, removeModel,
    updateSerialNumber, updateSerialCity,
    // Dummy implementations — per-model serial updates are handled in the View's local state
    updateModelSerial: () => {},
    updateModelSerialCity: () => {},
    handleNext, handleBack,
    showCostingFields: costingOption === 'with',
    categories: CATEGORIES, cities: CITIES, costingSummary,
  };
}