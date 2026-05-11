// Against the Invoice Module — Types
//
// KEY DESIGN: ATI tracking is INDEPENDENT of invoice paidAmount/remainingAmount.
// Invoice paidAmount = what YOU paid to supplier for goods (purchase cost).
// atiPaidAmount      = what customers have PAID YOU against this invoice (collections).
// These are stored as separate fields on the Invoice document so both can coexist.

export type ATIStatus = 'Active' | 'Settled' | 'Partial';
export type ATIPaymentMode = 'Cash' | 'Bank' | 'Cheque';

export interface AgainstInvoiceEntry {
  id: string;

  // ── Invoice reference ──────────────────────────────────────
  invoiceId:      string;   // Firestore doc id of the invoice
  invoiceNumber:  string;   // e.g. INV-060526-001
  customerName:   string;
  invoiceTotal:   number;   // original invoice total amount

  // ── Transaction reference ──────────────────────────────────
  transactionId:  string;   // auto-generated ATI-DDMMYY-NNN
  date:           string;   // ISO date
  time?:          string;
  company:        string;

  // ── Payment details ────────────────────────────────────────
  amount:         number;   // amount being paid through this ATI entry
  paymentMode:    ATIPaymentMode;
  bankId?:        string;
  bankName?:      string;
  chequeNumber?:  string;
  chequeBank?:    string;
  chequeDate?:    string;

  // ── Running balance (computed & stored for speed) ──────────
  totalPaidBefore:   number;  // total paid against invoice BEFORE this entry
  totalPaidAfter:    number;  // total paid after this entry
  remainingAfter:    number;  // invoice balance remaining after this entry
  status:            ATIStatus;

  // ────────────────────────────────────────────────────────────────────────
  // ✨ ENHANCED: Original Invoice Liquidity Linkage
  // When this ATI entry was created, which liquidity pool was debited?
  // These fields track the original source so we can reverse properly on delete.
  // ────────────────────────────────────────────────────────────────────────
  originalLiquiditySource?: 'bank' | 'cash';   // Where the invoice payment originally came from
  originalLiquidityDocId?: string;             // Bank doc id or cashInHand doc id
  originalLiquidityAmount?: number;            // Amount deducted from that pool

  // ────────────────────────────────────────────────────────────────────────
  // Existing liquidity linkage (Transaction + ledger records)
  // These are the bank/cash transaction records created when ATI payment is made
  // ────────────────────────────────────────────────────────────────────────
  // Populated on create so deleteEntry can precisely reverse the right account.
  linkedTransactionId?: string;   // Firestore doc id in `transactions` collection
  linkedBankTxnId?:     string;   // Firestore doc id in `bank_transactions` collection (Bank/Cheque only)
  liquiditySource?:     'bank' | 'cash';  // which pool was debited for ATI payment
  liquidityDocId?:      string;   // doc id in `banks` (Bank/Cheque) or `cashInHand` (Cash)

  // ── Extra ──────────────────────────────────────────────────
  description?:   string;
  createdBy?:     string;
  createdAt?:     string;
  updatedAt?:     string;
}

export interface ATIFilters {
  searchTerm:    string;
  invoiceNumber: string;
  status:        string;   // '' | 'Active' | 'Settled' | 'Partial'
  dateFrom:      string;
  dateTo:        string;
}

export interface ATIStats {
  totalEntries:        number;
  totalAmountPaid:     number;
  totalInvoiceValue:   number;
  totalRemaining:      number;
  settledCount:        number;
  partialCount:        number;
}

// Invoice summary for the balance tracker view
export interface InvoiceBalanceSummary {
  invoiceId:      string;
  invoiceNumber:  string;
  customerName:   string;
  date:           string;
  invoiceTotal:   number;
  totalPaid:      number;
  remaining:      number;
  status:         ATIStatus;
  entryCount:     number;
  lastPaymentDate?: string;
  
  // ✨ NEW: Liquidity tracking in summary view
  originalLiquiditySource?: 'bank' | 'cash';
  originalLiquidityAmount?: number;
  remainingLiquidityAmount?: number;
}