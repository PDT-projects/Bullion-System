// Inventory Module - ViewModel Layer
// useInventoryPaymentViewModel - Step 3: Payment information

import { useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ProductFormData, CostingOption, BuyType, ProductStatus, CreateProductDTO, InventoryEntryType } from '../models/types';

import { InventoryService } from '../models/inventoryService';

export type PaymentStatus = 'paid' | 'unpaid' | 'partial';

export interface UseInventoryPaymentViewModelReturn {
  // Form data from previous steps
  formData: Partial<ProductFormData>;
  costingOption: CostingOption;
  inventoryType: InventoryEntryType;
  totalAmount: number;

  
  // Payment state
  paymentStatus: PaymentStatus;
  transactionId: string;
  paidAmount: number;
  remainingAmount: number;
  
  // Validation
  validationErrors: { [key: string]: string };
  isValid: boolean;
  
  // Actions
  setPaymentStatus: (status: PaymentStatus) => void;
  setTransactionId: (value: string) => void;
  setPaidAmount: (value: number) => void;
  
  // Navigation
  handleSubmit: () => void;
  handleBack: () => void;
  
  // Utilities
  formatCurrency: (amount: number) => string;
  productSummary: {
    brandName: string;
    modelName: string;
    category: string;
    stock: number;
    sellPrice: number;
    status: string;
  };
}

export function useInventoryPaymentViewModel(): UseInventoryPaymentViewModelReturn {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Parse form data from URL params
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
  const serialNumbers = JSON.parse(searchParams.get('serialNumbers') || '[]');
  const serialCities = JSON.parse(searchParams.get('serialCities') || '{}');
  
  // Parse costing fields if applicable
  const costing = costingOption === 'with' ? {
    units: Number(searchParams.get('costingUnits')) || 0,
    unitCostUSD: Number(searchParams.get('unitCostUSD')) || 0,
    totalCostUSD: Number(searchParams.get('totalCostUSD')) || 0,
    percentage: Number(searchParams.get('percentage')) || 0,
    customPerModel: Number(searchParams.get('customPerModel')) || 0,
    customPerUnit: Number(searchParams.get('customPerUnit')) || 0,
    freightPerModel: Number(searchParams.get('freightPerModel')) || 0,
    freightPerUnit: Number(searchParams.get('freightPerUnit')) || 0,
    unitCostPKR: Number(searchParams.get('unitCostPKR')) || 0,
    totalUnitCost: Number(searchParams.get('totalUnitCost')) || 0,
    totalShipmentValuePKR: Number(searchParams.get('totalShipmentValuePKR')) || 0,
  } : undefined;

  const formData: Partial<ProductFormData> = {
    costingOption,
    brandName,
    modelName,
    category,
    sellPrice,
    buyType,
    warrantyYears,
    stock,
    description,
    status,
    isDamaged,
    serialNumbers,
    serialCities,
    costing,
  };

  // Payment state
  const [paymentStatus, setPaymentStatusState] = useState<PaymentStatus>('paid');
  const [transactionId, setTransactionId] = useState('');
  const [paidAmount, setPaidAmountState] = useState(0);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  // Calculate totals
  const totalAmount = useMemo(() => sellPrice * stock, [sellPrice, stock]);
  const remainingAmount = useMemo(() => totalAmount - paidAmount, [totalAmount, paidAmount]);

  // Payment status change handler
  const setPaymentStatus = useCallback((status: PaymentStatus) => {
    setPaymentStatusState(status);
    
    // Auto-adjust paid amount based on status
    if (status === 'unpaid') {
      setTransactionId('');
      setPaidAmountState(0);
    } else if (status === 'paid') {
      setPaidAmountState(totalAmount);
    } else if (status === 'partial') {
      setPaidAmountState(0);
    }
  }, [totalAmount]);

  // Paid amount change handler
  const setPaidAmount = useCallback((amount: number) => {
    setPaidAmountState(amount);
  }, []);

  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 2,
    }).format(amount);
  }, []);

  // Validation
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
    if (paymentStatus === 'partial') {
      return transactionId.trim() !== '' && paidAmount > 0;
    }
    return false;
  }, [paymentStatus, transactionId, paidAmount]);

  // Submit handler
  const handleSubmit = useCallback(() => {
    if (!validateForm()) return;

    // Create the product DTO
    const productData: CreateProductDTO = {
      brandName,
      modelName,
      category,
      sellPrice,
      buyType,
      warrantyYears,
      stock,
      serialNumbers,
      serialCities,
      description,
      status,
      isDamaged,
      costingOption,
      costing,
    };

    // In a real app, this would call an API
    // For now, we'll just show success and navigate
    console.log('Creating product:', productData);
    
    toast.success('Inventory created successfully!');
    navigate('/inventory/view');
  }, [validateForm, formData, navigate, brandName, modelName, category, sellPrice, buyType, warrantyYears, stock, serialNumbers, serialCities, description, status, isDamaged, costingOption, costing]);

  // Back handler
  const handleBack = useCallback(() => {
    // Navigate back to product details with all params
    const queryParams = new URLSearchParams({
      type: inventoryType,
      costing: costingOption,
      brandName,
      modelName,
      category,
      sellPrice: sellPrice.toString(),
      buyType,
      warrantyYears: warrantyYears.toString(),
      stock: stock.toString(),
      description,
      status,
      isDamaged: isDamaged.toString(),
      serialNumbers: JSON.stringify(serialNumbers),
      serialCities: JSON.stringify(serialCities),
    });
    
    // Add costing fields if applicable
    if (costingOption === 'with' && costing) {
      queryParams.set('costingUnits', costing.units.toString());
      queryParams.set('unitCostUSD', costing.unitCostUSD.toString());
      queryParams.set('totalCostUSD', costing.totalCostUSD.toString());
      queryParams.set('percentage', costing.percentage.toString());
      queryParams.set('customPerModel', costing.customPerModel.toString());
      queryParams.set('customPerUnit', costing.customPerUnit.toString());
      queryParams.set('freightPerModel', costing.freightPerModel.toString());
      queryParams.set('freightPerUnit', costing.freightPerUnit.toString());
      queryParams.set('unitCostPKR', costing.unitCostPKR.toString());
      queryParams.set('totalUnitCost', costing.totalUnitCost.toString());
      queryParams.set('totalShipmentValuePKR', costing.totalShipmentValuePKR.toString());
    }
    
    navigate(`/inventory/create-new/details?${queryParams.toString()}`);
  }, [navigate, inventoryType, costingOption, brandName, modelName, category, sellPrice, buyType, warrantyYears, stock, description, status, isDamaged, serialNumbers, serialCities, costing]);


  // Product summary for display
  const productSummary = useMemo(() => ({
    brandName,
    modelName,
    category,
    stock,
    sellPrice,
    status,
  }), [brandName, modelName, category, stock, sellPrice, status]);

  return {
    formData,
    costingOption,
    inventoryType,
    totalAmount,

    paymentStatus,
    transactionId,
    paidAmount,
    remainingAmount,
    validationErrors,
    isValid,
    setPaymentStatus,
    setTransactionId,
    setPaidAmount,
    handleSubmit,
    handleBack,
    formatCurrency,
    productSummary,
  };
}
