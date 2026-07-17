// Inventory Module - ViewModel Layer
// useProductTransferCreateViewModel

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Product } from '../models/types';
import { InventoryFirebaseService, TransferFirebaseService } from '../models/InventoryFirebaseService';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';

export interface TransferLine {
  productId: string;
  selectedSerials: string[];
}

export interface UseProductTransferCreateViewModelReturn {
  products: Product[];
  locations: string[];
  formData: {
    transferDateTime: string;
    fromLocation: string;
    toLocation: string;
    transferredBy: string;
    note: string;
    shipmentCost: number;
  };
  costPerUnit: number;
  transferItems: TransferLine[];
  showSummary: boolean;
  isSubmitting: boolean;
  isLoading: boolean;
  validation: { isValid: boolean; error?: string };
  setFormField: (field: string, value: any) => void;
  addTransferItem: () => void;
  removeTransferItem: (index: number) => void;
  updateTransferItemProduct: (index: number, productId: string) => void;
  toggleSerial: (lineIndex: number, serial: string) => void;
  toggleSummary: () => void;
  handleSave: () => Promise<void>;
  onBack: () => void;
  getAvailableSerials: (productId?: string, location?: string) => string[];
  getProductStockByLocation: (productId: string, location: string) => number;
  getProductById: (productId: string) => Product | undefined;
  addNewLocation: (value: string) => Promise<string | null>;
}

const LOCATIONS = ['Dubai', 'Saudia', 'Chad', 'Sudan'];

function getSerialEffectiveLocation(product: Product, serial: string): string {
  return product.location || '';
}

function localDateTimeNow(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
    `T${pad(now.getHours())}:${pad(now.getMinutes())}`
  );
}

/**
 * Optional overrides for post-save and back behavior. When these callbacks are
 * provided, the VM calls them instead of navigating to `/product-transfer`
 * with react-router. That lets a parent that hosts this view inside a popup
 * keep the user in the popup (e.g. toggle back to a report tab) rather than
 * routing away.
 */
export interface UseProductTransferCreateViewModelOptions {
  onSaveSuccess?: () => void;
  onCancel?: () => void;
}

