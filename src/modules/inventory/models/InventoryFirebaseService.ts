/**
 * Inventory Module - Firebase Firestore Service Layer
 * Change: `location` field added to product documents — saved on create/update,
 * read back in transformDocToProduct.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import type {
  Product,
  ProductTransfer,
  CreateProductDTO,
  UpdateProductDTO,
  CreateTransferDTO,
  ProductStatus,
  SerialStatus,
  CostingInfo,
} from './types';

const PRODUCTS_COLLECTION  = 'products';
const TRANSFERS_COLLECTION = 'transfers';
const BRANDS_COLLECTION    = 'brands';
const MODELS_COLLECTION    = 'brandModels';
const COUNTERS_COLLECTION  = 'inv_counters';

// ==================== UTILITIES ====================

function stripUndefined<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T;
}

/**
 * Auto-generate transaction ID: INV-DDMMYY-NNN
 * e.g.  INV-150326-001
 */
export async function generateInventoryTransactionId(): Promise<string> {
  const now      = new Date();
  const dd       = String(now.getDate()).padStart(2, '0');
  const mm       = String(now.getMonth() + 1).padStart(2, '0');
  const yy       = String(now.getFullYear()).slice(-2);
  const dateKey  = `${dd}${mm}${yy}`;
  const prefix   = `INV-${dateKey}`;
  const counterRef = doc(db, COUNTERS_COLLECTION, prefix);

  const newCount = await runTransaction(db, async (tx) => {
    const snap    = await tx.get(counterRef);
    const current = snap.exists() ? (snap.data().count as number) : 0;
    const next    = current + 1;
    tx.set(counterRef, { count: next, updatedAt: new Date().toISOString() });
    return next;
  });

  return `${prefix}-${String(newCount).padStart(3, '0')}`;
}

// ==================== TRANSFORMS ====================

function transformDocToProduct(docSnap: any): Product {
  const d = docSnap.data();
  return {
    id:            docSnap.id,
    brandName:     d.brandName     || '',
    modelName:     d.modelName     || '',
    category:      d.category      || '',
    costPrice:     d.costPrice     ?? 0,
    sellPrice:     d.sellPrice     ?? 0,
    buyType:       d.buyType       || 'Import',
    warrantyYears: d.warrantyYears ?? 0,
    stock:         d.stock         ?? 0,
    location:      d.location      || '',          // ← new
    serialNumbers: d.serialNumbers || [],
    serialCities:  d.serialCities  || {},
    serialStatus:  d.serialStatus  || {},
    description:   d.description   || '',
    status:        d.status        || 'New',
    isDamaged:     d.isDamaged     ?? false,
    brandId:       d.brandId       || '',
    modelId:       d.modelId       || '',
    costingId:     d.costingId     || '',
    billId:              d.billId              || undefined,
    receivableStatus:    d.receivableStatus    || undefined,
    expectedReceiveDate: d.expectedReceiveDate || undefined,
    costingOption:       d.costingOption       || undefined,
    costing:             d.costing             || undefined,
    costingUsdRate:           d.costingUsdRate           ?? undefined,
    costingTotalCustomsValue: d.costingTotalCustomsValue ?? undefined,
    costingTotalFreightValue: d.costingTotalFreightValue ?? undefined,
    costingShipmentTotalUSD:  d.costingShipmentTotalUSD  ?? undefined,
    costingConsignmentValue:  d.costingConsignmentValue  ?? undefined,
    costingTotalValueOfBrand: d.costingTotalValueOfBrand ?? undefined,
    costingModelsJson:        d.costingModelsJson        || undefined,
    createdAt: d.createdAt || '',
    updatedAt: d.updatedAt || '',
  };
}

function transformDocToTransfer(docSnap: any): ProductTransfer {
  const d = docSnap.data();
  return {
    id:             docSnap.id,
    productId:      d.productId      || '',
    productName:    d.productName    || '',
    brandName:      d.brandName      || '',
    modelName:      d.modelName      || '',
    fromLocation:   d.fromLocation   || '',
    toLocation:     d.toLocation     || '',
    quantity:       d.quantity       ?? 0,
    serialNumbers:  d.serialNumbers  || [],
    date:           d.date           || '',
    transferDate:   d.transferDate   || '',
    status:         d.status         || 'Pending',
    transferredBy:  d.transferredBy  || '',
    note:           d.note           || '',
    notes:          d.notes          || '',
    receiptName:    d.receiptName    || undefined,
    receiptType:    d.receiptType    || undefined,
    receiptDataUrl: d.receiptDataUrl || undefined,
    createdAt:      d.createdAt      || '',
    receivedAt:     d.receivedAt     || undefined,
  };
}

export interface BrandDoc  { id: string; name: string; createdAt?: string; }
export interface ModelDoc  { id: string; name: string; brandId: string; costPrice?: number; sellPrice?: number; createdAt?: string; }

