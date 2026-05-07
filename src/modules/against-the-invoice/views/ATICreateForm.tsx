// Against the Invoice Module — Create Form

import React, { useState, useMemo } from 'react';
import {
  ArrowLeft, Receipt, Search, Loader2, CheckCircle,
  AlertCircle, Building2, Wallet, CreditCard, FileText,
  Banknote, X,
} from 'lucide-react';
import { Invoice } from '../../invoices/models/types';
import { AgainstInvoiceEntry, ATIPaymentMode } from '../models/types';
import { generateATIId } from '../models/atiFirebaseService';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(n);

const COMPANIES = [
  'Pakistan Detector Technologies Pvt. Ltd - Islamabad',
  'Pakistan Detector Technologies Pvt. Ltd - Rawalpindi',
  'Pakistan Detector Technologies Pvt. Ltd - Lahore',
  'Pakistan Detector Technologies Pvt. Ltd - Other',
];

interface Props {
  invoices:     Invoice[];
  isSubmitting: boolean;
  onSubmit:     (dto: Omit<AgainstInvoiceEntry, 'id'>) => Promise<void>;
  onCancel:     () => void;
}

/* ── Inline style constants so Tailwind breakpoints don't fight the sidebar ── */
const S = {
  input: {
    width: '100%',
    padding: '9px 14px',
    fontSize: '13px',
    color: '#111827',
    background: '#fff',
    border: '1.5px solid #d1d5db',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box' as const,
  },
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '6px',
  },
  card: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    overflow: 'visible' as const,
  },
  cardHead: (bg: string) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    borderBottom: '1px solid #f3f4f6',
    background: bg,
    borderRadius: '12px 12px 0 0',
  }),
  cardBody: {
    padding: '20px',
  },
  row2: {
    display: 'grid' as const,
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  row3: {
    display: 'grid' as const,
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '8px',
  },
};

