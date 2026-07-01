// Banking Module - Bank List View
// UI component for displaying and managing bank accounts
// Updated with loading states and empty states for Firebase integration

import React from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  Building2,
  ArrowRightLeft,
  Eye,
  Landmark,
  TrendingUp,
  TrendingDown,
  Loader2,
  RefreshCw,
  Database,
  AlertCircle,
  Calendar,
  Save
} from 'lucide-react';
import { Bank, BankStats, BankFilters } from '../models/types';

interface TransferModalData {
  fromBankId: string;
  toBankId: string;
  amount: number;
  date: string;
  note: string;
}

interface BankListViewProps {
  // Data
  banks: Bank[];
  filteredBanks: Bank[];
  stats: BankStats;
  
  // Loading State
  isLoading: boolean;
  isTransferSaving: boolean;
  error: string | null;
  
  // Filters
  filters: BankFilters;
  setSearchTerm: (term: string) => void;
  
  // View State
  viewingBank: Bank | null;
  isTransferModalOpen: boolean;
  setViewingBank: (bank: Bank | null) => void;
  openTransferModal: () => void;
  closeTransferModal: () => void;
  
  // Actions
  onAddBank: () => void;
  onEditBank: (id: string) => void;
  onDeleteBank: (id: string) => void;
  onBack: () => void;
  handleDeleteBank: (id: string) => void;
  handleTransfer: (data: TransferModalData) => Promise<void>;
  refreshBanks: () => void;
  
  // Utils
  formatCurrency: (amount: number) => string;
}

