// Invoice Module - Delete ViewModel

import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Invoice } from '../models/types';
import { InvoiceLifecycleService } from '../models/InvoiceLifecycleService';
import { useAuth } from '../../../providers/context/AuthContext';
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
  const { user } = useAuth();
  const invoice  = invoices.find(i => i.id === id) || null;

  const handleDelete = useCallback(async () => {
    if (!id || !invoice) { navigate('/invoices'); return; }
    try {
      // All reversal logic lives in the service now:
      //   - sold serials go back to inventory + Sold status/date/invoice-number cleared
      //   - every linked transaction (payments + misc expenses) removed from ledger
      //   - invoice archived to deleted_invoices, cannot be undone
      const summary = await InvoiceLifecycleService.softDeleteInvoice(
        id,
        user ? { uid: user.uid, email: user.email || '' } : undefined
      );

      // Build a summary toast so the user sees exactly what was reversed.
      const parts: string[] = [];
      if (summary.serialsRestored > 0) {
        parts.push(`${summary.serialsRestored} serial${summary.serialsRestored === 1 ? '' : 's'} returned to stock`);
      }
      if (summary.transactionsRemoved > 0) {
        parts.push(`${summary.transactionsRemoved} transaction${summary.transactionsRemoved === 1 ? '' : 's'} reversed`);
      }
      const detail = parts.length > 0 ? ` — ${parts.join(', ')}` : '';
      toast.success(`Invoice moved to Deleted Invoices${detail}`);
      navigate('/invoices');
    } catch (err) {
      console.error('[InvoiceDelete] softDeleteInvoice failed:', err);
      toast.error('Failed to delete invoice');
    }
  }, [id, invoice, navigate, user]);

  const handleCancel = useCallback(() => navigate('/invoices'), [navigate]);

  return { invoice, handleDelete, handleCancel, formatCurrency, formatDate };
}