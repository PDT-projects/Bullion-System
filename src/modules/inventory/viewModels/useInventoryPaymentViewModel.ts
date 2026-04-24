// Inventory Module - ViewModel Layer
// useInventoryPaymentViewModel - Final step: payment & save to Firestore
// UPDATED: Transaction ID format changed to TXN-DDMMYY-### (e.g. TXN-220426-001)
//          Activity report now correctly saves inventoryId (TXN ref) for both Cash and Bank payments

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ProductFormData, CostingOption, BuyType, ProductStatus,
  InventoryEntryType, CostingInfo, CostingModel, CreateProductDTO,
} from '../models/types';
import { InventoryFirebaseService, generateInventoryTransactionId } from '../models/InventoryFirebaseService';
import { BankFirebaseService } from '../../banking/models/bankFirebaseService';
import { CashFirebaseService } from '../../banking/models/cashFirebaseService';
import { Bank } from '../../banking/models/types';
import { createTransactionFromInventory, TxCompany } from '../../transactions/models/TransactionBridgeService';

export const INVENTORY_COMPANIES: { id: string; label: string; value: TxCompany }[] = [
  { id: 'isb', label: 'Islamabad',  value: 'Pakistan Detector Technologies Pvt. Ltd - Islamabad'  },
  { id: 'rwp', label: 'Rawalpindi', value: 'Pakistan Detector Technologies Pvt. Ltd - Rawalpindi' },
  { id: 'lhr', label: 'Lahore',     value: 'Pakistan Detector Technologies Pvt. Ltd - Lahore'     },
  { id: 'oth', label: 'Other',      value: 'Pakistan Detector Technologies Pvt. Ltd - Other'      },
];

export type PaymentStatusType = 'paid' | 'unpaid' | 'partial';
export type PaymentMode = 'cash' | 'bank';

export interface InstallmentEntry {
  id: string;          // uuid-lite: Date.now() + Math.random()
  mode: PaymentMode;
  bankId?: string;
  bankName?: string;
  amount: number;
  note?: string;
  date: string;        // ISO date string
}

export interface UseInventoryPaymentViewModelReturn {
  formData: Partial<ProductFormData>;
  costingOption: CostingOption;
  inventoryType: InventoryEntryType;
  totalAmount: number;
  paymentStatus: PaymentStatusType;
  transactionId: string;
  isGeneratingId: boolean;
  isEditingTransactionId: boolean;
  paidAmount: number;
  remainingAmount: number;
  validationErrors: { [key: string]: string };
  isValid: boolean;
  isSaving: boolean;

  // Payment mode
  paymentMode: PaymentMode;
  setPaymentMode: (mode: PaymentMode) => void;
  selectedBankId: string;
  setSelectedBankId: (id: string) => void;
  banks: Bank[];
  isBanksLoading: boolean;

  // Installments (for partial / multi-account)
  installments: InstallmentEntry[];
  addInstallment: () => void;
  removeInstallment: (id: string) => void;
  updateInstallment: (id: string, patch: Partial<InstallmentEntry>) => void;
  instalmentTotal: number;

  // Branch/company for transaction linking
  inventoryCompany: TxCompany;
  setInventoryCompany: (v: TxCompany) => void;

