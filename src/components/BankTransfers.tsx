import { useState } from 'react';
import { BankTransfer, Bank } from '../App';
import { Plus, Eye, Trash2, X, Printer, Download, ArrowRight, FileText, Maximize2, Minimize2, Wallet, AlertCircle, TrendingDown } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

type BankTransfersProps = {
  transfers: BankTransfer[];
  setTransfers: (transfers: BankTransfer[]) => void;
  banks: Bank[];
  setBanks: (banks: Bank[]) => void;
};

export function BankTransfers({ transfers, setTransfers, banks, setBanks }: BankTransfersProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewTransfer, setViewTransfer] = useState<BankTransfer | null>(null);
  const [viewSlip, setViewSlip] = useState<BankTransfer | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [formData, setFormData] = useState({
    fromBankId: '',
    toBankId: '',
    amount: 0,
    note: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleAdd = () => {
    setFormData({
      fromBankId: '',
      toBankId: '',
      amount: 0,
      note: '',
      date: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.fromBankId || !formData.toBankId || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.fromBankId === formData.toBankId) {
      toast.error('Cannot transfer to the same bank account');
      return;
    }

    const fromBank = banks.find(b => b.id === formData.fromBankId);
    const toBank = banks.find(b => b.id === formData.toBankId);

    if (!fromBank || !toBank) {
      toast.error('Invalid bank selection');
      return;
    }

    if (fromBank.balance < formData.amount) {
      toast.error('Insufficient balance in source bank');
      return;
    }

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

    // Update bank balances - create new array explicitly
    const updatedBanks = banks.map(bank => {
      if (bank.id === formData.fromBankId) {
        return { ...bank, balance: bank.balance - formData.amount };
      }
      if (bank.id === formData.toBankId) {
        return { ...bank, balance: bank.balance + formData.amount };
      }
      return bank;
    });
    
    // Update banks state first
    setBanks(updatedBanks);
    
    // Then add transfer record
    setTransfers([newTransfer, ...transfers]);
    
    toast.success(`Transfer completed! ${formatCurrency(formData.amount)} transferred from ${fromBank.name} to ${toBank.name}`);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this transfer record?')) {
      setTransfers(transfers.filter(t => t.id !== id));
      toast.success('Transfer deleted successfully');
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Bank Transfers</h2>
          <p className="text-sm text-gray-600 mt-1">Transfer funds between bank accounts</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-[#4f46e5] text-white px-4 py-2 rounded-lg hover:bg-[#4338ca] transition-colors"
        >
          <Plus size={20} />
          New Transfer
        </button>
      </div>

      {/* Bank Balances Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {banks.map(bank => (
          <div key={bank.id} className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">{bank.name}</p>
            <p className="text-xl font-bold text-[#4f46e5]">{formatCurrency(bank.balance)}</p>
            <p className="text-xs text-gray-500 mt-1">{bank.accountNumber}</p>
          </div>
        ))}
      </div>

      {/* Transfers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From Bank</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To Bank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transfers.map((transfer) => (
                <tr key={transfer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(transfer.date).toLocaleDateString('en-PK')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {transfer.fromBankName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <ArrowRight size={16} className="text-[#4f46e5] mx-auto" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {transfer.toBankName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[#4f46e5]">
                    {formatCurrency(transfer.amount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                    {transfer.note || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewTransfer(transfer)}
                        className="p-2 text-[#4f46e5] hover:bg-[#4f46e5]/10 rounded-lg transition-colors"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => setViewSlip(transfer)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="View Slip"
                      >
                        <FileText size={16} />
                      </button>
                      <button
                        onClick={() => handlePrint(transfer)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Print Slip"
                      >
                        <Printer size={16} />
                      </button>
                      <button
                        onClick={() => handleDownload(transfer)}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Download Slip"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(transfer.id)}
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

      {/* Add Transfer Modal */}
      {isModalOpen && (
        <div className={`fixed inset-0 z-50 ${isFullScreen ? 'bg-white' : 'bg-black/50 flex items-center justify-center p-4'}`}>
          <div className={`bg-white ${isFullScreen ? 'w-full h-full flex flex-col' : 'rounded-lg max-w-2xl w-full flex flex-col'}`}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-xl font-bold">New Bank Transfer</h3>
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
            <div className={`${isFullScreen ? 'flex-1 overflow-y-auto' : ''} p-6 space-y-4`}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Bank *</label>
                  <select
                    value={formData.fromBankId}
                    onChange={(e) => setFormData({ ...formData, fromBankId: e.target.value })}
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
                    value={formData.toBankId}
                    onChange={(e) => setFormData({ ...formData, toBankId: e.target.value })}
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
              </div>
              {/* Enhanced Source Bank Balance Preview */}
              {formData.fromBankId && banks.find(b => b.id === formData.fromBankId) && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 mb-4">
                  <div className="flex items-start gap-3">
                    <Wallet size={24} className="text-blue-600 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900 mb-3">💳 Source Bank Balance ({banks.find(b => b.id === formData.fromBankId)?.name})</p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 bg-white rounded">
                          <span className="text-sm text-gray-600">Available Balance:</span>
                          <span className="text-lg font-bold text-gray-900">
                            {formatCurrency(banks.find(b => b.id === formData.fromBankId)?.balance || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Amount *</label>
                <input
                  type="number"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                  placeholder="0"
                  min="0"
                />
              </div>

              {/* Enhanced Transfer Summary */}
              {formData.fromBankId && formData.toBankId && formData.amount > 0 && (
                <div className={`p-4 rounded-lg border-2 ${
                  (banks.find(b => b.id === formData.fromBankId)?.balance || 0) >= formData.amount 
                    ? 'bg-green-50 border-green-300' 
                    : 'bg-red-50 border-red-300'
                }`}>
                  <div className="flex items-start gap-3">
                    {(banks.find(b => b.id === formData.fromBankId)?.balance || 0) >= formData.amount ? (
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
                            {formatCurrency(banks.find(b => b.id === formData.fromBankId)?.balance || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-white rounded">
                          <span className="text-sm text-gray-600">Transfer Amount:</span>
                          <span className="font-bold text-red-700">
                            - {formatCurrency(formData.amount)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-white rounded border-t-2 border-gray-200">
                          <span className="text-sm font-semibold text-gray-700">Source Balance After Transfer:</span>
                          <span className={`text-lg font-bold ${
                            (banks.find(b => b.id === formData.fromBankId)?.balance || 0) >= formData.amount 
                              ? 'text-green-700' 
                              : 'text-red-700'
                          }`}>
                            {formatCurrency((banks.find(b => b.id === formData.fromBankId)?.balance || 0) - formData.amount)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-white rounded mt-3 border-t-2 border-gray-200">
                          <span className="text-sm font-semibold text-gray-700">Destination Balance After Transfer:</span>
                          <span className="text-lg font-bold text-green-700">
                            {formatCurrency((banks.find(b => b.id === formData.toBankId)?.balance || 0) + formData.amount)}
                          </span>
                        </div>
                      </div>
                      {(banks.find(b => b.id === formData.fromBankId)?.balance || 0) < formData.amount && (
                        <div className="mt-3 p-2 bg-red-100 rounded flex items-center gap-2">
                          <AlertCircle size={16} className="text-red-600" />
                          <p className="text-xs text-red-700 font-semibold">
                            ⚠️ Insufficient balance! Transfer cannot be processed.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] resize-none"
                  placeholder="Transfer purpose or note"
                />
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
                Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Transfer Modal */}
      {viewTransfer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Transfer Details</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrint(viewTransfer)}
                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  title="Print"
                >
                  <Printer size={20} />
                </button>
                <button
                  onClick={() => handleDownload(viewTransfer)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Download"
                >
                  <Download size={20} />
                </button>
                <button onClick={() => setViewTransfer(null)} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600">From Bank</p>
                    <p className="text-lg font-bold text-gray-900">{viewTransfer.fromBankName}</p>
                  </div>
                  <div className="bg-[#4f46e5] p-3 rounded-full">
                    <ArrowRight size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">To Bank</p>
                    <p className="text-lg font-bold text-gray-900">{viewTransfer.toBankName}</p>
                  </div>
                </div>
                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Transfer Amount</p>
                  <p className="text-3xl font-bold text-[#4f46e5]">{formatCurrency(viewTransfer.amount)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">{new Date(viewTransfer.date).toLocaleDateString('en-PK')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Time</p>
                  <p className="font-medium">{new Date(viewTransfer.date).toLocaleTimeString('en-PK')}</p>
                </div>
                {viewTransfer.note && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Note</p>
                    <p className="font-medium">{viewTransfer.note}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Slip Modal */}
      {viewSlip && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Bank Transfer Slip</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrint(viewSlip)}
                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  title="Print"
                >
                  <Printer size={20} />
                </button>
                <button
                  onClick={() => handleDownload(viewSlip)}
                  className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  title="Download"
                >
                  <Download size={20} />
                </button>
                <button onClick={() => setViewSlip(null)} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="p-8">
              {/* Company Header */}
              <div className="text-center border-b pb-4 mb-6">
                <h2 className="text-2xl font-bold text-[#4f46e5]">Pakistan Detectors Technologies</h2>
                <p className="text-lg font-semibold mt-2">Bank Transfer Slip</p>
              </div>

              {/* Transfer Flow Visualization */}
              <div className="bg-gradient-to-r from-[#4f46e5]/10 via-gray-50 to-[#10b981]/10 p-6 rounded-lg mb-6">
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <p className="text-xs text-gray-600 mb-2">From Bank</p>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                      <p className="font-bold text-lg text-gray-900">{viewSlip.fromBankName}</p>
                    </div>
                  </div>
                  <div className="mx-4">
                    <div className="bg-[#4f46e5] p-3 rounded-full">
                      <ArrowRight size={24} className="text-white" />
                    </div>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-xs text-gray-600 mb-2">To Bank</p>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                      <p className="font-bold text-lg text-gray-900">{viewSlip.toBankName}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slip Details */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Transfer ID:</span>
                  <span className="font-medium">{viewSlip.id}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{new Date(viewSlip.date).toLocaleDateString('en-PK')}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium">{new Date(viewSlip.date).toLocaleTimeString('en-PK')}</span>
                </div>
                {viewSlip.note && (
                  <div className="border-b pb-2">
                    <p className="text-gray-600 mb-1">Note:</p>
                    <p className="font-medium">{viewSlip.note}</p>
                  </div>
                )}
                <div className="flex justify-between items-center bg-[#4f46e5]/10 p-4 rounded-lg mt-4">
                  <span className="text-lg font-semibold text-gray-900">Transfer Amount:</span>
                  <span className="text-2xl font-bold text-[#4f46e5]">{formatCurrency(viewSlip.amount)}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t pt-4 text-center text-sm text-gray-500">
                <p>This is a computer-generated slip</p>
                <p className="mt-1">Generated on {new Date().toLocaleDateString('en-PK')} at {new Date().toLocaleTimeString('en-PK')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}