import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Transaction, Bank } from '../../App';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Upload, 
  X,
  Zap,
  Wifi,
  Droplets,
  Receipt,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';

const billCategories = {
  'Electricity': ['LESCO', 'IESCO', 'K-Electric', 'Generator Fuel'],
  'Internet': ['PTCL', 'StormFiber', 'Nayatel'],
  'Utilities': ['Sui Gas', 'Water Board', 'Sanitation']
};

const predefinedVendors = [
  'LESCO', 'IESCO', 'K-Electric', 'PTCL', 'StormFiber', 'Nayatel',
  'Sui Gas', 'Water Board', 'City Sanitation', 'Generator Supplier',
  'Office Landlord', 'Maintenance Company'
];

const companies = [
  'Pakistan Detectors Technologies: Islamabad/ Head Office',
  'Pakistan Detectors Technologies: Karachi',
  'Pakistan Detectors Technologies: Lahore',
  'Pakistan Detectors Technologies: Bullion RND/ SITE office'
];

type BillTransaction = {
  id: string;
  amount: number;
  paidBy: string;
  paidTo: string;
  transactionBy: string;
  mode: 'Cash' | 'Bank' | 'Cheque';
  bankName: string;
  imageUrl: string;
  paymentStatus: 'Full' | 'Partial';
  remainingAmount: number;
  billMonth: string;
};

