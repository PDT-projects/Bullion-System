// Inventory Module - View Layer
// InventoryDashboardView - Main entry page for inventory operations
// UPDATED: Shows recent inventory payment activity panel

import { Plus, Package, ArrowRight, Boxes, PackagePlus, PackageSearch, ArrowRightLeft } from 'lucide-react';

interface InventoryDashboardViewProps {
  onAddNewInventory: () => void;
  onAddToExisting: () => void;
  onViewReceivable: () => void;
  onViewInventory: () => void;
  onProductTransfer: () => void;
}

export function InventoryDashboardView({
  onAddNewInventory, onAddToExisting, onViewReceivable, onViewInventory, onProductTransfer,
}: InventoryDashboardViewProps) {
  const cards = [
    {
      title: 'Add New Inventory',
      description: 'Create a new product entry with optional costing information',
      icon: Plus,
      iconColor: '#2563eb', iconBg: '#eff6ff', borderColor: '#bfdbfe', hoverBorder: '#3b82f6', hoverBg: '#eff6ff',
      onClick: onAddNewInventory,
    },
    {
      title: 'Add to Existing',
      description: 'Add more units to an existing product in inventory',
      icon: PackagePlus,
      iconColor: '#16a34a', iconBg: '#f0fdf4', borderColor: '#bbf7d0', hoverBorder: '#22c55e', hoverBg: '#f0fdf4',
      onClick: onAddToExisting,
    },
    {
      title: 'Receivable Stock',
      description: 'View shipments on the way but not yet received',
      icon: PackageSearch,
      iconColor: '#d97706', iconBg: '#fffbeb', borderColor: '#fde68a', hoverBorder: '#f59e0b', hoverBg: '#fffbeb',
      onClick: onViewReceivable,
    },
    {
      title: 'View Inventory',
      description: 'Browse and manage all existing inventory items',
      icon: Boxes,
      iconColor: '#7c3aed', iconBg: '#f5f3ff', borderColor: '#ddd6fe', hoverBorder: '#8b5cf6', hoverBg: '#f5f3ff',
      onClick: onViewInventory,
    },
    {
      title: 'Product Transfer',
      description: 'Transfer products between locations or warehouses',
      icon: ArrowRightLeft,
      iconColor: '#0f766e', iconBg: '#f0fdfa', borderColor: '#99f6e4', hoverBorder: '#14b8a6', hoverBg: '#f0fdfa',
      onClick: onProductTransfer,
    },
  ];

  return (
    <div style={{ width: '100%', height: '100%', overflowY: 'auto', backgroundColor: '#f8fafc', padding: '28px 32px' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Package size={22} color="#fff" />
        </div>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>Inventory</h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0, marginTop: 2 }}>
            Smart inventory intake flow with conditional costing and payment tracking
          </p>
        </div>
      </div>

      {/* Action cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <button
              key={index}
              onClick={card.onClick}
              style={{
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                padding: '20px 20px', minHeight: 160,
                border: `1.5px solid ${card.borderColor}`,
                borderRadius: 14, backgroundColor: '#fff',
                cursor: 'pointer', textAlign: 'left', width: '100%',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget;
                el.style.borderColor  = card.hoverBorder;
                el.style.backgroundColor = card.hoverBg;
                el.style.boxShadow    = '0 4px 16px rgba(0,0,0,0.1)';
                el.style.transform    = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget;
                el.style.borderColor  = card.borderColor;
                el.style.backgroundColor = '#fff';
                el.style.boxShadow    = '0 1px 4px rgba(0,0,0,0.05)';
                el.style.transform    = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ padding: 10, borderRadius: 10, backgroundColor: card.iconBg, flexShrink: 0 }}>
                  <Icon size={22} color={card.iconColor} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{card.title}</div>
                  <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, margin: 0 }}>{card.description}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: card.iconColor, marginTop: 16 }}>
                Get Started <ArrowRight size={14} />
              </div>
            </button>
          );
        })}
      </div>

    </div>
  );
}