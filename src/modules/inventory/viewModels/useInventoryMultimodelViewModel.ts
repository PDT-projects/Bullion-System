// Inventory Module - ViewModel Layer
// useInventoryMultiModelViewModel
// "Without Costing" path: select a brand, add multiple models at once.
// Each model has: modelName, costPrice, sellPrice, category, qty, status,
//                stockingLocation, dealerPrice, description, serialNumbers.
// On Next → packages all models into URL params → payment step.

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { InventoryEntryType, INVENTORY_LOCATIONS } from '../models/types';
import { BrandModelFirebaseService } from '../models/InventoryFirebaseService';
import { uploadInventoryImages } from '../models/InventoryFirebaseService';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';

export const KNOWN_BRANDS = [
  'AKAAS DETECTORS', 'Andralian', 'Black Dog Xtreme', 'Bounty Hunter VLF',
  'China', 'DHFHJ', 'Detector', 'Detek', 'EKibi', 'Fisher', 'GEO',
  'GROGROUND', 'GOLD XTRA', 'GTR TURKEY', 'Garrett', 'Gold Star',
  'Gold Stinger X5', 'Hira Dedector', 'JOKER', 'Lorenz', 'Minelab',
  'Multimax', 'Nokta', 'Nokta Makro', 'OKM', 'OKM EXP 6000 PROFESSIONAL PLUS',
  'PMX', 'Practice', 'Quest', 'Reaper 2', 'Super Wand', 'Teknetics',
  'WHITES', 'X5 ID Maxx', 'XP',
];

export const CATEGORIES = [
  'Detection Equipment', 'Security Equipment', 'Imaging Equipment',
  'Surveillance Systems', 'Access Control', 'Other',
];

export const STOCKING_LOCATIONS = [...INVENTORY_LOCATIONS];

export const STATUSES = ['New', 'Used', 'Returned'];

export interface MultiModelEntry {
  id: string;
  modelName: string;
  costPrice: number;
  sellPrice: number;
  category: string;
  stockQty: number;
  status: string;
  stockingLocation: string;
  dealerPrice: number;
  description: string;
  serialNumbers: string[];      // filled one per unit
  serialCities: { [s: string]: string };
  images: File[];               // optional product images (not yet uploaded)
  imageUrls: string[];          // uploaded URLs (filled after save)
}

export interface BrandOption {
  id: string;
  name: string;
}

