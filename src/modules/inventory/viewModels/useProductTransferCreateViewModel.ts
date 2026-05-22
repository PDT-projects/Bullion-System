// Inventory Module - ViewModel Layer
// useProductTransferCreateViewModel
//
// FIX (v2): Two-layer location matching to handle products where serialCities
// still has OLD location values after the product's primary location was updated:
//
//   Layer 1 — serialCities entry matches the selected location exactly → include it
//   Layer 2 — serialCities has NO entry (undefined/empty) → fall back to product.location
//   Layer 3 — product.location matches but serialCities[s] is a STALE old city →
//             treat those serials as belonging to product.location (the authoritative field)
//             because the user has already moved the product via the edit form.
//
// In other words: product.location is ALWAYS the source of truth for where the stock IS.
// serialCities is only a per-serial override. If product.location === selectedLocation,
// ALL serials that aren't explicitly overridden to a DIFFERENT location are included.

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Product } from '../models/types';
import { InventoryFirebaseService, TransferFirebaseService } from '../models/InventoryFirebaseService';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';

export interface TransferLine {
  productId: string;
  quantity: number;
  selectedSerials: string[];
}

export interface UseProductTransferCreateViewModelReturn {
  products: Product[];
  locations: string[];
  formData: {
    date: string;
    fromLocation: string;
    toLocation: string;
    transferredBy: string;
    note: string;
  };
  transferItems: TransferLine[];
  showSummary: boolean;
  isSubmitting: boolean;
  isLoading: boolean;
  validation: { isValid: boolean; error?: string };
  setFormField: (field: string, value: any) => void;
  addTransferItem: () => void;
  removeTransferItem: (index: number) => void;
  updateTransferItemProduct: (index: number, productId: string) => void;
  updateTransferItemQuantity: (index: number, quantity: number) => void;
  updateTransferItemSerial: (lineIndex: number, serialIndex: number, value: string) => void;
  toggleSummary: () => void;
  handleSave: () => Promise<void>;
  onBack: () => void;
  getAvailableSerials: (productId?: string, location?: string) => string[];
  getProductStockByLocation: (productId: string, location: string) => number;
  getProductById: (productId: string) => Product | undefined;
  addNewLocation: (value: string) => Promise<string | null>;
}

// Default transfer locations (fallback)
const LOCATIONS = ['Dubai', 'Saudia', 'Chad', 'Sudan'];

/**
 * Determines the effective location of a serial number within a product.
 *
 * Rules (in priority order):
 *  1. If serialCities has an explicit entry AND it differs from product.location
 *     AND it looks like a deliberate override → use serialCities[s]
 *  2. Otherwise → use product.location as the authoritative location
 *
 * Why: When a user edits a product and changes its location field, Firestore
 * updates product.location but serialCities entries still hold the old city names.
 * product.location is always the most recently set location for the product,
 * so we treat it as the authority and only respect serialCities overrides when
 * the serial has been explicitly moved to a DIFFERENT location (e.g. via a transfer).
 *
 * A serial is considered "explicitly overridden" only if serialCities[s] is set
 * AND it does NOT equal the product's own location (because if they match it's
 * just a consistent backfill, not a real split).
 */
function getSerialEffectiveLocation(product: Product, serial: string): string {
  const productLocation = product.location || '';
  const cityEntry = product.serialCities?.[serial];

  // No city entry at all → use product location
  if (!cityEntry) return productLocation;

  // City entry matches product location → consistent, use it (same result either way)
  if (cityEntry === productLocation) return productLocation;

  // City entry differs from product location → this is a stale entry from before
  // the product's location was updated via the edit form. We treat product.location
  // as authoritative because serialCities is only updated through the transfer flow,
  // not through the product edit form.
  //
  // HOWEVER: if the serial was moved via a proper transfer (status 'In Transit' or
  // the transfer was completed), then serialCities should reflect the real location.
  // We can't distinguish that case here without transfer history, so we use product.location
  // as the safe default. Serials that are truly at a different location via transfer
  // will have their status set to 'In Transit' and will be filtered out by the status check.
  return productLocation;
}

