// Transactions Module - Transaction Form View
// UI exactly same as src/pages/transactions/CreateTransactionPage.tsx
// Updated to use banks from props instead of hardcoded BANKS constant

import { useState, useEffect } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import { Transaction } from '../models/types';
import { COMPANIES, SUB_CATEGORIES } from '../models/types';
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
  Repeat
} from 'lucide-react';
import { toast } from "sonner";

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

// Bank type for transactions
interface BankInfo {
  id: string;
  name: string;
  balance: number;
}

interface TransactionFormViewProps {
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  banks: BankInfo[];
  existingTransaction?: Transaction;
}

export function TransactionFormView({ transactions, setTransactions, banks, existingTransaction }: TransactionFormViewProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id && !!existingTransaction;

  // General Information
  const [office, setOffice] = useState(COMPANIES[0].id);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Transaction Type
  const [transactionType, setTransactionType] = useState<'Cash Inflow' | 'Cash Outflow' | 'Loan'>('Cash Inflow');
  
  // Payment Mode
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Bank' | 'Cheque'>('Bank');
  const [selectedBank, setSelectedBank] = useState('');
  
  // Multiple transactions
  const [enableMultiple, setEnableMultiple] = useState(false);
  const [transactionItems, setTransactionItems] = useState<TransactionItem[]>([
    {
      id: Date.now().toString(),
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
    }
  ]);

  const [availableSubCategories, setAvailableSubCategories] = useState<string[]>([]);

  // Load existing transaction for editing
  useEffect(() => {
    if (existingTransaction) {
      const officeId = COMPANIES.find(o => existingTransaction.company?.includes(o.name.split(':')[1]?.trim()))?.id || COMPANIES[0].id;
      setOffice(officeId);
      setDate(existingTransaction.date);
      setTransactionType(existingTransaction.mainCategory as 'Cash Inflow' | 'Cash Outflow' | 'Loan');
      setPaymentMode(existingTransaction.mode as 'Cash' | 'Bank' | 'Cheque');
      
      if (existingTransaction.bankName) {
        const bankId = banks.find(b => existingTransaction.bankName?.includes(b.name))?.id || '';
        setSelectedBank(bankId);
      }
      
      setAvailableSubCategories(SUB_CATEGORIES[existingTransaction.mainCategory] || []);
      
      setTransactionItems([{
        id: existingTransaction.id,
        mainCategory: existingTransaction.mainCategory || '',
        subCategory: existingTransaction.subCategory || '',
        detailCategory: (existingTransaction as any).detailCategory || '',
        amount: existingTransaction.amount || 0,
        amountPaid: (existingTransaction as any).amountPaid || existingTransaction.amount || 0,
        remainingAmount: (existingTransaction as any).remainingAmount || 0,
        paymentStatus: (existingTransaction as any).paymentStatus || 'Full',
        paidBy: (existingTransaction as any).paidBy || '',
        paidTo: (existingTransaction as any).paidTo || '',
        note: existingTransaction.note || ''
      }]);
    }
  }, [existingTransaction, banks]);

  // Get selected bank balance from passed banks array
  const selectedBankData = banks.find(b => b.id === selectedBank);
  const currentBankBalance = selectedBankData?.balance || 0;

  const handleTransactionTypeChange = (type: 'Cash Inflow' | 'Cash Outflow' | 'Loan') => {
    setTransactionType(type);
    setAvailableSubCategories(SUB_CATEGORIES[type] || []);
    setTransactionItems(items => items.map(item => ({
      ...item,
      mainCategory: type,
      subCategory: ''
    })));
  };

  const handleAddTransactionItem = () => {
    setTransactionItems([...transactionItems, {
      id: Date.now().toString(),
      mainCategory: transactionType,
      subCategory: '',
      detailCategory: '',
      amount: 0,
      amountPaid: 0,
      remainingAmount: 0,
      paymentStatus: 'Full',
      paidBy: '',
      paidTo: '',
      note: ''
    }]);
  };

  const handleRemoveTransactionItem = (id: string) => {
    if (transactionItems.length > 1) {
      setTransactionItems(transactionItems.filter(item => item.id !== id));
    }
  };

  const updateTransactionItem = (id: string, field: keyof TransactionItem, value: any) => {
    setTransactionItems(items => items.map(item => {
      if (item.id !== id) return item;
      
      const updated = { ...item, [field]: value };
      
      if (field === 'amount' || field === 'amountPaid') {
        const amount = field === 'amount' ? Number(value) : item.amount;
        const amountPaid = field === 'amountPaid' ? Number(value) : item.amountPaid;
        updated.remainingAmount = Math.max(0, amount - amountPaid);
        updated.paymentStatus = amountPaid >= amount ? 'Full' : 'Partial';
      }
      
      return updated;
    }));
  };

  const calculateTotals = () => {
    const totalAmount = transactionItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalPaid = transactionItems.reduce((sum, item) => sum + (item.amountPaid || 0), 0);
    const totalRemaining = totalAmount - totalPaid;
    return { totalAmount, totalPaid, totalRemaining };
  };

  const handleSave = () => {
    const invalidItems = transactionItems.filter(item => !item.subCategory || item.amount <= 0);
    if (invalidItems.length > 0) {
      toast.error('Please fill in all required fields for each transaction');
      return;
    }

    if (paymentMode === 'Bank' && !selectedBank) {
      toast.error('Please select a bank for bank transactions');
      return;
    }

    const { totalPaid } = calculateTotals();

    const newTransactions: Transaction[] = transactionItems.map((item, index) => ({
      id: isEditing && existingTransaction ? existingTransaction.id : `${Date.now()}-${index}`,
      transactionId: isEditing && existingTransaction ? existingTransaction.transactionId : `TXN-${Date.now()}-${index}`,
      date: date,
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      company: COMPANIES.find(o => o.id === office)?.name || COMPANIES[0].name,
      mainCategory: transactionType as any,
      subCategory: item.subCategory,
      amount: item.amount,
      mode: paymentMode,
      bankName: paymentMode === 'Bank' ? selectedBankData?.name : undefined,
      note: item.note,
      detailCategory: item.detailCategory,
      amountPaid: item.amountPaid,
      remainingAmount: item.remainingAmount,
      paymentStatus: item.paymentStatus,
      paidBy: item.paidBy,
      paidTo: item.paidTo
    }));

    if (isEditing && existingTransaction) {
      setTransactions(transactions.map(t => 
        t.id === existingTransaction.id ? { ...newTransactions[0], id: existingTransaction.id, transactionId: existingTransaction.transactionId } : t
      ));
      toast.success('Transaction updated successfully');
    } else {
      setTransactions([...newTransactions, ...transactions]);
      toast.success(`${newTransactions.length} transaction(s) added successfully`);
    }
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
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const { totalAmount, totalPaid, totalRemaining } = calculateTotals();
  const remainingBalanceAfter = currentBankBalance + (transactionType === 'Cash Inflow' ? totalPaid : -totalPaid);

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
            <h2 className="text-3xl font-bold text-gray-900">{isEditing ? 'Edit Transaction' : 'Add Transaction'}</h2>
            <p className="text-gray-600 mt-1">Record a new financial transaction</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* General Information */}
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
                  {COMPANIES.map(o => (
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

          {/* Transaction Type */}
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

          {/* Payment Mode */}
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
                    {banks.map(bank => (
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

          {/* Transaction Summary */}
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
                    {transactionType === 'Cash Inflow' ? '+' : '-'} {formatCurrency(totalPaid)}
                  </span>
                </div>
                <div className="border-t border-gray-300 pt-2 flex justify-between">
                  <span className="text-gray-900 font-medium">Remaining Balance After Transaction:</span>
                  <span className="font-bold text-[#4f46e5]">{formatCurrency(remainingBalanceAfter)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Multiple Transaction Toggle */}
          <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <Repeat className="w-5 h-5 text-[#4f46e5]" />
              <div>
                <p className="font-medium text-gray-900">Enable multiple transactions entry</p>
                <p className="text-sm text-gray-500">For batch processing multiple items at once</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableMultiple}
                onChange={(e) => setEnableMultiple(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#4f46e5]/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4f46e5]"></div>
            </label>
          </div>

          {/* Transaction Items */}
          <div className="space-y-4">
            {transactionItems.map((item, index) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Transaction #{index + 1}
                  </h3>
                  {enableMultiple && transactionItems.length > 1 && (
                    <button
                      onClick={() => handleRemoveTransactionItem(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sub Category *</label>
                    <select
                      value={item.subCategory}
                      onChange={(e) => updateTransactionItem(item.id, 'subCategory', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    >
                      <option value="">Select sub category</option>
                      {(SUB_CATEGORIES[transactionType] || []).map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Detail Category (Optional)</label>
                    <input
                      type="text"
                      value={item.detailCategory}
                      onChange={(e) => updateTransactionItem(item.id, 'detailCategory', e.target.value)}
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
                        value={item.amount || ''}
                        onChange={(e) => updateTransactionItem(item.id, 'amount', Number(e.target.value))}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid *</label>
                      <input
                        type="number"
                        value={item.amountPaid || ''}
                        onChange={(e) => updateTransactionItem(item.id, 'amountPaid', Number(e.target.value))}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                      <div className={`px-3 py-2 rounded-lg border ${
                        item.paymentStatus === 'Full' 
                          ? 'bg-green-50 border-green-200 text-green-700' 
                          : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                      }`}>
                        <div className="flex items-center gap-2">
                          {item.paymentStatus === 'Full' ? (
                            <><CheckCircle size={16} /> Full</>
                          ) : (
                            <><AlertCircle size={16} /> Partial</>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {item.paymentStatus === 'Partial' && item.remainingAmount > 0 && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        ⚠️ Partial payment - remaining amount will be tracked
                      </p>
                      <p className="text-lg font-bold text-yellow-700 mt-1">
                        Remaining Amount: {formatCurrency(item.remainingAmount)}
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
                          value={item.paidBy}
                          onChange={(e) => updateTransactionItem(item.id, 'paidBy', e.target.value)}
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
                          value={item.paidTo}
                          onChange={(e) => updateTransactionItem(item.id, 'paidTo', e.target.value)}
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
                    value={item.note}
                    onChange={(e) => updateTransactionItem(item.id, 'note', e.target.value)}
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
                        onChange={(e) => updateTransactionItem(item.id, 'receipt', e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                    {item.receipt && (
                      <span className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle size={14} />
                        {item.receipt.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Add Another Transaction Button */}
            {enableMultiple && (
              <button
                onClick={handleAddTransactionItem}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-[#4f46e5] hover:text-[#4f46e5] hover:bg-[#4f46e5]/5 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Add Another Transaction
              </button>
            )}
          </div>

          {/* Grand Total Summary */}
          <div className="bg-[#4f46e5] text-white rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Grand Total Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-[#4f46e5]/80 text-sm mb-1">Total Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
              </div>
              <div className="text-center border-x border-white/20">
                <p className="text-[#4f46e5]/80 text-sm mb-1">Total Paid</p>
                <p className="text-2xl font-bold text-green-300">{formatCurrency(totalPaid)}</p>
              </div>
              <div className="text-center">
                <p className="text-[#4f46e5]/80 text-sm mb-1">Total Remaining</p>
                <p className="text-2xl font-bold text-yellow-300">{formatCurrency(totalRemaining)}</p>
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
              className="flex items-center gap-2 px-6 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors font-medium"
            >
              <Plus size={18} />
              {isEditing ? 'Save Changes' : `Save ${transactionItems.length > 1 ? `${transactionItems.length} Transactions` : 'Transaction'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
