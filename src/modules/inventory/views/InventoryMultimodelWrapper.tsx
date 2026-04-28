// Inventory Module - Wrapper
import React from 'react';
import { useInventoryMultiModelViewModel } from '../viewModels/useInventoryMultiModelViewModel';
import { InventoryMultiModelView } from './InventoryMultiModelView';

export const InventoryMultiModelWrapper: React.FC = () => {
  const viewModel = useInventoryMultiModelViewModel();
  return <InventoryMultiModelView {...viewModel} />;
};