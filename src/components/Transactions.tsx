import { useState, useRef, useMemo } from 'react';
import { Transaction, Bank } from '../App';
import { Plus, Eye, Edit, Trash2, X, Printer, Download, FileText, Upload, Image as ImageIcon, Maximize2, Minimize2, TrendingUp, TrendingDown, Banknote, DollarSign, Filter, AlertCircle, Wallet } from 'lucide-react';
import { toast } from 'sonner';

type TransactionsProps = {
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  banks: Bank[];
  setBanks: (banks: Bank[]) => void;
};

type TransactionRow = {
  amount: number;
  amountPaid?: number; // New field for amount paid
  note: string;
  mode: 'Cash' | 'Bank' | 'Cheque';
  bankId?: string;
  bankName?: string;
  paidBy?: string;
  paidTo?: string;
  paymentStatus?: 'Full' | 'Partial';
  remainingAmount?: number;
  imageUrl?: string;
};

const OFFICES = [
  'Pakistan Detectors Technologies: Islamabad',
  'Pakistan Detectors Technologies: Karachi',
  'Pakistan Detectors Technologies: Lahore'
];

// Enhanced hierarchical categories
const INFLOW_CATEGORIES = {
  'Operating Inflows': [
    'Payment Received',
    'TCS',
    'Daewoo',
    'UBL',
    'Company Account',
    'Commission Received'
  ],
  'Financial Inflows': [
    'Fundings'
  ]
};

const OUTFLOW_CATEGORIES = {
  'Employee & HR Costs': [
    'Allowances',
    'Fuel',
    'Repair',
    'Mobile Package',
    'Employee Benefits'
  ],
  'Office & Admin Expense': [
    'Office Rent',
    'Electricity',
    'Water',
    'Internet',
    'Office Supplies',
    'Kitchen Expense',
    'Zakat'
  ],
  'Supplier & Vendor Payment': [
    'Payment - Fisher',
    'Payment - TGX Lite',
    'Payment - Habib Metro',
    'Payment - Other Supplier',
    'Official Load',
    'Parcel - TCS',
    'Parcel - LCS',
    'Parcel - Daewoo'
  ],
  'IT & Technology': [
    'Digital Marketing',
    'SEO Tools',
    'Subscriptions',
    'VPN',
    'Hardware'
  ],
  'Commission & Other': [
    'Commission Paid',
    'Other Payment'
  ]
};

