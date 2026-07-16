// Inventory Module - ViewModel Layer
// useInventoryReportViewModel - per-serial inventory report

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { InventoryReportRow } from '../models/types';
import { InventoryFirebaseService } from '../models/InventoryFirebaseService';

export function useInventoryReportViewModel() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<InventoryReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  // MULTI-SELECT: all filters are now arrays. Empty array = "no filter applied".
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [ownershipFilter, setOwnershipFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState<string[]>([]);
  const [conditionFilter, setConditionFilter] = useState<string[]>([]);
  const [brandFilter, setBrandFilter] = useState<string[]>([]);
  const [modelFilter, setModelFilter] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Row selection for bulk delete — key = `${productId}::${serialNumber}`
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const toggleFilters = useCallback(() => setShowFilters(v => !v), []);
  const clearFilters = useCallback(() => {
    setStatusFilter([]); setOwnershipFilter([]); setTypeFilter([]);
    setLocationFilter([]); setConditionFilter([]); setBrandFilter([]); setModelFilter([]);
    setDateFrom(''); setDateTo('');
  }, []);

  const load = useCallback(() => {
    setIsLoading(true);
    InventoryFirebaseService.fetchInventoryReportRows()
      .then(setRows)
      .catch(e => setError(e.message || 'Failed to load inventory report'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(r => {
      const matchesSearch = !q || [
        r.brandName, r.modelName, r.serialNumber, r.type, r.location,
        r.ownershipType, r.condition, r.currentStatus, r.invoiceNumber, r.supplierPaymentStatus,
      ].filter(Boolean).join(' ').toLowerCase().includes(q);
      const matchesStatus     = statusFilter.length === 0     || statusFilter.includes(r.currentStatus);
      const matchesOwnership  = ownershipFilter.length === 0  || ownershipFilter.includes(r.ownershipType || '');
      const matchesType       = typeFilter.length === 0       || typeFilter.includes(r.type);
      const matchesLocation   = locationFilter.length === 0   || locationFilter.includes(r.location);
      const matchesCondition  = conditionFilter.length === 0  || conditionFilter.includes(r.condition);
      const matchesBrand = brandFilter.length === 0 || brandFilter.includes(r.brandName);
      const matchesModel = modelFilter.length === 0 || modelFilter.includes(r.modelName);
      const stockDate = r.stockInDateAuto ? new Date(r.stockInDateAuto).getTime() : null;
      const matchesFrom = !dateFrom || (stockDate !== null && stockDate >= new Date(dateFrom).getTime());
      const matchesTo = !dateTo || (stockDate !== null && stockDate <= new Date(dateTo).getTime() + 86399999);
      return matchesSearch && matchesStatus && matchesOwnership && matchesType && matchesLocation && matchesCondition && matchesBrand && matchesModel && matchesFrom && matchesTo;
    });
  }, [rows, search, statusFilter, ownershipFilter, typeFilter, locationFilter, conditionFilter, brandFilter, modelFilter, dateFrom, dateTo]);

  const distinct = useCallback((key: keyof InventoryReportRow) =>
    Array.from(new Set(rows.map(r => r[key]).filter(Boolean) as string[])).sort()
  , [rows]);
  const typeOptions = useMemo(() => distinct('type'), [distinct]);
  const locationOptions = useMemo(() => distinct('location'), [distinct]);
  const conditionOptions = useMemo(() => distinct('condition'), [distinct]);
  const brandOptions = useMemo(() => distinct('brandName'), [distinct]);
  // Model list cascades off selected brand(s)
  const modelOptions = useMemo(() => {
    const src = brandFilter.length > 0 ? rows.filter(r => brandFilter.includes(r.brandName)) : rows;
    return Array.from(new Set(src.map(r => r.modelName).filter(Boolean))).sort();
  }, [rows, brandFilter]);

  useEffect(() => {
    if (brandFilter.length === 0) return;
    setModelFilter(prev => prev.filter(m => modelOptions.includes(m)));
  }, [brandFilter, modelOptions]);

  const activeFilterCount =
    (statusFilter.length > 0 ? 1 : 0) + (ownershipFilter.length > 0 ? 1 : 0) + (typeFilter.length > 0 ? 1 : 0) +
    (locationFilter.length > 0 ? 1 : 0) + (conditionFilter.length > 0 ? 1 : 0) +
    (brandFilter.length > 0 ? 1 : 0) + (modelFilter.length > 0 ? 1 : 0) +
    (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  const formatCurrency = useCallback((n?: number) =>
    n === undefined ? '—' : new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', minimumFractionDigits: 0 }).format(n)
  , []);

  const formatDate = useCallback((iso?: string) => {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return iso; }
  }, []);

  const onBack = useCallback(() => navigate('/inventory'), [navigate]);

  // ── Row selection ─────────────────────────────────────────────────────────
  const rowKey = useCallback((r: InventoryReportRow) => `${r.productId}::${r.serialNumber}`, []);

  const toggleRow = useCallback((r: InventoryReportRow) => {
    const key = rowKey(r);
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, [rowKey]);

  const toggleAllVisible = useCallback(() => {
    setSelectedRowIds(prev => {
      const allKeys = filteredRows.map(rowKey);
      const allSelected = allKeys.length > 0 && allKeys.every(k => prev.has(k));
      const next = new Set(prev);
      if (allSelected) allKeys.forEach(k => next.delete(k));
      else             allKeys.forEach(k => next.add(k));
      return next;
    });
  }, [filteredRows, rowKey]);

  const clearSelection = useCallback(() => setSelectedRowIds(new Set()), []);

  const isRowSelected = useCallback((r: InventoryReportRow) => selectedRowIds.has(rowKey(r)), [selectedRowIds, rowKey]);
  const allVisibleSelected = filteredRows.length > 0 && filteredRows.every(r => selectedRowIds.has(rowKey(r)));

  // ── Bulk delete ───────────────────────────────────────────────────────────
  // Delete distinct products backing the selected rows. Multiple serials from
  // one product only trigger one product-level soft delete (that's how the
  // existing per-item delete works — the whole product is soft-deleted).
  const bulkDeleteSelected = useCallback(async (
    deletedBy: { uid: string; email: string; displayName?: string }
  ): Promise<{ deletedCount: number; failed: string[] }> => {
    const productIds = new Set<string>();
    filteredRows.forEach(r => {
      if (selectedRowIds.has(rowKey(r))) productIds.add(r.productId);
    });
    if (productIds.size === 0) return { deletedCount: 0, failed: [] };

    setIsBulkDeleting(true);
    const failed: string[] = [];
    let deletedCount = 0;
    try {
      // Sequential is safer than Promise.all here — surfaces per-item failures
      // and avoids hammering Firestore with parallel writes on large selections.
      for (const id of productIds) {
        try {
          await InventoryFirebaseService.deleteProduct(id, deletedBy);
          deletedCount++;
        } catch (e) {
          console.error(`Failed to delete product ${id}:`, e);
          failed.push(id);
        }
      }
      clearSelection();
      await load(); // refetch rows so the deleted items disappear
    } finally {
      setIsBulkDeleting(false);
    }
    return { deletedCount, failed };
  }, [filteredRows, selectedRowIds, rowKey, clearSelection, load]);

  return {
    rows, filteredRows, isLoading, error,
    search, setSearch, showFilters, toggleFilters, clearFilters, activeFilterCount,
    statusFilter, setStatusFilter, ownershipFilter, setOwnershipFilter,
    typeFilter, setTypeFilter, typeOptions,
    locationFilter, setLocationFilter, locationOptions,
    conditionFilter, setConditionFilter, conditionOptions,
    brandFilter, setBrandFilter, brandOptions,
    modelFilter, setModelFilter, modelOptions,
    dateFrom, setDateFrom, dateTo, setDateTo,
    formatCurrency, formatDate, onBack, refresh: load,
    // ── selection + bulk delete ──
    selectedRowIds, isRowSelected, toggleRow, toggleAllVisible, clearSelection,
    allVisibleSelected, isBulkDeleting, bulkDeleteSelected,
  };
}