import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Budget } from '../../types/Budget';
import { BudgetSummaryCards } from './BudgetSummaryCards';
import { AddBudgetModal } from './AddBudgetModal';
import { Button } from '../../components/ui/button';
import { Plus, AlertTriangle } from 'lucide-react';


interface BudgetsProps {
  budgets: Budget[];
  setBudgets: (budgets: Budget[]) => void;
}

export function Budgets({ budgets, setBudgets }: BudgetsProps) {
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);


  const handleAddBudget = (newBudget: Omit<Budget, 'id' | 'spent' | 'createdAt' | 'updatedAt'>) => {
    const budget: Budget = {
      ...newBudget,
      id: Date.now().toString(),
      spent: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setBudgets([...budgets, budget]);
  };

  const handleDeleteBudget = (id: string) => {
    setBudgets(budgets.filter(budget => budget.id !== id));
  };

  const getBudgetStatus = (budget: Budget) => {
    const percentage = (budget.spent / budget.budgetLimit) * 100;
    if (percentage >= 100) return { status: 'Over Budget', color: 'text-red-600', bgColor: 'bg-red-500' };
    if (percentage >= 80) return { status: 'Close to Limit', color: 'text-yellow-600', bgColor: 'bg-yellow-500' };
    return { status: 'On Track', color: 'text-green-600', bgColor: 'bg-green-500' };
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget Management</h1>
          <p className="text-gray-600">Set spending limits and track your progress</p>
        </div>
        <Button onClick={() => navigate('/budgets/new')} className="flex items-center gap-2">
          <Plus size={16} />
          Add Budget
        </Button>

      </div>

      <BudgetSummaryCards budgets={budgets} />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Expense Budgets</h2>
          {budgets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No budgets created yet.</p>
              <p className="text-sm text-gray-400 mt-1">Click "Add Budget" to create your first expense budget.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {budgets.map((budget) => {
                const budgetStatus = getBudgetStatus(budget);
                const percentage = (budget.spent / budget.budgetLimit) * 100;
                const remaining = budget.budgetLimit - budget.spent;

                return (
                  <div key={budget.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{budget.subCategory}</h3>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          percentage >= 100 ? 'bg-red-100 text-red-800' :
                          percentage >= 80 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {budgetStatus.status}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteBudget(budget.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>

                    {/* Category and Period */}
                    <p className="text-sm text-gray-600 mb-4">
                      {budget.category} • {budget.period.toLowerCase()}
                    </p>

                    {/* Financial Details */}
                    <div className="space-y-3 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Spent</p>
                        <p className="text-xl font-bold text-gray-900">
                          {new Intl.NumberFormat('en-PK', {
                            style: 'currency',
                            currency: 'PKR',
                            minimumFractionDigits: 0
                          }).format(budget.spent)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Budget</p>
                        <p className="text-xl font-bold text-gray-900">
                          {new Intl.NumberFormat('en-PK', {
                            style: 'currency',
                            currency: 'PKR',
                            minimumFractionDigits: 0
                          }).format(budget.budgetLimit)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Remaining</p>
                        <p className={`text-xl font-bold ${
                          remaining < 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {new Intl.NumberFormat('en-PK', {
                            style: 'currency',
                            currency: 'PKR',
                            minimumFractionDigits: 0
                          }).format(remaining)}
                        </p>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Progress</p>
                        <p className="text-sm font-medium text-gray-900">{percentage.toFixed(1)}%</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${budgetStatus.bgColor}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Alert Message */}
                    {percentage >= 80 && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle size={16} className="text-orange-600" />
                          <p className="text-sm font-medium text-orange-800">Approaching Limit</p>
                        </div>
                        <p className="text-sm text-orange-700">
                          You have {new Intl.NumberFormat('en-PK', {
                            style: 'currency',
                            currency: 'PKR',
                            minimumFractionDigits: 0
                          }).format(remaining)} left for this category
                        </p>
                      </div>
                    )}

                    {/* Over Budget Alert */}
                    {percentage >= 100 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle size={16} className="text-red-600" />
                          <p className="text-sm font-medium text-red-800">Budget Exceeded</p>
                        </div>
                        <p className="text-sm text-red-700">
                          Consider reviewing expenses or increasing the budget limit.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AddBudgetModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddBudget}
      />
    </div>
  );
}
