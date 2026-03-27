// Inventory Module - View Layer
// InventoryDashboardView - Main entry page for inventory operations

import { Plus, Package, ArrowRight, Boxes, PackagePlus, PackageSearch } from 'lucide-react';

interface InventoryDashboardViewProps {
  onAddNewInventory: () => void;
  onAddToExisting: () => void;
  onViewReceivable: () => void;
  onViewInventory: () => void;
}

export function InventoryDashboardView({
  onAddNewInventory,
  onAddToExisting,
  onViewReceivable,
  onViewInventory,
}: InventoryDashboardViewProps) {
  const cards = [
    {
      title: 'Add New Inventory',
      description: 'Create a new product entry with optional costing information',
      icon: Plus,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      hoverBorder: 'hover:border-blue-400',
      hoverBg: 'hover:bg-blue-50',
      onClick: onAddNewInventory,
    },
    {
      title: 'Add to Existing Inventory',
      description: 'Add more units to an existing product in inventory',
      icon: PackagePlus,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200',
      hoverBorder: 'hover:border-green-400',
      hoverBg: 'hover:bg-green-50',
      onClick: onAddToExisting,
    },
    {
      title: 'Receivable Stock',
      description: 'View shipments on the way but not yet received',
      icon: PackageSearch,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-200',
      hoverBorder: 'hover:border-orange-400',
      hoverBg: 'hover:bg-orange-50',
      onClick: onViewReceivable,
    },
    {
      title: 'View Inventory',
      description: 'View existing inventory items',
      icon: Boxes,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200',
      hoverBorder: 'hover:border-purple-400',
      hoverBg: 'hover:bg-purple-50',
      onClick: onViewInventory,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            {/* FIX: use indigo-100 bg so the indigo icon is visible */}
            <div className="p-2.5 bg-indigo-100 rounded-lg shadow-sm border border-indigo-200">
              <Package className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Inventory Entry</h2>
          </div>
          <p className="text-sm text-gray-500 ml-12">
            Smart inventory intake flow with conditional costing and payment tracking
          </p>
        </div>

        {/* Cards Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">What type of inventory entry?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {cards.map((card, index) => {
              const Icon = card.icon;
              return (
                <button
                  key={index}
                  onClick={card.onClick}
                  className={`group p-5 border-2 ${card.borderColor} rounded-xl transition-all duration-200 text-left bg-white ${card.hoverBorder} ${card.hoverBg} hover:shadow-md`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    {/* FIX: each card icon has its own colored background — always visible */}
                    <div className={`p-2 rounded-lg ${card.iconBg} transition-colors flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${card.iconColor}`} />
                    </div>
                    <h4 className="text-base font-semibold text-gray-900 leading-snug pt-1">{card.title}</h4>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {card.description}
                  </p>
                  <div className="mt-4 flex items-center text-sm font-medium text-gray-400 group-hover:text-gray-600 transition-all">
                    Get Started <ArrowRight className="w-4 h-4 ml-1.5" />
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