  setPaymentStatus: (status: PaymentStatusType) => void;
  setTransactionId: (id: string) => void;
  setIsEditingTransactionId: (v: boolean) => void;
  setPaidAmount: (value: number) => void;
  handleSubmit: () => void;
  handleBack: () => void;
  formatCurrency: (amount: number) => string;
  productSummary: {
    brandName: string; modelName: string; category: string;
    stock: number; sellPrice: number; status: string; inventoryType: string;
    location: string;
    totalValueOfBrand?: number; modelCount?: number;
  };
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Generates a fallback transaction ID in the format TXN-DDMMYY-###
 * Used when the Firebase call to generateInventoryTransactionId fails.
 *
 * Format breakdown:
 *   TXN  — fixed prefix
 *   DD   — day of entry (e.g. 22)
 *   MM   — month of entry (e.g. 04)
 *   YY   — last 2 digits of year (e.g. 26)
 *   ###  — 3-digit counter (starts at 001 for fallback; Firebase handles real counter)
 *
 * Example: TXN-220426-001
 */
function generateFallbackTransactionId(): string {
  const now = new Date();
  const dd  = String(now.getDate()).padStart(2, '0');
  const mm  = String(now.getMonth() + 1).padStart(2, '0');
  const yy  = String(now.getFullYear()).slice(-2);
  // Fallback counter — real counter is managed by Firestore in generateInventoryTransactionId
  const counter = String(Math.floor(Math.random() * 900) + 100); // 100–999 to avoid collisions
  return `TXN-${dd}${mm}${yy}-${counter}`;
}

export function useInventoryPaymentViewModel(): UseInventoryPaymentViewModelReturn {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSaving, setIsSaving]                         = useState(false);
  const [inventoryCompany, setInventoryCompany]           = useState<TxCompany>(INVENTORY_COMPANIES[0].value);
  const [isGeneratingId, setIsGeneratingId]             = useState(true);
  const [transactionId, setTransactionId]               = useState('');
  const [isEditingTransactionId, setIsEditingTransactionId] = useState(false);

  // ── Banks ──────────────────────────────────────────────────────────────────
  const [banks, setBanks]               = useState<Bank[]>([]);
  const [isBanksLoading, setIsBanksLoading] = useState(true);

  useEffect(() => {
    BankFirebaseService.fetchAllBanks()
      .then(setBanks)
      .catch(() => {})
      .finally(() => setIsBanksLoading(false));
  }, []);

  // ── Payment mode & bank selection ─────────────────────────────────────────
  const [paymentMode, setPaymentMode]       = useState<PaymentMode>('cash');
  const [selectedBankId, setSelectedBankId] = useState('');

  // ── Installments ──────────────────────────────────────────────────────────
  const [installments, setInstallments] = useState<InstallmentEntry[]>([]);

  const addInstallment = useCallback(() => {
    setInstallments(prev => [...prev, {
      id: makeId(),
      mode: 'cash',
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      note: '',
    }]);
  }, []);

  const removeInstallment = useCallback((id: string) => {
    setInstallments(prev => prev.filter(e => e.id !== id));
  }, []);

