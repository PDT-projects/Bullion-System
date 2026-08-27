// Budget Module - View Layer
// Delete confirmation UI component

import React from 'react';
import { Budget } from '../models/types';
import { BudgetService } from '../models/budgetService';
import { Button } from '../../../components/ui/button';
import { ArrowLeft, Trash2, AlertTriangle, Loader2 } from 'lucide-react';

interface BudgetDeleteViewProps {
  budget: Budget | null;
  isDeleting: boolean;
  budgetStatus: {
    status: 'On Track' | 'Close to Limit' | 'Over Budget';
    color: string;
    bgColor: string;
    percentage: number;
  } | null;
  remaining: number;
  handleConfirmDelete: () => void;
  handleCancel: () => void;
}

export const BudgetDeleteView: React.FC<BudgetDeleteViewProps> = ({
  budget,
  isDeleting,
  budgetStatus,
  remaining,
  handleConfirmDelete,
  handleCancel
}) => {
  const formatCurrency = BudgetService.formatCurrency;
  const formatDate = BudgetService.formatDate;

  if (!budget) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">Budget not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delete Budget</h1>
          <p className="text-gray-600">Review the budget details before confirming deletion</p>
        </div>
      </div>

      {/* Delete Confirmation Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-2xl">
        {/* Warning Header */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-red-900">Warning: This action cannot be undone</h3>
              <p className="text-sm text-red-700">
                Deleting this budget will remove all associated data permanently.
              </p>
            </div>
          </div>
        </div>

        {/* Budget Details */}
        <div className="space-y-4 mb-6">
          <h4 className="font-medium text-gray-900 border-b border-gray-200 pb-2">
            Budget Details
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Sub-category</p>
              <p className="font-medium text-gray-900">{budget.subCategory}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Category</p>
              <p className="font-medium text-gray-900">{budget.category}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Period</p>
              <p className="font-medium text-gray-900">{budget.period}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="font-medium text-gray-900">{formatDate(budget.createdAt)}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-500">Budget Limit</p>
              <p className="font-medium text-gray-900">{formatCurrency(budget.budgetLimit)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Spent</p>
              <p className="font-medium text-gray-900">{formatCurrency(budget.spent)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Remaining</p>
              <p className={`font-medium ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(remaining)}
              </p>
            </div>
          </div>

          {/* Status */}
          {budgetStatus && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-2">Current Status</p>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  budgetStatus.percentage >= 100 ? 'bg-red-100 text-red-800' :
                  budgetStatus.percentage >= 80 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {budgetStatus.status}
                </span>
                <span className="text-sm text-gray-600">
                  ({budgetStatus.percentage.toFixed(1)}% used)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Alerts */}
        {budgetStatus && budgetStatus.percentage >= 80 && (
          <div className={`rounded-lg p-4 mb-6 ${
            budgetStatus.percentage >= 100 
              ? 'bg-red-50 border border-red-200' 
              : 'bg-orange-50 border border-orange-200'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={16} className={budgetStatus.percentage >= 100 ? 'text-red-600' : 'text-orange-600'} />
              <p className={`text-sm font-medium ${
                budgetStatus.percentage >= 100 ? 'text-red-800' : 'text-orange-800'
              }`}>
                {budgetStatus.percentage >= 100 ? 'Budget is over limit' : 'Budget is close to limit'}
              </p>
            </div>
            <p className={`text-sm ${
              budgetStatus.percentage >= 100 ? 'text-red-700' : 'text-orange-700'
            }`}>
              {budgetStatus.percentage >= 100 
                ? 'This budget has exceeded its limit. Consider reviewing expenses before deleting.'
                : 'This budget is approaching its limit. Make sure you want to delete it.'}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            className="flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Delete Budget
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
