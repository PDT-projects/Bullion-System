import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Bank } from '../../App';
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
  TrendingDown
} from 'lucide-react';
import { toast } from 'sonner';

export function BanksPage() {
  const navigate = useNavigate();
  const { banks, setBanks } = useOutletContext<{
    banks: Bank[];
    setBanks: (banks: Bank[]) => void;
  }>();

  const [searchTerm, setSearchTerm] = useState('');
  const [viewingBank, setViewingBank] = useState<Bank | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferData, setTransferData] = useState({
    fromBankId: '',
    toBankId: '',
    amount: 0
  });

  // Filter banks
  const filteredBanks = banks.filter(bank => 
    bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.accountNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate statistics
  const stats = {
    totalBanks: banks.length,
    totalBalance: banks.reduce((sum, bank) => sum + bank.balance, 0),
    highestBalance: banks.length > 0 ? Math.max(...banks.map(b => b.balance)) : 0,
    lowestBalance: banks.length > 0 ? Math.min(...banks.map(b => b.balance)) : 0
  };

  const handleDeleteBank = (id: string) => {
    const bankToDelete = banks.find(b => b.id === id);
    if (!bankToDelete) return;

    if (confirm(`Are you sure you want to delete ${bankToDelete.name}?`)) {
      setBanks(banks.filter(b => b.id !== id));
      toast.success('Bank account deleted successfully');
    }
  };

  const handleTransfer = () => {
    if (!transferData.fromBankId || !transferData.toBankId || transferData.amount <= 0) {
      toast.error('Please fill in all transfer details');
      return;
    }

    if (transferData.fromBankId === transferData.toBankId) {
      toast.error('Cannot transfer to the same bank');
      return;
    }

    const fromBank = banks.find(b => b.id === transferData.fromBankId);
    if (!fromBank || fromBank.balance < transferData.amount) {
      toast.error('Insufficient balance in source bank');
      return;
    }

    const updatedBanks = banks.map(bank => {
      if (bank.id === transferData.fromBankId) {
        return { ...bank, balance: bank.balance - transferData.amount };
      }
      if (bank.id === transferData.toBankId) {
        return { ...bank, balance: bank.balance + transferData.amount };
      }
      return bank;
    });

    setBanks(updatedBanks);
    toast.success('Transfer completed successfully');
    setIsTransferModalOpen(false);
    setTransferData({ fromBankId: '', toBankId: '', amount: 0 });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/banking')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowRightLeft className="rotate-180" size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Bank Accounts</h2>
            <p className="text-gray-600">Manage all bank accounts and balances</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <ArrowRightLeft size={18} />
            Transfer
          </button>
          <button
            onClick={() => navigate('/banking/banks/new')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
            <Building2 size={18} className="text-blue-600" />
            <p className="text-sm text-gray-600">Total Banks</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalBanks}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Landmark size={18} className="text-blue-600" />
            <p className="text-sm text-gray-600">Total Balance</p>
          </div>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalBalance)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-green-600" />
            <p className="text-sm text-gray-600">Highest Balance</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.highestBalance)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={18} className="text-orange-600" />
            <p className="text-sm text-gray-600">Lowest Balance</p>
          </div>
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.lowestBalance)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by bank name or account number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Banks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBanks.map((bank) => (
          <div key={bank.id} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{bank.name}</h3>
                  <p className="text-xs text-gray-500">{bank.accountNumber}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => navigate(`/banking/banks/${bank.id}/edit`)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
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
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(bank.balance)}</p>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setViewingBank(bank)}
                className="flex-1 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Eye size={14} className="inline mr-1" />
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredBanks.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Building2 className="mx-auto mb-3 text-gray-300" size={48} />
          <p className="text-lg font-medium text-gray-900">No bank accounts found</p>
          <p className="text-sm text-gray-500 mt-1">Add a new bank account to get started</p>
          <button
            onClick={() => navigate('/banking/banks/new')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Bank Account
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
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Building2 size={24} className="text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg">{viewingBank.name}</h4>
                  <p className="text-sm text-gray-500">{viewingBank.accountNumber}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Current Balance</p>
                <p className="text-3xl font-bold text-blue-600">{formatCurrency(viewingBank.balance)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setViewingBank(null);
                    navigate(`/banking/banks/${viewingBank.id}/edit`);
                  }}
                  className="py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                >
                  Edit Account
                </button>
                <button
                  onClick={() => {
                    setViewingBank(null);
                    setIsTransferModalOpen(true);
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
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Transfer Between Banks</h3>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Bank *</label>
                <select
                  value={transferData.fromBankId}
                  onChange={(e) => setTransferData({ ...transferData, fromBankId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select bank</option>
                  {banks.map(bank => (
                    <option key={bank.id} value={bank.id}>
                      {bank.name} - {formatCurrency(bank.balance)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Bank *</label>
                <select
                  value={transferData.toBankId}
                  onChange={(e) => setTransferData({ ...transferData, toBankId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select bank</option>
                  {banks.map(bank => (
                    <option key={bank.id} value={bank.id}>
                      {bank.name} - {formatCurrency(bank.balance)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                <input
                  type="number"
                  value={transferData.amount || ''}
                  onChange={(e) => setTransferData({ ...transferData, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter amount"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleTransfer}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
