import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, orderBy, query } from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import type { Asset } from './types';

export class AssetsFirebaseService {
  static async addAsset(assetData: Omit<Asset, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'assets'), {
      ...assetData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  static async getAllAssets(): Promise<Asset[]> {
    const q = query(collection(db, 'assets'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Asset[];
  }

  static async updateAsset(id: string, updates: Partial<Asset>): Promise<void> {
    const assetRef = doc(db, 'assets', id);
    await updateDoc(assetRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  static async deleteAsset(id: string): Promise<void> {
    const assetRef = doc(db, 'assets', id);
    await deleteDoc(assetRef);
  }
}

