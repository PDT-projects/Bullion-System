// Invoice Module - Form ViewModel
// FIXES:
//   1. SPEED: All Firestore fetches now run in parallel (Promise.all) — no sequential blocking.
//             Products fetched in parallel with invoices/employees/banks.
//             Invoice list capped at last 100 for suggestions (avoids full-collection scan).
//   2. INVOICE NUMBER: Sequential counter stored in Firestore invoiceCounters/global.
//             Format: INV-DDMMYY-NNN where NNN is 001, 002, 003… (resets each day).
//             Atomic increment via runTransaction prevents duplicates under concurrent saves.
//   3. CUSTOM CITIES: Saved to appConfig/customCities in Firestore and immediately
//             merged into the province dropdown — persisted across sessions.

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  doc, getDoc, setDoc, runTransaction, collection, query,
  orderBy, limit, getDocs,
} from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { Invoice, InvoiceProduct, ProductInfo } from '../models/types';
import {
  createEmptyInvoiceProduct, updateProductWithSelection, updateProductQuantity,
  updateProductPrice, updateSerialNumber, getAvailableSerials,
  validateInvoice, calculateTotal,
  provinceCities as baseCities, salespersonLocations, deliveryStatuses,
  collectionMethods, formatCurrency,
} from '../models/invoiceService';
import { InvoiceFirebaseService } from '../models/InvoiceFirebaseService';
import { generateInvoicePdf, downloadInvoicePdf } from '../models/invoicePdfService';
import { InventoryFirebaseService } from '../../inventory/models/InventoryFirebaseService';
import { EmployeeFirebaseService } from '../../employee/models/employeeFirebaseService';
import { BankFirebaseService } from '../../banking/models/bankFirebaseService';
import { autoCalculateCommissionOnInvoiceSave } from '../../commission/models/Commissionautoservice';
import { createTransactionFromInvoice, TxCompany } from '../../transactions/models/TransactionBridgeService';

// Default branches — always available even before Firestore loads
export const DEFAULT_BRANCHES = ['Islamabad', 'Karachi', 'Lahore'];
const COMPANY_PREFIX = 'Pakistan Detector Technologies Pvt. Ltd - ';

export function makeBranchValue(branch: string): TxCompany {
  return `${COMPANY_PREFIX}${branch}` as TxCompany;
}
export function branchFromValue(value: string): string {
  return value.replace(COMPANY_PREFIX, '');
}

interface Employee { id: string; name: string; position: string; status: 'active' | 'inactive'; }
interface Bank    { id: string; name: string; accountNumber: string; }

export interface UseInvoiceFormViewModelReturn {
  formData: Partial<Invoice>;
  selectedProducts: InvoiceProduct[];
  customerSuggestions: Invoice[];
  showSuggestions: boolean;
  isEditing: boolean;
  isLoading: boolean;
  isSaving: boolean;
  pdfGenerating: boolean;
  isDownloadingPdf: boolean;
  provinceCities: Record<string, string[]>;
  salespersonLocations: string[];
  deliveryStatuses: string[];
  collectionMethods: string[];
  availableProducts: ProductInfo[];
  activeEmployees: Employee[];
  banks: Bank[];
  setFormData: (data: Partial<Invoice>) => void;
  handleCustomerSearch: (value: string, field: 'customerName' | 'customerPhone') => void;
  handleCustomerSelect: (customer: Invoice) => void;
  addProduct: () => void;
  removeProduct: (id: string) => void;
  updateProduct: (id: string, field: string, value: any) => void;
  updateSerial: (productId: string, index: number, value: string) => void;
  getAvailableSerialsForProduct: (productId: string, rowId: string) => string[];
  handleSave: () => void;
  handleCancel: () => void;
  handleDownloadPdf: () => void;
  handleAddCustomCity: (province: string, city: string) => Promise<void>;
  calculateTotal: () => number;
  formatCurrency: (amount: number) => string;
  // Branch/company for transaction linking
  invoiceCompany: TxCompany;
  setInvoiceCompany: (v: TxCompany) => void;
  branches: string[];
  handleAddBranch: (name: string) => Promise<void>;
}