export function Transactions({ transactions, setTransactions, banks, setBanks }: TransactionsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewTransaction, setViewTransaction] = useState<Transaction | null>(null);
  const [viewSlip, setViewSlip] = useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isMultiRow, setIsMultiRow] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUploadIndex, setCurrentUploadIndex] = useState<number>(0);
  
  // Filters
  const [filterType, setFilterType] = useState<'All' | 'Inflow' | 'Outflow'>('All');
  const [filterOffice, setFilterOffice] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const [formData, setFormData] = useState({
    office: OFFICES[0],
    type: 'Inflow' as 'Inflow' | 'Outflow',
    mainCategory: '',
    subCategory: '',
    detailCategory: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [transactionRows, setTransactionRows] = useState<TransactionRow[]>([
    { amount: 0, note: '', mode: 'Cash', bankId: '', bankName: '', paidBy: '', paidTo: '', paymentStatus: 'Full', remainingAmount: 0 }
  ]);

  // Get main categories based on Inflow/Outflow type
  const getMainCategories = () => {
    return formData.type === 'Inflow' 
      ? Object.keys(INFLOW_CATEGORIES) 
      : Object.keys(OUTFLOW_CATEGORIES);
  };

  // Get sub categories based on main category
  const getSubCategories = () => {
    if (!formData.mainCategory) return [];
    const categories = formData.type === 'Inflow' ? INFLOW_CATEGORIES : OUTFLOW_CATEGORIES;
    return categories[formData.mainCategory] || [];
  };

  // Get bank balance preview with real-time calculation
  const getBankPreview = (bankId: string, amount: number) => {
    const bank = banks.find(b => b.id === bankId);
    if (!bank) return null;
    
    const isInflow = formData.type === 'Inflow';
    const newBalance = isInflow ? bank.balance + amount : bank.balance - amount;
    
    return {
      currentBalance: bank.balance,
      newBalance,
      bank,
      isValid: isInflow || bank.balance >= amount
    };
  };

  // Calculate total for multi-row
  const totalAmount = useMemo(() => {
    return transactionRows.reduce((sum, row) => sum + (row.amount || 0), 0);
  }, [transactionRows]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (filterType !== 'All') {
        const typeMatch = (filterType === 'Inflow' && t.mainCategory === 'Cash Inflow') ||
                         (filterType === 'Outflow' && t.mainCategory === 'Cash Outflow');
        if (!typeMatch) return false;
      }
      if (filterOffice && t.company !== filterOffice) return false;
      if (filterDateFrom && t.date < filterDateFrom) return false;
      if (filterDateTo && t.date > filterDateTo) return false;
      return true;
    });
  }, [transactions, filterType, filterOffice, filterDateFrom, filterDateTo]);

  // Calculate totals
  const totals = useMemo(() => {
    const inflow = filteredTransactions
      .filter(t => t.mainCategory === 'Cash Inflow')
      .reduce((sum, t) => sum + t.amount, 0);
    const outflow = filteredTransactions
      .filter(t => t.mainCategory === 'Cash Outflow')
      .reduce((sum, t) => sum + t.amount, 0);
    return { inflow, outflow, net: inflow - outflow };
  }, [filteredTransactions]);

  const handleAdd = () => {
    setEditingTransaction(null);
    setFormData({
      office: OFFICES[0],
      type: 'Inflow',
      mainCategory: '',
      subCategory: '',
      detailCategory: '',
      date: new Date().toISOString().split('T')[0]
    });
    setTransactionRows([
      { amount: 0, note: '', mode: 'Cash', bankId: '', bankName: '', paidBy: '', paidTo: '', paymentStatus: 'Full', remainingAmount: 0 }
    ]);
    setIsMultiRow(false);
    setIsFullScreen(false);
    setIsModalOpen(true);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      office: transaction.company,
      type: transaction.mainCategory === 'Cash Inflow' ? 'Inflow' : 'Outflow',
      mainCategory: transaction.subCategory,
      subCategory: '',
      detailCategory: '',
      date: transaction.date
    });
    setTransactionRows([{
      amount: transaction.amount,
      note: transaction.note,
      mode: transaction.mode,
      bankId: transaction.bankId,
      bankName: transaction.bankName,
      paidBy: transaction.paidBy,
      paidTo: transaction.paidTo,
      paymentStatus: transaction.paymentStatus,
      remainingAmount: transaction.remainingAmount,
      imageUrl: transaction.imageUrl
    }]);
    setIsMultiRow(false);
    setIsFullScreen(false);
    setIsModalOpen(true);
  };

  const handleBankChange = (index: number, bankId: string) => {
    const bank = banks.find(b => b.id === bankId);
    const updatedRows = [...transactionRows];
    updatedRows[index] = {
      ...updatedRows[index],
      bankId,
      bankName: bank?.name || ''
    };
    setTransactionRows(updatedRows);
  };

  const updateRow = (index: number, field: keyof TransactionRow, value: any) => {
    const updatedRows = [...transactionRows];
    updatedRows[index] = { ...updatedRows[index], [field]: value };

    // Auto-calculate remaining amount for partial payments
    if (field === 'amount' || field === 'amountPaid' || field === 'paymentStatus') {
      if (updatedRows[index].paymentStatus === 'Partial') {
        const totalAmount = updatedRows[index].amount || 0;
        const amountPaid = updatedRows[index].amountPaid || 0;
        updatedRows[index].remainingAmount = Math.max(0, totalAmount - amountPaid);
      } else {
        updatedRows[index].remainingAmount = 0;
        updatedRows[index].amountPaid = updatedRows[index].amount || 0;
      }
    }

    setTransactionRows(updatedRows);
  };

  const addRow = () => {
    setTransactionRows([
      ...transactionRows,
      { amount: 0, note: '', mode: 'Cash', bankId: '', bankName: '', paidBy: '', paidTo: '', paymentStatus: 'Full', remainingAmount: 0 }
    ]);
  };

  const removeRow = (index: number) => {
    if (transactionRows.length > 1) {
      setTransactionRows(transactionRows.filter((_, i) => i !== index));
    }
  };

  const handleImageUpload = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateRow(index, 'imageUrl', reader.result as string);
        toast.success('Image uploaded successfully');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    // Validate required fields
    if (!formData.office || !formData.type || !formData.mainCategory) {
      toast.error('Please fill in all required category fields');
      return;
    }

    // Validate all rows
    for (let i = 0; i < transactionRows.length; i++) {
      const row = transactionRows[i];
      
      if (!row.amount || row.amount <= 0) {
        toast.error(`Please enter a valid amount for row ${i + 1}`);
        return;
      }

      if (row.mode === 'Bank' && !row.bankId) {
        toast.error(`Please select a bank for row ${i + 1}`);
        return;
      }

      // Validate bank balance for outflow transactions
      if (formData.type === 'Outflow' && row.mode === 'Bank' && row.bankId) {
        const preview = getBankPreview(row.bankId, row.amount);
        if (preview && !preview.isValid) {
          toast.error(`Insufficient balance in ${preview.bank.name} for row ${i + 1}`);
          return;
        }
      }

      if (!row.paidBy) {
        toast.error(`Please enter "Paid By" for row ${i + 1}`);
        return;
      }

      if (!row.paidTo) {
        toast.error(`Please enter "Paid To" for row ${i + 1}`);
        return;
      }
    }

    // Create transactions
    const newTransactions: Transaction[] = transactionRows.map(row => ({
      id: editingTransaction?.id || `${Date.now()}-${Math.random()}`,
      date: formData.date,
      company: formData.office,
      mainCategory: formData.type === 'Inflow' ? 'Cash Inflow' : 'Cash Outflow',
      subCategory: formData.mainCategory,
      amount: row.amount,
      mode: row.mode,
      bankName: row.bankName,
      note: row.note,
      paidBy: row.paidBy,
      paidTo: row.paidTo,
      paymentStatus: row.paymentStatus,
      remainingAmount: row.remainingAmount,
      imageUrl: row.imageUrl
    }));

    // Update bank balances
    transactionRows.forEach(row => {
      if (row.mode === 'Bank' && row.bankId) {
        const bank = banks.find(b => b.id === row.bankId);
        if (bank) {
          const isInflow = formData.type === 'Inflow';
          const newBalance = isInflow ? bank.balance + row.amount : bank.balance - row.amount;
          
          const updatedBanks = banks.map(b => 
            b.id === row.bankId ? { ...b, balance: newBalance } : b
          );
          setBanks(updatedBanks);
        }
      }
    });

    if (editingTransaction) {
      setTransactions(transactions.map(t => 
        t.id === editingTransaction.id ? newTransactions[0] : t
      ));
      toast.success('Transaction updated successfully');
    } else {
      setTransactions([...transactions, ...newTransactions]);
      toast.success(`${newTransactions.length} transaction(s) added successfully`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      setTransactions(transactions.filter(t => t.id !== id));
      toast.success('Transaction deleted successfully');
    }
  };

  const handlePrint = (transaction: Transaction) => {
    setViewSlip(transaction);
    setTimeout(() => window.print(), 100);
  };

  const handleDownload = (transaction: Transaction) => {
    toast.success('Downloading transaction slip');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getCategoryColor = (mainCategory: string) => {
    return mainCategory === 'Cash Inflow' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getPaymentStatusColor = (status: string) => {
    return status === 'Full' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Transactions</h2>
          <p className="text-sm text-gray-600 mt-1">Manage all cash inflows and outflows</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters ? 'bg-[#4f46e5] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter size={20} />
            Filters
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 bg-[#4f46e5] text-white px-4 py-2 rounded-lg hover:bg-[#4338ca] transition-colors"
          >
            <Plus size={20} />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={24} />
            <p className="text-green-100">Total Inflow</p>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(totals.inflow)}</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown size={24} />
            <p className="text-red-100">Total Outflow</p>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(totals.outflow)}</p>
        </div>
        <div className="bg-gradient-to-br from-[#4f46e5] to-[#4338ca] text-white rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign size={24} />
            <p className="text-indigo-100">Net Flow</p>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(totals.net)}</p>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Filter Transactions</h3>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
              >
                <option value="All">All</option>
                <option value="Inflow">Inflow</option>
                <option value="Outflow">Outflow</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Office</label>
              <select
                value={filterOffice}
                onChange={(e) => setFilterOffice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
              >
                <option value="">All Offices</option>
                {OFFICES.map(office => (
                  <option key={office} value={office}>{office}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Office</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(transaction.date).toLocaleDateString('en-PK')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.company.split(':')[1]?.trim() || transaction.company}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(transaction.mainCategory)}`}>
                      {transaction.mainCategory}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.subCategory}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="inline-flex items-center gap-1">
                      {transaction.mode === 'Bank' && <Banknote size={14} />}
                      {transaction.mode}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {transaction.paymentStatus && (
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(transaction.paymentStatus)}`}>
                        {transaction.paymentStatus}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewTransaction(transaction)}
                        className="p-2 text-[#4f46e5] hover:bg-[#4f46e5]/10 rounded-lg transition-colors"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => setViewSlip(transaction)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="View Slip"
                      >
                        <FileText size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handlePrint(transaction)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Print Slip"
                      >
                        <Printer size={16} />
                      </button>
                      <button
                        onClick={() => handleDownload(transaction)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Download Slip"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="p-2 text-[#ef4444] hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No transactions available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className={`fixed inset-0 z-50 ${isFullScreen ? 'bg-white' : 'bg-black/50 flex items-center justify-center p-4'}`}>
          <div className={`bg-white ${isFullScreen ? 'w-full h-full flex flex-col' : 'rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col'}`}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-xl font-bold">{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsFullScreen(!isFullScreen)} 
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
                >
                  {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className={`${isFullScreen ? 'flex-1 overflow-y-auto' : 'overflow-y-auto'} p-6 space-y-6`}>
              {/* General Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-4">📋 General Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Office/Branch *</label>
                    <select
                      value={formData.office}
                      onChange={(e) => setFormData({ ...formData, office: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    >
                      {OFFICES.map(office => (
                        <option key={office} value={office}>{office}</option>
                      ))}
                    </select>
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
                </div>
              </div>

              {/* Transaction Type Toggle */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-4">💸 Transaction Type</h4>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'Inflow', mainCategory: '', subCategory: '', detailCategory: '' })}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                      formData.type === 'Inflow'
                        ? 'bg-green-500 text-white shadow-md'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <TrendingUp size={20} />
                      Cash Inflow
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'Outflow', mainCategory: '', subCategory: '', detailCategory: '' })}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                      formData.type === 'Outflow'
                        ? 'bg-red-500 text-white shadow-md'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <TrendingDown size={20} />
                      Cash Outflow
                    </div>
                  </button>
                </div>
              </div>

              {/* Category Selection */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-4">📁 Category Selection</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Main Category *</label>
                    <select
                      value={formData.mainCategory}
                      onChange={(e) => setFormData({ ...formData, mainCategory: e.target.value, subCategory: '', detailCategory: '' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    >
                      <option value="">Select main category</option>
                      {getMainCategories().map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sub Category *</label>
                    <select
                      value={formData.subCategory}
                      onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                      disabled={!formData.mainCategory}
                    >
                      <option value="">Select sub category</option>
                      {getSubCategories().map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Detail Category (Optional)</label>
                    <input
                      type="text"
                      value={formData.detailCategory}
                      onChange={(e) => setFormData({ ...formData, detailCategory: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                      placeholder="Enter detail (optional)"
                    />
                  </div>
                </div>
              </div>

              {/* Multi-row toggle */}
              {!editingTransaction && (
                <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-lg">
                  <input
                    type="checkbox"
                    id="multiRow"
                    checked={isMultiRow}
                    onChange={(e) => setIsMultiRow(e.target.checked)}
                    className="w-4 h-4 text-[#4f46e5] border-gray-300 rounded focus:ring-[#4f46e5]"
                  />
                  <label htmlFor="multiRow" className="text-sm font-medium text-gray-700">
                    Enable multiple transactions entry (for batch processing)
                  </label>
                </div>
              )}

              {/* Transaction Rows */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">💰 Transaction Details</h4>
                  {isMultiRow && (
                    <button
                      onClick={addRow}
                      className="flex items-center gap-2 text-sm bg-[#10b981] text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Plus size={16} />
                      Add Row
                    </button>
                  )}
                </div>

                {isMultiRow && (
                  <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
                    <p className="text-sm font-medium text-indigo-900">Total Amount: {formatCurrency(totalAmount)}</p>
                  </div>
                )}

                <div className="space-y-4">
                  {transactionRows.map((row, index) => {
                    const bankPreview = row.mode === 'Bank' && row.bankId ? getBankPreview(row.bankId, row.amount) : null;
                    
                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                        {isMultiRow && (
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium text-gray-700">Transaction #{index + 1}</h5>
                            {transactionRows.length > 1 && (
                              <button
                                onClick={() => removeRow(index)}
                                className="text-red-600 hover:text-red-700 text-sm"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode *</label>
                            <select
                              value={row.mode}
                              onChange={(e) => updateRow(index, 'mode', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                            >
                              <option value="Cash">Cash</option>
                              <option value="Bank">Bank</option>
                              <option value="Cheque">Cheque</option>
                            </select>
                          </div>

                          {row.mode === 'Bank' && (
                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Select Bank *</label>
                              <select
                                value={row.bankId || ''}
                                onChange={(e) => handleBankChange(index, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                              >
                                <option value="">Select bank</option>
                                {banks.map(bank => (
                                  <option key={bank.id} value={bank.id}>
                                    {bank.name} - {formatCurrency(bank.balance)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Enhanced Bank Balance Preview */}
                        {row.mode === 'Bank' && row.bankId && (
                          <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                            <div className="flex items-start gap-3">
                              <Wallet size={24} className="text-blue-600 mt-1" />
                              <div className="flex-1">
                                <p className="text-sm font-bold text-gray-900 mb-3">💳 Available Bank Balance</p>
                                {banks.find(b => b.id === row.bankId) && (
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center p-2 bg-white rounded">
                                      <span className="text-sm text-gray-600">Current Balance:</span>
                                      <span className="text-lg font-bold text-gray-900">
                                        {formatCurrency(banks.find(b => b.id === row.bankId)?.balance || 0)}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Transaction Amount Summary */}
                        {bankPreview && row.amount > 0 && (
                          <div className={`mb-4 p-4 rounded-lg border-2 ${bankPreview.isValid ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                            <div className="flex items-start gap-3">
                              {bankPreview.isValid ? (
                                <Banknote size={22} className="text-green-600 mt-0.5" />
                              ) : (
                                <AlertCircle size={22} className="text-red-600 mt-0.5" />
                              )}
                              <div className="flex-1">
                                <p className="text-sm font-bold text-gray-900 mb-3">📊 Transaction Summary</p>
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center p-2 bg-white rounded">
                                    <span className="text-sm text-gray-600">Current Balance:</span>
                                    <span className="font-bold text-gray-900">{formatCurrency(bankPreview.currentBalance)}</span>
                                  </div>
                                  <div className="flex justify-between items-center p-2 bg-white rounded">
                                    <span className="text-sm text-gray-600">{formData.type === 'Inflow' ? 'Amount to Add:' : 'Paid Amount:'}</span>
                                    <span className={`font-bold ${formData.type === 'Inflow' ? 'text-green-700' : 'text-red-700'}`}>
                                      {formData.type === 'Inflow' ? '+' : '-'} {formatCurrency(row.amount)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center p-2 bg-white rounded border-t-2 border-gray-200">
                                    <span className="text-sm font-semibold text-gray-700">Remaining Balance After Transaction:</span>
                                    <span className={`text-lg font-bold ${bankPreview.isValid ? 'text-green-700' : 'text-red-700'}`}>
                                      {formatCurrency(bankPreview.newBalance)}
                                    </span>
                                  </div>
                                </div>
                                {!bankPreview.isValid && (
                                  <div className="mt-3 p-2 bg-red-100 rounded flex items-center gap-2">
                                    <AlertCircle size={16} className="text-red-600" />
                                    <p className="text-xs text-red-700 font-semibold">
                                      ⚠️ Insufficient balance! Transaction cannot be processed.
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount *</label>
                            <input
                              type="number"
                              value={row.amount || ''}
                              onChange={(e) => updateRow(index, 'amount', Number(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                              placeholder="0"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid *</label>
                            <input
                              type="number"
                              value={row.amountPaid || ''}
                              onChange={(e) => updateRow(index, 'amountPaid', Number(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                              placeholder="0"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                            <select
                              value={row.paymentStatus || 'Full'}
                              onChange={(e) => updateRow(index, 'paymentStatus', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                            >
                              <option value="Full">Full</option>
                              <option value="Partial">Partial</option>
                            </select>
                          </div>
                        </div>

                        {/* Remaining Amount Display */}
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Remaining Amount:</span>
                            <span className={`text-lg font-bold ${row.remainingAmount && row.remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {formatCurrency(row.remainingAmount || 0)}
                            </span>
                          </div>
                          {row.paymentStatus === 'Partial' && row.remainingAmount && row.remainingAmount > 0 && (
                            <p className="text-xs text-gray-600 mt-1">⚠️ Partial payment - remaining amount will be tracked</p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Paid By *</label>
                            <input
                              type="text"
                              value={row.paidBy || ''}
                              onChange={(e) => updateRow(index, 'paidBy', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                              placeholder="Who paid this amount"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Paid To *</label>
                            <input
                              type="text"
                              value={row.paidTo || ''}
                              onChange={(e) => updateRow(index, 'paidTo', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                              placeholder="Who received this amount"
                            />
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Note/Description</label>
                          <textarea
                            value={row.note}
                            onChange={(e) => updateRow(index, 'note', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] resize-none"
                            placeholder="Add any additional notes..."
                          />
                        </div>

                        {/* Image Upload */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Receipt/Image (Optional)</label>
                          <div className="flex items-center gap-3">
                            <input
                              ref={currentUploadIndex === index ? fileInputRef : null}
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(index, e)}
                              className="hidden"
                            />
                            <button
                              onClick={() => {
                                setCurrentUploadIndex(index);
                                fileInputRef.current?.click();
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              <Upload size={16} />
                              Upload Image
                            </button>
                            {row.imageUrl && (
                              <div className="flex items-center gap-2">
                                <ImageIcon size={16} className="text-green-600" />
                                <span className="text-sm text-green-600">Image uploaded</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors"
              >
                {editingTransaction ? 'Update Transaction' : `Add ${transactionRows.length} Transaction(s)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Transaction Modal */}
      {viewTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Transaction Details</h3>
              <button onClick={() => setViewTransaction(null)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">{new Date(viewTransaction.date).toLocaleDateString('en-PK')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Office</p>
                  <p className="font-medium">{viewTransaction.company}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getCategoryColor(viewTransaction.mainCategory)}`}>
                    {viewTransaction.mainCategory}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Category</p>
                  <p className="font-medium">{viewTransaction.subCategory}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="font-bold text-lg">{formatCurrency(viewTransaction.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Mode</p>
                  <p className="font-medium">{viewTransaction.mode}</p>
                </div>
                {viewTransaction.bankName && (
                  <div>
                    <p className="text-sm text-gray-600">Bank</p>
                    <p className="font-medium">{viewTransaction.bankName}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Payment Status</p>
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getPaymentStatusColor(viewTransaction.paymentStatus || 'Full')}`}>
                    {viewTransaction.paymentStatus || 'Full'}
                  </span>
                </div>
                {viewTransaction.paidBy && (
                  <div>
                    <p className="text-sm text-gray-600">Paid By</p>
                    <p className="font-medium">{viewTransaction.paidBy}</p>
                  </div>
                )}
                {viewTransaction.paidTo && (
                  <div>
                    <p className="text-sm text-gray-600">Paid To</p>
                    <p className="font-medium">{viewTransaction.paidTo}</p>
                  </div>
                )}
                {viewTransaction.note && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Note</p>
                    <p className="font-medium">{viewTransaction.note}</p>
                  </div>
                )}
                {viewTransaction.imageUrl && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600 mb-2">Receipt Image</p>
                    <img 
                      src={viewTransaction.imageUrl} 
                      alt="Receipt" 
                      className="w-full max-w-md rounded-lg border border-gray-200"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Slip Modal */}
      {viewSlip && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto print:shadow-none">
            <div className="print:hidden flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Transaction Slip</h3>
              <button onClick={() => setViewSlip(null)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8">
              {/* Header */}
              <div className="text-center mb-8 border-b-2 border-gray-200 pb-6">
                <h1 className="text-3xl font-bold text-[#4f46e5] mb-2">Pakistan Detectors Technologies</h1>
                <p className="text-gray-600">Transaction Receipt</p>
                <p className="text-sm text-gray-500 mt-1">{viewSlip.company}</p>
              </div>

              {/* Receipt Info */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Transaction Date:</p>
                  <p className="font-medium">{new Date(viewSlip.date).toLocaleDateString('en-PK')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Transaction ID:</p>
                  <p className="font-medium">TXN-{viewSlip.id.slice(0, 8)}</p>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <h3 className="font-bold text-lg mb-4 text-gray-900">Transaction Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(viewSlip.mainCategory)}`}>
                      {viewSlip.mainCategory}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">{viewSlip.subCategory}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Mode:</span>
                    <span className="font-medium">{viewSlip.mode}</span>
                  </div>
                  {viewSlip.bankName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bank:</span>
                      <span className="font-medium">{viewSlip.bankName}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paid By:</span>
                    <span className="font-medium">{viewSlip.paidBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paid To:</span>
                    <span className="font-medium">{viewSlip.paidTo}</span>
                  </div>
                </div>
              </div>

              {/* Amount Details */}
              <div className="bg-[#4f46e5]/5 p-6 rounded-lg mb-8">
                <div className="flex justify-between text-2xl mb-3">
                  <span className="font-bold">Transaction Amount:</span>
                  <span className="font-bold">{formatCurrency(viewSlip.amount)}</span>
                </div>
                {viewSlip.paymentStatus === 'Partial' && viewSlip.remainingAmount && (
                  <div className="border-t border-gray-300 pt-3 flex justify-between text-red-600">
                    <span>Remaining Amount:</span>
                    <span className="font-semibold">{formatCurrency(viewSlip.remainingAmount)}</span>
                  </div>
                )}
                <div className="mt-3 flex justify-between">
                  <span>Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(viewSlip.paymentStatus || 'Full')}`}>
                    {viewSlip.paymentStatus || 'Full'}
                  </span>
                </div>
              </div>

              {viewSlip.note && (
                <div className="mb-8">
                  <p className="text-sm text-gray-600 mb-1">Note:</p>
                  <p className="text-gray-900">{viewSlip.note}</p>
                </div>
              )}

              {viewSlip.imageUrl && (
                <div className="mb-8">
                  <p className="text-sm text-gray-600 mb-2">Receipt Image:</p>
                  <img 
                    src={viewSlip.imageUrl} 
                    alt="Receipt" 
                    className="w-full max-w-md mx-auto rounded-lg border border-gray-200"
                  />
                </div>
              )}

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-12 mt-12 pt-8 border-t border-gray-200">
                <div>
                  <div className="border-t border-gray-400 pt-2">
                    <p className="text-sm text-gray-600">Authorized Signature</p>
                    <p className="text-xs text-gray-500 mt-1">Pakistan Detectors Technologies</p>
                  </div>
                </div>
                <div>
                  <div className="border-t border-gray-400 pt-2">
                    <p className="text-sm text-gray-600">Receiver Signature</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Print Buttons */}
            <div className="print:hidden flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setViewSlip(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handlePrint(viewSlip)}
                className="flex items-center gap-2 px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors"
              >
                <Printer size={18} />
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
