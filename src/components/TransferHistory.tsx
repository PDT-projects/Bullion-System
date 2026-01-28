import { useState } from 'react';
import { BankTransfer } from '../App';
import { Printer, Download, Filter, ArrowRight } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

type TransferHistoryProps = {
  transfers: BankTransfer[];
};

export function TransferHistory({ transfers }: TransferHistoryProps) {
  const [filterDate, setFilterDate] = useState('');

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

  const filteredTransfers = transfers.filter(transfer => {
    if (filterDate && transfer.date !== filterDate) return false;
    return true;
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Transfer History</h2>
        <p className="text-sm text-gray-600 mt-1">Complete record of all bank-to-bank transfers</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={18} className="text-gray-600" />
          <h3 className="font-medium text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
            />
          </div>
        </div>
        {filterDate && (
          <button
            onClick={() => setFilterDate('')}
            className="mt-3 text-sm text-[#4f46e5] hover:underline"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total Transfers</p>
          <p className="text-2xl font-bold text-gray-900">{filteredTransfers.length}</p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total Amount Transferred</p>
          <p className="text-2xl font-bold text-[#4f46e5]">
            {formatCurrency(filteredTransfers.reduce((sum, t) => sum + t.amount, 0))}
          </p>
        </div>
      </div>

      {/* Transfers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From Bank</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To Bank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransfers.map((transfer) => (
                <tr key={transfer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div>{new Date(transfer.date).toLocaleDateString('en-PK')}</div>
                      <div className="text-xs text-gray-500">{new Date(transfer.date).toLocaleTimeString('en-PK')}</div>
                    </div>
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
                        onClick={() => handlePrint(transfer)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Print Slip"
                      >
                        <Printer size={16} />
                      </button>
                      <button
                        onClick={() => handleDownload(transfer)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Download Slip"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