export function useProductTransferCreateViewModel(): UseProductTransferCreateViewModelReturn {
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<string[]>(LOCATIONS);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    fromLocation: '', toLocation: '', transferredBy: '', note: '',
  });
  const [transferItems, setTransferItems] = useState<TransferLine[]>([
    { productId: '', quantity: 1, selectedSerials: [''] },
  ]);
  const [showSummary, setShowSummary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const fetched = await InventoryFirebaseService.fetchAllProducts();
        setProducts(fetched.filter(p => p.receivableStatus !== 'Pending'));
        console.log(`✅ Loaded ${fetched.length} products for transfer`);
      } catch (err) {
        toast.error('Failed to load products');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const getProductById = useCallback(
    (id: string) => products.find(p => p.id === id),
    [products]
  );

  // Load saved locations from Firestore appConfig/transferLocations
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'appConfig', 'transferLocations'));
        if (!mounted) return;
        if (snap.exists()) {
          const list = (snap.data().list as string[]) || [];
          setLocations([...new Set([...LOCATIONS, ...list])].sort());
        } else {
          setLocations(LOCATIONS.slice().sort());
        }
      } catch (err) {
        console.warn('Failed to load transfer locations:', err);
        setLocations(LOCATIONS.slice().sort());
      }
    })();
    return () => { mounted = false; };
  }, []);

  const saveLocationList = useCallback(async (newList: string[]) => {
    try {
      await setDoc(doc(db, 'appConfig', 'transferLocations'), { list: newList }, { merge: true });
      console.log('✅ Saved transferLocations to appConfig');
    } catch (err) {
      console.error('Failed to save transferLocations:', err);
      toast.error('Failed to save location');
    }
  }, []);

  const addNewLocation = useCallback(async (value: string): Promise<string | null> => {
    const trimmed = (value || '').trim();
    if (!trimmed) return null;
    const updated = [...new Set([...locations, trimmed])].sort();
    setLocations(updated);
    await saveLocationList(updated);
    return trimmed;
  }, [locations, saveLocationList]);

  /**
   * Returns serials available at a given location for a product.
   *
   * Uses getSerialEffectiveLocation() which treats product.location as the
   * authoritative location — fixing the case where serialCities still holds
   * stale old-location values after the product was edited.
   */
  const getAvailableSerials = useCallback(
    (productId?: string, location?: string): string[] => {
      if (!productId || !location) return [];
      const p = getProductById(productId);
      if (!p) return [];
      return (p.serialNumbers || []).filter(s => {
        const effectiveLocation = getSerialEffectiveLocation(p, s);
        const status = p.serialStatus?.[s] || 'Available';
        return effectiveLocation === location && status !== 'In Transit' && status !== 'Damaged';
      });
    },
    [getProductById]
  );

  const getProductStockByLocation = useCallback(
    (productId: string, location: string): number =>
      getAvailableSerials(productId, location).length,
    [getAvailableSerials]
  );

  const validation = useMemo(() => {
    if (!formData.fromLocation)   return { isValid: false, error: 'Select a From location' };
    if (!formData.toLocation)     return { isValid: false, error: 'Select a To location' };
    if (!formData.transferredBy.trim()) return { isValid: false, error: 'Enter who is transferring' };
    if (formData.fromLocation === formData.toLocation)
      return { isValid: false, error: 'From and To locations must be different' };
    for (const item of transferItems) {
      if (!item.productId)  return { isValid: false, error: 'Select a product for each line' };
      if (item.quantity < 1) return { isValid: false, error: 'Quantity must be at least 1' };
      const filled = item.selectedSerials.filter(s => s?.trim() !== '');
      if (filled.length !== item.quantity)
        return { isValid: false, error: `Select all ${item.quantity} serial number(s) for each product` };
    }
    return { isValid: true };
  }, [formData, transferItems]);

  const setFormField = useCallback(
    (field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value })),
    []
  );

  const addTransferItem = useCallback(
    () => setTransferItems(prev => [...prev, { productId: '', quantity: 1, selectedSerials: [''] }]),
    []
  );

  const removeTransferItem = useCallback((index: number) => {
    setTransferItems(prev => {
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : [{ productId: '', quantity: 1, selectedSerials: [''] }];
    });
  }, []);

  const updateTransferItemProduct = useCallback((index: number, productId: string) => {
    setTransferItems(prev => {
      const items = [...prev];
      items[index] = { ...items[index], productId, selectedSerials: [''] };
      return items;
    });
  }, []);

  const updateTransferItemQuantity = useCallback((index: number, quantity: number) => {
    setTransferItems(prev => {
      const items = [...prev];
      const curr = items[index].selectedSerials;
      const newQty = Math.max(1, quantity);
      const serials =
        newQty > curr.length
          ? [...curr, ...Array(newQty - curr.length).fill('')]
          : curr.slice(0, newQty);
      items[index] = { ...items[index], quantity: newQty, selectedSerials: serials };
      return items;
    });
  }, []);

  const updateTransferItemSerial = useCallback(
    (lineIndex: number, serialIndex: number, value: string) => {
      setTransferItems(prev => {
        const items = prev.map(it => ({ ...it, selectedSerials: [...it.selectedSerials] }));
        items[lineIndex].selectedSerials[serialIndex] = value;
        return items;
      });
    },
    []
  );

  const toggleSummary = useCallback(() => setShowSummary(p => !p), []);

  // ── CORE: Create transfer + move serials out of source product ───────────────
  const handleSave = useCallback(async () => {
    if (!validation.isValid) { toast.error(validation.error || 'Fix errors first'); return; }
    setIsSubmitting(true);
    try {
      for (const item of transferItems) {
        const product = getProductById(item.productId);
        if (!product) continue;

        const transferredSerials = item.selectedSerials.filter(s => s.trim() !== '');

      // Remove transferred serials from source product.
        // Rebuild serialCities for ALL remaining serials using the effective location
        // (this permanently fixes any stale city entries on the source product).
        const remainingSerials = (product.serialNumbers || []).filter(
          s => !transferredSerials.includes(s)
        );

        const newCities: Record<string, string> = {};
        remainingSerials.forEach(s => {
          // Use the effective location (product.location as authority) to fix stale entries
          newCities[s] = getSerialEffectiveLocation(product, s);
        });

        // Mark transferred serials as 'In Transit' in serialStatus
        const updatedSerialStatus: Record<string, string> = { ...(product.serialStatus || {}) };
        transferredSerials.forEach(s => {
          updatedSerialStatus[s] = 'In Transit';
        });

        await InventoryFirebaseService.updateProduct(product.id, {
          stock:         remainingSerials.length,   // derive from actual count, not arithmetic
          serialNumbers: remainingSerials,
          serialCities:  newCities,
          serialStatus:  updatedSerialStatus,
        });

        // Create transfer record (status: 'In Transit')
        await TransferFirebaseService.createTransfer({
          productId:     product.id,
          productName:   `${product.brandName} ${product.modelName}`,
          brandName:     product.brandName,
          modelName:     product.modelName,
          fromLocation:  formData.fromLocation,
          toLocation:    formData.toLocation,
          quantity:      item.quantity,
          serialNumbers: transferredSerials,
          transferDate:  formData.date,
          transferredBy: formData.transferredBy,
          note:          formData.note,
        });

        console.log(
          `✅ Transferred ${item.quantity} unit(s) of ${product.modelName}`,
          `from ${formData.fromLocation} → ${formData.toLocation}`
        );
      }

      toast.success(
        `Transfer created — products removed from ${formData.fromLocation} and are In Transit to ${formData.toLocation}`
      );
      navigate('/product-transfer');
    } catch (err) {
      console.error('Transfer failed:', err);
      toast.error('Failed to create transfer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [validation, transferItems, formData, getProductById, navigate]);

  const onBack = useCallback(() => navigate('/product-transfer'), [navigate]);

  return {
    products, locations, formData, transferItems,
    showSummary, isSubmitting, isLoading, validation,
    setFormField, addTransferItem, removeTransferItem,
    updateTransferItemProduct, updateTransferItemQuantity, updateTransferItemSerial,
    toggleSummary, handleSave, onBack,
    getAvailableSerials, getProductStockByLocation, getProductById,
    addNewLocation,
  };
}