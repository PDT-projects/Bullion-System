import { AppData, Transaction } from '../App';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Building2, DollarSign, BarChart3, PieChart, Activity } from 'lucide-react';
import { InventoryCharts } from './InventoryCharts';
import { TransactionCharts } from './TransactionCharts';
import { CashFlowCharts } from './CashFlowCharts';
import { useState } from 'react';
import { mockCashFlowData } from '../mockData';

type DashboardProps = {
  data: AppData;
};

export function Dashboard({ data }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate totals
  const cashInflow = data.transactions
    .filter(t => t.mainCategory === 'Cash Inflow' && t.mode === 'Cash')
    .reduce((sum, t) => sum + t.amount, 0);

  const cashOutflow = data.transactions
    .filter(t => t.mainCategory === 'Cash Outflow' && t.mode === 'Cash')
    .reduce((sum, t) => sum + t.amount, 0);

  const cashBalance = cashInflow - cashOutflow;

  const totalBankBalance = data.banks.reduce((sum, bank) => sum + bank.balance, 0);
  const overallBalance = cashBalance + totalBankBalance;

  // Prepare chart data
  const cashflowData = [
    { month: 'Jul', inflow: 450000, outflow: 320000 },
    { month: 'Aug', inflow: 520000, outflow: 380000 },
    { month: 'Sep', inflow: 480000, outflow: 350000 },
    { month: 'Oct', inflow: 580000, outflow: 420000 },
    { month: 'Nov', inflow: 620000, outflow: 450000 },
    { month: 'Dec', inflow: 550000, outflow: 390000 },
    { month: 'Jan', inflow: 735000, outflow: 610000 }
  ];

  const recentTransactions = data.transactions.slice(0, 8);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'inventory':
        return <InventoryCharts products={data.products} />;
      case 'transactions':
        return <TransactionCharts transactions={data.transactions} />;
      case 'cashflow':
        return <CashFlowCharts transactions={data.transactions} />;
      default:
        return (
          <>
            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Cash Inflow</span>
                  <TrendingUp className="text-[#10b981]" size={20} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(cashInflow)}</p>
                <p className="text-xs text-[#10b981] mt-1">+12.5% from last month</p>
              </div>

              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Cash Outflow</span>
                  <TrendingDown className="text-[#ef4444]" size={20} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(cashOutflow)}</p>
                <p className="text-xs text-[#ef4444] mt-1">+8.3% from last month</p>
              </div>

              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Cash Balance</span>
                  <Wallet className="text-[#4f46e5]" size={20} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(cashBalance)}</p>
                <p className="text-xs text-gray-600 mt-1">Cash in hand</p>
              </div>

              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Bank Balance</span>
                  <Building2 className="text-[#4f46e5]" size={20} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalBankBalance)}</p>
                <p className="text-xs text-gray-600 mt-1">{data.banks.length} accounts</p>
              </div>

              <div className="bg-gradient-to-br from-[#4f46e5] to-[#6366f1] rounded-lg p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/90">Overall Balance</span>
                  <DollarSign className="text-white" size={20} />
                </div>
                <p className="text-2xl font-bold text-white">{formatCurrency(overallBalance)}</p>
                <p className="text-xs text-white/80 mt-1">Total assets</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="font-bold text-lg mb-4">Cashflow Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={cashflowData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="inflow" stroke="#10b981" strokeWidth={2} name="Inflow" />
                    <Line type="monotone" dataKey="outflow" stroke="#ef4444" strokeWidth={2} name="Outflow" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="font-bold text-lg mb-4">Inflow vs Outflow</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={cashflowData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    />
                    <Legend />
                    <Bar dataKey="inflow" fill="#10b981" name="Inflow" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="outflow" fill="#ef4444" name="Outflow" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="font-bold text-lg">Recent Transactions</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Main Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sub Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Name</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(transaction.date).toLocaleDateString('en-PK')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            transaction.mainCategory === 'Cash Inflow'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.mainCategory}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{transaction.subCategory}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            transaction.mode === 'Cash'
                              ? 'bg-blue-100 text-blue-800'
                              : transaction.mode === 'Bank'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {transaction.mode}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{transaction.bankName || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-[#4f46e5] border-b-2 border-[#4f46e5] bg-[#4f46e5]/5'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Activity className="inline mr-2" size={18} />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'inventory'
                ? 'text-[#4f46e5] border-b-2 border-[#4f46e5] bg-[#4f46e5]/5'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="inline mr-2" size={18} />
            Inventory
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'transactions'
                ? 'text-[#4f46e5] border-b-2 border-[#4f46e5] bg-[#4f46e5]/5'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <PieChart className="inline mr-2" size={18} />
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('cashflow')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'cashflow'
                ? 'text-[#4f46e5] border-b-2 border-[#4f46e5] bg-[#4f46e5]/5'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <TrendingUp className="inline mr-2" size={18} />
            Cash Flow
          </button>
        </div>
      </div>

      {renderContent()}
    </div>
  );
}
