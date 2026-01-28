import { useState } from 'react';
import { Bank } from '../App';
import { Plus, Edit, Trash2, X, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

type BanksProps = {
  banks: Bank[];
  setBanks: (banks: Bank[]) => void;
};

export function Banks({ banks, setBanks }: BanksProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [formData, setFormData] = useState<Partial<Bank>>({
    name: '',
    balance: 0,
    accountNumber: ''
  });

  const [transferData, setTransferData] = useState({
    fromBankId: '',
    toBankId: '',
    amount: 0
  });

  const handleAdd = () => {
    setEditingBank(null);
    setFormData({
      name: '',
      balance: 0,
      accountNumber: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (bank: Bank) => {
    setEditingBank(bank);
    setFormData(bank);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.accountNumber) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editingBank) {
      setBanks(banks.map(b => b.id === editingBank.id ? { ...formData, id: b.id } as Bank : b));
      toast.success('Bank updated successfully');
    } else {
      const newBank: Bank = {
        ...formData,
        id: Date.now().toString()
      } as Bank;
      setBanks([...banks, newBank]);
      toast.success('Bank added successfully');
    }

    setIsModalOpen(false);
    setFormData({});
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this bank?')) {
      setBanks(banks.filter(b => b.id !== id));
      toast.success('Bank deleted successfully');
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

    setBanks(banks.map(bank => {
      if (bank.id === transferData.fromBankId) {
        return { ...bank, balance: bank.balance - transferData.amount };
      }
      if (bank.id === transferData.toBankId) {
        return { ...bank, balance: bank.balance + transferData.amount };
      }
      return bank;
    }));

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

  const totalBankBalance = banks.reduce((sum, bank) => sum + bank.balance, 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Banks</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <ArrowRightLeft size={20} />
            Transfer
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 bg-[#4f46e5] text-white px-4 py-2 rounded-lg hover:bg-[#4338ca] transition-colors"
          >
            <Plus size={20} />
            Add Bank
          </button>
        </div>
      </div>

      {/* Total Balance Card */}
      <div className="bg-gradient-to-br from-[#4f46e5] to-[#6366f1] rounded-lg p-6 mb-6 shadow-sm">
        <p className="text-white/90 text-sm mb-2">Total Bank Balance</p>
        <p className="text-3xl font-bold text-white">{formatCurrency(totalBankBalance)}</p>
        <p className="text-white/80 text-sm mt-2">{banks.length} bank account(s)</p>
      </div>

      {/* Banks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {banks.map((bank) => (
          <div key={bank.id} className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">{bank.name}</h3>
                <p className="text-xs text-gray-600">{bank.accountNumber}</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(bank)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => handleDelete(bank.id)}
                  className="p-1.5 text-[#ef4444] hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-3">
              <p className="text-xs text-gray-600 mb-1">Current Balance</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(bank.balance)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Banks Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-bold text-lg">Bank Accounts</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {banks.map((bank) => (
                <tr key={bank.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{bank.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bank.accountNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(bank.balance)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(bank)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(bank.id)}
                        className="p-2 text-[#ef4444] hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">{editingBank ? 'Edit Bank' : 'Add Bank'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                  placeholder="e.g., HBL Main Branch"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Number *</label>
                <input
                  type="text"
                  value={formData.accountNumber || ''}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                  placeholder="e.g., HBL-2345678901"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Balance</label>
                <input
                  type="number"
                  value={formData.balance || ''}
                  onChange={(e) => setFormData({ ...formData, balance: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
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
                {editingBank ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Transfer Between Banks</h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Bank *</label>
                <select
                  value={transferData.fromBankId}
                  onChange={(e) => setTransferData({ ...transferData, fromBankId: e.target.value })}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Bank *</label>
                <select
                  value={transferData.toBankId}
                  onChange={(e) => setTransferData({ ...transferData, toBankId: e.target.value })}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                <input
                  type="number"
                  value={transferData.amount || ''}
                  onChange={(e) => setTransferData({ ...transferData, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                  placeholder="Enter amount"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTransfer}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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
