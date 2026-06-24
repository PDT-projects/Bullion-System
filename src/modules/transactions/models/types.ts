// Transactions Module - Types

export interface PartialPayment {
  id: string;
  amount: number;
  date: string;
  time: string;
  method: 'Cash' | 'Cheque' | 'Bank';
  bankId?: string;
  bankName?: string;
  chequeNumber?: string;
  chequeDate?: string;
  chequeBank?: string;
  isCleared: boolean;
  depositedDate?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  dataUrl: string;
  uploadedAt: string;
}

// ── Approval Status ────────────────────────────────────────────────────────────
// pending_approval  → just created, waiting for admin to approve via email
// approved          → admin clicked Approve in email
// rejected          → admin clicked Reject in email
// not_required      → legacy / manually bypassed
export type ApprovalStatus =
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'not_required';

export interface Transaction {
  id: string;
  transactionId: string;
  date: string;
  time: string;
  company: string;
  mainCategory: string;
  subCategory: string;
  detailCategory?: string;
  amount: number;
  mode: 'Cash' | 'Bank' | 'Cheque';
  currency?: string;
  // Original (pre-conversion) currency the user actually typed the amount in
  // (e.g. 'AED'), preserved for display fidelity. `amount`/`amountPaid` above
  // are always PKR-canonical regardless of this field.
  originalCurrency?: string;
  originalAmount?: number;
  originalAmountPaid?: number;
  bankName?: string;
  bankId?: string;
  chequeNumber?: string;
  chequeDate?: string;
  chequeBank?: string;
  transactionReference?: string;
  note: string;
  paidBy?: string;
  paidTo?: string;
  accountablePerson?: string;
  transactionBy?: string;
  employeeId?: string;
  employeeName?: string;
  // Approval workflow
  approvalStatus?: ApprovalStatus;
  approvalToken?: string;      // secure token embedded in email links
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  // Payment tracking
  amountPaid?: number;
  paymentStatus?: 'Full' | 'Partial';
  remainingAmount?: number;
  partialPayments?: PartialPayment[];
  totalPaid?: number;
  isFullyCleared?: boolean;
  depositedToBank?: boolean;
  attachments?: Attachment[];
  // Profit & Loss classification
  plMainCategory?: PLMainCategory;
  plSubCategory?: string;
  // Balance Sheet classification
  bsMainCategory?: BSMainCategory;
  bsSubCategory?: string;
  // Linked record info
  linkedType?: 'salary' | 'loan' | 'bill' | 'invoice' | 'commission' | 'manual';
  linkedId?: string;
  linkedRef?: string;
  // Salary fields
  baseSalary?: number;
  commission?: number;
  deductions?: number;
  netAmount?: number;
  salaryMonth?: string;
  isAdvanceSalary?: boolean;
  advanceAmount?: number;
  // Loan fields
  loanType?: 'Receivable' | 'Payable';
  borrowerName?: string;
  lenderName?: string;
  expectedReturnDate?: string;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TransactionItem {
  id: string;
  mainCategory: string;
  subCategory: string;
  detailCategory: string;
  amount: number;
  amountPaid: number;
  remainingAmount: number;
  paymentStatus: 'Full' | 'Partial';
  paidBy: string;
  paidTo: string;
  note: string;
  receipt?: File | null;
}

export interface TransactionFilters {
  searchTerm: string;
  mainCategory: string;
  dateFrom: string;
  dateTo: string;
  paymentStatus: string;
  company: string;
  approvalStatus: string;   // '' | 'pending_approval' | 'approved' | 'rejected'
}

export interface TransactionStats {
  totalInflow: number;
  totalOutflow: number;
  netBalance: number;
  transactionCount: number;
  pendingCount: number;
  totalPending: number;
  pendingApprovalCount: number;  // new
}

export interface PendingPaymentData {
  amount: number;
  bankId: string;
  method: 'Cash' | 'Cheque' | 'Bank';
  chequeNumber?: string;
  chequeDate?: string;
  chequeBank?: string;
}

// ── In-app Notification (stored in Firestore /appNotifications) ───────────────
export type AppNotificationType =
  | 'transaction_pending_approval'
  | 'transaction_approved'
  | 'transaction_rejected'
  | 'payment_pending'
  | 'payment_cleared'
  | 'info';

export interface AppNotification {
  id: string;
  type: AppNotificationType;
  title: string;
  message: string;
  transactionId?: string;       // Firestore doc id
  transactionRef?: string;      // human-readable TXN-XXXXXX
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;
}

// ── Company / Branch (user-managed, stored in Firestore /companies) ───────────
export interface Company {
  id: string;
  name: string;
  createdAt: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

export const COMPANIES = [
  { id: 'sau', name: 'Bullion Electronics - Saudia' },
  { id: 'dxb', name: 'Bullion Electronics - Dubai' },
  { id: 'cad', name: 'Bullion Electronics - Chad' },
  { id: 'sdn', name: 'Bullion Electronics - Sudan' },
  { id: 'oth', name: 'Bullion Electronics - Other' },
];

export const MAIN_CATEGORIES = ['Cash Inflow', 'Cash Outflow', 'Loan'];

export const SUB_CATEGORIES: Record<string, string[]> = {
  'Cash Inflow': [
    'Product sale received',
    'Payment received - Customers',
    'Payment received - Company',
    'TCS/DHL/LCS payment received',
    'Commission received',
    'Loan received - From Employee',
    'Loan received - From Company',
    'Other',
  ],
  'Cash Outflow': [
    'Employee salary',
    'Advance salary',
    'Commission paid - Employee',
    'Commission paid - Dealer',
    'Loan paid to employee',
    'Office Rent',
    'Electricity Bill',
    'Gas Bill',
    'Water Bill',
    'Internet Bill',
    'PTCL Bill',
    'Petrol expense',
    'Kitchen Expense',
    'Grocery Expense',
    'Stationery Expense',
    'Marketing/SEO/VPN',
    'Courier',
    'Bykea/delivery',
    'Parcel received Payment',
    'Payment to company',
    'Payment to person',
    'Purchase',
    'Repair payment',
    'Cylinder payment',
    'Medical/hospital bill',
    'Personal expense/Non business',
    'Other payment',
  ],
  'Loan': [
    'Loan given',
    'Loan received',
    'Official Loan',
    'Personal loan',
    'Other loan - Full',
    'Other loan - Partial',
  ],
};

// ── Dynamic Category (user-added, stored in Firestore /dynamicCategories) ─────
export interface DynamicCategory {
  id: string;
  // 'mainCategory' / 'subCategory'        → transaction category tree
  // 'plMainCategory' / 'plSubCategory'    → P&L category tree
  // 'bsMainCategory' / 'bsSubCategory'    → Balance Sheet category tree
  type: 'mainCategory' | 'subCategory' | 'plMainCategory' | 'plSubCategory' | 'bsMainCategory' | 'bsSubCategory';
  parentCategory?: string;   // for subCategory / plSubCategory: which parent it belongs to
  name: string;
  createdAt: string;
}

// ── Profit & Loss Categories ───────────────────────────────────────────────────

export type PLMainCategory =
  | 'Revenue'
  | 'Cost of Goods Sold (COGS)'
  | 'Operating Expenses';

export interface PLCategory {
  main: PLMainCategory;
  sub: string;
}

export const PL_CATEGORIES: Record<PLMainCategory, string[]> = {
  'Revenue': [
    'Service / Invoice Sales',
    'Service Income',
  ],
  'Cost of Goods Sold (COGS)': [
    'Purchase & Inventory',
  ],
  'Operating Expenses': [
    'Salaries & Wages',
    'Utilities',
    'Rent',
    'Marketing',
    'Miscellaneous',
  ],
};

// ── Balance Sheet Categories ───────────────────────────────────────────────────

export type BSMainCategory =
  | 'Assets'
  | 'Liabilities & Equity';

export interface BSCategory {
  main: BSMainCategory;
  sub: string;
}

export const BS_CATEGORIES: Record<BSMainCategory, string[]> = {
  'Assets': [
    'Cash & Cash Equivalents',
    'Accounts Receivable',
    'Inventory',
    'Prepaid Expenses',
    'Fixed Assets',
    'Other Assets',
  ],
  'Liabilities & Equity': [
    'Accounts Payable',
    'Short-term Loans',
    'Long-term Loans',
    'Accrued Expenses',
    'Owner Equity / Capital',
    'Retained Earnings',
    'Other Liabilities',
  ],
};

export const LOAN_SUB_CATEGORIES = new Set([
  'Loan received - From Employee',
  'Loan received - From Company',
  'Loan paid to employee',
  'Loan given',
  'Loan received',
  'Official Loan',
  'Personal loan',
  'Other loan - Full',
  'Other loan - Partial',
]);