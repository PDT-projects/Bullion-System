// Inventory Module - ViewModel Layer
// useInventoryPaymentViewModel - Final step: saves product to DataConnect
// Handles both 'in-stock' and 'on-order' (receivable) inventory types

import { useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ProductFormData,
  CostingOption,
  BuyType,
  ProductStatus,
  InventoryEntryType,
  Product,
  CostingInfo,
  CostingModel,
} from '../models/types';
import { InventoryDataConnectService } from '../../../api/dataconnect/inventoryDataConnectService';

export type PaymentStatus = 'paid' | 'unpaid' | 'partial';

export interface UseInventoryPaymentViewModelReturn {
  formData: Partial<ProductFormData>;
  costingOption: CostingOption;
  inventoryType: InventoryEntryType;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  transactionId: string;
  paidAmount: number;
  remainingAmount: number;
  validationErrors: { [key: string]: string };
  isValid: boolean;
  isSaving: boolean;
  setPaymentStatus: (status: PaymentStatus) => void;
  setTransactionId: (value: string) => void;
  setPaidAmount: (value: number) => void;
  handleSubmit: () => void;
  handleBack: () => void;
  formatCurrency: (amount: number) => string;
  productSummary: {
    brandName: string;
    modelName: string;
    category: string;
    stock: number;
    sellPrice: number;
    status: string;
    inventoryType: string;
    totalValueOfBrand?: number;
    modelCount?: number;
  };
}

