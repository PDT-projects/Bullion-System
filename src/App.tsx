import { useState } from 'react';
import { Dashboard } from './features/finance/Dashboard';

// Employee Module - MVVM Architecture
import { EmployeeListWrapper } from './modules/employee';

// Invoice Module - MVVM Architecture
import { InvoiceListWrapper, InvoiceFormWrapper } from './modules/invoices';

import { Transactions } from './features/finance/Transactions';

import { TransactionHistory } from './features/finance/TransactionHistory';
import { LoanHistory } from './features/finance/LoanHistory';
import { CashInflow } from './features/finance/CashInflow';
import { CashOutflow } from './features/finance/CashOutflow';
import { Bills } from './features/finance/Bills';
// Note: Salary feature component not yet implemented
// import { Salary } from './features/hr/Salary';
import { ProductTransferWrapper } from './modules/inventory';



import { SalesReport } from './features/sales/SalesReport';
import { ReferralReport } from './features/sales/ReferralReport';
import { InventoryReport } from './features/inventory/InventoryReport';
import { TransactionHistoryReport } from './features/finance/TransactionHistoryReport';
import { PendingPayments } from './features/finance/PendingPayments';
import { Sidebar } from './layouts/Sidebar';
import { TopBar } from './layouts/TopBar';
import { NotificationBell } from './layouts/NotificationBell';
import { Toaster } from './components/ui/sonner';
import { Notification } from './types/Notification';

import { CommissionSlabs } from './features/sales/CommissionSlabs';
import { CommissionCalculation } from './features/sales/CommissionCalculation';
import { CommissionReport } from './features/sales/CommissionReport';
import { InventoryAuditLogComponent } from './features/inventory/InventoryAuditLog';
import { Budget } from './types/Budget';

import { Login } from './pages/Login';
import { Signup } from './pages/Signup';

export type Employee = {
  id: string;
  name: string;
  position: string;
  salary: number;
  phone: string;
  email: string;
  joinDate: string;
  status: 'active' | 'inactive';
};

export type Product = {
  id: string;
  brandName: string;
  modelName: string;
  category: string;
  costPrice: number;
  sellPrice: number;
  buyType: 'Import' | 'Export';
  warrantyYears: number;
  stock: number;
  serialNumbers: string[];
  serialCities: { [serialNumber: string]: string };
  serialStatus?: { [serialNumber: string]: 'Available' | 'In Transit' | 'Damaged' | 'Returned' };
  description: string;
  status: 'New' | 'Used' | 'Returned';
  createdDate?: string;
};

export type InvoiceProduct = {
  id: string;
  productId: string;
  productName: string;
  brandName: string;
  modelName: string;
  category: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
  serialNumbers: string[];
  serialCities?: { [serialNumber: string]: string };
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerPhone2?: string;
  customerCNIC: string;
  customerProvince: string;
  customerCity: string;
  customerAddress?: string;
  warrantyLocation?: string;
  products: InvoiceProduct[];
  exchangeWarrantyNote: string;
  deliveryStatus: 'Self-collect' | 'LCS' | 'Daewoo' | 'Delivered';
  deliveryReceivedStatus: 'Pending' | 'In Process' | 'Received'; // UPDATED: Dynamic delivery tracking with multiple statuses
  totalAmount: number;
  status: 'Paid' | 'Unpaid';
  salesperson?: string;
  salespersonLocation?: string;
  referFrom?: string; // NEW: Replaced clientDealBy, now required
  referTo?: string; // NEW: Optional referral destination
  createdBy?: string;
  paymentMode?: 'Cash' | 'Online';
  bankId?: string;
  bankName?: string;
  bankAccountNumber?: string;
  paymentStatus?: 'Full' | 'Partial';
  paidAmount?: number;
  remainingAmount?: number;
  collectionMethod?: 'Self Collection' | 'TCS' | 'LCS' | 'Daewoo' | 'Others';
  deductionCharges: number; // UPDATED: Now manually editable, required field (defaults to 0)
  imageUrl?: string;
  paidBy?: string;
  paidTo?: string;
  digitalStamp?: boolean; // NEW: Digital stamp option for invoices
  clientDealBy?: string; // NEW: Referral to field
  referralBy?: string; // NEW: Referral from field
  productLocation?: string; // NEW: Product location field
};

