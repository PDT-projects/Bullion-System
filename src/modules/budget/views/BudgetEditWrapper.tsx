// Budget Module - Wrapper Component
// Connects BudgetFormViewModel to BudgetFormView for editing existing budgets

import React from 'react';
import { useBudgetFormViewModel } from '../viewModels/useBudgetFormViewModel';
import { BudgetFormView } from './BudgetFormView';

export const BudgetEditWrapper: React.FC = () => {
  const viewModel = useBudgetFormViewModel();
  return <BudgetFormView {...viewModel} />;
};
