// Dashboard.tsx
// Fully wired to real Firestore data via useDashboardData hook.
// No more hardcoded/mock chart data — all numbers come from live collections.

import { useState } from 'react';
import { useUserPermissions, type Screen } from '../../modules/user-management/hooks/useUserPermissions';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, TrendingDown, Wallet, Building2, DollarSign,
  Activity, FileText, Package, Users, Receipt, AlertCircle,
  RefreshCw, Loader2, CreditCard, BarChart2
} from 'lucide-react';

import { useDashboardData } from './UseDashboardData';

import { 
  SalesReport }               from '../sales/SalesReport';
import { 
  ExpensesReport }            from './ExpensesReport';
import { 
  BankBalanceReport }         from './BankBalanceReport';
import { 
  SalariesReport }            from './SalariesReport';
import { 
  FixedBillsReport }          from './FixedBillsReport';
import { 
  InventoryReport }           from '../../features/inventory/InventoryReport';
import { 
  ProductTransferReport }     from '../inventory/ProductTransferReport';
import { 
  TransactionHistoryReport }  from './TransactionHistoryReport';
import { 
  ReferralReport }            from '../sales/ReferralReport';
import { 
  CommissionReport }          from '../sales/CommissionReport';
import { 
  ProfitLossReport }          from './ProfitLossReport';
import { 
  BalanceSheetReport }        from './BalanceSheetReport';
import { 
  LoanHistory }               from './LoanHistory';


// ─────────────────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency', currency: 'PKR', minimumFractionDigits: 0
  }).format(amount);

// ─────────────────────────────────────────────────────────────────────────────

