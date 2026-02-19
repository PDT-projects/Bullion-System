// Commission Slab Form View - Presentational Component

import { X, Maximize2, Minimize2, AlertCircle } from 'lucide-react';
import type { CommissionSlab } from '../models/types';

interface CommissionSlabFormViewProps {
  // Form state
  formData: {
    salesperson: string;
    city: string;
    fromAmount: number;
    toAmount: number;
    commissionPercentage: number;
  };
  setFormData: (data: Partial<{
    salesperson: string;
    city: string;
    fromAmount: number;
    toAmount: number;
    commissionPercentage: number;
  }>) => void;
  
  // UI state
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  isFullScreen: boolean;
  setIsFullScreen: (full: boolean) => void;
  isSubmitting: boolean;
  errors: string[];
  
  // Editing
  editingSlab: CommissionSlab | null;
  
  // Actions
  handleSave: () => void;
  
  // Constants
  cities: readonly string[];
  employees: any[];
}

export function CommissionSlabFormView({
  formData,
  setFormData,
  isModalOpen,
  setIsModalOpen,
  isFullScreen,
  setIsFullScreen,
  isSubmitting,
  errors,
  editingSlab,
  handleSave,
  cities,
  employees
}: CommissionSlabFormViewProps) {
  if (!isModalOpen) return null;

  const modalClasses = isFullScreen
    ? 'fixed inset-0 z-50 bg-white'
    : 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4';

  const contentClasses = isFullScreen
    ? 'w-full h-full overflow-auto'
    : 'bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto';

  return (
    <div className={modalClasses}>
      <div className={contentClasses}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {editingSlab ? 'Edit Commission Slab' : 'Add Commission Slab'}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title={isFullScreen ? 'Minimize' : 'Maximize'}
            >
              {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <button
              onClick={() => setIsModalOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="space-y-1">
                  {errors.map((error, index) => (
                    <p key={index} className="text-sm text-red-600">{error}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Salesperson */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Salesperson <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.salesperson}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ salesperson: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
            >
              <option value="">Select Salesperson</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.city}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ city: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
            >
              <option value="">Select City</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Amount Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Amount (PKR) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.fromAmount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ fromAmount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Amount (PKR) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.toAmount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ toAmount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
                min="0"
              />
            </div>
          </div>

          {/* Commission Percentage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commission Percentage <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.commissionPercentage}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ commissionPercentage: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent pr-12"
                min="0"
                max="100"
                step="0.01"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : editingSlab ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