export function ATICreateForm({ invoices, isSubmitting, onSubmit, onCancel }: Props) {
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [showDropdown,  setShowDropdown]  = useState(false);
  const [selectedInv,   setSelectedInv]   = useState<Invoice | null>(null);
  const [date,        setDate]        = useState(new Date().toISOString().split('T')[0]);
  const [amount,      setAmount]      = useState('');
  const [mode,        setMode]        = useState<ATIPaymentMode>('Cash');
  const [bankName,    setBankName]    = useState('');
  const [chequeNum,   setChequeNum]   = useState('');
  const [chequeBank,  setChequeBank]  = useState('');
  const [chequeDate,  setChequeDate]  = useState('');
  const [company,     setCompany]     = useState(COMPANIES[0]);
  const [description, setDescription] = useState('');
  const [error,       setError]       = useState('');

  const filteredInvoices = useMemo(() => {
    if (!invoices?.length) return [];
    if (!invoiceSearch.trim()) return invoices.slice(0, 20);
    const s = invoiceSearch.toLowerCase();
    return invoices.filter(inv =>
      inv.invoiceNumber.toLowerCase().includes(s) ||
      inv.customerName.toLowerCase().includes(s) ||
      (inv.customerPhone ?? '').includes(s)
    ).slice(0, 15);
  }, [invoices, invoiceSearch]);

  const amountNum      = parseFloat(amount) || 0;
  const currentPaid    = selectedInv?.paidAmount ?? 0;
  const invoiceTotal   = selectedInv?.totalAmount ?? 0;
  const totalPaidAfter = currentPaid + amountNum;
  const remainingAfter = Math.max(0, invoiceTotal - totalPaidAfter);
  const newStatus      = remainingAfter <= 0 ? 'Settled' : totalPaidAfter > 0 ? 'Partial' : 'Active';
  const pctAfter       = invoiceTotal > 0 ? Math.min(100, (totalPaidAfter / invoiceTotal) * 100) : 0;

  const handleSelectInvoice = (inv: Invoice) => {
    setSelectedInv(inv);
    setInvoiceSearch(inv.invoiceNumber);
    setShowDropdown(false);
    setError('');
  };

  const validate = (): boolean => {
    if (!selectedInv)             { setError('Please select an invoice'); return false; }
    if (!selectedInv.totalAmount) { setError('Invalid invoice'); return false; }
    if (amountNum <= 0)           { setError('Amount must be greater than 0'); return false; }
    const rem = selectedInv.totalAmount - (selectedInv.paidAmount || 0);
    if (amountNum > rem + 0.01)   { setError(`Amount exceeds remaining balance of ${fmt(rem)}`); return false; }
    if (mode === 'Bank'   && !bankName.trim())  { setError('Please enter bank name'); return false; }
    if (mode === 'Cheque' && !chequeNum.trim()) { setError('Please enter cheque number'); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    const txId = await generateATIId();
    const time = new Date().toTimeString().split(' ')[0];
    await onSubmit({
      invoiceId: selectedInv!.id, invoiceNumber: selectedInv!.invoiceNumber,
      customerName: selectedInv!.customerName, invoiceTotal: selectedInv!.totalAmount,
      transactionId: txId, date, time, company, amount: amountNum, paymentMode: mode,
      bankName:     mode === 'Bank'   ? bankName   : undefined,
      bankId:       undefined,
      chequeNumber: mode === 'Cheque' ? chequeNum  : undefined,
      chequeBank:   mode === 'Cheque' ? chequeBank : undefined,
      chequeDate:   mode === 'Cheque' ? chequeDate : undefined,
      totalPaidBefore: currentPaid, totalPaidAfter, remainingAfter,
      status: newStatus as any, description: description || undefined,
    });
  };

  const paymentModes: { key: ATIPaymentMode; Icon: React.ElementType; label: string }[] = [
    { key: 'Cash',   Icon: Banknote,   label: 'Cash'   },
    { key: 'Bank',   Icon: CreditCard, label: 'Bank'   },
    { key: 'Cheque', Icon: FileText,   label: 'Cheque' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Sticky header ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: '#fff', borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '7px', borderRadius: '8px', border: '1px solid #e5e7eb',
              background: '#fff', cursor: 'pointer', display: 'flex', color: '#6b7280',
            }}
          >
            <ArrowLeft size={16} />
          </button>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Receipt size={15} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', lineHeight: 1 }}>
              New Payment Against Invoice
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
              Link a payment to an existing invoice
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* ── SELECT INVOICE ── */}
        <div style={S.card}>
          <div style={S.cardHead('#f1f5f9')}>
            <FileText size={14} color="#334155" />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Select Invoice
            </span>
          </div>
          <div style={S.cardBody}>
            <label style={S.label}>Search Invoice <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#9ca3af" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                value={invoiceSearch}
                onChange={e => { setInvoiceSearch(e.target.value); setShowDropdown(true); setSelectedInv(null); }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 180)}
                placeholder="Type invoice number or customer name..."
                style={{ ...S.input, paddingLeft: '36px', paddingRight: invoiceSearch ? '36px' : '14px' }}
              />
              {invoiceSearch && (
                <button
                  type="button"
                  onClick={() => { setInvoiceSearch(''); setSelectedInv(null); setShowDropdown(false); }}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '2px' }}
                >
                  <X size={13} />
                </button>
              )}

              {showDropdown && filteredInvoices.length > 0 && (
                <div style={{
                  position: 'absolute', zIndex: 30, width: '100%', marginTop: '4px',
                  background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.12)', maxHeight: '260px', overflowY: 'auto',
                }}>
                  {filteredInvoices.map(inv => {
                    const paid = inv.paidAmount || 0;
                    const remaining = Math.max(0, inv.totalAmount - paid);
                    return (
                      <button
                        key={inv.id}
                        type="button"
                        onMouseDown={() => handleSelectInvoice(inv)}
                        style={{
                          width: '100%', textAlign: 'left', padding: '10px 14px',
                          borderBottom: '1px solid #f9fafb', background: 'none', border: 'none',
                          cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{inv.invoiceNumber}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.customerName}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: remaining > 0 ? '#dc2626' : '#16a34a' }}>{fmt(remaining)} left</div>
                          <div style={{ fontSize: '11px', color: '#9ca3af' }}>{Math.round((paid / (inv.totalAmount || 1)) * 100)}% paid</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedInv && (
              <div style={{
                marginTop: '12px', padding: '12px 14px',
                background: '#f1f5f9', border: '1.5px solid #cbd5e1', borderRadius: '8px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Selected Invoice</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{selectedInv.invoiceNumber} · {selectedInv.customerName}</div>
                  </div>
                  <CheckCircle size={15} color="#334155" />
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                  <span>Total <strong style={{ color: '#111827' }}>{fmt(selectedInv.totalAmount)}</strong></span>
                  <span>Paid <strong style={{ color: '#16a34a' }}>{fmt(selectedInv.paidAmount || 0)}</strong></span>
                  <span>Left <strong style={{ color: '#dc2626' }}>{fmt(selectedInv.totalAmount - (selectedInv.paidAmount || 0))}</strong></span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── PAYMENT DETAILS ── */}
        <div style={S.card}>
          <div style={S.cardHead('#f0fdf4')}>
            <Wallet size={14} color="#22c55e" />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Payment Details
            </span>
          </div>
          <div style={S.cardBody}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Date + Amount — always 2 columns via inline grid */}
              <div style={S.row2}>
                <div>
                  <label style={S.label}>Date <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} style={S.input} />
                </div>
                <div>
                  <label style={S.label}>Amount (PKR) <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0"
                    style={S.input}
                  />
                </div>
              </div>

              {/* Payment Mode */}
              <div>
                <label style={S.label}>Payment Mode <span style={{ color: '#ef4444' }}>*</span></label>
                <div style={S.row3}>
                  {paymentModes.map(({ key, Icon, label: ml }) => {
                    const active = mode === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setMode(key)}
                        style={{
                          padding: '12px 8px',
                          borderRadius: '8px',
                          border: `2px solid ${active ? '#0f172a' : '#e5e7eb'}`,
                          background: active ? '#f1f5f9' : '#fff',
                          color: active ? '#1e293b' : '#6b7280',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                          fontSize: '12px', fontWeight: active ? 700 : 500,
                          cursor: 'pointer', transition: 'all 0.15s',
                          boxShadow: active ? '0 0 0 3px rgba(15,23,42,0.12)' : 'none',
                        }}
                      >
                        <Icon size={18} color={active ? '#0f172a' : '#9ca3af'} />
                        {ml}
                      </button>
                    );
                  })}
                </div>
              </div>

              {mode === 'Bank' && (
                <div>
                  <label style={S.label}>Bank Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. HBL, MCB, UBL..." style={S.input} />
                </div>
              )}

              {mode === 'Cheque' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={S.label}>Cheque # <span style={{ color: '#ef4444' }}>*</span></label>
                    <input value={chequeNum} onChange={e => setChequeNum(e.target.value)} placeholder="Cheque number" style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>Cheque Bank</label>
                    <input value={chequeBank} onChange={e => setChequeBank(e.target.value)} placeholder="Bank name" style={S.input} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={S.label}>Cheque Date</label>
                    <input type="date" value={chequeDate} onChange={e => setChequeDate(e.target.value)} style={S.input} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── ADDITIONAL DETAILS ── */}
        <div style={S.card}>
          <div style={S.cardHead('#faf5ff')}>
            <Building2 size={14} color="#a855f7" />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Additional Details
            </span>
          </div>
          <div style={S.cardBody}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={S.label}>Company / Branch</label>
                <select value={company} onChange={e => setCompany(e.target.value)} style={S.input}>
                  {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Description / Note</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Optional note about this payment..."
                  rows={3}
                  style={{ ...S.input, resize: 'none', lineHeight: '1.5' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── BALANCE PREVIEW ── */}
        {selectedInv && amountNum > 0 && (
          <div style={{ ...S.card, overflow: 'hidden' }}>
            <div style={S.cardHead('#f0fdf4')}>
              <CheckCircle size={14} color="#22c55e" />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Balance Preview After Payment
              </span>
            </div>
            <div style={S.cardBody}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Invoice Total',    value: fmt(invoiceTotal),    color: '#111827' },
                  { label: 'This Payment',     value: `+ ${fmt(amountNum)}`, color: '#0f172a' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#6b7280' }}>{r.label}</span>
                    <span style={{ fontWeight: 600, color: r.color }}>{r.value}</span>
                  </div>
                ))}
                <div style={{ height: '1px', background: '#f3f4f6', margin: '2px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#6b7280' }}>Total Paid After</span>
                  <span style={{ fontWeight: 700, color: '#16a34a', fontSize: '14px' }}>{fmt(totalPaidAfter)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#6b7280' }}>Remaining After</span>
                  <span style={{ fontWeight: 700, color: remainingAfter > 0 ? '#dc2626' : '#16a34a', fontSize: '14px' }}>{fmt(remainingAfter)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{ color: '#6b7280' }}>New Status</span>
                  <span style={{
                    fontSize: '11px', padding: '3px 10px', borderRadius: '999px', fontWeight: 700,
                    background: newStatus === 'Settled' ? '#dcfce7' : newStatus === 'Partial' ? '#fef9c3' : '#e2e8f0',
                    color:      newStatus === 'Settled' ? '#15803d'  : newStatus === 'Partial' ? '#92400e'  : '#1e293b',
                  }}>{newStatus}</span>
                </div>
              </div>
              <div style={{ marginTop: '14px' }}>
                <div style={{ width: '100%', height: '6px', background: '#e5e7eb', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '999px',
                    width: `${pctAfter}%`,
                    background: pctAfter >= 100 ? '#22c55e' : pctAfter > 50 ? '#0f172a' : '#f59e0b',
                    transition: 'width 0.5s',
                  }} />
                </div>
                <div style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>
                  {pctAfter.toFixed(0)}% of invoice will be paid
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: '8px', fontSize: '13px', color: '#b91c1c',
          }}>
            <AlertCircle size={15} color="#ef4444" style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* ── ACTIONS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', paddingBottom: '32px' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '12px', borderRadius: '8px',
              border: '1.5px solid #d1d5db', background: '#fff',
              color: '#374151', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '12px', borderRadius: '8px', border: 'none',
              background: '#0f172a', color: '#fff',
              fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              boxShadow: '0 2px 6px rgba(15,23,42,0.35)',
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting
              ? <><Loader2 size={14} className="animate-spin" /> Recording…</>
              : <><CheckCircle size={14} /> Record Payment</>}
          </button>
        </div>
      </form>
    </div>
  );
}