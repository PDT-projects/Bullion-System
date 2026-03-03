// Inventory Module - Firebase Data Connect Service Layer
// Handles all Data Connect operations for Products

import { DataConnect, getDataConnect, connectDataConnectEmulator, QueryResult } from 'firebase/data-connect';
import { 
  connectorConfig,
  productInsert,
  productUpdate,
  productDelete,
  listProducts,
  getProductById,
  ProductInsertVariables,
  ProductUpdateVariables,
  ProductDeleteVariables,
  ListProductsData,
  GetProductByIdData
} from '@erp-system/inventory';
import { Product, BuyType, ProductStatus, CostingOption, SerialStatus } from '../../modules/inventory/models/types';

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
 * InventoryDataConnectService - Data Connect operations for Products
 * Uses Firebase Data Connect with PostgreSQL backend
 */
export class InventoryDataConnectService {

  // ==================== READ OPERATIONS ====================

  /**
   * Fetch all products from Data Connect
   */
  static async fetchAllProducts(): Promise<Product[]> {
    try {
      console.log('📡 Fetching all products from Data Connect...');
      
      const dc = getDC();
      
      // Call listProducts
      const result = await listProducts(dc) as unknown as QueryResult<ListProductsData, undefined>;
      const data = result.data;
      
      const products: Product[] = data.products.map((product) => ({
        id: product.id,
        brandName: product.brandName,
        modelName: product.modelName,
        category: product.category,
        costPrice: product.costPrice,
        sellPrice: product.sellPrice,
        buyType: product.buyType as BuyType,
        warrantyYears: product.warrantyYears,
        stock: product.stock,
        description: product.description || '',
        status: product.status as ProductStatus,
        isDamaged: product.isDamaged || false,
        serialNumbers: product.serialNumbers ? JSON.parse(product.serialNumbers) : [],
        serialCities: product.serialCities ? JSON.parse(product.serialCities) : {},
        serialStatus: product.serialStatus ? JSON.parse(product.serialStatus) : undefined,
        costingOption: (product.costingOption || 'without') as CostingOption,
        costing: product.costingOption === 'with' ? {
          units: product.costingUnits || 0,
          unitCostUSD: product.costingUnitCostUSD || 0,
          totalCostUSD: product.costingTotalCostUSD || 0,
          percentage: product.costingPercentage || 0,
          customPerModel: product.costingCustomPerModel || 0,
          customPerUnit: product.costingCustomPerUnit || 0,
          freightPerModel: product.costingFreightPerModel || 0,
          freightPerUnit: product.costingFreightPerUnit || 0,
          unitCostPKR: product.costingUnitCostPKR || 0,
          totalUnitCost: product.costingTotalUnitCost || 0,
          totalShipmentValuePKR: product.costingTotalShipmentValuePKR || 0,
        } : undefined,
        createdAt: product.createdAt || '',
        updatedAt: product.updatedAt || ''
      }));
      
      console.log(`✅ Fetched ${products.length} products from Data Connect`);
      return products;
    } catch (error) {
      console.error('❌ Error fetching products from Data Connect:', error);
      throw new Error('Failed to fetch products from Data Connect');
    }
  }

  /**
   * Fetch a single product by ID from Data Connect
   */
  static async fetchProductById(id: string): Promise<Product | null> {
    try {
      console.log(`📡 Fetching product ${id} from Data Connect...`);
      
      const dc = getDC();
      
      // Call getProductById
      const result = await getProductById({ id }) as unknown as QueryResult<GetProductByIdData, undefined>;
      const data = result.data;
      
      if (!data.product) {
        return null;
      }
      
      const product: Product = {
        id: data.product.id,
        brandName: data.product.brandName,
        modelName: data.product.modelName,
        category: data.product.category,
        costPrice: data.product.costPrice,
        sellPrice: data.product.sellPrice,
        buyType: data.product.buyType as BuyType,
        warrantyYears: data.product.warrantyYears,
        stock: data.product.stock,
        description: data.product.description || '',
        status: data.product.status as ProductStatus,
        isDamaged: data.product.isDamaged || false,
        serialNumbers: data.product.serialNumbers ? JSON.parse(data.product.serialNumbers) : [],
        serialCities: data.product.serialCities ? JSON.parse(data.product.serialCities) : {},
        serialStatus: data.product.serialStatus ? JSON.parse(data.product.serialStatus) : undefined,
        costingOption: (data.product.costingOption || 'without') as CostingOption,
        costing: data.product.costingOption === 'with' ? {
          units: data.product.costingUnits || 0,
          unitCostUSD: data.product.costingUnitCostUSD || 0,
          totalCostUSD: data.product.costingTotalCostUSD || 0,
          percentage: data.product.costingPercentage || 0,
          customPerModel: data.product.costingCustomPerModel || 0,
          customPerUnit: data.product.costingCustomPerUnit || 0,
          freightPerModel: data.product.costingFreightPerModel || 0,
          freightPerUnit: data.product.costingFreightPerUnit || 0,
          unitCostPKR: data.product.costingUnitCostPKR || 0,
          totalUnitCost: data.product.costingTotalUnitCost || 0,
          totalShipmentValuePKR: data.product.costingTotalShipmentValuePKR || 0,
        } : undefined,
        createdAt: data.product.createdAt || '',
        updatedAt: data.product.updatedAt || ''
      };
      
      console.log(`✅ Fetched product: ${product.id}`);
      return product;
    } catch (error) {
      console.error(`❌ Error fetching product ${id} from Data Connect:`, error);
      throw new Error(`Failed to fetch product ${id} from Data Connect`);
    }
  }

