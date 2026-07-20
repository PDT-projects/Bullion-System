// Invoice Module - Additive Service
// InvoicePaymentService.ts
//
// Records a payment against an existing invoice (invoices are created Unpaid;
// payments are logged later from the invoice list). Each payment:
//   1. Appends to the invoice's `payments[]` history and recomputes
//      paidAmount / remainingAmount / status (Unpaid → Partial → Paid).
//   2. Books ONE Cash-Inflow transaction row per payment (unique id, so
//      multiple partial payments never collide on the shared bridge's
//      invoice-number de-dupe).
//   3. Optionally credits the receiving bank (off by default — banks carry
//      their own currency and auto-mutating balances can double-count against
//      the transactions ledger; enable per call once reconciliation is agreed).
//
// Kept separate from InvoiceFirebaseService.ts (partial copy only available)
// so the main service's unseen methods are never clobbered.

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { Invoice, InvoicePayment, PaymentMode } from './types';
import { calculateMiscExpense } from './invoiceService';
import { TransactionFirebaseService } from '../../transactions/models/transactionFirebaseService';
import { Transaction } from '../../transactions/models/types';
import { TxCompany } from '../../transactions/models/transactionBridgeService';
import { BankFirebaseService } from '../../banking/models/bankFirebaseService';

const INVOICES_COLLECTION = 'invoices';

function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const out: Record<string, any> = {};
  Object.entries(obj).forEach(([k, v]) => { if (v !== undefined) out[k] = v; });
  return out as T;
}

// Map the payment mode to the Invoice.paymentMode union used across the UI
// (historically 'Online' means a bank transfer).
function toInvoicePaymentMode(mode: PaymentMode): 'Cash' | 'Online' | 'Cheque' {
  if (mode === 'Bank')   return 'Online';
  if (mode === 'Cheque') return 'Cheque';
  return 'Cash';
}

export interface RecordPaymentInput {
  invoice: Invoice;                 // the current invoice (must have .id)
  amount: number;                   // amount received now (AED)
  mode: PaymentMode;                // Cash | Bank | Cheque
  date: string;                     // YYYY-MM-DD
  bankId?: string;
  bankName?: string;
  bankAccountNumber?: string;
  chequeNumber?: string;
  chequeBank?: string;
  chequeDate?: string;
  note?: string;
  company: TxCompany;               // branch/office for the transaction ledger
  recordedBy?: { uid: string; email: string };
  adjustBankBalance?: boolean;      // default false — see file header
}

export interface RecordPaymentResult {
  invoice: Invoice;
  paidAmount: number;
  remainingAmount: number;
  status: Invoice['status'];
}

export class InvoicePaymentService {

