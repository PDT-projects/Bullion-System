// Invoice Module - Public API Exports

// ── Models ───────────────────────────────────────────────────
export type {
  Invoice, InvoiceProduct, CreateInvoiceDTO, UpdateInvoiceDTO,
  InvoiceFilters, InvoiceStats, ValidationResult, ProductInfo, CustomerSuggestion,
} from './models/types';

export {
  provinceCities, salespersonLocations, deliveryStatuses, collectionMethods,
  calculateDeductionCharges, calculateTotal, validateInvoice,
  createEmptyInvoiceProduct, filterInvoices, calculateInvoiceStats,
  formatCurrency, formatDate, exportInvoicesToCSV, downloadCSV,
} from './models/invoiceService';

export { InvoiceFirebaseService } from './models/InvoiceFirebaseService';

// ── ViewModels ───────────────────────────────────────────────
export { useInvoiceListViewModel }   from './viewModels/useInvoiceListViewModel';
export { useInvoiceFormViewModel }   from './viewModels/useInvoiceFormViewModel';
export { useInvoiceDeleteViewModel } from './viewModels/useInvoiceDeleteViewModel';
export { useInvoiceReportViewModel } from './viewModels/useInvoiceReportViewModel';

// ── Views ────────────────────────────────────────────────────
export { InvoiceListView }   from './views/InvoiceListView';
export { InvoiceFormView }   from './views/InvoiceFormView';
export { InvoiceDeleteView } from './views/InvoiceDeleteView';
export { InvoiceReportView } from './views/InvoiceReportView';

// ── Wrappers ─────────────────────────────────────────────────
export { InvoiceListWrapper }   from './views/InvoiceListWrapper';
export { InvoiceFormWrapper }   from './views/InvoiceFormWrapper';
export { InvoiceDeleteWrapper } from './views/InvoiceDeleteWrapper';
export { InvoiceReportWrapper } from './views/InvoiceReportWrapper';