// Inventory Module - Public API
// Export all models, viewModels, and views for external use

// Models
export * from './models/types';
export { InventoryService } from './models/inventoryService';

// ViewModels
export { useInventoryDashboardViewModel } from './viewModels/useInventoryDashboardViewModel';
export { useInventoryListViewModel } from './viewModels/useInventoryListViewModel';
export { useProductTransferViewModel } from './viewModels/useProductTransferViewModel';
export { useProductTransferCreateViewModel } from './viewModels/useProductTransferCreateViewModel';
export { useInventoryTypeSelectionViewModel } from './viewModels/useInventoryTypeSelectionViewModel';
export { useInventoryCostingOptionViewModel } from './viewModels/useInventoryCostingOptionViewModel';
export { useInventoryProductDetailsViewModel } from './viewModels/useInventoryProductDetailsViewModel';
export { useInventoryPaymentViewModel } from './viewModels/useInventoryPaymentViewModel';



// Views
export { InventoryDashboardView } from './views/InventoryDashboardView';
export { InventoryListView } from './views/InventoryListView';
export { ProductTransferView } from './views/ProductTransferView';
export { ProductTransferCreateView } from './views/ProductTransferCreateView';
export { InventoryTypeSelectionView } from './views/InventoryTypeSelectionView';
export { InventoryCostingOptionView } from './views/InventoryCostingOptionView';
export { InventoryProductDetailsView } from './views/InventoryProductDetailsView';
export { InventoryPaymentView } from './views/InventoryPaymentView';



// Wrappers
export { InventoryTypeSelectionWrapper } from './views/InventoryTypeSelectionWrapper';
export { InventoryCostingOptionWrapper } from './views/InventoryCostingOptionWrapper';
export { InventoryProductDetailsWrapper } from './views/InventoryProductDetailsWrapper';
export { InventoryPaymentWrapper } from './views/InventoryPaymentWrapper';
export { ProductTransferWrapper } from './views/ProductTransferWrapper';
export { ProductTransferCreateWrapper } from './views/ProductTransferCreateWrapper';
