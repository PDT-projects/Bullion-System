// ReportsPage.tsx
// Standalone reports hub — accessible to users who have report permissions
// but may NOT have Dashboard access. Lives at /reports route.

import { useState } from 'react';
import {
  TrendingUp, DollarSign, FileText, Package, Receipt,
  Users, CreditCard, Building2, Activity, Loader2, BarChart2
} from 'lucide-react';
import { useUserPermissions } from '../../modules/user-management/hooks/useUserPermissions';
import type { Screen } from '../../modules/user-management/models/userService';

// ── Lazy imports — same as Dashboard uses ────────────────────────────────────
import { SalesReport }              from '../sales/SalesReport';
import { ExpensesReport }           from './ExpensesReport';
import { BankBalanceReport }        from './BankBalanceReport';
import { SalariesReport }           from './SalariesReport';
import { FixedBillsReport }         from './FixedBillsReport';
import { InventoryReport }          from '../../features/inventory/InventoryReport';
import { ProductTransferReport }    from '../inventory/ProductTransferReport';
import { TransactionHistoryReport } from './TransactionHistoryReport';
import { ReferralReport }           from '../sales/ReferralReport';
import { CommissionReport }         from '../sales/CommissionReport';
import { ProfitLossReport }         from './ProfitLossReport';
import { BalanceSheetReport }       from './BalanceSheetReport';
import { LoanHistory }              from './LoanHistory';

import { useDashboardData } from './UseDashboardData';

// ─────────────────────────────────────────────────────────────────────────────

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

