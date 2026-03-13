/**
 * Inventory Data Connect Service
 * - Brands/Models: Firebase Data Connect
 * - Products: Firebase Data Connect (productInsert, listProducts, etc.)
 * NO Firestore used anywhere.
 */
import type { Product } from '../../modules/inventory/models/types';
import { fetchBrands, fetchModelsByBrand } from './brandModelDataConnectService';
import {
  productInsert,
  listProducts,
  listReceivableProducts,
  getProductById,
} from '@erp-system/inventory';

console.log('✅ Inventory Service ready - All data via DataConnect');

export class InventoryDataConnectService {

  static async fetchBrandsAndModels(): Promise<any> {
    try {
      const brands = await fetchBrands();
      return { brands };
    } catch (error) {
      console.error('Brands/Models fetch failed:', error);
      return { brands: [] };
    }
  }

  static async saveProduct(productData: Omit<Product, 'id'> & { inventoryType?: string }): Promise<Product | null> {
    try {
      const isOnOrder = productData.inventoryType === 'on-order';
      const id = `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Map unsupported fields to valid status
      const productStatus = isOnOrder 
        ? `On-Order-${(productData as any).paymentStatus || 'Pending'}`
        : `${productData.status || 'New'}-${(productData as any).paymentStatus || 'Paid'}`;

      await productInsert({
        id,
        brandName: productData.brandName || '',
        modelName: productData.modelName || '',
        category: productData.category || '',
        costPrice: productData.costPrice || 0,
        sellPrice: productData.sellPrice || 0,
        buyType: productData.buyType || 'Import',
        warrantyYears: productData.warrantyYears || 0,
        stock: isOnOrder ? 0 : (productData.stock || 0),
        description: productData.description || '',
        status: productStatus,
        isDamaged: productData.isDamaged || false,
        serialNumbers: (productData.serialNumbers || []).join(',') || '',
        serialCities: typeof productData.serialCities === 'string' ? productData.serialCities : JSON.stringify(productData.serialCities || {}),
        serialStatus: productData.serialStatus || 'New',
        // Costing fields (if provided)
        ...(productData.costingOption === 'with' && {
          costingOption: productData.costingOption,
          costingUsdRate: (productData as any).costingUsdRate,
          costingTotalCustomsValue: (productData as any).costingTotalCustomsValue,
          costingTotalFreightValue: (productData as any).costingTotalFreightValue,
          costingShipmentTotalUSD: (productData as any).costingShipmentTotalUSD,
          costingConsignmentValue: (productData as any).costingConsignmentValue,
          costingTotalValueOfBrand: (productData as any).costingTotalValueOfBrand,
          costingModelsJson: JSON.stringify((productData as any).costing?.models || []),
        }),
      });

      console.log('✅ Product saved to DataConnect:', id);
      return { ...productData, id } as Product;
    } catch (error) {
      console.error('Error saving product to DataConnect:', error);
      throw error;
    }
  }

  static async fetchAllProducts(): Promise<Product[]> {
    try {
      const { data } = await listProducts();
      const products = ((data as any).products || [])
        .filter((p: any) => p.status?.includes('In-Stock'))
        .map((p: any) => ({ ...p })) as Product[];
      console.log('✅ Fetched in-stock products:', products.length);
      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  static async fetchReceivableProducts(): Promise<Product[]> {
    try {
      const { data } = await listReceivableProducts();
      const products = ((data as any).receivableProducts || (data as any).products || [])
        .filter((p: any) => p.status?.includes('On-Order') && p.status?.includes('Pending'))
        .map((p: any) => ({ ...p })) as Product[];
      console.log('✅ Fetched on-order products:', products.length);
      return products;
    } catch (error) {
      console.error('Error fetching receivable products:', error);
      return [];
    }
  }

  static async fetchProductsByType(inventoryType: 'in-stock' | 'on-order'): Promise<Product[]> {
    if (inventoryType === 'on-order') return this.fetchReceivableProducts();
    return this.fetchAllProducts();
  }

  static async receiveProduct(productId: string): Promise<boolean> {
    try {
      const { productUpdate } = await import('@erp-system/inventory');
      await productUpdate({
        id: productId,
        status: 'In-Stock-Received',
      });
      console.log('✅ Product received:', productId);
      return true;
    } catch (error) {
      console.error('Error receiving product:', error);
      return false;
    }
  }

  static async fetchProductById(id: string): Promise<Product | null> {
    try {
      const { data } = await getProductById({ id });
      if (!(data as any).product) return null;
      return { id, ...(data as any).product } as Product;
    } catch (error) {
      console.error('Error fetching product by ID:', error);
      return null;
    }
  }
}

