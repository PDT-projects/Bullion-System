// Budget Module - Firebase Data Connect Service Layer
// Handles all Data Connect operations for Budgets

import { DataConnect, getDataConnect, connectDataConnectEmulator, QueryResult } from 'firebase/data-connect';
import { 
  connectorConfig,
  budgetInsert,
  budgetUpdate,
  budgetDelete,
  budgetUpdateSpent,
  listBudgets,
  getBudgetById,
  BudgetInsertVariables,
  BudgetUpdateVariables,
  BudgetDeleteVariables,
  BudgetUpdateSpentVariables,
  ListBudgetsData,
  GetBudgetByIdData
} from '@erp-system/budgets';
import { Budget } from '../../modules/budget/models/types';

// Data Connect client instance
let dcInstance: DataConnect | null = null;
let isEmulatorConnected = false;

/**
 * Get Data Connect instance (singleton)
 * Connects to emulator if running locally
 */
function getDC(): DataConnect {
  if (!dcInstance) {
    // Create the Data Connect instance
    dcInstance = getDataConnect(connectorConfig);
    
    // Connect to emulator if running locally
    if (!isEmulatorConnected) {
      try {
        // Try to connect to emulator on localhost:9399
        connectDataConnectEmulator(dcInstance, 'localhost', 9399);
        isEmulatorConnected = true;
        console.log('Connected to Data Connect Emulator at localhost:9399');
      } catch (error) {
        // Emulator might not be running, continue without emulator connection
        console.log('Could not connect to Data Connect Emulator, using production');
      }
    }
  }
  return dcInstance;
}

/**
 * BudgetDataConnectService - Data Connect operations for Budgets
 * Uses Firebase Data Connect with PostgreSQL backend
 */
export class BudgetDataConnectService {

  // ==================== READ OPERATIONS ====================

  /**
   * Fetch all budgets from Data Connect
   */
  static async fetchAllBudgets(limit: number = 100, offset: number = 0): Promise<Budget[]> {
    try {
      console.log('📡 Fetching all budgets from Data Connect...');
      
      const dc = getDC();
      
      // Call listBudgets
      const result = await listBudgets(dc, { limit, offset }) as unknown as QueryResult<ListBudgetsData, undefined>;
      const data = result.data;
      
      const budgets: Budget[] = data.budgets.map((budget) => ({
        id: budget.id,
        category: budget.category as 'Expenses',
        subCategory: budget.subCategory,
        period: budget.period as 'Monthly' | 'Quarterly' | 'Yearly',
        budgetLimit: budget.budgetLimit,
        spent: budget.spent,
        createdAt: budget.createdAt || new Date().toISOString(),
        updatedAt: budget.updatedAt || new Date().toISOString()
      }));
      
      console.log(`✅ Fetched ${budgets.length} budgets from Data Connect`);
      return budgets;
    } catch (error) {
      console.error('❌ Error fetching budgets from Data Connect:', error);
      throw new Error('Failed to fetch budgets from Data Connect');
    }
  }

  /**
   * Fetch a single budget by ID
   */
  static async fetchBudgetById(id: string): Promise<Budget | null> {
    try {
      console.log('📡 Fetching budget from Data Connect:', id);
      
      const dc = getDC();
      
      // Call getBudgetById
      const result = await getBudgetById(dc, { id }) as unknown as QueryResult<GetBudgetByIdData, undefined>;
      const data = result.data;
      
      if (!data.budget) {
        console.log(`Budget not found: ${id}`);
        return null;
      }
      
      const budget: Budget = {
        id: data.budget.id,
        category: data.budget.category as 'Expenses',
        subCategory: data.budget.subCategory,
        period: data.budget.period as 'Monthly' | 'Quarterly' | 'Yearly',
        budgetLimit: data.budget.budgetLimit,
        spent: data.budget.spent,
        createdAt: data.budget.createdAt || new Date().toISOString(),
        updatedAt: data.budget.updatedAt || new Date().toISOString()
      };
      
      console.log(`✅ Fetched budget: ${budget.id}`);
      return budget;
    } catch (error) {
      console.error(`❌ Error fetching budget ${id} from Data Connect:`, error);
      throw new Error(`Failed to fetch budget ${id} from Data Connect`);
    }
  }

  // ==================== WRITE OPERATIONS ====================

  /**
   * Create a new budget in Data Connect
   */
  static async createBudget(budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Promise<Budget> {
    try {
      console.log('📡 Creating budget in Data Connect:', budget.subCategory);
      
      // Generate a unique ID
      const id = `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Prepare variables for Data Connect
      const variables: BudgetInsertVariables = {
        id,
        category: budget.category,
        subCategory: budget.subCategory,
        period: budget.period,
        budgetLimit: Number(budget.budgetLimit),
        spent: Number(budget.spent)
      };

      // Execute the mutation
      await budgetInsert(variables);
      
      const createdBudget: Budget = {
        ...budget,
        id: variables.id!,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('✅ Budget created with ID:', createdBudget.id);
      return createdBudget;
    } catch (error) {
      console.error('❌ Error creating budget in Data Connect:', error);
      throw new Error('Failed to create budget in Data Connect');
    }
  }

  /**
   * Update an existing budget in Data Connect
   */
  static async updateBudget(budget: Budget): Promise<Budget> {
    try {
      console.log('📡 Updating budget in Data Connect:', budget.id);
      
      // Prepare variables for Data Connect
      const variables: BudgetUpdateVariables = {
        id: budget.id,
        category: budget.category,
        subCategory: budget.subCategory,
        period: budget.period,
        budgetLimit: Number(budget.budgetLimit),
        spent: Number(budget.spent)
      };

      // Execute the mutation
      await budgetUpdate(variables);
      
      const updatedBudget: Budget = {
        ...budget,
        updatedAt: new Date().toISOString()
      };
      
      console.log('✅ Budget updated:', updatedBudget.id);
      return updatedBudget;
    } catch (error) {
      console.error(`❌ Error updating budget ${budget.id} in Data Connect:`, error);
      throw new Error('Failed to update budget in Data Connect');
    }
  }

  /**
   * Delete a budget from Data Connect
   */
  static async deleteBudget(id: string): Promise<void> {
    try {
      console.log('📡 Deleting budget from Data Connect:', id);
      
      // Prepare variables for Data Connect
      const variables: BudgetDeleteVariables = { id };

      // Execute the mutation
      await budgetDelete(variables);
      
      console.log('✅ Budget deleted:', id);
    } catch (error) {
      console.error(`❌ Error deleting budget ${id} from Data Connect:`, error);
      throw new Error('Failed to delete budget from Data Connect');
    }
  }

  /**
   * Update budget spent amount (for tracking expenses)
   */
  static async updateBudgetSpent(id: string, spent: number): Promise<void> {
    try {
      console.log('📡 Updating budget spent in Data Connect:', id, 'spent:', spent);
      
      // Prepare variables for Data Connect
      const variables: BudgetUpdateSpentVariables = {
        id,
        spent: Number(spent)
      };

      // Execute the mutation
      await budgetUpdateSpent(variables);
      
      console.log('✅ Budget spent updated:', id);
    } catch (error) {
      console.error(`❌ Error updating budget spent ${id} in Data Connect:`, error);
      throw new Error('Failed to update budget spent in Data Connect');
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Check if Data Connect is connected
   */
  static isConnected(): boolean {
    try {
      getDC();
      return true;
    } catch {
      return false;
    }
  }
}
