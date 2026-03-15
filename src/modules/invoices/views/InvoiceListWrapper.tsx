// Invoice Module - List Wrapper
import React from 'react';
import { useInvoiceListViewModel } from '../viewModels/useInvoiceListViewModel';
import { InvoiceListView } from './InvoiceListView';

export function InvoiceListWrapper() {
  const vm = useInvoiceListViewModel();
  return <InvoiceListView {...vm} />;
}