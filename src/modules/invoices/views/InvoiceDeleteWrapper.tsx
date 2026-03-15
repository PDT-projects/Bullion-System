// Invoice Module - Delete Wrapper
import React, { useState, useEffect } from 'react';
import { useInvoiceDeleteViewModel } from '../viewModels/useInvoiceDeleteViewModel';
import { InvoiceDeleteView } from './InvoiceDeleteView';
import { Invoice } from '../models/types';
import { InvoiceFirebaseService } from '../models/InvoiceFirebaseService';

export function InvoiceDeleteWrapper() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  useEffect(() => {
    InvoiceFirebaseService.fetchAllInvoices().then(setInvoices).catch(() => {});
  }, []);
  const vm = useInvoiceDeleteViewModel(invoices);
  return <InvoiceDeleteView {...vm} />;
}