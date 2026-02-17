import { useState } from 'react';
import { Budget } from '../../types/Budget';
import { Budgets } from './Budgets';
import { initialData, normalizeInitialData } from '../../App';

export function BudgetsPage() {
  const [data, setData] = useState(() => normalizeInitialData(initialData));
  
  const setBudgets = (budgets: Budget[]) => setData(prev => ({ ...prev, budgets }));

  return (
    <Budgets 
      budgets={data.budgets}
      setBudgets={setBudgets}
    />
  );
}
