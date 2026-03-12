// Inventory DataConnect Service - Brands/Models PRIORITY (Products pending)
import type { Product } from '../../modules/inventory/models/types';
import { fetchBrands, fetchModelsByBrand } from './brandModelDataConnectService';
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@erp-system/inventory';

console.log('✅ Brand/Model DataConnect ready - Products pending schema');

export class InventoryDataConnectService {
  /**
   * Fetch brands/models via dedicated service (WORKING)
   */
  static async fetchBrandsAndModels(): Promise<any> {
    try {
      const brands = await fetchBrands();
      const allModels = await fetchModelsByBrand(''); // Load all for filtering
      return { brands, allModels };
    } catch (error) {
      console.error('Brands/Models fetch failed:', error);
      return { brands: [], allModels: [] };
    }
  }

  /**
   * Products pending - return empty (NORMAL until schema ready)
   */
  static async fetchAllProducts(): Promise<Product[]> {
    console.log('📡 Products pending schema - returning [] (NORMAL)');
    return [];
  }

  static async fetchProductById(id: string): Promise<Product | null> {
    console.log('📡 Single product pending - null (NORMAL)');
    return null;
  }
}

