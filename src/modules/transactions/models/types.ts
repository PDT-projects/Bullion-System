// Transactions Module - Types

// Re-export PartialPayment and Attachment from App types (if needed)
// For now, we'll define our own types that match the App.tsx Transaction

export interface PartialPayment {
  id: string;
  amount: number;
  date: string;
  time: string;
  method: 'Cash' | 'Cheque' | 'Bank';
  bankId?: string;
  chequeNumber?: string;
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

export interface Transaction {
  id: string;
  transactionId: string;
  date: string;
  time: string;
  company: string;
  mainCategory: string;
  subCategory: string;
  amount: number;
  mode: 'Cash' | 'Bank' | 'Cheque';
  bankName?: string;
  bankId?: string;
  chequeNumber?: string;
  chequeDate?: string;
  transactionReference?: string;
  note: string;
  paidBy?: string;
  paidTo?: string;
  accountablePerson?: string;
  transactionBy?: string;
  employeeId?: string;
  employeeName?: string;
  baseSalary?: number;
  commission?: number;
  deductions?: number;
  netAmount?: number;
  imageUrl?: string;
  paymentStatus?: 'Full' | 'Partial';
  remainingAmount?: number;
  
  // Advance Salary fields
  isAdvanceSalary?: boolean;
  advanceAmount?: number;
  remainingSalary?: number;
  salaryMonth?: string;
  
  // Loan fields
  loanType?: 'Receivable' | 'Payable';
  borrowerName?: string;
  lenderName?: string;
  loanDate?: string;
  expectedReturnDate?: string;
  dueDate?: string;
  
  // Partial payments tracking
  partialPayments?: PartialPayment[];
  totalPaid?: number;
  isFullyCleared?: boolean;
  depositedToBank?: boolean;
  attachments?: Attachment[];
}

// Form data types
export interface TransactionFormData {
  date: string;
  company: string;
  mainCategory: string;
  subCategory: string;
  amount: string;
  mode: 'Cash' | 'Bank' | 'Cheque';
  bankName: string;
  note: string;
  // Additional fields
  detailCategory?: string;
  amountPaid?: number;
  remainingAmount?: number;
  paymentStatus?: 'Full' | 'Partial';
  paidBy?: string;
  paidTo?: string;
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
  filterStatus: 'All' | 'Uncleared' | 'PartiallyPaid';
}

export interface TransactionStats {
  totalInflow: number;
  totalOutflow: number;
  netBalance: number;
  transactionCount: number;
}

// Pending Payments types
export interface PendingPaymentData {
  amount: number;
  bankId: string;
  method: 'Cash' | 'Cheque' | 'Bank';
  chequeNumber?: string;
}

// Constants
export const COMPANIES = [
  { id: 'isb', name: 'Pakistan Detectors Technologies: Islamabad' },
  { id: 'khi', name: 'Pakistan Detectors Technologies: Karachi' },
  { id: 'lhr', name: 'Pakistan Detectors Technologies: Lahore' },
  { id: 'bul', name: 'Pakistan Detectors Technologies: Bullion' },
  { id: 'rnd', name: 'Pakistan Detectors Technologies: RND/SITE Office' }
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
    'Other'
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
    'Other payment'
  ],
  'Loan': [
    'Loan given',
    'Loan received',
    'Official Loan',
    'Personal loan',
    'Other loan - Full',
    'Other loan - Partial'
  ]
};

export const BANKS = [
  { id: 'hbl', name: 'HBL Main Branch', balance: 1850000 },
  { id: 'mcb', name: 'MCB Bank', balance: 950000 },
  { id: 'abl', name: 'Allied Bank', balance: 750000 },
  { id: 'ubl', name: 'United Bank Limited', balance: 1200000 },
  { id: 'meezan', name: 'Meezan Bank', balance: 500000 },
  { id: 'alfalah', name: 'Bank Alfalah', balance: 850000 }
];
