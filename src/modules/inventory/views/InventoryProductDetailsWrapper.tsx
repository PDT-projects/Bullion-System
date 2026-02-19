// Inventory Module - Wrapper Component
// InventoryProductDetailsWrapper - Connects ViewModel to View for Step 2

import React from 'react';
import { useInventoryProductDetailsViewModel } from '../viewModels/useInventoryProductDetailsViewModel';
import { InventoryProductDetailsView } from './InventoryProductDetailsView';

export const InventoryProductDetailsWrapper: React.FC = () => {
  const viewModel = useInventoryProductDetailsViewModel();
  
  return <InventoryProductDetailsView {...viewModel} />;
};
