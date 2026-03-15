// Invoice Module - Form Wrapper
import React from 'react';
import { useInvoiceFormViewModel } from '../viewModels/useInvoiceFormViewModel';
import { InvoiceFormView } from './InvoiceFormView';

export function InvoiceFormWrapper() {
  const vm = useInvoiceFormViewModel();
  return <InvoiceFormView {...vm} />;
}