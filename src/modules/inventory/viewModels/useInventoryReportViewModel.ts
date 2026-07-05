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
  const [statusFilter, setStatusFilter] = useState('');
  const [ownershipFilter, setOwnershipFilter] = useState('');

  const load = useCallback(() => {
    setIsLoading(true);
    InventoryFirebaseService.fetchInventoryReportRows()
      .then(setRows)
      .catch(e => setError(e.message || 'Failed to load inventory report'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      const matchesSearch = !search.trim() ||
        r.brandName.toLowerCase().includes(search.toLowerCase()) ||
        r.modelName.toLowerCase().includes(search.toLowerCase()) ||
        r.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
        (r.invoiceNumber || '').toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !statusFilter || r.currentStatus === statusFilter;
      const matchesOwnership = !ownershipFilter || r.ownershipType === ownershipFilter;
      return matchesSearch && matchesStatus && matchesOwnership;
    });
  }, [rows, search, statusFilter, ownershipFilter]);

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
    search, setSearch, statusFilter, setStatusFilter, ownershipFilter, setOwnershipFilter,
    formatCurrency, formatDate, onBack, refresh: load,
  };
}
