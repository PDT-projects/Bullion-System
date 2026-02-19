// Inventory Module - Model Layer
// Type definitions for Inventory and Product Transfer

/**
 * Product status in the inventory system
 */
export type ProductStatus = 'New' | 'In Transit' | 'Available' | 'Sold' | 'Damaged' | 'Returned' | 'Used';

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
 * Costing information (when costingOption === 'with')
 */
export interface CostingInfo {
  units: number;
  unitCostUSD: number;
  totalCostUSD: number;
  percentage: number;
  customPerModel: number;
  customPerUnit: number;
  freightPerModel: number;
  freightPerUnit: number;
  unitCostPKR: number;
  totalUnitCost: number;
  totalShipmentValuePKR: number;
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
  // Costing fields (when costingOption === 'with')
  costingOption?: CostingOption;
  costing?: CostingInfo;
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
  
  // Costing option
  costingOption?: CostingOption;
  
  // Costing fields (when costingOption === 'with')
  costing?: {
    units: number;
    unitCostUSD: number;
    totalCostUSD: number;
    percentage: number;
    customPerModel: number;
    customPerUnit: number;
    freightPerModel: number;
    freightPerUnit: number;
    unitCostPKR: number;
    totalUnitCost: number;
    totalShipmentValuePKR: number;
  };
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
  costing?: {
    units: number;
    unitCostUSD: number;
    totalCostUSD: number;
    percentage: number;
    customPerModel: number;
    customPerUnit: number;
    freightPerModel: number;
    freightPerUnit: number;
    unitCostPKR: number;
    totalUnitCost: number;
    totalShipmentValuePKR: number;
  };
  
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
