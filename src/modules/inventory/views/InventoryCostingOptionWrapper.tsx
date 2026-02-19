// Inventory Module - Wrapper Component
// InventoryCostingOptionWrapper - Connects ViewModel to View for Step 1

import React from 'react';
import { useInventoryCostingOptionViewModel } from '../viewModels/useInventoryCostingOptionViewModel';
import { InventoryCostingOptionView } from './InventoryCostingOptionView';

export const InventoryCostingOptionWrapper: React.FC = () => {
  const viewModel = useInventoryCostingOptionViewModel();
  
  return <InventoryCostingOptionView {...viewModel} />;
};