  static async recordPayment(input: RecordPaymentInput): Promise<RecordPaymentResult> {
    const { invoice, amount, mode, date, company } = input;

    if (!invoice?.id) throw new Error('Invoice is missing its document id — cannot record payment');
    if (!(amount > 0)) throw new Error('Payment amount must be greater than zero');

    // Read the freshest copy so concurrent payments don't clobber history.
    const ref  = doc(db, INVOICES_COLLECTION, invoice.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Invoice not found');
    const current = { id: invoice.id, ...(snap.data() as Invoice) };

    const totalAmount   = current.totalAmount || 0;
    const priorPayments = Array.isArray(current.payments) ? current.payments : [];
    const alreadyPaid   = priorPayments.reduce((s, p) => s + (p.amount || 0), 0);
    const remainingNow  = Math.max(0, totalAmount - alreadyPaid);

    // Guard against overpayment — clamp to the outstanding balance.
    const applied = Math.min(amount, remainingNow > 0 ? remainingNow : amount);

    const now = new Date().toISOString();
    const paymentSeq = priorPayments.length + 1;

    const payment: InvoicePayment = stripUndefined({
      id:                `PAY-${Date.now()}-${paymentSeq}`,
      amount:            applied,
      mode,
      date,
      bankId:            mode === 'Bank'   ? input.bankId            : undefined,
      bankName:          mode === 'Bank'   ? input.bankName          : undefined,
      bankAccountNumber: mode === 'Bank'   ? input.bankAccountNumber : undefined,
      chequeNumber:      mode === 'Cheque' ? input.chequeNumber      : undefined,
      chequeBank:        mode === 'Cheque' ? input.chequeBank        : undefined,
      chequeDate:        mode === 'Cheque' ? input.chequeDate        : undefined,
      note:              input.note,
      recordedBy:        input.recordedBy?.uid,
      recordedByEmail:   input.recordedBy?.email,
      recordedAt:        now,
    }) as InvoicePayment;

    const payments        = [...priorPayments, payment];
    const paidAmount      = alreadyPaid + applied;
    const remainingAmount = Math.max(0, totalAmount - paidAmount);
    const status: Invoice['status'] =
      remainingAmount <= 0 ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Unpaid';
    const paymentStatus: 'Full' | 'Partial' | 'Unpaid' =
      status === 'Paid' ? 'Full' : status === 'Partial' ? 'Partial' : 'Unpaid';

    // 1) Persist the payment onto the invoice.
    await updateDoc(ref, stripUndefined({
      payments,
      paidAmount,
      remainingAmount,
      status,
      paymentStatus,
      paymentMode:       toInvoicePaymentMode(mode),
      lastPaymentDate:   date,
      bankId:            mode === 'Bank'   ? input.bankId       : current.bankId,
      bankName:          mode === 'Bank'   ? input.bankName     : current.bankName,
      bankAccountNumber: mode === 'Bank'   ? input.bankAccountNumber : current.bankAccountNumber,
      chequeNumber:      mode === 'Cheque' ? input.chequeNumber : current.chequeNumber,
      chequeBank:        mode === 'Cheque' ? input.chequeBank   : current.chequeBank,
      chequeDate:        mode === 'Cheque' ? input.chequeDate   : current.chequeDate,
      updatedAt:         now,
    }));

    // 2) Book a Cash-Inflow transaction for THIS payment (unique id per payment).
    try {
      await this.bookPaymentTransaction(current, payment, paymentSeq, remainingAmount, company);
    } catch (err) {
      console.warn('[InvoicePaymentService] transaction booking failed (non-blocking):', err);
    }

    // 3) Optionally credit the receiving bank.
    if (input.adjustBankBalance && mode === 'Bank' && input.bankId) {
      try {
        const bank = await BankFirebaseService.fetchBankById(input.bankId);
        if (bank) {
          await BankFirebaseService.updateBankBalance(input.bankId, (bank.balance || 0) + applied);
          await BankFirebaseService.addBankTransaction({
            bankId:      input.bankId,
            bankName:    input.bankName || bank.name,
            date,
            type:        'credit',
            amount:      applied,
            description: `Invoice ${current.invoiceNumber} — ${current.customerName}`,
            reference:   current.invoiceNumber,
            category:    'Invoice / Sale',
            note:        input.note,
          });
        }
      } catch (err) {
        console.warn('[InvoicePaymentService] bank balance update failed (non-blocking):', err);
      }
    }

    return {
      invoice: { ...current, payments, paidAmount, remainingAmount, status, paymentStatus },
      paidAmount,
      remainingAmount,
      status,
    };
  }

  // ── Build a single inflow transaction for one payment ──────────────────────
  private static async bookPaymentTransaction(
    invoice: Invoice,
    payment: InvoicePayment,
    seq: number,
    remainingAfter: number,
    company: TxCompany,
  ): Promise<void> {
    const txId = `TXN-INV-${invoice.invoiceNumber.replace(/^INV-/, '')}-P${seq}`;

    try {
      const exists = await TransactionFirebaseService.transactionIdExists(txId);
      if (exists) {
        console.log(`[InvoicePaymentService] Transaction ${txId} already exists — skipping`);
        return;
      }
    } catch { /* allow create to proceed */ }

    const mode: 'Cash' | 'Bank' | 'Cheque' =
      payment.mode === 'Bank' ? 'Bank' : payment.mode === 'Cheque' ? 'Cheque' : 'Cash';

    const time = new Date().toTimeString().split(' ')[0];
    const fullyCleared = remainingAfter <= 0;

    const txData: Omit<Transaction, 'id'> = {
      transactionId:   txId,
      date:            payment.date,
      time,
      company,
      mainCategory:    'Cash Inflow',
      subCategory:     'Invoice / Sale',
      detailCategory:  `Payment #${seq} — Invoice ${invoice.invoiceNumber} — ${invoice.customerName}`,
      amount:          payment.amount,
      mode,
      bankId:          mode === 'Bank'   ? payment.bankId      : undefined,
      bankName:        mode === 'Bank'   ? payment.bankName    : undefined,
      chequeNumber:    mode === 'Cheque' ? payment.chequeNumber : undefined,
      chequeBank:      mode === 'Cheque' ? payment.chequeBank   : undefined,
      chequeDate:      mode === 'Cheque' ? payment.chequeDate   : undefined,

      // A payment transaction is ATOMIC on the cash side — the money was
      // either received in full or not at all. The `amount / amountPaid /
      // totalPaid` fields all reflect what actually moved, and
      // `remainingAmount` on the transaction itself is 0.
      //
      // `paymentStatus` here serves as a LINKAGE FLAG rather than a
      // transaction-level cash flag:
      //   • 'Full'    → payment cleared the parent invoice completely
      //   • 'Partial' → parent invoice still has an outstanding balance
      // The transactions list uses this to filter "Pending only" — a
      // transaction flagged Partial surfaces there even though its own
      // Cash In matches Amount (because the invoice it's paying is still
      // in progress).
      amountPaid:      payment.amount,
      remainingAmount: 0,
      paymentStatus:   fullyCleared ? 'Full' : 'Partial',
      totalPaid:       payment.amount,
      isFullyCleared:  fullyCleared && mode !== 'Cheque',   // cheques aren't cleared until they clear

      paidBy:          invoice.customerName,
      paidTo:          undefined,
      note:            payment.note || (fullyCleared
        ? `Invoice ${invoice.invoiceNumber} payment #${seq} — invoice now settled`
        : `Invoice ${invoice.invoiceNumber} payment #${seq} — invoice balance AED ${remainingAfter.toLocaleString()} remaining`),
      partialPayments: [],
      linkedType:      'invoice',
      linkedId:        invoice.invoiceNumber,
      plMainCategory:  'Revenue',
      plSubCategory:   'Service / Invoice Sales',
      bsMainCategory:  'Assets',
      bsSubCategory:   mode === 'Cash' ? 'Cash & Cash Equivalents' : 'Bank Balances',
      approvalStatus:  'not_required',
    } as Omit<Transaction, 'id'>;

    await TransactionFirebaseService.createTransaction(txData);
    console.log(`[InvoicePaymentService] ✅ Payment transaction booked: ${txId}`);
  }
}