export type PartialPayment = {
  id: string; // Unique payment ID
  amount: number;
  date: string;
  time: string;
  method: 'Cash' | 'Cheque' | 'Bank';
  bankId?: string;
  chequeNumber?: string;
  isCleared: boolean; // True if cleared/deposited, false if pending
  depositedDate?: string; // When it was deposited
  attachments?: Attachment[];
};

export type Attachment = {
  id: string;
  name: string;
  type: string; // MIME type
  dataUrl: string; // Base64 data URL
  uploadedAt: string;
};

export type Transaction = {
  id: string;
  transactionId: string; // System-generated unique ID (TXN-XXXXX format)
  date: string;
  time: string; // Added: time component
  company: string;
  mainCategory: 'Cash Inflow' | 'Cash Outflow' | 'Loans & Advances' | 'Salary' | 'Bills' | 'Loan';
  subCategory: string;
  amount: number;
  mode: 'Cash' | 'Bank' | 'Cheque'; // Payment method
  bankName?: string;
  bankId?: string; // Added for better bank tracking
  chequeNumber?: string; // For cheque payments
  chequeDate?: string; // For cheque payments
  transactionReference?: string; // For bank transfer payments
  note: string;
  paidBy?: string; // Person/company who paid (e.g., "Ahmed Khan", "Pakistan Detectors - Islamabad")
  paidTo?: string; // Person/company/vendor who received payment
  accountablePerson?: string; // New: Person on whose behalf payment is made
  transactionBy?: string; // Person who handled/processed the transaction (e.g., "Sir ABC", "Manager Ahmed")
  employeeId?: string; // For salary transactions
  employeeName?: string; // For salary transactions
  baseSalary?: number; // For salary transactions
  commission?: number; // For salary transactions
  deductions?: number; // For salary transactions
  netAmount?: number; // For salary transactions (base + commission - deductions)
  imageUrl?: string; // Optional image upload
  paymentStatus?: 'Full' | 'Partial'; // Payment status
  remainingAmount?: number; // Remaining amount for partial payments

  // Advance Salary fields
  isAdvanceSalary?: boolean; // Flag to identify advance salary transactions
  advanceAmount?: number; // Amount paid as advance
  remainingSalary?: number; // Remaining salary after advance
  salaryMonth?: string; // Month for which advance was given

  // Loan fields
  loanType?: 'Receivable' | 'Payable'; // For loan transactions
  borrowerName?: string; // For loan receivable (person/entity receiving money)
  lenderName?: string; // For loan payable (person/entity giving money)
  loanDate?: string; // Date when loan was given/taken
  expectedReturnDate?: string; // For loan receivable
  dueDate?: string; // For loan payable

  // New payment tracking fields
  partialPayments?: PartialPayment[]; // Track all partial payments under same transaction ID
  totalPaid?: number; // Total amount paid across all partial payments
  isFullyCleared?: boolean; // True when all payments are cleared AND fully paid
  depositedToBank?: boolean; // For cash/cheque: whether deposited to bank
  attachments?: Attachment[]; // New: Attachments for transaction
};

export type ProductTransfer = {
  id: string;
  date: string;
  productId: string;
  productName: string;
  brandName: string;
  modelName: string;
  serialNumbers: string[];
  fromLocation: string;
  toLocation: string;
  quantity: number;
  transferredBy: string;
  note: string;
  status?: 'Pending' | 'Received';
  receivedAt?: string;
  receiptName?: string;
  receiptType?: string;
  receiptDataUrl?: string;
};

export type PaymentRecord = {
  id: string;
  amount: number;
  mode: 'Cash' | 'Cheque' | 'Bank Transfer';
  date: string;
  bankId?: string;
  bankName?: string;
};

export type Loan = {
  id: string;
  entityName: string;
  loanAmount: number;
  paid: number;
  remaining: number;
  type: 'Payable' | 'Receivable';
  loanType: 'Official' | 'Personal' | 'Other';
  status: 'Full' | 'Partial';
  date: string;
  mode: 'Cash' | 'Bank';
  bankId?: string;
  bankName?: string;
  receiverType: 'Employee' | 'Person';
  receiverName: string;
  receiverId?: string;
  receiverPhone?: string;
  employeeId?: string;
  employeeName?: string;
  paymentHistory?: PaymentRecord[];
};

