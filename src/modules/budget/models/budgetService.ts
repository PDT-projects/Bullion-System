// Budget Module - Service Layer
// Business logic, data operations, and utilities

import { 
  Budget, 
  CreateBudgetDTO, 
  UpdateBudgetDTO, 
  BudgetFilters, 
  BudgetStats,
  BudgetStatus,
  ValidationResult 
} from './types';
import { BudgetDataConnectService } from '../../../api/dataconnect/budgetDataConnectService';

/**
 * BudgetService - Contains all business logic for budget operations
 * This is a pure service class with no React dependencies
 */
export class BudgetService {
  
  // ==================== FILTERING & SEARCH ====================
  
  /**
   * Filter budgets based on multiple criteria
   */
  static filterBudgets(budgets: Budget[], filters: BudgetFilters): Budget[] {
    return budgets.filter(budget => {
      // Sub-category search (case-insensitive, partial match)
      if (filters.subCategorySearch && !budget.subCategory.toLowerCase().includes(filters.subCategorySearch.toLowerCase())) {
        return false;
      }

      // Period filter
      if (filters.periodFilter && budget.period !== filters.periodFilter) {
        return false;
      }

      // Budget limit range filter
      const min = filters.minBudgetLimit ?? 0;
      const max = filters.maxBudgetLimit ?? Infinity;
      if (budget.budgetLimit < min || budget.budgetLimit > max) {
        return false;
      }

      // Status filter
      if (filters.statusFilter) {
        const percentage = (budget.spent / budget.budgetLimit) * 100;
        let status: string;
        if (percentage >= 100) status = 'over-budget';
        else if (percentage >= 80) status = 'close-to-limit';
        else status = 'on-track';
        
        if (status !== filters.statusFilter) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Get unique sub-categories from all budgets (sorted)
   */
  static getUniqueSubCategories(budgets: Budget[]): string[] {
    return Array.from(new Set(budgets.map(b => b.subCategory))).sort();
  }

  // ==================== CRUD OPERATIONS ====================

  /**
   * Create a new budget (local only - for backward compatibility)
   */
  static createBudget(budgets: Budget[], data: CreateBudgetDTO): Budget[] {
    const newBudget: Budget = {
      ...data,
      id: Date.now().toString(),
      spent: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return [...budgets, newBudget];
  }

  /**
   * Update an existing budget (local only - for backward compatibility)
   */
  static updateBudget(budgets: Budget[], id: string, data: UpdateBudgetDTO): Budget[] {
    return budgets.map(b => 
      b.id === id ? { 
        ...b, 
        ...data, 
        updatedAt: new Date().toISOString() 
      } : b
    );
  }

  /**
   * Delete a budget by ID (local only - for backward compatibility)
   */
  static deleteBudget(budgets: Budget[], id: string): Budget[] {
    return budgets.filter(b => b.id !== id);
  }

  // ==================== DATA CONNECT OPERATIONS ====================
  
  /**
   * Fetch all budgets from Data Connect
   */
  static async fetchBudgetsFromDataConnect(): Promise<Budget[]> {
    return await BudgetDataConnectService.fetchAllBudgets();
  }

  /**
   * Create a new budget in Data Connect
   */
  static async createBudgetInDataConnect(data: CreateBudgetDTO): Promise<Budget> {
    return await BudgetDataConnectService.createBudget({
      category: data.category,
      subCategory: data.subCategory,
      period: data.period,
      budgetLimit: data.budgetLimit,
      spent: 0
    });
  }

  /**
   * Update a budget in Data Connect
   */
  static async updateBudgetInDataConnect(budget: Budget, data: UpdateBudgetDTO): Promise<Budget> {
    return await BudgetDataConnectService.updateBudget({
      ...budget,
      category: data.category,
      subCategory: data.subCategory,
      period: data.period,
      budgetLimit: data.budgetLimit
    });
  }

  /**
   * Delete a budget from Data Connect
   */
  static async deleteBudgetFromDataConnect(id: string): Promise<void> {
    return await BudgetDataConnectService.deleteBudget(id);
  }

  /**
   * Find budget by ID
   */
  static findById(budgets: Budget[], id: string): Budget | undefined {
    return budgets.find(b => b.id === id);
  }

  // ==================== VALIDATION ====================

  /**
   * Validate budget data before create/update
   */
  static validateBudget(data: Partial<Budget>): ValidationResult {
    const fieldErrors: { [key: string]: string } = {};

    // Sub-category validation
    if (!data.subCategory || data.subCategory.trim() === '') {
      fieldErrors.subCategory = 'Sub-category is required';
    }

    // Budget limit validation
    if (data.budgetLimit === undefined || data.budgetLimit === null) {
      fieldErrors.budgetLimit = 'Budget limit is required';
    } else if (data.budgetLimit <= 0) {
      fieldErrors.budgetLimit = 'Budget limit must be greater than 0';
    }

    // Period validation
    if (!data.period) {
      fieldErrors.period = 'Period is required';
    }

    const isValid = Object.keys(fieldErrors).length === 0;
    return { 
      isValid, 
      error: isValid ? null : 'Please fix the errors below',
      fieldErrors: isValid ? undefined : fieldErrors
    };
  }

  // ==================== BUDGET STATUS ====================

  /**
   * Get budget status with percentage and styling info
   */
  static getBudgetStatus(budget: Budget): BudgetStatus {
    const percentage = (budget.spent / budget.budgetLimit) * 100;
    
    if (percentage >= 100) {
      return {
        status: 'Over Budget',
        color: 'text-red-600',
        bgColor: 'bg-red-500',
        percentage
      };
    }
    
    if (percentage >= 80) {
      return {
        status: 'Close to Limit',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-500',
        percentage
      };
    }
    
    return {
      status: 'On Track',
      color: 'text-green-600',
      bgColor: 'bg-green-500',
      percentage
    };
  }

  /**
   * Get status filter value from percentage
   */
  static getStatusFromPercentage(percentage: number): 'on-track' | 'close-to-limit' | 'over-budget' {
    if (percentage >= 100) return 'over-budget';
    if (percentage >= 80) return 'close-to-limit';
    return 'on-track';
  }

  // ==================== STATISTICS ====================

  /**
   * Calculate budget statistics
   */
  static calculateStats(budgets: Budget[]): BudgetStats {
    const totalCount = budgets.length;
    const totalBudget = budgets.reduce((sum, b) => sum + b.budgetLimit, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const remaining = totalBudget - totalSpent;

    let onTrackCount = 0;
    let closeToLimitCount = 0;
    let overBudgetCount = 0;

    budgets.forEach(budget => {
      const percentage = (budget.spent / budget.budgetLimit) * 100;
      if (percentage >= 100) {
        overBudgetCount++;
      } else if (percentage >= 80) {
        closeToLimitCount++;
      } else {
        onTrackCount++;
      }
    });

    const alerts = closeToLimitCount + overBudgetCount;

    return {
      totalCount,
      totalBudget,
      totalSpent,
      remaining,
      onTrackCount,
      closeToLimitCount,
      overBudgetCount,
      alerts
    };
  }

  // ==================== FORMATTING UTILITIES ====================

  /**
   * Format number as PKR currency
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Format date string to locale date
   */
  static formatDate(dateString: string): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Get default empty budget form data
   */
  static getDefaultFormData(): Partial<Budget> {
    return {
      category: 'Expenses',
      subCategory: '',
      period: 'Monthly',
      budgetLimit: 0
    };
  }

  /**
   * Check if any filters are active
   */
  static hasActiveFilters(filters: BudgetFilters): boolean {
    return !!(
      filters.subCategorySearch ||
      filters.periodFilter ||
      filters.minBudgetLimit ||
      filters.maxBudgetLimit ||
      filters.statusFilter
    );
  }

  /**
   * Count active filters
   */
  static countActiveFilters(filters: BudgetFilters): number {
    let count = 0;
    if (filters.subCategorySearch) count++;
    if (filters.periodFilter) count++;
    if (filters.minBudgetLimit) count++;
    if (filters.maxBudgetLimit) count++;
    if (filters.statusFilter) count++;
    return count;
  }

  // ==================== BUDGET SPENDING ====================

  /**
   * Add spending to a budget
   */
  static addSpending(budgets: Budget[], id: string, amount: number): Budget[] {
    return budgets.map(b => {
      if (b.id === id) {
        return {
          ...b,
          spent: b.spent + amount,
          updatedAt: new Date().toISOString()
        };
      }
      return b;
    });
  }

  /**
   * Reset spending for a budget (e.g., new period)
   */
  static resetSpending(budgets: Budget[], id: string): Budget[] {
    return budgets.map(b => {
      if (b.id === id) {
        return {
          ...b,
          spent: 0,
          updatedAt: new Date().toISOString()
        };
      }
      return b;
    });
  }
}
