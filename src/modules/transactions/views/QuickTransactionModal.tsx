// Transactions Module - QuickTransactionModal (Phase 3 redesign)
//
// Rewritten to match the reference Image 2 layout:
//   • Transaction ID auto-generated and displayed at the top (read-only)
//   • Manual Date
//   • Transaction Type toggle:   Inflow  |  Outflow    (big segmented buttons)
//   • Account dropdown grouped   Cash / Bank           (with live balance per option)
//   • Category dropdown filtered by type
//   • Sub-category dropdown (optional) filtered by category, with +Add
//   • Description with 0/120 char counter
//   • Branch dropdown with +Add
//   • Total Amount * / Amount Received (partial payment)
//   • Remitter Name (Inflow only)
//   • Attachment / Receipt (required — base64 into the existing attachments[] array)
//   • Cancel / Submit
//
// Writes BOTH the new Phase 1 fields (accountId / accountType / subCategoryDetail
// / branchId / remitterName / attachmentUrl) AND the legacy ones (mainCategory /
// subCategory / mode / bankId / company) so nothing downstream breaks.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, TrendingUp, TrendingDown, Wallet, Landmark, ChevronDown,
  Plus, Loader2, Paperclip, Check, Pencil, Trash2, MapPin,
} from 'lucide-react';
import { toast } from 'sonner';
import { TransactionFirebaseService } from '../models/transactionFirebaseService';
import {
  Transaction, DynamicCategory, SUB_CATEGORIES, CASH_IN_HAND_ID, CASH_IN_HAND_NAME,
} from '../models/types';

// ── Props ───────────────────────────────────────────────────────────────────
interface Props {
  onClose: () => void;
  onSaved: () => void;
  /** Bank accounts to show as Bank-type Accounts in the dropdown. */
  banks?: { id: string; name: string; balance?: number; accountNumber?: string }[];
  /** Live Cash-in-Hand balance (computed from transactions in the parent). */
  cashBalance?: number;
  /** Legacy prop kept so existing wrappers keep compiling — mapped to branches. */
  companies?: string[];
}

type TxType = 'Inflow' | 'Outflow';

const MAX_DESC = 120;

