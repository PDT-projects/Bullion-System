import { AppData, Transaction } from '../../App';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Building2, DollarSign, Activity, FileText, Package, Users, Receipt, TrendingUp as TrendingUpIcon } from 'lucide-react';
import { SalesReport } from '../sales/SalesReport';
import { InventoryReport } from '../../features/inventory/InventoryReport';
import { TransactionHistoryReport } from './TransactionHistoryReport';
import { ReferralReport } from '../sales/ReferralReport';
import { CommissionReport } from '../sales/CommissionReport';
// import { InvoiceReportView } from '../../modules/invoices';


import { InventoryAuditLogComponent } from '../inventory/InventoryAuditLog';
import { ProfitLossReport } from './ProfitLossReport';
import { BalanceSheetReport } from './BalanceSheetReport';
import { LoanHistory } from './LoanHistory';
import { useState } from 'react';

type DashboardProps = {
  data: AppData;
};

export function Dashboard({ data }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  // Handle null/undefined data and provide fallback values
  const transactions = data?.transactions ?? [];
  const banks = data?.banks ?? [];
  const invoices = data?.invoices ?? [];
  const loans = data?.loans ?? [];
  const bankTransfers = data?.bankTransfers ?? [];
  const commissions = data?.commissions ?? [];
  const products = data?.products ?? [];

  // Calculate totals
  const cashInflow = transactions
    .filter(t => t.mainCategory === 'Cash Inflow' && t.mode === 'Cash')
    .reduce((sum, t) => sum + t.amount, 0);

  const cashOutflow = transactions
    .filter(t => t.mainCategory === 'Cash Outflow' && t.mode === 'Cash')
    .reduce((sum, t) => sum + t.amount, 0);

  const cashBalance = cashInflow - cashOutflow;

  const totalBankBalance = banks.reduce((sum, bank) => sum + bank.balance, 0);
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

  const recentTransactions = transactions.slice(0, 8);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'reports':
        if (selectedReport) {
          // Render selected report
const reportProps = {
            sales: { invoices, products },
            inventory: { products },
            transactions: { transactions },
            referral: { invoices },
            commission: { commissions },
            invoices: { invoices, products },
            'inventory-audit-log': { auditLogs: [] },
            'transaction-history-report': { transactions },
            'transaction-history': { transactions },
            'loan-history': { loans },
            'transfer-history': { transfers: bankTransfers }
          };

          const renderReport = () => {
            switch (selectedReport) {
              case 'sales':
                return <SalesReport {...reportProps.sales} />;
              case 'profit-loss':
                return <ProfitLossReport onBack={() => setSelectedReport(null)} />;
              case 'balance-sheet':
                return <BalanceSheetReport onBack={() => setSelectedReport(null)} />;
              case 'inventory':
                return <InventoryReport {...reportProps.inventory} />;
              case 'transactions':
                return <TransactionHistoryReport {...reportProps.transactions} />;
              case 'referral':
                return <ReferralReport {...reportProps.referral} />;
              case 'commission':
                return <CommissionReport {...reportProps.commission} />;
              case 'invoices':
                return <InvoiceReportView {...reportProps.invoices} />;

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
              color: 'from-indigo-500 to-indigo-600',
              bgColor: 'bg-indigo-50',
              textColor: 'text-indigo-700',
              stats: 'Revenue & Analytics'
            },
            {
              id: 'profit-loss',
              name: 'Profit & Loss Report',
              description: 'Analyze financial performance with revenue, expenses, and profit calculations',
              icon: DollarSign,
              color: 'from-green-500 to-green-600',
              bgColor: 'bg-green-50',
              textColor: 'text-green-700',
              stats: 'Financial Analysis'
            },
            {
              id: 'balance-sheet',
              name: 'Balance Sheet',
              description: 'View financial position with assets, liabilities, and equity statement',
              icon: FileText,
              color: 'from-blue-500 to-blue-600',
              bgColor: 'bg-blue-50',
              textColor: 'text-blue-700',
              stats: 'Financial Position'
            },
            {
              id: 'inventory',
              name: 'Inventory Report',
              description: 'Track stock levels, product distribution, and inventory value',
              icon: Package,
              color: 'from-indigo-500 to-indigo-600',
              bgColor: 'bg-indigo-50',
              textColor: 'text-indigo-700',
              stats: 'Stock Management'
            },
            {
              id: 'transactions',
              name: 'Transaction History',
              description: 'Analyze financial transactions and payment patterns',
              icon: Receipt,
              color: 'from-indigo-500 to-indigo-600',
              bgColor: 'bg-indigo-50',
              textColor: 'text-indigo-700',
              stats: 'Financial Flow'
            },
            {
              id: 'invoices',
              name: 'Invoice Report',
              description: 'Monitor invoice status, payments, and outstanding amounts',
              icon: FileText,
              color: 'from-indigo-500 to-indigo-600',
              bgColor: 'bg-indigo-50',
              textColor: 'text-indigo-700',
              stats: 'Payment Tracking'
            },
            {
              id: 'referral',
              name: 'Referral Report',
              description: 'Track referral performance and commission earnings',
              icon: Users,
              color: 'from-indigo-500 to-indigo-600',
              bgColor: 'bg-indigo-50',
              textColor: 'text-indigo-700',
              stats: 'Referral Network'
            },
            {
              id: 'commission',
              name: 'Commission Report',
              description: 'View salesperson commissions and performance metrics',
              icon: DollarSign,
              color: 'from-indigo-500 to-indigo-600',
              bgColor: 'bg-indigo-50',
              textColor: 'text-indigo-700',
              stats: 'Performance Bonus'
            },
            {
              id: 'inventory-audit-log',
              name: 'Inventory Audit Log',
              description: 'Monitor inventory changes, audits, and stock adjustments',
              icon: FileText,
              color: 'from-indigo-500 to-indigo-600',
              bgColor: 'bg-indigo-50',
              textColor: 'text-indigo-700',
              stats: 'Audit Trail'
            },
            {
              id: 'transaction-history-report',
              name: 'Transaction History Report',
              description: 'Detailed transaction history with filtering and export options',
              icon: Receipt,
              color: 'from-indigo-500 to-indigo-600',
              bgColor: 'bg-indigo-50',
              textColor: 'text-indigo-700',
              stats: 'Detailed History'
            },
            {
              id: 'transaction-history',
              name: 'Transaction History',
              description: 'Complete transaction history with search and filter capabilities',
              icon: Receipt,
              color: 'from-indigo-500 to-indigo-600',
              bgColor: 'bg-indigo-50',
              textColor: 'text-indigo-700',
              stats: 'Complete History'
            },
            {
              id: 'loan-history',
              name: 'Loan History',
              description: 'Track loan transactions, payments, and outstanding balances',
              icon: DollarSign,
              color: 'from-indigo-500 to-indigo-600',
              bgColor: 'bg-indigo-50',
              textColor: 'text-indigo-700',
              stats: 'Loan Tracking'
            },
            {
              id: 'transfer-history',
              name: 'Transfer History',
              description: 'Monitor bank transfers and inter-account movements',
              icon: Building2,
              color: 'from-indigo-500 to-indigo-600',
              bgColor: 'bg-indigo-50',
              textColor: 'text-indigo-700',
              stats: 'Transfer Records'
            }
          ];

          return (
            <div className="space-y-8">
              {/* Header Section */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] rounded-2xl mb-4">
                  <FileText size={32} className="text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">Reports Hub</h3>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Access comprehensive business insights and analytics across all your operations
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Total Reports</p>
                      <p className="text-2xl font-bold text-gray-900">{reportCards.length}</p>
                    </div>
                    <FileText size={24} className="text-indigo-600" />
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Data Sources</p>
                      <p className="text-2xl font-bold text-gray-900">6</p>
                    </div>
                    <Package size={24} className="text-indigo-600" />
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Real-time</p>
                      <p className="text-2xl font-bold text-gray-900">Yes</p>
                    </div>
                    <Activity size={24} className="text-indigo-600" />
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Export Ready</p>
                      <p className="text-2xl font-bold text-gray-900">All</p>
                    </div>
                    <TrendingUp size={24} className="text-indigo-600" />
                  </div>
                </div>
              </div>

              {/* Reports Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reportCards.map((card, index) => (
                  <div
                    key={card.id}
                    onClick={() => setSelectedReport(card.id)}
                    className="group relative bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-300 cursor-pointer transform hover:-translate-y-1 overflow-hidden"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Background Gradient on Hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl`} />

                    {/* Content */}
                    <div className="relative z-10">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-14 h-14 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          <card.icon size={28} className="text-white" />
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${card.bgColor} ${card.textColor}`}>
                            {card.stats}
                          </span>
                        </div>
                      </div>

                      {/* Title and Description */}
                      <div className="mb-4">
                        <h4 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-800 transition-colors">
                          {card.name}
                        </h4>
                        <p className="text-gray-600 leading-relaxed">
                          {card.description}
                        </p>
                      </div>

                      {/* Action Indicator */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-500">
                          <span>View Report</span>
                          <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        <div className={`w-8 h-8 rounded-full ${card.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                          <svg className="w-4 h-4 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Hover Effect Border */}
                    <div className={`absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-gradient-to-r group-hover:${card.color.split(' ')[0]}/20 transition-all duration-300`} />
                  </div>
                ))}
              </div>

              {/* Bottom Section */}
              <div className="text-center py-8">
                <div className="inline-flex items-center gap-2 text-gray-500">
                  <Activity size={16} />
                  <span className="text-sm">All reports are updated in real-time</span>
                </div>
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
<p className="text-xs text-gray-600 mt-1">{banks.length} accounts</p>
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
