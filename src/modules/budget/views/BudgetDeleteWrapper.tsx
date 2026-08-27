// Budget Module - Wrapper Component
// Connects BudgetDeleteViewModel to BudgetDeleteView

import React from 'react';
import { useBudgetDeleteViewModel } from '../viewModels/useBudgetDeleteViewModel';
import { BudgetDeleteView } from './BudgetDeleteView';

export const BudgetDeleteWrapper: React.FC = () => {
  const viewModel = useBudgetDeleteViewModel();
  return <BudgetDeleteView {...viewModel} />;
};
