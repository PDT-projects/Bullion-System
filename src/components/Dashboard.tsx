import { AppData, Transaction } from '../App';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Building2, DollarSign, BarChart3, PieChart, Activity, FileText, Package, Users, Receipt, TrendingUp as TrendingUpIcon } from 'lucide-react';
import { InventoryCharts } from './InventoryCharts';
import { TransactionCharts } from './TransactionCharts';
import { CashFlowCharts } from './CashFlowCharts';
import { SalesReport } from './SalesReport';
import { InventoryReport } from './InventoryReport';
import { TransactionHistoryReport } from './TransactionHistoryReport';
import { ReferralReport } from './ReferralReport';
import { CommissionReport } from './CommissionReport';
import { InvoiceReport } from './InvoiceReport';
import { useState } from 'react';
import { mockCashFlowData } from '../mockData';

type DashboardProps = {
  data: AppData;
};

export function Dashboard({ data }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

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
      case 'reports':
        if (selectedReport) {
          // Render selected report
          const reportProps = {
            sales: { invoices: data.invoices, products: data.products },
            inventory: { products: data.products },
            transactions: { transactions: data.transactions },
            referral: { invoices: data.invoices },
            commission: { commissions: data.commissions },
            invoices: { invoices: data.invoices, products: data.products }
          };

          const renderReport = () => {
            switch (selectedReport) {
              case 'sales':
                return <SalesReport {...reportProps.sales} />;
              case 'inventory':
                return <InventoryReport {...reportProps.inventory} />;
              case 'transactions':
                return <TransactionHistoryReport {...reportProps.transactions} />;
              case 'referral':
                return <ReferralReport {...reportProps.referral} />;
              case 'commission':
                return <CommissionReport {...reportProps.commission} />;
              case 'invoices':
                return <InvoiceReport {...reportProps.invoices} />;
              default:
                return null;
            }
          };

          return (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 capitalize">{selectedReport} Report</h3>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ← Back to Reports Hub
                </button>
              </div>
              {renderReport()}
            </div>
          );
        } else {
          // Reports Hub
          const reportCards = [
            {
              id: 'sales',
              name: 'Sales Report',
              description: 'View sales performance, revenue trends, and customer analytics',
              icon: TrendingUpIcon,
              color: 'bg-blue-500'
            },
            {
              id: 'inventory',
              name: 'Inventory Report',
              description: 'Track stock levels, product distribution, and inventory value',
              icon: Package,
              color: 'bg-green-500'
            },
            {
              id: 'transactions',
              name: 'Transaction History',
              description: 'Analyze financial transactions and payment patterns',
              icon: Receipt,
              color: 'bg-purple-500'
            },
            {
              id: 'invoices',
              name: 'Invoice Report',
              description: 'Monitor invoice status, payments, and outstanding amounts',
              icon: FileText,
              color: 'bg-orange-500'
            },
            {
              id: 'referral',
              name: 'Referral Report',
              description: 'Track referral performance and commission earnings',
              icon: Users,
              color: 'bg-pink-500'
            },
            {
              id: 'commission',
              name: 'Commission Report',
              description: 'View salesperson commissions and performance metrics',
              icon: DollarSign,
              color: 'bg-indigo-500'
            }
          ];

          return (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900">Reports Hub</h3>
                <p className="text-sm text-gray-600 mt-1">Access all your business reports in one place</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reportCards.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => setSelectedReport(card.id)}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="flex items-center mb-4">
                      <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center mr-4`}>
                        <card.icon size={24} className="text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{card.name}</h4>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{card.description}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        }
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
          <button
            onClick={() => {
              setActiveTab('reports');
              setSelectedReport(null);
            }}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'reports'
                ? 'text-[#4f46e5] border-b-2 border-[#4f46e5] bg-[#4f46e5]/5'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="inline mr-2" size={18} />
            Reports
          </button>
        </div>
      </div>

      {renderContent()}
    </div>
  );
}
