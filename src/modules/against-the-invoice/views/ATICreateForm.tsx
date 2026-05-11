// Against the Invoice Module — Create Form
// Records a payment (inflow) against an invoice with full transaction details.
// The backend atomically: writes ATI entry + Transaction record + debits liquidity.

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Receipt, Search, Loader2, CheckCircle,
  AlertCircle, Building2, Wallet, CreditCard, FileText,
  Banknote, X, RefreshCw, User, Tag, Users,
} from 'lucide-react';
import { Invoice } from '../../invoices/models/types';
import { AgainstInvoiceEntry, ATIPaymentMode } from '../models/types';
import { generateATIId } from '../models/atiFirebaseService';
import { InvoiceFirebaseService } from '../../invoices/models/InvoiceFirebaseService';
import { SUB_CATEGORIES } from '../../transactions/models/types';
import { CASH_LOCATIONS } from '../../banking/models/bankingService';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(n);

const COMPANIES = [...CASH_LOCATIONS] as unknown as string[];


// Sub-categories relevant to an outflow payment against an invoice
const OUTFLOW_SUB_CATEGORIES = SUB_CATEGORIES['Cash Outflow'] ?? [
  'Payment to company',
  'Payment to person',
  'Purchase',
  'Other payment',
];

interface Props {
  invoices:         Invoice[];
  isSubmitting:     boolean;
  onSubmit:         (dto: Omit<AgainstInvoiceEntry, 'id'>) => Promise<void>;
  onCancel:         () => void;
  onSearchInvoices: (query: string) => Promise<Invoice[]>;
}

/* ── Inline style constants ──────────────────────────────────────────────────── */
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
  cardBody: { padding: '20px' },
  row2: { display: 'grid' as const, gridTemplateColumns: '1fr 1fr', gap: '12px' },
  row3: { display: 'grid' as const, gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' },
};

