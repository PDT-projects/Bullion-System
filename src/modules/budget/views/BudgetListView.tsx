// Budget Module - View Layer
// List page UI component

import React from 'react';
import { Budget, BudgetFilters } from '../models/types';
import { BudgetService } from '../models/budgetService';
import { Button } from '../../../components/ui/button';
import { Plus, Filter, X, AlertTriangle, Eye, Pencil, Trash2 } from 'lucide-react';

interface BudgetListViewProps {
  budgets: Budget[];
  filters: BudgetFilters;
  showFilters: boolean;
  activeFilterCount: number;
  viewBudget: Budget | null;
  stats: {
    totalCount: number;
    totalBudget: number;
    totalSpent: number;
    remaining: number;
    alerts: number;
    onTrackCount: number;
    closeToLimitCount: number;
    overBudgetCount: number;
  };
  setFilter: (key: keyof BudgetFilters, value: any) => void;
  clearFilters: () => void;
  toggleFilters: () => void;
  setViewBudget: (budget: Budget | null) => void;
  handleEdit: (id: string) => void;
  handleDelete: (id: string) => void;
  handleAdd: () => void;
  getBudgetStatus: (budget: Budget) => {
    status: 'On Track' | 'Close to Limit' | 'Over Budget';
    color: string;
    bgColor: string;
    percentage: number;
  };
}

export const BudgetListView: React.FC<BudgetListViewProps> = ({
  budgets,
  filters,
  showFilters,
  activeFilterCount,
  stats,
  setFilter,
  clearFilters,
  toggleFilters,
  setViewBudget,
  handleEdit,
  handleDelete,
  handleAdd,
  getBudgetStatus
}) => {
  const formatCurrency = BudgetService.formatCurrency;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget Management</h1>
          <p className="text-gray-600">Set spending limits and track your progress</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={toggleFilters}
            className="flex items-center gap-2"
          >
            <Filter size={16} />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 bg-[#4f46e5] text-white text-xs rounded-full px-2 py-0.5">
                {activeFilterCount}
              </span>
            )}
          </Button>
          <Button onClick={handleAdd} className="flex items-center gap-2">
            <Plus size={16} />
            Add Budget
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Filter Budgets</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-[#4f46e5] hover:text-[#4338ca] flex items-center gap-1"
            >
              <X size={14} />
              Clear all
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sub-category
              </label>
              <input
                type="text"
                value={filters.subCategorySearch}
                onChange={(e) => setFilter('subCategorySearch', e.target.value)}
                placeholder="Search sub-category..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Period
              </label>
              <select
                value={filters.periodFilter}
                onChange={(e) => setFilter('periodFilter', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              >
                <option value="">All Periods</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Budget
              </label>
              <input
                type="number"
                value={filters.minBudgetLimit || ''}
                onChange={(e) => setFilter('minBudgetLimit', e.target.value ? Number(e.target.value) : null)}
                placeholder="Min amount"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Budget
              </label>
              <input
                type="number"
                value={filters.maxBudgetLimit || ''}
                onChange={(e) => setFilter('maxBudgetLimit', e.target.value ? Number(e.target.value) : null)}
                placeholder="Max amount"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.statusFilter}
                onChange={(e) => setFilter('statusFilter', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="on-track">On Track</option>
                <option value="close-to-limit">Close to Limit</option>
                <option value="over-budget">Over Budget</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Budget</span>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Plus className="text-blue-600" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalBudget)}</p>
          <p className="text-xs text-blue-600 mt-1">{stats.totalCount} active budgets</p>
        </div>

        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Spent</span>
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="text-red-600" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalSpent)}</p>
          <p className="text-xs text-red-600 mt-1">
            {stats.totalBudget > 0 ? `${((stats.totalSpent / stats.totalBudget) * 100).toFixed(1)}%` : '0%'} of budget
          </p>
        </div>

        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Remaining</span>
            <div className="p-2 bg-green-100 rounded-lg">
              <Plus className="text-green-600" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.remaining)}</p>
          <p className="text-xs text-green-600 mt-1">Available to spend</p>
        </div>

        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Alerts</span>
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="text-orange-600" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.alerts}</p>
          <p className="text-xs text-orange-600 mt-1">
            {stats.closeToLimitCount} close to limit, {stats.overBudgetCount} over
          </p>
        </div>
      </div>

      {/* Budget Cards */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Expense Budgets</h2>
          {budgets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No budgets found.</p>
              <p className="text-sm text-gray-400 mt-1">
                {activeFilterCount > 0 
                  ? 'Try adjusting your filters or ' 
                  : 'Click "Add Budget" to create your first expense budget.'}
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="mt-2 text-[#4f46e5] hover:text-[#4338ca] text-sm font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {budgets.map((budget) => {
                const budgetStatus = getBudgetStatus(budget);
                const percentage = budgetStatus.percentage;
                const remaining = budget.budgetLimit - budget.spent;

                return (
                  <div 
                    key={budget.id} 
                    className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{budget.subCategory}</h3>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                          percentage >= 100 ? 'bg-red-100 text-red-800' :
                          percentage >= 80 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {budgetStatus.status}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewBudget(budget)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <Eye size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(budget.id)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(budget.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>

                    {/* Category and Period */}
                    <p className="text-sm text-gray-600 mb-4">
                      {budget.category} • {budget.period.toLowerCase()}
                    </p>

                    {/* Financial Details */}
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Spent</span>
                        <span className="text-lg font-bold text-gray-900">
                          {formatCurrency(budget.spent)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Budget</span>
                        <span className="text-lg font-bold text-gray-900">
                          {formatCurrency(budget.budgetLimit)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Remaining</span>
                        <span className={`text-lg font-bold ${
                          remaining < 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {formatCurrency(remaining)}
                        </span>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Progress</span>
                        <span className="text-sm font-medium text-gray-900">{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${budgetStatus.bgColor}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Alert Messages */}
                    {percentage >= 80 && percentage < 100 && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle size={16} className="text-orange-600" />
                          <span className="text-sm font-medium text-orange-800">Approaching Limit</span>
                        </div>
                        <p className="text-sm text-orange-700">
                          You have {formatCurrency(remaining)} left for this category
                        </p>
                      </div>
                    )}

                    {percentage >= 100 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle size={16} className="text-red-600" />
                          <span className="text-sm font-medium text-red-800">Budget Exceeded</span>
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
    </div>
  );
};