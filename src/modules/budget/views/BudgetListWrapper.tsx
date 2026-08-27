// Budget Module - Wrapper Component
// Connects BudgetListViewModel to BudgetListView

import React from 'react';
import { useBudgetListViewModel } from '../viewModels/useBudgetListViewModel';
import { BudgetListView } from './BudgetListView';

export const BudgetListWrapper: React.FC = () => {
  const viewModel = useBudgetListViewModel();
  return <BudgetListView {...viewModel} />;
};
