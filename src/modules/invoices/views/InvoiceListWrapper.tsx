// Invoice Module - List Wrapper
// Connects InvoiceListViewModel to InvoiceListView

import { Invoice, ProductInfo } from '../models/types';
import { useInvoiceListViewModel } from '../viewModels/useInvoiceListViewModel';
import { InvoiceListView } from './InvoiceListView';

interface InvoiceListWrapperProps {
  invoices: Invoice[];
  products: ProductInfo[];
  setInvoices: (invoices: Invoice[]) => void;
  setProducts: (products: ProductInfo[]) => void;
}

export function InvoiceListWrapper({
  invoices,
  products,
  setInvoices,
  setProducts
}: InvoiceListWrapperProps) {
  const {
    filters,
    viewingInvoice,
    filteredInvoices,
    stats,
    handleSearch,
    handleStatusFilter,
    handleViewInvoice,
    handleCloseView,
    handleEditInvoice,
    handleDeleteInvoice,
    handleCreateInvoice,
    formatCurrency,
    formatDate
  } = useInvoiceListViewModel({
    invoices,
    products,
    setInvoices,
    setProducts
  });

  return (
    <InvoiceListView
      invoices={invoices}
      filteredInvoices={filteredInvoices}
      stats={stats}
      filters={filters}
      viewingInvoice={viewingInvoice}
      onSearch={handleSearch}
      onStatusFilter={handleStatusFilter}
      onViewInvoice={handleViewInvoice}
      onCloseView={handleCloseView}
      onEditInvoice={handleEditInvoice}
      onDeleteInvoice={handleDeleteInvoice}
      onCreateInvoice={handleCreateInvoice}
      formatCurrency={formatCurrency}
      formatDate={formatDate}
    />
  );
}
