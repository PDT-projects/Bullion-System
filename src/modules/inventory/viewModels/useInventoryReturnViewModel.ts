// Inventory Module - ViewModel Layer
// useInventoryReturnViewModel
// Add Returned Inventory:
//   - "Back to Stock": pick a recent invoice → pick the serial on it → item
//     returns to stock, invoice is marked Returned and soft-deleted (archived
//     to deleted_invoices). Falls back to manual serial search if needed.
//   - "Damaged": search a serial → archived to Damaged Inventory, never
//     added back to stock.

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../../providers/context/AuthContext';
import { Product } from '../models/types';
import { InventoryFirebaseService } from '../models/InventoryFirebaseService';
import { InvoiceFirebaseService } from '../../invoices/models/InvoiceFirebaseService';
import { InvoiceLifecycleService } from '../../invoices/models/InvoiceLifecycleService';
import { Invoice } from '../../invoices/models/types';

export interface UseInventoryReturnViewModelReturn {
  mode: 'choose' | 'stock' | 'damaged';
  selectMode: (m: 'stock' | 'damaged') => void;
  backToChoose: () => void;
  recentInvoices: Invoice[];
  invoicesLoading: boolean;
  selectedInvoice: Invoice | null;
  selectInvoice: (inv: Invoice) => void;
  pickSerialFromInvoice: (serial: string) => Promise<void>;
  serialInput: string;
  setSerialInput: (v: string) => void;
  isSearching: boolean;
  foundProduct: Product | null;
  notFound: boolean;
  handleSearch: () => Promise<void>;
  isDamaged: boolean;
  damageReason: string;
  setDamageReason: (v: string) => void;
  isSubmitting: boolean;
  handleSubmit: () => Promise<void>;
  reset: () => void;
  onBack: () => void;
}

export function useInventoryReturnViewModel(): UseInventoryReturnViewModelReturn {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [mode, setMode] = useState<'choose' | 'stock' | 'damaged'>('choose');
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [serialInput, setSerialInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [damageReason, setDamageReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDamaged = mode === 'damaged';

  const selectMode = useCallback((m: 'stock' | 'damaged') => setMode(m), []);
  const backToChoose = useCallback(() => {
    setMode('choose');
    setSerialInput(''); setFoundProduct(null); setNotFound(false);
    setDamageReason(''); setSelectedInvoice(null);
  }, []);

  // Load recent (non-returned) invoices once the user enters "Back to Stock" mode
  useEffect(() => {
    if (mode !== 'stock' || recentInvoices.length > 0) return;
    setInvoicesLoading(true);
    InvoiceFirebaseService.fetchAllInvoices()
      .then(all => {
        const eligible = all
          .filter(inv => inv.status !== 'Returned')
          .sort((a, b) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime())
          .slice(0, 20);
        setRecentInvoices(eligible);
      })
      .catch(() => toast.error('Failed to load recent invoices'))
      .finally(() => setInvoicesLoading(false));
  }, [mode, recentInvoices.length]);

  const selectInvoice = useCallback((inv: Invoice) => {
    setSelectedInvoice(inv);
    setFoundProduct(null);
    setNotFound(false);
    setSerialInput('');
  }, []);

  const pickSerialFromInvoice = useCallback(async (serial: string) => {
    setSerialInput(serial);
    setIsSearching(true);
    setNotFound(false);
    setFoundProduct(null);
    try {
      const product = await InventoryFirebaseService.findProductBySerial(serial);
      if (!product) setNotFound(true); else setFoundProduct(product);
    } catch {
      toast.error('Failed to look up that serial number');
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearch = useCallback(async () => {
    const trimmed = serialInput.trim();
    if (!trimmed) { toast.error('Enter a serial number to search'); return; }
    setIsSearching(true);
    setNotFound(false);
    setFoundProduct(null);
    try {
      const product = await InventoryFirebaseService.findProductBySerial(trimmed);
      if (!product) {
        setNotFound(true);
      } else {
        setFoundProduct(product);
      }
    } catch {
      toast.error('Failed to search for serial number');
    } finally {
      setIsSearching(false);
    }
  }, [serialInput]);

  const reset = useCallback(() => {
    setMode('choose');
    setSerialInput('');
    setFoundProduct(null);
    setNotFound(false);
    setDamageReason('');
    setSelectedInvoice(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!foundProduct) return;
    const serial = serialInput.trim();
    setIsSubmitting(true);
    try {
      if (isDamaged) {
        await InventoryFirebaseService.moveSerialToDamaged(
          foundProduct.id,
          serial,
          user ? { uid: user.uid, email: user.email || '' } : undefined,
          damageReason.trim() || undefined
        );
        toast.success(`Serial ${serial} moved to Damaged Inventory`);
      } else {
        await InventoryFirebaseService.returnSerialToStock(foundProduct.id, serial);

        if (selectedInvoice) {
          // Invoice picked from the recent-invoices list: reverse liquidity,
          // mark Returned, then archive the invoice into deleted_invoices.
          const unitAmount = selectedInvoice.products
            ?.find(p => p.serialNumbers?.includes(serial))?.price ?? foundProduct.sellPrice;
          try {
            await InvoiceLifecycleService.markInvoiceReturnedBySerial(
              selectedInvoice.invoiceNumber, serial, unitAmount
            );
            await InvoiceLifecycleService.softDeleteInvoice(
              selectedInvoice.id,
              user ? { uid: user.uid, email: user.email || '' } : undefined
            );
          } catch {
            // non-blocking — stock return already succeeded; invoice can be fixed manually
          }
          toast.success(`Serial ${serial} returned to stock — invoice ${selectedInvoice.invoiceNumber} marked Returned & archived`);
        } else {
          // Manual serial entry fallback — no invoice was picked from the list.
          const linkedInvoiceNumber = foundProduct.serialInvoiceNumbers?.[serial];
          if (linkedInvoiceNumber) {
            try {
              await InvoiceLifecycleService.markInvoiceReturnedBySerial(
                linkedInvoiceNumber, serial, foundProduct.sellPrice
              );
            } catch {
              // non-blocking
            }
          }
          toast.success(`Serial ${serial} returned to stock`);
        }
      }
      reset();
      navigate('/inventory');
    } catch (err) {
      toast.error('Failed to process return');
    } finally {
      setIsSubmitting(false);
    }
  }, [foundProduct, serialInput, isDamaged, damageReason, selectedInvoice, user, navigate, reset]);

  const onBack = useCallback(() => navigate('/inventory'), [navigate]);

  return {
    mode, selectMode, backToChoose,
    recentInvoices, invoicesLoading, selectedInvoice, selectInvoice, pickSerialFromInvoice,
    serialInput, setSerialInput, isSearching, foundProduct, notFound, handleSearch,
    isDamaged, damageReason, setDamageReason,
    isSubmitting, handleSubmit, reset, onBack,
  };
}