function transformDocToBrand(docSnap: any): BrandDoc {
  const d = docSnap.data();
  return { id: docSnap.id, name: d.name || '', createdAt: d.createdAt || '' };
}

function transformDocToModel(docSnap: any): ModelDoc {
  const d = docSnap.data();
  return {
    id:        docSnap.id,
    name:      d.name      || '',
    brandId:   d.brandId   || '',
    costPrice: d.costPrice ?? undefined,
    sellPrice: d.sellPrice ?? undefined,
    createdAt: d.createdAt || '',
  };
}

// ==================== PRODUCT SERVICE ====================

export class InventoryFirebaseService {

  static async fetchAllProducts(): Promise<Product[]> {
    try {
      console.log('🔥 Fetching all products...');
      const q = query(collection(db, PRODUCTS_COLLECTION), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const products: Product[] = [];
      snapshot.forEach(d => products.push(transformDocToProduct(d)));
      console.log(`✅ Fetched ${products.length} products`);
      return products;
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      throw new Error('Failed to fetch products from Firestore');
    }
  }

  static async fetchProductsByType(inventoryType: 'in-stock' | 'on-order'): Promise<Product[]> {
    try {
      console.log(`🔥 Fetching ${inventoryType} products...`);
      const ref = collection(db, PRODUCTS_COLLECTION);
      let snapshot;

      if (inventoryType === 'on-order') {
        const q = query(ref, where('receivableStatus', '==', 'Pending'));
        snapshot = await getDocs(q);
      } else {
        const q = query(ref, orderBy('createdAt', 'desc'));
        snapshot = await getDocs(q);
      }

      const products: Product[] = [];
      snapshot.forEach(d => {
        const p = transformDocToProduct(d);
        if (inventoryType === 'in-stock' && p.receivableStatus === 'Pending') return;
        products.push(p);
      });

      if (inventoryType === 'on-order') {
        products.sort((a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
      }

      console.log(`✅ Fetched ${products.length} ${inventoryType} products`);
      return products;
    } catch (error) {
      console.error(`❌ Error fetching ${inventoryType} products:`, error);
      throw new Error('Failed to fetch products from Firestore');
    }
  }

  static async fetchProductById(id: string): Promise<Product | null> {
    try {
      const snap = await getDoc(doc(db, PRODUCTS_COLLECTION, id));
      if (!snap.exists()) return null;
      return transformDocToProduct(snap);
    } catch (error) {
      console.error(`❌ Error fetching product ${id}:`, error);
      throw new Error('Failed to fetch product from Firestore');
    }
  }

  static async createProduct(
    dto: CreateProductDTO,
    paymentInfo?: {
      paymentStatus: 'paid' | 'unpaid' | 'partial';
      transactionId?: string;
      paidAmount?: number;
      totalAmount?: number;
    }
  ): Promise<Product> {
    try {
      console.log('🔥 Creating product:', dto.brandName, dto.modelName);
      const now = new Date().toISOString();

      const serialStatus: { [key: string]: SerialStatus } = {};
      dto.serialNumbers.forEach(s => { serialStatus[s] = 'Available'; });

      // If no per-serial cities set, seed them all to the product's primary location
      const serialCities = { ...dto.serialCities };
      if (dto.location) {
        dto.serialNumbers.forEach(s => {
          if (!serialCities[s]) serialCities[s] = dto.location!;
        });
      }

      let costingFields = {};
      if (dto.costingOption === 'with' && dto.costing) {
        const c = dto.costing;
        costingFields = stripUndefined({
          costingUsdRate:           c.usdRate,
          costingTotalCustomsValue: c.totalCustomsValue,
          costingTotalFreightValue: c.totalFreightValue,
          costingShipmentTotalUSD:  c.shipmentTotalUSD,
          costingConsignmentValue:  c.consignmentValue,
          costingTotalValueOfBrand: c.totalValueOfBrand,
          costingModelsJson:        JSON.stringify(c.models),
          costing:                  c,
        });
      }

      const remainingAmount = paymentInfo
        ? (paymentInfo.totalAmount || 0) - (paymentInfo.paidAmount || 0)
        : undefined;

      const data = stripUndefined({
        brandName:     dto.brandName,
        modelName:     dto.modelName,
        category:      dto.category,
        costPrice:     dto.costPrice,
        sellPrice:     dto.sellPrice,
        buyType:       dto.buyType,
        warrantyYears: dto.warrantyYears,
        stock:         dto.stock,
        location:      dto.location,              // ← new
        serialNumbers: dto.serialNumbers,
        serialCities,                             // ← seeded from location
        serialStatus,
        description:   dto.description,
        status:        dto.status,
        isDamaged:     dto.isDamaged,
        costingOption: dto.costingOption,
        billId:              dto.billId,
        receivableStatus:    dto.receivableStatus,
        expectedReceiveDate: dto.expectedReceiveDate,
        paymentStatus:  paymentInfo?.paymentStatus,
        transactionId:  paymentInfo?.transactionId,
        paidAmount:     paymentInfo?.paidAmount,
        totalAmount:    paymentInfo?.totalAmount,
        remainingAmount,
        ...costingFields,
        createdAt: now,
        updatedAt: now,
      });

      const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), data);
      console.log('✅ Product created:', docRef.id);
      const newDoc = await getDoc(docRef);
      return transformDocToProduct(newDoc);
    } catch (error) {
      console.error('❌ Error creating product:', error);
      throw new Error('Failed to create product in Firestore');
    }
  }

  static async updateProduct(id: string, dto: UpdateProductDTO): Promise<Product> {
    try {
      const now = new Date().toISOString();
      let costingFields = {};
      if (dto.costingOption === 'with' && dto.costing) {
        const c = dto.costing;
        costingFields = stripUndefined({
          costingUsdRate:           c.usdRate,
          costingTotalCustomsValue: c.totalCustomsValue,
          costingTotalFreightValue: c.totalFreightValue,
          costingShipmentTotalUSD:  c.shipmentTotalUSD,
          costingConsignmentValue:  c.consignmentValue,
          costingTotalValueOfBrand: c.totalValueOfBrand,
          costingModelsJson:        JSON.stringify(c.models),
          costing:                  c,
        });
      }
      const data = stripUndefined({ ...dto, ...costingFields, updatedAt: now });
      const ref = doc(db, PRODUCTS_COLLECTION, id);
      await updateDoc(ref, data);
      console.log('✅ Product updated:', id);
      return transformDocToProduct(await getDoc(ref));
    } catch (error) {
      console.error(`❌ Error updating product ${id}:`, error);
      throw new Error('Failed to update product in Firestore');
    }
  }

  static async receiveProduct(id: string): Promise<void> {
    try {
      console.log(`🔥 Receiving product ${id}...`);
      await updateDoc(doc(db, PRODUCTS_COLLECTION, id), {
        receivableStatus: 'Received',
        status:     'Available' as ProductStatus,
        receivedAt: new Date().toISOString(),
        updatedAt:  new Date().toISOString(),
      });
      console.log('✅ Product moved to inventory:', id);
    } catch (error) {
      console.error(`❌ Error receiving product ${id}:`, error);
      throw new Error('Failed to receive product in Firestore');
    }
  }

  static async deleteProduct(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
      console.log('✅ Product deleted:', id);
    } catch (error) {
      console.error(`❌ Error deleting product ${id}:`, error);
      throw new Error('Failed to delete product from Firestore');
    }
  }

