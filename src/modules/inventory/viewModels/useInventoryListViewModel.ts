// Inventory Module - ViewModel Layer
// useInventoryListViewModel - fetches products from Firestore by inventoryType

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Product, ProductFilters } from '../models/types';
import { InventoryService } from '../models/inventoryService';
import { InventoryDataConnectService } from '../../../api/dataconnect/inventoryDataConnectService';

interface InventoryContext {
  products: Product[];
  setProducts: (products: Product[]) => void;
  refreshProducts?: () => Promise<void>;
}

interface UseInventoryListViewModelReturn {
  products: Product[];
  allProducts: Product[];
  categories: string[];
  filters: ProductFilters;
  showFilters: boolean;
  activeFilterCount: number;
  viewProduct: Product | null;
  isLoading: boolean;
  stats: {
    totalProducts: number;
    totalStock: number;
    totalValue: number;
    newProducts: number;
    inTransit: number;
    available: number;
  };
  setFilter: (key: keyof ProductFilters, value: any) => void;
  clearFilters: () => void;
  toggleFilters: () => void;
  setViewProduct: (product: Product | null) => void;
  onAddNew: () => void;
  onAddToExisting: () => void;
  onTransfer: (id: string) => void;
  onReceiveProduct?: (id: string) => void;
}

export function useInventoryListViewModel(
  inventoryType: 'in-stock' | 'on-order' = 'in-stock'
): UseInventoryListViewModelReturn {
  const navigate = useNavigate();

  // Try outlet context first (layout may already have products)
  const outletContext = (useOutletContext<InventoryContext>()) || {};
  const { setProducts: setContextProducts } = outletContext;

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filters, setFilters] = useState<ProductFilters>({
    brandSearch: '',
    modelSearch: '',
    categoryFilter: '',
    statusFilter: '',
    buyTypeFilter: '',
    minPrice: null,
    maxPrice: null,
    hasStock: null,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);

  // Fetch products directly from Firestore by type
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const fetched = await InventoryDataConnectService.fetchProductsByType(inventoryType);
        setAllProducts(fetched);
        // Also update layout context if available
        if (setContextProducts) setContextProducts(fetched);
        console.log(`✅ Loaded ${fetched.length} ${inventoryType} products`);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [inventoryType]);

  const products = useMemo(() => {
    return InventoryService.filterProducts(allProducts, filters);
  }, [allProducts, filters]);

  const categories = useMemo(() => {
    return InventoryService.getUniqueCategories(allProducts);
  }, [allProducts]);

  const stats = useMemo(() => {
    return InventoryService.calculateProductStats(products);
  }, [products]);

  const activeFilterCount = useMemo(() => {
    return InventoryService.countActiveProductFilters(filters);
  }, [filters]);

  const setFilter = useCallback((key: keyof ProductFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      brandSearch: '',
      modelSearch: '',
      categoryFilter: '',
      statusFilter: '',
      buyTypeFilter: '',
      minPrice: null,
      maxPrice: null,
      hasStock: null,
    });
  }, []);

  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  const onAddNew = useCallback(() => {
    navigate('/inventory/create-new');
  }, [navigate]);

  const onAddToExisting = useCallback(() => {
    navigate('/inventory/add-existing');
  }, [navigate]);

  const onTransfer = useCallback((id: string) => {
    navigate(`/product-transfer?productId=${id}`);
  }, [navigate]);

  // Mark on-order product as received → moves to in-stock
  const onReceiveProduct = useCallback(async (id: string) => {
    const success = await InventoryDataConnectService.receiveProduct(id);
    if (success) {
      // Remove from current on-order list
      setAllProducts(prev => prev.filter(p => p.id !== id));
    }
  }, []);

  return {
    products,
    allProducts,
    categories,
    filters,
    showFilters,
    activeFilterCount,
    viewProduct,
    isLoading,
    stats: {
      totalProducts: stats.totalProducts,
      totalStock: stats.totalStock,
      totalValue: stats.totalValue,
      newProducts: stats.newProducts,
      inTransit: stats.inTransit,
      available: stats.available,
    },
    setFilter,
    clearFilters,
    toggleFilters,
    setViewProduct,
    onAddNew,
    onAddToExisting,
    onTransfer,
    onReceiveProduct: inventoryType === 'on-order' ? onReceiveProduct : undefined,
  };
}
