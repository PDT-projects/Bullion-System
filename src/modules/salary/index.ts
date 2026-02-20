// Salary Module - Public API
// Export all components, hooks, and types for external use

// Models
export * from './models/types';
export { SalaryService } from './models/salaryService';

// ViewModels
export { useSalaryListViewModel } from './viewModels/useSalaryListViewModel';
export { useSalaryFormViewModel } from './viewModels/useSalaryFormViewModel';
export { useSalaryDeleteViewModel } from './viewModels/useSalaryDeleteViewModel';
export { useSalaryDashboardViewModel } from './viewModels/useSalaryDashboardViewModel';

// Views
export { SalaryListView } from './views/SalaryListView';
export { SalaryFormView } from './views/SalaryFormView';
export { SalaryDeleteView } from './views/SalaryDeleteView';
export { SalaryDashboardView } from './views/SalaryDashboardView';

// Wrappers
export { SalaryListWrapper } from './views/SalaryListWrapper';
export { SalaryCreateWrapper } from './views/SalaryCreateWrapper';
export { SalaryEditWrapper } from './views/SalaryEditWrapper';
export { SalaryDeleteWrapper } from './views/SalaryDeleteWrapper';
export { SalaryDashboardWrapper } from './views/SalaryDashboardWrapper';
