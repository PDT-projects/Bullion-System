// Inventory Module - Wrapper
import React from 'react';
import { useInventoryDashboardViewModel } from '../viewModels/useInventoryDashboardViewModel';
import { InventoryDashboardView } from './InventoryDashboardView';
export const InventoryDashboardWrapper: React.FC = () => {
  const viewModel = useInventoryDashboardViewModel();
  return <InventoryDashboardView {...viewModel} />;
};