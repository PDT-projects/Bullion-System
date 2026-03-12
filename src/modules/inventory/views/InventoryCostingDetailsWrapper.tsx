// Inventory Module - Wrapper Component
// InventoryCostingDetailsWrapper - Connects ViewModel to View for Step 3 (Costing Details)

import React from 'react';
import { useInventoryCostingDetailsViewModel } from '../viewModels/useInventoryCostingDetailsViewModel';
import { InventoryCostingDetailsView } from './InventoryCostingDetailsView';

export const InventoryCostingDetailsWrapper: React.FC = () => {
  const viewModel = useInventoryCostingDetailsViewModel();
  
  return <InventoryCostingDetailsView {...viewModel} />;
};

