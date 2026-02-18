import { useState, useEffect } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { Transaction, Bank } from '../../App';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Building2,
  Wallet,
  TrendingUp,
  TrendingDown,
  Upload,
  Calculator,
  User,
  Users,
  CheckCircle,
  AlertCircle,
  Repeat,
  Save
} from 'lucide-react';
import { toast } from 'sonner';

// Office/Branch options
const offices = [
  { id: 'isb', name: 'Pakistan Detectors Technologies: Islamabad' },
  { id: 'khi', name: 'Pakistan Detectors Technologies: Karachi' },
  { id: 'lhr', name: 'Pakistan Detectors Technologies: Lahore' },
  { id: 'bul', name: 'Pakistan Detectors Technologies: Bullion' },
  { id: 'rnd', name: 'Pakistan Detectors Technologies: RND/SITE Office' }
];

const mainCategories = ['Cash Inflow', 'Cash Outflow', 'Loan'];

const subCategories: Record<string, string[]> = {
  'Cash Inflow': [
    'Product sale received',
    'Payment received - Customers',
    'Payment received - Company',
    'TCS/DHL/LCS payment received',
    'Commission received',
    'Loan received - From Employee',
    'Loan received - From Company',
    'Other'
  ],
  'Cash Outflow': [
    'Employee salary',
    'Advance salary',
    'Commission paid - Employee',
    'Commission paid - Dealer',
    'Loan paid to employee',
    'Office Rent',
    'Electricity Bill',
    'Gas Bill',
    'Water Bill',
    'Internet Bill',
    'PTCL Bill',
    'Petrol expense',
    'Kitchen Expense',
    'Grocery Expense',
    'Stationery Expense',
    'Marketing/SEO/VPN',
    'Courier',
    'Bykea/delivery',
    'Parcel received Payment',
    'Payment to company',
    'Payment to person',
    'Purchase',
    'Repair payment',
    'Cylinder payment',
    'Medical/hospital bill',
    'Personal expense/Non business',
    'Other payment'
  ],
  'Loan': [
    'Loan given',
    'Loan received',
    'Official Loan',
    'Personal loan',
    'Other loan - Full',
    'Other loan - Partial'
  ]
};

// Mock bank data with balances
const bankData = [
  { id: 'hbl', name: 'HBL Main Branch', balance: 1850000 },
  { id: 'mcb', name: 'MCB Bank', balance: 950000 },
  { id: 'abl', name: 'Allied Bank', balance: 750000 },
  { id: 'ubl', name: 'United Bank Limited', balance: 1200000 },
  { id: 'meezan', name: 'Meezan Bank', balance: 500000 },
  { id: 'alfalah', name: 'Bank Alfalah', balance: 850000 }
];

type TransactionItem = {
  id: string;
  mainCategory: string;
  subCategory: string;
  detailCategory: string;
  amount: number;
  amountPaid: number;
  remainingAmount: number;
  paymentStatus: 'Full' | 'Partial';
  paidBy: string;
  paidTo: string;
  note: string;
  receipt?: File | null;
};