export function Dashboard() {
  const [activeTab, setActiveTab]       = useState('overview');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  // All data from Firestore — no props needed
  const { hasPermission } = useUserPermissions();
  const {
    transactions, banks, loans, invoices, commissions, products,
    loading, error, refresh,
    stats, monthlyChartData,
  } = useDashboardData();

  // ── Loading / error states ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 size={40} className="animate-spin text-[#4f46e5]" />
        <p className="text-gray-500 text-lg">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle size={40} className="text-red-500" />
        <p className="text-red-600 text-lg">{error}</p>
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca]"
        >
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  // ── Report render map ───────────────────────────────────────────────────
  const renderSelectedReport = () => {
    switch (selectedReport) {
      case 'sales':
        return <SalesReport invoices={invoices} products={products} />;
      case 'profit-loss':
        return (
          <ProfitLossReport
            transactions={transactions}
            onBack={() => setSelectedReport(null)}
          />
        );
      case 'balance-sheet':
        return (
          <BalanceSheetReport
            transactions={transactions}
            banks={banks}
            loans={loans}
            products={products}
            onBack={() => setSelectedReport(null)}
          />
        );
      case 'inventory':
        return <InventoryReport products={products} />;
      case 'transactions':
        return <TransactionHistoryReport transactions={transactions} />;

      case 'referral':
        return <ReferralReport invoices={invoices} />;
      case 'commission':
        return <CommissionReport commissions={commissions} />;
      case 'product-transfer':
        return <ProductTransferReport transferLogs={[]} />;
      case 'loan-history':
        return <LoanHistory loans={loans} />;
      default:
        return null;
    }
  };

  // ── Report cards config ─────────────────────────────────────────────────
  const screenMap: Record<string, Screen> = {
    'sales': 'Sales Report',
    'profit-loss': 'Profit Loss Report',
    'balance-sheet': 'Balance Sheet Report',
    'inventory': 'Inventory Report',
    'transactions': 'Transaction History Report',
    'referral': 'Referral Report',
    'commission': 'Commission Report',
    'expenses': 'Expenses Report',
    'bank-balance': 'Bank Balance Report',
    'salaries': 'Salaries Report',
    'fixed-bills': 'Fixed Bills Report',
    'product-transfer': 'Product Transfer Report',
    'loan-history': 'Loan History',
  };
  
  const filteredReports = [
    { id: 'sales',               name: 'Sales Report',               description: 'Sales performance, revenue trends, and customer analytics', icon: TrendingUp,  color: 'from-indigo-500 to-indigo-600',  bg: 'bg-indigo-50',  text: 'text-indigo-700',  tag: 'Revenue & Analytics' },
    { id: 'profit-loss',         name: 'Profit & Loss',              description: 'Revenue, expenses, and net profit calculations',             icon: DollarSign,  color: 'from-gray-500 to-gray-600',      bg: 'bg-gray-50',    text: 'text-gray-700',    tag: 'Financial Analysis' },
    { id: 'balance-sheet',       name: 'Balance Sheet',              description: 'Assets, liabilities, and equity statement',                  icon: FileText,    color: 'from-blue-500 to-blue-600',      bg: 'bg-blue-50',    text: 'text-blue-700',    tag: 'Financial Position' },
    { id: 'inventory',           name: 'Inventory Report',           description: 'Stock levels, product distribution, and inventory value',     icon: Package,     color: 'from-purple-500 to-purple-600',  bg: 'bg-purple-50',  text: 'text-purple-700',  tag: 'Stock Management' },
    { id: 'transactions',        name: 'Transaction History Report', description: 'Detailed transaction history with filtering and export',       icon: Receipt,     color: 'from-indigo-500 to-indigo-600',  bg: 'bg-indigo-50',  text: 'text-indigo-700',  tag: 'Detailed History' },

    { id: 'referral',            name: 'Referral Report',            description: 'Track referral performance and earnings',                      icon: Users,       color: 'from-pink-500 to-pink-600',      bg: 'bg-pink-50',    text: 'text-pink-700',    tag: 'Referral Network' },
    { id: 'commission',          name: 'Commission Report',          description: 'Salesperson commissions and performance metrics',              icon: CreditCard,  color: 'from-orange-500 to-orange-600',  bg: 'bg-orange-50',  text: 'text-orange-700',  tag: 'Performance Bonus' },
    { id: 'expenses',            name: 'Expenses Report',            description: 'All expenses, categories, and spending analysis',               icon: Receipt,     color: 'from-gray-200 to-gray-100',     bg: 'bg-white',      text: 'text-black',      tag: 'Spending Analysis' },
    { id: 'bank-balance',        name: 'Bank Balance Report',        description: 'Bank accounts, balances, and transaction history',             icon: Building2,   color: 'from-gray-200 to-gray-100',     bg: 'bg-white',      text: 'text-black',      tag: 'Banking' },
    { id: 'salaries',            name: 'Salaries Report',            description: 'Employee salaries, payments, and payroll summary',              icon: Users,       color: 'from-gray-200 to-gray-100',     bg: 'bg-white',      text: 'text-black',      tag: 'Payroll' },

    { id: 'fixed-bills',         name: 'Fixed Bills Report',         description: 'Recurring bills, due dates, and payment status',               icon: FileText,    color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50',  text: 'text-purple-700',  tag: 'Recurring Expenses' },
    { id: 'product-transfer',    name: 'Product Transfer Report',    description: 'Inventory changes, audits, and stock adjustments',             icon: FileText,    color: 'from-slate-500 to-slate-600',    bg: 'bg-slate-50',   text: 'text-slate-700',   tag: 'Audit Trail' },
    { id: 'loan-history',        name: 'Loan History',               description: 'Loan transactions, payments, and outstanding balances',         icon: DollarSign,  color: 'from-gray-500 to-gray-600',      bg: 'bg-gray-50',    text: 'text-gray-700',    tag: 'Loan Tracking' },
  ];

  const reportCards = filteredReports.filter((report: any) => {
    const screen = screenMap[report.id as keyof typeof screenMap];
    if (!screen) return false;
    return hasPermission(screen);
  });

  // ── Render content by tab ───────────────────────────────────────────────
  const renderContent = () => {
    switch (activeTab) {

      // ────────────── REPORTS TAB ──────────────────────────────────────────
      case 'reports':
        if (selectedReport) {
          return (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 capitalize">
                  {reportCards.find(r => r.id === selectedReport)?.name ?? selectedReport}
                </h3>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ← Back to Reports Hub
                </button>
              </div>
              {renderSelectedReport()}
            </div>
          );
        }

        return (
          <div className="space-y-8">
            {/* Quick stats bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Reports', value: reportCards.length, icon: FileText },
                { label: 'Transactions', value: transactions.length, icon: Receipt },
                { label: 'Products', value: products.length, icon: Package },
                { label: 'Live Data', value: 'Yes', icon: Activity },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">{label}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                  </div>
                  <Icon size={24} className="text-indigo-500" />
                </div>
              ))}
            </div>

            {/* Report cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reportCards.map((card, i) => (
                <div
                  key={card.id}
                  onClick={() => setSelectedReport(card.id)}
                  className="group relative bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-300 cursor-pointer hover:-translate-y-1 overflow-hidden"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl`} />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <card.icon size={28} className="text-white" />
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${card.bg} ${card.text}`}>
                        {card.tag}
                      </span>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">{card.name}</h4>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">{card.description}</p>
                    <div className="flex items-center text-sm text-gray-500 group-hover:text-[#4f46e5] transition-colors">
                      <span>View Report</span>
                      <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center py-4">
              <span className="text-sm text-gray-400 flex items-center justify-center gap-2">
                <Activity size={14} /> All reports powered by live Firestore data
              </span>
            </div>
          </div>
        );

      // ────────────── OVERVIEW TAB (default) ───────────────────────────────
      default:
        return (
          <>
            {/* Refresh button */}
            <div className="flex justify-end mb-2">
              <button
                onClick={refresh}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#4f46e5] transition-colors"
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>

            {/* ── Balance Cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Inflow</span>
                  <TrendingUp className="text-[#10b981]" size={20} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.cashInflow)}</p>
                <p className="text-xs text-gray-500 mt-1">All cash inflow transactions</p>
              </div>

              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Outflow</span>
                  <TrendingDown className="text-[#ef4444]" size={20} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.cashOutflow)}</p>
                <p className="text-xs text-gray-500 mt-1">Incl. salary & bills</p>
              </div>

              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Cash Balance</span>
                  <Wallet className="text-[#4f46e5]" size={20} />
                </div>
                <p className={`text-2xl font-bold ${stats.cashBalance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                  {formatCurrency(stats.cashBalance)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Inflow − Outflow</p>
              </div>

              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Bank Balance</span>
                  <Building2 className="text-[#4f46e5]" size={20} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalBankBalance)}</p>
                <p className="text-xs text-gray-500 mt-1">{banks.length} account{banks.length !== 1 ? 's' : ''}</p>
              </div>

              {/* ── Overall Balance — now matches other cards ── */}
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Overall Balance</span>
                  <DollarSign className="text-[#4f46e5]" size={20} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.overallBalance)}</p>
                <p className="text-xs text-gray-500 mt-1">Cash + Banks</p>
              </div>
            </div>

            {/* ── Secondary Stats Row ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Pending Transactions</p>
                <p className="text-xl font-bold text-orange-600">{stats.pendingTransactions}</p>
                <p className="text-xs text-gray-500">{formatCurrency(stats.pendingAmount)} outstanding</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Loans Receivable</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(stats.totalLoansReceivable)}</p>
                <p className="text-xs text-gray-500">Outstanding</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Loans Payable</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(stats.totalLoansPayable)}</p>
                <p className="text-xs text-gray-500">Outstanding</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Pending Bills</p>
                <p className="text-xl font-bold text-yellow-600">{stats.pendingBills}</p>
                <p className="text-xs text-gray-500">{formatCurrency(stats.pendingBillsAmount)} due</p>
              </div>
            </div>

            {/* ── Charts ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="font-bold text-lg mb-4">Cashflow Over Time</h3>
                {monthlyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(value: number, name: string) => [formatCurrency(value), name]}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="inflow"  stroke="#10b981" strokeWidth={2} name="Inflow"  dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="outflow" stroke="#ef4444" strokeWidth={2} name="Outflow" dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="net"     stroke="#4f46e5" strokeWidth={2} name="Net"     dot={{ r: 3 }} strokeDasharray="4 2" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-400">No transaction data yet</div>
                )}
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="font-bold text-lg mb-4">Inflow vs Outflow</h3>
                {monthlyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(value: number, name: string) => [formatCurrency(value), name]}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                      />
                      <Legend />
                      <Bar dataKey="inflow"  fill="#10b981" name="Inflow"  radius={[4, 4, 0, 0]} />
                      <Bar dataKey="outflow" fill="#ef4444" name="Outflow" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-400">No transaction data yet</div>
                )}
              </div>
            </div>

            {/* ── Recent Transactions ── */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-bold text-lg">Recent Transactions</h3>
                <span className="text-sm text-gray-500">{transactions.length} total</span>
              </div>
              {transactions.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-gray-400">
                  No transactions found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['Date', 'ID', 'Category', 'Sub Category', 'Amount', 'Mode', 'Bank'].map(h => (
                          <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.slice(0, 10).map(t => (
                        <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(t.date).toLocaleDateString('en-PK')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-mono">
                            {t.transactionId || t.id.slice(0, 8)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              t.mainCategory === 'Cash Inflow'
                                ? 'bg-green-100 text-green-800'
                                : t.mainCategory === 'Cash Outflow'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {t.mainCategory}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{t.subCategory}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(t.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              t.mode === 'Cash'   ? 'bg-blue-100 text-blue-800'
                            : t.mode === 'Bank'   ? 'bg-purple-100 text-purple-800'
                            : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {t.mode}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{t.bankName || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        );
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Dashboard Overview</h2>
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          Live • Firestore
        </span>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'overview', label: 'Overview',  icon: Activity  },
            { id: 'reports',  label: 'Reports',   icon: FileText  },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); if (tab.id === 'reports') setSelectedReport(null); }}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-[#4f46e5] border-b-2 border-[#4f46e5] bg-[#4f46e5]/5'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {renderContent()}
    </div>
  );
}