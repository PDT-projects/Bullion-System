// Dummy Invoice Module - ViewModel
// Fully manual form — no inventory lookup, no serial numbers
// Saves to 'dummy_invoices' Firestore collection

import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  DummyInvoiceFirebaseService,
  DummyInvoiceProduct,
  DummyInvoiceType,
  generateDummyInvoiceNumber,
} from '../models/DummyInvoiceFirebaseService';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function emptyProduct(): DummyInvoiceProduct {
  return { id: uid(), productName: '', description: '', quantity: 1, unitPrice: 0, total: 0 };
}

export interface UseDummyInvoiceFormViewModelReturn {
  invoiceType:    DummyInvoiceType;
  setInvoiceType: (t: DummyInvoiceType) => void;
  invoiceNumber:  string;
  setInvoiceNumber: (n: string) => void;
  date:           string;
  setDate:        (d: string) => void;
  validUntil:     string;
  setValidUntil:  (d: string) => void;
  // Customer
  customerName:    string; setCustomerName:    (v: string) => void;
  customerPhone:   string; setCustomerPhone:   (v: string) => void;
  customerPhone2:  string; setCustomerPhone2:  (v: string) => void;
  customerCNIC:    string; setCustomerCNIC:    (v: string) => void;
  customerCity:    string; setCustomerCity:    (v: string) => void;
  customerProvince:string; setCustomerProvince:(v: string) => void;
  customerAddress: string; setCustomerAddress: (v: string) => void;
  // Products
  products:      DummyInvoiceProduct[];
  addProduct:    () => void;
  removeProduct: (id: string) => void;
  updateProduct: (id: string, field: keyof DummyInvoiceProduct, value: any) => void;
  totalAmount:   number;
  // Sales
  salesperson:    string; setSalesperson:    (v: string) => void;
  notes:          string; setNotes:          (v: string) => void;
  status:         string; setStatus:         (v: string) => void;
  // Saved salespersons for autocomplete
  savedSalespersons: string[];
  // Meta
  isEditing:  boolean;
  isSaving:   boolean;
  isLoading:  boolean;
  handleSave:   () => Promise<void>;
  handleCancel: () => void;
}