export function CreateBillPage() {
  const navigate = useNavigate();
  const { transactions, setTransactions, banks, setBanks } = useOutletContext<{
    transactions: Transaction[];
    setTransactions: (transactions: Transaction[]) => void;
    banks: Bank[];
    setBanks: (banks: Bank[]) => void;
  }>();

  const [formData, setFormData] = useState({
    company: companies[0],
    billCategory: 'Electricity' as keyof typeof billCategories,
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  const [billTransactions, setBillTransactions] = useState<BillTransaction[]>([{
    id: Date.now().toString(),
    amount: 0,
    paidBy: 'Pakistan Detectors - Islamabad',
    paidTo: '',
    transactionBy: '',
    mode: 'Cash',
    bankName: '',
    imageUrl: '',
    paymentStatus: 'Full',
    remainingAmount: 0,
    billMonth: new Date().toISOString().slice(0, 7)
  }]);

  const addBillTransaction = () => {
    setBillTransactions([...billTransactions, {
      id: Date.now().toString(),
      amount: 0,
      paidBy: formData.company.split(': ')[1] || formData.company,
      paidTo: '',
      transactionBy: '',
      mode: 'Cash',
      bankName: '',
      imageUrl: '',
      paymentStatus: 'Full',
      remainingAmount: 0,
      billMonth: new Date().toISOString().slice(0, 7)
    }]);
  };

  const removeBillTransaction = (id: string) => {
    if (billTransactions.length > 1) {
      setBillTransactions(billTransactions.filter(t => t.id !== id));
    }
  };

  const updateBillTransaction = (id: string, field: keyof BillTransaction, value: any) => {
    setBillTransactions(billTransactions.map(t => {
      const updated = t.id === id ? { ...t, [field]: value } : t;
      if (field === 'mode' && value === 'Cash') {
        updated.bankName = '';
      }
      return updated;
    }));
  };

  const handleImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.match(/image\/(jpg|jpeg|png)/)) {
        toast.error('Please upload a JPG or PNG image');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        updateBillTransaction(id, 'imageUrl', reader.result as string);
        toast.success('Image uploaded');
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateTotal = () => {
    return billTransactions.reduce((sum, t) => sum + t.amount, 0);
  };

  const handleSave = () => {
    // Validate all transactions
    for (const billTxn of billTransactions) {
      if (!billTxn.paidBy || !billTxn.paidTo || !billTxn.amount) {
        toast.error('Please fill in all required fields for each transaction');
        return;
      }

      if ((billTxn.mode === 'Bank' || billTxn.mode === 'Cheque') && !billTxn.bankName) {
        toast.error('Please select a bank for bank/cheque transactions');
        return;
      }

      if ((billTxn.mode === 'Bank' || billTxn.mode === 'Cheque') && billTxn.bankName) {
        const bank = banks.find(b => b.name === billTxn.bankName);
        if (bank && bank.balance < billTxn.amount) {
          toast.error(`Insufficient balance in ${bank.name}`);
          return;
        }
      }
    }

    // Create individual transaction records
    const newTransactions: Transaction[] = billTransactions.map((billTxn) => ({
      id: Date.now().toString() + Math.random().toString(),
      transactionId: `TXN-${Date.now()}${Math.random().toString().slice(-4)}`,
      date: formData.date,
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      company: formData.company,
      mainCategory: 'Bills',
      subCategory: formData.billCategory,
      amount: billTxn.amount,
      mode: billTxn.mode,
      bankName: billTxn.bankName,
      paidBy: billTxn.paidBy,
      paidTo: billTxn.paidTo,
      transactionBy: billTxn.transactionBy,
      billMonth: billTxn.billMonth,
      note: formData.note,
      imageUrl: billTxn.imageUrl,
      paymentStatus: billTxn.paymentStatus,
      remainingAmount: billTxn.remainingAmount
    }));

    // Update bank balances
    if (setBanks) {
      const updatedBanks = [...banks];
      for (const billTxn of billTransactions) {
        if ((billTxn.mode === 'Bank' || billTxn.mode === 'Cheque') && billTxn.bankName) {
          const bankIndex = updatedBanks.findIndex(b => b.name === billTxn.bankName);
          if (bankIndex !== -1) {
            updatedBanks[bankIndex] = {
              ...updatedBanks[bankIndex],
              balance: updatedBanks[bankIndex].balance - billTxn.amount
            };
          }
        }
      }
      setBanks(updatedBanks);
    }

    setTransactions([...transactions, ...newTransactions]);
    toast.success(`${newTransactions.length} bill transaction(s) added successfully`);
    navigate('/bills');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Electricity':
        return <Zap className="w-5 h-5 text-yellow-600" />;
      case 'Internet':
        return <Wifi className="w-5 h-5 text-blue-600" />;
      case 'Utilities':
        return <Droplets className="w-5 h-5 text-cyan-600" />;
      default:
        return <Receipt className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/bills')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Add Bill</h2>
            <p className="text-gray-600 mt-1">Create a new utility bill payment</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                >
                  {companies.map(company => (
                    <option key={company} value={company}>{company.split(': ')[1] || company}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bill Category *</label>
              <div className="relative">
                {getCategoryIcon(formData.billCategory)}
                <select
                  value={formData.billCategory}
                  onChange={(e) => setFormData({ ...formData, billCategory: e.target.value as keyof typeof billCategories })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                >
                  {Object.keys(billCategories).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <input
                type="text"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                placeholder="Additional notes"
              />
            </div>
          </div>

          {/* Bill Transactions */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Bill Transactions</h3>
              <button
                onClick={addBillTransaction}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors text-sm"
              >
                <Plus size={16} />
                Add Transaction
              </button>
            </div>

            <div className="space-y-4">
              {billTransactions.map((txn, index) => (
                <div key={txn.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-sm font-medium text-gray-700">Transaction {index + 1}</span>
                    {billTransactions.length > 1 && (
                      <button
                        onClick={() => removeBillTransaction(txn.id)}
                        className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Amount *</label>
                      <input
                        type="number"
                        value={txn.amount || ''}
                        onChange={(e) => updateBillTransaction(txn.id, 'amount', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Payment Status *</label>
                      <select
                        value={txn.paymentStatus}
                        onChange={(e) => updateBillTransaction(txn.id, 'paymentStatus', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm"
                      >
                        <option value="Full">Full Payment</option>
                        <option value="Partial">Partial Payment</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Bill Month *</label>
                      <input
                        type="month"
                        value={txn.billMonth}
                        onChange={(e) => updateBillTransaction(txn.id, 'billMonth', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm"
                      />
                    </div>
                  </div>

                  {txn.paymentStatus === 'Partial' && (
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Remaining Amount *</label>
                      <input
                        type="number"
                        value={txn.remainingAmount || ''}
                        onChange={(e) => updateBillTransaction(txn.id, 'remainingAmount', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm"
                        placeholder="Enter remaining amount"
                      />
                      {txn.amount && txn.remainingAmount && (
                        <p className="text-xs text-gray-600 mt-1">
                          Paid: {formatCurrency(txn.amount - txn.remainingAmount)} | Remaining: {formatCurrency(txn.remainingAmount)}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Paid To (Vendor) *</label>
                      <select
                        value={txn.paidTo}
                        onChange={(e) => updateBillTransaction(txn.id, 'paidTo', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm"
                      >
                        <option value="">Select vendor</option>
                        {predefinedVendors.map(vendor => (
                          <option key={vendor} value={vendor}>{vendor}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Paid By (Person/Company) *</label>
                      <input
                        type="text"
                        value={txn.paidBy}
                        onChange={(e) => updateBillTransaction(txn.id, 'paidBy', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm"
                        placeholder="e.g., Pakistan Detectors - Islamabad"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Transaction By</label>
                      <input
                        type="text"
                        value={txn.transactionBy}
                        onChange={(e) => updateBillTransaction(txn.id, 'transactionBy', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm"
                        placeholder="e.g., Sir ABC, Manager Ahmed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method *</label>
                      <select
                        value={txn.mode}
                        onChange={(e) => updateBillTransaction(txn.id, 'mode', e.target.value as 'Cash' | 'Bank' | 'Cheque')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Bank">Bank Transfer</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                    </div>
                    {(txn.mode === 'Bank' || txn.mode === 'Cheque') && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Bank Name *</label>
                        <select
                          value={txn.bankName}
                          onChange={(e) => updateBillTransaction(txn.id, 'bankName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm"
                        >
                          <option value="">Select bank</option>
                          {banks.map(bank => (
                            <option key={bank.id} value={bank.name}>
                              {bank.name} (Balance: {formatCurrency(bank.balance)})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Receipt Image (JPG/PNG)</label>
                      <div className="flex items-center gap-2">
                        <label className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                          <Upload size={16} className="mr-2" />
                          <span className="text-sm">{txn.imageUrl ? 'Change Image' : 'Upload Image'}</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            onChange={(e) => handleImageUpload(txn.id, e)}
                            className="hidden"
                          />
                        </label>
                        {txn.imageUrl && (
                          <button
                            onClick={() => updateBillTransaction(txn.id, 'imageUrl', '')}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Remove image"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                      {txn.imageUrl && (
                        <img src={txn.imageUrl} alt="Receipt" className="mt-2 h-20 w-20 object-cover rounded border" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="bg-[#4f46e5]/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
              <span className="text-2xl font-bold text-[#4f46e5]">{formatCurrency(calculateTotal())}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t">
            <button
              onClick={() => navigate('/bills')}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors font-medium"
            >
              Save Bill(s)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
