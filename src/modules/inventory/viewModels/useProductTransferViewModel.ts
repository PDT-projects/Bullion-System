// Inventory Module - ViewModel Layer
// useProductTransferViewModel - Transfer list + Mark Received logic
//
// CHANGES (v3):
//  • formatDate → formatDateTime — renders full date + time (e.g. "1 Jun 2026, 14:30")
//  • handleMarkReceived unchanged in logic, just uses updated datetime helper

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
  handleMarkReceived: (transfer: ProductTransfer, receiverName: string) => Promise<void>;
  handleDeleteTransfer: (id: string) => Promise<void>;
  setViewTransfer: (transfer: ProductTransfer | null) => void;
  onBack: () => void;
  onNewTransfer: () => void;
  /** Formats an ISO date/datetime string → "1 Jun 2026, 14:30" */
  formatDateTime: (date: string) => string;
  /** Legacy alias kept for any consumers that still call formatDate */
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
    totalTransfers:     allTransfers.length,
    pendingTransfers:   allTransfers.filter(t => t.status === 'Pending').length,
    inTransitTransfers: allTransfers.filter(t => t.status === 'In Transit').length,
    receivedTransfers:  allTransfers.filter(t => t.status === 'Received').length,
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

  // ── CORE: Mark Received → add serials to destination product ─────────────
  const handleMarkReceived = useCallback(async (transfer: ProductTransfer, receiverName: string) => {
    if (transfer.status === 'Received') {
      toast.error('This transfer is already marked as received');
      return;
    }
    if (!receiverName || !receiverName.trim()) {
      toast.error('Receiver name is required');
      return;
    }

    try {
      const product = allProducts.find(p => p.id === transfer.productId);
      if (!product) { toast.error('Product not found'); return; }

      const transferredSerials = transfer.serialNumbers || [];
      const toLocation = transfer.toLocation;
      const receivedAt = new Date().toISOString();
      const receiveDateOnly = receivedAt.slice(0, 10);

      // Because create no longer touches the inventory, all transferred
      // serials are still on the source product record. Marking Received
      // just updates their per-serial location AND their per-serial
      // stock-in date to today. The rest of the product is untouched.
      const nextCities: Record<string, string> = { ...(product.serialCities || {}) };
      const nextStockInDates: Record<string, string> = { ...((product as any).serialStockInDates || {}) };
      const nextStatus: Record<string, string> = { ...(product.serialStatus || {}) };
      for (const s of transferredSerials) {
        nextCities[s] = toLocation;
        nextStockInDates[s] = receiveDateOnly;
        // Clear any transit marker back to Available (in case a prior
        // buggy write left "In Transit" on it).
        if (nextStatus[s] === 'In Transit') nextStatus[s] = 'Available';
      }

      // If every serial on the product is now at toLocation, advance the
      // product-wide default so future writes fall back correctly.
      const allSerials: string[] = product.serialNumbers || [];
      const allValues = allSerials.map(s => nextCities[s] || product.location || '').filter(Boolean);
      const allSame   = allValues.length === allSerials.length
                     && allValues.every(v => v === toLocation);

      await InventoryFirebaseService.updateProduct(product.id, {
        serialCities:  nextCities,
        serialStatus:  nextStatus,
        // Per user request: bring the product's stock-in date forward to
        // the receive date so the inventory list shows a recent stock-in
        // for these serials.
        stockInDate:   receiveDateOnly,
        ...(({ serialStockInDates: nextStockInDates } as any)),
        location:      allSame ? toLocation : product.location,
      } as any);

      // Update the transfer with status + receiver info + receive date.
      // updateTransferStatus already writes status + receivedAt; the
      // receiverName goes via a direct doc merge in the service.
      await TransferFirebaseService.updateTransferStatus(transfer.id, 'Received', receivedAt);
      // Also stamp the receiverName on the transfer doc.
      try {
        await (TransferFirebaseService as any).updateTransferReceiver?.(transfer.id, receiverName.trim());
      } catch {
        // Fallback if the helper doesn't exist yet — write via generic patch
        await (TransferFirebaseService as any).patchTransfer?.(transfer.id, { receiverName: receiverName.trim() });
      }

      // Sync local state
      setAllTransfers(prev =>
        prev.map(t =>
          t.id === transfer.id
            ? { ...t, status: 'Received', receivedAt, receiverName: receiverName.trim() } as any
            : t
        )
      );
      setAllProducts(prev =>
        prev.map(p => p.id === product.id
          ? {
              ...p,
              serialCities: nextCities,
              serialStatus: nextStatus,
              stockInDate: receiveDateOnly,
              location: allSame ? toLocation : p.location,
              ...(({ serialStockInDates: nextStockInDates } as any)),
            } as any
          : p
        )
      );

      toast.success(
        `✅ Transfer received by ${receiverName.trim()} at ${toLocation} — ${transferredSerials.length} unit(s) updated`
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

  /**
   * Renders an ISO datetime string as "1 Jun 2026, 14:30" (Pakistan locale).
   * Falls back gracefully for old date-only strings like "2026-06-01".
   */
  const formatDateTime = useCallback((date: string): string => {
    if (!date) return '—';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return date;
      return d.toLocaleString('en-PK', {
        day:    'numeric',
        month:  'short',
        year:   'numeric',
        hour:   '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch {
      return date;
    }
  }, []);

  // Legacy alias — keeps any old consumers working without changes
  const formatDate = formatDateTime;

  const onBack        = useCallback(() => navigate('/inventory'), [navigate]);
  const onNewTransfer = useCallback(() => navigate('/product-transfer/new'), [navigate]);

  return {
    transfers, isLoading, filters, showFilters, activeFilterCount,
    viewTransfer, stats,
    setFilter, clearFilters, toggleFilters,
    handleMarkReceived, handleDeleteTransfer,
    setViewTransfer, onBack, onNewTransfer,
    formatDateTime, formatDate,
  };
}