// Inventory Module - ViewModel Layer
// useInventoryPaymentViewModel - Final step: payment & save to Firestore
// Change: reads `location` from URL params and passes it to CreateProductDTO

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ProductFormData, CostingOption, BuyType, ProductStatus,
  InventoryEntryType, CostingInfo, CostingModel, CreateProductDTO,
} from '../models/types';
import { InventoryFirebaseService, generateInventoryTransactionId } from '../models/InventoryFirebaseService';

export type PaymentStatusType = 'paid' | 'unpaid' | 'partial';

export interface UseInventoryPaymentViewModelReturn {
  formData: Partial<ProductFormData>;
  costingOption: CostingOption;
  inventoryType: InventoryEntryType;
  totalAmount: number;
  paymentStatus: PaymentStatusType;
  transactionId: string;
  isGeneratingId: boolean;
  isEditingTransactionId: boolean;
  paidAmount: number;
  remainingAmount: number;
  validationErrors: { [key: string]: string };
  isValid: boolean;
  isSaving: boolean;
  setPaymentStatus: (status: PaymentStatusType) => void;
  setTransactionId: (id: string) => void;
  setIsEditingTransactionId: (v: boolean) => void;
  setPaidAmount: (value: number) => void;
  handleSubmit: () => void;
  handleBack: () => void;
  formatCurrency: (amount: number) => string;
  productSummary: {
    brandName: string; modelName: string; category: string;
    stock: number; sellPrice: number; status: string; inventoryType: string;
    location: string;                                           // ← new
    totalValueOfBrand?: number; modelCount?: number;
  };
}

