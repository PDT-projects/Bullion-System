// Invoice Module - Report Wrapper
// Connects InvoiceReportViewModel to InvoiceReportView

import { Invoice } from '../models/types';
import { useInvoiceReportViewModel } from '../viewModels/useInvoiceReportViewModel';
import { InvoiceReportView } from './InvoiceReportView';
import { formatDate } from '../models/invoiceService';

interface InvoiceReportWrapperProps {
  invoices: Invoice[];
}

export function InvoiceReportWrapper({
  invoices
}: InvoiceReportWrapperProps) {
  const {
    dateFrom,
    dateTo,
    selectedCity,
    selectedSalesperson,
    selectedStatus,
    viewInvoice,
    filteredInvoices,
    stats,
    cities,
    salespersons,
    statuses,
    setDateFrom,
    setDateTo,
    setSelectedCity,
    setSelectedSalesperson,
    setSelectedStatus,
    handleViewInvoice,
    handleCloseView,
    handleClearFilters,
    handleExportCSV,
    formatCurrency
  } = useInvoiceReportViewModel({
    invoices
  });

  return (
    <InvoiceReportView
      invoices={invoices}
      filteredInvoices={filteredInvoices}
      stats={stats}
      dateFrom={dateFrom}
      dateTo={dateTo}
      selectedCity={selectedCity}
      selectedSalesperson={selectedSalesperson}
      selectedStatus={selectedStatus}
      viewInvoice={viewInvoice}
      cities={cities}
      salespersons={salespersons}
      statuses={statuses}
      onDateFromChange={setDateFrom}
      onDateToChange={setDateTo}
      onCityChange={setSelectedCity}
      onSalespersonChange={setSelectedSalesperson}
      onStatusChange={setSelectedStatus}
      onViewInvoice={handleViewInvoice}
      onCloseView={handleCloseView}
      onClearFilters={handleClearFilters}
      onExportCSV={handleExportCSV}
      formatCurrency={formatCurrency}
      formatDate={formatDate}
    />
  );
}
