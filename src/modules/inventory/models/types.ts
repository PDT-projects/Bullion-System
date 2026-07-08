// Inventory Module - Model Layer
// Type definitions for Inventory and Product Transfer
// Change: added `location` field to Product, CreateProductDTO, UpdateProductDTO, ProductFormData

export type ProductStatus = 'New' | 'In Transit' | 'On-Order' | 'Receivable' | 'Available' | 'Sold' | 'Damaged' | 'Returned' | 'Used';
export type BuyType = 'Import' | 'Export';
export type SerialStatus = 'Available' | 'In Transit' | 'Damaged' | 'Returned' | 'Sold';
export type PaymentStatus = 'Pending' | 'Partial' | 'Complete';

// Whether a product batch is owned outright or held on credit from a supplier
export type OwnershipType = 'Credit' | 'Owned';
// Supplier payment status for credit tracking (distinct from ProductFormData.paymentStatus)
export type SupplierPaymentStatus = 'Unpaid' | 'Partial' | 'Cleared';
export type PaymentChannel = 'Cash' | 'Bank' | 'Cheque' | 'Credit';
export type CostingOption = 'with' | 'without';
export type InventoryEntryType = 'in-stock' | 'on-order';
export type InventoryEntryStep = 'details' | 'payment' | 'confirmation';

// Canonical location list — single source of truth used across inventory + transfers
export const INVENTORY_LOCATIONS = [
  'Dubai', 
  'Chad',
  'Saudia',
  'Sudan',
] as const;
export type InventoryLocation = typeof INVENTORY_LOCATIONS[number];

export interface CostingModel {
  id: string;
  modelName: string;
  units: number;
  unitCostUSD: number;
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

export interface CostingInfo {
  brandName: string;
  usdRate: number;
  totalCustomsValue: number;
  totalFreightValue: number;
  models: CostingModel[];
  totalUnitCostUSD: number;
  shipmentTotalUSD: number;
  consignmentValue: number;
  totalValueOfBrand: number;
}

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
  // Primary stocking location — set at entry time, updated on transfer receipt
  location?: string;
  serialNumbers: string[];
  serialCities: { [serialNumber: string]: string };
  serialStatus?: { [serialNumber: string]: SerialStatus };
  description: string;
  status: ProductStatus;
  isDamaged?: boolean;

  // ── Report / ownership tracking ──────────────────────────────────────────
  ownershipType?: OwnershipType;            // 'Credit' or 'Owned' — set once at entry, per product
  supplierCost?: number;                    // fixed at entry when ownershipType === 'Credit'
  supplierPaymentStatus?: SupplierPaymentStatus;
  supplierPaidAmount?: number;
  supplierRemainingAmount?: number;
  supplierPaymentChannel?: PaymentChannel;
  // Per-serial tracking maps (keyed by serial number)
  serialStockInDates?: { [serialNumber: string]: string };
  serialStockInDatesManual?: { [serialNumber: string]: string };
  serialSoldDates?: { [serialNumber: string]: string };
  serialInvoiceNumbers?: { [serialNumber: string]: string };

  // Payable configuration (optional)
  enablePayable?: boolean;
  fixedPayableAmount?: number;
  fixedPayableCurrency?: string;

