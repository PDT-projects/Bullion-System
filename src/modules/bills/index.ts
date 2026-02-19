// Bills Module - Public API
// Export all components, hooks, and types for external use

// Models
export * from './models/types';
export { BillsService } from './models/billsService';

// ViewModels
export { useBillsListViewModel } from './viewModels/useBillsListViewModel';
export { useBillsFormViewModel } from './viewModels/useBillsFormViewModel';
export { useBillsDeleteViewModel } from './viewModels/useBillsDeleteViewModel';

// Views
export { BillsListView } from './views/BillsListView';
export { BillsFormView } from './views/BillsFormView';
export { BillsDeleteView } from './views/BillsDeleteView';

// Wrappers
export { BillsListWrapper } from './views/BillsListWrapper';
export { BillsCreateWrapper } from './views/BillsCreateWrapper';
export { BillsEditWrapper } from './views/BillsEditWrapper';
export { BillsDeleteWrapper } from './views/BillsDeleteWrapper';
