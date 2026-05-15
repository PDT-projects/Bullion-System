// Invoice Module - Form ViewModel
// CHANGES:
//   - Replaced Province/City with Country/City
//     • Countries+cities are free-text entries persisted to Firestore (appConfig/countryCities)
//     • Previously used combos appear in dropdowns for the next invoice
//   - Commission auto-calculation wired through internal fields
//   - FIX: navigate('/invoices') is now delayed by 300 ms after downloadInvoicePdf()
//     so the browser anchor-click has time to execute before the component unmounts.

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
  salespersonLocations, deliveryStatuses,
  collectionMethods, formatCurrency, InvoiceCurrency,
} from '../models/invoiceService';
import { InvoiceFirebaseService } from '../models/InvoiceFirebaseService';
import { generateInvoicePdf, downloadInvoicePdf } from '../models/invoicePdfService';
import { InventoryFirebaseService } from '../../inventory/models/InventoryFirebaseService';
import { EmployeeFirebaseService } from '../../employee/models/employeeFirebaseService';
import { BankFirebaseService } from '../../banking/models/bankFirebaseService';
import { autoCalculateCommissionOnInvoiceSave } from '../../commission/models/Commissionautoservice';
import { createTransactionFromInvoice, TxCompany } from '../../transactions/models/TransactionBridgeService';

// Default branches — always available even before Firestore loads
export const DEFAULT_BRANCHES = ['Saudia', 'Chad'];
const COMPANY_PREFIX = 'Pakistan Detector Technologies Pvt. Ltd - ';

export function makeBranchValue(branch: string): TxCompany {
  return `${COMPANY_PREFIX}${branch}` as TxCompany;
}
export function branchFromValue(value: string): string {
  return value.replace(COMPANY_PREFIX, '');
}

export function getCurrencyFromBranch(branch: string): InvoiceCurrency {
  switch (branch) {
    case 'Saudia': return 'SAR';
    case 'Chad': return 'CAD';
    default: return 'PKR';
  }
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
  // Country/City (replaces province/city)
  savedCountries: string[];
  savedCitiesForCountry: (country: string) => string[];
  handleAddCountryCity: (country: string, city: string) => Promise<void>;
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
  calculateTotal: () => number;
  formatCurrency: (amount: number) => string;
  invoiceCompany: TxCompany;
  setInvoiceCompany: (v: TxCompany) => void;
  branches: string[];
  handleAddBranch: (name: string) => Promise<void>;
  salespersonLocationsList: string[];
  handleAddSalespersonLocation: (name: string) => Promise<void>;
  selectedCurrencies: InvoiceCurrency[];
  toggleCurrency: (c: InvoiceCurrency) => void;
}

// ── Sequential invoice number generator ───────────────────────────────────────
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
      tx.set(counterRef, { date: today, seq: 1 });
      return 1;
    }
    const next = (snap.data().seq as number) + 1;
    tx.update(counterRef, { seq: next });
    return next;
  });

  return `INV-${today}-${String(seq).padStart(3, '0')}`;
}

// ── Country/City persistence ──────────────────────────────────────────────────
// Firestore doc: appConfig/countryCities  { "Pakistan": ["Islamabad","Lahore"], "UAE": [...] }
async function loadCountryCities(): Promise<Record<string, string[]>> {
  try {
    const snap = await getDoc(doc(db, 'appConfig', 'countryCities'));
    if (snap.exists()) return snap.data() as Record<string, string[]>;
    return {};
  } catch (err) {
    console.error('[CountryCities] load failed:', err);
    return {};
  }
}

