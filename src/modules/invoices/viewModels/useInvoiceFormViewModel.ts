// Invoice Module - Form ViewModel
// Self-contained: fetches products + employees + banks from Firestore
// Creates/edits invoices, removes sold serials from inventory on save

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
  getAvailableSerialsForProduct: (productId: string) => string[];
  handleSave: () => void;
  handleCancel: () => void;
  calculateTotal: () => number;
  formatCurrency: (amount: number) => string;
}

export function useInvoiceFormViewModel(): UseInvoiceFormViewModelReturn {
  const navigate = useNavigate();
  const { id }   = useParams<{ id: string }>();

  const [allInvoices,    setAllInvoices]    = useState<Invoice[]>([]);
  const [allProducts,    setAllProducts]    = useState<ProductInfo[]>([]);
  const [activeEmployees,setActiveEmployees]= useState<Employee[]>([]);
  const [banks,          setBanks]          = useState<Bank[]>([]);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isLoading,      setIsLoading]      = useState(true);
  const [isSaving,       setIsSaving]       = useState(false);

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

  const [selectedProducts, setSelectedProducts] = useState<InvoiceProduct[]>([]);
  const [customerSuggestions, setCustomerSuggestions] = useState<Invoice[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load everything on mount
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [invoices, products, employees, bankList] = await Promise.all([
          InvoiceFirebaseService.fetchAllInvoices(),
          InventoryFirebaseService.fetchAllProducts(),
          EmployeeFirebaseService.fetchAllEmployees().catch(() => []),
          BankFirebaseService.fetchAllBanks().catch(() => []),
        ]);

        setAllInvoices(invoices);

        // Map inventory products to ProductInfo shape
        const productInfos: ProductInfo[] = products
          .filter(p => p.receivableStatus !== 'Pending')
          .map(p => ({
            id:           p.id,
            brandName:    p.brandName,
            modelName:    p.modelName,
            category:     p.category,
            sellPrice:    p.sellPrice,
            stock:        p.stock,
            serialNumbers:p.serialNumbers || [],
            serialCities: p.serialCities  || {},
            serialStatus: p.serialStatus,
            description:  p.description,
          }));
        setAllProducts(productInfos);
        setActiveEmployees((employees as any[]).filter(e => e.status === 'active'));
        setBanks(bankList as any[]);

        // If editing, load the invoice
        if (id) {
          const existing = invoices.find(i => i.id === id) ||
                           await InvoiceFirebaseService.fetchInvoiceById(id);
          if (existing) {
            setEditingInvoice(existing);
            setFormDataState({ ...existing });
            setSelectedProducts(existing.products || []);
          }
        } else {
          // New invoice — generate number
          const invoiceNumber = await InvoiceFirebaseService.generateInvoiceNumber();
          setFormDataState(prev => ({ ...prev, invoiceNumber }));
        }
      } catch (err) {
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

  // Customer autocomplete
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
  const removeProduct = useCallback((id: string) => setSelectedProducts(p => p.filter(x => x.id !== id)), []);

  const updateProduct = useCallback((id: string, field: string, value: any) => {
    setSelectedProducts(prev => prev.map(p => {
      if (p.id !== id) return p;
      switch (field) {
        case 'productId':  return updateProductWithSelection(p, value, allProducts);
        case 'quantity':   return updateProductQuantity(p, value);
        case 'price':      return updateProductPrice(p, value);
        default:           return { ...p, [field]: value };
      }
    }));
  }, [allProducts]);

  const updateSerial = useCallback((productId: string, index: number, value: string) => {
    setSelectedProducts(prev => prev.map(p => p.id !== productId ? p : updateSerialNumber(p, index, value)));
  }, []);

  const getAvailableSerialsForProduct = useCallback((productId: string): string[] => {
    const usedSerials = allInvoices
      .filter(inv => inv.id !== editingInvoice?.id)
      .flatMap(inv => inv.products.flatMap(p => p.serialNumbers || []));
    return getAvailableSerials(productId, allProducts, usedSerials);
  }, [allProducts, allInvoices, editingInvoice]);

  const total = useMemo(() => calculateTotal(selectedProducts), [selectedProducts]);

  // Auto-recalculate deduction charges
  useEffect(() => {
    const charges = calculateDeductionCharges(total, formData.collectionMethod);
    setFormData({ deductionCharges: charges });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, formData.collectionMethod]);

  // ── Save ──────────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    const validation = validateInvoice(formData, selectedProducts);
    if (!validation.isValid) { toast.error(validation.error || 'Please fix errors'); return; }
    setIsSaving(true);

    try {
      const invoiceData: Omit<Invoice, 'id'> = {
        invoiceNumber:        formData.invoiceNumber!,
        date:                 formData.date!,
        customerName:         formData.customerName!,
        customerPhone:        formData.customerPhone!,
        customerPhone2:       formData.customerPhone2,
        customerCNIC:         formData.customerCNIC!,
        customerProvince:     formData.customerProvince || '',
        customerCity:         formData.customerCity     || '',
        customerAddress:      formData.customerAddress,
        warrantyLocation:     formData.warrantyLocation,
        products:             selectedProducts,
        exchangeWarrantyNote: formData.exchangeWarrantyNote || '',
        deliveryStatus:       formData.deliveryStatus || 'Self-collect',
        deliveryReceivedStatus: editingInvoice?.deliveryReceivedStatus || 'Pending',
        totalAmount:          total,
        status:               formData.status  || 'Unpaid',
        salesperson:          formData.salesperson,
        salespersonLocation:  formData.salespersonLocation,
        clientDealBy:         formData.clientDealBy,
        referralBy:           formData.referralBy,
        createdBy:            formData.createdBy,
        paymentMode:          formData.paymentMode,
        bankId:               formData.bankId,
        bankName:             formData.bankName,
        bankAccountNumber:    formData.bankAccountNumber,
        paymentStatus:        formData.paymentStatus,
        paidAmount:           formData.paymentStatus === 'Full' ? total : formData.paidAmount,
        remainingAmount:      formData.paymentStatus === 'Full' ? 0    : formData.remainingAmount,
        collectionMethod:     formData.collectionMethod,
        deductionCharges:     formData.deductionCharges || 0,
        digitalStamp:         formData.digitalStamp,
      };

      if (isEditing && editingInvoice) {
        await InvoiceFirebaseService.updateInvoice(editingInvoice.id, invoiceData);
        toast.success('Invoice updated successfully');
      } else {
        // Remove sold serials from inventory
        for (const ip of selectedProducts) {
          if (!ip.productId || !ip.serialNumbers?.length) continue;
          try {
            const product = await InventoryFirebaseService.fetchProductById(ip.productId);
            if (!product) continue;
            const soldSerials   = ip.serialNumbers.filter(s => s.trim() !== '');
            const remaining     = (product.serialNumbers || []).filter(s => !soldSerials.includes(s));
            const newCities     = { ...product.serialCities };
            const newStatus     = { ...product.serialStatus };
            soldSerials.forEach(s => { delete newCities[s]; delete newStatus[s]; });
            await InventoryFirebaseService.updateProduct(ip.productId, {
              stock:         Math.max(0, product.stock - ip.quantity),
              serialNumbers: remaining,
              serialCities:  newCities,
              serialStatus:  newStatus as any,
            });
          } catch (err) {
            console.error('Failed to update inventory for product', ip.productId, err);
          }
        }

        await InvoiceFirebaseService.createInvoice(invoiceData);
        toast.success('Invoice created successfully');
      }

      navigate('/invoices');
    } catch (err) {
      console.error('Save failed:', err);
      toast.error('Failed to save invoice');
    } finally {
      setIsSaving(false);
    }
  }, [formData, selectedProducts, total, isEditing, editingInvoice, navigate]);

  const handleCancel = useCallback(() => navigate('/invoices'), [navigate]);

  const availableProducts = useMemo(() =>
    allProducts.filter(p => getAvailableSerialsForProduct(p.id).length > 0),
    [allProducts, getAvailableSerialsForProduct]
  );

  return {
    formData, selectedProducts, customerSuggestions, showSuggestions,
    isEditing, isLoading, isSaving,
    provinceCities, salespersonLocations, deliveryStatuses: deliveryStatuses as string[],
    collectionMethods: collectionMethods as string[],
    availableProducts, activeEmployees, banks,
    setFormData, handleCustomerSearch, handleCustomerSelect,
    addProduct, removeProduct, updateProduct, updateSerial,
    getAvailableSerialsForProduct,
    handleSave, handleCancel,
    calculateTotal: () => total,
    formatCurrency,
  };
}