export function useInventoryPaymentViewModel(): UseInventoryPaymentViewModelReturn {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSaving, setIsSaving]                         = useState(false);
  const [isGeneratingId, setIsGeneratingId]             = useState(true);
  const [transactionId, setTransactionId]               = useState('');
  const [isEditingTransactionId, setIsEditingTransactionId] = useState(false);

  // ── Parse wizard state from URL ──────────────────────────────────────────────
  const costingOption = (searchParams.get('costing') as CostingOption)      || 'without';
  const inventoryType = (searchParams.get('type')    as InventoryEntryType) || 'in-stock';
  const brandName     = searchParams.get('brandName')    || '';
  const modelName     = searchParams.get('modelName')    || '';
  const category      = searchParams.get('category')     || '';
  const sellPrice     = Number(searchParams.get('sellPrice'))     || 0;
  const buyType       = (searchParams.get('buyType') as BuyType)  || 'Import';
  const warrantyYears = Number(searchParams.get('warrantyYears')) || 0;
  const stock         = Number(searchParams.get('stock'))         || 0;
  const description   = searchParams.get('description')  || '';
  const status        = (searchParams.get('status') as ProductStatus) || 'New';
  const isDamaged     = searchParams.get('isDamaged') === 'true';
  const location      = searchParams.get('location')     || '';  // ← new
  const costPrice     = Number(searchParams.get('costPrice'))     || 0;  // ← FIX: was never parsed
  const serialNumbers: string[]                = JSON.parse(searchParams.get('serialNumbers') || '[]');
  const serialCities:  { [k: string]: string } = JSON.parse(searchParams.get('serialCities')  || '{}');
  const costingBrandId = searchParams.get('costingBrandId') || '';

  let costing: CostingInfo | undefined;
  if (costingOption === 'with') {
    const models: CostingModel[] = JSON.parse(searchParams.get('costingModels') || '[]');
    costing = {
      brandName:         searchParams.get('costingBrandName') || brandName,
      usdRate:           Number(searchParams.get('usdRate'))           || 0,
      totalCustomsValue: Number(searchParams.get('totalCustomsValue')) || 0,
      totalFreightValue: Number(searchParams.get('totalFreightValue')) || 0,
      models,
      totalUnitCostUSD:  Number(searchParams.get('totalUnitCostUSD'))  || 0,
      shipmentTotalUSD:  Number(searchParams.get('shipmentTotalUSD'))  || 0,
      consignmentValue:  Number(searchParams.get('consignmentValue'))  || 0,
      totalValueOfBrand: Number(searchParams.get('totalValueOfBrand')) || 0,
    };
  }

  const selectedModels: Array<{
    modelId: string; modelName: string; costPrice: number; salePrice: number; quantity: number;
    serialNumbers?: string[]; serialCities?: { [k: string]: string };
  }> = JSON.parse(searchParams.get('selectedModels') || '[]');

  const formData: Partial<ProductFormData> = {
    costingOption, brandName, modelName, category, sellPrice, buyType,
    warrantyYears, stock, description, status, isDamaged,
    location,                                                   // ← new
    serialNumbers, serialCities, costing,
  };

  // Auto-generate transaction ID on mount
  useEffect(() => {
    const generate = async () => {
      setIsGeneratingId(true);
      try {
        const id = await generateInventoryTransactionId();
        setTransactionId(id);
      } catch {
        const now  = new Date();
        const dd   = String(now.getDate()).padStart(2, '0');
        const mm   = String(now.getMonth() + 1).padStart(2, '0');
        const yy   = String(now.getFullYear()).slice(-2);
        setTransactionId(`INV-${dd}${mm}${yy}-001`);
      } finally {
        setIsGeneratingId(false);
      }
    };
    generate();
  }, []);

  const [paymentStatus, setPaymentStatusState] = useState<PaymentStatusType>('paid');
  const [paidAmount, setPaidAmountState]       = useState(0);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const totalAmount = useMemo(() => {
    if (costingOption === 'with' && costing?.totalValueOfBrand) return costing.totalValueOfBrand;
    return sellPrice * stock;
  }, [costingOption, costing?.totalValueOfBrand, sellPrice, stock]);

  const remainingAmount = useMemo(() => totalAmount - paidAmount, [totalAmount, paidAmount]);

  const setPaymentStatus = useCallback((s: PaymentStatusType) => {
    setPaymentStatusState(s);
    if (s === 'unpaid')       setPaidAmountState(0);
    else if (s === 'paid')    setPaidAmountState(totalAmount);
    else                      setPaidAmountState(0);
  }, [totalAmount]);

  const setPaidAmount = useCallback((v: number) => setPaidAmountState(v), []);

  const formatCurrency = useCallback((amount: number) =>
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(amount)
  , []);

  const validateForm = useCallback((): boolean => {
    const errors: { [key: string]: string } = {};
    if (!transactionId.trim()) errors.transactionId = 'Transaction ID is required';
    if (paymentStatus === 'partial' && paidAmount <= 0)
      errors.paidAmount = 'Paid amount must be greater than 0 for partial payments';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [paymentStatus, paidAmount, transactionId]);

  const isValid = useMemo(() => {
    if (isGeneratingId) return false;
    if (!transactionId.trim()) return false;
    if (paymentStatus === 'partial') return paidAmount > 0;
    return true;
  }, [paymentStatus, paidAmount, isGeneratingId, transactionId]);

  // Save to Firestore
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;
    setIsSaving(true);

    try {
      const isOnOrder = inventoryType === 'on-order';
      const paymentInfo = {
        paymentStatus,
        transactionId: paymentStatus !== 'unpaid' ? transactionId : undefined,
        paidAmount:    paymentStatus !== 'unpaid' ? paidAmount    : undefined,
        totalAmount,
      };

      if (costingOption === 'with' && selectedModels.length > 0) {
        // One product doc per model — all share the same location
        for (const sm of selectedModels) {
          const validSerials = (sm.serialNumbers || []).filter((s: string) => s.trim() !== '');
          // If per-serial cities not filled, seed from the shared location
          const smSerialCities: { [k: string]: string } = { ...(sm.serialCities || {}) };
          if (location) {
            validSerials.forEach((s: string) => {
              if (!smSerialCities[s]) smSerialCities[s] = location;
            });
          }
          const dto: CreateProductDTO = {
            brandName,
            modelName:     sm.modelName,
            category,
            costPrice:     sm.costPrice,  // ← FIX: was missing
            sellPrice:     sm.salePrice,
            buyType,
            warrantyYears,
            stock:         sm.quantity,
            location,                                           // ← new
            serialNumbers: validSerials,
            serialCities:  smSerialCities,
            description,
            status:        isOnOrder ? 'On-Order' : status,
            isDamaged,
            costingOption: 'with',
            costing,
            receivableStatus:    isOnOrder ? 'Pending'  : undefined,
            expectedReceiveDate: isOnOrder ? undefined  : undefined,
          };
          await InventoryFirebaseService.createProduct(dto, paymentInfo);
        }
      } else {
        // Seed serialCities from location if not already set
        const seededCities: { [k: string]: string } = { ...serialCities };
        if (location) {
          serialNumbers.forEach(s => {
            if (!seededCities[s]) seededCities[s] = location;
          });
        }
        const dto: CreateProductDTO = {
          brandName, modelName, category, costPrice, sellPrice, buyType, warrantyYears,  // ← FIX: costPrice added
          stock, location,
          serialNumbers, serialCities: seededCities,
          description,
          status:        isOnOrder ? 'On-Order'  : status,
          isDamaged,
          costingOption: costingOption === 'with' ? 'with' : 'without',
          costing:       costingOption === 'with' ? costing : undefined,
          receivableStatus:    isOnOrder ? 'Pending'  : undefined,
          expectedReceiveDate: isOnOrder ? undefined  : undefined,
        };
        await InventoryFirebaseService.createProduct(dto, paymentInfo);
      }

      toast.success(isOnOrder
        ? `✅ Product saved to Receivable Stock — Transaction: ${transactionId}`
        : `✅ Product added to Inventory — Transaction: ${transactionId}`
      );
      navigate(isOnOrder ? '/inventory/receivable' : '/inventory/view');
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [
    validateForm, costingOption, selectedModels, brandName, modelName,
    category, sellPrice, buyType, warrantyYears, stock, description, status,
    isDamaged, serialNumbers, serialCities, inventoryType, costing,
    paymentStatus, transactionId, paidAmount, totalAmount, navigate, location,
  ]);

  const handleBack = useCallback(() => {
    const params = new URLSearchParams({
      type: inventoryType, costing: costingOption, brandName, modelName,
      category, costPrice: costPrice.toString(), sellPrice: sellPrice.toString(), buyType,  // ← FIX: costPrice added
      warrantyYears: warrantyYears.toString(), stock: stock.toString(),
      description, status, isDamaged: isDamaged.toString(),
      location,                                                 // ← new
      serialNumbers: JSON.stringify(serialNumbers),
      serialCities:  JSON.stringify(serialCities),
    });
    if (costingBrandId) params.set('costingBrandId', costingBrandId);
    if (costingOption === 'with' && costing) {
      params.set('usdRate',           costing.usdRate.toString());
      params.set('totalCustomsValue', costing.totalCustomsValue.toString());
      params.set('totalFreightValue', costing.totalFreightValue.toString());
      params.set('shipmentTotalUSD',  costing.shipmentTotalUSD.toString());
      params.set('consignmentValue',  costing.consignmentValue.toString());
      params.set('totalValueOfBrand', costing.totalValueOfBrand.toString());
      params.set('totalUnitCostUSD',  costing.totalUnitCostUSD.toString());
      params.set('costingModels',     JSON.stringify(costing.models));
      params.set('costingBrandName',  costing.brandName);
    }
    params.set('selectedModels', JSON.stringify(selectedModels));
    navigate(`/inventory/create-new/details?${params.toString()}`);
  }, [
    navigate, inventoryType, costingOption, brandName, modelName, category, sellPrice,
    buyType, warrantyYears, stock, description, status, isDamaged, location,
    serialNumbers, serialCities, costing, selectedModels, costingBrandId,
  ]);

  const productSummary = useMemo(() => ({
    brandName, modelName, category, stock, sellPrice, status, inventoryType,
    location,                                                   // ← new
    totalValueOfBrand: costingOption === 'with' ? costing?.totalValueOfBrand : undefined,
    modelCount:        costingOption === 'with' ? costing?.models.length      : undefined,
  }), [brandName, modelName, category, stock, sellPrice, status, inventoryType, costingOption, costing, location]);

  return {
    formData, costingOption, inventoryType, totalAmount,
    paymentStatus, transactionId, isGeneratingId,
    isEditingTransactionId, setIsEditingTransactionId,
    paidAmount, remainingAmount,
    validationErrors, isValid, isSaving,
    setPaymentStatus,
    setTransactionId,
    setPaidAmount,
    handleSubmit, handleBack, formatCurrency, productSummary,
  };
}