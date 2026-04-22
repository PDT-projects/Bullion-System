// Inventory Module - View Layer
// InventoryPaymentView - Last Step: Payment information
// UPDATED: Payment mode (Cash/Bank), bank dropdown, multi-installment support

import React, { useState } from 'react';
import {
  CreditCard, CheckCircle, X, AlertCircle, ArrowLeft, Save,
  Edit2, Check, Loader2, MapPin, Banknote, Building2, Plus, Trash2,
} from 'lucide-react';
import { UseInventoryPaymentViewModelReturn, PaymentMode } from '../viewModels/useInventoryPaymentViewModel';

interface InventoryPaymentViewProps extends UseInventoryPaymentViewModelReturn {}

const Stepper = ({ steps, current }: { steps: { number: number; label: string }[]; current: number }) => (
  <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', padding: '14px 32px' }}>
    <div style={{ display: 'flex', alignItems: 'center', maxWidth: 700, margin: '0 auto' }}>
      {steps.map((step, i) => {
        const active = step.number === current;
        const done   = step.number < current;
        const last   = i === steps.length - 1;
        return (
          <React.Fragment key={step.number}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 13, flexShrink: 0,
                backgroundColor: done || active ? '#4f46e5' : '#e5e7eb',
                color: done || active ? '#fff' : '#9ca3af',
                boxShadow: active ? '0 0 0 4px rgba(79,70,229,0.18)' : 'none',
              }}>
                {done ? <Check size={14} strokeWidth={3} /> : step.number}
              </div>
              <span style={{ marginTop: 5, fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: done || active ? '#4f46e5' : '#94a3b8', whiteSpace: 'nowrap' }}>
                {step.label}
              </span>
            </div>
            {!last && (
              <div style={{ flex: 1, height: 2, borderRadius: 99, margin: '0 6px', marginBottom: 20, backgroundColor: done ? '#4f46e5' : '#e5e7eb', transition: 'background-color 0.3s' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  </div>
);

const inp = {
  width: '100%', padding: '10px 14px', border: '1px solid #d1d5db',
  borderRadius: 8, fontSize: 13, outline: 'none',
  boxSizing: 'border-box' as const, color: '#111827', backgroundColor: '#fff',
};

// ── Payment Mode Selector ─────────────────────────────────────────────────────
function PaymentModeToggle({
  mode, onChange, disabled,
}: { mode: PaymentMode; onChange: (m: PaymentMode) => void; disabled?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {([
        { value: 'cash' as const,  label: 'Cash',        Icon: Banknote,  color: '#16a34a', bg: '#f0fdf4', border: '#22c55e' },
        { value: 'bank' as const,  label: 'Bank Transfer', Icon: Building2, color: '#2563eb', bg: '#eff6ff', border: '#3b82f6' },
      ]).map(({ value, label, Icon, color, bg, border }) => {
        const sel = mode === value;
        return (
          <button key={value} onClick={() => !disabled && onChange(value)}
            disabled={disabled}
            style={{
              flex: 1, padding: '12px 10px', borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer',
              textAlign: 'center', border: `2px solid ${sel ? border : '#e2e8f0'}`,
              backgroundColor: sel ? bg : '#fff', opacity: disabled ? 0.5 : 1, transition: 'all 0.15s',
            }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
              <Icon size={20} color={sel ? color : '#9ca3af'} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: sel ? color : '#374151' }}>{label}</div>
          </button>
        );
      })}
    </div>
  );
}

// ── Bank Selector Dropdown ────────────────────────────────────────────────────
function BankSelector({
  banks, value, onChange, error, isBanksLoading,
}: {
  banks: Array<{ id: string; name: string; balance: number }>;
  value: string; onChange: (id: string) => void;
  error?: string; isBanksLoading?: boolean;
}) {
  return (
    <div style={{ marginTop: 12 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
        Select Bank Account *
      </label>
      {isBanksLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <Loader2 size={14} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 12, color: '#6b7280' }}>Loading bank accounts…</span>
        </div>
      ) : (
        <select value={value} onChange={e => onChange(e.target.value)}
          style={{ ...inp, border: `1px solid ${error ? '#ef4444' : '#d1d5db'}` }}>
          <option value="">— Choose bank account —</option>
          {banks.map(b => (
            <option key={b.id} value={b.id}>
              {b.name} {b.balance !== undefined ? `(Balance: PKR ${b.balance.toLocaleString()})` : ''}
            </option>
          ))}
        </select>
      )}
      {error && <p style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{error}</p>}
    </div>
  );
}

export const InventoryPaymentView: React.FC<InventoryPaymentViewProps> = ({
  costingOption, inventoryType, totalAmount,
  paymentStatus, transactionId, isGeneratingId, isEditingTransactionId,
  paidAmount, remainingAmount, validationErrors, isValid, isSaving,
  paymentMode, setPaymentMode, selectedBankId, setSelectedBankId, banks, isBanksLoading,
  installments, addInstallment, removeInstallment, updateInstallment, instalmentTotal,
  setPaymentStatus, setTransactionId, setIsEditingTransactionId,
  setPaidAmount, handleSubmit, handleBack, formatCurrency, productSummary,
}) => {
  const steps = costingOption === 'with'
    ? [
        { number: 1, label: 'Type' }, { number: 2, label: 'Costing' },
        { number: 3, label: 'Details' }, { number: 4, label: 'Products' }, { number: 5, label: 'Payment' },
      ]
    : [
        { number: 1, label: 'Type' }, { number: 2, label: 'Costing' },
        { number: 3, label: 'Details' }, { number: 4, label: 'Payment' },
      ];
  const currentStep = steps.length;

  // Show payment details section only when status is not 'unpaid'
  const showPaymentDetails = paymentStatus !== 'unpaid';
  const showInstallments   = paymentStatus === 'partial';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', backgroundColor: '#f8fafc' }}>

      {/* Header */}
      <div style={{ flexShrink: 0, backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={handleBack}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151' }}>
            <ArrowLeft size={16} /> Back
          </button>
          <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CreditCard size={17} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Payment Information</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Complete payment details to finalize inventory creation</div>
          </div>
        </div>
      </div>

      <Stepper steps={steps} current={currentStep} />

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Transaction ID ──────────────────────────────────────────────── */}
          <div style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '20px 24px' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Transaction ID</label>
            {isGeneratingId ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                <Loader2 size={16} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 13, color: '#6b7280' }}>Generating transaction ID...</span>
              </div>
            ) : isEditingTransactionId ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" value={transactionId}
                  onChange={e => setTransactionId(e.target.value.toUpperCase())} autoFocus
                  style={{ ...inp, flex: 1, border: `1px solid ${validationErrors.transactionId ? '#ef4444' : '#6366f1'}`, fontFamily: 'monospace', fontWeight: 600 }}
                  placeholder="e.g. INV-150326-001" />
                <button onClick={() => setIsEditingTransactionId(false)} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', backgroundColor: '#22c55e', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <Check size={16} />
                </button>
                <button onClick={() => setIsEditingTransactionId(false)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#374151' }}>
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 8 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#4338ca', letterSpacing: '0.05em' }}>{transactionId}</span>
                  <span style={{ fontSize: 10, color: '#818cf8', fontWeight: 600 }}>AUTO-GENERATED</span>
                </div>
                <button onClick={() => setIsEditingTransactionId(true)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#6b7280' }}>
                  <Edit2 size={15} />
                </button>
              </div>
            )}
            {validationErrors.transactionId && <p style={{ color: '#ef4444', fontSize: 11, marginTop: 5 }}>{validationErrors.transactionId}</p>}
            <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>Auto-generated in format INV-DDMMYY-NNN. Click the pencil icon to customise.</p>
          </div>

          {/* ── Payment Status ──────────────────────────────────────────────── */}
          <div style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '20px 24px' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 14 }}>Payment Status *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {([
                { value: 'paid',    icon: CheckCircle, label: 'Paid',    desc: 'Full payment received', activeColor: '#16a34a', activeBg: '#f0fdf4', activeBorder: '#22c55e' },
                { value: 'unpaid',  icon: X,           label: 'Unpaid',  desc: 'No payment yet',        activeColor: '#dc2626', activeBg: '#fef2f2', activeBorder: '#f87171' },
                { value: 'partial', icon: AlertCircle, label: 'Partial', desc: 'Partial / installments', activeColor: '#d97706', activeBg: '#fffbeb', activeBorder: '#fbbf24' },
              ] as const).map(({ value, icon: Icon, label, desc, activeColor, activeBg, activeBorder }) => {
                const sel = paymentStatus === value;
                return (
                  <button key={value} onClick={() => setPaymentStatus(value)} style={{
                    padding: '14px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                    border: `2px solid ${sel ? activeBorder : '#e2e8f0'}`,
                    backgroundColor: sel ? activeBg : '#fff', transition: 'all 0.15s',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
                      <Icon size={22} color={sel ? activeColor : '#9ca3af'} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: sel ? activeColor : '#374151' }}>{label}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Payment Mode (shown when NOT unpaid) ─────────────────────────── */}
          {showPaymentDetails && (
            <div style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '20px 24px' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 14 }}>
                Payment Method *
              </label>

              {/* Only show global mode selector for paid / single partial (no installments) */}
              {(paymentStatus === 'paid' || (paymentStatus === 'partial' && installments.length === 0)) && (
                <>
                  <PaymentModeToggle mode={paymentMode} onChange={setPaymentMode} />
                  {paymentMode === 'bank' && (
                    <BankSelector
                      banks={banks} value={selectedBankId} onChange={setSelectedBankId}
                      error={validationErrors.bankId} isBanksLoading={isBanksLoading}
                    />
                  )}
                </>
              )}

              {/* Partial paid amount (when no installments) */}
              {paymentStatus === 'partial' && installments.length === 0 && (
                <div style={{ marginTop: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    Paid Amount *
                  </label>
                  <input type="number" min="0" step="0.01" value={paidAmount || ''}
                    onChange={e => setPaidAmount(Number(e.target.value))}
                    style={{ ...inp, border: `1px solid ${validationErrors.paidAmount ? '#ef4444' : '#d1d5db'}` }}
                    placeholder="0.00" />
                  {validationErrors.paidAmount && <p style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{validationErrors.paidAmount}</p>}
                </div>
              )}
            </div>
          )}

          {/* ── Installments (Partial) ────────────────────────────────────────── */}
          {showInstallments && (
            <div style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Installments / Multi-Account Payments</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                    Add multiple payments across different accounts or dates
                  </div>
                </div>
                <button onClick={addInstallment}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', backgroundColor: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  <Plus size={14} /> Add Entry
                </button>
              </div>

              {installments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#9ca3af', fontSize: 12 }}>
                  No installments added. Click "Add Entry" to split the payment, or leave empty to enter a single amount above.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {installments.map((inst, idx) => (
                    <div key={inst.id} style={{ borderRadius: 10, border: '1px solid #e2e8f0', padding: '14px 16px', backgroundColor: '#fafafa' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>
                          Payment #{idx + 1}
                        </span>
                        <button onClick={() => removeInstallment(inst.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, border: '1px solid #fca5a5', backgroundColor: '#fef2f2', cursor: 'pointer', color: '#dc2626', fontSize: 11 }}>
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {/* Mode */}
                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 5 }}>Mode</label>
                          <PaymentModeToggle
                            mode={inst.mode}
                            onChange={m => updateInstallment(inst.id, {
                              mode: m, bankId: undefined, bankName: undefined,
                            })}
                          />
                        </div>
                        {/* Amount */}
                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 5 }}>Amount (PKR) *</label>
                          <input type="number" min="0" value={inst.amount || ''}
                            onChange={e => updateInstallment(inst.id, { amount: Number(e.target.value) })}
                            style={{ ...inp }}
                            placeholder="0.00" />
                          {validationErrors[`inst_${idx}`] && (
                            <p style={{ color: '#ef4444', fontSize: 10, marginTop: 3 }}>{validationErrors[`inst_${idx}`]}</p>
                          )}
                        </div>
                      </div>

                      {/* Bank selector if bank mode */}
                      {inst.mode === 'bank' && (
                        <div style={{ marginTop: 10 }}>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 5 }}>Bank Account *</label>
                          <select value={inst.bankId || ''} onChange={e => {
                            const bank = banks.find(b => b.id === e.target.value);
                            updateInstallment(inst.id, { bankId: e.target.value, bankName: bank?.name });
                          }} style={{ ...inp }}>
                            <option value="">— Select bank —</option>
                            {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                          </select>
                          {validationErrors[`inst_bank_${idx}`] && (
                            <p style={{ color: '#ef4444', fontSize: 10, marginTop: 3 }}>{validationErrors[`inst_bank_${idx}`]}</p>
                          )}
                        </div>
                      )}

                      {/* Date + Note */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 5 }}>Date</label>
                          <input type="date" value={inst.date}
                            onChange={e => updateInstallment(inst.id, { date: e.target.value })}
                            style={{ ...inp }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 5 }}>Note (optional)</label>
                          <input type="text" value={inst.note || ''}
                            onChange={e => updateInstallment(inst.id, { note: e.target.value })}
                            style={{ ...inp }} placeholder="e.g. First instalment" />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Instalment total */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, paddingTop: 8, borderTop: '1px dashed #e2e8f0', marginTop: 4 }}>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>Instalment Total:</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: instalmentTotal > totalAmount ? '#dc2626' : '#16a34a' }}>
                      {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(instalmentTotal)}
                    </span>
                    {instalmentTotal > totalAmount && (
                      <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>⚠ Exceeds total</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Summaries (side by side) ──────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* Payment summary */}
            <div style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '20px 24px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 14 }}>Payment Summary</div>
              {[
                { label: 'Total Amount', value: formatCurrency(totalAmount),     color: '#111827' },
                { label: 'Paid Amount',  value: formatCurrency(installments.length > 0 ? (installments.reduce((s,e)=>s+e.amount,0)) : (paidAmount || 0)), color: '#111827' },
                { label: 'Remaining',    value: formatCurrency(installments.length > 0 ? Math.max(0, totalAmount - installments.reduce((s,e)=>s+e.amount,0)) : remainingAmount), color: '#dc2626', border: true },
              ].map(({ label, value, color, border }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: border ? '10px 0 0 0' : '5px 0', borderTop: border ? '1px solid #f1f5f9' : 'none', marginTop: border ? 8 : 0 }}>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>{label}:</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}</span>
                </div>
              ))}
              {/* Payment method badge */}
              {showPaymentDetails && (
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 10, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Method: </span>
                  {installments.length > 0 ? (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed' }}>
                      Mixed ({installments.filter(i => i.mode === 'cash').length} Cash + {installments.filter(i => i.mode === 'bank').length} Bank)
                    </span>
                  ) : paymentMode === 'cash' ? (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a' }}>💵 Cash</span>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb' }}>
                      🏦 {banks.find(b => b.id === selectedBankId)?.name || 'Bank Transfer'}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Product summary */}
            <div style={{ backgroundColor: '#eef2ff', borderRadius: 12, border: '1px solid #c7d2fe', padding: '20px 24px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#3730a3', marginBottom: 14 }}>Product Summary</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 8px' }}>
                {[
                  ['Brand',    productSummary.brandName],
                  ['Model',    productSummary.modelName],
                  ['Category', productSummary.category],
                  ['Stock',    `${productSummary.stock} units`],
                  ['Sell Price', formatCurrency(productSummary.sellPrice)],
                  ['Status',   productSummary.status],
                  ['Costing',  costingOption === 'with' ? 'With Costing' : 'Without Costing'],
                  ['Type',     inventoryType === 'in-stock' ? 'In-Stock' : 'On-Order'],
                ].map(([l, v]) => (
                  <div key={l}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{l}</span>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1e1b4b', marginTop: 2 }}>{v}</div>
                  </div>
                ))}
              </div>
              {productSummary.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 10, borderTop: '1px solid #c7d2fe' }}>
                  <MapPin size={13} color="#6366f1" />
                  <span style={{ fontSize: 12, color: '#4338ca', fontWeight: 700 }}>{productSummary.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Actions ──────────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 }}>
            <button onClick={handleBack}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151' }}>
              <ArrowLeft size={16} /> Back
            </button>
            <button onClick={handleSubmit}
              disabled={!isValid || isSaving || isGeneratingId}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '11px 28px', borderRadius: 8, border: 'none',
                backgroundColor: !isValid ? '#e5e7eb' : '#4f46e5',
                color: !isValid ? '#9ca3af' : '#fff',
                fontWeight: 700, fontSize: 14,
                cursor: (!isValid || isSaving || isGeneratingId) ? 'not-allowed' : 'pointer',
                boxShadow: isValid ? '0 2px 10px rgba(79,70,229,0.35)' : 'none',
                opacity: isSaving || isGeneratingId ? 0.8 : 1, transition: 'all 0.2s',
              }}>
              {isGeneratingId
                ? <><Loader2 size={16} className="animate-spin" /> Preparing...</>
                : isSaving
                ? <><Loader2 size={16} className="animate-spin" /> Saving...</>
                : <><Save size={16} /> Submit Inventory</>
              }
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};