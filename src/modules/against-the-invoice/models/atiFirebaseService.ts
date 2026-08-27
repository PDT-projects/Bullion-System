// Against the Invoice Module — Firebase Service (UPDATED)
// Enhanced with original invoice liquidity deduction and reversal
// 
// Flow:
//   1. Read invoice's original liquidity source (bank or cash)
//   2. Validate payment amount against remaining liquidity
//   3. Deduct from original liquidity pool (bank or cashInHand)
//   4. Create ATI entry + ledger records (existing logic)
//   5. On delete, restore everything
//
// FIX (2026-06-03): Transactions now correctly classified as 'Cash Outflow'
// instead of 'Cash Inflow'. ATI represents payments made AGAINST invoices
// (money going out), not collections coming in.

import {
  collection, getDocs, getDoc, addDoc, updateDoc,
  deleteDoc, doc, query, orderBy, where,
  runTransaction as firestoreRunTransaction,
  DocumentReference, DocumentData,
} from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { AgainstInvoiceEntry, InvoiceBalanceSummary, ATIStatus } from './types';

const COLLECTION      = 'againstInvoiceEntries';
const COUNTER_COL     = 'atiCounters';
const INVOICE_COL     = 'invoices';
const TXN_COL         = 'transactions';
const TXN_COUNTER_COL = 'transactionCounters';
const BANK_COL        = 'banks';
const BANK_TXN_COL    = 'bank_transactions';
const CASH_BAL_COL    = 'cashInHand';
const CASH_TXN_COL    = 'cash_transactions';

// ── Helpers ───────────────────────────────────────────────────────────────────

function clean(obj: Record<string, any>): Record<string, any> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

function docToATI(d: any): AgainstInvoiceEntry {
  const data = d.data ? d.data() : d;
  return {
    id:                       d.id,
    invoiceId:                data.invoiceId             || '',
    invoiceNumber:            data.invoiceNumber         || '',
    customerName:             data.customerName          || '',
    invoiceTotal:             data.invoiceTotal          || 0,
    transactionId:            data.transactionId         || '',
    date:                     data.date                  || '',
    time:                     data.time,
    company:                  data.company               || '',
    amount:                   data.amount                || 0,
    paymentMode:              data.paymentMode           || 'Cash',
    bankId:                   data.bankId,
    bankName:                 data.bankName,
    chequeNumber:             data.chequeNumber,
    chequeBank:               data.chequeBank,
    chequeDate:               data.chequeDate,
    totalPaidBefore:          data.totalPaidBefore       || 0,
    totalPaidAfter:           data.totalPaidAfter        || 0,
    remainingAfter:           data.remainingAfter        || 0,
    status:                   data.status                || 'Active',
    description:              data.description,
    createdBy:                data.createdBy,
    createdAt:                data.createdAt,
    updatedAt:                data.updatedAt,
    // ✨ Original liquidity linkage fields
    originalLiquiditySource:  data.originalLiquiditySource,
    originalLiquidityDocId:   data.originalLiquidityDocId,
    originalLiquidityAmount:  data.originalLiquidityAmount,
    // Existing transaction linkage fields
    linkedTransactionId:      data.linkedTransactionId,
    linkedBankTxnId:          data.linkedBankTxnId,
    liquiditySource:          data.liquiditySource,
    liquidityDocId:           data.liquidityDocId,
  } as AgainstInvoiceEntry;
}

// ── Auto-generate ATI Transaction ID ─────────────────────────────────────────
export async function generateATIId(): Promise<string> {
  const now = new Date();
  const dd  = String(now.getDate()).padStart(2, '0');
  const mm  = String(now.getMonth() + 1).padStart(2, '0');
  const yy  = String(now.getFullYear()).slice(-2);
  const key = `${dd}${mm}${yy}`;
  const ref = doc(db, COUNTER_COL, key);

  try {
    const next = await firestoreRunTransaction(db, async (txn) => {
      const snap = await txn.get(ref);
      const n    = snap.exists() ? (snap.data().count || 0) + 1 : 1;
      txn.set(ref, { date: key, count: n }, { merge: true });
      return n;
    });
    return `ATI-${key}-${String(next).padStart(3, '0')}`;
  } catch {
    return `ATI-${key}-${String(Date.now()).slice(-3)}`;
  }
}


export class ATIFirebaseService {

  // ── Fetch all ─────────────────────────────────────────────────────────────
  static async fetchAll(): Promise<AgainstInvoiceEntry[]> {
    try {
      const q        = query(collection(db, COLLECTION), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docToATI);
    } catch (error) {
      console.error('❌ ATI fetchAll:', error);
      throw new Error('Failed to fetch ATI entries');
    }
  }

