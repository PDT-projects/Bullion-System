// Inventory Module - View Layer
// InventoryReturnView - Add Returned Inventory

import React from 'react';
import { ArrowLeft, Undo2, Search, Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { UseInventoryReturnViewModelReturn } from '../viewModels/useInventoryReturnViewModel';

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8,
  fontSize: 14, outline: 'none', color: '#111827', backgroundColor: '#fff', boxSizing: 'border-box',
};

export const InventoryReturnView: React.FC<UseInventoryReturnViewModelReturn> = ({
  serialInput, setSerialInput, isSearching, foundProduct, notFound, handleSearch,
  isDamaged, setIsDamaged, damageReason, setDamageReason,
  isSubmitting, handleSubmit, reset, onBack,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', backgroundColor: '#f8fafc' }}>
    <div style={{ flexShrink: 0, backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
          <ArrowLeft size={17} />
        </button>
        <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Undo2 size={17} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Add Returned Inventory</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>Search a serial number to process a return</div>
        </div>
      </div>
    </div>

    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Search */}
        <div style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Serial Number *</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text" value={serialInput}
              onChange={e => setSerialInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Scan or type serial number"
              style={inp}
            />
            <button
              onClick={handleSearch} disabled={isSearching}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 8, border: 'none', backgroundColor: '#0f172a', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {isSearching ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={15} />} Search
            </button>
          </div>
        </div>

        {notFound && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', color: '#dc2626', fontSize: 13 }}>
            <XCircle size={16} /> No inventory item found with that serial number.
          </div>
        )}

        {foundProduct && (
          <div style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#16a34a', fontWeight: 700, fontSize: 13 }}>
              <CheckCircle2 size={16} /> Item found
            </div>
            <div style={{ backgroundColor: '#f8fafc', borderRadius: 8, padding: 12, fontSize: 13 }}>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>{foundProduct.brandName} — {foundProduct.modelName}</div>
              <div style={{ color: '#64748b', marginTop: 2 }}>
                Location: {foundProduct.location || '—'} · Ownership: {foundProduct.ownershipType || '—'}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Condition *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button
                  onClick={() => setIsDamaged(false)}
                  style={{
                    padding: '12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    border: `2px solid ${!isDamaged ? '#16a34a' : '#e2e8f0'}`,
                    backgroundColor: !isDamaged ? '#f0fdf4' : '#fff',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>Not Damaged</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Back to stock, same serial</div>
                </button>
                <button
                  onClick={() => setIsDamaged(true)}
                  style={{
                    padding: '12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    border: `2px solid ${isDamaged ? '#dc2626' : '#e2e8f0'}`,
                    backgroundColor: isDamaged ? '#fef2f2' : '#fff',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>Damaged</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Move to Damaged Inventory</div>
                </button>
              </div>
            </div>

            {isDamaged && (
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Damage Note (optional)</label>
                <textarea
                  value={damageReason} onChange={e => setDamageReason(e.target.value)}
                  rows={3} placeholder="Describe the damage…"
                  style={{ ...inp, resize: 'vertical' }}
                />
              </div>
            )}

            {!isDamaged && foundProduct.ownershipType === 'Credit' && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#92400e' }}>
                <AlertTriangle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
                This item is currently on supplier credit. Returning it will mark the product as Owned.
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={reset} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#fff', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={handleSubmit} disabled={isSubmitting}
                style={{
                  padding: '10px 20px', borderRadius: 8, border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  backgroundColor: isDamaged ? '#dc2626' : '#16a34a', opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? 'Processing…' : isDamaged ? 'Move to Damaged Inventory' : 'Return to Stock'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);
