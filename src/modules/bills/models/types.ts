// Bills Module - Model Layer
// Data interfaces and types

/**
 * Bill transaction entity
 */
export interface BillTransaction {
  id: string;
  amount: number;
  paidBy: string;
  paidTo: string;
  transactionBy: string;
  mode: 'Cash' | 'Bank' | 'Cheque';
  bankName: string;
  imageUrl: string;
  paymentStatus: 'Full' | 'Partial';
  remainingAmount: number;
  billMonth: string;
}

/**
 * Bill entity representing a utility bill payment
 */
export interface Bill {
  id: string;
  transactionId: string;
  date: string;
  time: string;
  company: string;
  mainCategory: 'Bills';
  subCategory: 'Electricity' | 'Internet' | 'Utilities';
  amount: number;
  mode: 'Cash' | 'Bank' | 'Cheque';
  bankName: string;
  paidBy: string;
  paidTo: string;
  transactionBy: string;
  billMonth: string;
  note: string;
  imageUrl: string;
  paymentStatus: 'Full' | 'Partial';
  remainingAmount: number;
}

/**
 * DTO for creating a new bill
 */
export interface CreateBillDTO {
  company: string;
  date: string;
  subCategory: 'Electricity' | 'Internet' | 'Utilities';
  note: string;
  transactions: BillTransaction[];
}

/**
 * DTO for updating an existing bill
 */
export interface UpdateBillDTO extends CreateBillDTO {
  id: string;
}

/**
 * Filter criteria for bill list
 */
export interface BillFilters {
  searchTerm: string;
  categoryFilter: 'all' | 'Electricity' | 'Internet' | 'Utilities';
  dateFrom: string | null;
  dateTo: string | null;
  paymentMethodFilter: '' | 'Cash' | 'Bank' | 'Cheque';
}

/**
 * Bill statistics for dashboard/display
 */
export interface BillStats {
  totalBills: number;
  totalAmount: number;
  electricityCount: number;
  electricityTotal: number;
  internetCount: number;
  internetTotal: number;
  utilitiesCount: number;
  utilitiesTotal: number;
  cashTotal: number;
  bankTotal: number;
  chequeTotal: number;
}

/**
 * Validation result for bill data
 */
export interface ValidationResult {
  isValid: boolean;
  error: string | null;
  fieldErrors?: { [key: string]: string };
}

/**
 * Predefined bill categories and vendors
 */
export const BILL_CATEGORIES = {
  'Electricity': ['LESCO', 'IESCO', 'K-Electric', 'Generator Fuel'],
  'Internet': ['PTCL', 'StormFiber', 'Nayatel'],
  'Utilities': ['Sui Gas', 'Water Board', 'Sanitation']
} as const;

export const PREDEFINED_VENDORS = [
  'LESCO', 'IESCO', 'K-Electric', 'PTCL', 'StormFiber', 'Nayatel',
  'Sui Gas', 'Water Board', 'City Sanitation', 'Generator Supplier',
  'Office Landlord', 'Maintenance Company'
] as const;

export const COMPANIES = [
  'Pakistan Detectors Technologies: Islamabad/ Head Office',
  'Pakistan Detectors Technologies: Karachi',
  'Pakistan Detectors Technologies: Lahore',
  'Pakistan Detectors Technologies: Bullion RND/ SITE office'
] as const;