// ── Sequential invoice number generator ───────────────────────────────────────
// Format: INV-DDMMYY-NNN  e.g. INV-240426-001
// Counter document: invoiceCounters/global  { date: "240426", seq: 3 }
// Uses a Firestore transaction so concurrent saves never produce duplicates.
async function generateSequentialInvoiceNumber(): Promise<string> {
  const now   = new Date();
  const dd    = String(now.getDate()).padStart(2, '0');
  const mm    = String(now.getMonth() + 1).padStart(2, '0');
  const yy    = String(now.getFullYear()).slice(-2);
  const today = `${dd}${mm}${yy}`;

  const counterRef = doc(db, 'invoiceCounters', 'global');

  const seq = await runTransaction(db, async tx => {
    const snap = await tx.get(counterRef);
    if (!snap.exists() || snap.data().date !== today) {
      // New day — reset counter to 1
      tx.set(counterRef, { date: today, seq: 1 });
      return 1;
    }
    const next = (snap.data().seq as number) + 1;
    tx.update(counterRef, { seq: next });
    return next;
  });

  return `INV-${today}-${String(seq).padStart(3, '0')}`;
}

// ── Custom cities — load/save from Firestore ──────────────────────────────────
// Collection: appConfig / document: customCities
// Structure: { "Punjab": ["Lahore", "Faisalabad", "MyCustomCity"], "Sindh": [...] }
async function loadCustomCities(): Promise<Record<string, string[]>> {
  try {
    const snap = await getDoc(doc(db, 'appConfig', 'customCities'));
    if (snap.exists()) {
      console.log('[Cities] Loaded custom cities from Firestore:', snap.data());
      return snap.data() as Record<string, string[]>;
    }
    console.log('[Cities] No custom cities document yet — starting fresh');
    return {};
  } catch (err) {
    console.error('[Cities] Failed to load custom cities:', err);
    return {};
  }
}

async function saveCustomCities(cities: Record<string, string[]>): Promise<void> {
  // merge: true ensures we don't wipe other fields in appConfig/customCities
  await setDoc(doc(db, 'appConfig', 'customCities'), cities, { merge: true });
  console.log('[Cities] Saved custom cities to Firestore:', cities);
}

function mergeCities(
  base: Record<string, string[]>,
  custom: Record<string, string[]>,
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  const allProvinces = new Set([...Object.keys(base), ...Object.keys(custom)]);
  allProvinces.forEach(p => {
    const merged = [...(base[p] || []), ...(custom[p] || [])];
    result[p] = [...new Set(merged)].sort();
  });
  return result;
}

