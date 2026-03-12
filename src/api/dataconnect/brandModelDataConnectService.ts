/**
 * Brand Model Data Connect Service
 * Functions to fetch brands and models from Firebase Data Connect
 */
import { listBrands, listModels, getModelById, brandInsert, modelInsert } from '@erp-system/inventory';
import type { CostingInfo, CostingModel } from '../../modules/inventory/models/types';

/**
 * Brand interface - defined locally for type safety
 */
export interface Brand {
  id: string;
  name: string;
  createdAt?: string;
}

/**
 * Model interface with costPrice and sellPrice - defined locally
 */
export interface Model {
  id: string;
  brandId: string;
  name: string;
  category?: string;
  description?: string;
  costPrice?: number;
  sellPrice?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CostingSaveResult {
  brandId: string;
  brandName: string;
  modelIds: string[];
}

export interface BrandWithModels {
  brandId: string;
  brandName: string;
  models: Model[];
}

/**
 * Fetch all brands from the database
 */
export async function fetchBrands(): Promise<Brand[]> {
  try {
    const { data } = await listBrands({ limit: 100, offset: 0 });
    const brands: Brand[] = ((data as any).brands || []).map((b: any) => ({
      id: b.id,
      name: b.name,
      createdAt: b.createdAt
    }));
    return brands;
  } catch (error) {
    console.error('Error fetching brands:', error);
    return [];
  }
}

/**
 * Fetch all models and filter by brandId client-side
 * (Firebase Data Connect doesn't support server-side filtering for models)
 */
export async function fetchModelsByBrand(brandId: string): Promise<Model[]> {
  try {
    const { data } = await listModels({ limit: 100, offset: 0 });
    // Filter client-side by brandId
    const models: Model[] = ((data as any).models || []).filter((m: any) => m.brandId === brandId);
    return models;
  } catch (error) {
    console.error('Error fetching models:', error);
    return [];
  }
}

/**
 * Fetch a single model by ID
 */
export async function fetchModelById(modelId: string): Promise<Model | null> {
  try {
    const { data } = await getModelById({ id: modelId });
    if (!data.model) return null;
    return {
      id: data.model.id,
      brandId: data.model.brandId || '',
      name: data.model.name || '',
      category: data.model.category || undefined,
      description: data.model.description || undefined,
      costPrice: data.model.costPrice || undefined,
      sellPrice: data.model.sellPrice || undefined,
      createdAt: data.model.createdAt || undefined,
      updatedAt: data.model.updatedAt || undefined
    };
  } catch (error) {
    console.error('Error fetching model:', error);
    return null;
  }
}

/**
 * Create a new brand
 */
export async function createBrand(vars: { name: string }): Promise<Brand | null> {
  try {
    const id = `brand_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await brandInsert({ id, name: vars.name });
    return { id, name: vars.name };
  } catch (error) {
    console.error('Error creating brand:', error);
    return null;
  }
}

/**
 * Create a new model
 */
export async function createModel(vars: { name: string; brandId: string; costPrice?: number; sellPrice?: number }): Promise<Model | null> {
  try {
    const id = `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await modelInsert({ 
      id, 
      name: vars.name, 
      brandId: vars.brandId,
      costPrice: vars.costPrice || 0,
      sellPrice: vars.sellPrice || 0
    });
    return { 
      id, 
      name: vars.name, 
      brandId: vars.brandId,
      costPrice: vars.costPrice,
      sellPrice: vars.sellPrice
    };
  } catch (error) {
    console.error('Error creating model:', error);
    return null;
  }
}

/**
 * Find brand by name (exact match)
 */
export async function findBrandByName(name: string): Promise<Brand | null> {
  try {
    const { data } = await listBrands({ limit: 100, offset: 0 });
    const brands: Brand[] = ((data as any).brands || []);
    const existing = brands.find(b => b.name.toLowerCase() === name.toLowerCase());
    return existing || null;
  } catch (error) {
    console.error('Error finding brand:', error);
    return null;
  }
}

/**
 * Save complete costing info to DataConnect
 * Creates brand if not exists, then all models
 */
export async function saveCostingToDataConnect(costingInfo: CostingInfo): Promise<CostingSaveResult> {
  try {
    // Step 1: Find or create brand
    let brandId: string;
    let brandName = costingInfo.brandName.trim();
    
    const existingBrand = await findBrandByName(brandName);
    if (existingBrand) {
      brandId = existingBrand.id;
    } else {
      const newBrand = await createBrand({ name: brandName });
      if (!newBrand) {
        throw new Error('Failed to create brand');
      }
      brandId = newBrand.id;
    }

    // Step 2: Create models from costing info
    const modelIds: string[] = [];
    for (const model of costingInfo.models) {
      if (!model.modelName.trim()) continue;
      
      const newModel = await createModel({
        name: model.modelName,
        brandId,
        costPrice: model.totalLandedUnitCost // Save final landed cost per unit
      });
      
      if (newModel) {
        modelIds.push(newModel.id);
      }
    }

    return {
      brandId,
      brandName,
      modelIds
    };
  } catch (error) {
    console.error('Error saving costing to DataConnect:', error);
    throw error;
  }
}

/**
 * Fetch all brands with their models (for dropdowns)
 */
export async function fetchBrandsWithModels(): Promise<BrandWithModels[]> {
  try {
    const brands = await fetchBrands();
    const brandModelsMap: { [key: string]: Model[] } = {};
    
    // Group models by brand
    const allModels = await listModels({ limit: 100, offset: 0 });
    const models: Model[] = ((allModels.data as any).models || []);
    
    models.forEach(model => {
      if (model.brandId && !brandModelsMap[model.brandId]) {
        brandModelsMap[model.brandId] = [];
      }
      if (model.brandId) {
        brandModelsMap[model.brandId].push(model);
      }
    });
    
    return brands.map(brand => ({
      brandId: brand.id,
      brandName: brand.name,
      models: brandModelsMap[brand.id] || []
    }));
  } catch (error) {
    console.error('Error fetching brands with models:', error);
    return [];
  }
}