export type Bank = {
  id: string;
  name: string;
  balance: number;
  accountNumber: string;
};

export type BankTransfer = {
  id: string;
  date: string;
  fromBankId: string;
  fromBankName: string;
  toBankId: string;
  toBankName: string;
  amount: number;
  note: string;
};

export type CommissionSlab = {
  id: string;
  salesperson: string;
  city: string;
  fromAmount: number;
  toAmount: number;
  commissionPercentage: number;
};

export type ProductCostingType = {
  id: string;
  brandName: string;
  modelName: string;
  category: string;
  units: number;
  unitCostUSD: number;
  totalCostUSD: number;
  percentage: number;
  customPerModel: number;
  customPerUnit: number;
  freightPerModel: number;
  freightPerUnit: number;
  unitCostPKR: number;
  totalUnitCost: number;
  totalShipmentValuePKR: number;
};

export type Commission = {
  id: string;
  salesperson: string;
  salespersonName: string;
  city: string;
  month: string; // Format: "YYYY-MM"
  totalSales: number;
  appliedSlabFrom: number;
  appliedSlabTo: number;
  commissionPercentage: number;
  calculatedCommissionAmount: number;
  overriddenCommissionPercentage?: number;
  overriddenCommissionAmount?: number;
  status: 'Calculated' | 'Adjusted' | 'Confirmed';
  calculatedBy: string;
  confirmedBy?: string;
  calculatedAt: string;
  confirmedAt?: string;
  isLocked: boolean;
};

export type AppData = {
  employees: Employee[];
  products: Product[];
  transactions: Transaction[];
  loans: Loan[];
  banks: Bank[];
  invoices: Invoice[];
  bankTransfers: BankTransfer[];
  productTransfers: ProductTransfer[];
  commissionSlabs: CommissionSlab[];
  productCosting: ProductCostingType[];
  commissions: Commission[];
  budgets: Budget[];
  receivableStock: any[];
};

export const normalizeInitialData = (data: AppData): AppData => {
  const productsById = new Map<string, Product>();
  data.products.forEach((p) => {
    const initialStatus: { [serial: string]: 'Available' } = {};
    (p.serialNumbers || []).forEach((serial) => {
      if (serial) {
        initialStatus[serial] = 'Available';
      }
    });

    productsById.set(p.id, {
      ...p,
      serialNumbers: [...p.serialNumbers],
      serialCities: { ...p.serialCities },
      serialStatus: { ...(p.serialStatus || {}), ...initialStatus },
    });
  });

  data.invoices.forEach((invoice) => {
    invoice.products.forEach((invProd) => {
      const product = productsById.get(invProd.productId);
      if (!product) return;

      (invProd.serialNumbers || []).forEach((serial) => {
        if (!serial) return;
        if (!product.serialNumbers.includes(serial)) {
          product.serialNumbers.push(serial);
        }
        if (invoice.customerCity) {
          product.serialCities[serial] = invoice.customerCity;
        }
        if (!product.serialStatus) {
          product.serialStatus = {};
        }
        if (!product.serialStatus[serial]) {
          product.serialStatus[serial] = 'Available';
        }
      });
    });
  });

  const normalizedProducts = Array.from(productsById.values()).map((p) => ({
    ...p,
    stock: p.serialNumbers.length,
  }));

  return {
    ...data,
    products: normalizedProducts,
  };
};

