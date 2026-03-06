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
        // New linking fields
        brandId: product.brandId || undefined,
        modelId: product.modelId || undefined,
        costingId: product.costingId || undefined,
        costingOption: (product.costingOption || 'without') as CostingOption,
        // Flat costing fields for backward compatibility
        costingUnits: product.costingUnits || undefined,
        costingUnitCostUSD: product.costingUnitCostUSD || undefined,
        costingTotalCostUSD: product.costingTotalCostUSD || undefined,
        costingPercentage: product.costingPercentage || undefined,
        costingCustomPerModel: product.costingCustomPerModel || undefined,
        costingCustomPerUnit: product.costingCustomPerUnit || undefined,
        costingFreightPerModel: product.costingFreightPerModel || undefined,
        costingFreightPerUnit: product.costingFreightPerUnit || undefined,
        costingUnitCostPKR: product.costingUnitCostPKR || undefined,
        costingTotalUnitCost: product.costingTotalUnitCost || undefined,
        costingTotalShipmentValuePKR: product.costingTotalShipmentValuePKR || undefined,
        costingUsdRate: product.costingUsdRate || undefined,
        costingTotalCustomsValue: product.costingTotalCustomsValue || undefined,
        costingTotalFreightValue: product.costingTotalFreightValue || undefined,
        costingShipmentTotalUSD: product.costingShipmentTotalUSD || undefined,
        costingConsignmentValue: product.costingConsignmentValue || undefined,
        costingTotalValueOfBrand: product.costingTotalValueOfBrand || undefined,
        costingModelsJson: product.costingModelsJson || undefined,
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
        // New linking fields
        brandId: data.product.brandId || undefined,
        modelId: data.product.modelId || undefined,
        costingId: data.product.costingId || undefined,
        costingOption: (data.product.costingOption || 'without') as CostingOption,
        // Flat costing fields for backward compatibility
        costingUnits: data.product.costingUnits || undefined,
        costingUnitCostUSD: data.product.costingUnitCostUSD || undefined,
        costingTotalCostUSD: data.product.costingTotalCostUSD || undefined,
        costingPercentage: data.product.costingPercentage || undefined,
        costingCustomPerModel: data.product.costingCustomPerModel || undefined,
        costingCustomPerUnit: data.product.costingCustomPerUnit || undefined,
        costingFreightPerModel: data.product.costingFreightPerModel || undefined,
        costingFreightPerUnit: data.product.costingFreightPerUnit || undefined,
        costingUnitCostPKR: data.product.costingUnitCostPKR || undefined,
        costingTotalUnitCost: data.product.costingTotalUnitCost || undefined,
        costingTotalShipmentValuePKR: data.product.costingTotalShipmentValuePKR || undefined,
        costingUsdRate: data.product.costingUsdRate || undefined,
        costingTotalCustomsValue: data.product.costingTotalCustomsValue || undefined,
        costingTotalFreightValue: data.product.costingTotalFreightValue || undefined,
        costingShipmentTotalUSD: data.product.costingShipmentTotalUSD || undefined,
        costingConsignmentValue: data.product.costingConsignmentValue || undefined,
        costingTotalValueOfBrand: data.product.costingTotalValueOfBrand || undefined,
        costingModelsJson: data.product.costingModelsJson || undefined,
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
        // New linking fields
        brandId: product.brandId || null,
        modelId: product.modelId || null,
        costingId: product.costingId || null,
        costingOption: product.costingOption || 'without',
        // Flat costing fields
        costingUnits: product.costingUnits || null,
        costingUnitCostUSD: product.costingUnitCostUSD || null,
        costingTotalCostUSD: product.costingTotalCostUSD || null,
        costingPercentage: product.costingPercentage || null,
        costingCustomPerModel: product.costingCustomPerModel || null,
        costingCustomPerUnit: product.costingCustomPerUnit || null,
        costingFreightPerModel: product.costingFreightPerModel || null,
        costingFreightPerUnit: product.costingFreightPerUnit || null,
        costingUnitCostPKR: product.costingUnitCostPKR || null,
        costingTotalUnitCost: product.costingTotalUnitCost || null,
        costingTotalShipmentValuePKR: product.costingTotalShipmentValuePKR || null,
        costingUsdRate: product.costingUsdRate || null,
        costingTotalCustomsValue: product.costingTotalCustomsValue || null,
        costingTotalFreightValue: product.costingTotalFreightValue || null,
        costingShipmentTotalUSD: product.costingShipmentTotalUSD || null,
        costingConsignmentValue: product.costingConsignmentValue || null,
        costingTotalValueOfBrand: product.costingTotalValueOfBrand || null,
        costingModelsJson: product.costingModelsJson || null,
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
        // New linking fields
        brandId: product.brandId || null,
        modelId: product.modelId || null,
        costingId: product.costingId || null,
        costingOption: product.costingOption || 'without',
        // Flat costing fields
        costingUnits: product.costingUnits || null,
        costingUnitCostUSD: product.costingUnitCostUSD || null,
        costingTotalCostUSD: product.costingTotalCostUSD || null,
        costingPercentage: product.costingPercentage || null,
        costingCustomPerModel: product.costingCustomPerModel || null,
        costingCustomPerUnit: product.costingCustomPerUnit || null,
        costingFreightPerModel: product.costingFreightPerModel || null,
        costingFreightPerUnit: product.costingFreightPerUnit || null,
        costingUnitCostPKR: product.costingUnitCostPKR || null,
        costingTotalUnitCost: product.costingTotalUnitCost || null,
        costingTotalShipmentValuePKR: product.costingTotalShipmentValuePKR || null,
        costingUsdRate: product.costingUsdRate || null,
        costingTotalCustomsValue: product.costingTotalCustomsValue || null,
        costingTotalFreightValue: product.costingTotalFreightValue || null,
        costingShipmentTotalUSD: product.costingShipmentTotalUSD || null,
        costingConsignmentValue: product.costingConsignmentValue || null,
        costingTotalValueOfBrand: product.costingTotalValueOfBrand || null,
        costingModelsJson: product.costingModelsJson || null,
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