  createdAt?: string;
  updatedAt?: string;
  brandId?: string;
  modelId?: string;
  costingId?: string;
  billId?: string;
  receivableStatus?: 'Pending' | 'Received';
  expectedReceiveDate?: string;
  costingOption?: CostingOption;
  costing?: CostingInfo;
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

export interface BrandModel {
  id: string;
  brandName: string;
  modelName: string;
  category: string;
  createdAt?: string;
}

export interface BrandWithModels {
  brandName: string;
  models: string[];
}

export interface CreateProductDTO {
  brandName: string;
  modelName: string;
  category: string;
  costPrice?: number;
  sellPrice: number;
  buyType: BuyType;
  warrantyYears: number;
  stock: number;
  location?: string;           // ← new: primary stocking location
  serialNumbers: string[];
  serialCities: { [serialNumber: string]: string };
  description: string;
  status: ProductStatus;
  isDamaged: boolean;
  billId?: string;
  receivableStatus?: 'Pending' | 'Received';
  expectedReceiveDate?: string;
  costingOption?: CostingOption;
  costing?: CostingInfo;
  ownershipType?: OwnershipType;
  supplierCost?: number;
  supplierPaymentStatus?: SupplierPaymentStatus;
  supplierPaidAmount?: number;
  supplierPaymentChannel?: PaymentChannel;
  serialStockInDates?: { [serialNumber: string]: string };
  serialStockInDatesManual?: { [serialNumber: string]: string };
}

export interface ProductFormData {
  currentStep: number;
  costingOption?: CostingOption;
  brandName: string;
  modelName: string;
  category: string;
  costPrice?: number;
  sellPrice: number;
  buyType: BuyType;
  warrantyYears: number;
  stock: number;
  location?: string;           // ← new: primary stocking location
  description: string;
  status: ProductStatus;
  isDamaged: boolean;
  serialNumbers: string[];
  serialCities: { [serialNumber: string]: string };
  costing?: CostingInfo;
  paymentStatus?: 'paid' | 'unpaid' | 'partial';
  transactionId?: string;
  paidAmount?: number;
  paymentMethod?: 'Cash' | 'Bank' | 'Cheque' | 'Credit';
  bankId?: string;
}

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

export interface UpdateProductDTO {
  brandName?: string;
  modelName?: string;
  category?: string;
  costPrice?: number;
  sellPrice?: number;
  buyType?: BuyType;
  warrantyYears?: number;
  stock?: number;
  location?: string;           // ← new
  serialNumbers?: string[];
  serialCities?: { [serialNumber: string]: string };
  serialStatus?: { [serialNumber: string]: SerialStatus };
  description?: string;
  status?: ProductStatus;
  isDamaged?: boolean;
  costingOption?: CostingOption;
  costing?: CostingInfo;
  ownershipType?: OwnershipType;
  supplierCost?: number;
  supplierPaymentStatus?: SupplierPaymentStatus;
  supplierPaidAmount?: number;
  supplierPaymentChannel?: PaymentChannel;
  serialStockInDates?: { [serialNumber: string]: string };
  serialStockInDatesManual?: { [serialNumber: string]: string };
  serialSoldDates?: { [serialNumber: string]: string };
  serialInvoiceNumbers?: { [serialNumber: string]: string };
}

export interface CreateTransferDTO {
  productId: string;
  fromLocation: string;
  toLocation: string;
  quantity: number;
  serialNumbers: string[];
  transferDate: string;
  notes?: string;
}

export interface ProductFilters {
  brandSearch: string;
  modelSearch: string;
  categoryFilter: string;
  statusFilter: ProductStatus | '';
  buyTypeFilter: BuyType | '';
  locationFilter: string;      // ← new: filter by location
  minPrice: number | null;
  maxPrice: number | null;
  hasStock: boolean | null;
}

export interface TransferFilters {
  productSearch: string;
  fromLocation: string;
  toLocation: string;
  statusFilter: ProductTransfer['status'] | '';
  dateFrom: string;
  dateTo: string;
}

export interface ProductStats {
  totalProducts: number;
  totalStock: number;
  totalValue: number;
  newProducts: number;
  inTransit: number;
  available: number;
  categories: { [key: string]: number };
}

export interface TransferStats {
  totalTransfers: number;
  pendingTransfers: number;
  completedTransfers: number;
  inTransitTransfers: number;
  totalQuantityMoved: number;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  fieldErrors?: { [key: string]: string };
}

// ── Inventory Report (one row per serial number) — matches the sheet columns
export interface InventoryReportRow {
  productId: string;
  brandName: string;
  modelName: string;
  serialNumber: string;
  stockInDateAuto: string;      // system-set (entry / return date)
  stockInDateManual?: string;   // manual override, if entered
  type: string;                 // = product.category (Detection Equipment, etc.)
  location: string;
  ownershipType: OwnershipType | '';
  condition: string;            // = product.status (New/Used/Damaged/Returned...)
  currentStatus: 'In Stock' | 'Sold';
  soldDate?: string;
  invoiceNumber?: string;
  supplierCost?: number;
  supplierPaymentStatus?: SupplierPaymentStatus; // display-mapped: Cleared→Clear, Unpaid→Pending
  supplierPaidAmount?: number;
  supplierRemainingAmount?: number;
  supplierPaymentChannel?: PaymentChannel;
}

// ── Damaged Inventory (returned items marked damaged) ────────────────────────
export interface DamagedProduct {
  id: string;
  productId: string;         // originating product id
  brandName: string;
  modelName: string;
  serialNumber: string;
  location: string;
  reason?: string;
  damagedAt: string;
  damagedBy?: string;
}

export interface CreatePaymentDTO {
  productId: string;
  amount: number;
  paymentMethod: 'Cash' | 'Bank' | 'Cheque' | 'Credit';
  bankId?: string;
  transactionId?: string;
  notes?: string;
}