async function saveCountryCities(data: Record<string, string[]>): Promise<void> {
  await setDoc(doc(db, 'appConfig', 'countryCities'), data, { merge: true });
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
  const [invoiceCompany,   setInvoiceCompany]   = useState<TxCompany>(makeBranchValue(DEFAULT_BRANCHES[0]));
  const [branches,         setBranches]         = useState<string[]>(DEFAULT_BRANCHES);
  const [salespersonLocationsList, setSalespersonLocationsList] = useState<string[]>(salespersonLocations);
  const [selectedCurrencies, setSelectedCurrencies] = useState<InvoiceCurrency[]>(['PKR']);

  // Country/City state (replaces province/city)
  const [countryCities, setCountryCities] = useState<Record<string, string[]>>({});

  const savedCountries = useMemo(() => Object.keys(countryCities).sort(), [countryCities]);
  const savedCitiesForCountry = useCallback(
    (country: string) => countryCities[country] || [],
    [countryCities],
  );

  const [formData, setFormDataState] = useState<Partial<Invoice>>({
    date: new Date().toISOString().split('T')[0],
    customerName: '', customerPhone: '', customerPhone2: '',
    customerCNIC: '',
    customerProvince: '', // repurposed as country
    customerCity: '',
    customerAddress: '', warrantyLocation: '',
    exchangeWarrantyNote: '', deliveryStatus: 'Self-collect',
    status: 'Unpaid', salesperson: '', salespersonLocation: '',
    clientDealBy: '', referralBy: '', createdBy: '',
    paymentMode: 'Cash', paymentStatus: 'Full', paidAmount: 0,
    remainingAmount: 0, collectionMethod: 'Self Collection',
    deductionCharges: 0,
    cargoAmount: 0, customsAmount: 0, agentDetails: '', agentAmount: 0,
    bankId: '', bankName: '', bankAccountNumber: '',
    chequeNumber: '', chequeBank: '', chequeDate: '',
    digitalStamp: false,
  });

  const [selectedProducts,    setSelectedProducts]    = useState<InvoiceProduct[]>([]);
  const [customerSuggestions, setCustomerSuggestions] = useState<Invoice[]>([]);
  const [showSuggestions,     setShowSuggestions]     = useState(false);

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [
          countryCitiesData,
          rawProducts,
          invoices,
          employees,
          bankList,
          invoiceNumber,
          branchSnap,
          spLocSnap,
        ] = await Promise.all([
          loadCountryCities(),
          InventoryFirebaseService.fetchAllProducts().catch(err => {
            console.error('fetchAllProducts failed:', err);
            toast.error('Could not load products — check Firestore rules');
            return [] as any[];
          }),
          InvoiceFirebaseService.fetchAllInvoices().catch(() => [] as Invoice[]),
          EmployeeFirebaseService.fetchAllEmployees().catch(() => []),
          BankFirebaseService.fetchAllBanks().catch(() => []),
          !id ? generateSequentialInvoiceNumber().catch(() => 'INV-DRAFT') : Promise.resolve(''),
          getDoc(doc(db, 'appConfig', 'branches')).catch(() => null),
          getDoc(doc(db, 'appConfig', 'salespersonLocations')).catch(() => null),
        ]);

        if (branchSnap && branchSnap.exists()) {
          const saved = (branchSnap.data().list as string[]) || DEFAULT_BRANCHES;
          setBranches([...new Set([...DEFAULT_BRANCHES, ...saved])].sort());
        }
        if (spLocSnap && spLocSnap.exists()) {
          const saved = (spLocSnap.data().list as string[]) || salespersonLocations;
          setSalespersonLocationsList([...new Set([...salespersonLocations, ...saved])].sort());
        }

        setCountryCities(countryCitiesData);
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
          const existing = invoices.find(i => i.id === id) ||
                           await InvoiceFirebaseService.fetchInvoiceById(id);
          if (existing) {
            setEditingInvoice(existing);
            setFormDataState({ ...existing });
            setSelectedProducts(existing.products || []);
            setSelectedCurrencies(existing.selectedCurrencies || ['PKR']);

            // Ensure the country this invoice uses is in the saved list
            if (existing.customerProvince && existing.customerCity) {
              setCountryCities(prev => {
                const key = existing.customerProvince;
                const cities = [...new Set([...(prev[key] || []), existing.customerCity])];
                return { ...prev, [key]: cities };
              });
            }
          }
        } else {
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
  const TODAY = useMemo(() => new Date().toISOString().split('T')[0], []);

  const setFormData = useCallback((data: Partial<Invoice>) => {
    setFormDataState(prev => ({
      ...prev,
      ...data,
      ...(!isEditing ? { date: TODAY } : {}),
    }));
  }, [isEditing, TODAY]);

  // ── Add country+city and persist ──────────────────────────────────────────
  const handleAddCountryCity = useCallback(async (country: string, city: string) => {
    const c  = country.trim();
    const ci = city.trim();
    if (!c) return;

    // '__COUNTRY_ONLY__' is a sentinel used when registering a new country
    // without a city yet — filter it out from the stored cities list.
    const isCountryOnly = ci === '__COUNTRY_ONLY__' || ci === '';

    const existingCities = countryCities[c] || [];
    const newCities = isCountryOnly
      ? existingCities  // keep existing, just ensure the country key exists
      : [...new Set([...existingCities, ci])].sort();

    const updated = { ...countryCities, [c]: newCities };
    setCountryCities(updated);

    if (!isCountryOnly) {
      setFormData({ customerProvince: c, customerCity: ci });
    }

    try {
      await saveCountryCities(updated);
      if (!isCountryOnly) {
        toast.success(`"${ci}, ${c}" saved for future invoices`);
      } else {
        toast.success(`Country "${c}" saved — now add a city`);
      }
    } catch (err: any) {
      console.error('[CountryCities] Firestore save failed:', err?.message);
      toast.error('Saved locally but database write failed');
    }
  }, [countryCities, setFormData]);

  // ── Branch ─────────────────────────────────────────────────────────────────
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
      toast.error('Branch added locally but could not save to database');
    }
  }, [branches]);

  // ── Salesperson location ───────────────────────────────────────────────────
  const handleAddSalespersonLocation = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const updated = [...new Set([...salespersonLocationsList, trimmed])].sort();
    setSalespersonLocationsList(updated);
    try {
      await setDoc(doc(db, 'appConfig', 'salespersonLocations'), { list: updated }, { merge: true });
      toast.success(`Location "${trimmed}" saved`);
    } catch (err: any) {
      toast.error('Location added locally but could not save to database');
    }
  }, [salespersonLocationsList]);

  // ── Multi-currency ─────────────────────────────────────────────────────────
  const toggleCurrency = useCallback((c: InvoiceCurrency) => {
    setSelectedCurrencies(prev =>
      prev.includes(c) ? (prev.length > 1 ? prev.filter(x => x !== c) : prev) : [...prev, c]
    );
  }, []);

  // ── Customer search / select ───────────────────────────────────────────────
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
      customerProvince:    customer.customerProvince, // country stored here
      customerCity:        customer.customerCity,
      customerAddress:     customer.customerAddress || '',
      warrantyLocation:    customer.warrantyLocation || '',
      exchangeWarrantyNote: customer.exchangeWarrantyNote,
    });
    setShowSuggestions(false);
  }, [setFormData]);

  // ── Products ───────────────────────────────────────────────────────────────
  const addProduct    = useCallback(() => {
    const branch = branchFromValue(invoiceCompany);
    const currency = getCurrencyFromBranch(branch);
    const product = createEmptyInvoiceProduct();
    product.currency = currency;
    setSelectedProducts(p => [...p, product]);
  }, [invoiceCompany]);
  const removeProduct = useCallback((pid: string) => setSelectedProducts(p => p.filter(x => x.id !== pid)), []);

  const updateProduct = useCallback((pid: string, field: string, value: any) => {
    setSelectedProducts(prev => prev.map(p => {
      if (p.id !== pid) return p;
      switch (field) {
        case 'productId': {
          const updated = updateProductWithSelection(p, value, allProducts);
          const branch = branchFromValue(invoiceCompany);
          const currency = getCurrencyFromBranch(branch);
          return { ...updated, currency };
        }
        case 'quantity':  return updateProductQuantity(p, value);
        case 'price':     return updateProductPrice(p, value);
        default:          return { ...p, [field]: value };
      }
    }));
  }, [allProducts, invoiceCompany]);

  const updateSerial = useCallback((productId: string, index: number, value: string) => {
    setSelectedProducts(prev =>
      prev.map(p => p.id !== productId ? p : updateSerialNumber(p, index, value))
    );
  }, []);

  // Update selectedCurrencies based on products' currencies
  useEffect(() => {
    const currencies = new Set<InvoiceCurrency>();
    selectedProducts.forEach(p => {
      if (p.productId) currencies.add(p.currency); // only count selected products
    });
    if (currencies.size > 0) {
      setSelectedCurrencies(Array.from(currencies).sort()); // sort for consistency
    } else {
      // if no products, set to branch currency
      const branch = branchFromValue(invoiceCompany);
      const currency = getCurrencyFromBranch(branch);
      setSelectedCurrencies([currency]);
    }
  }, [selectedProducts, invoiceCompany]);

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

  // ── PDF helpers ────────────────────────────────────────────────────────────
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
      console.error('PDF cloud upload failed:', err);
      toast.error('Invoice saved but PDF cloud upload failed.');
    } finally {
      setPdfGenerating(false);
    }
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    setIsDownloadingPdf(true);
    try {
      const invoiceData: Partial<Invoice> = {
        ...formData,
        products: selectedProducts,
        totalAmount: total,
      };
      await downloadInvoicePdf(toCustomerInvoice(invoiceData as Invoice));
    } catch {
      toast.error('PDF download failed');
    } finally {
      setIsDownloadingPdf(false);
    }
  }, [formData, selectedProducts, total, toCustomerInvoice]);

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    const validation = validateInvoice(formData, selectedProducts);
    if (!validation.isValid) {
      toast.error(validation.error || 'Validation failed');
      return;
    }

    const proposedNumber = formData.invoiceNumber?.trim();
    if (proposedNumber) {
      const conflict = allInvoices.find(inv =>
        inv.invoiceNumber === proposedNumber &&
        (!isEditing || inv.id !== editingInvoice?.id)
      );
      if (conflict) {
        toast.error(`Invoice number "${proposedNumber}" is already in use.`, { duration: 6000 });
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
        customerProvince:       formData.customerProvince || '', // stores country
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
        cargoAmount:            formData.cargoAmount      || 0,
        customsAmount:          formData.customsAmount    || 0,
        agentDetails:           formData.agentDetails     || '',
        agentAmount:            formData.agentAmount      || 0,
        digitalStamp:           formData.digitalStamp,
        branch:                 branchFromValue(invoiceCompany),
        selectedCurrencies:     selectedCurrencies,
      } as any;

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

        // Auto-persist the country+city for future invoices
        if (invoiceData.customerProvince && invoiceData.customerCity) {
          const country = invoiceData.customerProvince;
          const city    = invoiceData.customerCity;
          const updated = {
            ...countryCities,
            [country]: [...new Set([...(countryCities[country] || []), city])].sort(),
          };
          setCountryCities(updated);
          saveCountryCities(updated).catch(console.warn);
        }

        toast.success('Invoice created — downloading PDF…');
        try { await downloadInvoicePdf(toCustomerInvoice(created)); }
        catch { toast.error('Invoice created but PDF download failed'); }
        generateAndSavePdf(created);

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
              toast.info(
                `Commission updated for ${invoiceData.salesperson}: PKR ${result.commissionAmount.toLocaleString()}`,
                { duration: 3000, id: `commission-${savedId}` }
              );
            }
          })
          .catch(err => console.warn('[AutoCommission] Background failed:', err));
      }

      // FIX: Wait 300 ms before navigating away so the browser has time to
      // execute the download anchor click initiated inside downloadInvoicePdf().
      // Without this delay, navigate() unmounts the component immediately and
      // the programmatic click is cancelled before the browser processes it.
      await new Promise<void>(resolve => setTimeout(resolve, 300));
      navigate('/invoices');
    } catch (err) {
      console.error('Save failed:', err);
      toast.error('Failed to save invoice');
    } finally {
      setIsSaving(false);
    }
  }, [formData, selectedProducts, total, isEditing, editingInvoice, allInvoices, countryCities, navigate, generateAndSavePdf, toCustomerInvoice, invoiceCompany]);

  const handleCancel = useCallback(() => navigate('/invoices'), [navigate]);

  return {
    formData, selectedProducts, customerSuggestions, showSuggestions,
    isEditing, isLoading, isSaving, pdfGenerating, isDownloadingPdf,
    savedCountries,
    savedCitiesForCountry,
    handleAddCountryCity,
    salespersonLocations: salespersonLocationsList,
    deliveryStatuses: deliveryStatuses as string[],
    collectionMethods: collectionMethods as string[],
    availableProducts: allProducts, activeEmployees, banks,
    setFormData, handleCustomerSearch, handleCustomerSelect,
    addProduct, removeProduct, updateProduct, updateSerial,
    getAvailableSerialsForProduct,
    handleSave, handleCancel, handleDownloadPdf,
    calculateTotal: () => total,
    formatCurrency,
    invoiceCompany, setInvoiceCompany,
    branches, handleAddBranch,
    salespersonLocationsList,
    handleAddSalespersonLocation,
    selectedCurrencies, toggleCurrency,
  };
}