export function useProductTransferCreateViewModel(
  options?: UseProductTransferCreateViewModelOptions,
): UseProductTransferCreateViewModelReturn {
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<string[]>(LOCATIONS);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    transferDateTime: localDateTimeNow(),
    fromLocation: '',
    toLocation: '',
    transferredBy: '',
    note: '',
    shipmentCost: 0,
  });
  const [transferItems, setTransferItems] = useState<TransferLine[]>([
    { productId: '', selectedSerials: [] },
  ]);
  const [showSummary, setShowSummary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const fetched = await InventoryFirebaseService.fetchAllProducts();
        setProducts(fetched.filter(p => p.receivableStatus !== 'Pending'));
      } catch (err) {
        toast.error('Failed to load products');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

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
      } catch {
        setLocations(LOCATIONS.slice().sort());
      }
    })();
    return () => { mounted = false; };
  }, []);

  const saveLocationList = useCallback(async (newList: string[]) => {
    try {
      await setDoc(doc(db, 'appConfig', 'transferLocations'), { list: newList }, { merge: true });
    } catch (err) {
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

  const getProductById = useCallback(
    (id: string) => products.find(p => p.id === id),
    [products]
  );

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

  const setFormField = useCallback(
    (field: string, value: any) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      if (field === 'fromLocation') {
        setTransferItems(prev => prev.map(it => ({ ...it, selectedSerials: [] })));
      }
    },
    []
  );

  const addTransferItem = useCallback(
    () => setTransferItems(prev => [...prev, { productId: '', selectedSerials: [] }]),
    []
  );

  const removeTransferItem = useCallback((index: number) => {
    setTransferItems(prev => {
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : [{ productId: '', selectedSerials: [] }];
    });
  }, []);

  const updateTransferItemProduct = useCallback((index: number, productId: string) => {
    setTransferItems(prev => {
      const items = [...prev];
      items[index] = { productId, selectedSerials: [] };
      return items;
    });
  }, []);

  const toggleSerial = useCallback((lineIndex: number, serial: string) => {
    setTransferItems(prev => {
      const items = prev.map(it => ({ ...it, selectedSerials: [...it.selectedSerials] }));
      const current = items[lineIndex].selectedSerials;
      const idx = current.indexOf(serial);
      if (idx === -1) {
        items[lineIndex].selectedSerials = [...current, serial];
      } else {
        items[lineIndex].selectedSerials = current.filter(s => s !== serial);
      }
      return items;
    });
  }, []);

  const toggleSummary = useCallback(() => setShowSummary(p => !p), []);

  const totalUnits = useMemo(
    () => transferItems.reduce((sum, it) => sum + it.selectedSerials.length, 0),
    [transferItems]
  );

  const costPerUnit = useMemo(
    () => (formData.shipmentCost > 0 && totalUnits > 0
      ? formData.shipmentCost / totalUnits
      : 0),
    [formData.shipmentCost, totalUnits]
  );

  const validation = useMemo(() => {
    if (!formData.fromLocation)
      return { isValid: false, error: 'Select a From location' };
    if (!formData.toLocation)
      return { isValid: false, error: 'Select a To location' };
    if (formData.fromLocation === formData.toLocation)
      return { isValid: false, error: 'From and To locations must be different' };
    if (!formData.transferredBy.trim())
      return { isValid: false, error: 'Enter who is transferring' };
    if (!formData.transferDateTime)
      return { isValid: false, error: 'Select a transfer date and time' };
    for (const item of transferItems) {
      if (!item.productId)
        return { isValid: false, error: 'Select a product for each line' };
      if (item.selectedSerials.length === 0)
        return { isValid: false, error: 'Select at least one serial number per product' };
    }
    return { isValid: true };
  }, [formData, transferItems]);

  const handleSave = useCallback(async () => {
    if (!validation.isValid) { toast.error(validation.error || 'Fix errors first'); return; }
    setIsSubmitting(true);
    try {
      const isoDateTime = new Date(formData.transferDateTime).toISOString();
      // Build a summary of all items for PDF / modal multi-model display
      const transferItemsSummary = transferItems.map(item => {
        const product = getProductById(item.productId);
        return {
          productId:     item.productId,
          productName:   product ? `${product.brandName} ${product.modelName}` : item.productId,
          modelName:     product?.modelName || '',
          brandName:     product?.brandName || '',
          serialNumbers: item.selectedSerials,
          quantity:      item.selectedSerials.length,
        };
      });
      for (const item of transferItems) {
        const product = getProductById(item.productId);
        if (!product) continue;
        const transferredSerials = item.selectedSerials;
        const remainingSerials = (product.serialNumbers || []).filter(
          s => !transferredSerials.includes(s)
        );
        const newCities: Record<string, string> = {};
        remainingSerials.forEach(s => {
          newCities[s] = getSerialEffectiveLocation(product, s);
        });
        const updatedSerialStatus: Record<string, string> = { ...(product.serialStatus || {}) };
        transferredSerials.forEach(s => { updatedSerialStatus[s] = 'In Transit'; });
        await InventoryFirebaseService.updateProduct(product.id, {
          stock:         remainingSerials.length,
          serialNumbers: remainingSerials,
          serialCities:  newCities,
          serialStatus:  updatedSerialStatus,
        });
        await TransferFirebaseService.createTransfer({
          productId:     product.id,
          productName:   `${product.brandName} ${product.modelName}`,
          brandName:     product.brandName,
          modelName:     product.modelName,
          fromLocation:  formData.fromLocation,
          toLocation:    formData.toLocation,
          quantity:      transferredSerials.length,
          serialNumbers: transferredSerials,
          transferDate:  isoDateTime,
          transferredBy: formData.transferredBy,
          note:          formData.note,
          shipmentCost:  formData.shipmentCost,
          costPerUnit:   costPerUnit,
          transferItems: transferItemsSummary,
        });
      }
      toast.success(`Transfer created — products removed from ${formData.fromLocation} and are In Transit to ${formData.toLocation}`);
      // If the caller provided an onSaveSuccess override (popup context),
      // use it — the caller decides what to do next (e.g. toggle to report).
      // Fallback: legacy behavior of routing to the full transfer report page.
      if (options?.onSaveSuccess) {
        options.onSaveSuccess();
      } else {
        navigate('/product-transfer');
      }
    } catch (err) {
      console.error('Transfer failed:', err);
      toast.error('Failed to create transfer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [validation, transferItems, formData, getProductById, navigate, costPerUnit, options]);

  const onBack = useCallback(() => {
    // Same pattern for Back — if the popup wants to intercept (to toggle
    // back to its report tab), it does; otherwise fall back to routing.
    if (options?.onCancel) {
      options.onCancel();
    } else {
      navigate('/product-transfer');
    }
  }, [navigate, options]);

  return {
    products, locations, formData, transferItems,
    showSummary, isSubmitting, isLoading, validation,
    costPerUnit,
    setFormField, addTransferItem, removeTransferItem,
    updateTransferItemProduct, toggleSerial,
    toggleSummary, handleSave, onBack,
    getAvailableSerials, getProductStockByLocation, getProductById,
    addNewLocation,
  };
}