// Empty initial data - all data will be loaded from Firebase
export const initialData: AppData = {
  receivableStock: [],
  employees: [],
  products: [], // Products will be added through UI
  transactions: [], // Transactions will be added through UI
  loans: [], // Loans will be added through UI
  banks: [], // Banks will be added through UI
  invoices: [],
  bankTransfers: [], // Transfers will be added through UI
  productTransfers: [],
  commissionSlabs: [], // Commission slabs will be added through UI
  productCosting: [],
  commissions: [], // Commissions will be calculated from sales
  budgets: [] // Budgets will be added through UI
};

 
export default function App() {
  const [activeModule, setActiveModule] = useState('login');
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<AppData>(() => normalizeInitialData(initialData));
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const renderModule = () => {
    switch (activeModule) {
      case 'login':
        return <Login onNavigateToSignup={() => setActiveModule('signup')} onLoginSuccess={(user) => { setUser(user); setActiveModule('dashboard'); }} />;
      case 'signup':
        return <Signup onNavigateToLogin={() => setActiveModule('login')} onSignupSuccess={(user) => { setUser(user); setActiveModule('dashboard'); }} />;
      case 'dashboard':
        return <Dashboard data={data} />;
      case 'employees':
        return <EmployeeListWrapper employees={data.employees} setEmployees={(employees) => setData({ ...data, employees })} />;

      case 'transactions':

        return <Transactions 
          transactions={data.transactions} 
          setTransactions={(transactions) => setData({ ...data, transactions })} 
          banks={data.banks}
          setBanks={(banks) => setData({ ...data, banks })}
        />;

      case 'invoices':
        return <InvoiceListWrapper 
          invoices={data.invoices || []} 
          products={data.products}
          setInvoices={(invoices) => setData({ ...data, invoices })}
          setProducts={(products) => setData({ ...data, products })}
        />;

      case 'product-transfer':
        return <ProductTransferWrapper />;


  

      case 'transaction-history':
        return <TransactionHistory transactions={data.transactions} />;
      case 'pending-payments':
        return <PendingPayments 
          transactions={data.transactions}
          setTransactions={(transactions) => setData({ ...data, transactions })}
          banks={data.banks}
        />;
      case 'loan-history':
        return <LoanHistory loans={data.loans} />;
      case 'cash-inflow':

        return <CashInflow 
          transactions={data.transactions} 
          setTransactions={(transactions) => setData({ ...data, transactions })}
          banks={data.banks}
          setBanks={(banks) => setData({ ...data, banks })}
        />;
      case 'cash-outflow':
        return <CashOutflow 
          transactions={data.transactions} 
          setTransactions={(transactions) => setData({ ...data, transactions })}
          banks={data.banks}
          setBanks={(banks) => setData({ ...data, banks })}
        />;
      case 'bills':
        return <Bills 
          transactions={data.transactions} 
          setTransactions={(transactions) => setData({ ...data, transactions })}
          banks={data.banks}
          setBanks={(banks) => setData({ ...data, banks })}
        />;
      case 'salary':
        // Salary feature component not yet implemented
        return <div className="p-6">Salary module coming soon...</div>;

      case 'advance-salary':
        return <AdvanceSalary
          employees={data.employees}
          banks={data.banks}
          transactions={data.transactions}
          setTransactions={(transactions) => setData({ ...data, transactions })}
          setBanks={(banks) => setData({ ...data, banks })}
        />;

      case 'sales-report':
        return <SalesReport invoices={data.invoices} products={data.products} />;
      case 'referral-report':
        return <ReferralReport invoices={data.invoices} />;
      case 'inventory-report':
        return <InventoryReport products={data.products} />;
      case 'transaction-history-report':
        return <TransactionHistoryReport transactions={data.transactions} />;
      case 'commission-slabs':
        return <CommissionSlabs commissionSlabs={data.commissionSlabs} setCommissionSlabs={(commissionSlabs) => setData({ ...data, commissionSlabs })} employees={data.employees} setActiveModule={setActiveModule} />;
      case 'commission-calculation':
        return <CommissionCalculation
          commissions={data.commissions}
          setCommissions={(commissions) => setData({ ...data, commissions })}
          commissionSlabs={data.commissionSlabs}
          invoices={data.invoices}
          employees={data.employees}
          setActiveModule={setActiveModule}
        />;
      case 'commission-report':
        return <CommissionReport commissions={data.commissions} />;
      case 'inventory-audit-log':
        return <InventoryAuditLogComponent auditLogs={[]} />;
      default:

        return <Dashboard data={data} />;
    }
  };

if (!user) {
  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      {renderModule()}
      <Toaster position="top-right" />
    </div>
  );
}

return (
  <div className="flex h-screen bg-[#f0f2f5]">
    <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} />
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <TopBar notifications={notifications} setNotifications={setNotifications} activeModule={activeModule} user={user} />
      </header>

      <main className="flex-1 overflow-y-auto">
        {renderModule()}
      </main>
    </div>
    <Toaster position="top-right" />
  </div>
);
}
