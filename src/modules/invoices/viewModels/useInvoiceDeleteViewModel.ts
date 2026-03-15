// Invoice Module - Delete ViewModel

import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Invoice } from '../models/types';
import { InvoiceFirebaseService } from '../models/InvoiceFirebaseService';
import { InventoryFirebaseService } from '../../inventory/models/InventoryFirebaseService';
import { formatCurrency, formatDate } from '../models/invoiceService';

export interface UseInvoiceDeleteViewModelReturn {
  invoice: Invoice | null;
  handleDelete: () => void;
  handleCancel: () => void;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

export function useInvoiceDeleteViewModel(invoices: Invoice[]): UseInvoiceDeleteViewModelReturn {
  const navigate = useNavigate();
  const { id }   = useParams<{ id: string }>();
  const invoice  = invoices.find(i => i.id === id) || null;

  const handleDelete = useCallback(async () => {
    if (!id || !invoice) { navigate('/invoices'); return; }
    try {
      // Return serials to inventory
      for (const ip of invoice.products) {
        if (!ip.productId || !ip.serialNumbers?.length) continue;
        try {
          const product = await InventoryFirebaseService.fetchProductById(ip.productId);
          if (!product) continue;
          const merged = [...(product.serialNumbers || []), ...ip.serialNumbers.filter(s => s.trim() !== '')];
          await InventoryFirebaseService.updateProduct(ip.productId, {
            stock:         (product.stock || 0) + ip.quantity,
            serialNumbers: merged,
          });
        } catch { /* skip missing products */ }
      }
      await InvoiceFirebaseService.deleteInvoice(id);
      toast.success('Invoice deleted — products returned to inventory');
      navigate('/invoices');
    } catch {
      toast.error('Failed to delete invoice');
    }
  }, [id, invoice, navigate]);

  const handleCancel = useCallback(() => navigate('/invoices'), [navigate]);

  return { invoice, handleDelete, handleCancel, formatCurrency, formatDate };
}