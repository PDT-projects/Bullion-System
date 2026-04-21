// Dashboard.tsx
// Fully wired to real Firestore data via useDashboardData hook.
// No more hardcoded/mock chart data — all numbers come from live collections.
// Permission-aware: if user lacks 'Dashboard' permission, Overview tab is hidden
// and Reports tab is shown directly.

import { useState, useEffect } from 'react';
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

import { SalesReport }               from '../sales/SalesReport';
import { ExpensesReport }            from './ExpensesReport';
import { BankBalanceReport }         from './BankBalanceReport';
import { SalariesReport }            from './SalariesReport';
import { FixedBillsReport }          from './FixedBillsReport';
import { InventoryReport }           from '../../features/inventory/InventoryReport';
import { ProductTransferReport }     from '../inventory/ProductTransferReport';
import { TransactionHistoryReport }  from './TransactionHistoryReport';
import { ReferralReport }            from '../sales/ReferralReport';
import { CommissionReport }          from '../sales/CommissionReport';
import { ProfitLossReport }          from './ProfitLossReport';
import { BalanceSheetReport }        from './BalanceSheetReport';
import { LoanHistory }               from './LoanHistory';

// ─────────────────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency', currency: 'PKR', minimumFractionDigits: 0
  }).format(amount);

// ─────────────────────────────────────────────────────────────────────────────

