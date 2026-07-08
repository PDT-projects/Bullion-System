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
  const [statusFilter, setStatusFilter] = useState('');
  const [ownershipFilter, setOwnershipFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const toggleFilters = useCallback(() => setShowFilters(v => !v), []);
  const clearFilters = useCallback(() => {
    setStatusFilter(''); setOwnershipFilter(''); setTypeFilter('');
    setLocationFilter(''); setConditionFilter(''); setDateFrom(''); setDateTo('');
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
      const matchesStatus = !statusFilter || r.currentStatus === statusFilter;
      const matchesOwnership = !ownershipFilter || r.ownershipType === ownershipFilter;
      const matchesType = !typeFilter || r.type === typeFilter;
      const matchesLocation = !locationFilter || r.location === locationFilter;
      const matchesCondition = !conditionFilter || r.condition === conditionFilter;
      const stockDate = r.stockInDateAuto ? new Date(r.stockInDateAuto).getTime() : null;
      const matchesFrom = !dateFrom || (stockDate !== null && stockDate >= new Date(dateFrom).getTime());
      const matchesTo = !dateTo || (stockDate !== null && stockDate <= new Date(dateTo).getTime() + 86399999);
      return matchesSearch && matchesStatus && matchesOwnership && matchesType && matchesLocation && matchesCondition && matchesFrom && matchesTo;
    });
  }, [rows, search, statusFilter, ownershipFilter, typeFilter, locationFilter, conditionFilter, dateFrom, dateTo]);

  const distinct = useCallback((key: keyof InventoryReportRow) =>
    Array.from(new Set(rows.map(r => r[key]).filter(Boolean) as string[])).sort()
  , [rows]);
  const typeOptions = useMemo(() => distinct('type'), [distinct]);
  const locationOptions = useMemo(() => distinct('location'), [distinct]);
  const conditionOptions = useMemo(() => distinct('condition'), [distinct]);

  const activeFilterCount =
    (statusFilter ? 1 : 0) + (ownershipFilter ? 1 : 0) + (typeFilter ? 1 : 0) +
    (locationFilter ? 1 : 0) + (conditionFilter ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  const formatCurrency = useCallback((n?: number) =>
    n === undefined ? '—' : new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', minimumFractionDigits: 0 }).format(n)
  , []);

  const formatDate = useCallback((iso?: string) => {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return iso; }
  }, []);

  const onBack = useCallback(() => navigate('/inventory'), [navigate]);

  return {
    rows, filteredRows, isLoading, error,
    search, setSearch, showFilters, toggleFilters, clearFilters, activeFilterCount,
    statusFilter, setStatusFilter, ownershipFilter, setOwnershipFilter,
    typeFilter, setTypeFilter, typeOptions,
    locationFilter, setLocationFilter, locationOptions,
    conditionFilter, setConditionFilter, conditionOptions,
    dateFrom, setDateFrom, dateTo, setDateTo,
    formatCurrency, formatDate, onBack, refresh: load,
  };
}