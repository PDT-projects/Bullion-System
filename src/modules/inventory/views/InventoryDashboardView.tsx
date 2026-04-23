// Inventory Module - View Layer
// InventoryDashboardView - Main entry page for inventory operations
// UPDATED: Shows recent inventory payment activity panel

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { Plus, Package, ArrowRight, Boxes, PackagePlus, PackageSearch, ArrowRightLeft, Banknote, Building2, CreditCard, Clock, Loader2 } from 'lucide-react';

interface InventoryDashboardViewProps {
  onAddNewInventory: () => void;
  onAddToExisting: () => void;
  onViewReceivable: () => void;
  onViewInventory: () => void;
  onProductTransfer: () => void;
}

interface PaymentSummaryEntry {
  id:            string;
  brandName:     string;
  modelName:     string;
  transactionId: string;
  paymentStatus: 'paid' | 'unpaid' | 'partial';
  paymentMode?:  string;
  bankName?:     string;
  paidAmount?:   number;
  totalAmount?:  number;
  createdAt?:    any;
  installments?: any[];
}

function PaymentModeChip({ entry }: { entry: PaymentSummaryEntry }) {
  if (entry.paymentStatus === 'unpaid') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, backgroundColor: '#fef2f2', color: '#dc2626' }}>
        Unpaid
      </span>
    );
  }
  if (entry.installments?.length > 0) {
    const cashCount = entry.installments.filter((i: any) => i.mode === 'cash').length;
    const bankCount = entry.installments.filter((i: any) => i.mode === 'bank').length;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, backgroundColor: '#f5f3ff', color: '#7c3aed' }}>
        <CreditCard size={10} /> Mixed ({cashCount}× Cash + {bankCount}× Bank)
      </span>
    );
  }
  if (entry.paymentMode === 'cash') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, backgroundColor: '#f0fdf4', color: '#16a34a' }}>
        <Banknote size={10} /> Cash
      </span>
    );
  }
  if (entry.paymentMode === 'bank') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, backgroundColor: '#eff6ff', color: '#2563eb' }}
        title={entry.bankName}>
        <Building2 size={10} /> {entry.bankName || 'Bank Transfer'}
      </span>
    );
  }
  // Cheque / Credit Card / other
  if (entry.paymentMode) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, backgroundColor: '#f9fafb', color: '#374151' }}>
        <CreditCard size={10} /> {entry.paymentMode}
      </span>
    );
  }
  return null;
}

function PaymentStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string; label: string }> = {
    paid:    { bg: '#f0fdf4', color: '#16a34a', label: 'Paid' },
    unpaid:  { bg: '#fef2f2', color: '#dc2626', label: 'Unpaid' },
    partial: { bg: '#fffbeb', color: '#d97706', label: 'Partial' },
  };
  const c = cfg[status] || cfg.unpaid;
  return (
    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, backgroundColor: c.bg, color: c.color }}>
      {c.label}
    </span>
  );
}

function RecentPaymentsPanel() {
  const [entries, setEntries]   = useState<PaymentSummaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(8)));
        const rows: PaymentSummaryEntry[] = snap.docs
          .map(d => {
            const data = d.data() as any;
            const pi   = data.paymentInfo;
            if (!pi) return null;
            return {
              id:            d.id,
              brandName:     data.brandName  || '—',
              modelName:     data.modelName  || '—',
              transactionId: pi.transactionId || d.id.slice(0, 8),
              paymentStatus: pi.paymentStatus || 'unpaid',
              paymentMode:   pi.paymentMode,
              bankName:      pi.bankName,
              paidAmount:    pi.paidAmount,
              totalAmount:   pi.totalAmount,
              createdAt:     data.createdAt,
              installments:  pi.installments,
            } as PaymentSummaryEntry;
          })
          .filter(Boolean) as PaymentSummaryEntry[];
        setEntries(rows);
      } catch (err) {
        console.error('Failed to load payment activity:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const fmt = (n?: number) => n !== undefined
    ? new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(n)
    : '—';

  return (
    <div style={{ backgroundColor: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', marginTop: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Clock size={16} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Recent Inventory Payments</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>Last 8 entries — payment mode, bank & status</div>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: 10 }}>
          <Loader2 size={20} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ color: '#6b7280', fontSize: 13 }}>Loading…</span>
        </div>
      ) : entries.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
          No inventory payment records yet
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                {['Product', 'Transaction ID', 'Status', 'Payment Mode', 'Paid', 'Total'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => (
                <tr key={entry.id} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                    {entry.brandName}
                    <span style={{ color: '#6b7280', fontWeight: 400 }}> {entry.modelName}</span>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: 11, fontFamily: 'monospace', color: '#6366f1', fontWeight: 700 }}>
                    {entry.transactionId}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <PaymentStatusBadge status={entry.paymentStatus} />
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <PaymentModeChip entry={entry} />
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: '#16a34a' }}>
                    {fmt(entry.paidAmount)}
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: '#374151' }}>
                    {fmt(entry.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
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

      {/* Recent Payments Panel */}
      <RecentPaymentsPanel />
    </div>
  );
}