export function useDummyInvoiceFormViewModel(): UseDummyInvoiceFormViewModelReturn {
  const navigate = useNavigate();
  const { id }   = useParams<{ id: string }>();
  const isEditing = !!id;

  const [invoiceType,    setInvoiceTypeState] = useState<DummyInvoiceType>('Dummy');
  const [invoiceNumber,  setInvoiceNumber]    = useState('');
  const [date,           setDate]             = useState(new Date().toLocaleDateString('en-CA'));
  const [validUntil,     setValidUntil]       = useState('');
  const [customerName,   setCustomerName]     = useState('');
  const [customerPhone,  setCustomerPhone]    = useState('');
  const [customerPhone2, setCustomerPhone2]   = useState('');
  const [customerCNIC,   setCustomerCNIC]     = useState('');
  const [customerCity,   setCustomerCity]     = useState('');
  const [customerProvince, setCustomerProvince] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [products,       setProducts]         = useState<DummyInvoiceProduct[]>([emptyProduct()]);
  const [salesperson,    setSalesperson]      = useState('');
  const [notes,          setNotes]            = useState('');
  const [status,         setStatus]           = useState('Draft');
  const [savedSalespersons, setSavedSalespersons] = useState<string[]>([]);
  const [isSaving,       setIsSaving]         = useState(false);
  const [isLoading,      setIsLoading]        = useState(false);

  const totalAmount = products.reduce((s, p) => s + (p.total || 0), 0);

  // Load saved salespersons
  useEffect(() => {
    getDocs(query(collection(db, 'salespersons'), orderBy('name')))
      .then(snap => setSavedSalespersons(snap.docs.map(d => (d.data() as any).name || d.id)))
      .catch(() => {});
  }, []);

  // Generate invoice number when type changes (or on mount)
  const setInvoiceType = useCallback(async (t: DummyInvoiceType) => {
    setInvoiceTypeState(t);
    if (!isEditing) {
      const num = await generateDummyInvoiceNumber(t).catch(() => `${t.slice(0, 3).toUpperCase()}-DRAFT`);
      setInvoiceNumber(num);
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) {
      generateDummyInvoiceNumber('Dummy')
        .then(setInvoiceNumber)
        .catch(() => setInvoiceNumber('DUM-DRAFT'));
    }
  }, [isEditing]);

  // Load existing for edit
  useEffect(() => {
    if (!isEditing || !id) return;
    setIsLoading(true);
    DummyInvoiceFirebaseService.fetchById(id)
      .then(inv => {
        if (!inv) { toast.error('Invoice not found'); navigate('/invoices/dummy'); return; }
        setInvoiceTypeState(inv.invoiceType);
        setInvoiceNumber(inv.invoiceNumber);
        setDate(inv.date);
        setValidUntil(inv.validUntil || '');
        setCustomerName(inv.customerName);
        setCustomerPhone(inv.customerPhone);
        setCustomerPhone2(inv.customerPhone2 || '');
        setCustomerCNIC(inv.customerCNIC || '');
        setCustomerCity(inv.customerCity || '');
        setCustomerProvince(inv.customerProvince || '');
        setCustomerAddress(inv.customerAddress || '');
        setProducts(inv.products);
        setSalesperson(inv.salesperson || '');
        setNotes(inv.notes || '');
        setStatus(inv.status);
      })
      .finally(() => setIsLoading(false));
  }, [id, isEditing, navigate]);

  const addProduct = useCallback(() => setProducts(p => [...p, emptyProduct()]), []);

  const removeProduct = useCallback((pid: string) =>
    setProducts(p => p.filter(x => x.id !== pid)), []);

  const updateProduct = useCallback((pid: string, field: keyof DummyInvoiceProduct, value: any) => {
    setProducts(prev => prev.map(p => {
      if (p.id !== pid) return p;
      const updated = { ...p, [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        updated.total = (field === 'quantity' ? Number(value) : updated.quantity)
          * (field === 'unitPrice' ? Number(value) : updated.unitPrice);
      }
      return updated;
    }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!customerName.trim()) {
      toast.error('Customer name is required');
      alert('Customer name is required');
      return;
    }
    if (products.length === 0 || !products.some(p => p.productName.trim())) {
      toast.error('Add at least one product');
      alert('Add at least one product with a name');
      return;
    }
    setIsSaving(true);
    try {
      const validProducts = products.filter(p => p.productName.trim());
      const payload = {
        invoiceType,
        invoiceNumber,
        date,
        validUntil: validUntil || undefined,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerPhone2: customerPhone2 || undefined,
        customerCNIC:   customerCNIC   || undefined,
        customerCity:   customerCity   || undefined,
        customerProvince: customerProvince || undefined,
        customerAddress:  customerAddress  || undefined,
        products: validProducts,
        totalAmount,
        salesperson: salesperson || undefined,
        notes:       notes       || undefined,
        status:      status as any,
        createdAt:   new Date().toISOString(),
        updatedAt:   new Date().toISOString(),
      };

      console.log('[DummyInvoice] Saving payload:', payload);

      // Strip undefined — Firestore rejects undefined field values
      const clean = Object.fromEntries(
        Object.entries(payload).filter(([, v]) => v !== undefined)
      ) as any;

      if (isEditing && id) {
        await DummyInvoiceFirebaseService.update(id, clean);
        toast.success(`${invoiceType} invoice updated`);
      } else {
        const saved = await DummyInvoiceFirebaseService.create(clean);
        console.log('[DummyInvoice] Saved:', saved);
        toast.success(`${invoiceType} invoice saved — ${invoiceNumber}`);
      }
      navigate('/invoices/dummy');
    } catch (err: any) {
      console.error('[DummyInvoice] Save error:', err);
      toast.error(err?.message || 'Failed to save');
      alert(`Save failed: ${err?.message || 'Unknown error — check console'}`);
    } finally {
      setIsSaving(false);
    }
  }, [invoiceType, invoiceNumber, date, validUntil, customerName, customerPhone,
      customerPhone2, customerCNIC, customerCity, customerProvince, customerAddress,
      products, totalAmount, salesperson, notes, status, isEditing, id, navigate]);

  const handleCancel = useCallback(() => navigate('/invoices/dummy'), [navigate]);

  return {
    invoiceType, setInvoiceType,
    invoiceNumber, setInvoiceNumber,
    date, setDate,
    validUntil, setValidUntil,
    customerName, setCustomerName,
    customerPhone, setCustomerPhone,
    customerPhone2, setCustomerPhone2,
    customerCNIC, setCustomerCNIC,
    customerCity, setCustomerCity,
    customerProvince, setCustomerProvince,
    customerAddress, setCustomerAddress,
    products, addProduct, removeProduct, updateProduct,
    totalAmount,
    salesperson, setSalesperson,
    notes, setNotes,
    status, setStatus,
    savedSalespersons,
    isEditing, isSaving, isLoading,
    handleSave, handleCancel,
  };
}