import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Loan, Bank } from '../../App';
import { 
  ArrowLeft, 
  Building2, 
  DollarSign, 
  Calendar, 
  CreditCard,
  TrendingDown,
  Save,
  X
} from 'lucide-react';
import { toast } from 'sonner';

export function CreatePayableLoanPage() {
  const navigate = useNavigate();
  const { loans, setLoans, banks, setBanks } = useOutletContext<{
    loans: Loan[];
    setLoans: (loans: Loan[]) => void;
    banks: Bank[];
    setBanks: (banks: Bank[]) => void;
  }>();

  const [formData, setFormData] = useState({
    entityName: '',
    loanAmount: '',
    paid: '',
    date: new Date().toISOString().split('T')[0],
    loanType: 'Official' as 'Official' | 'Personal' | 'Other',
    mode: 'Bank' as 'Cash' | 'Bank',
    bankId: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validation
    if (!formData.entityName.trim()) {
      toast.error('Please enter the entity name');
      setIsSubmitting(false);
      return;
    }

    const loanAmount = parseFloat(formData.loanAmount);
    if (!loanAmount || loanAmount <= 0) {
      toast.error('Please enter a valid loan amount');
      setIsSubmitting(false);
      return;
    }

    const paid = parseFloat(formData.paid) || 0;
    if (paid > loanAmount) {
      toast.error('Paid amount cannot exceed loan amount');
      setIsSubmitting(false);
      return;
    }

    if (formData.mode === 'Bank' && !formData.bankId) {
      toast.error('Please select a bank account');
      setIsSubmitting(false);
      return;
    }

    const bank = banks.find(b => b.id === formData.bankId);
    if (formData.mode === 'Bank' && !bank) {
      toast.error('Invalid bank selection');
      setIsSubmitting(false);
      return;
    }

    const remaining = loanAmount - paid;
    const status: 'Full' | 'Partial' = remaining === 0 ? 'Full' : 'Partial';

    const newLoan: Loan = {
      id: Date.now().toString(),
      entityName: formData.entityName.trim(),
      receiverName: formData.entityName.trim(),
      receiverType: 'Person',
      loanAmount,
      paid,
      remaining,
      type: 'Payable',
      loanType: formData.loanType,
      status,
      date: formData.date,
      mode: formData.mode,
      bankId: formData.mode === 'Bank' ? formData.bankId : undefined,
      bankName: formData.mode === 'Bank' && bank ? bank.name : undefined,
      employeeId: undefined,
      employeeName: undefined,
      receiverId: undefined,
      receiverPhone: undefined
    };

    // Update bank balance (money comes IN for payable loans)
    if (formData.mode === 'Bank' && bank && setBanks) {
      const updatedBanks = banks.map(b => {
        if (b.id === formData.bankId) {
          return { ...b, balance: b.balance + loanAmount };
        }
        return b;
      });
      setBanks(updatedBanks);
      toast.success(`Loan recorded. ${formatCurrency(loanAmount)} added to ${bank.name}`);
    } else {
      toast.success('Payable loan recorded successfully (Cash)');
    }

    setLoans([...loans, newLoan]);
    
    // Navigate back to loans page
    navigate('/loans/all');
  };

  const selectedBank = banks.find(b => b.id === formData.bankId);
  const loanAmount = parseFloat(formData.loanAmount) || 0;
  const paidAmount = parseFloat(formData.paid) || 0;
  const remainingAmount = loanAmount - paidAmount;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/loans')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Add Loan Payable</h2>
            <p className="text-gray-600 mt-1">Record a new loan taken from a company or individual</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Form Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Loan Details</h3>
                <p className="text-sm text-gray-600">Enter the loan information</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Entity Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building2 className="inline w-4 h-4 mr-1" />
                  Loan Taken From (Company/Person) *
                </label>
                <input
                  type="text"
                  value={formData.entityName}
                  onChange={(e) => setFormData({ ...formData, entityName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="e.g., ABC Bank, John Doe, XYZ Company"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Enter the name of the entity you took the loan from</p>
              </div>

              {/* Loan Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="inline w-4 h-4 mr-1" />
                  Total Loan Amount *
                </label>
                <input
                  type="number"
                  value={formData.loanAmount}
                  onChange={(e) => setFormData({ ...formData, loanAmount: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>

              {/* Already Paid */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="inline w-4 h-4 mr-1" />
                  Already Paid (Optional)
                </label>
                <input
                  type="number"
                  value={formData.paid}
                  onChange={(e) => setFormData({ ...formData, paid: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">If you've already made some payments</p>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Loan Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Loan Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Category *
                </label>
                <select
                  value={formData.loanType}
                  onChange={(e) => setFormData({ ...formData, loanType: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                >
                  <option value="Official">Official</option>
                  <option value="Personal">Personal</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CreditCard className="inline w-4 h-4 mr-1" />
                  Payment Mode *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.mode === 'Bank'}
                      onChange={() => setFormData({ ...formData, mode: 'Bank', bankId: '' })}
                      className="w-4 h-4 text-red-600"
                    />
                    <span>Bank</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.mode === 'Cash'}
                      onChange={() => setFormData({ ...formData, mode: 'Cash', bankId: '' })}
                      className="w-4 h-4 text-red-600"
                    />
                    <span>Cash</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.mode === 'Bank' 
                    ? '💰 Loan amount will be added to selected bank' 
                    : '💵 Loan recorded as cash transaction'}
                </p>
              </div>

              {/* Bank Selection */}
              {formData.mode === 'Bank' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Bank Account *
                  </label>
                  <select
                    value={formData.bankId}
                    onChange={(e) => setFormData({ ...formData, bankId: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required={formData.mode === 'Bank'}
                  >
                    <option value="">Select a bank account</option>
                    {banks.map(bank => (
                      <option key={bank.id} value={bank.id}>
                        {bank.name} - Current Balance: {formatCurrency(bank.balance)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Bank Balance Preview */}
              {formData.mode === 'Bank' && selectedBank && loanAmount > 0 && (
                <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">💰 Bank Balance Preview</p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-blue-700">Current Balance:</p>
                      <p className="font-medium text-blue-900">{formatCurrency(selectedBank.balance)}</p>
                    </div>
                    <div>
                      <p className="text-blue-700">Loan Amount:</p>
                      <p className="font-medium text-green-600">+ {formatCurrency(loanAmount)}</p>
                    </div>
                    <div>
                      <p className="text-blue-700">New Balance:</p>
                      <p className="font-bold text-blue-900">{formatCurrency(selectedBank.balance + loanAmount)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={3}
                  placeholder="Any additional notes about this loan..."
                />
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Loan Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(loanAmount)}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Already Paid</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(paidAmount)}</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Remaining</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(remainingAmount)}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/loans')}
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
            >
              <Save size={20} />
              {isSubmitting ? 'Saving...' : 'Save Loan Payable'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
