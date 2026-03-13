/**
 * Brand Model Data Connect Service
 * Uses correct Firebase Data Connect 0.3.12 API:
 * - Queries: executeQuery(queryRef)  — already working via generated SDK
 * - Mutations: executeMutation(mutationRef) — correct API for this version
 * - Generated functions: brandInsert, modelInsert from @erp-system/inventory
 */
import {
  listBrands,
  listModels,
  getModelById,
  brandInsert,
  modelInsert,
} from '@erp-system/inventory';
import type { CostingInfo } from '../../modules/inventory/models/types';

export interface Brand {
  id: string;
  name: string;
  createdAt?: string;
}

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
 * Fetch all brands
 */
export async function fetchBrands(): Promise<Brand[]> {
  try {
    const { data } = await listBrands({ limit: 100, offset: 0 });
    return ((data as any).brands || []).map((b: any) => ({
      id: b.id,
      name: b.name,
      createdAt: b.createdAt,
    }));
  } catch (error) {
    console.error('Error fetching brands:', error);
    return [];
  }
}

/**
 * Fetch models filtered by brandId client-side
 */
export async function fetchModelsByBrand(brandId: string): Promise<Model[]> {
  try {
    const { data } = await listModels({ limit: 100, offset: 0 });
    return ((data as any).models || [])
      .filter((m: any) => m.brandId === brandId)
      .map((m: any) => ({
        id: m.id,
        brandId: m.brandId,
        name: m.name,
        category: m.category || undefined,
        description: m.description || undefined,
        costPrice: m.costPrice || undefined,
        sellPrice: m.sellPrice || undefined,
        createdAt: m.createdAt || undefined,
        updatedAt: m.updatedAt || undefined,
      }));
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
    const m = data.model as any;
    return {
      id: m.id,
      brandId: m.brandId || '',
      name: m.name || '',
      category: m.category || undefined,
      description: m.description || undefined,
      costPrice: m.costPrice || undefined,
      sellPrice: m.sellPrice || undefined,
      createdAt: m.createdAt || undefined,
      updatedAt: m.updatedAt || undefined,
    };
  } catch (error) {
    console.error('Error fetching model:', error);
    return null;
  }
}

/**
 * Find brand by name (case-insensitive)
 */
export async function findBrandByName(name: string): Promise<Brand | null> {
  try {
    const { data } = await listBrands({ limit: 100, offset: 0 });
    const brands: Brand[] = (data as any).brands || [];
    return (
      brands.find(
        (b) => b.name.toLowerCase() === name.trim().toLowerCase()
      ) || null
    );
  } catch (error) {
    console.error('Error finding brand:', error);
    return null;
  }
}

/**
 * Create a new brand using the generated brandInsert mutation
 * Checks for duplicates first to prevent re-insertion
 */
export async function createBrand(vars: { name: string }): Promise<Brand | null> {
  try {
    // Duplicate guard
    const existing = await findBrandByName(vars.name);
    if (existing) {
      console.log('✅ Brand already exists, reusing:', existing.name);
      return existing;
    }

    const id = `brand_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    // brandInsert is the generated mutation function from @erp-system/inventory
    await brandInsert({ id, name: vars.name.trim() });
    console.log('✅ Brand created:', vars.name, id);
    return { id, name: vars.name.trim() };
  } catch (error) {
    console.error('Error creating brand:', error);
    return null;
  }
}

/**
 * Create a new model using the generated modelInsert mutation
 */
export async function createModel(vars: {
  name: string;
  brandId: string;
  costPrice?: number;
  sellPrice?: number;
}): Promise<Model | null> {
  try {
    const id = `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    // modelInsert is the generated mutation function from @erp-system/inventory
    await modelInsert({
      id,
      name: vars.name.trim(),
      brandId: vars.brandId,
      costPrice: vars.costPrice || 0,
      sellPrice: vars.sellPrice || 0,
    });
    console.log('✅ Model created:', vars.name, id);
    return {
      id,
      name: vars.name.trim(),
      brandId: vars.brandId,
      costPrice: vars.costPrice,
      sellPrice: vars.sellPrice,
    };
  } catch (error) {
    console.error('Error creating model:', error);
    return null;
  }
}

/**
 * Save complete costing info — finds/creates brand then all models
 */
export async function saveCostingToDataConnect(
  costingInfo: CostingInfo
): Promise<CostingSaveResult> {
  const brandName = costingInfo.brandName.trim();

  // Step 1: Find or create brand (duplicate-safe)
  let brand = await findBrandByName(brandName);
  if (!brand) {
    brand = await createBrand({ name: brandName });
  }
  if (!brand) throw new Error('Failed to find or create brand');

  const brandId = brand.id;

  // Step 2: Create models
  const modelIds: string[] = [];
  for (const model of costingInfo.models) {
    if (!model.modelName.trim()) continue;
    const newModel = await createModel({
      name: model.modelName,
      brandId,
      costPrice: model.totalLandedUnitCost,
    });
    if (newModel) modelIds.push(newModel.id);
  }

  return { brandId, brandName, modelIds };
}

/**
 * Fetch all brands with their models
 */
export async function fetchBrandsWithModels(): Promise<BrandWithModels[]> {
  try {
    const brands = await fetchBrands();
    const allModels = await listModels({ limit: 100, offset: 0 });
    const models: Model[] = (allModels.data as any).models || [];

    const brandModelsMap: { [key: string]: Model[] } = {};
    models.forEach((model) => {
      if (model.brandId) {
        if (!brandModelsMap[model.brandId]) brandModelsMap[model.brandId] = [];
        brandModelsMap[model.brandId].push(model);
      }
    });

    return brands.map((brand) => ({
      brandId: brand.id,
      brandName: brand.name,
      models: brandModelsMap[brand.id] || [],
    }));
  } catch (error) {
    console.error('Error fetching brands with models:', error);
    return [];
  }
}