export interface ModelOption {
  id: string;
  modelName: string;
  costPrice?: number;
  sellPrice?: number;
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyEntry(): MultiModelEntry {
  return {
    id: makeId(),
    modelName: '',
    costPrice: 0,
    sellPrice: 0,
    category: '',
    stockQty: 1,
    status: 'New',
    stockingLocation: '',
    dealerPrice: 0,
    description: '',
    serialNumbers: [''],
    serialCities: {},
    images: [],
    imageUrls: [],
  };
}

export interface UseInventoryMultiModelViewModelReturn {
  inventoryType: InventoryEntryType;
  // Brand
  selectedBrandId: string;
  selectedBrandName: string;
  setBrand: (id: string, name: string) => void;
  brands: BrandOption[];
  brandsLoading: boolean;
  // model dropdown per row
  modelOptions: ModelOption[];
  modelOptionsLoading: boolean;
  // entries
  entries: MultiModelEntry[];
  addEntry: () => void;
  removeEntry: (id: string) => void;
  updateEntry: (id: string, patch: Partial<MultiModelEntry>) => void;
  // serial helpers per entry
  setEntrySerial: (entryId: string, idx: number, value: string) => void;
  setEntrySerialCity: (entryId: string, idx: number, city: string) => void;
  setEntryImages: (entryId: string, files: File[]) => void;
  removeEntryImage: (entryId: string, index: number) => void;
  // totals
  grandTotalCost: number;
  grandTotalUnits: number;
  // validation
  validationErrors: { [key: string]: string };
  isValid: boolean;
  // navigation
  handleNext: () => void;
  handleBack: () => void;
  isSaving: boolean;
  formatCurrency: (n: number) => string;
}

export function useInventoryMultiModelViewModel(): UseInventoryMultiModelViewModelReturn {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inventoryType = (searchParams.get('type') as InventoryEntryType) || 'payment';

  // ── Brand list ────────────────────────────────────────────────────────────
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'brands'), orderBy('name')));
        const fromDb: BrandOption[] = snap.docs.map(d => ({ id: d.id, name: (d.data() as any).name || d.id }));
        // Merge with KNOWN_BRANDS (de-dup by name)
        const allNames = new Set(fromDb.map(b => b.name.toLowerCase()));
        const extras = KNOWN_BRANDS
          .filter(n => !allNames.has(n.toLowerCase()))
          .map(n => ({ id: n, name: n }));
        setBrands([...fromDb, ...extras].sort((a, b) => a.name.localeCompare(b.name)));
      } catch {
        setBrands(KNOWN_BRANDS.map(n => ({ id: n, name: n })));
      } finally {
        setBrandsLoading(false);
      }
    };
    load();
  }, []);

  // ── Selected brand ────────────────────────────────────────────────────────
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [selectedBrandName, setSelectedBrandName] = useState('');

  // ── Model options for selected brand ─────────────────────────────────────
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  const [modelOptionsLoading, setModelOptionsLoading] = useState(false);

  useEffect(() => {
    if (!selectedBrandName.trim()) { setModelOptions([]); return; }
    let cancelled = false;
    setModelOptionsLoading(true);
    BrandModelFirebaseService.fetchModelsByBrandName(selectedBrandName)
      .then(models => { if (!cancelled) setModelOptions(models); })
      .catch(() => { if (!cancelled) setModelOptions([]); })
      .finally(() => { if (!cancelled) setModelOptionsLoading(false); });
    return () => { cancelled = true; };
  }, [selectedBrandName]);

  const setBrand = useCallback((id: string, name: string) => {
    setSelectedBrandId(id);
    setSelectedBrandName(name);
  }, []);

  // ── Multi-model entries ───────────────────────────────────────────────────
  const [entries, setEntries] = useState<MultiModelEntry[]>([emptyEntry()]);

  const addEntry = useCallback(() => {
    setEntries(prev => [...prev, emptyEntry()]);
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries(prev => prev.length > 1 ? prev.filter(e => e.id !== id) : prev);
  }, []);

  const updateEntry = useCallback((id: string, patch: Partial<MultiModelEntry>) => {
    setEntries(prev => prev.map(e => {
      if (e.id !== id) return e;
      const updated = { ...e, ...patch };
      // Resize serialNumbers array when stockQty changes
      if ('stockQty' in patch) {
        const qty = Math.max(1, patch.stockQty ?? 1);
        const serials = [...updated.serialNumbers];
        while (serials.length < qty) serials.push('');
        serials.length = qty;
        updated.serialNumbers = serials;
        updated.stockQty = qty;
      }
      return updated;
    }));
  }, []);

  const setEntrySerial = useCallback((entryId: string, idx: number, value: string) => {
    setEntries(prev => prev.map(e => {
      if (e.id !== entryId) return e;
      const serials = [...e.serialNumbers];
      const old = serials[idx];
      serials[idx] = value;
      const cities = { ...e.serialCities };
      if (old && cities[old]) {
        const city = cities[old];
        delete cities[old];
        if (value) cities[value] = city;
      }
      return { ...e, serialNumbers: serials, serialCities: cities };
    }));
  }, []);

  const setEntrySerialCity = useCallback((entryId: string, idx: number, city: string) => {
    setEntries(prev => prev.map(e => {
      if (e.id !== entryId) return e;
      const serial = e.serialNumbers[idx];
      if (!serial) return e;
      return { ...e, serialCities: { ...e.serialCities, [serial]: city } };
    }));
  }, []);

  const setEntryImages = useCallback((entryId: string, files: File[]) => {
    setEntries(prev => prev.map(e =>
      e.id !== entryId ? e : { ...e, images: [...e.images, ...files] }
    ));
  }, []);

  const removeEntryImage = useCallback((entryId: string, index: number) => {
    setEntries(prev => prev.map(e => {
      if (e.id !== entryId) return e;
      const images = e.images.filter((_, i) => i !== index);
      return { ...e, images };
    }));
  }, []);

  // ── Totals ────────────────────────────────────────────────────────────────
  const grandTotalCost = useMemo(
    () => entries.reduce((s, e) => s + e.costPrice * e.stockQty, 0),
    [entries]
  );
  const grandTotalUnits = useMemo(
    () => entries.reduce((s, e) => s + e.stockQty, 0),
    [entries]
  );

  // ── Validation ────────────────────────────────────────────────────────────
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const isValid = useMemo(() => {
    if (!selectedBrandName.trim()) return false;
    return entries.every(e =>
      e.modelName.trim() !== '' &&
      e.costPrice > 0 &&
      e.sellPrice > 0 &&
      e.category.trim() !== '' &&
      e.stockQty > 0 &&
      e.stockingLocation.trim() !== ''
    );
  }, [selectedBrandName, entries]);

  const validateForm = useCallback((): boolean => {
    const errors: { [key: string]: string } = {};
    if (!selectedBrandName.trim()) errors.brand = 'Please select a brand';
    entries.forEach((e, i) => {
      if (!e.modelName.trim()) errors[`model_${i}`] = `Row ${i + 1}: model name required`;
      if (e.costPrice <= 0)    errors[`cost_${i}`]  = `Row ${i + 1}: cost price required`;
      if (e.sellPrice <= 0)    errors[`sell_${i}`]  = `Row ${i + 1}: sell price required`;
      if (!e.category.trim())  errors[`cat_${i}`]   = `Row ${i + 1}: category required`;
      if (e.stockQty <= 0)     errors[`qty_${i}`]   = `Row ${i + 1}: quantity must be > 0`;
      if (!e.stockingLocation) errors[`loc_${i}`]   = `Row ${i + 1}: stocking location required`;
    });
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [selectedBrandName, entries]);

  // ── isSaving ──────────────────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false);

  // ── handleNext → go to payment ────────────────────────────────────────────
  const handleNext = useCallback(async () => {
    if (!validateForm()) {
      toast.error('Please fix the highlighted errors before continuing.');
      return;
    }
    setIsSaving(true);
    try {
      // Optionally persist new models to Firestore so they appear in future dropdowns
      try {
        await BrandModelFirebaseService.saveCostingBrandAndModels(
          selectedBrandName,
          entries.map(e => ({ modelName: e.modelName, costPrice: e.costPrice }))
        );
      } catch {
        // non-blocking — proceed even if save fails
      }

      // Upload images for each entry (optional — entries with no images are skipped)
      const imageUrlsMap: Record<string, string[]> = {};
      for (const e of entries) {
        if (e.images.length > 0) {
          const productKey = `${selectedBrandName}-${e.modelName}-${Date.now()}`.replace(/\s+/g, '_');
          imageUrlsMap[e.id] = await uploadInventoryImages(e.images, productKey);
        } else {
          imageUrlsMap[e.id] = [];
        }
      }

      const params = new URLSearchParams({
        type:             inventoryType,
        costing:          'without',
        brandName:        selectedBrandName,
        brandId:          selectedBrandId,
        multiModels:      JSON.stringify(entries.map(e => ({
          modelName:       e.modelName,
          costPrice:       e.costPrice,
          salePrice:       e.sellPrice,
          quantity:        e.stockQty,
          category:        e.category,
          status:          e.status,
          location:        e.stockingLocation,
          dealerPrice:     e.dealerPrice,
          description:     e.description,
          serialNumbers:   e.serialNumbers.filter(s => s.trim() !== ''),
          serialCities:    e.serialCities,
          imageUrls:       imageUrlsMap[e.id] ?? [],
        }))),
        grandTotalCost:   grandTotalCost.toString(),
        grandTotalUnits:  grandTotalUnits.toString(),
      });

      navigate(`/inventory/create-new/payment?${params.toString()}`);
    } catch (err) {
      toast.error('Failed to prepare data. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [validateForm, selectedBrandName, selectedBrandId, entries, grandTotalCost, grandTotalUnits, inventoryType, navigate]);

  const handleBack = useCallback(() => {
    navigate(`/inventory/create-new/costing?type=${inventoryType}`);
  }, [navigate, inventoryType]);

  const formatCurrency = useCallback((n: number) =>
    new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      currencyDisplay: 'code',      // renders "PKR" instead of the locale symbol "Rs"
      minimumFractionDigits: 0,
    }).format(n)
  , []);

  return {
    inventoryType,
    selectedBrandId, selectedBrandName, setBrand,
    brands, brandsLoading,
    modelOptions, modelOptionsLoading,
    entries, addEntry, removeEntry, updateEntry,
    setEntrySerial, setEntrySerialCity,
    setEntryImages, removeEntryImage,
    grandTotalCost, grandTotalUnits,
    validationErrors, isValid,
    handleNext, handleBack,
    isSaving, formatCurrency,
  };
}