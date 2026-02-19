// Invoice Module - Public API Exports
// MVVM Architecture for Invoice Management

// ==========================================
// MODEL LAYER
// ==========================================

// Types
export type {
  Invoice,
  InvoiceProduct,
  CreateInvoiceDTO,
  UpdateInvoiceDTO,
  InvoiceFilters,
  InvoiceStats,
  ValidationResult,
  ProductInfo,
  CustomerSuggestion
} from './models/types';

// Service Functions
export {
  generateInvoiceNumber,
  createEmptyInvoiceProduct,
  updateProductWithSelection,
  updateProductQuantity,
  updateProductPrice,
  updateSerialNumber,
  getAvailableSerials,
  getUniqueCustomers,
  validateInvoice,
  calculateTotal,
  calculateDeductionCharges,
  filterInvoices,
  calculateInvoiceStats,
  createInvoice,
  updateInvoice,
  formatCurrency,
  formatDate,
  exportInvoicesToCSV,
  downloadCSV,
  // Constants
  provinceCities,
  salespersonLocations,
  deliveryStatuses,
  collectionMethods
} from './models/invoiceService';

// ==========================================
// VIEWMODEL LAYER
// ==========================================

export { useInvoiceListViewModel } from './viewModels/useInvoiceListViewModel';
export { useInvoiceFormViewModel } from './viewModels/useInvoiceFormViewModel';
export { useInvoiceDeleteViewModel } from './viewModels/useInvoiceDeleteViewModel';
export { useInvoiceReportViewModel } from './viewModels/useInvoiceReportViewModel';

// ==========================================
// VIEW LAYER
// ==========================================

// Views (presentational components)
export { InvoiceListView } from './views/InvoiceListView';
export { InvoiceFormView } from './views/InvoiceFormView';
export { InvoiceDeleteView } from './views/InvoiceDeleteView';
export { InvoiceReportView } from './views/InvoiceReportView';

// Wrappers (connected components)
export { InvoiceListWrapper } from './views/InvoiceListWrapper';
export { InvoiceFormWrapper } from './views/InvoiceFormWrapper';
export { InvoiceDeleteWrapper } from './views/InvoiceDeleteWrapper';
export { InvoiceReportWrapper } from './views/InvoiceReportWrapper';
