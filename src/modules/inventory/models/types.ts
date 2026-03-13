// Inventory Module - Model Layer
// Type definitions for Inventory and Product Transfer

/**
 * Product status in the inventory system
 */
export type ProductStatus = 'New' | 'In Transit' | 'On-Order' | 'Receivable' | 'Available' | 'Sold' | 'Damaged' | 'Returned' | 'Used';

/**
 * Product buy type
 */
export type BuyType = 'Import' | 'Export';

/**
 * Serial number status
 */
export type SerialStatus = 'Available' | 'In Transit' | 'Damaged' | 'Returned';

/**
 * Payment status
 */
export type PaymentStatus = 'Pending' | 'Partial' | 'Complete';

/**
 * Costing option type
 */
export type CostingOption = 'with' | 'without';

/**
 * Inventory entry type - determines if product is in stock or on order
 */
export type InventoryEntryType = 'in-stock' | 'on-order';


/**
 * Single Model Costing - for multi-model support
 * Each model in the costing list has these calculated values
 */
export interface CostingModel {
  id: string;
  modelName: string;
  units: number;
  unitCostUSD: number;
  // Calculated fields
  totalCostUSD: number;
  percentage: number;
  customPerModel: number;
  customPerUnit: number;
  freightPerModel: number;
  freightPerUnit: number;
  unitCostPKR: number;
  totalLandedUnitCost: number;
  totalShipmentValuePKR: number;
}

/**
 * Costing information (when costingOption === 'with')
 * Supports multiple models per brand
 */
export interface CostingInfo {
  // Brand name for this costing batch - NEW FIELD
  brandName: string;
  
  // Global inputs for multi-model costing
  usdRate: number;
  totalCustomsValue: number;
  totalFreightValue: number;
  
  // Array of models
  models: CostingModel[];
  
  // Calculated summary
  // Total Unit Cost USD = sum of all models' unitCostUSD (for percentage calculation)
  totalUnitCostUSD: number;
  // Shipment Total USD = sum of all models' (units * unitCostUSD)
  shipmentTotalUSD: number;
  consignmentValue: number;
  totalValueOfBrand: number;
}

/**
 * Main Product interface
 */
export interface Product {
  id: string;
  brandName: string;
  modelName: string;
  category: string;
  costPrice: number;
  sellPrice: number;
  buyType: BuyType;
  warrantyYears: number;
  stock: number;
  serialNumbers: string[];
  serialCities: { [serialNumber: string]: string };
  serialStatus?: { [serialNumber: string]: SerialStatus };
  description: string;
  status: ProductStatus;
  isDamaged?: boolean;
  createdAt?: string;
  updatedAt?: string;
  
    // Optional fields for linking to brand/model/costing
  brandId?: string;
  modelId?: string;
  costingId?: string;
  
  // Receivable stock fields
  billId?: string;
  receivableStatus?: 'Pending' | 'Received';
  expectedReceiveDate?: string;

  // Costing fields (when costingOption === 'with')
  costingOption?: CostingOption;
  costing?: CostingInfo;
  // Flat costing fields for Data Connect compatibility
  costingUnits?: number;
  costingUnitCostUSD?: number;
  costingTotalCostUSD?: number;
  costingPercentage?: number;
  costingCustomPerModel?: number;
  costingCustomPerUnit?: number;
  costingFreightPerModel?: number;
  costingFreightPerUnit?: number;
  costingUnitCostPKR?: number;
  costingTotalUnitCost?: number;
  costingTotalShipmentValuePKR?: number;
  costingUsdRate?: number;
  costingTotalCustomsValue?: number;
  costingTotalFreightValue?: number;
  costingShipmentTotalUSD?: number;
  costingConsignmentValue?: number;
  costingTotalValueOfBrand?: number;
  costingModelsJson?: string;
}

export interface ReceivableProduct extends Product {
  billId: string;
  receivableStatus: 'Pending' | 'Received';
  expectedReceiveDate: string;
}

/**
 * Brand-Model relationship for dropdown selection
 */
export interface BrandModel {
  id: string;
  brandName: string;
  modelName: string;
  category: string;
  createdAt?: string;
}

/**
 * Brand with models for dropdown grouping
 */
export interface BrandWithModels {
  brandName: string;
  models: string[];
}

/**
 * DTO for creating a new product
 */
