import { useState } from 'react';
import {
  LayoutDashboard,
  ChevronDown,
  ChevronRight,
  Users,
  Package,
  Banknote,
  Building2,
  FileText,
  Receipt,
  ArrowLeftRight,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  CreditCard,
  Zap,
  FileSpreadsheet,
  UserCheck,
  PieChart,
  UserPlus,
  Percent
} from 'lucide-react';

type MenuItem = {
  id: string;
  name: string;
  icon?: any;
  children?: { id: string; name: string; icon?: any }[];
};

type SidebarProps = {
  activeModule: string;
  setActiveModule: (id: string) => void;
};

export function Sidebar({ activeModule, setActiveModule }: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['finance', 'operations', 'reports']);

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      id: 'operations',
      name: 'Operations',
      icon: Package,
      children: [
        { id: 'employees', name: 'Employees', icon: Users },
        { id: 'products', name: 'Products / Inventory', icon: Package },
        { id: 'product-costing', name: 'Product Costing', icon: DollarSign },
        { id: 'commission-slabs', name: 'Commission Slabs', icon: Percent },
        { id: 'invoices', name: 'Invoices', icon: FileText },
      { id: 'product-transfer', name: 'Product Transfer', icon: ArrowLeftRight }

      ]
    },
    {
      id: 'finance',
      name: 'Finance',
      icon: Banknote,
      children: [
        { id: 'transactions', name: 'Transactions', icon: Receipt },
        { id: 'pending-payments', name: 'Pending Payments', icon: CreditCard },
        { id: 'bills', name: 'Bills', icon: Zap },
        { id: 'salary', name: 'Salary', icon: UserCheck },
        { id: 'advance-salary', name: 'Advance Salary', icon: DollarSign }
      ]
    },
    {
      id: 'loans',
      name: 'Loans & Advances',
      icon: CreditCard,
      children: [
        { id: 'loans-payable', name: 'Payable', icon: TrendingDown },
        { id: 'loans-receivable', name: 'Receivable', icon: TrendingUp },
        { id: 'loans', name: 'All Loans', icon: Banknote }
      ]
    },
    {
      id: 'banking',
      name: 'Banking',
      icon: Building2,
      children: [
        { id: 'banks', name: 'Bank Balances', icon: Building2 },
        { id: 'bank-transfers', name: 'Bank Transfers', icon: ArrowLeftRight },
        { id: 'cash-in-hand', name: 'Cash in Hand', icon: Wallet }
      ]
    },
    {
      id: 'reports',
      name: 'Reports & History',
      icon: BarChart3,
      children: [
        { id: 'sales-report', name: 'Sales Report', icon: PieChart },
        { id: 'referral-report', name: 'Referral Report', icon: UserPlus },
        { id: 'inventory-report', name: 'Inventory Report', icon: Package },
        { id: 'transaction-history-report', name: 'Transaction History Report', icon: FileSpreadsheet },
        { id: 'transaction-history', name: 'Transaction History', icon: Receipt },
        { id: 'loan-history', name: 'Loan History', icon: Banknote },
        { id: 'transfer-history', name: 'Transfer History', icon: ArrowLeftRight }
      ]
    }
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleMenuClick = (itemId: string, hasChildren: boolean) => {
    if (hasChildren) {
      toggleSection(itemId);
    } else {
      setActiveModule(itemId);
    }
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-6 border-b border-gray-200">
        <h1 className="font-bold text-xl text-[#4f46e5]">ERP System</h1>
        <p className="text-sm text-gray-600 mt-1">Pakistan Detectors</p>
      </div>
      
      <nav className="flex-1 p-4 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isExpanded = expandedSections.includes(item.id);
          const hasChildren = item.children && item.children.length > 0;

          return (
            <div key={item.id} className="mb-1">
              <button
                onClick={() => handleMenuClick(item.id, hasChildren ?? false)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                  activeModule === item.id && !hasChildren
                    ? 'bg-[#4f46e5] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  {Icon && <Icon size={18} />}
                  <span className="font-medium text-sm">{item.name}</span>
                </div>
                {hasChildren && (
                  isExpanded ? (
                    <ChevronDown size={16} className="text-gray-500" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-500" />
                  )
                )}
              </button>

              {hasChildren && isExpanded && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.children?.map((child) => {
                    const ChildIcon = child.icon;
                    return (
                      <button
                        key={child.id}
                        onClick={() => setActiveModule(child.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                          activeModule === child.id
                            ? 'bg-[#4f46e5] text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {ChildIcon && <ChildIcon size={16} />}
                        <span>{child.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#4f46e5] rounded-full flex items-center justify-center text-white text-sm font-medium">
            A
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Admin User</p>
            <p className="text-xs text-gray-600">admin@pdt.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}