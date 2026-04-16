import { AssetsFirebaseService } from './assetsFirebaseService';
import { toast } from 'sonner';
import type { Asset } from './types';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency', 
    currency: 'PKR', 
    minimumFractionDigits: 0 
  }).format(amount);

export class AssetsServiceClass {
  static async createAsset(assetData: Omit<Asset, 'id' | 'createdAt'>): Promise<void> {
    try {
      await AssetsFirebaseService.addAsset(assetData as any);
      toast.success(`Asset "${assetData.assetName}" added successfully`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create asset');
      throw error;
    }
  }

  static async fetchAllAssets(): Promise<Asset[]> {
    try {
      return await AssetsFirebaseService.getAllAssets();
    } catch (error: any) {
      toast.error('Failed to load assets');
      return [];
    }
  }

  static async updateAsset(id: string, updates: Partial<Asset>): Promise<void> {
    try {
      await AssetsFirebaseService.updateAsset(id, updates);
      toast.success('Asset updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update asset');
      throw error;
    }
  }

  static async deleteAsset(id: string): Promise<void> {
    try {
      await AssetsFirebaseService.deleteAsset(id);
      toast.success('Asset deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete asset');
      throw error;
    }
  }

  static formatPrice(price: number): string {
    return formatCurrency(price);
  }
}

// AssetsServiceClass exported directly

