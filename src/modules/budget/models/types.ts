// Budget Module - Model Layer
// Data interfaces and types

/**
 * Budget entity representing an expense budget in the system
 */
export interface Budget {
  id: string;
  category: 'Expenses';
  subCategory: string;
  period: 'Monthly' | 'Quarterly' | 'Yearly';
  budgetLimit: number;
  spent: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO for creating a new budget
 */
export interface CreateBudgetDTO {
  category: 'Expenses';
  subCategory: string;
  period: 'Monthly' | 'Quarterly' | 'Yearly';
  budgetLimit: number;
}

/**
 * DTO for updating an existing budget
 */
export interface UpdateBudgetDTO extends CreateBudgetDTO {
  id: string;
}

/**
 * Filter criteria for budget list
 */
export interface BudgetFilters {
  subCategorySearch: string;
  periodFilter: '' | 'Monthly' | 'Quarterly' | 'Yearly';
  minBudgetLimit: number | null;
  maxBudgetLimit: number | null;
  statusFilter: '' | 'on-track' | 'close-to-limit' | 'over-budget';
}

/**
 * Budget statistics for dashboard/display
 */
export interface BudgetStats {
  totalCount: number;
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  onTrackCount: number;
  closeToLimitCount: number;
  overBudgetCount: number;
  alerts: number;
}

/**
 * Budget status information
 */
export interface BudgetStatus {
  status: 'On Track' | 'Close to Limit' | 'Over Budget';
  color: string;
  bgColor: string;
  percentage: number;
}

/**
 * Validation result for budget data
 */
export interface ValidationResult {
  isValid: boolean;
  error: string | null;
  fieldErrors?: { [key: string]: string };
}