  static isConnected(): boolean { return !!db; }
}

// ==================== TRANSFER SERVICE ====================

export class TransferFirebaseService {

  static async fetchAllTransfers(): Promise<ProductTransfer[]> {
    try {
      const q = query(collection(db, TRANSFERS_COLLECTION), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      const transfers: ProductTransfer[] = [];
      snapshot.forEach(d => transfers.push(transformDocToTransfer(d)));
      console.log(`✅ Fetched ${transfers.length} transfers`);
      return transfers;
    } catch (error) {
      console.error('❌ Error fetching transfers:', error);
      throw new Error('Failed to fetch transfers from Firestore');
    }
  }

  static async fetchTransferById(id: string): Promise<ProductTransfer | null> {
    try {
      const snap = await getDoc(doc(db, TRANSFERS_COLLECTION, id));
      if (!snap.exists()) return null;
      return transformDocToTransfer(snap);
    } catch (error) {
      throw new Error('Failed to fetch transfer from Firestore');
    }
  }

  static async createTransfer(dto: CreateTransferDTO & {
    productName: string;
    brandName?: string;
    modelName?: string;
    transferredBy?: string;
    note?: string;
    receiptName?: string;
    receiptType?: string;
    receiptDataUrl?: string;
  }): Promise<ProductTransfer> {
    try {
      const now = new Date().toISOString();
      const data = stripUndefined({
        productId:      dto.productId,
        productName:    dto.productName,
        brandName:      dto.brandName,
        modelName:      dto.modelName,
        fromLocation:   dto.fromLocation,
        toLocation:     dto.toLocation,
        quantity:       dto.quantity,
        serialNumbers:  dto.serialNumbers,
        date:           dto.transferDate,
        transferDate:   dto.transferDate,
        status:         'In Transit' as const,   // ← always In Transit on create
        transferredBy:  dto.transferredBy,
        note:           dto.note,
        notes:          dto.notes,
        receiptName:    dto.receiptName,
        receiptType:    dto.receiptType,
        receiptDataUrl: dto.receiptDataUrl,
        createdAt:      now,
      });
      const docRef = await addDoc(collection(db, TRANSFERS_COLLECTION), data);
      console.log('✅ Transfer created:', docRef.id);
      return transformDocToTransfer(await getDoc(docRef));
    } catch (error) {
      console.error('❌ Error creating transfer:', error);
      throw new Error('Failed to create transfer in Firestore');
    }
  }

  static async updateTransferStatus(id: string, status: ProductTransfer['status'], receivedAt?: string): Promise<void> {
    try {
      await updateDoc(doc(db, TRANSFERS_COLLECTION, id),
        stripUndefined({ status, receivedAt, updatedAt: new Date().toISOString() })
      );
      console.log('✅ Transfer status updated:', id, status);
    } catch (error) {
      throw new Error('Failed to update transfer status in Firestore');
    }
  }

  static async deleteTransfer(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, TRANSFERS_COLLECTION, id));
      console.log('✅ Transfer deleted:', id);
    } catch (error) {
      throw new Error('Failed to delete transfer from Firestore');
    }
  }
}

