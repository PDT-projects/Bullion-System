import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ChevronDown,
  ChevronRight,
  Users,
  Package,
  Banknote,
  Building2,
  FileText,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  PlusCircle,
  Clock,
  FileTextIcon,
  DollarSign,
  ArrowRightLeft,
  HandCoins,
  Percent,
  Calculator,
  UserCheck,
} from 'lucide-react';

import { useAuth } from '../providers/context/AuthContext';

// Map each screen name to its permission key (must match EXACT Screen type in userService.ts)
const SCREEN_PERMISSIONS: Record<string, Screen> = {
  'dashboard': 'Dashboard',
  'add-transaction': 'Add Transaction',
  'pending-payment': 'Pending Payments',
  'bills': 'Bills List',
  'salary': 'Salary Dashboard',
  'banking-overview': 'Banking Dashboard',
  'bank-accounts': 'Bank Accounts List',
  'transfers': 'Bank Transfers List',
  'cash-in-hand': 'Cash List',
  'budgets': 'Budgets List',
  'employees': 'Employees List',
  'product-transfer': 'Product Transfer List',
  'inventory-entry': 'Inventory Dashboard',
  'invoices': 'Invoices List',
  'all-loans': 'Loans Dashboard',
  'payable': 'Loans Payable',
  'receivable': 'Loans Receivable',
  'commission-overview': 'Commission Slabs',
  'commission-slabs': 'Commission Slabs',
  'commission-calculate': 'Commission Calculation',
  'commission-reports': 'Commission Reports',
  'user-management': 'User Management',
} as const;

import type { Screen } from '../modules/user-management/models/userService';

