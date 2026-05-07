// Inventory Module - View Layer
// InventoryTypeSelectionView - Step 1: Choose inventory entry type

import React from 'react';
import { Package, Truck, ArrowLeft, Check } from 'lucide-react';
import { UseInventoryTypeSelectionViewModelReturn } from '../viewModels/useInventoryTypeSelectionViewModel';

interface InventoryTypeSelectionViewProps extends UseInventoryTypeSelectionViewModelReturn {}

const STEPS = [
  { number: 1, label: 'Type' },
  { number: 2, label: 'Costing' },
  { number: 3, label: 'Details' },
  { number: 4, label: 'Payment' },
];

const Stepper = ({ current }: { current: number }) => (
  <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', padding: '14px 32px' }}>
    <div style={{ display: 'flex', alignItems: 'center', maxWidth: 560, margin: '0 auto' }}>
      {STEPS.map((step, i) => {
        const active = step.number === current;
        const done   = step.number < current;
        const last   = i === STEPS.length - 1;
        return (
          <React.Fragment key={step.number}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 13, flexShrink: 0,
                backgroundColor: done || active ? '#0f172a' : '#e5e7eb',
                color: done || active ? '#fff' : '#9ca3af',
                boxShadow: active ? '0 0 0 4px rgba(15,23,42,0.12)' : 'none',
              }}>
                {done ? <Check size={14} strokeWidth={3} /> : step.number}
              </div>
              <span style={{ marginTop: 5, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: done || active ? '#0f172a' : '#94a3b8', whiteSpace: 'nowrap' }}>
                {step.label}
              </span>
            </div>
            {!last && (
              <div style={{ flex: 1, height: 2, borderRadius: 99, margin: '0 8px', marginBottom: 20, backgroundColor: done ? '#0f172a' : '#e5e7eb', transition: 'background-color 0.3s' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  </div>
);

export const InventoryTypeSelectionView: React.FC<InventoryTypeSelectionViewProps> = ({
  selectedType, selectTypeAndContinue, handleBack,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', backgroundColor: '#f8fafc' }}>

    {/* Header */}
    <div style={{ flexShrink: 0, backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={handleBack} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0 }}>
          <ArrowLeft size={17} />
        </button>
        <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Package size={17} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Add New Inventory</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>Step 1 of 4 — Select inventory type</div>
        </div>
      </div>
    </div>

    <Stepper current={1} />

    {/* Content */}
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 20 }}>What type of inventory are you adding?</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, maxWidth: 900 }}>
        {[
          {
            type: 'in-stock' as const,
            icon: Package, iconColor: '#16a34a', activeBorder: '#22c55e', activeBg: '#f0fdf4', activeIconBg: '#dcfce7', activeGlow: 'rgba(34,197,94,0.15)',
            activeCheck: '#22c55e', title: 'In-Stock / Received', sub: 'Physically in warehouse',
            desc: 'Products already in your warehouse or physically received and ready for sale.',
            badge: '● Available Now', badgeBg: '#dcfce7', badgeColor: '#15803d',
          },
          {
            type: 'on-order' as const,
            icon: Truck, iconColor: '#ea580c', activeBorder: '#f97316', activeBg: '#fff7ed', activeIconBg: '#ffedd5', activeGlow: 'rgba(249,115,22,0.15)',
            activeCheck: '#f97316', title: 'On-Order / Pending', sub: 'Ordered, not yet received',
            desc: 'Products ordered from a supplier but not yet received or in transit.',
            badge: '● Expected Soon', badgeBg: '#ffedd5', badgeColor: '#c2410c',
          },
        ].map(({ type, icon: Icon, iconColor, activeBorder, activeBg, activeIconBg, activeGlow, activeCheck, title, sub, desc, badge, badgeBg, badgeColor }) => {
          const sel = selectedType === type;
          return (
            <button
              key={type}
              onClick={() => selectTypeAndContinue(type)}
              style={{
                display: 'flex', flexDirection: 'column', padding: 22, textAlign: 'left', cursor: 'pointer',
                border: `2px solid ${sel ? activeBorder : '#e2e8f0'}`,
                borderRadius: 14, backgroundColor: sel ? activeBg : '#fff',
                boxShadow: sel ? `0 0 0 3px ${activeGlow}` : '0 1px 3px rgba(0,0,0,0.06)',
                transition: 'all 0.2s', width: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ padding: 10, borderRadius: 10, backgroundColor: sel ? activeIconBg : '#f1f5f9', flexShrink: 0 }}>
                  <Icon size={24} color={iconColor} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{title}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{sub}</div>
                </div>
                {sel && (
                  <div style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: activeCheck, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={12} color="#fff" strokeWidth={3} />
                  </div>
                )}
              </div>
              <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6, flex: 1, margin: '0 0 14px 0' }}>{desc}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ padding: '3px 9px', borderRadius: 99, fontSize: 10, fontWeight: 700, backgroundColor: badgeBg, color: badgeColor }}>{badge}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: sel ? iconColor : '#9ca3af' }}>Select →</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  </div>
);