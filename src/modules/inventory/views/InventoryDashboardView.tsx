// Inventory Module - View Layer
// InventoryDashboardView - Main entry page for inventory operations

import { Plus, Package, ArrowRight, Boxes, PackagePlus, PackageSearch, ArrowRightLeft } from 'lucide-react';

interface InventoryDashboardViewProps {
  onAddNewInventory: () => void;
  onAddToExisting: () => void;
  onViewReceivable: () => void;
  onViewInventory: () => void;
  onProductTransfer: () => void;
}

export function InventoryDashboardView({
  onAddNewInventory,
  onAddToExisting,
  onViewReceivable,
  onViewInventory,
  onProductTransfer,
}: InventoryDashboardViewProps) {
  const cards = [
    {
      title: 'Add New Inventory',
      description: 'Create a new product entry with optional costing information',
      icon: Plus,
      iconBg: 'bg-white border shadow-sm',
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
      iconBg: 'bg-white border shadow-sm',
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
      iconBg: 'bg-white border shadow-sm',
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
      iconBg: 'bg-white border shadow-sm',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200',
      hoverBorder: 'hover:border-purple-400',
      hoverBg: 'hover:bg-purple-50',
      onClick: onViewInventory,
    },
    {
      title: 'Product Transfer',
      description: 'Transfer products between locations or warehouses',
      icon: ArrowRightLeft,
      iconBg: 'bg-white border shadow-sm',
      iconColor: 'text-slate-600',
      borderColor: 'border-slate-200',
      hoverBorder: 'hover:border-slate-400',
      hoverBg: 'hover:bg-slate-50',
      onClick: onProductTransfer,
    },
  ];

  return (
    <div className="min-h-screen overflow-y-auto bg-gray-50 p-8">
      {/* Page Header - Full width */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-3 bg-white shadow-sm border border-gray-200 rounded-xl">
            <Package className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Inventory</h2>
            <p className="text-lg text-gray-600 mt-1">
              Smart inventory intake flow with conditional costing and payment tracking
            </p>
          </div>
        </div>
      </div>

      {/* Cards Grid - Full width, no inner container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <button
              key={index}
              onClick={card.onClick}
              className={`group w-full h-52 flex flex-col justify-between p-6 border-2 rounded-2xl transition-all duration-200 shadow-sm ${card.borderColor} ${card.hoverBorder} ${card.hoverBg} hover:shadow-lg hover:scale-[1.02]`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${card.iconBg} shrink-0`}>
                  <Icon className={`w-7 h-7 ${card.iconColor}`} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{card.title}</h4>
                  <p className="text-gray-600 leading-relaxed">{card.description}</p>
                </div>
              </div>
              <div className="flex items-center text-sm font-semibold text-gray-700 group-hover:text-indigo-600 transition-colors">
                Get Started 
                <ArrowRight className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}