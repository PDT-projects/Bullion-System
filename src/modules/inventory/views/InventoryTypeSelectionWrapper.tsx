// Inventory Module - View Layer
// InventoryTypeSelectionWrapper - Wrapper for Inventory Type Selection step

import React from 'react';
import { InventoryTypeSelectionView } from './InventoryTypeSelectionView';
import { useInventoryTypeSelectionViewModel } from '../viewModels/useInventoryTypeSelectionViewModel';

export const InventoryTypeSelectionWrapper: React.FC = () => {
  const viewModel = useInventoryTypeSelectionViewModel();
  
  return <InventoryTypeSelectionView {...viewModel} />;
};