  // ── Fetch by invoice ──────────────────────────────────────────────────────
  static async fetchByInvoice(invoiceId: string): Promise<AgainstInvoiceEntry[]> {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('invoiceId', '==', invoiceId),
        orderBy('date', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docToATI);
    } catch (error) {
      console.error('❌ ATI fetchByInvoice:', error);
      throw new Error('Failed to fetch ATI entries for invoice');
    }
  }

  // ── Create entry — ATOMIC transaction (UPDATED) ──────────────────────────
  // 
  // NEW STEP: Deduct from original invoice liquidity pool
  //
  // All operations happen inside one runTransaction call.
  // If any step throws, Firestore rolls back everything automatically.
  static async createEntry(dto: Omit<AgainstInvoiceEntry, 'id'>): Promise<AgainstInvoiceEntry> {
    const now        = new Date();
    const nowISO     = now.toISOString();
    const invoiceRef = doc(db, INVOICE_COL, dto.invoiceId);

    const newAtiRef    = doc(collection(db, COLLECTION));
    const newTxnRef    = doc(collection(db, TXN_COL));
    const newLedgerRef = doc(collection(db, dto.paymentMode === 'Cash' ? CASH_TXN_COL : BANK_TXN_COL));

    // ── Pre-check: does the cashInHand doc exist? ──────────────────────────
    // We do this OUTSIDE the transaction so that if it doesn't exist, Firestore
    // won't bake a `verify:{exists:false}` precondition into the commit that
    // security rules then deny with permission-denied.
    let cashDocId: string | null = null;
    if (dto.paymentMode === 'Cash') {
      // Map branch display names to their cashInHand document IDs.
      // Add entries here whenever a new branch is added.
      const BRANCH_TO_CASH_DOC: Record<string, string> = {
        'saudi arabia': 'saudiarabia',
        'sudan':        'sudan',
        'dubai':        'dubai',
        'chad':         'chad',
        // legacy / fallback slugs
        'islamabad':    'islamabad',
        'lahore':       'lahore',
        'karachi':      'karachi',
      };
      const companyKey = (dto.company || '').toLowerCase().trim();
      // Try exact map first, then fall back to stripping spaces
      const companySuffix =
        BRANCH_TO_CASH_DOC[companyKey] ??
        (dto.company?.includes(' - ')
          ? dto.company.split(' - ').pop()!.toLowerCase().replace(/\s+/g, '')
          : companyKey.replace(/\s+/g, ''));
      const preCheckSnap = await getDoc(doc(db, CASH_BAL_COL, companySuffix));
      if (preCheckSnap.exists()) {
        cashDocId = companySuffix;
      } else {
        console.warn(`ℹ️ cashInHand doc "${companySuffix}" not found — cash balance will not be updated`);
      }
    }

    // ── Pre-compute true atiPaidBefore by summing all existing ATI entries ──
    // We do this OUTSIDE the Firestore transaction because transactions cannot
    // run collection queries (getDocs). The stored inv.atiPaidAmount can be
    // stale if entries were deleted or if an older bug wrote a wrong value.
    // Summing live entries is always accurate regardless of stored field state.
    let atiPaidBeforeVerified = 0;
    try {
      const existingEntries = await getDocs(
        query(collection(db, COLLECTION), where('invoiceId', '==', dto.invoiceId))
      );
      atiPaidBeforeVerified = existingEntries.docs.reduce(
        (sum, d) => sum + (Number(d.data().amount) || 0), 0
      );
      console.log(`ℹ️ ATI live sum for invoice ${dto.invoiceId}: PKR ${atiPaidBeforeVerified.toLocaleString()} (${existingEntries.size} entries)`);
    } catch (sumErr) {
      console.warn('⚠️ Could not sum existing ATI entries — falling back to stored atiPaidAmount', sumErr);
      // fallback: will be read from invoice doc inside the transaction
      atiPaidBeforeVerified = -1; // sentinel: use stored value
    }

    try {
      const saved = await firestoreRunTransaction(db, async (txn) => {

        // ════════════════════════════════════════════════════════════════════
        // PHASE 1 — ALL READS  (Firestore requires reads before any writes)
        // ════════════════════════════════════════════════════════════════════

        // ── 1. Read LIVE invoice ─────────────────────────────────────────────
        const invoiceSnap = await txn.get(invoiceRef);
        if (!invoiceSnap.exists()) {
          throw new Error(`Invoice "${dto.invoiceId}" not found in Firestore`);
        }
        const inv          = invoiceSnap.data();
        const invoiceTotal = Number(inv.totalAmount) || 0;

        // ── ATI paid before: use verified live sum; fall back to stored field ─
        // The stored inv.atiPaidAmount can be stale after deletes or buggy writes.
        // The live sum computed above is always accurate.
        const atiPaidBefore = atiPaidBeforeVerified >= 0
          ? atiPaidBeforeVerified
          : (Number(inv.atiPaidAmount) || 0);

        const atiRemainingBefore = Math.max(0, invoiceTotal - atiPaidBefore);

        // ── Validate amount against ATI balance ──────────────────────────────
        if (dto.amount <= 0) {
          throw new Error('Payment amount must be greater than 0');
        }
        if (dto.amount > atiRemainingBefore + 0.01) {
          throw new Error(
            atiRemainingBefore <= 0
              ? `This invoice is already fully collected (ATI total: PKR ${invoiceTotal.toLocaleString()})`
              : `Amount exceeds ATI remaining balance of PKR ${atiRemainingBefore.toLocaleString()}`
          );
        }

        // ── 2. Read original liquidity source (bank/cash that funded invoice) ─
        const originalLiquiditySource = inv.originalLiquiditySource as 'bank' | 'cash' | undefined;
        const originalLiquidityDocId  = inv.originalLiquidityDocId  as string | undefined;

        let origLiquidityBalance: number | null = null;
        let origLiquidityRef: ReturnType<typeof doc> | null = null;

        if (originalLiquiditySource === 'bank' && originalLiquidityDocId) {
          origLiquidityRef = doc(db, BANK_COL, originalLiquidityDocId);
          const snap = await txn.get(origLiquidityRef);
          if (snap.exists()) origLiquidityBalance = Number(snap.data().balance) || 0;
        } else if (originalLiquiditySource === 'cash' && originalLiquidityDocId) {
          origLiquidityRef = doc(db, CASH_BAL_COL, originalLiquidityDocId);
          const snap = await txn.get(origLiquidityRef);
          if (snap.exists()) origLiquidityBalance = Number(snap.data().balance) || 0;
        } else {
          console.warn(`ℹ️ Invoice ${dto.invoiceId} has no originalLiquiditySource — liquidity not updated`);
        }

        // ── 3. Read transaction counter ──────────────────────────────────────
        const dd  = String(now.getDate()).padStart(2, '0');
        const mm  = String(now.getMonth() + 1).padStart(2, '0');
        const yy  = String(now.getFullYear()).slice(-2);
        const counterKey = `${dd}${mm}${yy}`;
        const txnCounterRef = doc(db, TXN_COUNTER_COL, counterKey);
        const txnCounterSnap = await txn.get(txnCounterRef);
        const txnCounterNext = txnCounterSnap.exists() ? (txnCounterSnap.data().count || 0) + 1 : 1;
        const txnId = `TXN-${counterKey}-${String(txnCounterNext).padStart(3, '0')}`;

        // ── 4. Determine payment-mode liquidity and read its balance ─────────
        let liquiditySource: 'bank' | 'cash';
        let liquidityDocId: string;
        let paymentLiquidityBalance: number | null = null;
        let paymentLiquidityRef: ReturnType<typeof doc> | null = null;

        if (dto.paymentMode === 'Bank' || dto.paymentMode === 'Cheque') {
          liquiditySource = 'bank';
          liquidityDocId  = dto.bankId || '';
          if (dto.bankId) {
            paymentLiquidityRef = doc(db, BANK_COL, dto.bankId);
            const snap = await txn.get(paymentLiquidityRef);
            if (snap.exists()) paymentLiquidityBalance = Number(snap.data().balance) || 0;
          }
        } else {
          liquiditySource = 'cash';
          liquidityDocId  = cashDocId ?? '';
          // Only read inside the transaction if the pre-check confirmed the doc exists.
          // Skipping the read prevents Firestore from adding verify:{exists:false}
          // which security rules deny with permission-denied.
          if (cashDocId) {
            paymentLiquidityRef = doc(db, CASH_BAL_COL, cashDocId);
            const snap = await txn.get(paymentLiquidityRef);
            if (snap.exists()) paymentLiquidityBalance = Number(snap.data().balance) || 0;
          }
        }

        // ════════════════════════════════════════════════════════════════════
        // PHASE 2 — COMPUTE derived values (pure logic, no Firestore calls)
        // ════════════════════════════════════════════════════════════════════

        const paidBefore     = atiPaidBefore;
        const paidAfter      = atiPaidBefore + dto.amount;
        const remainingAfter = Math.max(0, invoiceTotal - paidAfter);

        let atiStatus: ATIStatus = 'Active';
        if      (remainingAfter <= 0) atiStatus = 'Settled';
        else if (paidAfter > 0)       atiStatus = 'Partial';

        // ════════════════════════════════════════════════════════════════════
        // PHASE 3 — ALL WRITES
        // ════════════════════════════════════════════════════════════════════

        // ── Write transaction counter ────────────────────────────────────────
        txn.set(txnCounterRef, { date: counterKey, count: txnCounterNext }, { merge: true });

        // ── Write transaction record ─────────────────────────────────────────
        //
        // IMPORTANT — all four payment-status fields must be set explicitly so that
        // isPending() / getTransactionTotals() in transactionsService immediately
        // return "not pending".  Leaving them undefined causes the service to
        // compute totalPaid = 0 and remainingAmount = amount, which makes every
        // ATI payment appear as an unpaid payable in Pending Payments.
        //
        // mode must match the Transaction type ('Cash' | 'Bank' | 'Cheque') so the
        // Banking Activity Report and Cash-in-Hand ledger pick it up correctly.
        //
        // FIX: type and mainCategory changed from 'Cash Inflow' → 'Cash Outflow'
        // because ATI records payments going OUT against invoices owed.
        const txnMode: 'Cash' | 'Bank' | 'Cheque' =
          dto.paymentMode === 'Bank'   ? 'Bank'   :
          dto.paymentMode === 'Cheque' ? 'Cheque' : 'Cash';

        // Balance-sheet bucket: paying against an invoice reduces
        // Cash or Bank assets, depending on payment mode.
        const bsSubCategory =
          txnMode === 'Bank' || txnMode === 'Cheque'
            ? 'Bank Balances'
            : 'Cash & Cash Equivalents';

        const txnPayload = clean({
          transactionId:   txnId,
          // ✅ FIX: was 'Cash Inflow' — ATI payments are outflows
          type:            'Cash Outflow',
          mainCategory:    'Cash Outflow',
          subCategory:     'Payment Against Invoice',
          detailCategory:  `Invoice: ${dto.invoiceNumber} — ${dto.customerName}`,
          amount:          dto.amount,
          // ── Payment status fields (prevent Pending Payments false-positive) ──
          amountPaid:      dto.amount,
          remainingAmount: 0,
          totalPaid:       dto.amount,
          paymentStatus:   'Full',
          isFullyCleared:  txnMode !== 'Cheque',   // cheques need manual bank clearance
          // ── Mode / bank linkage ──────────────────────────────────────────────
          mode:            txnMode,
          bankId:          txnMode !== 'Cash' ? dto.bankId   : undefined,
          bankName:        txnMode !== 'Cash' ? dto.bankName : undefined,
          chequeNumber:    txnMode === 'Cheque' ? dto.chequeNumber : undefined,
          chequeBank:      txnMode === 'Cheque' ? dto.chequeBank   : undefined,
          chequeDate:      txnMode === 'Cheque' ? dto.chequeDate   : undefined,
          // ── Who was paid ─────────────────────────────────────────────────────
          paidTo:          dto.customerName,
          // ── Other fields ────────────────────────────────────────────────────
          date:            dto.date,
          time:            now.toTimeString().split(' ')[0],
          company:         dto.company,
          invoiceId:       dto.invoiceId,
          invoiceNumber:   dto.invoiceNumber,
          customerName:    dto.customerName,
          note:            dto.description || `ATI payment against invoice ${dto.invoiceNumber}`,
          linkedATI:       newAtiRef.id,
          linkedType:      'ati',
          linkedId:        dto.invoiceNumber,
          approvalStatus:  'not_required',
          // ── P&L classification (Expense) ─────────────────────────────────────
          // ✅ FIX: was 'Revenue' / 'Collection Against Invoice'
          plMainCategory:  'Expense',
          plSubCategory:   'Payment Against Invoice',
          // ── Balance-sheet classification ─────────────────────────────────────
          bsMainCategory:  'Assets',
          bsSubCategory,
          createdAt:       nowISO,
        });
        txn.set(newTxnRef, txnPayload);

        // ── Write ledger entry + update payment-mode account balance ─────────
        if (dto.paymentMode === 'Bank' || dto.paymentMode === 'Cheque') {
          const ledgerPayload = clean({
            bankId:        dto.bankId,
            bankName:      dto.bankName,
            date:          dto.date,
            // ✅ FIX: was 'credit' — outgoing payment is a debit on the bank account
            type:          'debit',
            amount:        dto.amount,
            description:   `ATI payment: invoice ${dto.invoiceNumber} — ${dto.customerName}`,
            reference:     newAtiRef.id,
            invoiceId:     dto.invoiceId,
            createdAt:     nowISO,
          });
          txn.set(newLedgerRef, ledgerPayload);

          if (paymentLiquidityRef !== null && paymentLiquidityBalance !== null) {
            // ✅ FIX: was + dto.amount (credit) — outflow debits the bank balance
            txn.update(paymentLiquidityRef, { balance: paymentLiquidityBalance - dto.amount, updatedAt: nowISO });
            console.log(`🏦 Debited PKR ${dto.amount.toLocaleString()} from payment bank: ${dto.bankId}`);
          } else {
            console.warn(`⚠️ Payment bank doc "${dto.bankId}" not found — bank balance not updated`);
          }
        } else {
          const ledgerPayload = clean({
            // ✅ FIX: was 'Cash Inflow'
            mainCategory:   'Cash Outflow',
            subCategory:    'Payment Against Invoice',
            company:        dto.company,
            location:       dto.company,
            amount:         dto.amount,
            date:           dto.date,
            note:           `ATI payment: invoice ${dto.invoiceNumber} — ${dto.customerName}`,
            reference:      newAtiRef.id,
            createdAt:      nowISO,
          });
          txn.set(newLedgerRef, ledgerPayload);

          if (paymentLiquidityRef !== null && paymentLiquidityBalance !== null) {
            // ✅ FIX: was + dto.amount (credit) — outflow debits the cash balance
            txn.update(paymentLiquidityRef, {
              balance:     paymentLiquidityBalance - dto.amount,
              lastUpdated: nowISO,
              updatedBy:   'System (ATI invoice payment)',
            });
            console.log(`💵 Debited PKR ${dto.amount.toLocaleString()} from cash: ${liquidityDocId}`);
          } else {
            console.warn(`⚠️ cashInHand doc "${liquidityDocId}" not found — cash balance not updated`);
          }
        }

        // ── Write original liquidity credit (restore the pool that funded invoice)
        if (origLiquidityRef !== null && origLiquidityBalance !== null) {
          if (originalLiquiditySource === 'bank') {
            txn.update(origLiquidityRef, { balance: origLiquidityBalance + dto.amount, updatedAt: nowISO });
            console.log(`💳 Credited PKR ${dto.amount.toLocaleString()} back to original bank: ${originalLiquidityDocId}`);
          } else {
            txn.update(origLiquidityRef, {
              balance:     origLiquidityBalance + dto.amount,
              lastUpdated: nowISO,
              updatedBy:   'System (ATI invoice payment)',
            });
            console.log(`💰 Credited PKR ${dto.amount.toLocaleString()} back to original cash: ${originalLiquidityDocId}`);
          }
        }

        // ── Write ATI entry ──────────────────────────────────────────────────
        const atiPayload = clean({
          invoiceId:            dto.invoiceId,
          invoiceNumber:        dto.invoiceNumber,
          customerName:         dto.customerName,
          invoiceTotal:         invoiceTotal,
          transactionId:        txnId,
          date:                 dto.date,
          time:                 dto.time,
          company:              dto.company,
          amount:               dto.amount,
          paymentMode:          dto.paymentMode,
          bankId:               dto.bankId,
          bankName:             dto.bankName,
          chequeNumber:         dto.chequeNumber,
          chequeBank:           dto.chequeBank,
          chequeDate:           dto.chequeDate,
          totalPaidBefore:      paidBefore,
          totalPaidAfter:       paidAfter,
          remainingAfter:       remainingAfter,
          status:               atiStatus,
          description:          dto.description,
          createdBy:            dto.createdBy,
          // Liquidity linkage
          originalLiquiditySource: originalLiquiditySource,
          originalLiquidityDocId:  originalLiquidityDocId,
          originalLiquidityAmount: dto.amount,
          // Existing transaction linkage
          linkedTransactionId:  newTxnRef.id,
          linkedBankTxnId:      newLedgerRef.id,
          liquiditySource,
          liquidityDocId,
          createdAt:            nowISO,
          updatedAt:            nowISO,
        });
        txn.set(newAtiRef, atiPayload);

        // ── Update invoice — ATI-own fields only ────────────────────────────
        // We NEVER touch paidAmount/remainingAmount (those track supplier costs).
        // We only update atiPaidAmount / atiRemainingAmount / atiStatus.
        // NOTE: paidAfter = verified live sum + dto.amount, so this self-heals any stale stored value.
        txn.update(invoiceRef, {
          atiPaidAmount:      paidAfter,
          atiRemainingAmount: remainingAfter,
          atiStatus:          atiStatus,
          updatedAt:          nowISO,
        });

        console.log(
          `✅ [txn] ATI ${newAtiRef.id} created. ` +
          `Invoice ${dto.invoiceId}: atiPaid ${paidBefore} → ${paidAfter}, atiRemaining → ${remainingAfter}. ` +
          `Liquidity credited: ${originalLiquiditySource ?? 'none'} / ${originalLiquidityDocId ?? 'none'}. ` +
          `Transaction: ${newTxnRef.id} (${txnId}) [Cash Outflow]`
        );

        return {
          ...dto,
          id:                       newAtiRef.id,
          invoiceTotal,
          totalPaidBefore:          paidBefore,
          totalPaidAfter:           paidAfter,
          remainingAfter,
          status:                   atiStatus,
          originalLiquiditySource:  originalLiquiditySource,
          originalLiquidityDocId:   originalLiquidityDocId,
          originalLiquidityAmount:  dto.amount,
          linkedTransactionId:      newTxnRef.id,
          linkedBankTxnId:          newLedgerRef.id,
          liquiditySource,
          liquidityDocId,
          createdAt:                nowISO,
          updatedAt:                nowISO,
        } as AgainstInvoiceEntry;
      });

      return saved;

    } catch (error: any) {
      console.error('❌ ATI createEntry:', error?.message || error);
      throw new Error(error?.message || 'Failed to save payment entry');
    }
  }

  // ── Delete entry + reverse everything — ATOMIC (UPDATED) ──────────────────
  //
  // NEW: Also restores the original liquidity pool
  static async deleteEntry(id: string, entry: AgainstInvoiceEntry): Promise<void> {
    const atiRef     = doc(db, COLLECTION, id);
    const invoiceRef = doc(db, INVOICE_COL, entry.invoiceId);

    try {
      await firestoreRunTransaction(db, async (txn) => {

        // ── 1. Reverse ATI-own invoice balances ──────────────────────────────
        const invoiceSnap = await txn.get(invoiceRef);
        if (invoiceSnap.exists()) {
          const inv              = invoiceSnap.data();
          const invoiceTotal     = Number(inv.totalAmount)     || 0;
          const currentAtiPaid   = Number(inv.atiPaidAmount)   || 0;
          const newAtiPaid       = Math.max(0, currentAtiPaid - entry.amount);
          const newAtiRemaining  = Math.max(0, invoiceTotal - newAtiPaid);
          let   newAtiStatus: ATIStatus = 'Active';
          if      (newAtiRemaining <= 0) newAtiStatus = 'Settled';
          else if (newAtiPaid > 0)       newAtiStatus = 'Partial';

          txn.update(invoiceRef, {
            atiPaidAmount:      newAtiPaid,
            atiRemainingAmount: newAtiRemaining,
            atiStatus:          newAtiStatus,
            updatedAt:          new Date().toISOString(),
          });
          console.log(`🔄 Reversed ATI invoice ${entry.invoiceId}: atiPaid ${currentAtiPaid} → ${newAtiPaid}`);
        }

        // ── 2. Reverse original liquidity credit (deduct from original pool) ─
        if (entry.originalLiquiditySource && entry.originalLiquidityDocId) {
          if (entry.originalLiquiditySource === 'bank') {
            const origBankRef  = doc(db, BANK_COL, entry.originalLiquidityDocId);
            const origBankSnap = await txn.get(origBankRef);
            if (origBankSnap.exists()) {
              const currentBal = Number(origBankSnap.data().balance) || 0;
              txn.update(origBankRef, { balance: currentBal - entry.amount, updatedAt: new Date().toISOString() });
              console.log(`💳 Reversed: deducted PKR ${entry.amount.toLocaleString()} from original bank`);
            }
          } else if (entry.originalLiquiditySource === 'cash') {
            const origCashRef  = doc(db, CASH_BAL_COL, entry.originalLiquidityDocId);
            const origCashSnap = await txn.get(origCashRef);
            if (origCashSnap.exists()) {
              const currentBal = Number(origCashSnap.data().balance) || 0;
              txn.update(origCashRef, { balance: currentBal - entry.amount, lastUpdated: new Date().toISOString(), updatedBy: 'System (ATI reversal)' });
              console.log(`💰 Reversed: deducted PKR ${entry.amount.toLocaleString()} from original cash`);
            }
          }
        }

        // ── 3. Reverse the payment-mode account (undo the debit on payment) ──
        // FIX: on delete we ADD back what was debited (previously subtracted on create)
        if (entry.liquiditySource && entry.liquidityDocId) {
          if (entry.liquiditySource === 'bank') {
            const bankRef  = doc(db, BANK_COL, entry.liquidityDocId);
            const bankSnap = await txn.get(bankRef);
            if (bankSnap.exists()) {
              const currentBal = Number(bankSnap.data().balance) || 0;
              // ✅ FIX: was - entry.amount; reversal of an outflow adds back to balance
              txn.update(bankRef, { balance: currentBal + entry.amount, updatedAt: new Date().toISOString() });
            }
          } else {
            const cashRef  = doc(db, CASH_BAL_COL, entry.liquidityDocId);
            const cashSnap = await txn.get(cashRef);
            if (cashSnap.exists()) {
              const currentBal = Number(cashSnap.data().balance) || 0;
              // ✅ FIX: was - entry.amount; reversal of an outflow adds back to balance
              txn.update(cashRef, { balance: currentBal + entry.amount, lastUpdated: new Date().toISOString(), updatedBy: 'System (ATI payment reversal)' });
            }
          }
        }

        // ── Delete the Transaction record ────────────────────────────────────
        if (entry.linkedTransactionId) {
          txn.delete(doc(db, TXN_COL, entry.linkedTransactionId));
        }

        // ── Delete the bank/cash ledger row ──────────────────────────────────
        if (entry.linkedBankTxnId) {
          const col = entry.liquiditySource === 'cash' ? CASH_TXN_COL : BANK_TXN_COL;
          txn.delete(doc(db, col, entry.linkedBankTxnId));
        }

        // ── Delete the ATI entry ─────────────────────────────────────────────
        txn.delete(atiRef);

        console.log(`✅ ATI entry ${id} deleted and all linked records reversed`);
      });
    } catch (error: any) {
      console.error('❌ ATI deleteEntry:', error?.message || error);
      throw new Error(error?.message || 'Failed to delete ATI entry');
    }
  }

  // ── Balance summaries (UPDATED with liquidity info) ───────────────────────
  static async fetchInvoiceBalanceSummaries(): Promise<InvoiceBalanceSummary[]> {
    try {
      const entries = await ATIFirebaseService.fetchAll();
      const invoices = await this.fetchAllInvoicesForSummary();

      const grouped = new Map<string, AgainstInvoiceEntry[]>();
      entries.forEach(e => {
        const list = grouped.get(e.invoiceId) || [];
        list.push(e);
        grouped.set(e.invoiceId, list);
      });

      const summaries: InvoiceBalanceSummary[] = [];
      grouped.forEach((list, invoiceId) => {
        const sorted    = [...list].sort((a, b) => a.date.localeCompare(b.date));
        const first     = sorted[0];
        const last      = sorted[sorted.length - 1];
        const totalPaid = list.reduce((s, e) => s + e.amount, 0);
        const remaining = Math.max(0, first.invoiceTotal - totalPaid);

        // Get live invoice for liquidity info
        const invoice = invoices.find(i => i.id === invoiceId);

        // Use live atiPaidAmount from invoice if available (more accurate than summing entries)
        const liveAtiPaid      = invoice ? (Number((invoice as any).atiPaidAmount) || totalPaid) : totalPaid;
        const liveAtiRemaining = invoice ? Math.max(0, first.invoiceTotal - liveAtiPaid) : remaining;

        let status: ATIStatus = 'Active';
        if      (liveAtiRemaining <= 0) status = 'Settled';
        else if (liveAtiPaid > 0)       status = 'Partial';

        summaries.push({
          invoiceId,
          invoiceNumber:   first.invoiceNumber,
          customerName:    first.customerName,
          date:            first.date,
          invoiceTotal:    first.invoiceTotal,
          totalPaid:       liveAtiPaid,
          remaining:       liveAtiRemaining,
          status,
          entryCount:      list.length,
          lastPaymentDate: last.date,
          originalLiquiditySource: (invoice as any)?.originalLiquiditySource,
          originalLiquidityAmount: (invoice as any)?.originalLiquidityAmount,
          remainingLiquidityAmount: liveAtiRemaining,
        });
      });

      return summaries.sort((a, b) => b.date.localeCompare(a.date));
    } catch (error: any) {
      console.error('❌ ATI fetchInvoiceBalanceSummaries:', error?.message || error);
      throw new Error('Failed to compute balance summaries');
    }
  }

  // Helper to fetch invoices for liquidity info
  private static async fetchAllInvoicesForSummary(): Promise<any[]> {
    try {
      const snapshot = await getDocs(collection(db, INVOICE_COL));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch {
      return [];
    }
  }
}

