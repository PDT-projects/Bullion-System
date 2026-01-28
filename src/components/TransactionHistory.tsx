import { useState } from 'react';
import { Transaction } from '../App';
import { Printer, Download, Filter } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

type TransactionHistoryProps = {
  transactions: Transaction[];
};

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const [filterDate, setFilterDate] = useState('');
  const [filterBank, setFilterBank] = useState('');
  const [filterType, setFilterType] = useState('');

  const handlePrint = (transaction: Transaction) => {
    toast.success('Printing transaction slip');
    window.print();
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Cash Inflow':
        return 'bg-green-100 text-green-800';
      case 'Cash Outflow':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filterDate && transaction.date !== filterDate) return false;
    if (filterBank && transaction.bankName !== filterBank) return false;
    if (filterType && transaction.mainCategory !== filterType) return false;
    return true;
  });

  const uniqueBanks = Array.from(new Set(transactions.map(t => t.bankName).filter(Boolean)));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Transaction History</h2>
        <p className="text-sm text-gray-600 mt-1">Complete record of all transactions</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={18} className="text-gray-600" />
          <h3 className="font-medium text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bank</label>
            <select
              value={filterBank}
              onChange={(e) => setFilterBank(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
            >
              <option value="">All Banks</option>
              {uniqueBanks.map(bank => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
            >
              <option value="">All Types</option>
              <option value="Cash Inflow">Cash Inflow</option>
              <option value="Cash Outflow">Cash Outflow</option>
              <option value="Loans & Advances">Loans & Advances</option>
            </select>
          </div>
        </div>
        {(filterDate || filterBank || filterType) && (
          <button
            onClick={() => {
              setFilterDate('');
              setFilterBank('');
              setFilterType('');
            }}
            className="mt-3 text-sm text-[#4f46e5] hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
          <p className="text-2xl font-bold text-gray-900">{filteredTransactions.length}</p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total Inflow</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(
              filteredTransactions
                .filter(t => t.mainCategory === 'Cash Inflow')
                .reduce((sum, t) => sum + t.amount, 0)
            )}
          </p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total Outflow</p>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(
              filteredTransactions
                .filter(t => t.mainCategory === 'Cash Outflow')
                .reduce((sum, t) => sum + t.amount, 0)
            )}
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sub Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(transaction.date).toLocaleDateString('en-PK')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {transaction.company}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(transaction.mainCategory)}`}>
                      {transaction.mainCategory}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.subCategory}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.mode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.bankName || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePrint(transaction)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Print Slip"
                      >
                        <Printer size={16} />
                      </button>
                      <button
                        onClick={() => handleDownload(transaction)}
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
