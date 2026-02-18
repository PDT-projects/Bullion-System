import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Bank, BankTransfer } from '../../App';
import { 
  Plus, 
  Search, 
  Eye, 
  Trash2, 
  X, 
  ArrowRightLeft,
  ArrowRight,
  Printer,
  Download,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

export function BankTransfersPage() {
  const navigate = useNavigate();
  const { banks, setBanks, transfers, setTransfers } = useOutletContext<{
    banks: Bank[];
    setBanks: (banks: Bank[]) => void;
    transfers: BankTransfer[];
    setTransfers: (transfers: BankTransfer[]) => void;
  }>();

  const [searchTerm, setSearchTerm] = useState('');
  const [viewingTransfer, setViewingTransfer] = useState<BankTransfer | null>(null);
  const [viewingSlip, setViewingSlip] = useState<BankTransfer | null>(null);

  // Filter transfers
  const filteredTransfers = transfers.filter(transfer => 
    transfer.fromBankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transfer.toBankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transfer.note?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate statistics
  const stats = {
    totalTransfers: transfers.length,
    totalAmount: transfers.reduce((sum, t) => sum + t.amount, 0),
    thisMonth: transfers.filter(t => {
      const transferDate = new Date(t.date);
      const now = new Date();
      return transferDate.getMonth() === now.getMonth() && 
             transferDate.getFullYear() === now.getFullYear();
    }).length
  };

  const handleDeleteTransfer = (id: string) => {
    if (confirm('Are you sure you want to delete this transfer record?')) {
      setTransfers(transfers.filter(t => t.id !== id));
      toast.success('Transfer record deleted');
    }
  };

  const handlePrint = (transfer: BankTransfer) => {
    toast.success('Printing transfer slip');
    window.print();
  };

  const handleDownload = (transfer: BankTransfer) => {
    toast.success('Downloading transfer slip');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
            <h2 className="text-2xl font-bold text-gray-900">Bank Transfers</h2>
            <p className="text-gray-600">Transfer funds between bank accounts</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/banking/transfers/new')}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus size={18} />
          New Transfer
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <ArrowRightLeft size={18} className="text-green-600" />
            <p className="text-sm text-gray-600">Total Transfers</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalTransfers}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <ArrowRightLeft size={18} className="text-green-600" />
            <p className="text-sm text-gray-600">Total Amount</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalAmount)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <ArrowRightLeft size={18} className="text-blue-600" />
            <p className="text-sm text-gray-600">This Month</p>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.thisMonth}</p>
        </div>
      </div>

      {/* Bank Balances Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Current Bank Balances</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {banks.map(bank => (
            <div key={bank.id} className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">{bank.name}</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(bank.balance)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by bank name or note..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Transfers Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">From</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-700"></th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">To</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredTransfers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  <ArrowRightLeft className="mx-auto mb-3 text-gray-300" size={48} />
                  <p className="text-lg font-medium">No transfers found</p>
                  <p className="text-sm mt-1">Create a new bank transfer to get started</p>
                </td>
              </tr>
            ) : (
              filteredTransfers.map((transfer) => (
                <tr key={transfer.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(transfer.date)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{transfer.fromBankName}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ArrowRight size={16} className="text-green-600 mx-auto" />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{transfer.toBankName}</p>
                  </td>
                  <td className="px-4 py-3 font-bold text-green-600">
                    {formatCurrency(transfer.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setViewingTransfer(transfer)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => setViewingSlip(transfer)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                        title="View Slip"
                      >
                        <FileText size={16} />
                      </button>
                      <button
                        onClick={() => handlePrint(transfer)}
                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                        title="Print"
                      >
                        <Printer size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteTransfer(transfer.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Transfer Modal */}
      {viewingTransfer && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Transfer Details</h3>
              <button
                onClick={() => setViewingTransfer(null)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-1">From</p>
                    <p className="font-bold">{viewingTransfer.fromBankName}</p>
                  </div>
                  <ArrowRight className="text-green-600" />
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-1">To</p>
                    <p className="font-bold">{viewingTransfer.toBankName}</p>
                  </div>
                </div>
                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Amount</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(viewingTransfer.amount)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Date</p>
                <p className="font-medium">{formatDate(viewingTransfer.date)}</p>
              </div>
              {viewingTransfer.note && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Note</p>
                  <p className="font-medium">{viewingTransfer.note}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Slip Modal */}
      {viewingSlip && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Transfer Slip</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrint(viewingSlip)}
                  className="p-2 text-purple-600 hover:bg-purple-50 rounded"
                >
                  <Printer size={20} />
                </button>
                <button
                  onClick={() => setViewingSlip(null)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="p-8">
              <div className="text-center border-b pb-4 mb-6">
                <h2 className="text-xl font-bold text-blue-600">Pakistan Detectors Technologies</h2>
                <p className="text-lg font-semibold mt-2">Bank Transfer Slip</p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg mb-6">
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <p className="text-xs text-gray-600 mb-1">From Bank</p>
                    <p className="font-bold">{viewingSlip.fromBankName}</p>
                  </div>
                  <ArrowRight className="text-green-600 mx-2" />
                  <div className="text-center flex-1">
                    <p className="text-xs text-gray-600 mb-1">To Bank</p>
                    <p className="font-bold">{viewingSlip.toBankName}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transfer ID:</span>
                  <span className="font-medium">{viewingSlip.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{formatDate(viewingSlip.date)}</span>
                </div>
                {viewingSlip.note && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Note:</span>
                    <span className="font-medium">{viewingSlip.note}</span>
                  </div>
                )}
                <div className="flex justify-between items-center bg-green-50 p-3 rounded-lg mt-4">
                  <span className="font-semibold">Transfer Amount:</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(viewingSlip.amount)}
                  </span>
                </div>
              </div>

              <div className="border-t mt-6 pt-4 text-center text-xs text-gray-500">
                <p>Computer-generated slip</p>
                <p className="mt-1">Generated on {new Date().toLocaleDateString('en-PK')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
