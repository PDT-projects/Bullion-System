// Inventory Module - ViewModel Layer
// useInventoryPaymentViewModel - Step 3: Payment information
// Updated to handle multi-model costing

import { useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  ProductFormData, 
  CostingOption, 
  BuyType, 
  ProductStatus, 
  CreateProductDTO, 
  InventoryEntryType, 
  Product,
  CostingInfo,
  CostingModel
} from '../models/types';

import { InventoryDataConnectService } from '../../../api/dataconnect/inventoryDataConnectService';

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
    totalValueOfBrand?: number;
    modelCount?: number;
  };
}

export function useInventoryPaymentViewModel(): UseInventoryPaymentViewModelReturn {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get refreshProducts from context (if available)
  const { refreshProducts } = (useOutletContext<{ refreshProducts?: () => Promise<void> }>()) || {};
  
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
  
  // Parse new multi-model costing fields if applicable
  let costing: CostingInfo | undefined;
  
  if (costingOption === 'with') {
    // Parse the models array from URL
    const costingModelsJson = searchParams.get('costingModels');
    const models: CostingModel[] = costingModelsJson ? JSON.parse(costingModelsJson) : [];
    
    costing = {
      usdRate: Number(searchParams.get('usdRate')) || 0,
      totalCustomsValue: Number(searchParams.get('totalCustomsValue')) || 0,
      totalFreightValue: Number(searchParams.get('totalFreightValue')) || 0,
      models: models,
      totalUnitCostUSD: Number(searchParams.get('totalUnitCostUSD')) || 0,
      shipmentTotalUSD: Number(searchParams.get('shipmentTotalUSD')) || 0,
      consignmentValue: Number(searchParams.get('consignmentValue')) || 0,
      totalValueOfBrand: Number(searchParams.get('totalValueOfBrand')) || 0,
    };
  }

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

  // Calculate totals - use totalValueOfBrand for costing products
  const totalAmount = useMemo(() => {
    if (costingOption === 'with' && costing?.totalValueOfBrand) {
      return costing.totalValueOfBrand;
    }
    return sellPrice * stock;
  }, [costingOption, costing?.totalValueOfBrand, sellPrice, stock]);
  
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

  // Submit handler - Now saves to Data Connect
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    try {
      // Create the product object for Data Connect
      const productData: Omit<Product, 'id'> = {
        brandName,
        modelName,
        category,
        costPrice: 0, // Will be calculated from costing if needed
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

      console.log('Creating product in Data Connect:', productData);
      
      // Save to Firebase Data Connect
      const createdProduct = await InventoryDataConnectService.createProduct(productData);
      
      console.log('✅ Product created in Data Connect:', createdProduct.id);
      toast.success('Inventory created successfully!');
      
      // Refresh products list if function is available
      if (refreshProducts) {
        await refreshProducts();
      }
      
      navigate('/inventory/view');
    } catch (error) {
      console.error('❌ Error creating product in Data Connect:', error);
      toast.error('Failed to create inventory. Please try again.');
    }
  }, [validateForm, navigate, brandName, modelName, category, sellPrice, buyType, warrantyYears, stock, serialNumbers, serialCities, description, status, isDamaged, costingOption, costing, refreshProducts]);

  // Back handler - Updated for multi-model costing
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
    
    // Add new multi-model costing fields if applicable
    if (costingOption === 'with' && costing) {
      queryParams.set('usdRate', costing.usdRate.toString());
      queryParams.set('totalCustomsValue', costing.totalCustomsValue.toString());
      queryParams.set('totalFreightValue', costing.totalFreightValue.toString());
      queryParams.set('shipmentTotalUSD', costing.shipmentTotalUSD.toString());
      queryParams.set('consignmentValue', costing.consignmentValue.toString());
      queryParams.set('totalValueOfBrand', costing.totalValueOfBrand.toString());
      
      // Serialize models array
      queryParams.set('costingModels', JSON.stringify(costing.models));
    }
    
    navigate(`/inventory/create-new/details?${queryParams.toString()}`);
  }, [navigate, inventoryType, costingOption, brandName, modelName, category, sellPrice, buyType, warrantyYears, stock, description, status, isDamaged, serialNumbers, serialCities, costing]);


  // Product summary for display - Updated for multi-model
  const productSummary = useMemo(() => ({
    brandName,
    modelName,
    category,
    stock,
    sellPrice,
    status,
    totalValueOfBrand: costingOption === 'with' ? costing?.totalValueOfBrand : undefined,
    modelCount: costingOption === 'with' ? costing?.models.length : undefined,
  }), [brandName, modelName, category, stock, sellPrice, status, costingOption, costing?.totalValueOfBrand, costing?.models.length]);

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
