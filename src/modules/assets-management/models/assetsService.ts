import { AssetsFirebaseService } from './assetsFirebaseService';
import { toast } from 'sonner';
import type { Asset } from './types';

const AED_TO_PKR = 76.03;

const formatPKR = (amount: number) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
  }).format(amount);

const formatAED = (pkrAmount: number) => {
  const aed = pkrAmount / AED_TO_PKR;
  return `د.إ ${new Intl.NumberFormat('en-AE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(aed)} AED`;
};

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

  /** Format as PKR (default, stored currency) */
  static formatPrice(price: number): string {
    return formatPKR(price);
  }

  /** Format as AED (converted from PKR) */
  static formatPriceAED(price: number): string {
    return formatAED(price);
  }

  /** Rate constant for use in views */
  static readonly AED_TO_PKR = AED_TO_PKR;
}