  // ==================== WRITE OPERATIONS ====================

  /**
   * Create a new product in Data Connect
   */
  static async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    try {
      console.log('📡 Creating product in Data Connect:', product.brandName, product.modelName);
      
      // Generate a unique ID
      const id = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Prepare variables for Data Connect
      const variables: ProductInsertVariables = {
        id,
        brandName: product.brandName,
        modelName: product.modelName,
        category: product.category,
        costPrice: product.costPrice || 0,
        sellPrice: product.sellPrice,
        buyType: product.buyType,
        warrantyYears: product.warrantyYears,
        stock: product.stock,
        description: product.description || null,
        status: product.status,
        isDamaged: product.isDamaged || null,
        serialNumbers: product.serialNumbers?.length > 0 ? JSON.stringify(product.serialNumbers) : null,
        serialCities: Object.keys(product.serialCities || {}).length > 0 ? JSON.stringify(product.serialCities) : null,
        serialStatus: product.serialStatus ? JSON.stringify(product.serialStatus) : null,
        costingOption: product.costingOption || 'without',
        costingUnits: product.costing?.units || null,
        costingUnitCostUSD: product.costing?.unitCostUSD || null,
        costingTotalCostUSD: product.costing?.totalCostUSD || null,
        costingPercentage: product.costing?.percentage || null,
        costingCustomPerModel: product.costing?.customPerModel || null,
        costingCustomPerUnit: product.costing?.customPerUnit || null,
        costingFreightPerModel: product.costing?.freightPerModel || null,
        costingFreightPerUnit: product.costing?.freightPerUnit || null,
        costingUnitCostPKR: product.costing?.unitCostPKR || null,
        costingTotalUnitCost: product.costing?.totalUnitCost || null,
        costingTotalShipmentValuePKR: product.costing?.totalShipmentValuePKR || null,
      };

      // Execute the mutation
      await productInsert(variables);
      
      const createdProduct: Product = {
        ...product,
        id: variables.id!
      };
      
      console.log('✅ Product created with ID:', createdProduct.id);
      return createdProduct;
    } catch (error) {
      console.error('❌ Error creating product in Data Connect:', error);
      throw new Error('Failed to create product in Data Connect');
    }
  }

  /**
   * Update a product in Data Connect
   */
  static async updateProduct(product: Product): Promise<Product> {
    try {
      console.log('📡 Updating product in Data Connect:', product.id);
      
      // Prepare variables for Data Connect
      const variables: ProductUpdateVariables = {
        id: product.id,
        brandName: product.brandName,
        modelName: product.modelName,
        category: product.category,
        costPrice: product.costPrice || 0,
        sellPrice: product.sellPrice,
        buyType: product.buyType,
        warrantyYears: product.warrantyYears,
        stock: product.stock,
        description: product.description || null,
        status: product.status,
        isDamaged: product.isDamaged || null,
        serialNumbers: product.serialNumbers?.length > 0 ? JSON.stringify(product.serialNumbers) : null,
        serialCities: Object.keys(product.serialCities || {}).length > 0 ? JSON.stringify(product.serialCities) : null,
        serialStatus: product.serialStatus ? JSON.stringify(product.serialStatus) : null,
        costingOption: product.costingOption || 'without',
        costingUnits: product.costing?.units || null,
        costingUnitCostUSD: product.costing?.unitCostUSD || null,
        costingTotalCostUSD: product.costing?.totalCostUSD || null,
        costingPercentage: product.costing?.percentage || null,
        costingCustomPerModel: product.costing?.customPerModel || null,
        costingCustomPerUnit: product.costing?.customPerUnit || null,
        costingFreightPerModel: product.costing?.freightPerModel || null,
        costingFreightPerUnit: product.costing?.freightPerUnit || null,
        costingUnitCostPKR: product.costing?.unitCostPKR || null,
        costingTotalUnitCost: product.costing?.totalUnitCost || null,
        costingTotalShipmentValuePKR: product.costing?.totalShipmentValuePKR || null,
      };

      // Execute the mutation
      await productUpdate(variables);
      
      console.log('✅ Product updated:', product.id);
      return product;
    } catch (error) {
      console.error(`❌ Error updating product ${product.id} in Data Connect:`, error);
      throw new Error('Failed to update product in Data Connect');
    }
  }

  /**
   * Delete a product from Data Connect
   */
  static async deleteProduct(id: string): Promise<void> {
    try {
      console.log('📡 Deleting product from Data Connect:', id);
      
      // Prepare variables for Data Connect
      const variables: ProductDeleteVariables = { id };

      // Execute the mutation
      await productDelete(variables);
      
      console.log('✅ Product deleted:', id);
    } catch (error) {
      console.error(`❌ Error deleting product ${id} from Data Connect:`, error);
      throw new Error('Failed to delete product from Data Connect');
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
