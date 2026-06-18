// viewModels/useInventoryPayableConfigViewModel.ts
// Manages state for the "Configure Inventory Payables" panel.
// Loads all inventory products (for the dropdown) and all existing configs.
//
// UPDATED: Supports entering the fixed amount in AED or USD.
//          The stored value is always fixedAmountAed (converted if needed).

import { useState, useEffect, useCallback } from 'react';
import type { Product } from '../../inventory/models/types';
import type {
  InventoryPayableConfig,
  CreateInventoryPayableConfigDTO,
} from '../models/inventoryPayableConfig.types';
import {
  fetchAllInventoryPayableConfigs,
  createInventoryPayableConfig,
  deleteInventoryPayableConfig,
} from '../models/inventoryPayableConfigService';

// We fetch products directly from the inventory Firestore service
import { InventoryFirebaseService } from '../../inventory/models/InventoryFirebaseService';

// Exchange rate: 1 USD = 3.67 AED
const USD_TO_AED = 3.67;

export interface UseInventoryPayableConfigReturn {
  // Inventory dropdown data
  products:        Product[];
  productsLoading: boolean;

  // Existing configs
  configs:         InventoryPayableConfig[];
  configsLoading:  boolean;
  configsError:    string | null;

  // Form state
  selectedProductId: string;
  inputCurrency:     'AED' | 'USD';
  inputAmount:       string;
  notes:             string;
  setSelectedProductId: (id: string) => void;
  setInputCurrency:     (c: 'AED' | 'USD') => void;
  setInputAmount:       (v: string) => void;
  setNotes:             (v: string) => void;

  // Computed preview (always in AED + other currencies)
  previewAed: number | null;

  // Actions
  submitConfig:   () => Promise<void>;
  deleteConfig:   (id: string) => Promise<void>;
  actionLoading:  boolean;
  actionError:    string | null;
  successMessage: string | null;

  refresh: () => Promise<void>;
}

export function useInventoryPayableConfigViewModel(): UseInventoryPayableConfigReturn {
  // ── Products (inventory dropdown) ────────────────────────────────────────
  const [products,        setProducts]        = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // ── Configs ───────────────────────────────────────────────────────────────
  const [configs,        setConfigs]        = useState<InventoryPayableConfig[]>([]);
  const [configsLoading, setConfigsLoading] = useState(true);
  const [configsError,   setConfigsError]   = useState<string | null>(null);

  // ── Form ──────────────────────────────────────────────────────────────────
  const [selectedProductId, setSelectedProductId] = useState('');
  const [inputCurrency,     setInputCurrency]     = useState<'AED' | 'USD'>('AED');
  const [inputAmount,       setInputAmount]       = useState('');
  const [notes,             setNotes]             = useState('');

  // ── Action state ──────────────────────────────────────────────────────────
  const [actionLoading,  setActionLoading]  = useState(false);
  const [actionError,    setActionError]    = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ── Computed preview ──────────────────────────────────────────────────────
  const previewAed: number | null = (() => {
    const v = parseFloat(inputAmount);
    if (isNaN(v) || v <= 0) return null;
    return inputCurrency === 'USD' ? parseFloat((v * USD_TO_AED).toFixed(2)) : v;
  })();

  // ── Load products ─────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setProductsLoading(true);
        const all = await InventoryFirebaseService.fetchAllProducts();
        // Show only available products (not sold/damaged)
        const filtered = all.filter((p) => p.status !== 'Sold' && p.status !== 'Damaged');
        console.log(`[InventoryPayableConfig] Loaded ${filtered.length} inventory items for dropdown`);
        setProducts(filtered);
      } catch (err) {
        console.error('[InventoryPayableConfig] failed to load products:', err);
      } finally {
        setProductsLoading(false);
      }
    })();
  }, []);

  // ── Load configs ──────────────────────────────────────────────────────────
  const loadConfigs = useCallback(async () => {
    try {
      setConfigsLoading(true);
      setConfigsError(null);
      const data = await fetchAllInventoryPayableConfigs();
      console.log(`[InventoryPayableConfig] Loaded ${data.length} existing configs`);
      setConfigs(data);
    } catch (err: any) {
      setConfigsError(err?.message ?? 'Failed to load configurations');
    } finally {
      setConfigsLoading(false);
    }
  }, []);

  useEffect(() => { loadConfigs(); }, [loadConfigs]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const submitConfig = useCallback(async () => {
    setActionError(null);
    setSuccessMessage(null);

    const cleanProductId = selectedProductId.trim();

    if (!cleanProductId) {
      setActionError('Please select an inventory item.');
      return;
    }
    const rawAmount = parseFloat(inputAmount);
    if (!inputAmount || isNaN(rawAmount) || rawAmount <= 0) {
      setActionError(`Please enter a valid ${inputCurrency} amount greater than 0.`);
      return;
    }

    const product = products.find((p) => p.id === cleanProductId);
    if (!product) {
      setActionError('Selected product not found.');
      return;
    }

    // Always store in AED
    const fixedAmountAed = inputCurrency === 'USD'
      ? parseFloat((rawAmount * USD_TO_AED).toFixed(2))
      : rawAmount;

    const dto: CreateInventoryPayableConfigDTO = {
      productId:      cleanProductId,
      productName:    `${product.brandName} ${product.modelName}`.trim(),
      brandName:      product.brandName,
      modelName:      product.modelName,
      fixedAmountAed,
      inputCurrency,
      inputAmount:    rawAmount,
      notes:          notes.trim() || undefined,
    };

    console.log('[InventoryPayableConfig] Submitting config:', dto);

    try {
      setActionLoading(true);
      await createInventoryPayableConfig(dto);
      await loadConfigs();
      // Reset form
      setSelectedProductId('');
      setInputAmount('');
      setNotes('');
      const displayAmount = inputCurrency === 'USD'
        ? `$${rawAmount.toFixed(2)} → AED ${fixedAmountAed.toFixed(2)}`
        : `AED ${fixedAmountAed.toFixed(2)}`;
      setSuccessMessage(`Config saved: ${dto.productName} → ${displayAmount}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('[InventoryPayableConfig] Submit failed:', err);
      setActionError(err?.message ?? 'Failed to save config');
    } finally {
      setActionLoading(false);
    }
  }, [selectedProductId, inputAmount, inputCurrency, notes, products, loadConfigs]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const deleteConfig = useCallback(async (id: string) => {
    try {
      setActionLoading(true);
      setActionError(null);
      await deleteInventoryPayableConfig(id);
      await loadConfigs();
    } catch (err: any) {
      setActionError(err?.message ?? 'Failed to delete config');
    } finally {
      setActionLoading(false);
    }
  }, [loadConfigs]);

  return {
    products,
    productsLoading,
    configs,
    configsLoading,
    configsError,
    selectedProductId,
    inputCurrency,
    inputAmount,
    notes,
    setSelectedProductId,
    setInputCurrency,
    setInputAmount,
    setNotes,
    previewAed,
    submitConfig,
    deleteConfig,
    actionLoading,
    actionError,
    successMessage,
    refresh: loadConfigs,
  };
}