export function useInventoryPaymentViewModel(): UseInventoryPaymentViewModelReturn {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSaving, setIsSaving] = useState(false);

  const outletContext = useOutletContext<{
    refreshProducts?: () => Promise<void>;
    setProducts?: (products: Product[]) => void;
    products?: Product[];
  }>() || {};
  const { refreshProducts } = outletContext;

  const costingOption = (searchParams.get('costing') as CostingOption) || 'without';
  const inventoryType = (searchParams.get('type') as InventoryEntryType) || 'in-stock';
  const brandName = searchParams.get('brandName') || '';
  const modelName = searchParams.get('modelName') || '';
  const category = searchParams.get('category') || '';
  const sellPrice = Number(searchParams.get('sellPrice')) || 0;
  const buyType = (searchParams.get('buyType') as BuyType) || 'Import';
  const warrantyYears = Number(searchParams.get('warrantyYears')) || 0;
  const stock = Number(searchParams.get('stock')) || 0;
  const description = searchParams.get('description') || '';
  const status = (searchParams.get('status') as ProductStatus) || 'New';
  const isDamaged = searchParams.get('isDamaged') === 'true';
  const serialNumbers: string[] = JSON.parse(searchParams.get('serialNumbers') || '[]');
  const serialCities: { [key: string]: string } = JSON.parse(searchParams.get('serialCities') || '{}');

  let costing: CostingInfo | undefined;
  if (costingOption === 'with') {
    const costingModelsJson = searchParams.get('costingModels');
    const models: CostingModel[] = costingModelsJson ? JSON.parse(costingModelsJson) : [];
    costing = {
      brandName: searchParams.get('costingBrandName') || brandName,
      usdRate: Number(searchParams.get('usdRate')) || 0,
      totalCustomsValue: Number(searchParams.get('totalCustomsValue')) || 0,
      totalFreightValue: Number(searchParams.get('totalFreightValue')) || 0,
      models,
      totalUnitCostUSD: Number(searchParams.get('totalUnitCostUSD')) || 0,
      shipmentTotalUSD: Number(searchParams.get('shipmentTotalUSD')) || 0,
      consignmentValue: Number(searchParams.get('consignmentValue')) || 0,
      totalValueOfBrand: Number(searchParams.get('totalValueOfBrand')) || 0,
    };
  }

  const selectedModelsJson = searchParams.get('selectedModels');
  const selectedModels = selectedModelsJson ? JSON.parse(selectedModelsJson) : [];

  const formData: Partial<ProductFormData> = {
    costingOption, brandName, modelName, category, sellPrice, buyType,
    warrantyYears, stock, description, status, isDamaged,
    serialNumbers, serialCities, costing,
  };

  const [paymentStatus, setPaymentStatusState] = useState<PaymentStatus>('paid');
  const [transactionId, setTransactionId] = useState('');
  const [paidAmount, setPaidAmountState] = useState(0);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const totalAmount = useMemo(() => {
    if (costingOption === 'with' && costing?.totalValueOfBrand) return costing.totalValueOfBrand;
    return sellPrice * stock;
  }, [costingOption, costing?.totalValueOfBrand, sellPrice, stock]);

  const remainingAmount = useMemo(() => totalAmount - paidAmount, [totalAmount, paidAmount]);

  const setPaymentStatus = useCallback((status: PaymentStatus) => {
    setPaymentStatusState(status);
    if (status === 'unpaid') { setTransactionId(''); setPaidAmountState(0); }
    else if (status === 'paid') { setPaidAmountState(totalAmount); }
    else { setPaidAmountState(0); }
  }, [totalAmount]);

  const setPaidAmount = useCallback((amount: number) => setPaidAmountState(amount), []);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(amount);
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: { [key: string]: string } = {};
    if ((paymentStatus === 'paid' || paymentStatus === 'partial') && !transactionId.trim()) {
      errors.transactionId = 'Transaction ID is required for Paid and Partial payments';
    }
    if (paymentStatus === 'partial' && paidAmount <= 0) {
      errors.paidAmount = 'Paid amount must be greater than 0 for partial payments';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [paymentStatus, transactionId, paidAmount]);

  const isValid = useMemo(() => {
    if (paymentStatus === 'unpaid') return true;
    if (paymentStatus === 'paid') return transactionId.trim() !== '';
    if (paymentStatus === 'partial') return transactionId.trim() !== '' && paidAmount > 0;
    return false;
  }, [paymentStatus, transactionId, paidAmount]);

  // ── Submit: save to DataConnect ──
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      if (costingOption === 'with' && selectedModels.length > 0) {
        for (const sm of selectedModels) {
          await InventoryDataConnectService.saveProduct({
            brandName: brandName || sm.modelName,
            modelName: sm.modelName,
            category,
            costPrice: sm.costPrice || 0,
            sellPrice: sm.salePrice || sellPrice,
            buyType,
            warrantyYears,
            stock: sm.quantity || stock,
            description,
            status,
            isDamaged,
            serialNumbers,
            serialCities,
            inventoryType,
            costingOption,
            costingUsdRate: costing?.usdRate,
            costingTotalCustomsValue: costing?.totalCustomsValue,
            costingTotalFreightValue: costing?.totalFreightValue,
            costingShipmentTotalUSD: costing?.shipmentTotalUSD,
            costingConsignmentValue: costing?.consignmentValue,
            costingTotalValueOfBrand: costing?.totalValueOfBrand,
            paymentStatus,
            transactionId,
            paidAmount,
            remainingAmount,
          } as any);
        }
      } else {
        await InventoryDataConnectService.saveProduct({
          brandName, modelName, category,
          costPrice: 0, sellPrice, buyType, warrantyYears, stock,
          description, status, isDamaged, serialNumbers, serialCities,
          inventoryType, costingOption,
          paymentStatus,
          transactionId,
          paidAmount,
          remainingAmount,
        } as any);
      }

      if (refreshProducts) await refreshProducts();

      const isOnOrder = inventoryType === 'on-order';
      toast.success(isOnOrder
        ? '✅ Product saved to Receivable Stock (Pending arrival)'
        : '✅ Product added to Inventory!'
      );
      navigate(isOnOrder ? '/inventory/receivable' : '/inventory/view');
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [
    validateForm, costingOption, selectedModels, brandName, modelName, category,
    sellPrice, buyType, warrantyYears, stock, description, status, isDamaged,
    serialNumbers, serialCities, inventoryType, costing, paymentStatus,
    transactionId, paidAmount, remainingAmount, totalAmount, refreshProducts, navigate,
  ]);

  const handleBack = useCallback(() => {
    const queryParams = new URLSearchParams({
      type: inventoryType, costing: costingOption, brandName, modelName,
      category, sellPrice: sellPrice.toString(), buyType,
      warrantyYears: warrantyYears.toString(), stock: stock.toString(),
      description, status, isDamaged: isDamaged.toString(),
      serialNumbers: JSON.stringify(serialNumbers),
      serialCities: JSON.stringify(serialCities),
    });
    if (costingOption === 'with' && costing) {
      queryParams.set('usdRate', costing.usdRate.toString());
      queryParams.set('totalCustomsValue', costing.totalCustomsValue.toString());
      queryParams.set('totalFreightValue', costing.totalFreightValue.toString());
      queryParams.set('shipmentTotalUSD', costing.shipmentTotalUSD.toString());
      queryParams.set('consignmentValue', costing.consignmentValue.toString());
      queryParams.set('totalValueOfBrand', costing.totalValueOfBrand.toString());
      queryParams.set('costingModels', JSON.stringify(costing.models));
    }
    navigate(`/inventory/create-new/details?${queryParams.toString()}`);
  }, [
    navigate, inventoryType, costingOption, brandName, modelName, category,
    sellPrice, buyType, warrantyYears, stock, description, status, isDamaged,
    serialNumbers, serialCities, costing,
  ]);

  const productSummary = useMemo(() => ({
    brandName, modelName, category, stock, sellPrice, status, inventoryType,
    totalValueOfBrand: costingOption === 'with' ? costing?.totalValueOfBrand : undefined,
    modelCount: costingOption === 'with' ? costing?.models.length : undefined,
  }), [brandName, modelName, category, stock, sellPrice, status, inventoryType, costingOption, costing]);

  return {
    formData, costingOption, inventoryType, totalAmount, paymentStatus,
    transactionId, paidAmount, remainingAmount, validationErrors, isValid,
    isSaving, setPaymentStatus, setTransactionId, setPaidAmount,
    handleSubmit, handleBack, formatCurrency, productSummary,
  };
}
