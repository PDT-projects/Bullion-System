import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Bank, BankTransfer } from '../../App';
import { 
  ArrowLeft, 
  ArrowRightLeft,
  ArrowRight,
  Save,
  Wallet,
  AlertCircle,
  TrendingDown,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';

export function CreateTransferPage() {
  const navigate = useNavigate();
  const { banks, setBanks, transfers, setTransfers } = useOutletContext<{
    banks: Bank[];
    setBanks: (banks: Bank[]) => void;
    transfers: BankTransfer[];
    setTransfers: (transfers: BankTransfer[]) => void;
  }>();

  const [formData, setFormData] = useState({
    fromBankId: '',
    toBankId: '',
    amount: 0,
    note: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fromBankId) {
      newErrors.fromBankId = 'Please select source bank';
    }
    
    if (!formData.toBankId) {
      newErrors.toBankId = 'Please select destination bank';
    }

    if (formData.fromBankId === formData.toBankId) {
      newErrors.toBankId = 'Cannot transfer to the same bank';
    }
    
    if (formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    const fromBank = banks.find(b => b.id === formData.fromBankId);
    if (fromBank && formData.amount > fromBank.balance) {
      newErrors.amount = 'Insufficient balance in source bank';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    const fromBank = banks.find(b => b.id === formData.fromBankId)!;
    const toBank = banks.find(b => b.id === formData.toBankId)!;

    // Create transfer record
    const newTransfer: BankTransfer = {
      id: Date.now().toString(),
      date: formData.date,
      fromBankId: formData.fromBankId,
      fromBankName: fromBank.name,
      toBankId: formData.toBankId,
      toBankName: toBank.name,
      amount: formData.amount,
      note: formData.note
    };

    // Update bank balances
    const updatedBanks = banks.map(bank => {
      if (bank.id === formData.fromBankId) {
        return { ...bank, balance: bank.balance - formData.amount };
      }
      if (bank.id === formData.toBankId) {
        return { ...bank, balance: bank.balance + formData.amount };
      }
      return bank;
    });

    setBanks(updatedBanks);
    setTransfers([newTransfer, ...transfers]);
    
    toast.success(`Transferred ${formatCurrency(formData.amount)} from ${fromBank.name} to ${toBank.name}`);
    navigate('/banking/transfers');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const fromBank = banks.find(b => b.id === formData.fromBankId);
  const toBank = banks.find(b => b.id === formData.toBankId);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/banking/transfers')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">New Bank Transfer</h2>
            <p className="text-gray-600 mt-1">Transfer funds between bank accounts</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transfer Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500"
              />
            </div>

            {/* From Bank */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Bank (Source) *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select
                  value={formData.fromBankId}
                  onChange={(e) => {
                    setFormData({ ...formData, fromBankId: e.target.value });
                    if (errors.fromBankId) setErrors({ ...errors, fromBankId: '' });
                  }}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.fromBankId 
                      ? 'border-red-300 focus:ring-red-200' 
                      : 'border-gray-300 focus:ring-green-200 focus:border-green-500'
                  }`}
                >
                  <option value="">Select source bank</option>
                  {banks.map(bank => (
                    <option key={bank.id} value={bank.id}>
                      {bank.name} - {formatCurrency(bank.balance)}
                    </option>
                  ))}
                </select>
              </div>
              {errors.fromBankId && (
                <p className="mt-1 text-sm text-red-600">{errors.fromBankId}</p>
              )}
            </div>

            {/* Source Bank Balance Preview */}
            {fromBank && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <Wallet size={24} className="text-blue-600 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900 mb-2">
                      💳 {fromBank.name} Balance
                    </p>
                    <div className="flex justify-between items-center p-2 bg-white rounded">
                      <span className="text-sm text-gray-600">Available:</span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(fromBank.balance)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* To Bank */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Bank (Destination) *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select
                  value={formData.toBankId}
                  onChange={(e) => {
                    setFormData({ ...formData, toBankId: e.target.value });
                    if (errors.toBankId) setErrors({ ...errors, toBankId: '' });
                  }}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.toBankId 
                      ? 'border-red-300 focus:ring-red-200' 
                      : 'border-gray-300 focus:ring-green-200 focus:border-green-500'
                  }`}
                >
                  <option value="">Select destination bank</option>
                  {banks.map(bank => (
                    <option key={bank.id} value={bank.id}>
                      {bank.name} - {formatCurrency(bank.balance)}
                    </option>
                  ))}
                </select>
              </div>
              {errors.toBankId && (
                <p className="mt-1 text-sm text-red-600">{errors.toBankId}</p>
              )}
            </div>

            {/* Transfer Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transfer Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                  PKR
                </span>
                <input
                  type="number"
                  value={formData.amount || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, amount: Number(e.target.value) });
                    if (errors.amount) setErrors({ ...errors, amount: '' });
                  }}
                  className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.amount 
                      ? 'border-red-300 focus:ring-red-200' 
                      : 'border-gray-300 focus:ring-green-200 focus:border-green-500'
                  }`}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              )}
            </div>

            {/* Transfer Summary */}
            {fromBank && toBank && formData.amount > 0 && (
              <div className={`p-4 rounded-lg border-2 ${
                fromBank.balance >= formData.amount 
                  ? 'bg-green-50 border-green-300' 
                  : 'bg-red-50 border-red-300'
              }`}>
                <div className="flex items-start gap-3">
                  {fromBank.balance >= formData.amount ? (
                    <TrendingDown size={22} className="text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle size={22} className="text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900 mb-3">📊 Transfer Summary</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-white rounded">
                        <span className="text-sm text-gray-600">Source Balance:</span>
                        <span className="font-bold text-gray-900">
                          {formatCurrency(fromBank.balance)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded">
                        <span className="text-sm text-gray-600">Transfer Amount:</span>
                        <span className="font-bold text-red-600">
                          - {formatCurrency(formData.amount)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded border-t-2 border-gray-200">
                        <span className="text-sm font-semibold text-gray-700">Source After:</span>
                        <span className={`text-lg font-bold ${
                          fromBank.balance >= formData.amount ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {formatCurrency(fromBank.balance - formData.amount)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded border-t-2 border-gray-200">
                        <span className="text-sm font-semibold text-gray-700">Destination After:</span>
                        <span className="text-lg font-bold text-green-700">
                          {formatCurrency((toBank?.balance || 0) + formData.amount)}
                        </span>
                      </div>
                    </div>
                    {fromBank.balance < formData.amount && (
                      <div className="mt-3 p-2 bg-red-100 rounded flex items-center gap-2">
                        <AlertCircle size={16} className="text-red-600" />
                        <p className="text-xs text-red-700 font-semibold">
                          ⚠️ Insufficient balance for this transfer!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note (Optional)
              </label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500 resize-none"
                placeholder="Transfer purpose or additional notes"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/banking/transfers')}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <ArrowRightLeft size={20} />
                Complete Transfer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
