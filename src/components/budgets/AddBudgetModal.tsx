import { useState } from 'react';
import { Budget } from '../../types/Budget';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface AddBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (budget: Omit<Budget, 'id' | 'spent' | 'createdAt' | 'updatedAt'>) => void;
}

const subCategories = [
  'Salaries',
  'Office Rent',
  'Supplier / Vendor Payments',
  'Utilities',
  'Marketing',
  'Equipment',
  'Travel',
  'Miscellaneous'
];

export function AddBudgetModal({ isOpen, onClose, onAdd }: AddBudgetModalProps) {
  const [formData, setFormData] = useState({
    subCategory: '',
    budgetLimit: 0,
    period: 'Monthly' as 'Monthly' | 'Quarterly' | 'Yearly'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subCategory || formData.budgetLimit <= 0) {
      toast.error('Please fill all required fields with valid values');
      return;
    }

    onAdd({
      category: 'Expenses',
      subCategory: formData.subCategory,
      period: formData.period,
      budgetLimit: formData.budgetLimit
    });

    // Reset form
    setFormData({
      subCategory: '',
      budgetLimit: 0,
      period: 'Monthly'
    });

    onClose();
    toast.success('Budget added successfully!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Add New Budget</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sub-category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sub-category *
            </label>
            <select
              value={formData.subCategory}
              onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              required
            >
              <option value="">Select sub-category</option>
              {subCategories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Budget Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Budget Limit (PKR) *
            </label>
            <input
              type="number"
              value={formData.budgetLimit || ''}
              onChange={(e) => setFormData({ ...formData, budgetLimit: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              placeholder="Enter budget limit"
              min="1"
              required
            />
          </div>

          {/* Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Period *
            </label>
            <select
              value={formData.period}
              onChange={(e) => setFormData({ ...formData, period: e.target.value as 'Monthly' | 'Quarterly' | 'Yearly' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
              required
            >
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors"
            >
              Add Budget
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