export interface CreateProductDTO {
  // Basic fields
  brandName: string;
  modelName: string;
  category: string;
  sellPrice: number;
  buyType: BuyType;
  warrantyYears: number;
  stock: number;
  serialNumbers: string[];
  serialCities: { [serialNumber: string]: string };
  description: string;
  status: ProductStatus;
  isDamaged: boolean;
  
  // Receivable fields (optional)
  billId?: string;
  receivableStatus?: 'Pending' | 'Received';
  expectedReceiveDate?: string;
  
  // Costing option
  costingOption?: CostingOption;
  
  // Costing fields (when costingOption === 'with')
  costing?: CostingInfo;
}

/**
 * Product form data (partial for wizard)
 */
export interface ProductFormData {
  // Step tracking
  currentStep: number; // 1=costing, 2=details, 3=payment
  
  // Costing option
  costingOption?: CostingOption;
  
  // Basic fields (always shown)
  brandName: string;
  modelName: string;
  category: string;
  sellPrice: number;
  buyType: BuyType;
  warrantyYears: number;
  stock: number;
  description: string;
  status: ProductStatus;
  isDamaged: boolean;
  
  // Serial numbers
  serialNumbers: string[];
  serialCities: { [serialNumber: string]: string };
  
  // Costing fields (when costingOption === 'with')
  costing?: CostingInfo;
  
  // Payment fields
  paymentStatus?: 'paid' | 'unpaid' | 'partial';
  transactionId?: string;
  paidAmount?: number;
  paymentMethod?: 'Cash' | 'Bank' | 'Cheque' | 'Credit';
  bankId?: string;
}

/**
 * Product Transfer interface
 */
export interface ProductTransfer {
  id: string;
  productId: string;
  productName: string;
  brandName?: string;
  modelName?: string;
  fromLocation: string;
  toLocation: string;
  quantity: number;
  serialNumbers: string[];
  date: string;
  transferDate?: string;
  status: 'Pending' | 'In Transit' | 'Completed' | 'Cancelled' | 'Received';
  transferredBy?: string;
  note?: string;
  notes?: string;
  createdAt?: string;
  receivedAt?: string;
  receiptName?: string;
  receiptType?: string;
  receiptDataUrl?: string;
}


/**
 * DTO for updating a product
 */
export interface UpdateProductDTO {
  brandName?: string;
  modelName?: string;
  category?: string;
  costPrice?: number;
  sellPrice?: number;
  buyType?: BuyType;
  warrantyYears?: number;
  stock?: number;
  serialNumbers?: string[];
  serialCities?: { [serialNumber: string]: string };
  description?: string;
  status?: ProductStatus;
  isDamaged?: boolean;
  costingOption?: CostingOption;
  costing?: CostingInfo;
}

/**
 * DTO for creating a transfer
 */
export interface CreateTransferDTO {
  productId: string;
  fromLocation: string;
  toLocation: string;
  quantity: number;
  serialNumbers: string[];
  transferDate: string;
  notes?: string;
}

/**
 * Product filters interface
 */
export interface ProductFilters {
  brandSearch: string;
  modelSearch: string;
  categoryFilter: string;
  statusFilter: ProductStatus | '';
  buyTypeFilter: BuyType | '';
  minPrice: number | null;
  maxPrice: number | null;
  hasStock: boolean | null;
}

/**
 * Transfer filters interface
 */
export interface TransferFilters {
  productSearch: string;
  fromLocation: string;
  toLocation: string;
  statusFilter: ProductTransfer['status'] | '';
  dateFrom: string;
  dateTo: string;
}

/**
 * Product statistics
 */
export interface ProductStats {
  totalProducts: number;
  totalStock: number;
  totalValue: number;
  newProducts: number;
  inTransit: number;
  available: number;
  categories: { [key: string]: number };
}

/**
 * Transfer statistics
 */
export interface TransferStats {
  totalTransfers: number;
  pendingTransfers: number;
  completedTransfers: number;
  inTransitTransfers: number;
  totalQuantityMoved: number;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  fieldErrors?: { [key: string]: string };
}

/**
 * DTO for creating a payment
 */
export interface CreatePaymentDTO {
  productId: string;
  amount: number;
  paymentMethod: 'Cash' | 'Bank' | 'Cheque' | 'Credit';
  bankId?: string;
  transactionId?: string;
  notes?: string;
}


// Brand with Models - for brand selection
export interface BrandWithModels {
  id: string;
  name: string;
  models: ModelWithCosting[];
}

// Model with Costing - for model selection
export interface ModelWithCosting {
  id: string;
  name: string;
  brandId: string;
  costingDetails: string;
}
