import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { db } from "../firebase/firebase";

// Interface for test data
export interface TestData {
  id: string;
  title: string;
  amount: number;
  type: string; // "income" | "expense"
  createdAt: Timestamp;
}

// Reference to Firestore collection
const testDataCollection = collection(db, "testData");

/**
 * Add a new test data document to Firestore
 * @param title - Title of the item
 * @param amount - Amount (number)
 * @param type - "income" or "expense"
 * @returns the Firestore document ID
 */
export const addTestData = async (title: string, amount: number, type: string): Promise<string> => {
  try {
    const docRef = await addDoc(testDataCollection, {
      title,
      amount,
      type,
      createdAt: Timestamp.now(),
    });
    console.log("FirestoreTestService: Document added with ID", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("FirestoreTestService: Error adding document:", error);
    throw error;
  }
};

/**
 * Fetch all test data documents from Firestore
 * @returns Array of TestData
 */
export const getTestData = async (): Promise<TestData[]> => {
  try {
    const q = query(testDataCollection, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const data: TestData[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<TestData, "id">),
    }));
    return data;
  } catch (error) {
    console.error("FirestoreTestService: Error fetching documents:", error);
    throw error;
  }
};

/**
 * Update a test data document
 * @param id - Document ID
 * @param updatedData - Partial data to update
 */
export const updateTestData = async (id: string, updatedData: Partial<Omit<TestData, "id" | "createdAt">>) => {
  try {
    const docRef = doc(db, "testData", id);
    await updateDoc(docRef, updatedData);
    console.log(`FirestoreTestService: Document ${id} updated`);
  } catch (error) {
    console.error(`FirestoreTestService: Error updating document ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a test data document
 * @param id - Document ID
 */
export const deleteTestData = async (id: string) => {
  try {
    const docRef = doc(db, "testData", id);
    await deleteDoc(docRef);
    console.log(`FirestoreTestService: Document ${id} deleted`);
  } catch (error) {
    console.error(`FirestoreTestService: Error deleting document ${id}:`, error);
    throw error;
  }
};
