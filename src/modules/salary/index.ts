// Salary Module - Public API

// Models
export * from './models/types';
export { SalaryService } from './models/salaryService';
export { SalaryFirebaseService } from './models/salaryFirebaseService';

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