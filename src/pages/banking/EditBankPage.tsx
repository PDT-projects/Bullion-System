import { useState, useEffect } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { Bank } from '../../App';
import { 
  ArrowLeft, 
  Building2, 
  Landmark,
  Save,
  X
} from 'lucide-react';
import { toast } from 'sonner';

export function EditBankPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { banks, setBanks } = useOutletContext<{
    banks: Bank[];
    setBanks: (banks: Bank[]) => void;
  }>();

  const [bank, setBank] = useState<Bank | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    accountNumber: '',
    balance: 0
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const foundBank = banks.find(b => b.id === id);
    if (foundBank) {
      setBank(foundBank);
      setFormData({
        name: foundBank.name,
        accountNumber: foundBank.accountNumber,
        balance: foundBank.balance
      });
    }
    setIsLoading(false);
  }, [id, banks]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Bank name is required';
    }
    
    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    }

    // Check for duplicate account number (excluding current bank)
    const existingBank = banks.find(b => 
      b.id !== id && 
      b.accountNumber.toLowerCase() === formData.accountNumber.toLowerCase()
    );
    if (existingBank) {
      newErrors.accountNumber = 'Account number already exists';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bank) return;
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    const updatedBank: Bank = {
      ...bank,
      name: formData.name.trim(),
      accountNumber: formData.accountNumber.trim(),
      balance: formData.balance
    };

    setBanks(banks.map(b => b.id === id ? updatedBank : b));
    toast.success(`Bank account "${updatedBank.name}" updated successfully`);
    navigate('/banking/banks');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bank details...</p>
        </div>
      </div>
    );
  }

  if (!bank) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bank Not Found</h2>
          <p className="text-gray-600 mb-4">The bank account you're trying to edit doesn't exist.</p>
          <button
            onClick={() => navigate('/banking/banks')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Banks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/banking/banks')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Edit Bank Account</h2>
            <p className="text-gray-600 mt-1">Update bank account details</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Bank Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.name 
                      ? 'border-red-300 focus:ring-red-200' 
                      : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                  }`}
                  placeholder="e.g., Habib Bank Limited"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Number *
              </label>
              <div className="relative">
                <Landmark className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => {
                    setFormData({ ...formData, accountNumber: e.target.value });
                    if (errors.accountNumber) setErrors({ ...errors, accountNumber: '' });
                  }}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.accountNumber 
                      ? 'border-red-300 focus:ring-red-200' 
                      : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                  }`}
                  placeholder="e.g., HBL-1234567890"
                />
              </div>
              {errors.accountNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.accountNumber}</p>
              )}
            </div>

            {/* Current Balance - Read Only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Balance
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                  PKR
                </span>
                <input
                  type="text"
                  value={formatCurrency(formData.balance)}
                  disabled
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 bg-gray-50 rounded-lg text-gray-600"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Balance is updated automatically through transactions and transfers
              </p>
            </div>

            {/* Summary Preview */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">Updated Account Preview</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Bank Name:</span>
                  <span className="font-medium text-blue-900">
                    {formData.name || 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Account Number:</span>
                  <span className="font-medium text-blue-900">
                    {formData.accountNumber || 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between border-t border-blue-200 pt-2 mt-2">
                  <span className="text-blue-700">Current Balance:</span>
                  <span className="font-bold text-blue-900">
                    {formatCurrency(formData.balance)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/banking/banks')}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Save size={20} />
                Update Bank Account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
