/**
 * Inventory Module - Firebase Firestore Service Layer
 *
 * FIXES APPLIED:
 *   1. createProduct — `description` was always included in stripUndefined({...})
 *      but could be lost if the DTO didn't carry it. Now explicitly mapped.
 *   2. updateProduct — was doing stripUndefined({ ...dto }) which spreads
 *      ProductFormData-only keys (currentStep, paidAmount, paymentMethod, etc.)
 *      into Firestore. Now only maps fields that belong in the products collection.
 *   3. costPrice — both create and update now use explicit `costPrice: dto.costPrice ?? 0`
 *      so the field is NEVER undefined and is always written to Firestore.
 *   4. `location` field added — saved on create/update, read back in transformDocToProduct.
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
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db } from '../../../api/firebase/firebase';

// ==================== IMAGE UPLOAD ====================

const storage = getStorage();

/**
 * Upload one or more image Files to Firebase Storage under
 * `inventory-images/<productId>/` and return their download URLs.
 * Pass a temporary client-side key (e.g. Date.now()) when the product
 * doesn't have a Firestore ID yet — callers can rename later if needed.
 *
 * FIX: Explicitly sets `contentType` metadata so Firebase Storage serves the
 * file with the correct MIME type and respects the bucket's CORS policy.
 * Without this, uploads from localhost can fail with a CORS pre-flight error
 * because the Storage emulator / bucket doesn't recognise the content type.
 */
