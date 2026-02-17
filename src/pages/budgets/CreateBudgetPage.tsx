import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Budget } from '../../types/Budget';
import { X, ArrowLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { initialData, normalizeInitialData } from '../../App';

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

export function CreateBudgetPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(() => normalizeInitialData(initialData));
  
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

    const newBudget: Budget = {
      id: Date.now().toString(),
      category: 'Expenses',
      subCategory: formData.subCategory,
      period: formData.period,
      budgetLimit: formData.budgetLimit,
      spent: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add budget to data
    setData(prev => ({
      ...prev,
      budgets: [...prev.budgets, newBudget]
    }));

    toast.success('Budget added successfully!');
    navigate('/budgets');
  };

  const handleCancel = () => {
    navigate('/budgets');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to Budgets
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-[#4f46e5] rounded-lg">
            <Plus size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Budget</h1>
            <p className="text-gray-600">Set up a new expense budget category</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sub-category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#4f46e5] hover:bg-[#4338ca]"
            >
              Create Budget
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