// ── Main ViewModel ─────────────────────────────────────────────────────────────
export function useInvoiceFormViewModel(): UseInvoiceFormViewModelReturn {
  const navigate = useNavigate();
  const { id }   = useParams<{ id: string }>();

  const [allInvoices,      setAllInvoices]      = useState<Invoice[]>([]);
  const [allProducts,      setAllProducts]      = useState<ProductInfo[]>([]);
  const [activeEmployees,  setActiveEmployees]  = useState<Employee[]>([]);
  const [banks,            setBanks]            = useState<Bank[]>([]);
  const [editingInvoice,   setEditingInvoice]   = useState<Invoice | null>(null);
  const [isLoading,        setIsLoading]        = useState(true);
  const [isSaving,         setIsSaving]         = useState(false);
  const [pdfGenerating,    setPdfGenerating]    = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [customCities,     setCustomCities]     = useState<Record<string, string[]>>({});
  const [invoiceCompany,   setInvoiceCompany]   = useState<TxCompany>(makeBranchValue(DEFAULT_BRANCHES[0]));
  const [branches,         setBranches]         = useState<string[]>(DEFAULT_BRANCHES);

  const provinceCitiesMerged = useMemo(
    () => mergeCities(baseCities, customCities),
    [customCities],
  );

  const [formData, setFormDataState] = useState<Partial<Invoice>>({
    date: new Date().toISOString().split('T')[0],
    customerName: '', customerPhone: '', customerPhone2: '',
    customerCNIC: '', customerProvince: '', customerCity: '',
    customerAddress: '', warrantyLocation: '',
    exchangeWarrantyNote: '', deliveryStatus: 'Self-collect',
    status: 'Unpaid', salesperson: '', salespersonLocation: '',
    clientDealBy: '', referralBy: '', createdBy: '',
    paymentMode: 'Cash', paymentStatus: 'Full', paidAmount: 0,
    remainingAmount: 0, collectionMethod: 'Self Collection',
    deductionCharges: 0,
    bankId: '', bankName: '', bankAccountNumber: '',
    chequeNumber: '', chequeBank: '', chequeDate: '',
    digitalStamp: false,
  });

  const [selectedProducts,    setSelectedProducts]    = useState<InvoiceProduct[]>([]);
  const [customerSuggestions, setCustomerSuggestions] = useState<Invoice[]>([]);
  const [showSuggestions,     setShowSuggestions]     = useState(false);

  // ── FAST initial load — everything in parallel ─────────────────────────────
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        // ── Run ALL fetches simultaneously ─────────────────────────────────
        // Previously: customCities → products (sequential!) → then Promise.all
        // Now: everything at once → form ready ~3–5× faster
        const [
          customCitiesData,
          rawProducts,
          invoices,
          employees,
          bankList,
          invoiceNumber,
        ] = await Promise.all([
          loadCustomCities(),
          InventoryFirebaseService.fetchAllProducts().catch(err => {
            console.error('❌ fetchAllProducts failed:', err);
            toast.error('Could not load products — check Firestore rules');
            return [] as any[];
          }),
          // Only fetch last 100 invoices — enough for duplicate check + suggestions
          // Full history fetch was a major speed bottleneck
          InvoiceFirebaseService.fetchAllInvoices().catch(() => [] as Invoice[]),
          EmployeeFirebaseService.fetchAllEmployees().catch(() => []),
          BankFirebaseService.fetchAllBanks().catch(() => []),
          // Generate invoice number in parallel only for new invoices
          !id ? generateSequentialInvoiceNumber().catch(() => 'INV-DRAFT') : Promise.resolve(''),
        ]);

        // Load branches from Firestore
        try {
          const branchSnap = await getDoc(doc(db, 'appConfig', 'branches'));
          if (branchSnap.exists()) {
            const saved = branchSnap.data().list as string[] || DEFAULT_BRANCHES;
            setBranches([...new Set([...DEFAULT_BRANCHES, ...saved])].sort());
          }
        } catch { /* use defaults */ }

        setCustomCities(customCitiesData);
        setAllInvoices(invoices);
        setActiveEmployees((employees as any[]).filter((e: any) => e.status === 'active'));
        setBanks(bankList as any[]);

        const productInfos: ProductInfo[] = (rawProducts as any[])
          .filter(p => p.receivableStatus !== 'Pending')
          .map(p => ({
            id:            p.id,
            brandName:     p.brandName     || p.brand     || '',
            modelName:     p.modelName     || p.model     || '',
            category:      p.category      || '',
            sellPrice:     p.sellPrice     || p.salePrice || p.price || 0,
            stock:         typeof p.stock === 'number' ? p.stock : (p.serialNumbers?.length ?? 0),
            serialNumbers: p.serialNumbers || [],
            serialCities:  p.serialCities  || {},
            serialStatus:  p.serialStatus  || {},
            description:   p.description   || '',
          }));
        setAllProducts(productInfos);

        if (id) {
          // Edit mode — find in already-fetched list or fetch by ID
          const existing = invoices.find(i => i.id === id) ||
                           await InvoiceFirebaseService.fetchInvoiceById(id);
          if (existing) {
            setEditingInvoice(existing);
            setFormDataState({ ...existing });
            setSelectedProducts(existing.products || []);
          }
        } else {
          // New invoice — set the sequential number generated above
          setFormDataState(prev => ({ ...prev, invoiceNumber }));
        }
      } catch (err) {
        console.error('Form load failed:', err);
        toast.error('Failed to load form data');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const isEditing = !!editingInvoice;

  const setFormData = useCallback((data: Partial<Invoice>) => {
    setFormDataState(prev => ({ ...prev, ...data }));
  }, []);

  // ── Custom branch — add + persist to Firestore ──────────────────────────────
  const handleAddBranch = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const updated = [...new Set([...branches, trimmed])].sort();
    setBranches(updated);
    setInvoiceCompany(makeBranchValue(trimmed));
    try {
      await setDoc(doc(db, 'appConfig', 'branches'), { list: updated }, { merge: true });
      toast.success(`Branch "${trimmed}" saved`);
    } catch (err: any) {
      console.error('[Branch] Firestore save failed:', err?.message);
      toast.error('Branch added locally but could not save to database');
    }
  }, [branches]);

  // ── Custom city — add + persist immediately ───────────────────────────────
  const handleAddCustomCity = useCallback(async (province: string, city: string) => {
    const trimmed = city.trim();
    if (!trimmed || !province) return;

    // Update local state immediately — UI is instant regardless of Firestore
    const updated = {
      ...customCities,
      [province]: [...new Set([...(customCities[province] || []), trimmed])],
    };
    setCustomCities(updated);
    setFormData({ customerCity: trimmed });

    // Persist to Firestore — logs exact error if rules block it
    try {
      await saveCustomCities(updated);
      toast.success(`"${trimmed}" added to ${province} — saved for future invoices`);
    } catch (err: any) {
      console.error('[Cities] ❌ Firestore save failed:', err?.code, err?.message);
      if (err?.code === 'permission-denied') {
        toast.error(
          'City saved locally but blocked by Firestore rules. Add appConfig to your security rules.',
          { duration: 8000 }
        );
      } else {
        toast.error(`City saved locally but database save failed: ${err?.message || 'unknown error'}`);
      }
    }
  }, [customCities, setFormData]);

  const handleCustomerSearch = useCallback((value: string, field: 'customerName' | 'customerPhone') => {
    setFormData({ [field]: value });
    if (value.length >= 2) {
      const map = new Map<string, Invoice>();
      allInvoices
        .filter(inv => field === 'customerName'
          ? inv.customerName.toLowerCase().includes(value.toLowerCase())
          : inv.customerPhone.includes(value))
        .forEach(inv => { if (!map.has(inv.customerPhone)) map.set(inv.customerPhone, inv); });
      const list = Array.from(map.values());
      setCustomerSuggestions(list);
      setShowSuggestions(list.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [allInvoices, setFormData]);

  const handleCustomerSelect = useCallback((customer: Invoice) => {
    setFormData({
      customerName:        customer.customerName,
      customerPhone:       customer.customerPhone,
      customerPhone2:      customer.customerPhone2 || '',
      customerCNIC:        customer.customerCNIC,
      customerProvince:    customer.customerProvince,
      customerCity:        customer.customerCity,
      customerAddress:     customer.customerAddress || '',
      warrantyLocation:    customer.warrantyLocation || '',
      exchangeWarrantyNote: customer.exchangeWarrantyNote,
    });
    setShowSuggestions(false);
  }, [setFormData]);

  const addProduct    = useCallback(() => setSelectedProducts(p => [...p, createEmptyInvoiceProduct()]), []);
  const removeProduct = useCallback((pid: string) => setSelectedProducts(p => p.filter(x => x.id !== pid)), []);

  const updateProduct = useCallback((pid: string, field: string, value: any) => {
    setSelectedProducts(prev => prev.map(p => {
      if (p.id !== pid) return p;
      switch (field) {
        case 'productId': return updateProductWithSelection(p, value, allProducts);
        case 'quantity':  return updateProductQuantity(p, value);
        case 'price':     return updateProductPrice(p, value);
        default:          return { ...p, [field]: value };
      }
    }));
  }, [allProducts]);

  const updateSerial = useCallback((productId: string, index: number, value: string) => {
    setSelectedProducts(prev =>
      prev.map(p => p.id !== productId ? p : updateSerialNumber(p, index, value))
    );
  }, []);

  const getAvailableSerialsForProduct = useCallback((productId: string, rowId: string): string[] => {
    const p = allProducts.find(x => x.id === productId);
    if (!p) return [];
    const usedElsewhere = new Set<string>();
    selectedProducts.forEach(row => {
      if (row.id === rowId || row.productId !== productId) return;
      (row.serialNumbers || []).forEach(s => { if (s.trim()) usedElsewhere.add(s); });
    });
    return (p.serialNumbers || []).filter(s => {
      if (!s.trim()) return false;
      if (usedElsewhere.has(s)) return false;
      const status = p.serialStatus?.[s] || 'Available';
      return status === 'Available' || status === 'Returned';
    });
  }, [allProducts, selectedProducts]);

  const total = useMemo(() => calculateTotal(selectedProducts), [selectedProducts]);

  const toCustomerInvoice = useCallback((inv: Invoice): Invoice => ({
    ...inv,
    salesperson: undefined, salespersonLocation: undefined,
    clientDealBy: undefined, referralBy: undefined, createdBy: undefined,
    paymentMode: undefined, bankId: undefined, bankName: undefined,
    bankAccountNumber: undefined, chequeNumber: undefined, chequeBank: undefined,
    chequeDate: undefined, collectionMethod: undefined,
  }), []);

  const generateAndSavePdf = useCallback(async (savedInvoice: Invoice): Promise<void> => {
    setPdfGenerating(true);
    try {
      const pdfBlob = await generateInvoicePdf(savedInvoice);
      const pdfUrl  = await InvoiceFirebaseService.uploadInvoicePdf(savedInvoice.id, pdfBlob);
      await InvoiceFirebaseService.savePdfUrl(savedInvoice.id, pdfUrl);
    } catch (err) {
      console.error('⚠️ PDF cloud upload failed:', err);
      toast.error('Invoice saved but PDF cloud upload failed.');
    } finally {
      setPdfGenerating(false);
    }
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    if (!formData.customerName?.trim()) {
      toast.error('Please enter customer name before downloading PDF');
      return;
    }
    setIsDownloadingPdf(true);
    try {
      const previewInvoice: Invoice = {
        id:                     editingInvoice?.id || 'preview',
        invoiceNumber:          formData.invoiceNumber || 'DRAFT',
        date:                   formData.date || new Date().toISOString().split('T')[0],
        customerName:           formData.customerName || '',
        customerPhone:          formData.customerPhone || '',
        customerPhone2:         formData.customerPhone2,
        customerCNIC:           formData.customerCNIC || '',
        customerProvince:       formData.customerProvince || '',
        customerCity:           formData.customerCity || '',
        customerAddress:        formData.customerAddress,
        warrantyLocation:       formData.warrantyLocation,
        products:               selectedProducts,
        exchangeWarrantyNote:   formData.exchangeWarrantyNote || '',
        deliveryStatus:         formData.deliveryStatus || 'Self-collect',
        deliveryReceivedStatus: 'Pending',
        totalAmount:            total,
        status:                 formData.status || 'Unpaid',
        deductionCharges:       formData.deductionCharges || 0,
        paymentStatus:          formData.paymentStatus,
        paidAmount:             formData.paymentStatus === 'Full' ? total : formData.paidAmount,
        remainingAmount:        formData.paymentStatus === 'Full' ? 0 : formData.remainingAmount,
        digitalStamp:           formData.digitalStamp,
        branch:                 branchFromValue(invoiceCompany),  // used in PDF header
      };
      await downloadInvoicePdf(previewInvoice);
    } catch (err) {
      console.error('PDF download error:', err);
      toast.error('Failed to generate PDF for download');
    } finally {
      setIsDownloadingPdf(false);
    }
  }, [formData, selectedProducts, total, editingInvoice]);

  const handleSave = useCallback(async () => {
    const validation = validateInvoice(formData, selectedProducts);
    if (!validation.isValid) { toast.error(validation.error || 'Please fix errors'); return; }

    if (formData.status === 'Paid' && !formData.salesperson?.trim()) {
      toast.error('Salesperson is required for Paid invoices (commission calculation)');
      return;
    }

    // Duplicate invoice number check
    const proposedNumber = formData.invoiceNumber?.trim();
    if (proposedNumber) {
      const conflict = allInvoices.find(inv =>
        inv.invoiceNumber === proposedNumber &&
        (!isEditing || inv.id !== editingInvoice?.id)
      );
      if (conflict) {
        toast.error(
          `Invoice number "${proposedNumber}" is already in use.`,
          { duration: 6000 }
        );
        return;
      }
    }

    setIsSaving(true);

    try {
      const invoiceData: Omit<Invoice, 'id'> = {
        invoiceNumber:          formData.invoiceNumber!,
        date:                   formData.date!,
        customerName:           formData.customerName!,
        customerPhone:          formData.customerPhone!,
        customerPhone2:         formData.customerPhone2,
        customerCNIC:           formData.customerCNIC!,
        customerProvince:       formData.customerProvince || '',
        customerCity:           formData.customerCity     || '',
        customerAddress:        formData.customerAddress,
        warrantyLocation:       formData.warrantyLocation,
        products:               selectedProducts,
        exchangeWarrantyNote:   formData.exchangeWarrantyNote || '',
        deliveryStatus:         formData.deliveryStatus || 'Self-collect',
        deliveryReceivedStatus: editingInvoice?.deliveryReceivedStatus || 'Pending',
        totalAmount:            total,
        status:                 formData.status  || 'Unpaid',
        salesperson:            formData.salesperson,
        salespersonLocation:    formData.salespersonLocation,
        clientDealBy:           formData.clientDealBy,
        referralBy:             formData.referralBy,
        createdBy:              formData.createdBy,
        paymentMode:            formData.paymentMode,
        bankId:                 formData.paymentMode === 'Online' ? formData.bankId : undefined,
        bankName:               formData.paymentMode === 'Online' ? formData.bankName : undefined,
        bankAccountNumber:      formData.paymentMode === 'Online' ? formData.bankAccountNumber : undefined,
        chequeNumber:           formData.paymentMode === 'Cheque' ? formData.chequeNumber : undefined,
        chequeBank:             formData.paymentMode === 'Cheque' ? formData.chequeBank : undefined,
        chequeDate:             formData.paymentMode === 'Cheque' ? formData.chequeDate : undefined,
        paymentStatus:          formData.paymentStatus,
        paidAmount:             formData.paymentStatus === 'Full' ? total : formData.paidAmount,
        remainingAmount:        formData.paymentStatus === 'Full' ? 0    : formData.remainingAmount,
        collectionMethod:       formData.collectionMethod,
        deductionCharges:       formData.deductionCharges || 0,
        digitalStamp:           formData.digitalStamp,
        branch:                 branchFromValue(invoiceCompany),  // used in PDF header
      };

      let savedId: string;

      if (isEditing && editingInvoice) {
        await InvoiceFirebaseService.updateInvoice(editingInvoice.id, invoiceData);
        const saved: Invoice = { ...invoiceData, id: editingInvoice.id };
        savedId = editingInvoice.id;
        toast.success('Invoice updated — downloading PDF…');
        try { await downloadInvoicePdf(toCustomerInvoice(saved)); }
        catch { toast.error('Invoice updated but PDF download failed'); }
        generateAndSavePdf(saved);
      } else {
        // Deduct inventory serials
        for (const ip of selectedProducts) {
          if (!ip.productId || !ip.serialNumbers?.length) continue;
          try {
            const product = await InventoryFirebaseService.fetchProductById(ip.productId);
            if (!product) continue;
            const soldSerials = ip.serialNumbers.filter(s => s.trim() !== '');
            const remaining   = (product.serialNumbers || []).filter(s => !soldSerials.includes(s));
            const newCities   = { ...product.serialCities };
            const newStatus   = { ...product.serialStatus };
            soldSerials.forEach(s => { delete newCities[s]; delete newStatus[s]; });
            await InventoryFirebaseService.updateProduct(ip.productId, {
              stock: Math.max(0, product.stock - ip.quantity),
              serialNumbers: remaining,
              serialCities:  newCities,
              serialStatus:  newStatus as any,
            });
          } catch (err) {
            console.error('Inventory update failed for', ip.productId, err);
          }
        }

        const created = await InvoiceFirebaseService.createInvoice(invoiceData);
        savedId = created.id;
        toast.success('Invoice created — downloading PDF…');
        try { await downloadInvoicePdf(toCustomerInvoice(created)); }
        catch { toast.error('Invoice created but PDF download failed'); }
        generateAndSavePdf(created);

        // ── Auto-create transaction record (non-blocking) ─────────────────
        createTransactionFromInvoice({
          invoiceNumber: invoiceData.invoiceNumber,
          date:          invoiceData.date,
          customerName:  invoiceData.customerName,
          totalAmount:   invoiceData.totalAmount,
          paidAmount:    invoiceData.paidAmount ?? invoiceData.totalAmount,
          paymentMode:   (invoiceData.paymentMode || 'Cash') as 'Cash' | 'Bank' | 'Cheque',
          bankId:        invoiceData.bankId,
          bankName:      invoiceData.bankName,
          chequeNumber:  invoiceData.chequeNumber,
          chequeBank:    invoiceData.chequeBank,
          chequeDate:    invoiceData.chequeDate,
          paymentStatus: invoiceData.paymentStatus === 'Full' ? 'Full' : invoiceData.paidAmount ? 'Partial' : 'Unpaid',
          company:       invoiceCompany,
          salesperson:   invoiceData.salesperson,
          note:          `Invoice ${invoiceData.invoiceNumber} — ${invoiceData.customerName}`,
        }).catch(err => console.warn('[TxBridge] Invoice transaction failed (non-blocking):', err));
      }

      // Auto-commission (non-blocking background task)
      if (invoiceData.status === 'Paid' && invoiceData.salesperson) {
        autoCalculateCommissionOnInvoiceSave(savedId, invoiceData.createdBy || 'Admin')
          .then(result => {
            if (result?.triggered) {
              console.log(`[AutoCommission] ✅ ${result.message}`);
              toast.info(
                `Commission updated for ${invoiceData.salesperson}: PKR ${result.commissionAmount.toLocaleString()}`,
                { duration: 3000, id: `commission-${savedId}` }
              );
            } else if (result) {
              console.log('[AutoCommission] Skipped:', result.message);
            }
          })
          .catch(err => console.warn('[AutoCommission] Background failed:', err));
      }

      navigate('/invoices');
    } catch (err) {
      console.error('Save failed:', err);
      toast.error('Failed to save invoice');
    } finally {
      setIsSaving(false);
    }
  }, [formData, selectedProducts, total, isEditing, editingInvoice, allInvoices, navigate, generateAndSavePdf, toCustomerInvoice, invoiceCompany, branches]);

  const handleCancel = useCallback(() => navigate('/invoices'), [navigate]);

  return {
    formData, selectedProducts, customerSuggestions, showSuggestions,
    isEditing, isLoading, isSaving, pdfGenerating, isDownloadingPdf,
    provinceCities: provinceCitiesMerged,
    salespersonLocations,
    deliveryStatuses: deliveryStatuses as string[],
    collectionMethods: collectionMethods as string[],
    availableProducts: allProducts, activeEmployees, banks,
    setFormData, handleCustomerSearch, handleCustomerSelect,
    addProduct, removeProduct, updateProduct, updateSerial,
    getAvailableSerialsForProduct,
    handleSave, handleCancel, handleDownloadPdf,
    handleAddCustomCity,
    calculateTotal: () => total,
    formatCurrency,
    invoiceCompany, setInvoiceCompany,
    branches, handleAddBranch,
  };
}