const ALL_REPORT_CARDS = [
  { id: 'sales',            name: 'Sales Report',               description: 'Sales performance, revenue trends, and customer analytics',  icon: TrendingUp,  color: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-50',  text: 'text-indigo-700',  tag: 'Revenue & Analytics'   },
  { id: 'profit-loss',      name: 'Profit & Loss',              description: 'Revenue, expenses, and net profit calculations',              icon: DollarSign,  color: 'from-gray-500 to-gray-600',    bg: 'bg-gray-50',    text: 'text-gray-700',    tag: 'Financial Analysis'    },
  { id: 'balance-sheet',    name: 'Balance Sheet',              description: 'Assets, liabilities, and equity statement',                  icon: FileText,    color: 'from-blue-500 to-blue-600',    bg: 'bg-blue-50',    text: 'text-blue-700',    tag: 'Financial Position'   },
  { id: 'inventory',        name: 'Inventory Report',           description: 'Stock levels, product distribution, and inventory value',    icon: Package,     color: 'from-purple-500 to-purple-600',bg: 'bg-purple-50',  text: 'text-purple-700',  tag: 'Stock Management'     },
  { id: 'transactions',     name: 'Transaction History',        description: 'Detailed transaction history with filtering and export',     icon: Receipt,     color: 'from-indigo-500 to-indigo-600',bg: 'bg-indigo-50',  text: 'text-indigo-700',  tag: 'Detailed History'     },
  { id: 'referral',         name: 'Referral Report',            description: 'Track referral performance and earnings',                    icon: Users,       color: 'from-pink-500 to-pink-600',    bg: 'bg-pink-50',    text: 'text-pink-700',    tag: 'Referral Network'     },
  { id: 'commission',       name: 'Commission Report',          description: 'Salesperson commissions and performance metrics',            icon: CreditCard,  color: 'from-orange-500 to-orange-600',bg: 'bg-orange-50',  text: 'text-orange-700',  tag: 'Performance Bonus'    },
  { id: 'expenses',         name: 'Expenses Report',            description: 'All expenses, categories, and spending analysis',            icon: Receipt,     color: 'from-gray-200 to-gray-100',    bg: 'bg-white',      text: 'text-black',       tag: 'Spending Analysis'    },
  { id: 'bank-balance',     name: 'Bank Balance Report',        description: 'Bank accounts, balances, and transaction history',          icon: Building2,   color: 'from-gray-200 to-gray-100',    bg: 'bg-white',      text: 'text-black',       tag: 'Banking'              },
  { id: 'salaries',         name: 'Salaries Report',            description: 'Employee salaries, payments, and payroll summary',          icon: Users,       color: 'from-gray-200 to-gray-100',    bg: 'bg-white',      text: 'text-black',       tag: 'Payroll'              },
  { id: 'fixed-bills',      name: 'Fixed Bills Report',         description: 'Recurring bills, due dates, and payment status',            icon: FileText,    color: 'from-purple-500 to-purple-600',bg: 'bg-purple-50',  text: 'text-purple-700',  tag: 'Recurring Expenses'  },
  { id: 'product-transfer', name: 'Product Transfer Report',    description: 'Inventory changes, audits, and stock adjustments',          icon: FileText,    color: 'from-slate-500 to-slate-600',  bg: 'bg-slate-50',   text: 'text-slate-700',   tag: 'Audit Trail'          },
  { id: 'loan-history',     name: 'Loan History',               description: 'Loan transactions, payments, and outstanding balances',     icon: DollarSign,  color: 'from-gray-500 to-gray-600',    bg: 'bg-gray-50',    text: 'text-gray-700',    tag: 'Loan Tracking'        },
];

// ─────────────────────────────────────────────────────────────────────────────

export function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const { hasPermission } = useUserPermissions();
  const { transactions, banks, loans, invoices, commissions, products, loading } = useDashboardData();

  // Filter to only reports the user can access
  const accessibleCards = ALL_REPORT_CARDS.filter(card => {
    const screen = screenMap[card.id];
    return screen ? hasPermission(screen) : false;
  });

  const renderReport = () => {
    switch (selectedReport) {
      case 'sales':           return <SalesReport invoices={invoices} products={products} />;
      case 'profit-loss':     return <ProfitLossReport transactions={transactions} onBack={() => setSelectedReport(null)} />;
      case 'balance-sheet':   return <BalanceSheetReport transactions={transactions} banks={banks} loans={loans} products={products} onBack={() => setSelectedReport(null)} />;
      case 'inventory':       return <InventoryReport products={products} />;
      case 'transactions':    return <TransactionHistoryReport transactions={transactions} />;
      case 'referral':        return <ReferralReport invoices={invoices} />;
      case 'commission':      return <CommissionReport commissions={commissions} />;
      case 'expenses':        return <ExpensesReport />;
      case 'bank-balance':    return <BankBalanceReport />;
      case 'salaries':        return <SalariesReport />;
      case 'fixed-bills':     return <FixedBillsReport />;
      case 'product-transfer':return <ProductTransferReport transferLogs={[]} />;
      case 'loan-history':    return <LoanHistory loans={loans} />;
      default:                return null;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 size={40} className="animate-spin text-[#4f46e5]" />
        <p className="text-gray-500 text-lg">Loading reports…</p>
      </div>
    );
  }

  // ── Report detail view ──────────────────────────────────────────────────
  if (selectedReport) {
    const card = accessibleCards.find(c => c.id === selectedReport);
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{card?.name ?? selectedReport}</h2>
          <button
            onClick={() => setSelectedReport(null)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ← Back to Reports
          </button>
        </div>
        {renderReport()}
      </div>
    );
  }

  // ── Reports hub grid ────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports Hub</h2>
          <p className="text-sm text-gray-500 mt-1">Select a report to view live data</p>
        </div>
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1.5">
          <Activity size={12} /> Live · Firestore
        </span>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Available Reports', value: accessibleCards.length, icon: FileText },
          { label: 'Transactions',      value: transactions.length,    icon: Receipt  },
          { label: 'Products',          value: products.length,        icon: Package  },
          { label: 'Live Data',         value: 'Yes',                  icon: Activity },
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

      {/* Report cards */}
      {accessibleCards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <BarChart2 size={48} className="opacity-30" />
          <p className="text-lg font-medium">No reports available</p>
          <p className="text-sm">Contact your administrator to request report access.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accessibleCards.map((card, i) => (
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
      )}

      <div className="text-center py-4">
        <span className="text-sm text-gray-400 flex items-center justify-center gap-2">
          <Activity size={14} /> All reports powered by live Firestore data
        </span>
      </div>
    </div>
  );
}