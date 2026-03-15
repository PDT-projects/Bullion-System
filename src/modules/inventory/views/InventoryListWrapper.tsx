// Inventory Module - Wrapper
import React from 'react';
import { useInventoryListViewModel } from '../viewModels/useInventoryListViewModel';
import { InventoryListView } from './InventoryListView';
interface Props { inventoryType?: 'in-stock' | 'on-order'; }
export const InventoryListWrapper: React.FC<Props> = ({ inventoryType = 'in-stock' }) => {
  const viewModel = useInventoryListViewModel(inventoryType);
  return <InventoryListView {...viewModel} />;
};