export function ATICreateForm({ invoices, isSubmitting, onSubmit, onCancel, onSearchInvoices }: Props) {

  // ── Invoice selection ──────────────────────────────────────────────────────
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [showDropdown,  setShowDropdown]  = useState(false);
  const [selectedInv,   setSelectedInv]   = useState<Invoice | null>(null);
  const [liveInv,        setLiveInv]       = useState<Invoice | null>(null);
  const [isFetchingLive, setIsFetchingLive] = useState(false);
  const [liveError,      setLiveError]     = useState(false);
  const effectiveInv = liveInv ?? selectedInv;

  const [searchResults, setSearchResults] = useState<Invoice[]>([]);
  const [isSearching,   setIsSearching]   = useState(false);
  const debounceRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const invoiceSearchRef = useRef(invoiceSearch);
  useEffect(() => { invoiceSearchRef.current = invoiceSearch; }, [invoiceSearch]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (selectedInv && invoiceSearch === selectedInv.invoiceNumber) return;
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try   { setSearchResults(await onSearchInvoices(invoiceSearch)); }
      catch { setSearchResults([]); }
      finally { setIsSearching(false); }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [invoiceSearch, onSearchInvoices, selectedInv]);

  useEffect(() => {
    if (!invoices.length) return;
    onSearchInvoices(invoiceSearchRef.current).then(setSearchResults).catch(() => setSearchResults([]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices]);

  // ── Payment fields ─────────────────────────────────────────────────────────
  const [date,        setDate]       = useState(new Date().toISOString().split('T')[0]);
  const [amount,      setAmount]     = useState('');
  const [mode,        setMode]       = useState<ATIPaymentMode>('Cash');
  const [bankId,      setBankId]     = useState('');
  const [bankName,    setBankName]   = useState('');
  const [chequeNum,   setChequeNum]  = useState('');
  const [chequeBank,  setChequeBank] = useState('');
  const [chequeDate,  setChequeDate] = useState('');

  // ── Transaction detail fields ──────────────────────────────────────────────
  const [subCategory,       setSubCategory]       = useState(OUTFLOW_SUB_CATEGORIES[0]);
  const [paidBy,            setPaidBy]            = useState('');   // who made the payment
  const [paidTo,            setPaidTo]            = useState('');   // who received it (usually your company)
  const [accountablePerson, setAccountablePerson] = useState('');   // internal accountable staff
  const [transactionBy,     setTransactionBy]     = useState('');   // person who recorded the txn
  const [company,           setCompany]           = useState(COMPANIES[0]);
  const [description,       setDescription]       = useState('');

  const [error, setError] = useState('');

  // ── Balance calculations ─────────────────────────────────────────────────
  // ATI tracks its OWN paid/remaining — independent of invoice paidAmount.
  // Use atiPaidAmount / atiRemainingAmount from the invoice.
  // Fallback: if these ATI fields don't exist yet (older invoices), treat as 0.
  const amountClean = amount.replace(/,/g, '').trim();
  const amountNum   = Number(amountClean) || 0;

  const invoiceTotal = effectiveInv?.totalAmount ?? 0;

  const atiPaidRaw = (effectiveInv as any)?.atiPaidAmount;
  const currentPaid = (typeof atiPaidRaw === 'number' && !isNaN(atiPaidRaw))
    ? atiPaidRaw
    : 0;  // first ATI payment against this invoice

  const atiRemainingRaw = (effectiveInv as any)?.atiRemainingAmount;
  const liveRemaining = (typeof atiRemainingRaw === 'number' && !isNaN(atiRemainingRaw))
    ? Math.max(0, atiRemainingRaw)
    : Math.max(0, invoiceTotal - currentPaid);  // fallback to invoiceTotal - atiPaid

  const totalPaidAfter = currentPaid + amountNum;
  const remainingAfter = Math.max(0, liveRemaining - amountNum);
  const newStatus      = remainingAfter <= 0 ? 'Settled' : totalPaidAfter > 0 ? 'Partial' : 'Active';
  const pctAfter       = invoiceTotal > 0 ? Math.min(100, (totalPaidAfter / invoiceTotal) * 100) : 0;



  // ── Live balance fetch ─────────────────────────────────────────────────────
  const fetchLiveBalance = async (inv: Invoice) => {
    setIsFetchingLive(true);
    setLiveError(false);
    try {
      const fresh = await InvoiceFirebaseService.fetchInvoiceById(inv.id);
      setLiveInv(fresh ?? inv);
      if (!fresh) setLiveError(true);
    } catch {
      setLiveInv(inv);
      setLiveError(true);
    } finally {
      setIsFetchingLive(false);
    }
  };

  const handleSelectInvoice = (inv: Invoice) => {
    setSelectedInv(inv);
    setLiveInv(null);
    setInvoiceSearch(inv.invoiceNumber);
    setShowDropdown(false);
    setError('');
    setAmount('');
    // Pre-fill paidTo with the supplier/customer name as a convenience
    setPaidTo(inv.customerName || '');
    fetchLiveBalance(inv);
  };

  const handleClearSearch = () => {
    setInvoiceSearch(''); setSelectedInv(null); setLiveInv(null);
    setShowDropdown(false); setAmount(''); setPaidTo('');
    onSearchInvoices('').then(setSearchResults).catch(() => setSearchResults([]));
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    if (!selectedInv)        { setError('Please select an invoice'); return false; }
    if (!invoiceTotal)       { setError('Invalid invoice — total amount is 0'); return false; }
    if (isFetchingLive)      { setError('Please wait — loading live balance…'); return false; }
    if (amountNum <= 0)      { setError('Amount must be greater than 0'); return false; }
    if (amountNum > liveRemaining + 0.01) {
      setError(liveRemaining <= 0
        ? `This invoice is already fully settled (${fmt(invoiceTotal)} paid out)`
        : `Amount exceeds remaining balance of ${fmt(liveRemaining)}`);
      return false;
    }
    if (!subCategory.trim())               { setError('Please select a sub-category'); return false; }
    if (mode === 'Bank'   && !bankName.trim())  { setError('Please enter bank name'); return false; }
    if (mode === 'Cheque' && !chequeNum.trim()) { setError('Please enter cheque number'); return false; }
    return true;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    const txId = await generateATIId();
    const time = new Date().toTimeString().split(' ')[0];
    await onSubmit({

      invoiceId:     selectedInv!.id,
      invoiceNumber: selectedInv!.invoiceNumber,
      customerName:  selectedInv!.customerName,
      invoiceTotal,
      transactionId: txId,
      date, time, company,
      amount:        amountNum,
      paymentMode:   mode,
      bankId:        mode !== 'Cash' ? (bankId || undefined) : undefined,
      bankName:      mode !== 'Cash' ? bankName : undefined,
      chequeNumber:  mode === 'Cheque' ? chequeNum  : undefined,
      chequeBank:    mode === 'Cheque' ? chequeBank : undefined,
      chequeDate:    mode === 'Cheque' ? chequeDate : undefined,
      totalPaidBefore: currentPaid,
      totalPaidAfter,
      remainingAfter,
      // Cash status in Firestore uses { Paid | Partial } on Transaction/Invoice;
      // ATI uses { Settled | Partial | Active }.
      status:        newStatus as any,
      description:   description || undefined,

      // Transaction detail fields — passed through to the Transaction record
      // These are stored on the ATI entry and forwarded to atiFirebaseService
      // which writes them onto the transactions collection document.
      ...(subCategory       && { subCategory }),
      ...(paidBy            && { paidBy }),
      ...(paidTo            && { paidTo }),
      ...(accountablePerson && { accountablePerson }),
      ...(transactionBy     && { transactionBy }),
    } as any);
  };

  const paymentModes: { key: ATIPaymentMode; Icon: React.ElementType; label: string }[] = [
    { key: 'Cash',   Icon: Banknote,   label: 'Cash'   },
    { key: 'Bank',   Icon: CreditCard, label: 'Bank'   },
    { key: 'Cheque', Icon: FileText,   label: 'Cheque' },
  ];

  const dropdownItems = searchResults;

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Sticky header ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: '#fff', borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px' }}>
          <button onClick={onCancel} style={{
            padding: '7px', borderRadius: '8px', border: '1px solid #e5e7eb',
            background: '#fff', cursor: 'pointer', display: 'flex', color: '#6b7280',
          }}>
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
              Record an outflow payment to a supplier and link it to an invoice — balances updated automatically
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{
        maxWidth: '600px', margin: '0 auto',
        padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px',
      }}>

        {/* ══ 1. SELECT INVOICE ══════════════════════════════════════════════ */}
        <div style={S.card}>
          <div style={S.cardHead('#f1f5f9')}>
            <FileText size={14} color="#334155" />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Select Invoice
            </span>
          </div>
          <div style={S.cardBody}>
            <label style={S.label}>Search Invoice <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>
              Search by invoice number, customer name, phone, CNIC, amount, city, date, or status
            </div>
            <div style={{ position: 'relative' }}>
              {isSearching
                ? <Loader2 size={14} color="#9ca3af" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                : <Search  size={14} color="#9ca3af" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              }
              <input
                value={invoiceSearch}
                onChange={e => { setInvoiceSearch(e.target.value); setShowDropdown(true); setSelectedInv(null); setLiveInv(null); }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 180)}
                placeholder="Type invoice #, customer name, amount, city..."
                style={{ ...S.input, paddingLeft: '36px', paddingRight: invoiceSearch ? '36px' : '14px' }}
              />
              {invoiceSearch && (
                <button type="button" onClick={handleClearSearch} style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '2px',
                }}>
                  <X size={13} />
                </button>
              )}

              {/* Dropdown */}
              {showDropdown && (
                <div style={{
                  position: 'absolute', zIndex: 30, width: '100%', marginTop: '4px',
                  background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.12)', maxHeight: '280px', overflowY: 'auto',
                }}>
                  {isSearching && dropdownItems.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <Loader2 size={14} /> Searching…
                    </div>
                  )}
                  {!isSearching && dropdownItems.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: '#9ca3af' }}>
                      No invoices found for &ldquo;{invoiceSearch}&rdquo;
                    </div>
                  )}
                  {dropdownItems.map(inv => {
                    // Use ATI-own paid field; fallback 0 for invoices not yet in ATI
                    const paid      = Number((inv as any).atiPaidAmount) || 0;
                    const remaining = Math.max(0, inv.totalAmount - paid);
                    const paidPct   = inv.totalAmount > 0 ? Math.round((paid / inv.totalAmount) * 100) : 0;
                    return (
                      <button
                        key={inv.id} type="button"
                        onMouseDown={() => handleSelectInvoice(inv)}
                        style={{
                          width: '100%', textAlign: 'left', padding: '10px 14px',
                          borderBottom: '1px solid #f9fafb', background: 'none', border: 'none',
                          cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827', fontFamily: 'monospace' }}>
                              {inv.invoiceNumber}
                            </span>
                            {inv.paymentStatus && (
                              <span style={{
                                fontSize: '10px', padding: '1px 7px', borderRadius: '999px', fontWeight: 600,
                                background: inv.paymentStatus === 'Paid' ? '#dcfce7' : inv.paymentStatus === 'Partial' ? '#fef9c3' : '#fee2e2',
                                color:      inv.paymentStatus === 'Paid' ? '#15803d' : inv.paymentStatus === 'Partial' ? '#92400e' : '#b91c1c',
                              }}>
                                {inv.paymentStatus}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: '#374151', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {inv.customerName}
                          </div>
                          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>
                            {inv.date} · {inv.customerCity || inv.customerProvince || ''}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: remaining > 0 ? '#dc2626' : '#16a34a' }}>
                            {fmt(remaining)} left
                          </div>
                          <div style={{ fontSize: '11px', color: '#9ca3af' }}>{fmt(inv.totalAmount)} total</div>
                          <div style={{ fontSize: '11px', color: '#9ca3af' }}>{paidPct}% paid</div>
                        </div>
                      </button>
                    );
                  })}
                  {!invoiceSearch.trim() && dropdownItems.length > 0 && (
                    <div style={{ padding: '8px 14px', fontSize: '11px', color: '#c4c9d4', textAlign: 'center', borderTop: '1px solid #f3f4f6' }}>
                      Showing {dropdownItems.length} most recent · type to search all
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected invoice strip */}
            {selectedInv && (
              <div style={{
                marginTop: '12px', padding: '12px 14px',
                background: isFetchingLive ? '#f9fafb' : liveError ? '#fffbeb' : '#f1f5f9',
                border: `1.5px solid ${isFetchingLive ? '#e5e7eb' : liveError ? '#fde68a' : '#cbd5e1'}`,
                borderRadius: '8px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Selected Invoice
                      {isFetchingLive && <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: 400, display: 'flex', alignItems: 'center', gap: '3px' }}><Loader2 size={10} /> fetching live balance…</span>}
                      {liveError && !isFetchingLive && <span style={{ fontSize: '10px', color: '#b45309', fontWeight: 400 }}>⚠ using cached balance</span>}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                      {selectedInv.invoiceNumber} · {selectedInv.customerName}
                    </div>
                    {selectedInv.customerCity && (
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                        {selectedInv.customerCity}{selectedInv.customerProvince ? `, ${selectedInv.customerProvince}` : ''}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button type="button" onClick={() => selectedInv && fetchLiveBalance(selectedInv)}
                      disabled={isFetchingLive} title="Refresh live balance"
                      style={{ padding: '4px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: isFetchingLive ? 'not-allowed' : 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', opacity: isFetchingLive ? 0.5 : 1 }}>
                      <RefreshCw size={12} />
                    </button>
                    {!isFetchingLive && !liveError && <CheckCircle size={15} color="#334155" />}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                  {isFetchingLive ? <span style={{ color: '#9ca3af' }}>Loading live balance…</span> : (
                    <>
                      <span>Invoice Total <strong style={{ color: '#111827' }}>{fmt(invoiceTotal)}</strong></span>
                      <span>ATI Collected <strong style={{ color: '#16a34a' }}>{fmt(currentPaid)}</strong></span>
                      <span>Left to Collect <strong style={{ color: liveRemaining > 0 ? '#0f172a' : '#16a34a' }}>{fmt(liveRemaining)}</strong></span>
                    </>
                  )}
                </div>
                {!isFetchingLive && liveRemaining <= 0 && invoiceTotal > 0 && (
                  <div style={{ marginTop: '8px', padding: '7px 10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '12px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={13} /> All payments against this invoice have been collected — ATI balance is zero.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ══ 2. PAYMENT DETAILS ═════════════════════════════════════════════ */}
        <div style={S.card}>
          <div style={S.cardHead('#f0fdf4')}>
            <Wallet size={14} color="#22c55e" />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Payment Details
            </span>
          </div>
          <div style={S.cardBody}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              <div style={S.row2}>
                <div>
                  <label style={S.label}>Date <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} style={S.input} />
                </div>
                <div>
                  <label style={S.label}>Amount (PKR) <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="number" value={amount} onChange={e => setAmount(e.target.value)}
                    placeholder="0" min={1}
                    max={liveRemaining > 0 ? liveRemaining : undefined}
                    style={{ ...S.input, borderColor: amountNum > liveRemaining && liveRemaining > 0 ? '#fca5a5' : '#d1d5db' }}
                  />
                  {selectedInv && !isFetchingLive && liveRemaining > 0 && (
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>Max: {fmt(liveRemaining)}</div>
                  )}
                </div>
              </div>

              {/* Payment Mode */}
              <div>
                <label style={S.label}>Payment Mode <span style={{ color: '#ef4444' }}>*</span></label>
                <div style={S.row3}>
                  {paymentModes.map(({ key, Icon, label: ml }) => {
                    const active = mode === key;
                    return (
                      <button key={key} type="button" onClick={() => setMode(key)} style={{
                        padding: '12px 8px', borderRadius: '8px',
                        border: `2px solid ${active ? '#0f172a' : '#e5e7eb'}`,
                        background: active ? '#f1f5f9' : '#fff',
                        color: active ? '#1e293b' : '#6b7280',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                        fontSize: '12px', fontWeight: active ? 700 : 500,
                        cursor: 'pointer', transition: 'all 0.15s',
                        boxShadow: active ? '0 0 0 3px rgba(15,23,42,0.12)' : 'none',
                      }}>
                        <Icon size={18} color={active ? '#0f172a' : '#9ca3af'} />
                        {ml}
                      </button>
                    );
                  })}
                </div>
              </div>

              {mode === 'Bank' && (
                <div style={S.row2}>
                  <div>
                    <label style={S.label}>Bank Name <span style={{ color: '#ef4444' }}>*</span></label>
                    <input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. HBL, MCB, UBL…" style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>Bank ID (optional)</label>
                    <input value={bankId} onChange={e => setBankId(e.target.value)} placeholder="Firestore bank doc id" style={S.input} />
                  </div>
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

        {/* ══ 3. TRANSACTION DETAILS ═════════════════════════════════════════ */}
        <div style={S.card}>
          <div style={S.cardHead('#fff7ed')}>
            <Tag size={14} color="#f97316" />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Transaction Details
            </span>
            <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: 'auto' }}>
              Saved to transactions ledger
            </span>
          </div>
          <div style={S.cardBody}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Sub-category */}
              <div>
                <label style={S.label}>Sub-Category <span style={{ color: '#ef4444' }}>*</span></label>
                <select value={subCategory} onChange={e => setSubCategory(e.target.value)} style={S.input}>
                  {OUTFLOW_SUB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                  Categorises this payment in your transactions ledger under Cash Outflow
                </div>
              </div>

              {/* Paid By / Paid To */}
              <div style={S.row2}>
                <div>
                  <label style={S.label}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <User size={10} /> Paid By
                    </span>
                  </label>
                  <input
                    value={paidBy} onChange={e => setPaidBy(e.target.value)}
                    placeholder="Your company / payer"
                    style={S.input}
                  />
                </div>
                <div>
                  <label style={S.label}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <User size={10} /> Paid To
                    </span>
                  </label>
                  <input
                    value={paidTo} onChange={e => setPaidTo(e.target.value)}
                    placeholder="Supplier / recipient"
                    style={S.input}
                  />
                </div>
              </div>

              {/* Accountable Person / Transaction By */}
              <div style={S.row2}>
                <div>
                  <label style={S.label}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users size={10} /> Accountable Person
                    </span>
                  </label>
                  <input
                    value={accountablePerson} onChange={e => setAccountablePerson(e.target.value)}
                    placeholder="Internal staff responsible"
                    style={S.input}
                  />
                </div>
                <div>
                  <label style={S.label}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users size={10} /> Transaction By
                    </span>
                  </label>
                  <input
                    value={transactionBy} onChange={e => setTransactionBy(e.target.value)}
                    placeholder="Who recorded this"
                    style={S.input}
                  />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ══ 4. ADDITIONAL DETAILS ══════════════════════════════════════════ */}
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
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                  Also used to identify the cash account when payment mode is Cash
                </div>
              </div>
              <div>
                <label style={S.label}>Description / Note</label>
                <textarea
                  value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Optional note about this payment…"
                  rows={3}
                  style={{ ...S.input, resize: 'none', lineHeight: '1.5' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ══ 5. BALANCE PREVIEW ═════════════════════════════════════════════ */}
        {selectedInv && !isFetchingLive && amountNum > 0 && liveRemaining > 0 && amountNum <= liveRemaining + 0.01 && (
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
                  { label: 'Invoice Total', value: fmt(invoiceTotal), color: '#111827' },
                  { label: 'Already Paid',  value: fmt(currentPaid),  color: '#6b7280' },
                  { label: 'This Payment',  value: `+ ${fmt(amountNum)}`, color: '#0f172a' },
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

              {/* What gets recorded info strip */}
              <div style={{ marginTop: '14px', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  What gets recorded
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {[
                      { dot: '#22c55e', text: `ATI entry linked to ${selectedInv?.invoiceNumber}` },
                      { dot: '#3b82f6', text: `Transaction: Cash Outflow / ${subCategory}` },
                      { dot: '#f97316', text: mode === 'Cash' ? `Cash balance debited at ${company.split(' - ')[1] || company}` : `Bank balance debited (${bankName || 'selected bank'})` },
                    ].map(({ dot, text }) => (

                    <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#6b7280' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: dot, flexShrink: 0 }} />
                      {text}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '12px' }}>
                <div style={{ width: '100%', height: '6px', background: '#e5e7eb', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '999px', width: `${pctAfter}%`,
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

        {/* ══ ERROR ══════════════════════════════════════════════════════════ */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 14px', background: '#fef2f2',
            border: '1px solid #fecaca', borderRadius: '8px',
            fontSize: '13px', color: '#b91c1c',
          }}>
            <AlertCircle size={15} color="#ef4444" style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* ══ ACTIONS ════════════════════════════════════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', paddingBottom: '32px' }}>
          <button type="button" onClick={onCancel} style={{
            padding: '12px', borderRadius: '8px',
            border: '1.5px solid #d1d5db', background: '#fff',
            color: '#374151', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isFetchingLive || (!!selectedInv && !isFetchingLive && liveRemaining <= 0)}

            style={{
              padding: '12px', borderRadius: '8px', border: 'none',
              background: '#0f172a', color: '#fff',
              fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              boxShadow: '0 2px 6px rgba(15,23,42,0.35)',
              opacity: (isSubmitting || isFetchingLive || (!!selectedInv && !isFetchingLive && liveRemaining <= 0)) ? 0.5 : 1,
            }}
          >
            {isSubmitting   ? <><Loader2 size={14} className="animate-spin" /> Recording…</>
            : isFetchingLive ? <><Loader2 size={14} className="animate-spin" /> Loading balance…</>
            : <><CheckCircle size={14} /> Record Payment</>}
          </button>
        </div>
      </form>
    </div>
  );
}