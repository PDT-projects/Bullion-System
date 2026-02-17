import { useState, useEffect } from 'react';
// 1. Add NavLink and useLocation to your imports
import { Link, NavLink, useLocation } from 'react-router-dom';
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
  CreditCard,
  Zap,
  UserCheck,
  PieChart,
  TrendingUp,
  TrendingDown,
  Wallet
} from 'lucide-react';



// ... (MenuItem type remains the same)

export function Sidebar() {
  const [expandedSections, setExpandedSections] = useState<string[]>(['finance', 'operations']);
  const location = useLocation(); // This tracks what is in the URL bar

  // Helper to check if a link is active (for styling)
  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard' // Add real paths
    },
    {
      id: 'budgets',
      name: 'Budgets',
      icon: Banknote,
      path: '/budgets'
    },
    {
      id: 'operations',
      name: 'Operations',
      icon: Package,
      children: [
        { id: 'employees', name: 'Employees', icon: Users, path: '/employees' }, // Link to /employees
        { id: 'product-transfer', name: 'Product Transfer', icon: Package, path: '/product-transfer' },
        { id: 'inventory-entry', name: 'Inventory Entry', icon: Package, path: '/inventory' },
        { id: 'invoices', name: 'Invoices', icon: FileText, path: '/invoices' },
      ]
    },

    // ... (Keep the rest of your menuItems structure)
  ];


  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-6 border-b border-gray-200">
        <h1 className="font-bold text-xl text-[#4f46e5]">ERP System</h1>
      </div>
      
      <nav className="flex-1 p-4 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = item.children && item.children.length > 0;
          
          // PHASE 1 FIX: Use NavLink for items that have a path (like Dashboard)
          if (!hasChildren && item.path) {
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

          // Render Sections (Operations, Finance)
          return (
            <div key={item.id} className="mb-1">
              <button 
                onClick={() => setExpandedSections(prev => 
                  prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id]
                )}
                className="w-full flex items-center justify-between px-3 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {Icon && <Icon size={18} />}
                  <span className="font-medium text-sm">{item.name}</span>
                </div>
                {expandedSections.includes(item.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              {expandedSections.includes(item.id) && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.children?.map((child) => (
                    <NavLink
                      key={child.id}
                      to={child.path || '#'} // It will look for /employees
                      className={({ isActive }) =>
                        `w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                          isActive ? 'bg-[#4f46e5] text-white' : 'text-gray-600 hover:bg-gray-100'
                        }`
                      }
                    >
                      {child.icon && <child.icon size={16} />}
                      <span>{child.name}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      {/* ... Admin Footer */}
    </div>
  );
}