// ── One-time migration: fix stale ATI transactions ──────────────────────────
//
// Old ATI entries wrote to `transactions` with wrong type/category fields,
// causing them to appear as inflow instead of outflow.
// Call this once from an admin/settings page to patch existing Firestore docs.
//
// Safe to call repeatedly — identifies records by subCategory containing
// 'Against Invoice' and patches the type/category fields.
export async function migrateStaleATITransactions(): Promise<{ fixed: number; skipped: number }> {
  // Match both old subCategory ('Collection Against Invoice') and new ('Payment Against Invoice')
  const q    = query(collection(db, 'transactions'), where('subCategory', 'in', ['Collection Against Invoice', 'Payment Against Invoice']));
  const snap = await getDocs(q);
  let fixed = 0, skipped = 0;

  await Promise.all(snap.docs.map(async (d) => {
    const data = d.data() as any;

    // Skip if already correctly classified as outflow
    if (
      data.type === 'Cash Outflow' &&
      data.mainCategory === 'Cash Outflow' &&
      data.plMainCategory === 'Expense' &&
      data.paymentStatus === 'Full' &&
      data.remainingAmount === 0 &&
      data.isFullyCleared != null
    ) {
      skipped++;
      return;
    }

    const amount = Number(data.amount) || 0;
    const txnMode: 'Cash' | 'Bank' | 'Cheque' =
      data.mode === 'Bank' ? 'Bank' : data.mode === 'Cheque' ? 'Cheque' : 'Cash';

    await updateDoc(doc(db, 'transactions', d.id), {
      // ✅ FIX: correct outflow classification
      type:            'Cash Outflow',
      mainCategory:    'Cash Outflow',
      subCategory:     'Payment Against Invoice',
      amountPaid:      amount,
      remainingAmount: 0,
      totalPaid:       amount,
      paymentStatus:   'Full',
      isFullyCleared:  txnMode !== 'Cheque',
      approvalStatus:  data.approvalStatus  || 'not_required',
      // ✅ FIX: was 'Revenue' — ATI payments are an Expense
      plMainCategory:  'Expense',
      plSubCategory:   data.plSubCategory   || 'Payment Against Invoice',
      bsMainCategory:  data.bsMainCategory  || 'Assets',
      bsSubCategory:   data.bsSubCategory   || (txnMode !== 'Cash' ? 'Bank Balances' : 'Cash & Cash Equivalents'),
      updatedAt:       new Date().toISOString(),
    });
    fixed++;
    console.log(`[ATI migration] Patched stale transaction: ${d.id}`);
  }));

  console.log(`[ATI migration] Done — fixed: ${fixed}, skipped: ${skipped}`);
  return { fixed, skipped };
}