export const BankListView: React.FC<BankListViewProps> = ({
  banks,
  filteredBanks,
  stats,
  isLoading,
  isTransferSaving,
  error,
  filters,
  setSearchTerm,
  viewingBank,
  isTransferModalOpen,
  setViewingBank,
  openTransferModal,
  closeTransferModal,
  onAddBank,
  onEditBank,
  onDeleteBank,
  onBack,
  handleDeleteBank,
  handleTransfer,
  refreshBanks,
  formatCurrency
}) => {
  // Transfer form state (local to view)
  const [transferData, setTransferData] = React.useState<TransferModalData>({
    fromBankId: '',
    toBankId: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    note: ''
  });
  const [transferErrors, setTransferErrors] = React.useState<Record<string, string>>({});

  const fromBank = banks.find(b => b.id === transferData.fromBankId);
  const toBank = banks.find(b => b.id === transferData.toBankId);
  const hasInsufficientFunds = fromBank && transferData.amount > 0 && transferData.amount > fromBank.balance;

  // FIX: The "Total Balance" / "Highest Balance" / "Lowest Balance" stat cards
  // were formatting raw summed/compared numbers with a single hardcoded AED
  // formatter, even though accounts can be AED or PKR. Mixing currencies into
  // one total (or labeling a PKR account's balance as "AED") is misleading, so
  // balances are now grouped and formatted per-currency using each bank's own
  // `currency`, computed directly from the `banks` list.
  const formatByCurrency = (amount: number, currency?: 'AED' | 'PKR') =>
    new Intl.NumberFormat(currency === 'PKR' ? 'en-PK' : 'en-AE', {
      style: 'currency', currency: currency || 'AED', minimumFractionDigits: 0
    }).format(amount);

  const totalsByCurrency = banks.reduce((acc, bank) => {
    const cur = bank.currency || 'AED';
    acc[cur] = (acc[cur] || 0) + (bank.balance || 0);
    return acc;
  }, {} as Record<string, number>);
  const currencyKeys = Object.keys(totalsByCurrency);

  const highestBank = banks.length
    ? banks.reduce((max, b) => (b.balance > max.balance ? b : max), banks[0])
    : null;
  const lowestBank = banks.length
    ? banks.reduce((min, b) => (b.balance < min.balance ? b : min), banks[0])
    : null;

  const validateTransfer = (): boolean => {
    const errs: Record<string, string> = {};
    if (!transferData.fromBankId) errs.fromBankId = 'Please select source bank';
    if (!transferData.toBankId) errs.toBankId = 'Please select destination bank';
    if (transferData.fromBankId && transferData.toBankId && transferData.fromBankId === transferData.toBankId) {
      errs.toBankId = 'Cannot transfer to the same bank';
    }
    if (!transferData.amount || transferData.amount <= 0) errs.amount = 'Amount must be greater than 0';
    if (!transferData.date) errs.date = 'Date is required';
    if (fromBank && transferData.amount > fromBank.balance) errs.amount = 'Insufficient balance in source bank';
    setTransferErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onTransferSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    if (!validateTransfer()) return;
    await handleTransfer(transferData);
    // Reset only on success (handleTransfer closes modal on success)
    setTransferData({
      fromBankId: '',
      toBankId: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      note: ''
    });
    setTransferErrors({});
  };

  const handleCloseTransferModal = () => {
    closeTransferModal();
    setTransferData({
      fromBankId: '',
      toBankId: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      note: ''
    });
    setTransferErrors({});
  };

  // Loading State
  if (isLoading && filteredBanks.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowRightLeft className="rotate-180" size={24} />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Bank Accounts</h2>
              <p className="text-gray-600">Manage all bank accounts and balances</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-gray-200">
          <Loader2 className="animate-spin text-slate-700 mb-4" size={48} />
          <p className="text-lg font-medium text-gray-900">Loading banks...</p>
          <p className="text-sm text-gray-500 mt-1">Fetching data from database</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error && filteredBanks.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowRightLeft className="rotate-180" size={24} />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Bank Accounts</h2>
              <p className="text-gray-600">Manage all bank accounts and balances</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-red-200">
          <div className="p-4 bg-red-50 rounded-full mb-4">
            <Database className="text-red-500" size={48} />
          </div>
          <p className="text-lg font-medium text-red-900">Failed to load banks</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
          <button
            onClick={refreshBanks}
            style={{backgroundColor:"#334155",color:"#fff"}} className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg"
          >
            <RefreshCw size={18} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowRightLeft className="rotate-180" size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Bank Accounts</h2>
            <p className="text-gray-600">Manage all bank accounts and balances</p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={refreshBanks}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-slate-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={openTransferModal}
            disabled={banks.length < 2}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowRightLeft size={18} />
            Transfer
          </button>
          <button
            onClick={onAddBank}
            style={{backgroundColor:"#334155",color:"#fff"}} className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={18} />
            Add Bank
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Building2 size={18} className="text-slate-700" />
            <p className="text-sm text-gray-600">Total Banks</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalBanks}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Landmark size={18} className="text-slate-700" />
            <p className="text-sm text-gray-600">Total Balance</p>
          </div>
          {currencyKeys.length > 0 ? (
            <div className="space-y-0.5">
              {currencyKeys.map((cur) => (
                <p key={cur} className="text-xl font-bold text-slate-700 leading-tight">
                  {formatByCurrency(totalsByCurrency[cur], cur as 'AED' | 'PKR')}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-2xl font-bold text-slate-700">{formatByCurrency(0)}</p>
          )}
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-green-600" />
            <p className="text-sm text-gray-600">Highest Balance</p>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {highestBank ? formatByCurrency(highestBank.balance, highestBank.currency as 'AED' | 'PKR') : formatByCurrency(0)}
          </p>
          {highestBank && <p className="text-xs text-gray-400 mt-1 truncate">{highestBank.name}</p>}
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={18} className="text-orange-500" />
            <p className="text-sm text-gray-600">Lowest Balance</p>
          </div>
          <p className="text-2xl font-bold text-orange-500">
            {lowestBank ? formatByCurrency(lowestBank.balance, lowestBank.currency as 'AED' | 'PKR') : formatByCurrency(0)}
          </p>
          {lowestBank && <p className="text-xs text-gray-400 mt-1 truncate">{lowestBank.name}</p>}
        </div>
      </div>
      {currencyKeys.length > 1 && (
        <p className="text-xs text-gray-400 -mt-3">
          Note: Highest/Lowest Balance compares raw account balances and is not currency-converted, since accounts use different currencies (AED / PKR).
        </p>
      )}

      {/* Search */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by bank name or account number..."
            value={filters.searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700"
          />
        </div>
      </div>

      {/* Banks Grid */}
      {filteredBanks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBanks.map((bank) => (
            <div key={bank.id} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-900/10 rounded-lg">
                    <Building2 size={20} className="text-slate-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{bank.name}</h3>
                    <p className="text-xs text-gray-500">{bank.accountNumber}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => onEditBank(bank.id)}
                    className="p-1.5 text-slate-700 hover:bg-gray-900/10 rounded"
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteBank(bank.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-600 mb-1">Current Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat(bank.currency === 'PKR' ? 'en-PK' : 'en-AE', {
                    style: 'currency', currency: bank.currency || 'AED', minimumFractionDigits: 0
                  }).format(bank.balance)}
                </p>
                {bank.currency && <span className="text-xs text-gray-400">{bank.currency} Account</span>}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setViewingBank(bank)}
                  style={{ color: '#111827' }}
                  className="flex-1 py-2 text-sm font-medium bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Eye size={14} className="inline mr-1" />
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <div className="p-4 bg-gray-50 rounded-full inline-block mb-4">
            <Building2 className="text-gray-300" size={48} />
          </div>
          <p className="text-xl font-semibold text-gray-900 mb-2">No bank accounts yet</p>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            Get started by adding your first bank account. All bank data will be securely stored in the database.
          </p>
          <button
            onClick={onAddBank}
            style={{backgroundColor:"#334155",color:"#fff"}} className="flex items-center gap-2 px-6 py-3 rounded-lg mx-auto"
          >
            <Plus size={20} />
            Add Your First Bank
          </button>
        </div>
      )}

      {/* View Bank Modal */}
      {viewingBank && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Bank Account Details</h3>
              <button
                onClick={() => setViewingBank(null)}
                className="p-2 text-gray-500 hover:text-slate-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gray-900/10 rounded-lg">
                  <Building2 size={24} className="text-slate-700" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg">{viewingBank.name}</h4>
                  <p className="text-sm text-gray-500">{viewingBank.accountNumber}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Current Balance</p>
                <p className="text-3xl font-bold text-slate-700">
                  {new Intl.NumberFormat(viewingBank.currency === 'PKR' ? 'en-PK' : 'en-AE', {
                    style: 'currency', currency: viewingBank.currency || 'AED', minimumFractionDigits: 0
                  }).format(viewingBank.balance)}
                </p>
                {viewingBank.currency && <p className="text-xs text-gray-400 mt-1">{viewingBank.currency} Account</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setViewingBank(null);
                    onEditBank(viewingBank.id);
                  }}
                  style={{ color: '#111827' }}
                  className="py-2 font-medium bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                >
                  Edit Account
                </button>
                <button
                  onClick={() => {
                    setViewingBank(null);
                    openTransferModal();
                  }}
                  className="py-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100"
                >
                  Transfer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full max-w-2xl max-h-[90vh] flex flex-col">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">New Bank Transfer</h2>
                <p className="text-gray-600 mt-1">Transfer funds between bank accounts</p>
              </div>
              <button
                onClick={handleCloseTransferModal}
                disabled={isTransferSaving}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body — scrollable */}
            <div className="overflow-y-auto flex-1 min-h-0 p-6">
              <div className="space-y-6">

                {/* From Bank */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    From Bank *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500" size={20} />
                    <select
                      value={transferData.fromBankId}
                      onChange={(e) => {
                        setTransferData(prev => ({ ...prev, fromBankId: e.target.value }));
                        setTransferErrors(prev => { const er = { ...prev }; delete er.fromBankId; return er; });
                      }}
                      disabled={isTransferSaving}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                        transferErrors.fromBankId
                          ? 'border-red-300 focus:ring-red-200'
                          : 'border-gray-300 focus:ring-slate-700/20 focus:border-slate-700'
                      } ${isTransferSaving ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    >
                      <option value="">Select source bank</option>
                      {banks.map(bank => (
                        <option key={bank.id} value={bank.id}>
                          {bank.name} - {formatCurrency(bank.balance)}
                        </option>
                      ))}
                    </select>
                  </div>
                  {transferErrors.fromBankId && (
                    <p className="mt-1 text-sm text-red-600">{transferErrors.fromBankId}</p>
                  )}
                </div>

                {/* To Bank */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    To Bank *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500" size={20} />
                    <select
                      value={transferData.toBankId}
                      onChange={(e) => {
                        setTransferData(prev => ({ ...prev, toBankId: e.target.value }));
                        setTransferErrors(prev => { const er = { ...prev }; delete er.toBankId; return er; });
                      }}
                      disabled={isTransferSaving}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                        transferErrors.toBankId
                          ? 'border-red-300 focus:ring-red-200'
                          : 'border-gray-300 focus:ring-slate-700/20 focus:border-slate-700'
                      } ${isTransferSaving ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    >
                      <option value="">Select destination bank</option>
                      {banks.map(bank => (
                        <option key={bank.id} value={bank.id} disabled={bank.id === transferData.fromBankId}>
                          {bank.name} {bank.id === transferData.fromBankId ? '(same as source)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  {transferErrors.toBankId && (
                    <p className="mt-1 text-sm text-red-600">{transferErrors.toBankId}</p>
                  )}
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Transfer Amount *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">AED</span>
                    <input
                      type="number"
                      value={transferData.amount || ''}
                      onChange={(e) => {
                        setTransferData(prev => ({ ...prev, amount: Number(e.target.value) }));
                        setTransferErrors(prev => { const er = { ...prev }; delete er.amount; return er; });
                      }}
                      disabled={isTransferSaving}
                      className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                        transferErrors.amount || hasInsufficientFunds
                          ? 'border-red-300 focus:ring-red-200'
                          : 'border-gray-300 focus:ring-slate-700/20 focus:border-slate-700'
                      } ${isTransferSaving ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      placeholder="0"
                      min="1"
                      step="0.01"
                    />
                  </div>
                  {transferErrors.amount && (
                    <p className="mt-1 text-sm text-red-600">{transferErrors.amount}</p>
                  )}
                  {hasInsufficientFunds && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      Insufficient funds. Available: {formatCurrency(fromBank!.balance)}
                    </p>
                  )}
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Transfer Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="date"
                      value={transferData.date}
                      onChange={(e) => {
                        setTransferData(prev => ({ ...prev, date: e.target.value }));
                        setTransferErrors(prev => { const er = { ...prev }; delete er.date; return er; });
                      }}
                      disabled={isTransferSaving}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                        transferErrors.date
                          ? 'border-red-300 focus:ring-red-200'
                          : 'border-gray-300 focus:ring-slate-700/20 focus:border-slate-700'
                      } ${isTransferSaving ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  {transferErrors.date && (
                    <p className="mt-1 text-sm text-red-600">{transferErrors.date}</p>
                  )}
                </div>

                {/* Note */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Note (Optional)
                  </label>
                  <textarea
                    value={transferData.note}
                    onChange={(e) => setTransferData(prev => ({ ...prev, note: e.target.value }))}
                    disabled={isTransferSaving}
                    rows={3}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 ${isTransferSaving ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="Add any additional notes about this transfer..."
                  />
                </div>

                {/* Transfer Preview */}
                {(fromBank && toBank && transferData.amount > 0) && (
                  <div className="bg-gray-900/10 border border-slate-700/20 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <ArrowRightLeft size={18} className="text-slate-700" />
                      Transfer Preview
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">From:</span>
                        <span className="font-medium text-red-600">{fromBank.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">To:</span>
                        <span className="font-medium text-green-600">{toBank.name}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-700/20 pt-2 mt-2">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-bold text-slate-700">{formatCurrency(transferData.amount)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>From bank balance after:</span>
                        <span>{formatCurrency(fromBank.balance - transferData.amount)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>To bank balance after:</span>
                        <span>{formatCurrency(toBank.balance + transferData.amount)}</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-4 px-6 py-4 border-t border-gray-200 flex-shrink-0">
              <button
                type="button"
                onClick={handleCloseTransferModal}
                disabled={isTransferSaving}
                className="px-6 py-3 text-slate-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onTransferSubmit}
                disabled={isTransferSaving || !!hasInsufficientFunds}
                style={{backgroundColor:"#334155",color:"#fff"}} className="flex items-center gap-2 px-6 py-3 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTransferSaving ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Complete Transfer
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};