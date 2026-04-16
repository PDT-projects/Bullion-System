// Inventory Module - ViewModel Layer
// useInventoryAddExistingViewModel
// Fetches all existing products from Firestore, groups by brand,
// lets user pick a product and add quantity + serial numbers to it.

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Product } from '../models/types';
import { InventoryFirebaseService } from '../models/InventoryFirebaseService';

export interface AddStockEntry {
  productId: string;
  brandName: string;
  modelName: string;
  currentStock: number;
  addQty: number;
  newSerials: string[];
  newSerialCities: { [serial: string]: string };
  newSellPrice: number;
  newCostPrice: number;
}

export interface UseInventoryAddExistingViewModelReturn {
  // All products grouped
  products: Product[];
  isLoading: boolean;
  error: string | null;
  // Search / filter
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  filteredProducts: Product[];
  // Selected product to edit
  selectedProduct: Product | null;
  selectProduct: (p: Product) => void;
  clearSelection: () => void;
  // Edit state
  entry: AddStockEntry | null;
  setAddQty: (qty: number) => void;
  setNewSerial: (idx: number, value: string) => void;
  setNewSerialCity: (idx: number, city: string) => void;
  setNewSellPrice: (v: number) => void;
  setNewCostPrice: (v: number) => void;
  // Actions
  handleSave: () => Promise<void>;
  isSaving: boolean;
  // Helpers
  cities: string[];
  formatCurrency: (n: number) => string;
}

const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Bullion RND/SITE', 'Asif'];

export function useInventoryAddExistingViewModel(): UseInventoryAddExistingViewModelReturn {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [entry, setEntry] = useState<AddStockEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch all products on mount
  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await InventoryFirebaseService.fetchAllProducts();
        // Only show in-stock (not pending on-order)
        setProducts(data.filter(p => p.receivableStatus !== 'Pending'));
        console.log(`✅ Loaded ${data.length} products for add-existing`);
      } catch (err) {
        setError('Failed to load products');
        toast.error('Failed to load products from Firestore');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    const t = searchTerm.toLowerCase();
    return products.filter(p =>
      p.brandName.toLowerCase().includes(t) ||
      p.modelName.toLowerCase().includes(t) ||
      p.category.toLowerCase().includes(t)
    );
  }, [products, searchTerm]);

  const selectProduct = useCallback((p: Product) => {
    setSelectedProduct(p);
    setEntry({
      productId:      p.id,
      brandName:      p.brandName,
      modelName:      p.modelName,
      currentStock:   p.stock,
      addQty:         1,
      newSerials:     [''],
      newSerialCities:{},
      newSellPrice:   p.sellPrice,
      newCostPrice:   p.costPrice,
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedProduct(null);
    setEntry(null);
  }, []);

  // Resize newSerials array when qty changes
  const setAddQty = useCallback((qty: number) => {
    const newQty = Math.max(1, qty);
    setEntry(prev => {
      if (!prev) return prev;
      const serials = [...prev.newSerials];
      if (newQty > serials.length) {
        while (serials.length < newQty) serials.push('');
      } else {
        serials.splice(newQty);
      }
      return { ...prev, addQty: newQty, newSerials: serials };
    });
  }, []);

  const setNewSerial = useCallback((idx: number, value: string) => {
    setEntry(prev => {
      if (!prev) return prev;
      const serials = [...prev.newSerials];
      const old = serials[idx];
      serials[idx] = value;
      const cities = { ...prev.newSerialCities };
      if (old && cities[old]) {
        const city = cities[old];
        delete cities[old];
        if (value) cities[value] = city;
      }
      return { ...prev, newSerials: serials, newSerialCities: cities };
    });
  }, []);

  const setNewSerialCity = useCallback((idx: number, city: string) => {
    setEntry(prev => {
      if (!prev) return prev;
      const serial = prev.newSerials[idx];
      if (!serial) return prev;
      return { ...prev, newSerialCities: { ...prev.newSerialCities, [serial]: city } };
    });
  }, []);

  const setNewSellPrice = useCallback((v: number) => {
    setEntry(prev => prev ? { ...prev, newSellPrice: v } : prev);
  }, []);

  const setNewCostPrice = useCallback((v: number) => {
    setEntry(prev => prev ? { ...prev, newCostPrice: v } : prev);
  }, []);

  const handleSave = useCallback(async () => {
    if (!entry || !selectedProduct) return;

    // Validate serials
    const validSerials = entry.newSerials.filter(s => s.trim() !== '');
    if (validSerials.length !== entry.addQty) {
      toast.error(`Please provide ${entry.addQty} serial number${entry.addQty > 1 ? 's' : ''}`);
      return;
    }

    // Check for duplicate serials (against existing ones)
    const existing = selectedProduct.serialNumbers || [];
    const dupes = validSerials.filter(s => existing.includes(s));
    if (dupes.length > 0) {
      toast.error(`Duplicate serial${dupes.length > 1 ? 's' : ''}: ${dupes.join(', ')}`);
      return;
    }

    setIsSaving(true);
    try {
      const mergedSerials = [...existing, ...validSerials];
      const mergedCities  = { ...selectedProduct.serialCities, ...entry.newSerialCities };

      await InventoryFirebaseService.updateProduct(entry.productId, {
        stock:         selectedProduct.stock + entry.addQty,
        serialNumbers: mergedSerials,
        serialCities:  mergedCities,
        sellPrice:     entry.newSellPrice,
        costPrice:     entry.newCostPrice,
      });

      toast.success(`Added ${entry.addQty} unit${entry.addQty > 1 ? 's' : ''} to ${entry.modelName}`);
      navigate('/inventory/view');
    } catch (err) {
      toast.error('Failed to update product');
    } finally {
      setIsSaving(false);
    }
  }, [entry, selectedProduct, navigate]);

  const formatCurrency = useCallback((n: number) =>
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(n)
  , []);

  return {
    products, isLoading, error,
    searchTerm, setSearchTerm, filteredProducts,
    selectedProduct, selectProduct, clearSelection,
    entry, setAddQty, setNewSerial, setNewSerialCity, setNewSellPrice, setNewCostPrice,
    handleSave, isSaving,
    cities: CITIES, formatCurrency,
  };
}