// Commission Module - Type Definitions

export type CommissionStatus = 'Calculated' | 'Adjusted' | 'Confirmed';

export interface CommissionSlab {
  id: string;
  salesperson: string;
  city: string;
  fromAmount: number;
  toAmount: number;
  commissionPercentage: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Commission {
  id: string;
  salesperson: string;
  salespersonName: string;
  city: string;
  month: string; // Format: "YYYY-MM"
  totalSales: number;
  appliedSlabFrom: number;
  appliedSlabTo: number;
  commissionPercentage: number;
  calculatedCommissionAmount: number;
  overriddenCommissionPercentage?: number;
  overriddenCommissionAmount?: number;
  status: CommissionStatus;
  calculatedBy: string;
  confirmedBy?: string;
  calculatedAt: string;
  confirmedAt?: string;
  isLocked: boolean;
}

// DTOs for create/update operations
export interface CreateCommissionSlabDTO {
  salesperson: string;
  city: string;
  fromAmount: number;
  toAmount: number;
  commissionPercentage: number;
}

export interface UpdateCommissionSlabDTO {
  id: string;
  salesperson?: string;
  city?: string;
  fromAmount?: number;
  toAmount?: number;
  commissionPercentage?: number;
}

export interface CreateCommissionDTO {
  salesperson: string;
  salespersonName: string;
  city: string;
  month: string;
  totalSales: number;
  appliedSlabFrom: number;
  appliedSlabTo: number;
  commissionPercentage: number;
  calculatedCommissionAmount: number;
  calculatedBy: string;
}

export interface UpdateCommissionDTO {
  id: string;
  overriddenCommissionPercentage?: number;
  overriddenCommissionAmount?: number;
  status?: CommissionStatus;
  confirmedBy?: string;
  confirmedAt?: string;
}

// Filter types
export interface CommissionSlabFilter {
  salesperson?: string;
  city?: string;
}

export interface CommissionFilter {
  salesperson?: string;
  city?: string;
  month?: string;
  status?: CommissionStatus;
}

// Statistics
export interface CommissionStats {
  totalCommissions: number;
  totalAmount: number;
  confirmedCount: number;
  adjustedCount: number;
  calculatedCount: number;
  averageRate: number;
}

// Calculation result
export interface CommissionCalculationResult {
  commissions: Commission[];
  errors: string[];
  summary: {
    totalSalespeople: number;
    totalSales: number;
    totalCommission: number;
  };
}

// Invoice reference (simplified from invoice module)
export interface InvoiceReference {
  id: string;
  date: string;
  customerCity: string;
  totalAmount: number;
  status: 'Paid' | 'Unpaid';
  salesperson?: string;
}

// Employee reference (simplified from employee module)
export interface EmployeeReference {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}

// Validation result
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Slab overlap check
export interface SlabOverlap {
  exists: boolean;
  conflictingSlab?: CommissionSlab;
}