  const updateInstallment = useCallback((id: string, patch: Partial<InstallmentEntry>) => {
    setInstallments(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  }, []);

  const instalmentTotal = useMemo(
    () => installments.reduce((s, e) => s + (e.amount || 0), 0),
    [installments]
  );

  // ── Parse wizard state from URL ──────────────────────────────────────────
  const costingOption = (searchParams.get('costing') as CostingOption)      || 'without';
  const inventoryType = (searchParams.get('type')    as InventoryEntryType) || 'in-stock';
  const brandName     = searchParams.get('brandName')    || '';
  const modelName     = searchParams.get('modelName')    || '';
  const category      = searchParams.get('category')     || '';
  const sellPrice     = Number(searchParams.get('sellPrice'))     || 0;
  const buyType       = (searchParams.get('buyType') as BuyType)  || 'Import';
  const warrantyYears = Number(searchParams.get('warrantyYears')) || 0;
  const stock         = Number(searchParams.get('stock'))         || 0;
  const description   = searchParams.get('description')  || '';
  const status        = (searchParams.get('status') as ProductStatus) || 'New';
  const isDamaged     = searchParams.get('isDamaged') === 'true';
  const location      = searchParams.get('location')     || '';
  const costPrice     = Number(searchParams.get('costPrice'))     || 0;
  const serialNumbers: string[]                = JSON.parse(searchParams.get('serialNumbers') || '[]');
  const serialCities:  { [k: string]: string } = JSON.parse(searchParams.get('serialCities')  || '{}');
  const costingBrandId = searchParams.get('costingBrandId') || '';

  let costing: CostingInfo | undefined;
  if (costingOption === 'with') {
    const models: CostingModel[] = JSON.parse(searchParams.get('costingModels') || '[]');
    costing = {
      brandName:         searchParams.get('costingBrandName') || brandName,
      usdRate:           Number(searchParams.get('usdRate'))           || 0,
      totalCustomsValue: Number(searchParams.get('totalCustomsValue')) || 0,
      totalFreightValue: Number(searchParams.get('totalFreightValue')) || 0,
      models,
      totalUnitCostUSD:  Number(searchParams.get('totalUnitCostUSD'))  || 0,
      shipmentTotalUSD:  Number(searchParams.get('shipmentTotalUSD'))  || 0,
      consignmentValue:  Number(searchParams.get('consignmentValue'))  || 0,
      totalValueOfBrand: Number(searchParams.get('totalValueOfBrand')) || 0,
    };
  }

  const selectedModels: Array<{
    modelId: string; modelName: string; costPrice: number; salePrice: number; quantity: number;
    serialNumbers?: string[]; serialCities?: { [k: string]: string };
  }> = JSON.parse(searchParams.get('selectedModels') || '[]');

  const formData: Partial<ProductFormData> = {
    costingOption, brandName, modelName, category, sellPrice, buyType,
    warrantyYears, stock, description, status, isDamaged,
    location, serialNumbers, serialCities, costing,
  };

  // ── Auto-generate transaction ID on mount ─────────────────────────────────
  // NOTE: generateInventoryTransactionId() in InventoryFirebaseService MUST
  // return IDs in the format  TXN-DDMMYY-###  (see companion fix below).
  useEffect(() => {
    const generate = async () => {
      setIsGeneratingId(true);
      try {
        const id = await generateInventoryTransactionId();
        setTransactionId(id);
      } catch {
        // Fallback uses the same TXN-DDMMYY-### format
        setTransactionId(generateFallbackTransactionId());
      } finally {
        setIsGeneratingId(false);
      }
    };
    generate();
  }, []);

  const [paymentStatus, setPaymentStatusState] = useState<PaymentStatusType>('paid');
  const [paidAmount, setPaidAmountState]       = useState(0);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const totalAmount = useMemo(() => {
    if (costingOption === 'with' && costing?.totalValueOfBrand) return costing.totalValueOfBrand;
    return sellPrice * stock;
  }, [costingOption, costing?.totalValueOfBrand, sellPrice, stock]);

  const remainingAmount = useMemo(() => totalAmount - paidAmount, [totalAmount, paidAmount]);

  const setPaymentStatus = useCallback((s: PaymentStatusType) => {
    setPaymentStatusState(s);
    if (s === 'unpaid')    { setPaidAmountState(0); setInstallments([]); }
    else if (s === 'paid') { setPaidAmountState(totalAmount); setInstallments([]); }
    else                   { setPaidAmountState(0); }
  }, [totalAmount]);

  const setPaidAmount = useCallback((v: number) => setPaidAmountState(v), []);

  const formatCurrency = useCallback((amount: number) =>
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(amount)
  , []);

  const validateForm = useCallback((): boolean => {
    const errors: { [key: string]: string } = {};
    if (!transactionId.trim()) errors.transactionId = 'Transaction ID is required';
    if (paymentStatus !== 'unpaid' && paymentMode === 'bank' && !selectedBankId)
      errors.bankId = 'Please select a bank account';
    if (paymentStatus === 'partial') {
      if (installments.length > 0) {
        installments.forEach((inst, i) => {
          if (inst.amount <= 0) errors[`inst_${i}`] = 'Amount must be > 0';
          if (inst.mode === 'bank' && !inst.bankId) errors[`inst_bank_${i}`] = 'Select a bank';
        });
      } else if (paidAmount <= 0) {
        errors.paidAmount = 'Paid amount must be greater than 0 for partial payments';
      }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [paymentStatus, paidAmount, transactionId, paymentMode, selectedBankId, installments]);

  const isValid = useMemo(() => {
    if (isGeneratingId) return false;
    if (!transactionId.trim()) return false;
    if (paymentStatus !== 'unpaid' && paymentMode === 'bank' && !selectedBankId) return false;
    if (paymentStatus === 'partial') {
      if (installments.length > 0) return installments.every(i => i.amount > 0 && (i.mode === 'cash' || !!i.bankId));
      return paidAmount > 0;
    }
    return true;
  }, [paymentStatus, paidAmount, isGeneratingId, transactionId, paymentMode, selectedBankId, installments]);

  // ── Record payment activity ────────────────────────────────────────────────
  // Each cash/bank entry is saved with:
  //   - reference  = transactionId  (TXN-DDMMYY-###)  ← links back to inventory record
  //   - inventoryId = transactionId                    ← explicit FK for activity report lookups
  //   - description includes brand, model, and TXN ref for human-readable tracing
  const recordPaymentActivity = useCallback(async (
    _effectivePaid: number,
    entries: Array<{
      mode: PaymentMode;
      bankId?: string;
      bankName?: string;
      amount: number;
      note?: string;
      date: string;
    }>
  ) => {
    const today = new Date().toISOString().slice(0, 10);

    for (const entry of entries) {
      // ── Cash payment ──────────────────────────────────────────────────────
      if (entry.mode === 'cash') {
        try {
          const cashRecord = await CashFirebaseService.getOrCreateCashForLocation(
            location || 'Head Office - Islamabad'
          );
          await CashFirebaseService.addCashTransaction({
            date:          entry.date || today,
            company:       brandName,
            mainCategory:  'Inventory Purchase' as const,
            subCategory:   `${modelName || 'Multiple Models'} — ${transactionId}`,
            amount:        -entry.amount,  // Negative for outflow
            mode:          'Cash',
            note:          entry.note || `Inventory payment — ${transactionId}`,
            location:      location || '',
            reference:     transactionId,
            inventoryId:   transactionId,
          });
        } catch (err) {
          console.error('Failed to record cash transaction:', err);
        }

      // ── Bank payment ──────────────────────────────────────────────────────
      } else if (entry.mode === 'bank' && entry.bankId) {
        try {
          await BankFirebaseService.addBankTransaction({
            bankId:      entry.bankId,
            bankName:    entry.bankName || '',
            date:        entry.date || today,
            type:        'debit',
            amount:      entry.amount,
            description: `Inventory Purchase — ${brandName} ${modelName || ''} [${transactionId}]`,
            // ↓ These two fields link the bank record to the inventory entry
            reference:   transactionId,
            inventoryId: transactionId,
            category:    'Inventory',
            note:        entry.note || '',
          });
        } catch (err) {
          console.error('Failed to record bank transaction:', err);
        }
      }
    }
  }, [brandName, modelName, transactionId, location]);

  // ── Build payment entries for saving ──────────────────────────────────────
  const buildPaymentEntries = useCallback((): Array<{
    mode: PaymentMode; bankId?: string; bankName?: string;
    amount: number; note?: string; date: string;
  }> => {
    const today = new Date().toISOString().slice(0, 10);

    if (paymentStatus === 'unpaid') return [];

    if (paymentStatus === 'partial' && installments.length > 0) {
      return installments.map(inst => ({
        mode:     inst.mode,
        bankId:   inst.bankId,
        bankName: inst.bankName || banks.find(b => b.id === inst.bankId)?.name,
        amount:   inst.amount,
        note:     inst.note,
        date:     inst.date || today,
      }));
    }

    const selectedBank = banks.find(b => b.id === selectedBankId);
    return [{
      mode:     paymentMode,
      bankId:   paymentMode === 'bank' ? selectedBankId : undefined,
      bankName: paymentMode === 'bank' ? selectedBank?.name : undefined,
      amount:   paymentStatus === 'paid' ? totalAmount : paidAmount,
      date:     today,
    }];
  }, [paymentStatus, paymentMode, selectedBankId, banks, paidAmount, totalAmount, installments]);

  // ── Save to Firestore ──────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;
    setIsSaving(true);

    try {
      const isOnOrder   = inventoryType === 'on-order';
      const entries     = buildPaymentEntries();
      const effectivePaid = entries.reduce((s, e) => s + e.amount, 0);

      const selectedBank = banks.find(b => b.id === selectedBankId);
      const paymentInfo = {
        paymentStatus,
        transactionId:   paymentStatus !== 'unpaid' ? transactionId : undefined,
        paidAmount:      effectivePaid || undefined,
        totalAmount,
        paymentMode:     paymentStatus !== 'unpaid' ? paymentMode     : undefined,
        bankId:          (paymentMode === 'bank' && paymentStatus !== 'unpaid') ? selectedBankId   : undefined,
        bankName:        (paymentMode === 'bank' && paymentStatus !== 'unpaid') ? selectedBank?.name : undefined,
        installments:    installments.length > 0 ? installments : undefined,
      };

      if (costingOption === 'with' && selectedModels.length > 0) {
        for (const sm of selectedModels) {
          const validSerials = (sm.serialNumbers || []).filter((s: string) => s.trim() !== '');
          const smSerialCities: { [k: string]: string } = { ...(sm.serialCities || {}) };
          if (location) {
            validSerials.forEach((s: string) => { if (!smSerialCities[s]) smSerialCities[s] = location; });
          }
          const dto: CreateProductDTO = {
            brandName, modelName: sm.modelName, category,
            costPrice: sm.costPrice, sellPrice: sm.salePrice, buyType, warrantyYears,
            stock: sm.quantity, location,
            serialNumbers: validSerials, serialCities: smSerialCities,
            description, status: isOnOrder ? 'On-Order' : status, isDamaged,
            costingOption: 'with', costing,
            receivableStatus:    isOnOrder ? 'Pending' : undefined,
            expectedReceiveDate: isOnOrder ? undefined : undefined,
          };
          await InventoryFirebaseService.createProduct(dto, paymentInfo);
        }
      } else {
        const seededCities: { [k: string]: string } = { ...serialCities };
        if (location) {
          serialNumbers.forEach(s => { if (!seededCities[s]) seededCities[s] = location; });
        }
        const dto: CreateProductDTO = {
          brandName, modelName, category, costPrice, sellPrice, buyType, warrantyYears,
          stock, location, serialNumbers, serialCities: seededCities,
          description, status: isOnOrder ? 'On-Order' : status, isDamaged,
          costingOption: costingOption === 'with' ? 'with' : 'without',
          costing:       costingOption === 'with' ? costing : undefined,
          receivableStatus:    isOnOrder ? 'Pending' : undefined,
          expectedReceiveDate: isOnOrder ? undefined : undefined,
        };
        await InventoryFirebaseService.createProduct(dto, paymentInfo);
      }

      // Record payment in cash / bank activity — links via TXN-DDMMYY-### reference
      if (entries.length > 0) {
        await recordPaymentActivity(effectivePaid, entries);
      }

      // ── Auto-create transaction record (non-blocking) ─────────────────────
      if (!isOnOrder) {
        createTransactionFromInventory({
          transactionId:  transactionId,
          brandName,
          modelName:      costingOption === 'with' && selectedModels.length > 0
                            ? selectedModels.map((m: any) => m.modelName).join(', ')
                            : modelName,
          date:           new Date().toISOString().split('T')[0],
          totalAmount,
          paidAmount:     effectivePaid,
          paymentStatus,
          paymentMode,
          bankId:         paymentMode === 'bank' ? selectedBankId : undefined,
          bankName:       paymentMode === 'bank' ? banks.find(b => b.id === selectedBankId)?.name : undefined,
          installments:   installments.length > 0 ? installments : undefined,
          company:        inventoryCompany,
        }).catch(err => console.warn('[TxBridge] Inventory transaction failed (non-blocking):', err));
      }

      toast.success(isOnOrder
        ? `✅ Product saved to Receivable Stock — Transaction: ${transactionId}`
        : `✅ Product added to Inventory — Transaction: ${transactionId}`
      );
      navigate(isOnOrder ? '/inventory/receivable' : '/inventory/view');
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [
    validateForm, costingOption, selectedModels, brandName, modelName,
    category, sellPrice, buyType, warrantyYears, stock, description, status,
    isDamaged, serialNumbers, serialCities, inventoryType, costing,
    paymentStatus, transactionId, paidAmount, totalAmount, navigate, location,
    paymentMode, selectedBankId, banks, installments, buildPaymentEntries, recordPaymentActivity, inventoryCompany,
  ]);

  const handleBack = useCallback(() => {
    const params = new URLSearchParams({
      type: inventoryType, costing: costingOption, brandName, modelName,
      category, costPrice: costPrice.toString(), sellPrice: sellPrice.toString(), buyType,
      warrantyYears: warrantyYears.toString(), stock: stock.toString(),
      description, status, isDamaged: isDamaged.toString(),
      location,
      serialNumbers: JSON.stringify(serialNumbers),
      serialCities:  JSON.stringify(serialCities),
    });
    if (costingBrandId) params.set('costingBrandId', costingBrandId);
    if (costingOption === 'with' && costing) {
      params.set('usdRate',           costing.usdRate.toString());
      params.set('totalCustomsValue', costing.totalCustomsValue.toString());
      params.set('totalFreightValue', costing.totalFreightValue.toString());
      params.set('shipmentTotalUSD',  costing.shipmentTotalUSD.toString());
      params.set('consignmentValue',  costing.consignmentValue.toString());
      params.set('totalValueOfBrand', costing.totalValueOfBrand.toString());
      params.set('totalUnitCostUSD',  costing.totalUnitCostUSD.toString());
      params.set('costingModels',     JSON.stringify(costing.models));
      params.set('costingBrandName',  costing.brandName);
    }
    params.set('selectedModels', JSON.stringify(selectedModels));
    navigate(`/inventory/create-new/details?${params.toString()}`);
  }, [
    navigate, inventoryType, costingOption, brandName, modelName, category, sellPrice,
    buyType, warrantyYears, stock, description, status, isDamaged, location,
    serialNumbers, serialCities, costing, selectedModels, costingBrandId,
  ]);

  const productSummary = useMemo(() => ({
    brandName, modelName, category, stock, sellPrice, status, inventoryType,
    location,
    totalValueOfBrand: costingOption === 'with' ? costing?.totalValueOfBrand : undefined,
    modelCount:        costingOption === 'with' ? costing?.models.length      : undefined,
  }), [brandName, modelName, category, stock, sellPrice, status, inventoryType, costingOption, costing, location]);

  return {
    formData, costingOption, inventoryType, totalAmount,
    paymentStatus, transactionId, isGeneratingId,
    isEditingTransactionId, setIsEditingTransactionId,
    paidAmount, remainingAmount,
    validationErrors, isValid, isSaving,
    paymentMode, setPaymentMode,
    selectedBankId, setSelectedBankId,
    banks, isBanksLoading,
    installments, addInstallment, removeInstallment, updateInstallment, instalmentTotal,
    inventoryCompany, setInventoryCompany,
    setPaymentStatus, setTransactionId, setPaidAmount,
    handleSubmit, handleBack, formatCurrency, productSummary,
  };
}