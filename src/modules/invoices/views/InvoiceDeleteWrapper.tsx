// Invoice Module - Delete Wrapper
// Connects InvoiceDeleteViewModel to InvoiceDeleteView

import { useParams, useNavigate } from 'react-router-dom';
import { Invoice, ProductInfo } from '../models/types';
import { useInvoiceDeleteViewModel } from '../viewModels/useInvoiceDeleteViewModel';
import { InvoiceDeleteView } from './InvoiceDeleteView';
import { formatCurrency, formatDate } from '../models/invoiceService';

interface InvoiceDeleteWrapperProps {
  invoices: Invoice[];
  products: ProductInfo[];
  setInvoices: (invoices: Invoice[]) => void;
  setProducts: (products: ProductInfo[]) => void;
}

export function InvoiceDeleteWrapper({
  invoices,
  products,
  setInvoices,
  setProducts
}: InvoiceDeleteWrapperProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const invoice = invoices.find(inv => inv.id === id) || null;
  
  const { handleDelete, handleCancel } = useInvoiceDeleteViewModel({
    invoices,
    products,
    setInvoices,
    setProducts
  });

  const onConfirm = () => {
    if (id) {
      handleDelete(id);
    }
  };

  return (
    <InvoiceDeleteView
      invoice={invoice}
      onConfirm={onConfirm}
      onCancel={handleCancel}
      formatCurrency={formatCurrency}
      formatDate={formatDate}
    />
  );
}
