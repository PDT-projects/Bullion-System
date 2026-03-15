// Inventory Module - ViewModel Layer
// useProductTransferViewModel - Transfer list + Mark Received logic
//
// MARK RECEIVED LOGIC:
//   1. Find the same product (brandName + modelName) at destination in Firestore
//   2. If found: merge serials into it, increment stock, update serialCities to toLocation
//   3. If not found: update the original product doc with toLocation serials added back
//   4. Set transfer status → 'Received'

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Product, ProductTransfer, TransferFilters } from '../models/types';
import { InventoryFirebaseService, TransferFirebaseService } from '../models/InventoryFirebaseService';

interface UseProductTransferViewModelReturn {
  transfers: ProductTransfer[];
  isLoading: boolean;
  filters: TransferFilters;
  showFilters: boolean;
  activeFilterCount: number;
  viewTransfer: ProductTransfer | null;
  stats: {
    totalTransfers: number;
    pendingTransfers: number;
    inTransitTransfers: number;
    receivedTransfers: number;
  };
  setFilter: (key: keyof TransferFilters, value: any) => void;
  clearFilters: () => void;
  toggleFilters: () => void;
  handleMarkReceived: (transfer: ProductTransfer) => Promise<void>;
  handleDeleteTransfer: (id: string) => Promise<void>;
  setViewTransfer: (transfer: ProductTransfer | null) => void;
  onBack: () => void;
  onNewTransfer: () => void;
  formatDate: (date: string) => string;
}

const DEFAULT_FILTERS: TransferFilters = {
  productSearch: '', fromLocation: '', toLocation: '',
  statusFilter: '', dateFrom: '', dateTo: '',
};

export function useProductTransferViewModel(): UseProductTransferViewModelReturn {
  const navigate = useNavigate();

  const [allTransfers, setAllTransfers] = useState<ProductTransfer[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFiltersState] = useState<TransferFilters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [viewTransfer, setViewTransfer] = useState<ProductTransfer | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [fetchedTransfers, fetchedProducts] = await Promise.all([
          TransferFirebaseService.fetchAllTransfers(),
          InventoryFirebaseService.fetchAllProducts(),
        ]);
        setAllTransfers(fetchedTransfers);
        setAllProducts(fetchedProducts);
        console.log(`✅ Loaded ${fetchedTransfers.length} transfers`);
      } catch (err) {
        console.error('Error loading transfers:', err);
        toast.error('Failed to load transfers');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Basic filter — search by product name or location
  const transfers = useMemo(() => {
    let list = [...allTransfers];
    if (filters.productSearch)
      list = list.filter(t =>
        t.productName?.toLowerCase().includes(filters.productSearch.toLowerCase())
      );
    if (filters.fromLocation)
      list = list.filter(t => t.fromLocation === filters.fromLocation);
    if (filters.toLocation)
      list = list.filter(t => t.toLocation === filters.toLocation);
    if (filters.statusFilter)
      list = list.filter(t => t.status === filters.statusFilter);
    return list;
  }, [allTransfers, filters]);

  const stats = useMemo(() => ({
    totalTransfers:    allTransfers.length,
    pendingTransfers:  allTransfers.filter(t => t.status === 'Pending').length,
    inTransitTransfers:allTransfers.filter(t => t.status === 'In Transit').length,
    receivedTransfers: allTransfers.filter(t => t.status === 'Received').length,
  }), [allTransfers]);

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter(v => v !== '').length,
    [filters]
  );

  const setFilter = useCallback(
    (key: keyof TransferFilters, value: any) =>
      setFiltersState(prev => ({ ...prev, [key]: value })),
    []
  );
  const clearFilters  = useCallback(() => setFiltersState(DEFAULT_FILTERS), []);
  const toggleFilters = useCallback(() => setShowFilters(p => !p), []);

  // ── CORE: Mark Received → add serials to destination product ─────────────────
  const handleMarkReceived = useCallback(async (transfer: ProductTransfer) => {
    if (transfer.status === 'Received') {
      toast.error('This transfer is already marked as received');
      return;
    }

    try {
      // Find the source product doc to know brandName/modelName
      const sourceProduct = allProducts.find(p => p.id === transfer.productId);
      if (!sourceProduct) {
        toast.error('Source product not found');
        return;
      }

      const transferredSerials = transfer.serialNumbers || [];
      const toLocation = transfer.toLocation;

      // Look for an existing product with the same brand+model at the destination
      // (could be same doc or a different one if stock was split previously)
      const destProduct = allProducts.find(
        p =>
          p.brandName === sourceProduct.brandName &&
          p.modelName === sourceProduct.modelName &&
          p.id !== transfer.productId &&
          p.receivableStatus !== 'Pending'
      ) || sourceProduct; // fallback: update the same product doc

      // Merge serials into destination product
      const existingSerials = destProduct.serialNumbers || [];
      const mergedSerials   = [
        ...existingSerials.filter(s => !transferredSerials.includes(s)),
        ...transferredSerials,
      ];
      const mergedCities = { ...destProduct.serialCities };
      transferredSerials.forEach(s => { mergedCities[s] = toLocation; });

      await InventoryFirebaseService.updateProduct(destProduct.id, {
        stock:         (destProduct.stock || 0) + transferredSerials.length,
        serialNumbers: mergedSerials,
        serialCities:  mergedCities,
      });

      // Mark transfer received
      const receivedAt = new Date().toISOString();
      await TransferFirebaseService.updateTransferStatus(transfer.id, 'Received', receivedAt);

      // Update local state
      setAllTransfers(prev =>
        prev.map(t => t.id === transfer.id ? { ...t, status: 'Received', receivedAt } : t)
      );
      setAllProducts(prev =>
        prev.map(p =>
          p.id === destProduct.id
            ? { ...p, stock: (p.stock || 0) + transferredSerials.length, serialNumbers: mergedSerials, serialCities: mergedCities }
            : p
        )
      );

      toast.success(
        `✅ Transfer received at ${toLocation} — ${transferredSerials.length} unit(s) added to stock`
      );
      setViewTransfer(null);
    } catch (err) {
      console.error('Mark received failed:', err);
      toast.error('Failed to mark transfer as received');
    }
  }, [allProducts]);

  const handleDeleteTransfer = useCallback(async (id: string) => {
    if (!window.confirm('Delete this transfer record?')) return;
    try {
      await TransferFirebaseService.deleteTransfer(id);
      setAllTransfers(prev => prev.filter(t => t.id !== id));
      toast.success('Transfer deleted');
    } catch {
      toast.error('Failed to delete transfer');
    }
  }, []);

  const formatDate = useCallback(
    (date: string) => date ? new Date(date).toLocaleDateString('en-PK') : '-',
    []
  );

  const onBack        = useCallback(() => navigate('/inventory'), [navigate]);
  const onNewTransfer = useCallback(() => navigate('/product-transfer/new'), [navigate]);

  return {
    transfers, isLoading, filters, showFilters, activeFilterCount,
    viewTransfer, stats,
    setFilter, clearFilters, toggleFilters,
    handleMarkReceived, handleDeleteTransfer,
    setViewTransfer, onBack, onNewTransfer, formatDate,
  };
}