export function Sidebar() {
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'finance', 'operations', 'transaction', 'banking', 'loans', 'commission'
  ]);

  const { role, permissions } = useAuth();
  const location = useLocation();

  // Check if a menu item id is allowed for current user
  const canSee = (id: string): boolean => {
    if (role === 'super_admin') return true;
    const requiredScreen = SCREEN_PERMISSIONS[id];
    if (!requiredScreen) return true; // section headers (Finance, Operations) always show if they have visible children
    return permissions.includes(requiredScreen);
  };

  // Check if a section has at least one visible child (so we don't show empty sections)
  const sectionHasVisibleChildren = (children: any[]): boolean => {
    return children.some((child) => {
      if (child.children) return sectionHasVisibleChildren(child.children);
      return canSee(child.id) || !SCREEN_PERMISSIONS[child.id]; // Show section headers always
    });
  };

  const toggleSection = (id: string) => {
    setExpandedSections(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const menuItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
    },
    {
      id: 'finance',
      name: 'Finance',
      icon: Wallet,
      children: [
        {
          id: 'transaction',
          name: 'Transaction',
          icon: ArrowLeftRight,
          children: [
            { id: 'add-transaction', name: 'Add Transaction', icon: PlusCircle, path: '/transactions' },
            { id: 'pending-payment', name: 'Pending Payment', icon: Clock, path: '/transactions/pending' },
            { id: 'bills', name: 'Bills', icon: FileTextIcon, path: '/bills' },
            { id: 'salary', name: 'Salary', icon: DollarSign, path: '/salary' },
          ],
        },
        {
          id: 'banking',
          name: 'Banking',
          icon: Building2,
          children: [
            { id: 'banking-overview', name: 'Overview', icon: FileText, path: '/banking' },
            { id: 'bank-accounts', name: 'Bank Accounts', icon: Building2, path: '/banking/banks' },
            { id: 'transfers', name: 'Bank Transfers', icon: ArrowRightLeft, path: '/banking/transfers' },
            { id: 'cash-in-hand', name: 'Cash in Hand', icon: Wallet, path: '/banking/cash' },
          ],
        },
        { id: 'budgets', name: 'Budgets', icon: Banknote, path: '/budgets' },
      ],
    },
    {
      id: 'operations',
      name: 'Operations',
      icon: Package,
      children: [
        { id: 'employees', name: 'Employees', icon: Users, path: '/employees' },
        { id: 'product-transfer', name: 'Product Transfer', icon: Package, path: '/product-transfer' },
        { id: 'inventory-entry', name: 'Inventory Entry', icon: Package, path: '/inventory' },
        { id: 'invoices', name: 'Invoices', icon: FileText, path: '/invoices' },
      ],
    },
    {
      id: 'loans',
      name: 'Loans',
      icon: HandCoins,
      children: [
        { id: 'all-loans', name: 'All Loans', icon: FileText, path: '/loans' },
        { id: 'payable', name: 'Payable', icon: TrendingDown, path: '/loans/payable' },
        { id: 'receivable', name: 'Receivable', icon: TrendingUp, path: '/loans/receivable' },
      ],
    },
    {
      id: 'commission',
      name: 'Commission',
      icon: Percent,
      children: [
        { id: 'commission-overview', name: 'Overview', icon: FileText, path: '/commission' },
        { id: 'commission-slabs', name: 'Commission Slabs', icon: Percent, path: '/commission/slabs' },
        { id: 'commission-calculate', name: 'Calculate Commission', icon: Calculator, path: '/commission/calculate' },
        { id: 'commission-reports', name: 'Commission Reports', icon: TrendingUp, path: '/commission/reports' },
      ],
    },
    {
      id: 'user-management',
      name: 'User Management',
      icon: UserCheck,
      path: '/user-management',
      superAdminOnly: true,
    },
  ];

  const renderNestedChildren = (children: any[]) => {
    const visibleChildren = children.filter(c => canSee(c.id));
    if (visibleChildren.length === 0) return null;

    return visibleChildren.map((nestedChild) => (
      <NavLink
        key={nestedChild.id}
        to={nestedChild.path || '#'}
        className={({ isActive }) =>
          `w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
            isActive ? 'bg-[#4f46e5] text-white' : 'text-gray-600 hover:bg-gray-100'
          }`
        }
      >
        {nestedChild.icon && <nestedChild.icon size={14} />}
        <span>{nestedChild.name}</span>
      </NavLink>
    ));
  };

  const renderChildren = (children: any[]) => {
    return children.map((child) => {
      const ChildIcon = child.icon;
      const hasNestedChildren = child.children && child.children.length > 0;

      if (hasNestedChildren) {
        // Only show this sub-section if it has visible children
        if (!sectionHasVisibleChildren(child.children)) return null;

        return (
          <div key={child.id} className="mb-1">
            <button
              onClick={() => toggleSection(child.id)}
              className="w-full flex items-center justify-between px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
            >
              <div className="flex items-center gap-3">
                {ChildIcon && <ChildIcon size={16} />}
                <span>{child.name}</span>
              </div>
              {expandedSections.includes(child.id)
                ? <ChevronDown size={14} />
                : <ChevronRight size={14} />}
            </button>

            {expandedSections.includes(child.id) && (
              <div className="ml-4 mt-1 space-y-1">
                {renderNestedChildren(child.children)}
              </div>
            )}
          </div>
        );
      }

      // Regular child — check permission
      if (!canSee(child.id)) return null;

      return (
        <NavLink
          key={child.id}
          to={child.path || '#'}
          className={({ isActive }) =>
            `w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
              isActive ? 'bg-[#4f46e5] text-white' : 'text-gray-600 hover:bg-gray-100'
            }`
          }
        >
          {ChildIcon && <ChildIcon size={16} />}
          <span>{child.name}</span>
        </NavLink>
      );
    });
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-6 border-b border-gray-200">
        <h1 className="font-bold text-xl text-[#4f46e5]">Pakistan Detector Technologies</h1>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = item.children && item.children.length > 0;

          // Super admin only items
          if (item.superAdminOnly && role !== 'super_admin') return null;

          // Top-level direct link (Dashboard)
          if (!hasChildren && item.path) {
            if (!canSee(item.id)) return null;
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors mb-1 ${
                    isActive ? 'bg-[#4f46e5] text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                {Icon && <Icon size={18} />}
                <span className="font-medium text-sm">{item.name}</span>
              </NavLink>
            );
          }

          // Section with children — hide if no visible children
          if (hasChildren && !sectionHasVisibleChildren(item.children!)) return null;

          return (
            <div key={item.id} className="mb-1">
              <button
                onClick={() => toggleSection(item.id)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {Icon && <Icon size={18} />}
                  <span className="font-medium text-sm">{item.name}</span>
                </div>
                {expandedSections.includes(item.id)
                  ? <ChevronDown size={16} />
                  : <ChevronRight size={16} />}
              </button>

              {expandedSections.includes(item.id) && (
                <div className="ml-4 mt-1 space-y-1">
                  {renderChildren(item.children!)}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}