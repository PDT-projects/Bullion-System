// Inventory Module - ViewModel Layer
// useInventoryReturnViewModel
// Add Returned Inventory: look up a serial number, show its linked invoice
// (if any), then either:
//   - Not Damaged → back into stock, same serial, fresh stock-in date;
//     Credit → Owned. Linked invoice is moved to Deleted Invoices.
//   - Damaged → archived to Damaged Inventory (removed from stock entirely,
//     so it never appears in inventory list/report). Linked invoice is
//     ALSO moved to Deleted Invoices — same as the non-damaged branch.

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../../providers/context/AuthContext';
import { Product, DamagedProduct } from '../models/types';
import { InventoryFirebaseService } from '../models/InventoryFirebaseService';
import { InvoiceLifecycleService } from '../../invoices/models/InvoiceLifecycleService';
import { InvoiceFirebaseService } from '../../invoices/models/InvoiceFirebaseService';
import { Invoice } from '../../invoices/models/types';

export interface UseInventoryReturnViewModelReturn {
  step: 'choose' | 'search';
  chooseCondition: (damaged: boolean) => void;
  backToChoose: () => void;
  serialInput: string;
  setSerialInput: (v: string) => void;
  isSearching: boolean;
  foundProduct: Product | null;
  linkedInvoice: Invoice | null;
  notFound: boolean;
  handleSearch: () => void;
  selectInvoiceSerial: (serial: string) => void;
  isDamaged: boolean;
  damageReason: string;
  setDamageReason: (v: string) => void;
  isSubmitting: boolean;
  handleSubmit: () => Promise<void>;
  reset: () => void;
  onBack: () => void;
  recentInvoices: Invoice[];
  damagedRecords: DamagedProduct[];
}

export function useInventoryReturnViewModel(): UseInventoryReturnViewModelReturn {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState<'choose' | 'search'>('choose');

  const [serialInput, setSerialInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const [linkedInvoice, setLinkedInvoice] = useState<Invoice | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isDamaged, setIsDamaged] = useState(false);
  const [damageReason, setDamageReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [damagedRecords, setDamagedRecords] = useState<DamagedProduct[]>([]);

  const loadDamagedRecords = useCallback(() => {
    InventoryFirebaseService.fetchDamagedProducts()
      .then(list => setDamagedRecords(list.slice(0, 8)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (step !== 'search') return;
    InvoiceFirebaseService.fetchAllInvoices()
      .then(list => setRecentInvoices(list.slice(0, 8)))
      .catch(() => {});
    if (isDamaged) loadDamagedRecords();
  }, [step, isDamaged, loadDamagedRecords]);

  const runSearch = useCallback(async (serial: string) => {
    const trimmed = serial.trim();
    if (!trimmed) { toast.error('Enter a serial number to search'); return; }
    setIsSearching(true);
    setNotFound(false);
    setFoundProduct(null);
    setLinkedInvoice(null);
    try {
      const product = await InventoryFirebaseService.findProductBySerial(trimmed);
      if (!product) {
        setNotFound(true);
      } else {
        setFoundProduct(product);
        const invoiceNumber = product.serialInvoiceNumbers?.[trimmed];
        if (invoiceNumber) {
          try {
            const inv = await InvoiceLifecycleService.fetchInvoiceByNumber(invoiceNumber);
            setLinkedInvoice(inv);
          } catch { /* non-blocking — invoice display is informational */ }
        }
      }
    } catch {
      toast.error('Failed to search for serial number');
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearch = useCallback(() => runSearch(serialInput), [runSearch, serialInput]);

  /** Click a serial chip inside a Recent Invoice row — fills + runs search immediately. */
  const selectInvoiceSerial = useCallback((serial: string) => {
    setSerialInput(serial);
    runSearch(serial);
  }, [runSearch]);

  const chooseCondition = useCallback((damaged: boolean) => {
    setIsDamaged(damaged);
    setStep('search');
  }, []);

  const backToChoose = useCallback(() => {
    setStep('choose');
    setSerialInput('');
    setFoundProduct(null);
    setLinkedInvoice(null);
    setNotFound(false);
    setDamageReason('');
  }, []);

  const reset = useCallback(() => {
    setStep('choose');
    setSerialInput('');
    setFoundProduct(null);
    setLinkedInvoice(null);
    setNotFound(false);
    setIsDamaged(false);
    setDamageReason('');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!foundProduct) return;
    const serial = serialInput.trim();
    const invoiceNumber = foundProduct.serialInvoiceNumbers?.[serial];
    const deletedBy = user ? { uid: user.uid, email: user.email || '' } : undefined;
    setIsSubmitting(true);
    try {
      if (isDamaged) {
        await InventoryFirebaseService.moveSerialToDamaged(
          foundProduct.id, serial, deletedBy, damageReason.trim() || undefined
        );
        toast.success(`Serial ${serial} moved to Damaged Inventory`);
      } else {
        await InventoryFirebaseService.returnSerialToStock(foundProduct.id, serial);
        toast.success(`Serial ${serial} returned to stock`);
      }

      // Both branches: linked invoice (if any) moves to Deleted Invoices.
      if (invoiceNumber) {
        try {
          await InvoiceLifecycleService.deleteInvoiceBySerialReturn(invoiceNumber, serial, deletedBy);
        } catch {
          // non-blocking — inventory action already succeeded
        }
      }

      if (isDamaged) {
        // Stay on this screen so the newly damaged record shows in the list below.
        setSerialInput(''); setFoundProduct(null); setLinkedInvoice(null); setNotFound(false); setDamageReason('');
        loadDamagedRecords();
      } else {
        reset();
        navigate('/inventory');
      }
    } catch (err) {
      toast.error('Failed to process return');
    } finally {
      setIsSubmitting(false);
    }
  }, [foundProduct, serialInput, isDamaged, damageReason, user, navigate, reset, loadDamagedRecords]);

  const onBack = useCallback(() => navigate('/inventory'), [navigate]);

  return {
    step, chooseCondition, backToChoose,
    serialInput, setSerialInput, isSearching, foundProduct, linkedInvoice, notFound, handleSearch, selectInvoiceSerial,
    isDamaged, damageReason, setDamageReason,
    isSubmitting, handleSubmit, reset, onBack,
    recentInvoices, damagedRecords,
  };
}