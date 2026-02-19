// Commission Module - Public API Exports
// MVVM Architecture for Commission Management

// Types
export type {
  CommissionStatus,
  CommissionSlab,
  Commission,
  CreateCommissionSlabDTO,
  UpdateCommissionSlabDTO,
  CreateCommissionDTO,
  UpdateCommissionDTO,
  CommissionSlabFilter,
  CommissionFilter,
  CommissionStats,
  CommissionCalculationResult,
  InvoiceReference,
  EmployeeReference,
  ValidationResult,
  SlabOverlap
} from './models/types';

// Service
export {
  getAllCommissionSlabs,
  getCommissionSlabById,
  createCommissionSlab,
  updateCommissionSlab,
  deleteCommissionSlab,
  filterCommissionSlabs,
  validateCommissionSlab,
  checkSlabOverlap,
  calculateCommissions,
  saveCalculatedCommissions,
  getAllCommissions,
  updateCommission,
  confirmCommission,
  filterCommissions,
  getCommissionStats,
  formatCurrency,
  formatMonth,
  getCurrentMonth,
  exportCommissionsToCSV,
  CITIES
} from './models/commissionService';


// ViewModels
export { useCommissionSlabListViewModel } from './viewModels/useCommissionSlabListViewModel';
export { useCommissionSlabFormViewModel } from './viewModels/useCommissionSlabFormViewModel';
export { useCommissionCalculationViewModel } from './viewModels/useCommissionCalculationViewModel';
export { useCommissionReportViewModel } from './viewModels/useCommissionReportViewModel';

// Views
export { CommissionSlabListView } from './views/CommissionSlabListView';
export { CommissionSlabFormView } from './views/CommissionSlabFormView';
export { CommissionCalculationView } from './views/CommissionCalculationView';
export { CommissionReportView } from './views/CommissionReportView';

// Wrappers (Container Components)
export { CommissionSlabListWrapper } from './views/CommissionSlabListWrapper';
export { CommissionCalculationWrapper } from './views/CommissionCalculationWrapper';
export { CommissionReportWrapper } from './views/CommissionReportWrapper';
