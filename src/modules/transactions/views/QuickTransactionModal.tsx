// Transactions Module - Quick Transaction Popup
// QuickTransactionModal.tsx
//
// A compact popup for creating a single transaction quickly — mirrors the
// inventory / invoice popup style. Supports the "Miscellaneous (against Invoice)"
// category which links the transaction to an invoice and updates its misc expense.

import React from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Check, X, ArrowDownCircle, ArrowUpCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { TransactionFirebaseService } from '../models/transactionFirebaseService';
import { Transaction } from '../models/types';
import { InvoiceMiscExpenseService } from '../../invoices/models/InvoiceMiscExpenseService';

type TxType = 'Cash Inflow' | 'Cash Outflow';
type Mode   = 'Cash' | 'Bank' | 'Cheque';

const INFLOW_CATEGORIES = [
  'Product sale received',
  'Payment received - Customers',
  'Payment received - Company',
  'Commission received',
  'Other',
];

const OUTFLOW_CATEGORIES = [
  'Miscellaneous (against Invoice)',   // ← special: links to an invoice
  'Purchase',
  'Employee salary',
  'Office Rent',
  'Electricity Bill',
  'Courier',
  'Marketing/SEO/VPN',
  'Petrol expense',
  'Payment to company',
  'Payment to person',
  'Other payment',
];

const MISC_INVOICE_CATEGORY = 'Miscellaneous (against Invoice)';

interface Props {
  onClose: () => void;
  onSaved: () => void;
  banks?: { id: string; name: string; balance?: number }[];
  companies?: string[];
}

