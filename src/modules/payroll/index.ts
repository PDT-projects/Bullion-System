// Payroll Module - Public API
// Single unified export replacing separate salary + commission modules

// ── Types ────────────────────────────────────────────────────────────────────
export type {
  // Salary
  SalaryTransaction, Salary, CreateSalaryDTO, UpdateSalaryDTO,
  SalaryFilters, SalaryStats, EmployeeInfo, ValidationResult,
  // Commission
  CommissionStatus, CommissionSlab, Commission,
  CreateCommissionSlabDTO, UpdateCommissionSlabDTO,
  CreateCommissionDTO, UpdateCommissionDTO,
  CommissionSlabFilter, CommissionFilter, CommissionStats,
  CommissionCalculationResult, InvoiceReference, EmployeeReference, SlabOverlap,
} from './models/types';

export { SALARY_TYPES, PAYMENT_METHODS, PAYMENT_STATUSES } from './models/types';
export { CITIES } from './models/payrollService';

// ── Services ─────────────────────────────────────────────────────────────────
export { PayrollFirebaseService, SalaryFirebaseService, CommissionFirebaseService } from './models/payrollFirebaseService';
export { SalaryService, formatCurrency, formatMonth, getCurrentMonth, exportCommissionsToCSV, filterCommissions, getCommissionStats, filterCommissionSlabs, validateCommissionSlab, checkSlabOverlap } from './models/payrollService';

// ── Main Entry ───────────────────────────────────────────────────────────────
export { PayrollDashboardWrapper } from './views/PayrollDashboardWrapper';