// ==================== BRAND / MODEL SERVICE ====================

export class BrandModelFirebaseService {

  static async fetchAllBrands(): Promise<BrandDoc[]> {
    try {
      const q = query(collection(db, BRANDS_COLLECTION), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      const brands: BrandDoc[] = [];
      snapshot.forEach(d => brands.push(transformDocToBrand(d)));
      console.log(`✅ Fetched ${brands.length} brands`);
      return brands;
    } catch (error) {
      console.error('❌ Error fetching brands:', error);
      throw new Error('Failed to fetch brands from Firestore');
    }
  }

  static async fetchModelsByBrand(brandId: string): Promise<ModelDoc[]> {
    try {
      const q = query(collection(db, MODELS_COLLECTION), where('brandId', '==', brandId));
      const snapshot = await getDocs(q);
      const models: ModelDoc[] = [];
      snapshot.forEach(d => models.push(transformDocToModel(d)));
      models.sort((a, b) => a.name.localeCompare(b.name));
      console.log(`✅ Fetched ${models.length} models for brand ${brandId}`);
      return models;
    } catch (error) {
      console.error(`❌ Error fetching models for brand ${brandId}:`, error);
      throw new Error('Failed to fetch models from Firestore');
    }
  }

  static async createBrand(name: string): Promise<BrandDoc> {
    try {
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, BRANDS_COLLECTION), { name, createdAt: now });
      console.log('✅ Brand created:', docRef.id);
      return { id: docRef.id, name, createdAt: now };
    } catch (error) {
      console.error('❌ Error creating brand:', error);
      throw new Error('Failed to create brand in Firestore');
    }
  }

  static async createModel(brandId: string, name: string, costPrice?: number, sellPrice?: number): Promise<ModelDoc> {
    try {
      const now = new Date().toISOString();
      const data = stripUndefined({ name, brandId, costPrice, sellPrice, createdAt: now });
      const docRef = await addDoc(collection(db, MODELS_COLLECTION), data);
      console.log('✅ Model created:', docRef.id);
      return { id: docRef.id, name, brandId, costPrice, sellPrice, createdAt: now };
    } catch (error) {
      console.error('❌ Error creating model:', error);
      throw new Error('Failed to create model in Firestore');
    }
  }

  static async saveCostingBrandAndModels(
    brandName: string,
    models: Array<{ modelName: string; costPrice?: number }>
  ): Promise<{ brandId: string; modelIds: string[] }> {
    try {
      console.log('🔥 Saving costing brand/models to Firestore:', brandName);
      const bq = query(collection(db, BRANDS_COLLECTION), where('name', '==', brandName));
      const bSnap = await getDocs(bq);
      let brandId: string;
      if (!bSnap.empty) {
        brandId = bSnap.docs[0].id;
      } else {
        const b = await BrandModelFirebaseService.createBrand(brandName);
        brandId = b.id;
      }

      const modelIds: string[] = [];
      for (const m of models) {
        if (!m.modelName.trim()) continue;
        const mq = query(
          collection(db, MODELS_COLLECTION),
          where('brandId', '==', brandId),
          where('name', '==', m.modelName)
        );
        const mSnap = await getDocs(mq);
        if (!mSnap.empty) {
          modelIds.push(mSnap.docs[0].id);
        } else {
          const created = await BrandModelFirebaseService.createModel(brandId, m.modelName, m.costPrice);
          modelIds.push(created.id);
        }
      }

      console.log(`✅ Brand ${brandId} saved with ${modelIds.length} models`);
      return { brandId, modelIds };
    } catch (error) {
      console.error('❌ Error saving costing brand/models:', error);
      throw new Error('Failed to save brand and models to Firestore');
    }
  }
}