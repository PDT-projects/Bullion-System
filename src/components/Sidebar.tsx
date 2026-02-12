import { useState, useEffect } from 'react';
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
  Percent,
  Calculator,
  Database
} from 'lucide-react';

type MenuItem = {
  id: string;
  name: string;
  icon?: any;
  children?: MenuItem[];
};

type SidebarProps = {
  activeModule: string;
  setActiveModule: (id: string) => void;
};

export function Sidebar({ activeModule, setActiveModule }: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['finance', 'operations']);

  const sectionChildren: { [key: string]: string[] } = {
    operations: ['employees', 'inventory-entry', 'invoices', 'product-transfer'],
    finance: ['transaction-menu', 'banking-menu', 'budgets', 'transactions', 'pending-payments', 'bills', 'salary', 'banks', 'bank-transfers', 'cash-in-hand'],
    loans: ['loans-payable', 'loans-receivable', 'loans']
  };

  useEffect(() => {
    setExpandedSections(prev => {
      const sectionsToExpand: string[] = [...prev]; // preserve existing
      Object.entries(sectionChildren).forEach(([section, children]) => {
        if (children.includes(activeModule) && !sectionsToExpand.includes(section)) {
          sectionsToExpand.push(section);
        }
      });
      return [...new Set(sectionsToExpand)];
    });
  }, [activeModule]);

  const menuItems: MenuItem[] = [
    {
      id: 'firestore-test',
      name: 'Firestore Test',
      icon: Database
    },
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
        { id: 'inventory-entry', name: 'Inventory Entry', icon: Package },
        { id: 'invoices', name: 'Invoices', icon: FileText },
      { id: 'product-transfer', name: 'Product Transfer', icon: ArrowLeftRight }

      ]
    },
    {
      id: 'finance',
      name: 'Finance',
      icon: Banknote,
      children: [
        {
          id: 'transaction-menu',
          name: 'Transactions',
          icon: Receipt,
          children: [
            { id: 'transactions', name: 'Add Transaction', icon: Receipt },
            { id: 'pending-payments', name: 'Pending Payments', icon: CreditCard },
            { id: 'bills', name: 'Bills', icon: Zap },
            { id: 'salary', name: 'Salary', icon: UserCheck }
          ]
        },
        {
          id: 'banking-menu',
          name: 'Banking',
          icon: Building2,
          children: [
            { id: 'banks', name: 'Bank Balances', icon: Building2 },
            { id: 'bank-transfers', name: 'Bank Transfers', icon: ArrowLeftRight },
            { id: 'cash-in-hand', name: 'Cash in Hand', icon: Wallet }
          ]
        },
        { id: 'budgets', name: 'Budgets', icon: PieChart }
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
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-xl text-[#4f46e5]">ERP System</h1>
          <p className="text-sm text-gray-600">Pakistan Detectors</p>
        </div>
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
                    const childHasChildren = child.children && child.children.length > 0;
                    const childIsExpanded = expandedSections.includes(child.id);

                    return (
                      <div key={child.id}>
                        <button
                          onClick={() => handleMenuClick(child.id, childHasChildren ?? false)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm ${
                            activeModule === child.id && !childHasChildren
                              ? 'bg-[#4f46e5] text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {ChildIcon && <ChildIcon size={16} />}
                            <span>{child.name}</span>
                          </div>
                          {childHasChildren && (
                            childIsExpanded ? (
                              <ChevronDown size={14} className="text-gray-500" />
                            ) : (
                              <ChevronRight size={14} className="text-gray-500" />
                            )
                          )}
                        </button>

                        {childHasChildren && childIsExpanded && (
                          <div className="ml-4 mt-1 space-y-1">
                            {child.children?.map((grandChild) => {
                              const GrandChildIcon = grandChild.icon;
                              return (
                                <button
                                  key={grandChild.id}
                                  onClick={() => setActiveModule(grandChild.id)}
                                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                                    activeModule === grandChild.id
                                      ? 'bg-[#4f46e5] text-white'
                                      : 'text-gray-600 hover:bg-gray-100'
                                  }`}
                                >
                                  {GrandChildIcon && <GrandChildIcon size={14} />}
                                  <span>{grandChild.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
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