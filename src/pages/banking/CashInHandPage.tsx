import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Transaction } from '../../App';
import { 
  ArrowLeft, 
  Wallet,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Download,
  Banknote
} from 'lucide-react';

export function CashInHandPage() {
  const navigate = useNavigate();
  const { transactions } = useOutletContext<{
    transactions: Transaction[];
  }>();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'inflow' | 'outflow'>('all');

  // Filter cash transactions
  const cashTransactions = transactions.filter(t => t.mode === 'Cash');

  // Apply additional filters
  const filteredTransactions = cashTransactions.filter(transaction => {
    const matchesSearch = 
      transaction.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.subCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.note?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = 
      filterType === 'all' || 
      (filterType === 'inflow' && transaction.mainCategory === 'Cash Inflow') ||
      (filterType === 'outflow' && transaction.mainCategory === 'Cash Outflow');

    return matchesSearch && matchesType;
  });

  // Calculate statistics
  const stats = {
    totalCashInHand: (() => {
      const inflow = cashTransactions
        .filter(t => t.mainCategory === 'Cash Inflow')
        .reduce((sum, t) => sum + t.amount, 0);
      const outflow = cashTransactions
        .filter(t => t.mainCategory === 'Cash Outflow')
        .reduce((sum, t) => sum + t.amount, 0);
      return inflow - outflow;
    })(),
    totalInflow: cashTransactions
      .filter(t => t.mainCategory === 'Cash Inflow')
      .reduce((sum, t) => sum + t.amount, 0),
    totalOutflow: cashTransactions
      .filter(t => t.mainCategory === 'Cash Outflow')
      .reduce((sum, t) => sum + t.amount, 0),
    transactionCount: cashTransactions.length,
    inflowCount: cashTransactions.filter(t => t.mainCategory === 'Cash Inflow').length,
    outflowCount: cashTransactions.filter(t => t.mainCategory === 'Cash Outflow').length
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
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Cash in Hand</h2>
            <p className="text-gray-600">Track physical cash transactions and balances</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/finance/transactions')}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Banknote size={18} />
          Add Cash Transaction
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={18} className="text-orange-600" />
            <p className="text-sm text-gray-600">Cash in Hand</p>
          </div>
          <p className={`text-2xl font-bold ${stats.totalCashInHand >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(stats.totalCashInHand)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-green-600" />
            <p className="text-sm text-gray-600">Total Inflow</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalInflow)}</p>
          <p className="text-xs text-gray-500 mt-1">{stats.inflowCount} transactions</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={18} className="text-red-600" />
            <p className="text-sm text-gray-600">Total Outflow</p>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalOutflow)}</p>
          <p className="text-xs text-gray-500 mt-1">{stats.outflowCount} transactions</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Banknote size={18} className="text-blue-600" />
            <p className="text-sm text-gray-600">Total Transactions</p>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.transactionCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-500" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Transactions</option>
            <option value="inflow">Cash Inflow Only</option>
            <option value="outflow">Cash Outflow Only</option>
          </select>
        </div>

        <button className="flex items-center gap-2 px-3 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
          <Download size={18} />
          Export
        </button>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Company/Entity</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Category</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Sub Category</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  <Wallet className="mx-auto mb-3 text-gray-300" size={48} />
                  <p className="text-lg font-medium">No cash transactions found</p>
                  <p className="text-sm mt-1">Add cash transactions to see them here</p>
                </td>
              </tr>
            ) : (
              filteredTransactions
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{transaction.company}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      transaction.mainCategory === 'Cash Inflow' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.mainCategory === 'Cash Inflow' ? (
                        <TrendingUp size={12} className="mr-1" />
                      ) : (
                        <TrendingDown size={12} className="mr-1" />
                      )}
                      {transaction.mainCategory}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {transaction.subCategory}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <span className={transaction.mainCategory === 'Cash Inflow' ? 'text-green-600' : 'text-red-600'}>
                      {transaction.mainCategory === 'Cash Inflow' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                    {transaction.note || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="text-orange-600" size={24} />
            <div>
              <p className="text-sm text-orange-800 font-medium">Current Cash Position</p>
              <p className="text-xs text-orange-600">
                Based on {stats.transactionCount} cash transactions
              </p>
            </div>
          </div>
          <p className={`text-2xl font-bold ${stats.totalCashInHand >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(stats.totalCashInHand)}
          </p>
        </div>
      </div>
    </div>
  );
}
