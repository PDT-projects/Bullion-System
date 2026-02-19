// Inventory Module - ViewModel Layer
// useInventoryListViewModel - Business logic for inventory list page

import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Product, ProductFilters } from '../models/types';
import { InventoryService } from '../models/inventoryService';

/**
 * Context type from InventoryLayout
 */
interface InventoryContext {
  products: Product[];
  setProducts: (products: Product[]) => void;
}

/**
 * Return type for useInventoryListViewModel
 */
interface UseInventoryListViewModelReturn {
  // Data
  products: Product[];
  allProducts: Product[];
  categories: string[];
  
  // Filter State
  filters: ProductFilters;
  showFilters: boolean;
  activeFilterCount: number;
  
  // View Modal State
  viewProduct: Product | null;
  
  // Stats
  stats: {
    totalProducts: number;
    totalStock: number;
    totalValue: number;
    newProducts: number;
    inTransit: number;
    available: number;
  };
  
  // Actions
  setFilter: (key: keyof ProductFilters, value: any) => void;
  clearFilters: () => void;
  toggleFilters: () => void;
  setViewProduct: (product: Product | null) => void;
  onAddNew: () => void;
  onAddToExisting: () => void;
  onTransfer: (id: string) => void;
}

/**
 * ViewModel hook for Inventory List page
 */
export function useInventoryListViewModel(): UseInventoryListViewModelReturn {
  const navigate = useNavigate();
  const { products: allProducts, setProducts } = useOutletContext<InventoryContext>();

  // ==================== STATE ====================
  
  const [filters, setFilters] = useState<ProductFilters>({
    brandSearch: '',
    modelSearch: '',
    categoryFilter: '',
    statusFilter: '',
    buyTypeFilter: '',
    minPrice: null,
    maxPrice: null,
    hasStock: null
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);

  // ==================== COMPUTED VALUES ====================
  
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

  // ==================== ACTIONS ====================
  
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
      hasStock: null
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

  return {
    products,
    allProducts,
    categories,
    filters,
    showFilters,
    activeFilterCount,
    viewProduct,
    stats: {
      totalProducts: stats.totalProducts,
      totalStock: stats.totalStock,
      totalValue: stats.totalValue,
      newProducts: stats.newProducts,
      inTransit: stats.inTransit,
      available: stats.available
    },
    setFilter,
    clearFilters,
    toggleFilters,
    setViewProduct,
    onAddNew,
    onAddToExisting,
    onTransfer
  };
}
