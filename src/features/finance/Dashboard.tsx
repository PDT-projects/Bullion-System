// Dashboard.tsx
// Fully wired to real Firestore data via useDashboardData hook.
// No more hardcoded/mock chart data — all numbers come from live collections.
// Permission-aware: if user lacks 'Dashboard' permission, Overview tab is hidden
// and Reports tab is shown directly.
//
// UPDATED: Reports tab now delegates entirely to <ReportsHub>.
// To add/edit/remove any report, edit ReportsHub.tsx only.

import { useState, useEffect } from 'react';
import { useUserPermissions } from '../../modules/user-management/hooks/useUserPermissions';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, TrendingDown, Wallet, Building2, DollarSign,
  Activity, FileText, Package, Users, Receipt, AlertCircle,
  RefreshCw, Loader2, BarChart2
} from 'lucide-react';

import { useDashboardData } from './UseDashboardData';
import { ReportsHub }       from './ReportsHub';   // ← single source of truth

// ─────────────────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency', currency: 'PKR', minimumFractionDigits: 0
  }).format(amount);

// ─────────────────────────────────────────────────────────────────────────────

export function Dashboard() {
  const { hasPermission, hasAnyReportPermission, isLoading: permissionsLoading } = useUserPermissions();

  const canViewOverview = hasPermission('Dashboard');

  const [activeTab, setActiveTab] = useState<string | null>(null);

  useEffect(() => {
    if (!permissionsLoading) {
      setActiveTab(prev => prev === null ? (canViewOverview ? 'overview' : 'reports') : prev);
    }
  }, [permissionsLoading, canViewOverview]);

  const {
    transactions, banks, loans, invoices, commissions, products,
    loading, error, refresh,
    stats, monthlyChartData,
  } = useDashboardData();

  // ── Wait for permissions to resolve ────────────────────────────────────────
  if (permissionsLoading || activeTab === null) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 size={40} className="animate-spin text-[#4f46e5]" />
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    );
  }

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

  // ── Tabs config ─────────────────────────────────────────────────────────────
  const tabs = [
    ...(canViewOverview      ? [{ id: 'overview', label: 'Overview', icon: Activity  }] : []),
    ...(hasAnyReportPermission ? [{ id: 'reports',  label: 'Reports',  icon: FileText }] : []),
  ];

  // ── Render content by tab ───────────────────────────────────────────────────
  const renderContent = () => {
    switch (activeTab) {

      // ── REPORTS TAB — fully delegated to ReportsHub ──────────────────────────
      case 'reports':
        return (
          <ReportsHub
            transactions={transactions}
            banks={banks}
            loans={loans}
            invoices={invoices}
            commissions={commissions}
            products={products}
            backLabel="← Back to Reports Hub"
          />
        );

      // ── OVERVIEW TAB ─────────────────────────────────────────────────────────
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

  // If user has no accessible tabs at all
  if (tabs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-400">
        <BarChart2 size={48} className="opacity-30" />
        <p className="text-lg font-medium">No access</p>
        <p className="text-sm">Contact your administrator to request access.</p>
      </div>
    );
  }

  return (
    <div className="p-6">

      {/* Tabs */}
      {tabs.length > 1 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
      )}

      {renderContent()}
    </div>
  );
}