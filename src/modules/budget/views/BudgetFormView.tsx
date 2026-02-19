// Budget Module - View Layer
// Create/Edit form UI component

import React from 'react';
import { Budget } from '../models/types';
import { BudgetService } from '../models/budgetService';
import { Button } from '../../../components/ui/button';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

interface BudgetFormViewProps {
  formData: Partial<Budget>;
  isEditing: boolean;
  isSubmitting: boolean;
  errors: { [key: string]: string };
  subCategories: string[];
  setFormField: (field: keyof Budget, value: any) => void;
  handleSubmit: () => void;
  handleCancel: () => void;
}

export const BudgetFormView: React.FC<BudgetFormViewProps> = ({
  formData,
  isEditing,
  isSubmitting,
  errors,
  subCategories,
  setFormField,
  handleSubmit,
  handleCancel
}) => {
  const formatCurrency = BudgetService.formatCurrency;

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
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Budget' : 'Create New Budget'}
          </h1>
          <p className="text-gray-600">
            {isEditing 
              ? 'Update the budget details below' 
              : 'Set up a new expense budget category'}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-2xl">
        <div className="space-y-6">
          {/* Sub-category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sub-category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.subCategory || ''}
              onChange={(e) => setFormField('subCategory', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent ${
                errors.subCategory ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select sub-category</option>
              {subCategories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.subCategory && (
              <p className="mt-1 text-sm text-red-600">{errors.subCategory}</p>
            )}
          </div>

          {/* Budget Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Budget Limit (PKR) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">PKR</span>
              <input
                type="number"
                value={formData.budgetLimit || ''}
                onChange={(e) => setFormField('budgetLimit', Number(e.target.value))}
                className={`w-full pl-12 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent ${
                  errors.budgetLimit ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter budget limit"
                min="1"
              />
            </div>
            {errors.budgetLimit && (
              <p className="mt-1 text-sm text-red-600">{errors.budgetLimit}</p>
            )}
            {formData.budgetLimit && formData.budgetLimit > 0 && (
              <p className="mt-1 text-sm text-gray-500">
                {formatCurrency(formData.budgetLimit)}
              </p>
            )}
          </div>

          {/* Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Period <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.period || 'Monthly'}
              onChange={(e) => setFormField('period', e.target.value as 'Monthly' | 'Quarterly' | 'Yearly')}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent ${
                errors.period ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Yearly">Yearly</option>
            </select>
            {errors.period && (
              <p className="mt-1 text-sm text-red-600">{errors.period}</p>
            )}
          </div>

          {/* Category (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <input
              type="text"
              value="Expenses"
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="mt-1 text-sm text-gray-500">
              All budgets are categorized as Expenses
            </p>
          </div>

          {/* Summary Preview */}
          {formData.subCategory && formData.budgetLimit && formData.budgetLimit > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Budget Summary</h4>
              <div className="space-y-1 text-sm">
                <p className="text-blue-800">
                  <span className="font-medium">Category:</span> {formData.subCategory}
                </p>
                <p className="text-blue-800">
                  <span className="font-medium">Limit:</span> {formatCurrency(formData.budgetLimit)}
                </p>
                <p className="text-blue-800">
                  <span className="font-medium">Period:</span> {formData.period}
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                Please fix the errors above before saving.
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {isEditing ? 'Update Budget' : 'Create Budget'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
