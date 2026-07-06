// Inventory Module - View Layer
// InventoryReturnView - Add Returned Inventory

import React from 'react';
import { ArrowLeft, Undo2, Search, Loader2, CheckCircle2, XCircle, AlertTriangle, PackageCheck, PackageX } from 'lucide-react';
import { UseInventoryReturnViewModelReturn } from '../viewModels/useInventoryReturnViewModel';

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8,
  fontSize: 14, outline: 'none', color: '#111827', backgroundColor: '#fff', boxSizing: 'border-box',
};

export const InventoryReturnView: React.FC<UseInventoryReturnViewModelReturn> = ({
  mode, selectMode, backToChoose,
  recentInvoices, invoicesLoading, selectedInvoice, selectInvoice, pickSerialFromInvoice,
  serialInput, setSerialInput, isSearching, foundProduct, notFound, handleSearch,
  isDamaged, damageReason, setDamageReason,
  isSubmitting, handleSubmit, reset, onBack,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', backgroundColor: '#f8fafc' }}>
    <div style={{ flexShrink: 0, backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={mode === 'choose' ? onBack : backToChoose} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
          <ArrowLeft size={17} />
        </button>
        <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Undo2 size={17} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Add Returned Inventory</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            {mode === 'choose' ? 'Choose how this return should be processed' : mode === 'stock' ? 'Pick a recent invoice and serial to return to stock' : 'Search the serial number to process the return'}
          </div>
        </div>
      </div>
    </div>

    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {mode === 'choose' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <button
              onClick={() => selectMode('stock')}
              style={{ textAlign: 'left', padding: 22, borderRadius: 14, border: '1.5px solid #bbf7d0', backgroundColor: '#f0fdf4', cursor: 'pointer' }}
            >
              <PackageCheck size={26} color="#16a34a" />
              <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', marginTop: 10 }}>Back to Stock</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Select the invoice, return the item to stock, and close out the invoice</div>
            </button>
            <button
              onClick={() => selectMode('damaged')}
              style={{ textAlign: 'left', padding: 22, borderRadius: 14, border: '1.5px solid #fecaca', backgroundColor: '#fef2f2', cursor: 'pointer' }}
            >
              <PackageX size={26} color="#dc2626" />
              <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', marginTop: 10 }}>Damaged Inventory</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Archive the item — it will not be added back to stock</div>
            </button>
          </div>
        )}

        {mode !== 'choose' && (
        <>
        {/* ── Stock mode: recent invoices list ── */}
        {mode === 'stock' && !foundProduct && (
          <div style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10 }}>Recent Invoices</div>
            {invoicesLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280', fontSize: 13 }}>
                <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Loading invoices…
              </div>
            ) : recentInvoices.length === 0 ? (
              <div style={{ fontSize: 13, color: '#9ca3af' }}>No recent invoices found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                {recentInvoices.map(inv => (
                  <button
                    key={inv.id}
                    onClick={() => selectInvoice(inv)}
                    style={{
                      textAlign: 'left', padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                      border: `1.5px solid ${selectedInvoice?.id === inv.id ? '#0f172a' : '#e2e8f0'}`,
                      backgroundColor: selectedInvoice?.id === inv.id ? '#f1f5f9' : '#fff',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                      <span>{inv.invoiceNumber}</span>
                      <span>{inv.totalAmount}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                      {inv.customerName} · {inv.date} · {inv.status}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedInvoice && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                  Select the serial to return from {selectedInvoice.invoiceNumber}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(selectedInvoice.products || []).flatMap(p => p.serialNumbers || [])
                    .filter(s => !(selectedInvoice.returnedSerials || []).includes(s))
                    .map(serial => (
                      <button
                        key={serial}
                        onClick={() => pickSerialFromInvoice(serial)}
                        style={{
                          padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          border: `1.5px solid ${serialInput === serial ? '#16a34a' : '#e2e8f0'}`,
                          backgroundColor: serialInput === serial ? '#f0fdf4' : '#f8fafc', color: '#0f172a',
                        }}
                      >
                        {serial}
                      </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manual serial search (fallback / used directly for Damaged) */}
        {(mode === 'damaged' || (mode === 'stock' && !foundProduct)) && (
        <div style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            {mode === 'stock' ? 'Or search by serial number manually' : 'Serial Number *'}
          </label>
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
        )}

        {notFound && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', color: '#dc2626', fontSize: 13 }}>
            <XCircle size={16} /> No inventory item found for that number.
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
                {isSubmitting ? 'Processing…' : isDamaged ? 'Move to Damaged Inventory' : selectedInvoice ? 'Return to Stock & Archive Invoice' : 'Return to Stock'}
              </button>
            </div>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  </div>
);