export function Dashboard() {
  const { hasPermission, hasAnyReportPermission, isLoading: permissionsLoading } = useUserPermissions();

  const canViewOverview = hasPermission('Dashboard');

  // Initialize to null — wait for permissions to load before setting the tab
  // This prevents the race condition where userData is null on first render
  // and canViewOverview incorrectly returns false, defaulting to 'reports'.
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  // Set correct tab once permissions have finished loading from localStorage
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

  // ── Wait for permissions to resolve before rendering ───────────────────
  if (permissionsLoading || activeTab === null) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 size={40} className="animate-spin text-[#4f46e5]" />
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    );
  }

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
    'sales':            'Sales Report',
    'profit-loss':      'Profit Loss Report',
    'balance-sheet':    'Balance Sheet Report',
    'inventory':        'Inventory Report',
    'transactions':     'Transaction History Report',
    'referral':         'Referral Report',
    'commission':       'Commission Report',
    'expenses':         'Expenses Report',
    'bank-balance':     'Bank Balance Report',
    'salaries':         'Salaries Report',
    'fixed-bills':      'Fixed Bills Report',
    'product-transfer': 'Product Transfer Report',
    'loan-history':     'Loan History',
  };
  
  const filteredReports = [
    { id: 'sales',            name: 'Sales Report',               description: 'Revenue trends, customer analytics & performance',    icon: TrendingUp,  accent: '#4f46e5', lightBg: '#eef2ff', tag: 'Revenue'  },
    { id: 'profit-loss',      name: 'Profit & Loss',              description: 'Net profit, expense breakdowns & margins',            icon: DollarSign,  accent: '#0f766e', lightBg: '#f0fdfa', tag: 'Finance'  },
    { id: 'balance-sheet',    name: 'Balance Sheet',              description: 'Assets, liabilities & equity position',               icon: FileText,    accent: '#2563eb', lightBg: '#eff6ff', tag: 'Finance'  },
    { id: 'inventory',        name: 'Inventory Report',           description: 'Stock levels, distribution & valuation',              icon: Package,     accent: '#7c3aed', lightBg: '#f5f3ff', tag: 'Stock'    },
    { id: 'transactions',     name: 'Transaction History',        description: 'Full ledger with filters & export',                   icon: Receipt,     accent: '#0369a1', lightBg: '#f0f9ff', tag: 'History'  },
    { id: 'referral',         name: 'Referral Report',            description: 'Referral performance & network earnings',             icon: Users,       accent: '#be185d', lightBg: '#fdf2f8', tag: 'Network'  },
    { id: 'commission',       name: 'Commission Report',          description: 'Salesperson bonuses & metrics',                       icon: CreditCard,  accent: '#c2410c', lightBg: '#fff7ed', tag: 'Payroll'  },
    { id: 'expenses',         name: 'Expenses Report',            description: 'Category spending & trend analysis',                  icon: Receipt,     accent: '#374151', lightBg: '#f9fafb', tag: 'Spending' },
    { id: 'bank-balance',     name: 'Bank Balance Report',        description: 'Account balances & transaction logs',                 icon: Building2,   accent: '#1d4ed8', lightBg: '#eff6ff', tag: 'Banking'  },
    { id: 'salaries',         name: 'Salaries Report',            description: 'Payroll summary & employee payments',                 icon: Users,       accent: '#065f46', lightBg: '#ecfdf5', tag: 'HR'       },
    { id: 'fixed-bills',      name: 'Fixed Bills Report',         description: 'Recurring bills, due dates & status',                 icon: FileText,    accent: '#6d28d9', lightBg: '#f5f3ff', tag: 'Expenses' },
    { id: 'product-transfer', name: 'Product Transfer Report',    description: 'Inventory changes & audit trail',                     icon: FileText,    accent: '#475569', lightBg: '#f8fafc', tag: 'Audit'    },
    { id: 'loan-history',     name: 'Loan History',               description: 'Loans, repayments & outstanding balances',            icon: DollarSign,  accent: '#92400e', lightBg: '#fffbeb', tag: 'Loans'    },
  ];

  const reportCards = filteredReports.filter((report: any) => {
    const screen = screenMap[report.id as keyof typeof screenMap];
    if (!screen) return false;
    return hasPermission(screen);
  });

  // ── Tabs config — only show tabs the user is allowed to see ────────────
  const tabs = [
    ...(canViewOverview ? [{ id: 'overview', label: 'Overview', icon: Activity }] : []),
    ...(hasAnyReportPermission ? [{ id: 'reports', label: 'Reports', icon: FileText }] : []),
  ];

  // ── Render content by tab ───────────────────────────────────────────────
  const renderContent = () => {
    switch (activeTab) {

      // ────────────── REPORTS TAB ──────────────────────────────────────────
      case 'reports':
        if (selectedReport) {
          const card = reportCards.find(r => r.id === selectedReport);
          return (
            <div style={{ padding: '4px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <button
                  onClick={() => setSelectedReport(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151' }}
                >
                  ← Back to Reports Hub
                </button>
                {card && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: card.lightBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <card.icon size={16} color={card.accent} />
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{card.name}</span>
                  </div>
                )}
              </div>
              {renderSelectedReport()}
            </div>
          );
        }

        return (
          <div style={{ margin: '0 -24px -24px', backgroundColor: '#f8fafc' }}>

            {/* ── White header band with stat pills ── */}
            <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '24px 32px 28px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', backgroundColor: '#f1f5f9', zIndex: 0 }} />
              <div style={{ position: 'absolute', bottom: -50, right: 110, width: 120, height: 120, borderRadius: '50%', backgroundColor: '#f8fafc', zIndex: 0 }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <BarChart2 size={18} color="#fff" />
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Reports Hub</h2>
                </div>
                <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 20px 0' }}>Select any report below to view live data</p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
                  {[
                    { label: 'Reports Available', value: reportCards.length, icon: FileText },
                    { label: 'Transactions',      value: transactions.length, icon: Receipt  },
                    { label: 'Products',          value: products.length,     icon: Package  },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', backgroundColor: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                      <Icon size={14} color="#4f46e5" />
                      <div>
                        <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>
                        <div style={{ fontSize: 10, color: '#64748b', marginTop: 2, fontWeight: 500 }}>{label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Cards grid ── */}
            <div style={{ padding: '28px 32px' }}>
              {reportCards.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 12 }}>
                  <BarChart2 size={48} color="#d1d5db" />
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#6b7280', margin: 0 }}>No reports available</p>
                  <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Contact your administrator to request report access.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {reportCards.map((card) => {
                    const Icon = card.icon;
                    return (
                      <button
                        key={card.id}
                        onClick={() => setSelectedReport(card.id)}
                        style={{ display: 'flex', flexDirection: 'column', padding: '20px 22px', backgroundColor: '#fff', borderRadius: 14, textAlign: 'left', border: '1px solid #e2e8f0', cursor: 'pointer', width: '100%', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', transition: 'all 0.18s ease' }}
                        onMouseEnter={e => {
                          const el = e.currentTarget;
                          el.style.boxShadow = `0 8px 24px rgba(0,0,0,0.1), 0 0 0 2px ${card.accent}22`;
                          el.style.transform = 'translateY(-2px)';
                          el.style.borderColor = `${card.accent}44`;
                        }}
                        onMouseLeave={e => {
                          const el = e.currentTarget;
                          el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)';
                          el.style.transform = 'translateY(0)';
                          el.style.borderColor = '#e2e8f0';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 11, backgroundColor: card.lightBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon size={22} color={card.accent} />
                          </div>
                          <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700, backgroundColor: card.lightBg, color: card.accent, letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>
                            {card.tag}
                          </span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 5 }}>{card.name}</div>
                          <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.55, margin: 0 }}>{card.description}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 16, fontSize: 12, fontWeight: 600, color: card.accent }}>
                          View Report <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
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

  // If user has no accessible tabs at all, show a neutral message
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

      {/* Tabs — always on top, only rendered when there's more than one option */}
      {tabs.length > 1 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            {tabs.map(tab => (
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
      )}

      {renderContent()}
    </div>
  );
}