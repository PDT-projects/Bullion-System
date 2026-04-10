import { useState, useMemo } from 'react';
import { Filter, Download, Eye, Calendar, Building2, DollarSign, TrendingUp, TrendingDown, Users, XCircle } from 'lucide-react';
import { toast } from 'sonner';

type Bank = {
  id: string;
  name: string;
  balance: number;
  accountNumber: string;
  transactions: any[];
};

interface BankBalanceReportProps {
  data: Bank[];
}

export function BankBalanceReport({ data }: BankBalanceReportProps) {
  const [sortBy, setSortBy] = useState<'balance' | 'name'>('balance');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewBank, setViewBank] = useState<Bank | null>(null);

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      if (sortBy === 'balance') {
        return b.balance - a.balance;
      }
      return a.name.localeCompare(b.name);
    });
  }, [data, sortBy]);

  const filteredData = useMemo(() => {
    return sortedData.filter(bank =>
      bank.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sortedData, searchTerm]);

  const totalBalance = filteredData.reduce((sum, bank) => sum + bank.balance, 0);

  const handleExportCSV = () => {
    const headers = ['Bank Name', 'Account Number', 'Balance', 'Last Transaction'];
    const rows = filteredData.map(bank => [
      bank.name,
      bank.accountNumber,
      bank.balance.toString(),
      bank.transactions[0]?.date || 'No transactions'
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bank-balance-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Bank balance report exported');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Bank Balance Report</h2>
        <p className="text-sm text-gray-600 mt-1">All bank accounts and their current balances</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 size={18} className="text-blue-600" />
            <p className="text-sm text-gray-600">Total Banks</p>
          </div>
          <p className="text-2xl font-bold text-[#4f46e5]">{filteredData.length}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={18} className="text-green-600" />
            <p className="text-sm text-gray-600">Total Balance</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{totalBalance.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-emerald-600" />
            <p className="text-sm text-gray-600">Positive Balance</p>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{filteredData.filter(b => b.balance > 0).reduce((sum, b) => sum + b.balance, 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search banks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 w-64"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'balance' | 'name')}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="balance">Balance</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Transaction</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No banks found
                </td>
              </tr>
            ) : (
              filteredData.map((bank) => (
                <tr key={bank.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Building2 size={18} />
                      {bank.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-900">{bank.accountNumber}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      bank.balance >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {bank.balance.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {bank.transactions[0] ? new Date(bank.transactions[0].date).toLocaleDateString() : 'No transactions'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setViewBank(bank)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {viewBank && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">{viewBank.name}</h3>
              <button onClick={() => setViewBank(null)}>
                <XCircle size={24} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600">Account Number</p>
                <p className="font-mono text-lg">{viewBank.accountNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Balance</p>
                <p className={`text-2xl font-bold ${viewBank.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {viewBank.balance.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Recent Transactions</p>
                <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                  {viewBank.transactions.slice(0, 5).map((tx, idx) => (
                    <div key={idx} className="text-sm p-2 bg-gray-50 rounded">
                      {new Date(tx.date).toLocaleDateString()} - {tx.description} ({tx.amount})
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