export function EditTransactionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { transactions, setTransactions } = useOutletContext<{
    transactions: Transaction[];
    setTransactions: (transactions: Transaction[]) => void;
    banks: Bank[];
  }>();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // General Information
  const [office, setOffice] = useState(offices[0].id);
  const [date, setDate] = useState('');
  
  // Transaction Type
  const [transactionType, setTransactionType] = useState<'Cash Inflow' | 'Cash Outflow' | 'Loan'>('Cash Inflow');
  
  // Payment Mode
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Bank' | 'Cheque'>('Bank');
  const [selectedBank, setSelectedBank] = useState('');
  
  // Transaction Items (single item for edit)
  const [transactionItem, setTransactionItem] = useState<TransactionItem>({
    id: '',
    mainCategory: '',
    subCategory: '',
    detailCategory: '',
    amount: 0,
    amountPaid: 0,
    remainingAmount: 0,
    paymentStatus: 'Full',
    paidBy: '',
    paidTo: '',
    note: ''
  });

  const [availableSubCategories, setAvailableSubCategories] = useState<string[]>([]);

  // Get selected bank balance
  const selectedBankData = bankData.find(b => b.id === selectedBank);
  const currentBankBalance = selectedBankData?.balance || 0;

  useEffect(() => {
    const foundTransaction = transactions.find(t => t.id === id);
    if (foundTransaction) {
      setTransaction(foundTransaction);
      
      // Set office
      const officeId = offices.find(o => foundTransaction.company?.includes(o.name.split(':')[1]?.trim()))?.id || offices[0].id;
      setOffice(officeId);
      
      // Set date
      setDate(foundTransaction.date);
      
      // Set transaction type
      const type = (foundTransaction.mainCategory as 'Cash Inflow' | 'Cash Outflow' | 'Loan') || 'Cash Inflow';
      setTransactionType(type);
      setAvailableSubCategories(subCategories[type] || []);
      
      // Set payment mode
      setPaymentMode((foundTransaction.mode as 'Cash' | 'Bank' | 'Cheque') || 'Bank');
      
      // Set bank
      if (foundTransaction.bankName) {
        const bankId = bankData.find(b => foundTransaction.bankName?.includes(b.name))?.id || '';
        setSelectedBank(bankId);
      }
      
      // Set transaction item data
      setTransactionItem({
        id: foundTransaction.id,
        mainCategory: foundTransaction.mainCategory || '',
        subCategory: foundTransaction.subCategory || '',
        detailCategory: (foundTransaction as any).detailCategory || '',
        amount: foundTransaction.amount || 0,
        amountPaid: (foundTransaction as any).amountPaid || foundTransaction.amount || 0,
        remainingAmount: (foundTransaction as any).remainingAmount || 0,
        paymentStatus: ((foundTransaction as any).paymentStatus as 'Full' | 'Partial') || 'Full',
        paidBy: (foundTransaction as any).paidBy || '',
        paidTo: (foundTransaction as any).paidTo || '',
        note: foundTransaction.note || ''
      });
    }
    setIsLoading(false);
  }, [id, transactions]);

  const handleTransactionTypeChange = (type: 'Cash Inflow' | 'Cash Outflow' | 'Loan') => {
    setTransactionType(type);
    setAvailableSubCategories(subCategories[type] || []);
    setTransactionItem(prev => ({
      ...prev,
      mainCategory: type,
      subCategory: ''
    }));
  };

  const updateTransactionItem = (field: keyof TransactionItem, value: any) => {
    setTransactionItem(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate remaining amount when amount or amountPaid changes
      if (field === 'amount' || field === 'amountPaid') {
        const amount = field === 'amount' ? Number(value) : prev.amount;
        const amountPaid = field === 'amountPaid' ? Number(value) : prev.amountPaid;
        updated.remainingAmount = Math.max(0, amount - amountPaid);
        updated.paymentStatus = amountPaid >= amount ? 'Full' : 'Partial';
      }
      
      return updated;
    });
  };

  const handleSave = () => {
    if (!transaction) return;

    // Validation
    if (!transactionItem.subCategory) {
      toast.error('Please select a sub category');
      return;
    }
    if (!transactionItem.amount || transactionItem.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!transactionItem.paidBy || !transactionItem.paidTo) {
      toast.error('Please fill in Paid By and Paid To fields');
      return;
    }
    if (paymentMode === 'Bank' && !selectedBank) {
      toast.error('Please select a bank for bank transactions');
      return;
    }

    setIsSaving(true);

    const updatedTransaction = {
      ...transaction,
      date: date,
      company: offices.find(o => o.id === office)?.name || offices[0].name,
      mainCategory: transactionType,
      subCategory: transactionItem.subCategory,
      amount: transactionItem.amount,
      mode: paymentMode,
      bankName: paymentMode === 'Bank' ? selectedBankData?.name : undefined,
      note: transactionItem.note,
      // Additional fields stored in note or as extended properties
      detailCategory: transactionItem.detailCategory,
      amountPaid: transactionItem.amountPaid,
      remainingAmount: transactionItem.remainingAmount,
      paymentStatus: transactionItem.paymentStatus,
      paidBy: transactionItem.paidBy,
      paidTo: transactionItem.paidTo
    } as Transaction;


    setTransactions(transactions.map(t => t.id === id ? updatedTransaction : t));
    toast.success('Transaction updated successfully');
    navigate('/transactions');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const remainingBalanceAfter = currentBankBalance + (transactionType === 'Cash Inflow' ? transactionItem.amountPaid : -transactionItem.amountPaid);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4f46e5] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transaction...</p>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Transaction Not Found</h2>
          <p className="text-gray-600 mb-4">The transaction you're trying to edit doesn't exist.</p>
          <button
            onClick={() => navigate('/transactions')}
            className="px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca]"
          >
            Back to Transactions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/transactions')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Edit Transaction</h2>
            <p className="text-gray-600 mt-1">Update transaction details</p>
          </div>
        </div>

        {/* Transaction ID Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Transaction ID</p>
              <p className="font-mono font-medium">{transaction.transactionId || transaction.id}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Original Amount</p>
              <p className="text-xl font-bold text-[#4f46e5]">
                {formatCurrency(transaction.amount || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* 📋 General Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#4f46e5]" />
              General Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Office/Branch *</label>
                <select
                  value={office}
                  onChange={(e) => setOffice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                >
                  {offices.map(o => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                />
                <p className="text-xs text-gray-500 mt-1">{formatDateDisplay(date)}</p>
              </div>
            </div>
          </div>

          {/* 💸 Transaction Type */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#4f46e5]" />
              Transaction Type
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {(['Cash Inflow', 'Cash Outflow', 'Loan'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => handleTransactionTypeChange(type)}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    transactionType === type
                      ? 'border-[#4f46e5] bg-[#4f46e5]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-center mb-2">
                    {type === 'Cash Inflow' && <TrendingUp className="w-6 h-6 text-green-600" />}
                    {type === 'Cash Outflow' && <TrendingDown className="w-6 h-6 text-red-600" />}
                    {type === 'Loan' && <Wallet className="w-6 h-6 text-blue-600" />}
                  </div>
                  <span className="font-medium">{type}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 💰 Payment Mode */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#4f46e5]" />
              Payment Method
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {(['Cash', 'Bank', 'Cheque'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPaymentMode(mode)}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    paymentMode === mode
                      ? 'border-[#4f46e5] bg-[#4f46e5]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium">{mode}</span>
                </button>
              ))}
            </div>

            {paymentMode === 'Bank' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Bank *</label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                  >
                    <option value="">Select a bank</option>
                    {bankData.map(bank => (
                      <option key={bank.id} value={bank.id}>
                        {bank.name} - {formatCurrency(bank.balance)}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedBankData && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">💳 Available Bank Balance</p>
                    <p className="text-2xl font-bold text-blue-600">
                      Current Balance: {formatCurrency(currentBankBalance)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 📊 Transaction Summary */}
          {selectedBank && paymentMode === 'Bank' && (
            <div className="bg-[#4f46e5]/10 rounded-lg p-6 border border-[#4f46e5]/20">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[#4f46e5]" />
                Transaction Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Balance:</span>
                  <span className="font-medium">{formatCurrency(currentBankBalance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount to {transactionType === 'Cash Inflow' ? 'Add' : 'Deduct'}:</span>
                  <span className={`font-medium ${transactionType === 'Cash Inflow' ? 'text-green-600' : 'text-red-600'}`}>
                    {transactionType === 'Cash Inflow' ? '+' : '-'} {formatCurrency(transactionItem.amountPaid)}
                  </span>
                </div>
                <div className="border-t border-gray-300 pt-2 flex justify-between">
                  <span className="text-gray-900 font-medium">Remaining Balance After Transaction:</span>
                  <span className="font-bold text-[#4f46e5]">{formatCurrency(remainingBalanceAfter)}</span>
                </div>
              </div>
            </div>
          )}

          {/* 📁 Transaction Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Details</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Main Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Main Category *</label>
                <select
                  value={transactionType}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                >
                  <option>{transactionType}</option>
                </select>
              </div>

              {/* Sub Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sub Category *</label>
                <select
                  value={transactionItem.subCategory}
                  onChange={(e) => updateTransactionItem('subCategory', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                >
                  <option value="">Select sub category</option>
                  {(subCategories[transactionType] || []).map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              {/* Detail Category */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Detail Category (Optional)</label>
                <input
                  type="text"
                  value={transactionItem.detailCategory}
                  onChange={(e) => updateTransactionItem('detailCategory', e.target.value)}
                  placeholder="Enter detail (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                />
              </div>
            </div>

            {/* Amount Section */}
            <div className="border-t pt-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-3">Amount Details</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount *</label>
                  <input
                    type="number"
                    value={transactionItem.amount || ''}
                    onChange={(e) => updateTransactionItem('amount', Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid *</label>
                  <input
                    type="number"
                    value={transactionItem.amountPaid || ''}
                    onChange={(e) => updateTransactionItem('amountPaid', Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                  <div className={`px-3 py-2 rounded-lg border ${
                    transactionItem.paymentStatus === 'Full' 
                      ? 'bg-green-50 border-green-200 text-green-700' 
                      : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                  }`}>
                    <div className="flex items-center gap-2">
                      {transactionItem.paymentStatus === 'Full' ? (
                        <><CheckCircle size={16} /> Full</>
                      ) : (
                        <><AlertCircle size={16} /> Partial</>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {transactionItem.paymentStatus === 'Partial' && transactionItem.remainingAmount > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Partial payment - remaining amount will be tracked
                  </p>
                  <p className="text-lg font-bold text-yellow-700 mt-1">
                    Remaining Amount: {formatCurrency(transactionItem.remainingAmount)}
                  </p>
                </div>
              )}
            </div>

            {/* Paid By / Paid To */}
            <div className="border-t pt-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Parties Involved
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paid By *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={transactionItem.paidBy}
                      onChange={(e) => updateTransactionItem('paidBy', e.target.value)}
                      placeholder="Who paid this amount"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paid To *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={transactionItem.paidTo}
                      onChange={(e) => updateTransactionItem('paidTo', e.target.value)}
                      placeholder="Who received this amount"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="border-t pt-4 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Note/Description</label>
              <textarea
                value={transactionItem.note}
                onChange={(e) => updateTransactionItem('note', e.target.value)}
                placeholder="Add any additional notes..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
              />
            </div>

            {/* Receipt Upload */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Receipt/Image (Optional)</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#4f46e5] hover:bg-[#4f46e5]/5 transition-colors">
                  <Upload size={18} className="text-gray-500" />
                  <span className="text-sm text-gray-600">Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => updateTransactionItem('receipt', e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
                {transactionItem.receipt && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle size={14} />
                    {transactionItem.receipt.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-[#4f46e5] text-white rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Transaction Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-white/80 text-sm mb-1">Total Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(transactionItem.amount)}</p>
              </div>
              <div className="text-center border-x border-white/20">
                <p className="text-white/80 text-sm mb-1">Amount Paid</p>
                <p className="text-2xl font-bold text-green-300">{formatCurrency(transactionItem.amountPaid)}</p>
              </div>
              <div className="text-center">
                <p className="text-white/80 text-sm mb-1">Remaining</p>
                <p className="text-2xl font-bold text-yellow-300">{formatCurrency(transactionItem.remainingAmount)}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <button
              onClick={() => navigate('/transactions')}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors font-medium disabled:opacity-50"
            >
              <Save size={18} />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
