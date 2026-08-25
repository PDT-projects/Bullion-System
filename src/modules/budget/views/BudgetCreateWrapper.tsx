// Budget Module - Wrapper Component
// Connects BudgetFormViewModel to BudgetFormView for creating new budgets

import React from 'react';
import { useBudgetFormViewModel } from '../viewModels/useBudgetFormViewModel';
import { BudgetFormView } from './BudgetFormView';

export const BudgetCreateWrapper: React.FC = () => {
  const viewModel = useBudgetFormViewModel();
  return <BudgetFormView {...viewModel} />;
};
