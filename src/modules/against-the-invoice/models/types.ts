// Against the Invoice Module — Types
// Links a Transaction to an Invoice so payments can be tracked per invoice

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
}