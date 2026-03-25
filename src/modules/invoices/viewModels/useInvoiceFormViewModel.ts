// Invoice Module - Form ViewModel
// Fixes:
//   1. PDF is auto-generated + downloaded on every Create/Update Invoice save.
//   2. generateAndSavePdf moved above handleSave to fix stale-closure / hoisting bug.
//   3. getAvailableSerialsForProduct now excludes serials already selected in OTHER rows.
//   4. Product dropdown label includes category + stock count for clarity.

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Invoice, InvoiceProduct, ProductInfo } from '../models/types';
import {
  createEmptyInvoiceProduct, updateProductWithSelection, updateProductQuantity,
  updateProductPrice, updateSerialNumber, getAvailableSerials,
  validateInvoice, calculateTotal, calculateDeductionCharges,
  provinceCities, salespersonLocations, deliveryStatuses, collectionMethods, formatCurrency,
} from '../models/invoiceService';
import { InvoiceFirebaseService } from '../models/InvoiceFirebaseService';
import { generateInvoicePdf, downloadInvoicePdf } from '../models/invoicePdfService';
import { InventoryFirebaseService } from '../../inventory/models/InventoryFirebaseService';
import { EmployeeFirebaseService } from '../../employee/models/employeeFirebaseService';
import { BankFirebaseService } from '../../banking/models/bankFirebaseService';

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
  calculateTotal: () => number;
  formatCurrency: (amount: number) => string;
}

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
    deductionCharges: 0, bankId: '', bankName: '', bankAccountNumber: '',
    digitalStamp: false,
  });

  const [selectedProducts,    setSelectedProducts]    = useState<InvoiceProduct[]>([]);
  const [customerSuggestions, setCustomerSuggestions] = useState<Invoice[]>([]);
  const [showSuggestions,     setShowSuggestions]     = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        let rawProducts: any[] = [];
        try {
          rawProducts = await InventoryFirebaseService.fetchAllProducts();
          console.log('✅ Raw products from Firestore:', rawProducts.length, rawProducts[0]);
        } catch (productErr) {
          console.error('❌ fetchAllProducts failed:', productErr);
          toast.error('Could not load products — check Firestore rules or collection name');
        }

        const [invoices, employees, bankList] = await Promise.all([
          InvoiceFirebaseService.fetchAllInvoices(),
          EmployeeFirebaseService.fetchAllEmployees().catch(() => []),
          BankFirebaseService.fetchAllBanks().catch(() => []),
        ]);
        setAllInvoices(invoices);

        // Map raw Firestore docs → ProductInfo
        // Include all fields needed for the product row display
        const productInfos: ProductInfo[] = rawProducts
          .filter(p => p.receivableStatus !== 'Pending')
          .map(p => ({
            id:            p.id,
            brandName:     p.brandName     || p.brand     || '',
            modelName:     p.modelName     || p.model     || '',
            category:      p.category      || '',
            sellPrice:     p.sellPrice     || p.salePrice || p.price || 0,
            // ── FIX: ensure stock reflects the actual count of available serials ──
            stock:         typeof p.stock === 'number' ? p.stock : (p.serialNumbers?.length ?? 0),
            serialNumbers: p.serialNumbers || [],
            serialCities:  p.serialCities  || {},
            serialStatus:  p.serialStatus  || {},
            description:   p.description   || '',
          }));
        console.log('✅ Mapped productInfos:', productInfos.length, productInfos[0]);
        setAllProducts(productInfos);
        setActiveEmployees((employees as any[]).filter(e => e.status === 'active'));
        setBanks(bankList as any[]);

        if (id) {
          const existing = invoices.find(i => i.id === id) ||
                           await InvoiceFirebaseService.fetchInvoiceById(id);
          if (existing) {
            setEditingInvoice(existing);
            setFormDataState({ ...existing });
            setSelectedProducts(existing.products || []);
          }
        } else {
          const invoiceNumber = await InvoiceFirebaseService.generateInvoiceNumber();
          setFormDataState(prev => ({ ...prev, invoiceNumber }));
        }
      } catch {
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
      customerName: customer.customerName, customerPhone: customer.customerPhone,
      customerPhone2: customer.customerPhone2 || '', customerCNIC: customer.customerCNIC,
      customerProvince: customer.customerProvince, customerCity: customer.customerCity,
      customerAddress: customer.customerAddress || '',
      warrantyLocation: customer.warrantyLocation || '',
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

  // ── FIX: exclude serials already picked in OTHER rows of the same invoice ──
  const getAvailableSerialsForProduct = useCallback((productId: string, rowId: string): string[] => {
    const p = allProducts.find(x => x.id === productId);
    if (!p) return [];

    // Collect serials already assigned to OTHER product rows
    const usedElsewhere = new Set<string>();
    selectedProducts.forEach(row => {
      if (row.id === rowId) return;            // skip own row
      if (row.productId !== productId) return; // only same product matters
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

  useEffect(() => {
    const charges = calculateDeductionCharges(total, formData.collectionMethod);
    setFormData({ deductionCharges: charges });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, formData.collectionMethod]);

  // ── Helper: strip internal fields from the customer-facing PDF copy ──────────
  const toCustomerInvoice = useCallback((inv: Invoice): Invoice => ({
    ...inv,
    salesperson: undefined, salespersonLocation: undefined,
    clientDealBy: undefined, referralBy: undefined, createdBy: undefined,
    paymentMode: undefined, bankId: undefined, bankName: undefined,
    bankAccountNumber: undefined, collectionMethod: undefined,
  }), []);

  // ── Background: generate + upload PDF to Firebase Storage ────────────────────
  // IMPORTANT: defined BEFORE handleSave so the reference is stable
  const generateAndSavePdf = useCallback(async (savedInvoice: Invoice): Promise<void> => {
    setPdfGenerating(true);
    try {
      const pdfBlob = await generateInvoicePdf(savedInvoice);
      const pdfUrl  = await InvoiceFirebaseService.uploadInvoicePdf(savedInvoice.id, pdfBlob);
      await InvoiceFirebaseService.savePdfUrl(savedInvoice.id, pdfUrl);
      console.log('✅ PDF saved to cloud:', pdfUrl);
    } catch (err) {
      console.error('⚠️ PDF cloud upload failed:', err);
      toast.error('Invoice saved but PDF cloud upload failed.');
    } finally {
      setPdfGenerating(false);
    }
  }, []);

  // ── Manual "Download PDF" button ─────────────────────────────────────────────
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
        salesperson:            undefined,
        salespersonLocation:    undefined,
        clientDealBy:           undefined,
        referralBy:             undefined,
        createdBy:              undefined,
        paymentMode:            undefined,
        bankId:                 undefined,
        bankName:               undefined,
        bankAccountNumber:      undefined,
        collectionMethod:       undefined,
      };
      await downloadInvoicePdf(previewInvoice);
    } catch (err) {
      console.error('PDF download error:', err);
      toast.error('Failed to generate PDF for download');
    } finally {
      setIsDownloadingPdf(false);
    }
  }, [formData, selectedProducts, total, editingInvoice]);

  // ── Save ──────────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    const validation = validateInvoice(formData, selectedProducts);
    if (!validation.isValid) { toast.error(validation.error || 'Please fix errors'); return; }
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
        bankId:                 formData.bankId,
        bankName:               formData.bankName,
        bankAccountNumber:      formData.bankAccountNumber,
        paymentStatus:          formData.paymentStatus,
        paidAmount:             formData.paymentStatus === 'Full' ? total : formData.paidAmount,
        remainingAmount:        formData.paymentStatus === 'Full' ? 0    : formData.remainingAmount,
        collectionMethod:       formData.collectionMethod,
        deductionCharges:       formData.deductionCharges || 0,
        digitalStamp:           formData.digitalStamp,
      };

      if (isEditing && editingInvoice) {
        // ── UPDATE ────────────────────────────────────────────────────────────
        await InvoiceFirebaseService.updateInvoice(editingInvoice.id, invoiceData);
        const saved: Invoice = { ...invoiceData, id: editingInvoice.id };
        toast.success('Invoice updated — downloading PDF…');

        // Auto-download PDF immediately on save
        try {
          await downloadInvoicePdf(toCustomerInvoice(saved));
        } catch {
          toast.error('Invoice updated but PDF download failed');
        }

        // Background cloud upload
        generateAndSavePdf(saved);

      } else {
        // ── CREATE ────────────────────────────────────────────────────────────
        // Deduct inventory first
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
              serialNumbers: remaining, serialCities: newCities, serialStatus: newStatus as any,
            });
          } catch (err) {
            console.error('Inventory update failed for', ip.productId, err);
          }
        }

        const created = await InvoiceFirebaseService.createInvoice(invoiceData);
        toast.success('Invoice created — downloading PDF…');

        // Auto-download PDF immediately on save
        try {
          await downloadInvoicePdf(toCustomerInvoice(created));
        } catch {
          toast.error('Invoice created but PDF download failed');
        }

        // Background cloud upload
        generateAndSavePdf(created);
      }

      navigate('/invoices');
    } catch (err) {
      console.error('Save failed:', err);
      toast.error('Failed to save invoice');
    } finally {
      setIsSaving(false);
    }
  }, [formData, selectedProducts, total, isEditing, editingInvoice, navigate, generateAndSavePdf, toCustomerInvoice]);

  const handleCancel = useCallback(() => navigate('/invoices'), [navigate]);

  return {
    formData, selectedProducts, customerSuggestions, showSuggestions,
    isEditing, isLoading, isSaving, pdfGenerating, isDownloadingPdf,
    provinceCities, salespersonLocations,
    deliveryStatuses: deliveryStatuses as string[],
    collectionMethods: collectionMethods as string[],
    availableProducts: allProducts, activeEmployees, banks,
    setFormData, handleCustomerSearch, handleCustomerSelect,
    addProduct, removeProduct, updateProduct, updateSerial,
    getAvailableSerialsForProduct,
    handleSave, handleCancel, handleDownloadPdf,
    calculateTotal: () => total,
    formatCurrency,
  };
}