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
 * Parse Firebase error codes into human-readable messages
 */
function parseFirebaseError(error: any): string {
  const code = error?.code || '';

  switch (code) {
    case 'permission-denied':
      return (
        'Permission denied. Your Firestore security rules are blocking this operation.\n\n' +
        'FIX: Go to Firebase Console → Firestore Database → Rules and allow read/write:\n\n' +
        "  match /budgets/{id} { allow read, write: if true; }\n\n" +
        'For production, replace `if true` with proper auth rules.'
      );
    case 'unavailable':
      return 'Firestore is currently unavailable. Check your internet connection and try again.';
    case 'unauthenticated':
      return 'You must be signed in to perform this action. Please log in and try again.';
    case 'not-found':
      return 'The requested document was not found in Firestore.';
    case 'already-exists':
      return 'A document with this ID already exists.';
    case 'resource-exhausted':
      return 'Firestore quota exceeded. Please try again later.';
    case 'failed-precondition':
      return 'Firestore indexes may be missing. Check the Firebase Console for index creation links.';
    default:
      return error?.message || 'An unexpected Firestore error occurred.';
  }
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
    } catch (error: any) {
      const message = parseFirebaseError(error);
      console.error('❌ Error fetching budgets from Firestore:', message);
      throw new Error(message);
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
    } catch (error: any) {
      const message = parseFirebaseError(error);
      console.error(`❌ Error fetching budget ${id} from Firestore:`, message);
      throw new Error(message);
    }
  }

  // ==================== WRITE OPERATIONS ====================

  /**
   * Create a new budget in Firestore
   *
   * ⚠️  COMMON FAILURE REASON: Firestore security rules deny writes.
   *     Go to Firebase Console → Firestore Database → Rules and ensure
   *     the `budgets` collection allows writes for your use-case.
   *
   *     Development rule (open access):
   *       match /budgets/{id} { allow read, write: if true; }
   *
   *     Production rule (authenticated users only):
   *       match /budgets/{id} { allow read, write: if request.auth != null; }
   */
  static async createBudget(data: CreateBudgetDTO): Promise<Budget> {
    try {
      console.log('🔥 Creating budget in Firestore:', data.subCategory);
      console.log('📦 Payload:', JSON.stringify(data, null, 2));

      const budgetsRef = collection(db, BUDGETS_COLLECTION);
      const now = new Date().toISOString();

      const payload = {
        category: data.category,
        subCategory: data.subCategory,
        period: data.period,
        budgetLimit: data.budgetLimit,
        spent: 0,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(budgetsRef, payload);

      const createdBudget: Budget = {
        ...payload,
        id: docRef.id,
      };

      console.log('✅ Budget created with ID:', createdBudget.id);
      return createdBudget;
    } catch (error: any) {
      const message = parseFirebaseError(error);
      console.error('❌ Error creating budget in Firestore:', message);
      throw new Error(message);
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

      const payload = {
        category: data.category,
        subCategory: data.subCategory,
        period: data.period,
        budgetLimit: data.budgetLimit,
        updatedAt: now,
      };

      await updateDoc(budgetRef, payload);
      console.log('✅ Budget updated:', data.id);

      // Fetch and return the updated document to include server-side fields (spent, createdAt)
      const updated = await BudgetFirebaseService.fetchBudgetById(data.id);
      return updated!;
    } catch (error: any) {
      const message = parseFirebaseError(error);
      console.error(`❌ Error updating budget ${data.id}:`, message);
      throw new Error(message);
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
    } catch (error: any) {
      const message = parseFirebaseError(error);
      console.error(`❌ Error deleting budget ${id}:`, message);
      throw new Error(message);
    }
  }

  // ==================== UTILITY METHODS ====================

  static isConnected(): boolean {
    return !!db;
  }

  /**
   * Quick permissions check — call this from DevTools console to diagnose rule issues:
   *   BudgetFirebaseService.checkPermissions()
   */
  static async checkPermissions(): Promise<void> {
    console.log('🔍 Checking Firestore permissions for budgets collection...');
    try {
      // Read check
      const budgetsRef = collection(db, BUDGETS_COLLECTION);
      await getDocs(query(budgetsRef));
      console.log('✅ READ permission: OK');
    } catch (e: any) {
      console.error('❌ READ permission FAILED:', parseFirebaseError(e));
    }

    try {
      // Write check (creates and immediately deletes a test doc)
      const budgetsRef = collection(db, BUDGETS_COLLECTION);
      const testDoc = await addDoc(budgetsRef, {
        __permissionCheck: true,
        createdAt: new Date().toISOString(),
      });
      console.log('✅ WRITE permission: OK');

      // Clean up the test doc
      await deleteDoc(doc(db, BUDGETS_COLLECTION, testDoc.id));
      console.log('✅ DELETE permission: OK');
    } catch (e: any) {
      console.error('❌ WRITE/DELETE permission FAILED:', parseFirebaseError(e));
      console.warn(
        '\n📋 To fix this, update your Firestore rules in Firebase Console:\n\n' +
        "rules_version = '2';\n" +
        'service cloud.firestore {\n' +
        '  match /databases/{database}/documents {\n' +
        '    match /budgets/{budgetId} {\n' +
        '      allow read, write: if true; // dev only\n' +
        '    }\n' +
        '  }\n' +
        '}\n'
      );
    }
  }
}