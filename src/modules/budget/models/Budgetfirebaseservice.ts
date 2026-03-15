// Budget Module - Firebase Firestore Service Layer
// Handles all Firebase Firestore operations for budgets

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { Budget, CreateBudgetDTO, UpdateBudgetDTO } from './types';

const BUDGETS_COLLECTION = 'budgets';

/**
 * Transform Firestore document to Budget type
 */
function transformDocToBudget(docSnap: any): Budget {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    category: data.category || 'Expenses',
    subCategory: data.subCategory || '',
    period: data.period || 'Monthly',
    budgetLimit: data.budgetLimit || 0,
    spent: data.spent || 0,
    createdAt: data.createdAt || '',
    updatedAt: data.updatedAt || '',
  };
}

/**
 * BudgetFirebaseService - Firebase Firestore operations
 */
export class BudgetFirebaseService {

  // ==================== READ OPERATIONS ====================

  /**
   * Fetch all budgets from Firestore
   */
  static async fetchAllBudgets(): Promise<Budget[]> {
    try {
      console.log('🔥 Fetching all budgets from Firestore...');

      const budgetsRef = collection(db, BUDGETS_COLLECTION);
      const queryConstraints: QueryConstraint[] = [
        orderBy('subCategory', 'asc')
      ];

      const q = query(budgetsRef, ...queryConstraints);
      const querySnapshot = await getDocs(q);

      const budgets: Budget[] = [];
      querySnapshot.forEach((doc) => {
        budgets.push(transformDocToBudget(doc));
      });

      console.log(`✅ Fetched ${budgets.length} budgets from Firestore`);
      return budgets;
    } catch (error) {
      console.error('❌ Error fetching budgets from Firestore:', error);
      throw new Error('Failed to fetch budgets from Firestore');
    }
  }

  /**
   * Fetch a single budget by ID
   */
  static async fetchBudgetById(id: string): Promise<Budget | null> {
    try {
      console.log(`🔥 Fetching budget ${id} from Firestore...`);

      const budgetRef = doc(db, BUDGETS_COLLECTION, id);
      const docSnap = await getDoc(budgetRef);

      if (!docSnap.exists()) {
        console.log('⚠️ Budget not found');
        return null;
      }

      const budget = transformDocToBudget(docSnap);
      console.log('✅ Budget fetched:', budget.subCategory);
      return budget;
    } catch (error) {
      console.error(`❌ Error fetching budget ${id} from Firestore:`, error);
      throw new Error('Failed to fetch budget from Firestore');
    }
  }

  // ==================== WRITE OPERATIONS ====================

  /**
   * Create a new budget in Firestore
   */
  static async createBudget(data: CreateBudgetDTO): Promise<Budget> {
    try {
      console.log('🔥 Creating budget in Firestore:', data.subCategory);

      const budgetsRef = collection(db, BUDGETS_COLLECTION);
      const now = new Date().toISOString();
      const docRef = await addDoc(budgetsRef, {
        ...data,
        spent: 0,
        createdAt: now,
        updatedAt: now,
      });

      const createdBudget: Budget = {
        ...data,
        id: docRef.id,
        spent: 0,
        createdAt: now,
        updatedAt: now,
      };

      console.log('✅ Budget created with ID:', createdBudget.id);
      return createdBudget;
    } catch (error) {
      console.error('❌ Error creating budget in Firestore:', error);
      throw new Error('Failed to create budget in Firestore');
    }
  }

  /**
   * Update an existing budget in Firestore
   */
  static async updateBudget(data: UpdateBudgetDTO): Promise<Budget> {
    try {
      console.log('🔥 Updating budget in Firestore:', data.id);

      const budgetRef = doc(db, BUDGETS_COLLECTION, data.id);
      const now = new Date().toISOString();
      await updateDoc(budgetRef, {
        ...data,
        updatedAt: now,
      });

      console.log('✅ Budget updated:', data.id);

      // Fetch and return the updated document to include server-side fields (spent, createdAt)
      const updated = await BudgetFirebaseService.fetchBudgetById(data.id);
      return updated!;
    } catch (error) {
      console.error(`❌ Error updating budget ${data.id}:`, error);
      throw new Error('Failed to update budget in Firestore');
    }
  }

  /**
   * Delete a budget from Firestore
   */
  static async deleteBudget(id: string): Promise<void> {
    try {
      console.log('🔥 Deleting budget from Firestore:', id);

      const budgetRef = doc(db, BUDGETS_COLLECTION, id);
      await deleteDoc(budgetRef);

      console.log('✅ Budget deleted:', id);
    } catch (error) {
      console.error(`❌ Error deleting budget ${id}:`, error);
      throw new Error('Failed to delete budget from Firestore');
    }
  }

  // ==================== UTILITY METHODS ====================

  static isConnected(): boolean {
    return !!db;
  }
}