export function QuickTransactionModal({ onClose, onSaved, banks = [], companies = ['Main Office'] }: Props) {
  const [txType,    setTxType]    = React.useState<TxType>('Cash Outflow');
  const [category,  setCategory]  = React.useState(MISC_INVOICE_CATEGORY);
  const [amount,    setAmount]    = React.useState<number | ''>('');
  const [mode,      setMode]      = React.useState<Mode>('Cash');
  const [bankId,    setBankId]    = React.useState('');
  const [company,   setCompany]   = React.useState(companies[0] || 'Main Office');
  const [date,      setDate]      = React.useState(new Date().toLocaleDateString('en-CA'));
  const [paidBy,    setPaidBy]    = React.useState('');
  const [paidTo,    setPaidTo]    = React.useState('');
  const [note,      setNote]      = React.useState('');
  const [saving,    setSaving]    = React.useState(false);

  // Invoice linking (for misc expense)
  const [invoices,        setInvoices]        = React.useState<any[]>([]);
  const [linkedInvoiceId, setLinkedInvoiceId] = React.useState('');
  const [invLoading,      setInvLoading]      = React.useState(false);

  const isMiscInvoice = txType === 'Cash Outflow' && category === MISC_INVOICE_CATEGORY;
  const categories = txType === 'Cash Inflow' ? INFLOW_CATEGORIES : OUTFLOW_CATEGORIES;

  // Load invoices when the misc-invoice category is selected
  React.useEffect(() => {
    if (!isMiscInvoice) return;
    setInvLoading(true);
    getDocs(query(collection(db, 'invoices'), orderBy('date', 'desc')))
      .then(snap => setInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => setInvoices([]))
      .finally(() => setInvLoading(false));
  }, [isMiscInvoice]);

  // Reset category when switching type
  React.useEffect(() => {
    setCategory(txType === 'Cash Inflow' ? INFLOW_CATEGORIES[0] : MISC_INVOICE_CATEGORY);
  }, [txType]);

  const handleSave = async () => {
    if (!amount || amount <= 0) { toast.error('Enter an amount greater than zero'); return; }
    if (isMiscInvoice && !linkedInvoiceId) { toast.error('Select the invoice this expense is for'); return; }
    setSaving(true);
    try {
      const bank = mode === 'Bank' ? banks.find(b => b.id === bankId) : undefined;

      // ── Miscellaneous expense against invoice → use the dedicated service ──
      if (isMiscInvoice) {
        const invoice = invoices.find(i => i.id === linkedInvoiceId);
        if (!invoice) { toast.error('Invoice not found'); setSaving(false); return; }
        // Prefer what's in the company field (pre-filled from invoice or user-typed)
        const invoiceCompany = company.trim() || invoice.branch || invoice.customerCity || 'Main Office';
        await InvoiceMiscExpenseService.recordExpense({
          invoice,
          amount: Number(amount),
          category: note.trim() || 'Misc Expense',
          mode,
          date,
          bankId: bank?.id,
          bankName: bank?.name,
          note: note || undefined,
          company: invoiceCompany as any,
        });
        toast.success(`Misc expense of AED ${Number(amount).toLocaleString()} recorded against ${invoice.invoiceNumber}`);
        onSaved();
        onClose();
        return;
      }

      // ── Regular transaction ────────────────────────────────────────────────
      const txId = await TransactionFirebaseService.generateTransactionId()
        .catch(() => `TXN-${Date.now()}`);
      const time = new Date().toTimeString().split(' ')[0];

      const txData: Omit<Transaction, 'id'> = {
        transactionId:   txId,
        date,
        time,
        company,
        mainCategory:    txType,
        subCategory:     category,
        detailCategory:  note || category,
        amount:          Number(amount),
        mode,
        bankId:          mode === 'Bank'   ? bankId : undefined,
        bankName:        mode === 'Bank'   ? bank?.name : undefined,
        amountPaid:      Number(amount),
        remainingAmount: 0,
        paymentStatus:   'Full',
        totalPaid:       Number(amount),
        isFullyCleared:  mode !== 'Cheque',
        paidBy:          paidBy || undefined,
        paidTo:          paidTo || undefined,
        note:            note || category,
        partialPayments: [],
        linkedType:      'manual',
        approvalStatus:  'not_required',
        // Basic P&L / BS classification
        plMainCategory:  txType === 'Cash Inflow' ? 'Revenue' : 'Operating Expenses',
        bsMainCategory:  'Assets',
        bsSubCategory:   mode === 'Cash' ? 'Cash & Cash Equivalents' : 'Bank Balances',
      } as Omit<Transaction, 'id'>;

      await TransactionFirebaseService.createTransaction(txData);
      toast.success(`Transaction ${txId} recorded`);
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save transaction');
    } finally {
      setSaving(false);
    }
  };

  const iSty: React.CSSProperties = { width:'100%', border:'1px solid #e2e8f0', borderRadius:8, padding:'8px 11px', fontSize:13, color:'#111827', backgroundColor:'#fff', outline:'none', boxSizing:'border-box' };
  const lbl: React.CSSProperties = { fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:4 };

  return createPortal(
    <div onClick={onClose}
      style={{ position:'fixed', inset:0, backgroundColor:'rgba(15,23,42,0.5)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div onClick={e => e.stopPropagation()}
        style={{ width:560, maxWidth:'95vw', maxHeight:'92vh', backgroundColor:'#f8fafc', borderRadius:14, overflow:'hidden', boxShadow:'0 24px 64px rgba(0,0,0,0.35)', display:'flex', flexDirection:'column' }}>

        {/* Header */}
        <div style={{ backgroundColor:'#fff', padding:'14px 20px', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ fontSize:15, fontWeight:800, color:'#0f172a' }}>New Transaction</div>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:6, border:'1px solid #e2e8f0', backgroundColor:'#f8fafc', cursor:'pointer', fontSize:17, color:'#6b7280' }}>×</button>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:14 }}>

          {/* Type toggle */}
          <div style={{ display:'flex', gap:10 }}>
            {([
              { v: 'Cash Inflow',  label: 'Money In',  Icon: ArrowDownCircle, color:'#15803d', bg:'#f0fdf4', border:'#22c55e' },
              { v: 'Cash Outflow', label: 'Money Out', Icon: ArrowUpCircle,   color:'#b91c1c', bg:'#fef2f2', border:'#ef4444' },
            ] as const).map(opt => {
              const sel = txType === opt.v;
              return (
                <button key={opt.v} onClick={() => setTxType(opt.v)}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'12px', borderRadius:10, cursor:'pointer',
                    border:`2px solid ${sel?opt.border:'#e5e7eb'}`, backgroundColor:sel?opt.bg:'#fff' }}>
                  <opt.Icon size={18} color={sel?opt.color:'#94a3b8'} />
                  <span style={{ fontSize:13, fontWeight:700, color:sel?opt.color:'#374151' }}>{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Category */}
          <div style={{ backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'14px 16px' }}>
            <label style={lbl}>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...iSty, appearance:'none' }}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Invoice picker for misc expense */}
            {isMiscInvoice && (
              <div style={{ marginTop:12 }}>
                <label style={lbl}>Link to Invoice *</label>
                {invLoading ? (
                  <div style={{ fontSize:12, color:'#94a3b8', display:'flex', alignItems:'center', gap:6 }}>
                    <Loader2 size={13} style={{ animation:'spin 1s linear infinite' }}/> Loading invoices…
                  </div>
                ) : (
                  <select value={linkedInvoiceId} onChange={e => {
                      setLinkedInvoiceId(e.target.value);
                      const inv = invoices.find((x: any) => x.id === e.target.value);
                      if (inv) setCompany(inv.branch || inv.customerCity || company);
                    }} style={{ ...iSty, appearance:'none' }}>
                    <option value="">— Select invoice —</option>
                    {invoices.map((inv: any) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} — {inv.customerName} (AED {(inv.totalAmount||0).toLocaleString()})
                      </option>
                    ))}
                  </select>
                )}
                {linkedInvoiceId && (
                  <div style={{ marginTop:6, fontSize:11, color:'#2563eb', display:'flex', alignItems:'center', gap:5 }}>
                    <FileText size={12} /> This expense will be added to the invoice's Misc Exp total
                  </div>
                )}
                {/* Company / branch — pre-fills from invoice, editable */}
                <div style={{ marginTop:12 }}>
                  <label style={lbl}>Company / Branch</label>
                  <input value={company} onChange={e => setCompany(e.target.value)}
                    list="qt-companies" placeholder="e.g. Bullion Electronics - Dubai" style={iSty} />
                  <datalist id="qt-companies">
                    {companies.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
              </div>
            )}
          </div>

          {/* Amount + Mode */}
          <div style={{ backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'14px 16px', display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={lbl}>Amount (AED) *</label>
                <input type="number" min={0} step="any" value={amount}
                  onChange={e => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                  placeholder="0.00" style={iSty} autoFocus />
              </div>
              <div>
                <label style={lbl}>Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} style={iSty} />
              </div>
            </div>
            <div>
              <label style={lbl}>Payment Mode</label>
              <div style={{ display:'flex', gap:8 }}>
                {(['Cash','Bank','Cheque'] as const).map(m => (
                  <button key={m} onClick={() => setMode(m)}
                    style={{ flex:1, padding:'8px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600,
                      border:`2px solid ${mode===m?'#111827':'#e2e8f0'}`,
                      backgroundColor:mode===m?'#111827':'#fff',
                      color:mode===m?'#fff':'#6b7280' }}>{m}</button>
                ))}
              </div>
            </div>
            {mode === 'Bank' && (
              <div>
                <label style={lbl}>Bank Account</label>
                {banks.length === 0
                  ? <div style={{ fontSize:12, color:'#94a3b8', padding:'8px 12px', backgroundColor:'#f9fafb', borderRadius:7 }}>No banks — add one in Banking</div>
                  : <select value={bankId} onChange={e => setBankId(e.target.value)} style={{ ...iSty, appearance:'none' }}>
                      <option value="">Select bank…</option>
                      {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>}
              </div>
            )}
          </div>

          {/* Optional details (hidden for misc invoice for simplicity) */}
          {!isMiscInvoice && (
            <div style={{ backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'14px 16px', display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={lbl}>{txType === 'Cash Inflow' ? 'Received From' : 'Paid By'}</label>
                  <input value={txType === 'Cash Inflow' ? paidBy : paidBy} onChange={e => setPaidBy(e.target.value)} style={iSty} />
                </div>
                <div>
                  <label style={lbl}>{txType === 'Cash Inflow' ? 'Received By' : 'Paid To'}</label>
                  <input value={paidTo} onChange={e => setPaidTo(e.target.value)} style={iSty} />
                </div>
              </div>
              <div>
                <label style={lbl}>Company / Branch</label>
                <select value={company} onChange={e => setCompany(e.target.value)} style={{ ...iSty, appearance:'none' }}>
                  {companies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Note */}
          <div style={{ backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'14px 16px' }}>
            <label style={lbl}>{isMiscInvoice ? 'Expense Type / Note' : 'Note'}</label>
            <input value={note} onChange={e => setNote(e.target.value)}
              placeholder={isMiscInvoice ? 'e.g. Shipping, Customs, Agent Fee…' : 'Optional'} style={iSty} />
          </div>

        </div>

        {/* Footer */}
        <div style={{ backgroundColor:'#fff', borderTop:'1px solid #e2e8f0', padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ fontSize:13, color:'#6b7280' }}>
            Amount: <strong style={{ color: txType==='Cash Inflow'?'#15803d':'#b91c1c', fontSize:15 }}>
              AED {(Number(amount)||0).toLocaleString('en-AE',{minimumFractionDigits:2})}
            </strong>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={onClose} style={{ padding:'9px 18px', borderRadius:8, border:'1px solid #d1d5db', backgroundColor:'#fff', color:'#374151', fontWeight:600, fontSize:13, cursor:'pointer' }}>Cancel</button>
            <button onClick={handleSave} disabled={saving}
              style={{ padding:'9px 22px', borderRadius:8, border:'none', backgroundColor:saving?'#94a3b8':'#0f172a', color:'#fff', fontWeight:700, fontSize:13, cursor:saving?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:7 }}>
              {saving ? <><Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> Saving…</> : <><Check size={14}/> Save Transaction</>}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}