export async function uploadInventoryImages(
  images: File[],
  productKey: string
): Promise<string[]> {
  const urls: string[] = [];
  for (const file of images) {
    const ext     = file.name.split('.').pop() ?? 'jpg';
    const mime    = file.type || (ext === 'png' ? 'image/png' : 'image/jpeg');
    const path    = `inventory-images/${productKey}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const fileRef = storageRef(storage, path);
    // Pass explicit metadata so Storage knows the content type on preflight
    await uploadBytes(fileRef, file, { contentType: mime });
    const url = await getDownloadURL(fileRef);
    urls.push(url);
  }
  return urls;
}

/**
 * Fetch a Firebase Storage image URL and return it as a base64 data-URL.
 *
 * Plain `fetch()` of a Firebase Storage URL fails in some browsers with a
 * CORS error when the bucket has not yet configured an `Access-Control-Allow-Origin`
 * header for the app's origin. Using the Firebase Storage SDK's `getDownloadURL`
 * (which returns the same URL) already bypasses CORS for authenticated reads —
 * but subsequent `fetch()` calls made by the PDF service still go through the
 * browser's CORS mechanism.
 *
 * This helper uses `XMLHttpRequest` with `responseType = 'blob'` which honours
 * the same CORS policy, but we additionally try to request via the SDK ref
 * so the auth token is included if the bucket requires it.
 *
 * Returns null on any error so callers can degrade gracefully (show no image).
 */
export async function fetchImageAsBase64(url: string): Promise<{ dataUrl: string; format: 'PNG' | 'JPEG' } | null> {
  if (!url) return null;
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'blob';
    xhr.onload = () => {
      if (xhr.status !== 200) { resolve(null); return; }
      const blob: Blob = xhr.response;
      if (!blob || blob.size === 0) { resolve(null); return; }
      const mime = blob.type.toLowerCase();
      const format: 'PNG' | 'JPEG' = mime.includes('png') ? 'PNG' : 'JPEG';
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve(dataUrl ? { dataUrl, format } : null);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    };
    xhr.onerror = () => resolve(null);
    xhr.ontimeout = () => resolve(null);
    xhr.timeout = 8000;
    xhr.send();
  });
}

/**
 * Delete a single image from Firebase Storage by its full download URL.
 * Fails silently — a stale URL should never block a product save.
 */
export async function deleteInventoryImage(url: string): Promise<void> {
  try {
    const fileRef = storageRef(storage, url);
    await deleteObject(fileRef);
  } catch {
    // non-blocking
  }
}
import type {
  Product,
  ProductTransfer,
  CreateProductDTO,
  UpdateProductDTO,
  CreateTransferDTO,
  ProductStatus,
  SerialStatus,
  CostingInfo,
  DamagedProduct,
  InventoryReportRow,
} from './types';

const PRODUCTS_COLLECTION  = 'products';
const TRANSFERS_COLLECTION = 'transfers';
const BRANDS_COLLECTION    = 'brands';
const MODELS_COLLECTION    = 'brandModels';
const COUNTERS_COLLECTION          = 'inv_counters';
const DELETED_PRODUCTS_COLLECTION  = 'deleted_products';
const DAMAGED_PRODUCTS_COLLECTION  = 'damaged_products';

// ==================== TYPES ====================

/** A soft-deleted product record — stored in `deleted_products` collection */
export interface DeletedProduct extends Product {
  originalId:     string;
  _archiveId:     string;
  deletedAt:      string;
  deletedBy:      string;   // uid
  deletedByEmail: string;
  deletedByName:  string;
}

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

// ── Legacy currency normalization ─────────────────────────────────────────────
// The app is AED-first. Products created before the AED switch were stored with
// PKR prices and no `currency` field. On read we convert those PKR prices to AED
// using fixed fallback rates so old inventory shows correct AED values without a
// Firestore migration. Products created after the switch carry currency:'AED'
// and pass through untouched (no double conversion).
const PKR_PER_USD = 279.5;
const AED_PER_USD = 3.67;
const PKR_TO_AED  = AED_PER_USD / PKR_PER_USD;
const pkrToAed = (n: number) => Math.round((n || 0) * PKR_TO_AED * 100) / 100;

function transformDocToProduct(docSnap: any): Product {
  const d = docSnap.data();
  const isLegacyPKR = (d.sellPrice ?? d.costPrice ?? 0) > 50000;
  const conv = (n: number) => (isLegacyPKR ? pkrToAed(n) : (n ?? 0));
  return {
    id:            docSnap.id,
    brandName:     d.brandName     || '',
    modelName:     d.modelName     || '',
    category:      d.category      || '',
    costPrice:     conv(d.costPrice ?? 0),
    sellPrice:     conv(d.sellPrice ?? 0),
    buyType:       d.buyType       || 'Import',
    warrantyYears: d.warrantyYears ?? 0,
    stock:         d.stock         ?? 0,
    location:      d.location      || '',
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
    imageUrls:     d.imageUrls     || [],
    ownershipType:            d.ownershipType            || undefined,
    supplierCost:             d.supplierCost             ?? undefined,
    supplierPaymentStatus:    d.supplierPaymentStatus    || undefined,
    supplierPaidAmount:       d.supplierPaidAmount       ?? undefined,
    supplierRemainingAmount:  d.supplierRemainingAmount  ?? undefined,
    supplierPaymentChannel:   d.supplierPaymentChannel   || undefined,
    serialStockInDates:       d.serialStockInDates       || {},
    serialStockInDatesManual: d.serialStockInDatesManual || {},
    serialSoldDates:          d.serialSoldDates          || {},
    serialInvoiceNumbers:     d.serialInvoiceNumbers     || {},
    createdAt: d.createdAt || '',
    updatedAt: d.updatedAt || '',
  };
}

function transformDocToDamaged(docSnap: any): DamagedProduct {
  const d = docSnap.data();
  return {
    id:            docSnap.id,
    productId:     d.productId     || '',
    brandName:     d.brandName     || '',
    modelName:     d.modelName     || '',
    serialNumber:  d.serialNumber  || '',
    location:      d.location      || '',
    reason:        d.reason        || '',
    damagedAt:     d.damagedAt     || '',
    damagedBy:     d.damagedBy     || '',
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
      snapshot.forEach(d => {
        const p = transformDocToProduct(d);
        if ((d.data() as any).isDeleted) return; // skip soft-deleted
        products.push(p);
      });
      console.log(`✅ Fetched ${products.length} products (soft-deleted excluded)`);
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
        if ((d.data() as any).isDeleted) return; // skip soft-deleted
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

  private static arraysEqual(a: string[], b: string[]) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  static async findDuplicateInventory(criteria: {
    brandName: string;
    modelName: string;
    costPrice: number;
    sellPrice: number;
    location: string;
    serialNumbers: string[];
  }, ignoreId?: string) {
    const products = await InventoryFirebaseService.fetchAllProducts();
    const incomingSerials = criteria.serialNumbers
      .map(s => s.trim())
      .filter(s => s !== '');

    if (incomingSerials.length > 0) {
      const duplicates = new Set<string>();
      for (const product of products) {
        if (product.id === ignoreId) continue;
        (product.serialNumbers || []).forEach(serial => {
          if (incomingSerials.includes(serial)) duplicates.add(serial);
        });
      }
      if (duplicates.size > 0) {
        return { type: 'serial', serials: Array.from(duplicates) } as const;
      }
    }

    const normalizedSerials = [...incomingSerials].sort();
    const exactMatch = products.find(product => {
      if (product.id === ignoreId) return false;
      if (
        product.brandName !== criteria.brandName ||
        product.modelName !== criteria.modelName ||
        product.costPrice !== criteria.costPrice ||
        product.sellPrice !== criteria.sellPrice ||
        product.location !== criteria.location
      ) return false;
      const existingSerials = (product.serialNumbers || []).map(s => s.trim()).filter(s => s !== '').sort();
      return InventoryFirebaseService.arraysEqual(existingSerials, normalizedSerials);
    });

    if (exactMatch) {
      return { type: 'product', existingProduct: exactMatch } as const;
    }

    return null;
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
      console.log('🔥 Creating product:', dto.brandName, dto.modelName, '| costPrice:', dto.costPrice, '| description:', dto.description);
      const now = new Date().toISOString();

      const serialStatus: { [key: string]: SerialStatus } = {};
      dto.serialNumbers.forEach(s => { serialStatus[s] = 'Available'; });

      // Seed per-serial cities from product's primary location if not individually set
      const serialCities = { ...dto.serialCities };
      if (dto.location) {
        dto.serialNumbers.forEach(s => {
          if (!serialCities[s]) serialCities[s] = dto.location!;
        });
      }

      // Seed stock-in date for every serial at entry time
      const now0 = new Date().toISOString();
      const serialStockInDates = { ...(dto.serialStockInDates || {}) };
      dto.serialNumbers.forEach(s => {
        if (!serialStockInDates[s]) serialStockInDates[s] = now0;
      });

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

      const duplicateCheck = await InventoryFirebaseService.findDuplicateInventory({
        brandName: dto.brandName,
        modelName: dto.modelName,
        costPrice: dto.costPrice ?? 0,
        sellPrice: dto.sellPrice,
        location: dto.location || '',
        serialNumbers: dto.serialNumbers || [],
      });

      if (duplicateCheck) {
        if (duplicateCheck.type === 'serial' && duplicateCheck.serials?.length > 0) {
          throw new Error(`Duplicate serial number${duplicateCheck.serials.length > 1 ? 's' : ''}: ${duplicateCheck.serials.join(', ')}`);
        }
        throw new Error('Duplicate inventory already exists with the same product, price, location and serial numbers.');
      }

      // FIX 3 — costPrice and description are explicitly included so they are
      // NEVER lost to stripUndefined or type mismatch.
      const data = stripUndefined({
        brandName:     dto.brandName,
        modelName:     dto.modelName,
        category:      dto.category,
        costPrice:     dto.costPrice ?? 0,   // FIX 3 — guaranteed non-undefined
        sellPrice:     dto.sellPrice,
        currency:      'AED',   // AED-first: marks this product as already-AED (no legacy PKR conversion on read)
        buyType:       dto.buyType,
        warrantyYears: dto.warrantyYears,
        stock:         dto.stock,
        location:      dto.location,
        serialNumbers: dto.serialNumbers,
        serialCities,
        serialStatus,
        serialStockInDates,
        serialStockInDatesManual: dto.serialStockInDatesManual || {},
        description:   dto.description ?? '', // FIX 1 — explicit, never dropped
        status:        dto.status,
        isDamaged:     dto.isDamaged,
        costingOption: dto.costingOption,
        imageUrls:     dto.imageUrls     || [],
        ownershipType:           dto.ownershipType,
        supplierCost:            dto.ownershipType === 'Credit' ? (dto.supplierCost ?? 0) : undefined,
        supplierPaymentStatus:   dto.ownershipType === 'Credit' ? (dto.supplierPaymentStatus || 'Unpaid') : undefined,
        supplierPaidAmount:      dto.supplierPaidAmount,
        supplierPaymentChannel:  dto.supplierPaymentChannel,
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
      // Re-throw duplicate errors with their original message intact so the
      // ViewModel can detect them and show the user a specific dialog.
      if (error instanceof Error && error.message.toLowerCase().includes('duplicate')) {
        throw error;
      }
      throw new Error('Failed to create product in Firestore');
    }
  }

  // FIX 2 — updateProduct now builds an EXPLICIT field map instead of
  // spreading the entire dto object. This prevents stray keys from
  // ProductFormData (currentStep, paidAmount, paymentMethod, brandId, modelId)
  // from leaking into the Firestore document, and ensures costPrice and
  // description are always written even when they are 0 or empty string.
  static async updateProduct(id: string, dto: UpdateProductDTO): Promise<Product> {
    try {
      console.log('🔥 Updating product:', id, '| costPrice:', dto.costPrice, '| description:', dto.description);
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

      // Build the update payload with ONLY fields that belong in the products
      // collection. This is the key fix — previously { ...dto } would spread
      // whatever object was passed in (often a ProductFormData), which has
      // extra keys that pollute Firestore and can cause silent type errors.
      const updateData: Record<string, any> = {
        updatedAt: now,
        // FIX 3 — costPrice explicitly mapped, guaranteed non-undefined
        costPrice: dto.costPrice ?? 0,
        // FIX 1 — description explicitly mapped, guaranteed non-null
        description: dto.description ?? '',
      };

      // Only include optional fields if they are present in the DTO
      if (dto.brandName     !== undefined) updateData.brandName     = dto.brandName;
      if (dto.modelName     !== undefined) updateData.modelName     = dto.modelName;
      if (dto.category      !== undefined) updateData.category      = dto.category;
      if (dto.sellPrice     !== undefined) updateData.sellPrice     = dto.sellPrice;
      if (dto.buyType       !== undefined) updateData.buyType       = dto.buyType;
      if (dto.warrantyYears !== undefined) updateData.warrantyYears = dto.warrantyYears;
      if (dto.stock         !== undefined) updateData.stock         = dto.stock;
      if (dto.location      !== undefined) updateData.location      = dto.location;
      if (dto.serialNumbers !== undefined) updateData.serialNumbers = dto.serialNumbers;
      if (dto.serialCities  !== undefined) updateData.serialCities  = dto.serialCities;
      if (dto.serialStatus  !== undefined) updateData.serialStatus  = dto.serialStatus;
      if (dto.status        !== undefined) updateData.status        = dto.status;
      if (dto.isDamaged     !== undefined) updateData.isDamaged     = dto.isDamaged;
      if (dto.costingOption !== undefined) updateData.costingOption = dto.costingOption;
      if (dto.imageUrls     !== undefined) updateData.imageUrls     = dto.imageUrls;
      if (dto.ownershipType           !== undefined) updateData.ownershipType           = dto.ownershipType;
      if (dto.supplierCost            !== undefined) updateData.supplierCost            = dto.supplierCost;
      if (dto.supplierPaymentStatus   !== undefined) updateData.supplierPaymentStatus   = dto.supplierPaymentStatus;
      if (dto.supplierPaidAmount      !== undefined) updateData.supplierPaidAmount      = dto.supplierPaidAmount;
      if (dto.supplierPaymentChannel  !== undefined) updateData.supplierPaymentChannel  = dto.supplierPaymentChannel;
      if (dto.serialStockInDates      !== undefined) updateData.serialStockInDates      = dto.serialStockInDates;
      if (dto.serialStockInDatesManual !== undefined) updateData.serialStockInDatesManual = dto.serialStockInDatesManual;
      if (dto.serialSoldDates         !== undefined) updateData.serialSoldDates         = dto.serialSoldDates;
      if (dto.serialInvoiceNumbers    !== undefined) updateData.serialInvoiceNumbers    = dto.serialInvoiceNumbers;

      // Merge costing flat fields if present
      Object.assign(updateData, costingFields);

      const ref = doc(db, PRODUCTS_COLLECTION, id);
      await updateDoc(ref, updateData);
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

  /**
   * Soft-delete: copies the product to `deleted_products` with deletedBy/deletedAt
   * metadata, then removes it from the live `products` collection.
   */
  static async deleteProduct(
    id: string,
    deletedBy: { uid: string; email: string; displayName?: string }
  ): Promise<void> {
    try {
      console.log(`🔥 Soft-deleting product ${id} by ${deletedBy.email}...`);
      const productRef  = doc(db, PRODUCTS_COLLECTION, id);
      const productSnap = await getDoc(productRef);
      if (!productSnap.exists()) throw new Error(`Product ${id} not found`);
      const now = new Date().toISOString();
      // Write archived copy to deleted_products collection
      await addDoc(collection(db, DELETED_PRODUCTS_COLLECTION), {
        ...productSnap.data(),
        originalId:     id,
        deletedAt:      now,
        deletedBy:      deletedBy.uid,
        deletedByEmail: deletedBy.email,
        deletedByName:  deletedBy.displayName || deletedBy.email,
      });
      // Mark original as deleted — NOT removed from Firebase, just hidden from live views
      await updateDoc(productRef, {
        isDeleted:  true,
        deletedAt:  now,
        deletedBy:  deletedBy.uid,
        deletedByEmail: deletedBy.email,
        deletedByName:  deletedBy.displayName || deletedBy.email,
        updatedAt:  now,
      });
      console.log(`✅ Product ${id} marked as deleted by ${deletedBy.email} — original preserved in Firebase`);
    } catch (error) {
      console.error(`❌ Error soft-deleting product ${id}:`, error);
      throw new Error('Failed to delete product');
    }
  }

  /**
   * Soft-delete a SINGLE serial from a product.
   *
   * Rationale: `deleteProduct` marks the whole document as deleted, which
   * cascades to every serial in the product's `serialNumbers` array.
   * `deleteSerial` instead surgically removes ONE serial from all the
   * per-serial maps, decrements `stock`, and archives a single-serial snapshot
   * to `deleted_products` so it can still be reviewed / restored.
   *
   * If the removed serial was the LAST one on the product, the whole
   * product is soft-deleted via the existing `deleteProduct` flow — no
   * empty stock records left behind.
   */
  static async deleteSerial(
    productId: string,
    serial: string,
    deletedBy: { uid: string; email: string; displayName?: string }
  ): Promise<void> {
    try {
      console.log(`🔥 Soft-deleting serial ${serial} of product ${productId} by ${deletedBy.email}...`);
      const productRef  = doc(db, PRODUCTS_COLLECTION, productId);
      const productSnap = await getDoc(productRef);
      if (!productSnap.exists()) throw new Error(`Product ${productId} not found`);
      const p = productSnap.data() as any;

      const existingSerials: string[] = Array.isArray(p.serialNumbers) ? p.serialNumbers : [];
      if (!existingSerials.includes(serial)) {
        // Serial isn't on the product's live array — it might have been sold
        // (which removes it from serialNumbers on invoice creation). In that
        // case there's nothing to remove from the live document; but we still
        // want an archive record so the deletion shows in Deleted Inventory.
        console.warn(`Serial ${serial} not present on product ${productId}. Archiving as reference only.`);
      }

      const now = new Date().toISOString();
      const remainingSerials = existingSerials.filter(s => s !== serial);

      // If this was the last live serial, fall back to whole-product delete —
      // no reason to keep an empty product document sitting around.
      if (existingSerials.includes(serial) && remainingSerials.length === 0) {
        console.log(`↪️  Last serial removed — delegating to deleteProduct for ${productId}`);
        await this.deleteProduct(productId, deletedBy);
        return;
      }

      // Build cleaned per-serial maps for the parent product (the ones we KEEP)
      const cleanedCities: Record<string, any>   = { ...(p.serialCities  || {}) }; delete cleanedCities[serial];
      const cleanedStatus: Record<string, any>   = { ...(p.serialStatus  || {}) }; delete cleanedStatus[serial];
      const cleanedStockIn: Record<string, any>  = { ...(p.serialStockInDates || {}) }; delete cleanedStockIn[serial];
      const cleanedManual: Record<string, any>   = { ...(p.serialStockInDatesManual || {}) }; delete cleanedManual[serial];
      const cleanedSold: Record<string, any>     = { ...(p.serialSoldDates || {}) }; delete cleanedSold[serial];
      const cleanedInvoice: Record<string, any>  = { ...(p.serialInvoiceNumbers || {}) }; delete cleanedInvoice[serial];

      // Snapshot for the deleted_products archive — only carries this serial.
      // `deletionScope: 'serial'` lets Deleted Inventory views distinguish
      // whole-product deletes from single-serial deletes.
      const archiveSnapshot = {
        ...p,
        originalId:    productId,
        serialNumbers: [serial],
        serialCities:  p.serialCities?.[serial]  ? { [serial]: p.serialCities[serial]  } : {},
        serialStatus:  p.serialStatus?.[serial]  ? { [serial]: p.serialStatus[serial]  } : {},
        serialStockInDates:       p.serialStockInDates?.[serial]       ? { [serial]: p.serialStockInDates[serial]       } : {},
        serialStockInDatesManual: p.serialStockInDatesManual?.[serial] ? { [serial]: p.serialStockInDatesManual[serial] } : {},
        serialSoldDates:          p.serialSoldDates?.[serial]          ? { [serial]: p.serialSoldDates[serial]          } : {},
        serialInvoiceNumbers:     p.serialInvoiceNumbers?.[serial]     ? { [serial]: p.serialInvoiceNumbers[serial]     } : {},
        stock:          1,
        deletionScope: 'serial' as const,
        deletedAt:      now,
        deletedBy:      deletedBy.uid,
        deletedByEmail: deletedBy.email,
        deletedByName:  deletedBy.displayName || deletedBy.email,
      };
      await addDoc(collection(db, DELETED_PRODUCTS_COLLECTION), archiveSnapshot);

      // Update the live product only if the serial was actually present.
      // (If it wasn't in serialNumbers — e.g. already sold — the parent doc
      // shouldn't be mutated; the archive record above is enough.)
      if (existingSerials.includes(serial)) {
        await updateDoc(productRef, {
          stock:                    remainingSerials.length,
          serialNumbers:            remainingSerials,
          serialCities:             cleanedCities,
          serialStatus:             cleanedStatus,
          serialStockInDates:       cleanedStockIn,
          serialStockInDatesManual: cleanedManual,
          serialSoldDates:          cleanedSold,
          serialInvoiceNumbers:     cleanedInvoice,
          updatedAt:                now,
        });
      }
      console.log(`✅ Serial ${serial} deleted — remaining stock: ${remainingSerials.length}`);
    } catch (error) {
      console.error(`❌ Error deleting serial ${serial} of ${productId}:`, error);
      throw new Error('Failed to delete serial');
    }
  }

  /**
   * Canonical write-point for invoice creation.
   *
   * When an invoice is created that sells one or more serials of a product, the
   * invoice-creation flow must record three things back onto the product doc so
   * the Inventory Report can show them correctly:
   *   1. `serialStatus[serial] = 'Sold'`      — marks the serial as sold
   *   2. `serialSoldDates[serial] = <ISO>`    — surfaces in the "Sold Date" column
   *   3. `serialInvoiceNumbers[serial] = <#>` — surfaces in the "Invoice #" column
   *
   * The serial STAYS in `serialNumbers` (so it still shows in the per-serial
   * report as "Sold"). If your existing invoice flow removes sold serials from
   * `serialNumbers`, that's why sold items previously disappeared from the
   * report — this method keeps them visible with a Sold badge.
   *
   * @param productId       The product's Firestore doc id
   * @param sales           One or more { serial, invoiceNumber, soldDate? } records
   * @param soldDate        Optional shared sold date (defaults to now). Individual
   *                        sales can override via their own `soldDate` field.
   */
  static async markSerialsSold(
    productId: string,
    sales: Array<{ serial: string; invoiceNumber: string; soldDate?: string }>,
    soldDate?: string,
  ): Promise<void> {
    if (!productId || !sales || sales.length === 0) return;
    try {
      const ref  = doc(db, PRODUCTS_COLLECTION, productId);
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error(`Product ${productId} not found`);
      const p = snap.data() as any;
      const now = new Date().toISOString();
      const fallbackDate = soldDate || now;

      const nextStatus:   Record<string, any> = { ...(p.serialStatus         || {}) };
      const nextSoldDate: Record<string, any> = { ...(p.serialSoldDates      || {}) };
      const nextInvoice:  Record<string, any> = { ...(p.serialInvoiceNumbers || {}) };

      for (const s of sales) {
        if (!s.serial) continue;
        nextStatus[s.serial]   = 'Sold';
        nextSoldDate[s.serial] = s.soldDate || fallbackDate;
        nextInvoice[s.serial]  = s.invoiceNumber || '';
      }

      await updateDoc(ref, {
        serialStatus:         nextStatus,
        serialSoldDates:      nextSoldDate,
        serialInvoiceNumbers: nextInvoice,
        updatedAt:            now,
      });
      console.log(`✅ Marked ${sales.length} serial(s) as Sold on product ${productId} — invoice numbers recorded`);
    } catch (error) {
      console.error(`❌ Error marking serials as sold on ${productId}:`, error);
      throw new Error('Failed to mark serials as sold');
    }
  }

  /** Fetch all soft-deleted products (for Deleted Inventory view) */
  static async fetchDeletedProducts(): Promise<DeletedProduct[]> {
    try {
      const q = query(
        collection(db, DELETED_PRODUCTS_COLLECTION),
        orderBy('deletedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const results: DeletedProduct[] = [];
      snapshot.forEach(d => {
        const data = d.data() as any;
        const fakeSnap = { id: data.originalId || d.id, data: () => data };
        results.push({
          ...transformDocToProduct(fakeSnap),
          deletedAt:      data.deletedAt      || '',
          deletedBy:      data.deletedBy      || '',
          deletedByEmail: data.deletedByEmail || '',
          deletedByName:  data.deletedByName  || '',
          originalId:     data.originalId     || d.id,
          _archiveId:     d.id,
        });
      });
      console.log(`✅ Fetched ${results.length} deleted products`);
      return results;
    } catch (error) {
      console.error('❌ Error fetching deleted products:', error);
      throw new Error('Failed to fetch deleted products');
    }
  }

  /**
   * Find the live (non-deleted) product that currently holds the given serial number.
   * Uses an array-contains query on `serialNumbers` — indexed, no full scan needed.
   */
  static async findProductBySerial(serial: string): Promise<Product | null> {
    try {
      const trimmed = serial.trim();
      if (!trimmed) return null;
      const q = query(collection(db, PRODUCTS_COLLECTION), where('serialNumbers', 'array-contains', trimmed));
      const snap = await getDocs(q);
      const match = snap.docs.find(d => !(d.data() as any).isDeleted);
      if (!match) return null;
      return transformDocToProduct(match);
    } catch (error) {
      console.error(`❌ Error finding product by serial ${serial}:`, error);
      throw new Error('Failed to search for serial number');
    }
  }

  /**
   * Return-to-stock flow (non-damaged return): keeps the same serial number,
   * marks it Available again with a fresh stock-in date, and — per business
   * rule — flips the product's ownership from Credit to Owned since a
   * returned unit is no longer tied to the original supplier credit terms.
   */
  static async returnSerialToStock(productId: string, serial: string): Promise<void> {
    try {
      const ref  = doc(db, PRODUCTS_COLLECTION, productId);
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error('Product not found');
      const d = snap.data() as any;
      const now = new Date().toISOString();

      const serialStatus: Record<string, string> = { ...(d.serialStatus || {}), [serial]: 'Available' };
      const serialStockInDates: Record<string, string> = { ...(d.serialStockInDates || {}), [serial]: now };
      const serialSoldDates: Record<string, string> = { ...(d.serialSoldDates || {}) };
      delete serialSoldDates[serial];

      const wasNotInStock = !(d.serialNumbers || []).includes(serial) || d.status === 'Sold';
      const serialNumbers: string[] = (d.serialNumbers || []).includes(serial)
        ? d.serialNumbers
        : [...(d.serialNumbers || []), serial];

      await updateDoc(ref, stripUndefined({
        serialNumbers,
        serialStatus,
        serialStockInDates,
        serialSoldDates,
        stock: wasNotInStock ? (d.stock || 0) + 1 : d.stock,
        ownershipType: d.ownershipType === 'Credit' ? 'Owned' : d.ownershipType,
        updatedAt: now,
      }));
      console.log(`✅ Serial ${serial} returned to stock on product ${productId}`);
    } catch (error) {
      console.error(`❌ Error returning serial ${serial}:`, error);
      throw new Error('Failed to return serial to stock');
    }
  }

  /**
   * Damaged-return flow: removes the serial entirely from the live product
   * and archives it in the `damaged_products` collection.
   */
  static async moveSerialToDamaged(
    productId: string,
    serial: string,
    damagedBy?: { uid: string; email: string },
    reason?: string
  ): Promise<void> {
    try {
      const ref  = doc(db, PRODUCTS_COLLECTION, productId);
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error('Product not found');
      const d = snap.data() as any;
      const now = new Date().toISOString();

      const serialNumbers: string[] = (d.serialNumbers || []).filter((s: string) => s !== serial);
      const serialStatus  = { ...(d.serialStatus || {}) };  delete serialStatus[serial];
      const serialCities  = { ...(d.serialCities || {}) };
      const location      = serialCities[serial] || d.location || '';
      delete serialCities[serial];
      const serialStockInDates = { ...(d.serialStockInDates || {}) }; delete serialStockInDates[serial];

      await addDoc(collection(db, DAMAGED_PRODUCTS_COLLECTION), stripUndefined({
        productId,
        brandName: d.brandName || '',
        modelName: d.modelName || '',
        serialNumber: serial,
        location,
        reason,
        damagedAt: now,
        damagedBy: damagedBy?.email || '',
      }));

      await updateDoc(ref, stripUndefined({
        serialNumbers,
        serialStatus,
        serialCities,
        serialStockInDates,
        stock: Math.max(0, (d.stock || 0) - 1),
        updatedAt: now,
      }));
      console.log(`✅ Serial ${serial} moved to damaged inventory from product ${productId}`);
    } catch (error) {
      console.error(`❌ Error moving serial ${serial} to damaged:`, error);
      throw new Error('Failed to move serial to damaged inventory');
    }
  }

  static async fetchDamagedProducts(): Promise<DamagedProduct[]> {
    try {
      const q = query(collection(db, DAMAGED_PRODUCTS_COLLECTION), orderBy('damagedAt', 'desc'));
      const snap = await getDocs(q);
      const results: DamagedProduct[] = [];
      snap.forEach(d => results.push(transformDocToDamaged(d)));
      return results;
    } catch (error) {
      console.error('❌ Error fetching damaged products:', error);
      throw new Error('Failed to fetch damaged inventory');
    }
  }

  /**
   * Flattens all live products into one row per serial number for the
   * Inventory Report. Falls back to the product's own status when a serial
   * has no explicit serialStatus entry.
   */
  static async fetchInventoryReportRows(): Promise<InventoryReportRow[]> {
    const products = await InventoryFirebaseService.fetchAllProducts();
    const rows: InventoryReportRow[] = [];
    for (const p of products) {
      const serials = p.serialNumbers && p.serialNumbers.length > 0 ? p.serialNumbers : [''];
      for (const serial of serials) {
        const serialStatus = serial ? p.serialStatus?.[serial] : undefined;
        rows.push({
          productId: p.id,
          brandName: p.brandName,
          modelName: p.modelName,
          serialNumber: serial,
          stockInDateAuto: (serial && p.serialStockInDates?.[serial]) || p.createdAt || '',
          stockInDateManual: serial ? p.serialStockInDatesManual?.[serial] : undefined,
          type: p.category || '',
          location: (serial && p.serialCities?.[serial]) || p.location || '',
          ownershipType: p.ownershipType || '',
          condition: p.status,
          currentStatus: serialStatus === 'Sold' ? 'Sold' : 'In Stock',
          soldDate: serial ? p.serialSoldDates?.[serial] : undefined,
          invoiceNumber: serial ? p.serialInvoiceNumbers?.[serial] : undefined,
          supplierCost: p.ownershipType === 'Credit' ? p.supplierCost : undefined,
          purchasingCost: p.ownershipType === 'Owned' ? p.costPrice : undefined,
          supplierPaymentStatus: p.ownershipType === 'Credit' ? p.supplierPaymentStatus : undefined,
          supplierPaidAmount: p.ownershipType === 'Credit' ? p.supplierPaidAmount : undefined,
          supplierRemainingAmount:
            p.ownershipType === 'Credit' && p.supplierCost !== undefined
              ? Math.max(0, (p.supplierCost || 0) - (p.supplierPaidAmount || 0))
              : undefined,
          supplierPaymentChannel: p.ownershipType === 'Credit' ? p.supplierPaymentChannel : undefined,
        });
      }
    }
    return rows;
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
        status:         'In Transit' as const,
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
      const ref = doc(db, TRANSFERS_COLLECTION, id);
      await updateDoc(ref, stripUndefined({ status, receivedAt, updatedAt: new Date().toISOString() }));
      console.log('✅ Transfer status updated:', id, status);

      // FIX: marking a transfer "Received" only updated the transfer record —
      // the product's own location/serialCities were never moved, so the
      // Inventory list kept showing the origin location forever. Sync them here.
      if (status === 'Received') {
        const t = (await getDoc(ref)).data() as any;
        if (t?.productId && t?.toLocation) {
          const productRef  = doc(db, PRODUCTS_COLLECTION, t.productId);
          const productSnap = await getDoc(productRef);
          if (productSnap.exists()) {
            const p = productSnap.data() as any;
            const serials: string[] = t.serialNumbers?.length ? t.serialNumbers : (p.serialNumbers || []);
            const serialCities = { ...(p.serialCities || {}) };
            serials.forEach(s => { serialCities[s] = t.toLocation; });

            // product.location is checked before serialCities on display, so
            // keep it in sync once every serial sits at the same location.
            const allCities = Object.values(serialCities).filter(Boolean);
            const allSame = allCities.length > 0 && allCities.every(c => c === t.toLocation);

            await updateDoc(productRef, stripUndefined({
              serialCities,
              location:  allSame ? t.toLocation : p.location,
              updatedAt: new Date().toISOString(),
            }));
            console.log(`✅ Product ${t.productId} moved to ${t.toLocation}`);
          }
        }
      }
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
  
  /**
   * Fetch models for a given brand name.
   * Looks up the brand by name first, then queries brandModels by brandId.
   * Returns [] gracefully if brand not found — no crash.
   */
  static async fetchModelsByBrandName(
    brandName: string
  ): Promise<Array<{ id: string; modelName: string; costPrice?: number; sellPrice?: number }>> {
    try {
      if (!brandName.trim()) return [];

      // 1. Find brand document by name
      const bq    = query(collection(db, BRANDS_COLLECTION), where('name', '==', brandName.trim()));
      const bSnap = await getDocs(bq);
      if (bSnap.empty) return [];

      const brandId = bSnap.docs[0].id;

      // 2. Fetch all models for that brandId from the flat brandModels collection
      const mq    = query(collection(db, MODELS_COLLECTION), where('brandId', '==', brandId));
      const mSnap = await getDocs(mq);

      const models: Array<{ id: string; modelName: string; costPrice?: number; sellPrice?: number }> = [];
      mSnap.forEach(d => {
        const data = d.data() as any;
        models.push({
          id:        d.id,
          modelName: data.name || '',
          costPrice: data.costPrice ?? undefined,
          sellPrice: data.sellPrice ?? undefined,
        });
      });

      models.sort((a, b) => a.modelName.localeCompare(b.modelName));
      console.log(`✅ fetchModelsByBrandName: ${models.length} models for "${brandName}"`);
      return models;
    } catch (error) {
      console.error(`❌ fetchModelsByBrandName error for "${brandName}":`, error);
      return []; // fail gracefully — don't crash the page
    }
  }

  static async generateTransactionId(): Promise<string> {
  const now      = new Date();
  const dd       = String(now.getDate()).padStart(2, '0');
  const mm       = String(now.getMonth() + 1).padStart(2, '0');
  const yy       = String(now.getFullYear()).slice(-2);
  const datePart = `${dd}${mm}${yy}`;                         // e.g. "220426"
 
  const counterRef = doc(db, 'counters', `inventory_txn_${datePart}`);
 
  const nextCount = await runTransaction(db, async (txn) => {
    const snap    = await txn.get(counterRef);
    const current = snap.exists() ? (snap.data().count as number) : 0;
    const next    = current + 1;
    txn.set(counterRef, { count: next, date: datePart }, { merge: true });
    return next;
  });
 
  const counter = String(nextCount).padStart(3, '0');          // "001", "002", ...
  return `TXN-${datePart}-${counter}`;                         // "TXN-220426-001"
}
 
}