// ── Main ────────────────────────────────────────────────────────────────────
export function QuickTransactionModal({
  onClose, onSaved,
  banks = [], cashBalance = 0, companies = [],
}: Props) {

  // ── Auto TXN ID ──────────────────────────────────────────────────────
  const [txId, setTxId] = useState('');
  useEffect(() => {
    TransactionFirebaseService.generateTransactionId()
      .then(setTxId)
      .catch(() => setTxId(`TXN-${Date.now()}`));
  }, []);

  // ── Form state ───────────────────────────────────────────────────────
  const today = () => new Date().toISOString().split('T')[0];
  const [manualDate, setManualDate] = useState(today());
  const [type, setType] = useState<TxType>('Inflow');
  const [accountId, setAccountId] = useState(CASH_IN_HAND_ID);
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [branchName, setBranchName] = useState('');
  const [totalAmount, setTotalAmount] = useState<number | ''>('');
  const [amountReceived, setAmountReceived] = useState<number | ''>('');
  const [remitterName, setRemitterName] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // Dropdown-managed data
  const [subCats, setSubCats] = useState<DynamicCategory[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [showAddSubCat, setShowAddSubCat] = useState(false);
  const [newSubCatName, setNewSubCatName] = useState('');
  const [editSubCatMode, setEditSubCatMode] = useState(false);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');

  // UI state
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  // Load categories + branches on mount
  useEffect(() => {
    TransactionFirebaseService.fetchDynamicCategories()
      .then(setSubCats)
      .catch(() => {});
    TransactionFirebaseService.fetchCompanies()
      .then(list => {
        const mapped = list.map(c => ({ id: c.id, name: c.name }));
        setBranches(mapped);
        // Seed from legacy prop if Firestore is empty
        if (mapped.length === 0 && companies.length > 0) {
          setBranches(companies.map((c, i) => ({ id: `legacy-${i}`, name: c })));
        }
      })
      .catch(() => {
        if (companies.length > 0) {
          setBranches(companies.map((c, i) => ({ id: `legacy-${i}`, name: c })));
        }
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Close account dropdown on outside click
  useEffect(() => {
    if (!accountOpen) return;
    const handler = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [accountOpen]);

  // ── Category resolution ──────────────────────────────────────────────
  // The static Categories list comes from types.SUB_CATEGORIES keyed on the
  // legacy mainCategory names ('Cash Inflow' / 'Cash Outflow'). Type-toggle
  // maps to that key for lookup.
  const mainCategoryKey = type === 'Inflow' ? 'Cash Inflow' : 'Cash Outflow';
  const availableCategories = useMemo(() => {
    return SUB_CATEGORIES[mainCategoryKey] || [];
  }, [mainCategoryKey]);

  // Sub-categories filtered by selected category (parentCategory = category)
  const availableSubCategories = useMemo(() => {
    if (!category) return [];
    return subCats.filter(
      sc => sc.type === 'subCategoryDetail' && sc.parentCategory === category,
    );
  }, [subCats, category]);

  // Reset dependent selections when parent changes
  useEffect(() => { setCategory(''); setSubCategory(''); }, [type]);
  useEffect(() => { setSubCategory(''); }, [category]);

  // ── Accounts (Cash-in-Hand + banks) ──────────────────────────────────
  const accounts = useMemo(() => {
    const list: { id: string; name: string; type: 'cash' | 'bank'; balance: number; accountNumber?: string }[] = [
      { id: CASH_IN_HAND_ID, name: CASH_IN_HAND_NAME, type: 'cash', balance: cashBalance },
    ];
    banks.forEach(b => list.push({
      id: b.id, name: b.name, type: 'bank', balance: b.balance ?? 0, accountNumber: b.accountNumber,
    }));
    return list;
  }, [banks, cashBalance]);

  const selectedAccount = accounts.find(a => a.id === accountId) || accounts[0];

  // ── Sub-category management ──────────────────────────────────────────
  const handleAddSubCat = async () => {
    const name = newSubCatName.trim();
    if (!name) return;
    if (!category) { toast.error('Pick a Category first'); return; }
    try {
      const added = await TransactionFirebaseService.addDynamicCategory({
        type: 'subCategoryDetail',
        parentCategory: category,
        name,
        createdAt: new Date().toISOString(),
      });
      setSubCats(prev => [...prev, added]);
      setSubCategory(name);
      setNewSubCatName('');
      setShowAddSubCat(false);
      toast.success(`Sub-category "${name}" added`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to add sub-category');
    }
  };

  const handleDeleteSubCat = async (sc: DynamicCategory) => {
    if (!window.confirm(`Delete sub-category "${sc.name}"?`)) return;
    try {
      await TransactionFirebaseService.deleteDynamicCategory(sc.id);
      setSubCats(prev => prev.filter(x => x.id !== sc.id));
      if (subCategory === sc.name) setSubCategory('');
      toast.success('Removed');
    } catch { toast.error('Failed to delete'); }
  };

  // ── Branch management ────────────────────────────────────────────────
  const handleAddBranch = async () => {
    const name = newBranchName.trim();
    if (!name) return;
    try {
      const added = await TransactionFirebaseService.addCompany(name);
      setBranches(prev => [...prev, { id: added.id, name: added.name }]);
      setBranchName(added.name);
      setNewBranchName('');
      setShowAddBranch(false);
      toast.success(`Branch "${name}" added`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to add branch');
    }
  };

  // ── File → base64 (used for the required receipt attachment) ─────────
  const fileToDataUrl = (f: File): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = () => rej(r.error);
      r.readAsDataURL(f);
    });

  // ── Submit ───────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    // Validation
    if (!txId) { toast.error('Transaction ID not ready'); return; }
    if (!category) { toast.error('Category is required'); return; }
    if (!totalAmount || Number(totalAmount) <= 0) { toast.error('Total amount must be greater than zero'); return; }
    if (!attachment) { toast.error('Attachment / receipt is required'); return; }
    if (selectedAccount.type === 'bank' && !selectedAccount.id) {
      toast.error('Pick a valid bank account'); return;
    }

    setSaving(true);
    try {
      // Encode receipt as data URL (kept on the existing attachments[] shape).
      const dataUrl = await fileToDataUrl(attachment);
      const attachmentEntry = {
        id: `att-${Date.now()}`,
        name: attachment.name,
        type: attachment.type || 'application/octet-stream',
        dataUrl,
        uploadedAt: new Date().toISOString(),
      };

      const total = Number(totalAmount);
      const paid  = amountReceived === '' ? total : Math.max(0, Math.min(total, Number(amountReceived)));
      const remaining = Math.max(0, total - paid);
      const isPartial = paid < total;

      const now = new Date();
      const time = now.toTimeString().split(' ')[0];
      const branchId = branches.find(b => b.name === branchName)?.id;
      const isCash = selectedAccount.type === 'cash';

      const legacyMain: 'Cash Inflow' | 'Cash Outflow' =
        type === 'Inflow' ? 'Cash Inflow' : 'Cash Outflow';

      const txData: Omit<Transaction, 'id'> = {
        transactionId:   txId,
        date:            manualDate,
        time,
        // Legacy fields (kept for backward compatibility with list/stats/exports):
        company:         branchName || 'Main Office',
        mainCategory:    legacyMain,
        subCategory:     category,
        detailCategory:  subCategory || description || category,
        amount:          total,
        mode:            isCash ? 'Cash' : 'Bank',
        bankId:          isCash ? undefined : selectedAccount.id,
        bankName:        isCash ? undefined : selectedAccount.name,
        amountPaid:      paid,
        remainingAmount: remaining,
        paymentStatus:   isPartial ? 'Partial' : 'Full',
        totalPaid:       paid,
        isFullyCleared:  !isPartial,
        paidBy:          type === 'Inflow' && remitterName ? remitterName : undefined,
        paidTo:          undefined,
        note:            description || category,
        partialPayments: [],
        linkedType:      'manual',
        approvalStatus:  'not_required',
        // Basic P&L / BS classification (kept from legacy behaviour):
        plMainCategory:  type === 'Inflow' ? 'Revenue' : 'Operating Expenses',
        bsMainCategory:  'Assets',
        bsSubCategory:   isCash ? 'Cash & Cash Equivalents' : 'Bank Balances',
        attachments:     [attachmentEntry],

        // ── Phase 1 new fields ─────────────────────────────────────────
        subCategoryDetail: subCategory || undefined,
        accountId:         selectedAccount.id,
        accountType:       selectedAccount.type,
        accountName:       selectedAccount.name,
        branchId,
        branchName:        branchName || undefined,
        remitterName:      type === 'Inflow' && remitterName ? remitterName : undefined,
        attachmentUrl:     dataUrl,
      } as Omit<Transaction, 'id'>;

      await TransactionFirebaseService.createTransaction(txData);
      toast.success(`Transaction ${txId} recorded`);
      onSaved();
      onClose();
    } catch (err: any) {
      console.error('[QuickTransactionModal] save failed:', err);
      toast.error(err?.message || 'Failed to save transaction');
    } finally {
      setSaving(false);
    }
  };

  // ── Style helpers ────────────────────────────────────────────────────
  const label: React.CSSProperties = {
    display: 'block', fontSize: 10, fontWeight: 800, color: '#94a3b8',
    letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6,
  };
  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0',
    borderRadius: 8, fontSize: 13, color: '#0f172a', backgroundColor: '#fff',
    outline: 'none', boxSizing: 'border-box',
  };
  const sel: React.CSSProperties = { ...inp, appearance: 'none', paddingRight: 28, cursor: 'pointer' };

  const modal = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)',
        zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto',
          backgroundColor: '#fff', borderRadius: 14,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.55)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Record a financial transaction</div>
          <button onClick={onClose} style={{ width: 28, height: 28, border: '1px solid #e2e8f0', borderRadius: 7, backgroundColor: '#fff', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={15} />
          </button>
        </div>

        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Transaction ID */}
          <div>
            <label style={label}>Transaction ID</label>
            <input value={txId || 'Generating…'} readOnly style={{ ...inp, fontFamily: 'monospace', color: '#4f46e5', fontWeight: 600 }} />
          </div>

          {/* Manual Date */}
          <div>
            <label style={label}>Manual Date</label>
            <input type="date" value={manualDate} onChange={e => setManualDate(e.target.value)} style={inp} />
          </div>

          {/* Transaction Type toggle */}
          <div>
            <label style={label}>Transaction Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <TypeButton active={type === 'Inflow'} onClick={() => setType('Inflow')} icon={<TrendingUp size={15} />} label="Inflow" activeColor="#c2410c" activeBg="#fff7ed" />
              <TypeButton active={type === 'Outflow'} onClick={() => setType('Outflow')} icon={<TrendingDown size={15} />} label="Outflow" activeColor="#c2410c" activeBg="#fff7ed" />
            </div>
          </div>

          {/* Account */}
          <div ref={accountRef} style={{ position: 'relative' }}>
            <label style={label}>Account</label>
            <button
              onClick={() => setAccountOpen(v => !v)}
              style={{
                width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8,
                backgroundColor: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#0f172a', fontWeight: 600 }}>
                {selectedAccount.type === 'cash'
                  ? <Wallet size={14} color="#65a30d" />
                  : <Landmark size={14} color="#2563eb" />}
                {selectedAccount.name} — {selectedAccount.balance.toLocaleString()} available
              </span>
              <ChevronDown size={14} color="#94a3b8" style={{ transform: accountOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
            </button>
            {accountOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 10,
                backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
                boxShadow: '0 8px 24px rgba(15,23,42,0.14)', overflow: 'hidden',
              }}>
                <AccountGroup title="Cash" items={accounts.filter(a => a.type === 'cash')} selectedId={accountId} onPick={id => { setAccountId(id); setAccountOpen(false); }} />
                <AccountGroup title="Bank" items={accounts.filter(a => a.type === 'bank')} selectedId={accountId} onPick={id => { setAccountId(id); setAccountOpen(false); }} />
              </div>
            )}
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
              Available in this account: {selectedAccount.balance.toLocaleString()}
            </div>
          </div>

          {/* Category */}
          <div>
            <label style={label}>Category <span style={{ color: '#dc2626' }}>*</span></label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={sel}>
              <option value="">— Select category —</option>
              {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Sub-category */}
          <div>
            <label style={label}>Sub Category <span style={{ color: '#94a3b8', fontWeight: 500 }}>(optional)</span></label>
            <div style={{ display: 'flex', gap: 6 }}>
              <select value={subCategory} onChange={e => setSubCategory(e.target.value)} disabled={!category} style={{ ...sel, flex: 1, opacity: category ? 1 : 0.6 }}>
                <option value="">
                  {!category
                    ? 'Pick a Category first'
                    : availableSubCategories.length === 0
                      ? 'No sub-categories yet'
                      : '— None —'}
                </option>
                {availableSubCategories.map(sc => <option key={sc.id} value={sc.name}>{sc.name}</option>)}
              </select>
              <button
                onClick={() => setEditSubCatMode(v => !v)}
                disabled={availableSubCategories.length === 0}
                title="Edit / remove sub-categories"
                style={btnGhost(availableSubCategories.length === 0)}
              >
                <Pencil size={12} /> Edit
              </button>
              <button
                onClick={() => { setShowAddSubCat(true); setNewSubCatName(''); }}
                disabled={!category}
                title="Add a new sub-category under this Category"
                style={btnGhost(!category)}
              >
                <Plus size={12} /> Add
              </button>
            </div>

            {/* Inline add */}
            {showAddSubCat && (
              <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                <input
                  autoFocus value={newSubCatName}
                  onChange={e => setNewSubCatName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddSubCat()}
                  placeholder={`Sub-category under "${category}"`}
                  style={{ ...inp, flex: 1 }}
                />
                <button onClick={handleAddSubCat} style={btnPrimary}>Save</button>
                <button onClick={() => { setShowAddSubCat(false); setNewSubCatName(''); }} style={btnGhost(false)}>Cancel</button>
              </div>
            )}

            {/* Inline edit list */}
            {editSubCatMode && availableSubCategories.length > 0 && (
              <div style={{ marginTop: 8, padding: '8px 10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                {availableSubCategories.map(sc => (
                  <div key={sc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
                    <span style={{ color: '#0f172a' }}>{sc.name}</span>
                    <button onClick={() => handleDeleteSubCat(sc)} title="Delete" style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label style={label}>(Max 120 Characters)</label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value.slice(0, MAX_DESC))}
              placeholder="Brief description of this transaction"
              style={inp}
            />
            <div style={{ textAlign: 'right', fontSize: 10, color: '#94a3b8', marginTop: 3 }}>
              {description.length} / {MAX_DESC}
            </div>
          </div>

          {/* Branch */}
          <div>
            <label style={label}>Branch</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <select value={branchName} onChange={e => setBranchName(e.target.value)} style={{ ...sel, flex: 1 }}>
                <option value="">— No branch —</option>
                {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
              </select>
              <button
                onClick={() => { setShowAddBranch(true); setNewBranchName(''); }}
                style={btnGhost(false)}
                title="Add a new branch"
              >
                <Plus size={12} /> Add
              </button>
            </div>
            {showAddBranch && (
              <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                <input
                  autoFocus value={newBranchName}
                  onChange={e => setNewBranchName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddBranch()}
                  placeholder="Branch name"
                  style={{ ...inp, flex: 1 }}
                />
                <button onClick={handleAddBranch} style={btnPrimary}>Save</button>
                <button onClick={() => { setShowAddBranch(false); setNewBranchName(''); }} style={btnGhost(false)}>Cancel</button>
              </div>
            )}
          </div>

          {/* Amounts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={label}>Total Amount <span style={{ color: '#dc2626' }}>*</span></label>
              <input
                type="number" min={0} step="any"
                value={totalAmount}
                onChange={e => setTotalAmount(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                placeholder="0"
                style={inp}
              />
            </div>
            <div>
              <label style={label}>Amount Received</label>
              <input
                type="number" min={0} step="any"
                value={amountReceived}
                onChange={e => setAmountReceived(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                placeholder="Leave blank if fully received"
                style={inp}
              />
            </div>
          </div>

          {/* Remitter — Inflow only */}
          {type === 'Inflow' && (
            <div>
              <label style={label}>Remitter Name <span style={{ color: '#94a3b8', fontWeight: 500 }}>(optional)</span></label>
              <input
                value={remitterName}
                onChange={e => setRemitterName(e.target.value)}
                placeholder="Who sent this money"
                style={inp}
              />
            </div>
          )}

          {/* Attachment */}
          <div>
            <label style={label}>Attachment / Receipt <span style={{ color: '#dc2626' }}>*</span></label>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', border: `1px dashed ${attachment ? '#65a30d' : '#cbd5e1'}`,
              borderRadius: 8, backgroundColor: attachment ? '#f7fee7' : '#f8fafc',
            }}>
              <label style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                borderRadius: 6, backgroundColor: '#0f172a', color: '#fff',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>
                <Paperclip size={12} /> Choose file
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={e => setAttachment(e.target.files?.[0] || null)}
                  style={{ display: 'none' }}
                />
              </label>
              <span style={{ fontSize: 12, color: attachment ? '#166534' : '#64748b', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {attachment ? attachment.name : 'No file chosen'}
              </span>
              {attachment && (
                <button onClick={() => setAttachment(null)} title="Remove" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#dc2626' }}>
                  <X size={13} />
                </button>
              )}
            </div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
              Required — a photo or PDF of the receipt/proof for this transaction.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px', borderTop: '1px solid #f1f5f9',
          display: 'flex', gap: 8, justifyContent: 'flex-end', flexShrink: 0,
        }}>
          <button onClick={onClose} style={btnGhost(saving)}>
            <X size={13} /> Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '9px 18px', borderRadius: 8, border: 'none',
            backgroundColor: saving ? '#94a3b8' : '#c2410c', color: '#fff',
            fontSize: 13, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer',
          }}>
            {saving
              ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
              : <><Check size={13} /> Submit</>}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

// ── Sub-components ──────────────────────────────────────────────────────────
function TypeButton({ active, onClick, icon, label, activeColor, activeBg }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string;
  activeColor: string; activeBg: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
        border: `1.5px solid ${active ? activeColor : '#e2e8f0'}`,
        backgroundColor: active ? activeBg : '#fff',
        color: active ? activeColor : '#334155',
        fontSize: 13, fontWeight: 700,
        transition: 'all .12s',
      }}
    >
      {icon} {label}
    </button>
  );
}

function AccountGroup({ title, items, selectedId, onPick }: {
  title: string;
  items: { id: string; name: string; type: 'cash' | 'bank'; balance: number }[];
  selectedId: string;
  onPick: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <>
      <div style={{ padding: '6px 12px 4px', fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', backgroundColor: '#f8fafc' }}>
        {title}
      </div>
      {items.map(a => (
        <div
          key={a.id}
          onClick={() => onPick(a.id)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
            padding: '10px 12px', cursor: 'pointer',
            backgroundColor: a.id === selectedId ? '#fff7ed' : '#fff',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#0f172a', fontWeight: a.id === selectedId ? 700 : 500 }}>
            {a.type === 'cash'
              ? <Wallet size={13} color="#65a30d" />
              : <Landmark size={13} color="#2563eb" />}
            {a.name}
          </span>
          <span style={{ fontSize: 12, color: '#475569', fontVariantNumeric: 'tabular-nums' }}>
            {a.balance.toLocaleString()}
          </span>
        </div>
      ))}
    </>
  );
}

// ── Style helpers ───────────────────────────────────────────────────────────
const btnPrimary: React.CSSProperties = {
  padding: '10px 14px', borderRadius: 8, border: 'none',
  backgroundColor: '#0f172a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 5,
};
const btnGhost = (disabled: boolean): React.CSSProperties => ({
  padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
  backgroundColor: '#fff', color: '#334155', fontSize: 12, fontWeight: 700,
  cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
  display: 'inline-flex', alignItems: 'center', gap: 5,
});