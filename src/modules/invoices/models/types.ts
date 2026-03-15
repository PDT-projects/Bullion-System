// Invoice Module - Model Layer
// Data interfaces and types

export interface InvoiceProduct {
  id: string;
  productId: string;
  productName: string;
  brandName: string;
  modelName: string;
  category: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
  serialNumbers: string[];
  serialCities?: { [serialNumber: string]: string };
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerPhone2?: string;
  customerCNIC: string;
  customerProvince: string;
  customerCity: string;
  customerAddress?: string;
  warrantyLocation?: string;
  products: InvoiceProduct[];
  exchangeWarrantyNote: string;
  deliveryStatus: 'Self-collect' | 'LCS' | 'Daewoo' | 'Delivered';
  deliveryReceivedStatus: 'Pending' | 'In Process' | 'Received';
  totalAmount: number;
  status: 'Paid' | 'Unpaid';
  salesperson?: string;
  salespersonLocation?: string;
  clientDealBy?: string;
  referralBy?: string;
  createdBy?: string;
  paymentMode?: 'Cash' | 'Online';
  bankId?: string;
  bankName?: string;
  bankAccountNumber?: string;
  paymentStatus?: 'Full' | 'Partial';
  paidAmount?: number;
  remainingAmount?: number;
  collectionMethod?: 'Self Collection' | 'TCS' | 'LCS' | 'Daewoo' | 'Others';
  deductionCharges: number;
  digitalStamp?: boolean;
  imageUrl?: string;
  paidBy?: string;
  paidTo?: string;
  productLocation?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateInvoiceDTO {
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerPhone2?: string;
  customerCNIC: string;
  customerProvince: string;
  customerCity: string;
  customerAddress?: string;
  warrantyLocation?: string;
  products: InvoiceProduct[];
  exchangeWarrantyNote: string;
  deliveryStatus: 'Self-collect' | 'LCS' | 'Daewoo' | 'Delivered';
  status: 'Paid' | 'Unpaid';
  salesperson?: string;
  salespersonLocation?: string;
  clientDealBy?: string;
  referralBy?: string;
  createdBy?: string;
  paymentMode?: 'Cash' | 'Online';
  bankId?: string;
  bankName?: string;
  bankAccountNumber?: string;
  paymentStatus?: 'Full' | 'Partial';
  paidAmount?: number;
  remainingAmount?: number;
  collectionMethod?: 'Self Collection' | 'TCS' | 'LCS' | 'Daewoo' | 'Others';
  deductionCharges: number;
  digitalStamp?: boolean;
}

export interface UpdateInvoiceDTO extends CreateInvoiceDTO {
  id: string;
}

export interface InvoiceFilters {
  searchTerm: string;
  statusFilter: 'all' | 'Paid' | 'Unpaid';
  dateFrom: string;
  dateTo: string;
  cityFilter: string;
  salespersonFilter: string;
}

export interface InvoiceStats {
  totalCount: number;
  paidCount: number;
  unpaidCount: number;
  totalAmount: number;
  totalDeductionCharges: number;
  netAmount: number;
}

export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

export interface ProductInfo {
  id: string;
  brandName: string;
  modelName: string;
  category: string;
  sellPrice: number;
  stock: number;
  serialNumbers: string[];
  serialCities: { [serialNumber: string]: string };
  serialStatus?: { [serialNumber: string]: 'Available' | 'In Transit' | 'Damaged' | 'Returned' };
  description: string;
}

export interface CustomerSuggestion {
  customerName: string;
  customerPhone: string;
  customerPhone2?: string;
  customerCNIC: string;
  customerProvince: string;
  customerCity: string;
  customerAddress?: string;
  warrantyLocation?: string;
  exchangeWarrantyNote: string;
}

export interface ProvinceCities {
  [province: string]: string[];
}