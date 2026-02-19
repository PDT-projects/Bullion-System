// Inventory Module - View Layer
// InventoryDashboardView - Main entry page for inventory operations

import { Plus, Package, ArrowRight } from 'lucide-react';

/**
 * Props for InventoryDashboardView
 */
interface InventoryDashboardViewProps {
  onAddNewInventory: () => void;
  onAddToExisting: () => void;
  onViewReceivable: () => void;
  onViewInventory: () => void;
}

/**
 * InventoryDashboardView - Dumb component for inventory entry dashboard
 */
export function InventoryDashboardView({
  onAddNewInventory,
  onAddToExisting,
  onViewReceivable,
  onViewInventory
}: InventoryDashboardViewProps) {
  const cards = [
    {
      title: 'Add New Inventory',
      description: 'Create a new product entry with optional costing information',
      icon: Plus,
      color: 'blue',
      onClick: onAddNewInventory
    },
    {
      title: 'Add to Existing Inventory',
      description: 'Add more units to an existing product in inventory',
      icon: Package,
      color: 'green',
      onClick: onAddToExisting
    },
    {
      title: 'Receivable Stock',
      description: 'View shipments on the way but not yet received',
      icon: Package,
      color: 'orange',
      onClick: onViewReceivable
    },
    {
      title: 'View Inventory',
      description: 'View existing inventory items',
      icon: Package,
      color: 'purple',
      onClick: onViewInventory
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: { [key: string]: { bg: string; hover: string; icon: string } } = {
      blue: { 
        bg: 'bg-gray-100 border-gray-200', 
        hover: 'hover:bg-blue-600 hover:text-white hover:border-blue-500',
        icon: 'text-blue-600 group-hover:text-white'
      },
      green: { 
        bg: 'bg-gray-100 border-gray-200', 
        hover: 'hover:bg-green-600 hover:text-white hover:border-green-500',
        icon: 'text-green-600 group-hover:text-white'
      },
      orange: { 
        bg: 'bg-gray-100 border-gray-200', 
        hover: 'hover:bg-orange-600 hover:text-white hover:border-orange-500',
        icon: 'text-orange-600 group-hover:text-white'
      },
      purple: { 
        bg: 'bg-gray-100 border-gray-200', 
        hover: 'hover:bg-purple-600 hover:text-white hover:border-purple-500',
        icon: 'text-purple-600 group-hover:text-white'
      }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight mb-2">
                Inventory Entry
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Smart inventory intake flow with conditional costing and payment tracking
              </p>
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-16">
          <h3 className="text-3xl font-bold text-slate-950 mt-8 mb-12">
            What type of inventory entry?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {cards.map((card, index) => {
              const colors = getColorClasses(card.color);
              const Icon = card.icon;
              
              return (
                <button
                  key={index}
                  onClick={card.onClick}
                  className={`group p-6 border-2 rounded-lg transition-all duration-200 text-left ${colors.bg} ${colors.hover}`}
                >
                  <div className="flex items-center mb-3">
                    <Icon className={`w-8 h-8 mr-3 transition-colors ${colors.icon}`} />
                    <h4 className="text-lg font-medium">{card.title}</h4>
                  </div>
                  <p className="text-gray-600 group-hover:text-white/90 transition-colors">
                    {card.description}
                  </p>
                  <div className="mt-4 flex items-center text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
