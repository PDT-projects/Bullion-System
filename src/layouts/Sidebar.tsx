import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ChevronDown, ChevronRight, Package, FileText,
  DollarSign, Percent, Calculator, TrendingUp, BarChart2,
  ArrowLeftRight, Building2, ArrowRightLeft, Wallet, Activity,
  FilePlus, List,
} from 'lucide-react';

import { useAuth } from '../providers/context/AuthContext';
import { useUserPermissions } from '../modules/user-management/hooks/useUserPermissions';
import type { Screen } from '../modules/user-management/models/userService';

const SCREEN_PERMISSIONS: Record<string, Screen> = {
  'inventory-entry':      'Inventory Dashboard',
  'invoices':             'Invoices List',
  'dummy-invoices':        'Invoices List',
  'salary':               'Salary Dashboard',
  'commission-overview':  'Commission Slabs',
  'commission-slabs':     'Commission Slabs',
  'commission-calculate': 'Commission Calculation',
  'commission-reports':   'Commission Reports',
  'transactions-list':    'Transaction List',
  'banking-overview':     'Banking Dashboard',
  'bank-accounts':        'Bank Accounts List',
  'transfers':            'Bank Transfers List',
  'cash-in-hand':         'Cash List',
  'bank-activity':        'Bank Activity Report',
};

const menuItems = [
  {
    // Transactions is a flat item now (no submenu). The old sub-items
    // "Add Transaction" and "Pending Payments" were removed — creation is
    // handled by the "+ Add Transaction" button in the list view itself,
    // and pending payments are surfaced inline in that same list.
    id: 'transactions-list', name: 'Transactions', icon: ArrowLeftRight, path: '/transactions',
  },
  // Banking module hidden from sidebar
  // {
  //   id: 'banking', name: 'Banking', icon: Building2,
  //   children: [
  //     { id: 'banking-overview', name: 'Overview',        icon: FileText,       path: '/banking' },
  //     { id: 'bank-accounts',    name: 'Bank Accounts',   icon: Building2,      path: '/banking/banks' },
  //     { id: 'transfers',        name: 'Bank Transfers',  icon: ArrowRightLeft, path: '/banking/transfers' },
  //     { id: 'cash-in-hand',     name: 'Cash in Hand',    icon: Wallet,         path: '/banking/cash' },
  //     { id: 'bank-activity',    name: 'Activity Report', icon: Activity,       path: '/banking/activity' },
  //   ],
  // },
  { id: 'inventory-entry', name: 'Inventory', icon: Package, path: '/inventory' },
  {
    id: 'invoices', name: 'Invoices', icon: FileText,
    children: [
      { id: 'invoices',       name: 'All Invoices',      icon: List,     path: '/invoices' },
      { id: 'dummy-invoices', name: 'Dummy Invoices',    icon: FilePlus, path: '/invoices/dummy' },
    ],
  },
  {
    // Payroll umbrella — Salaries + all Commission screens grouped under
    // a single dropdown so the sidebar stays tidy but you can still
    // navigate straight to any sub-screen.
    id: 'payrolls', name: 'Payrolls', icon: DollarSign,
    children: [
      { id: 'salary',               name: 'Salaries',             icon: DollarSign, path: '/salary' },
      { id: 'commission-overview',  name: 'Commission Overview',  icon: FileText,   path: '/commission' },
      { id: 'commission-slabs',     name: 'Commission Slabs',     icon: Percent,    path: '/commission/slabs' },
      { id: 'commission-calculate', name: 'Calculate Commission', icon: Calculator, path: '/commission/calculate' },
      { id: 'commission-reports',   name: 'Commission Reports',   icon: TrendingUp, path: '/commission/reports' },
    ],
  },
];

export function Sidebar() {
  // Both dropdowns start CLOSED — users can expand explicitly.
  const [expanded, setExpanded] = useState<string[]>([]);
  const { role, permissions } = useAuth();
  const { hasAnyReportPermission } = useUserPermissions();

  const canSee = (id: string) =>
    role === 'super_admin' || !SCREEN_PERMISSIONS[id] || permissions.includes(SCREEN_PERMISSIONS[id]);

  const toggle = (id: string) =>
    setExpanded(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const linkClass = "w-full flex items-center gap-4 px-3 py-2 rounded-lg transition-all text-sm font-medium";
  const linkStyle = ({ isActive }: any) => isActive
    ? { background: '#0f172a', color: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.12)' }
    : { color: '#6b7280' };

  return (
    <div className="w-64 bg-white border-r border-gray-100 flex flex-col h-full">
      <div className="p-6 border-b border-gray-100">
        <NavLink to="/dashboard" className="font-bold text-xl text-slate-800 tracking-tight">
          Bullion Electronics
        </NavLink>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto">
        <NavLink to="/dashboard" end
          className="w-full flex items-center gap-4 px-3 py-2.5 rounded-xl transition-all mb-0.5 font-bold text-sm"
          style={linkStyle}>
          <LayoutDashboard size={17} />
          <span>Dashboard</span>
        </NavLink>

        {(role === 'super_admin' || hasAnyReportPermission) && (
          <NavLink to="/reports"
            className="w-full flex items-center gap-4 px-3 py-2.5 rounded-xl transition-all mb-0.5 font-bold text-sm"
            style={linkStyle}>
            <BarChart2 size={17} />
            <span>Reports</span>
          </NavLink>
        )}

        <div className="my-2 mx-1 border-t border-gray-100" />

        {menuItems.map(item => {
          const Icon = item.icon;

          if (!item.children) {
            if (!canSee(item.id)) return null;
            return (
              <NavLink key={item.id} to={item.path}
                className="w-full flex items-center gap-4 px-3 py-2.5 rounded-xl transition-all mb-0.5 font-bold text-sm"
                style={linkStyle}>
                <Icon size={17} />
                <span>{item.name}</span>
              </NavLink>
            );
          }

          const visibleChildren = item.children.filter(c => canSee(c.id));
          if (visibleChildren.length === 0) return null;

          return (
            <div key={item.id} className="mb-0.5">
              <button onClick={() => toggle(item.id)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-xl transition-all">
                <div className="flex items-center gap-4">
                  <Icon size={17} />
                  <span className="font-bold text-sm">{item.name}</span>
                </div>
                {expanded.includes(item.id) ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
              </button>

              {expanded.includes(item.id) && (
                <div className="mt-0.5 space-y-0.5 border-l-2 border-gray-100 pl-3 ml-[22px]">
                  {visibleChildren.map(c => (
                    <NavLink key={c.id} to={c.path} className={linkClass} style={linkStyle}>
                      <c.icon size={14} />
                      <span>{c.name}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}