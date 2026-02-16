import { Budget } from '../../types/Budget';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign } from 'lucide-react';

interface BudgetSummaryCardsProps {
  budgets: Budget[];
}

export function BudgetSummaryCards({ budgets }: BudgetSummaryCardsProps) {
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.budgetLimit, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const remaining = totalBudget - totalSpent;
  const alerts = budgets.filter(budget => {
    const percentage = (budget.spent / budget.budgetLimit) * 100;
    return percentage >= 80;
  }).length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Budget */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Total Budget</span>
          <DollarSign className="text-[#4f46e5]" size={20} />
        </div>
        <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalBudget)}</p>
        <p className="text-xs text-[#4f46e5] mt-1">Active expense budgets</p>
      </div>

      {/* Total Spent */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Total Spent</span>
          <TrendingDown className="text-red-500" size={20} />
        </div>
        <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSpent)}</p>
        <p className="text-xs text-red-500 mt-1">
          {totalBudget > 0 ? `${((totalSpent / totalBudget) * 100).toFixed(1)}%` : '0%'} of budget
        </p>
      </div>

      {/* Remaining */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Remaining</span>
          <TrendingUp className="text-green-500" size={20} />
        </div>
        <p className="text-2xl font-bold text-gray-900">{formatCurrency(remaining)}</p>
        <p className="text-xs text-green-500 mt-1">Available to spend</p>
      </div>

      {/* Alerts */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Alerts</span>
          <AlertTriangle className="text-orange-500" size={20} />
        </div>
        <p className="text-2xl font-bold text-gray-900">{alerts}</p>
        <p className="text-xs text-orange-500 mt-1">Budgets need attention</p>
      </div>
    </div>
  );
}