// ── One-time repair: resync stale atiPaidAmount on invoice documents ──────────
//
// If inv.atiPaidAmount is out of sync with the actual ATI entries (e.g. due to
// a deleted entry that didn't correctly decrement, or a buggy prior write),
// this function recomputes the true sum from live ATI entries and patches the
// invoice document.
//
// Call once from an admin/settings page. Safe to call repeatedly.
export async function repairStaleATIPaidAmounts(): Promise<{ fixed: number; skipped: number; errors: number }> {
  let fixed = 0, skipped = 0, errors = 0;

  // 1. Load all ATI entries grouped by invoiceId
  const atiSnap = await getDocs(collection(db, COLLECTION));
  const grouped = new Map<string, number>();
  atiSnap.docs.forEach(d => {
    const invoiceId = d.data().invoiceId as string;
    const amount    = Number(d.data().amount) || 0;
    grouped.set(invoiceId, (grouped.get(invoiceId) || 0) + amount);
  });

  // 2. For each invoice that has ATI entries, compare and patch if needed
  await Promise.all(Array.from(grouped.entries()).map(async ([invoiceId, trueSum]) => {
    try {
      const invoiceRef  = doc(db, INVOICE_COL, invoiceId);
      const invoiceSnap = await getDoc(invoiceRef);
      if (!invoiceSnap.exists()) { errors++; return; }

      const inv          = invoiceSnap.data();
      const invoiceTotal = Number(inv.totalAmount) || 0;
      const storedPaid   = Number(inv.atiPaidAmount) || 0;

      if (Math.abs(storedPaid - trueSum) < 0.01) {
        // Already in sync — no patch needed
        skipped++;
        return;
      }

      const trueRemaining = Math.max(0, invoiceTotal - trueSum);
      let   trueStatus: ATIStatus = 'Active';
      if      (trueRemaining <= 0) trueStatus = 'Settled';
      else if (trueSum > 0)        trueStatus = 'Partial';

      await updateDoc(invoiceRef, {
        atiPaidAmount:      trueSum,
        atiRemainingAmount: trueRemaining,
        atiStatus:          trueStatus,
        updatedAt:          new Date().toISOString(),
      });

      console.log(
        `[ATI repair] Invoice ${invoiceId}: atiPaidAmount ${storedPaid} → ${trueSum} ` +
        `(diff: ${trueSum - storedPaid}), remaining → ${trueRemaining}`
      );
      fixed++;
    } catch (err) {
      console.error(`[ATI repair] Error patching invoice ${invoiceId}:`, err);
      errors++;
    }
  }));

  console.log(`[ATI repair] Done — fixed: ${fixed}, skipped: ${skipped}, errors: ${errors}`);
  return { fixed, skipped, errors };
}