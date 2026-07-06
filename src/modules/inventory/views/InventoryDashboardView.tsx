// Inventory Module - View Layer
// InventoryDashboardView - Main entry page for inventory operations
// UPDATED: Shows recent inventory payment activity panel

import { Plus, Package, ArrowRight, Boxes, Undo2, FileBarChart, Trash2, ArrowLeftRight } from 'lucide-react';

interface InventoryDashboardViewProps {
  onAddNewInventory: () => void;
  onAddReturnedInventory: () => void;
  onViewInventory: () => void;
  onViewReport: () => void;
  onViewDeleted: () => void;
  onViewTransfer: () => void;
}

export function InventoryDashboardView({
  onAddNewInventory, onAddReturnedInventory, onViewInventory, onViewReport, onViewDeleted, onViewTransfer,
}: InventoryDashboardViewProps) {
  const cards = [
    {
      title: 'Add New Inventory',
      description: 'Create a new product entry with optional costing information',
      icon: Plus,
      iconColor: '#0f172a', iconBg: '#f1f5f9', borderColor: '#cbd5e1', hoverBorder: '#334155', hoverBg: '#f1f5f9',
      onClick: onAddNewInventory,
    },
    {
      title: 'Add Returned Inventory',
      description: 'Process a customer return — damaged items go to Damaged Inventory, good items return to stock',
      icon: Undo2,
      iconColor: '#d97706', iconBg: '#fffbeb', borderColor: '#fde68a', hoverBorder: '#f59e0b', hoverBg: '#fffbeb',
      onClick: onAddReturnedInventory,
    },
    {
      title: 'Deleted Inventory',
      description: 'View archived records of deleted inventory items — items here cannot be deleted again',
      icon: Trash2,
      iconColor: '#b91c1c', iconBg: '#fef2f2', borderColor: '#fecaca', hoverBorder: '#ef4444', hoverBg: '#fef2f2',
      onClick: onViewDeleted,
    },
    {
      title: 'Inventory Transfer',
      description: 'Move stock between locations or warehouses and keep records in sync',
      icon: ArrowLeftRight,
      iconColor: '#1d4ed8', iconBg: '#eff6ff', borderColor: '#bfdbfe', hoverBorder: '#3b82f6', hoverBg: '#eff6ff',
      onClick: onViewTransfer,
    },
    {
      title: 'View Inventory Report',
      description: 'Full per-serial breakdown: model, location, stock-in date, status, invoice, supplier cost & payment',
      icon: FileBarChart,
      iconColor: '#7c3aed', iconBg: '#f5f3ff', borderColor: '#e2e8f0', hoverBorder: '#8b5cf6', hoverBg: '#f5f3ff',
      onClick: onViewReport,
    },
    {
      title: 'View Inventory',
      description: 'Browse and manage all existing inventory items',
      icon: Boxes,
      iconColor: '#0f766e', iconBg: '#f0fdfa', borderColor: '#99f6e4', hoverBorder: '#14b8a6', hoverBg: '#f0fdfa',
      onClick: onViewInventory,
    },
  ];

  return (
    <div style={{ width: '100%', height: '100%', overflowY: 'auto', backgroundColor: '#f8fafc', padding: '28px 32px' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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