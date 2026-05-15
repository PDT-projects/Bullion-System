// Inventory Module - ViewModel Layer
// useProductTransferCreateViewModel
//
// TRANSFER LOGIC:
// On CREATE:
//   1. Remove transferred serials from the source product's serialNumbers/serialCities
//   2. Decrement source product stock by quantity
//   3. Create transfer record with status 'In Transit'
//
// On MARK RECEIVED (in list view):
//   1. Find same product (by brandName+modelName) at destination OR update same product doc
//   2. Add serials to that product's serialNumbers, set serialCities to toLocation
//   3. Increment stock
//   4. Set transfer status 'Received'

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

  // locations state is loaded from Firestore (appConfig/transferLocations) on mount


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

  // Serials that belong to a specific location
  const getAvailableSerials = useCallback(
    (productId?: string, location?: string): string[] => {
      if (!productId || !location) return [];
      const p = getProductById(productId);
      if (!p) return [];
      return (p.serialNumbers || []).filter(s => {
        const city = p.serialCities?.[s];
        const status = p.serialStatus?.[s] || 'Available';
        return city === location && status !== 'In Transit' && status !== 'Damaged';
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

        // 1. Remove transferred serials from source product
        const remainingSerials = (product.serialNumbers || []).filter(
          s => !transferredSerials.includes(s)
        );
        const newCities = { ...product.serialCities };
        transferredSerials.forEach(s => delete newCities[s]);

        await InventoryFirebaseService.updateProduct(product.id, {
          stock:         Math.max(0, product.stock - item.quantity),
          serialNumbers: remainingSerials,
          serialCities:  newCities,
        });

        // 2. Create transfer record (status: 'In Transit')
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