import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './providers/context/AuthContext';
import { Budget } from './types/Budget';

// ============================================================
// SHARED TYPES
// Used by router layouts and legacy commented modules
// ============================================================

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

// export type Transaction = {
//   id: string;
//   transactionId: string;
//   date: string;
//   time: string;
//   company: string;
//   mainCategory: 'Cash Inflow' | 'Cash Outflow' | 'Loans & Advances' | 'Salary' | 'Bills' | 'Loan';
//   subCategory: string;
//   amount: number;
//   mode: 'Cash' | 'Bank' | 'Cheque';
//   bankName?: string;
//   bankId?: string;
//   chequeNumber?: string;
//   chequeDate?: string;
//   transactionReference?: string;
//   note: string;
//   paidBy?: string;
//   paidTo?: string;
//   accountablePerson?: string;
//   transactionBy?: string;
//   employeeId?: string;
//   employeeName?: string;
//   baseSalary?: number;
//   commission?: number;
//   deductions?: number;
//   netAmount?: number;
//   imageUrl?: string;
//   paymentStatus?: 'Full' | 'Partial';
//   remainingAmount?: number;
//   isAdvanceSalary?: boolean;
//   advanceAmount?: number;
//   remainingSalary?: number;
//   salaryMonth?: string;
//   loanType?: 'Receivable' | 'Payable';
//   borrowerName?: string;
//   lenderName?: string;
//   loanDate?: string;
//   expectedReturnDate?: string;
//   dueDate?: string;
//   totalPaid?: number;
//   isFullyCleared?: boolean;
//   depositedToBank?: boolean;
// };

// export type PaymentRecord = {
//   id: string;
//   amount: number;
//   date: string;
//   time: string;
//   method: 'Cash' | 'Cheque' | 'Bank Transfer';
//   bankId?: string;
//   chequeNumber?: string;
//   isCleared: boolean;
//   depositedDate?: string;
// };

// export type Loan = {
//   id: string;
//   entityName: string;
//   loanAmount: number;
//   paid: number;
//   remaining: number;
//   type: 'Payable' | 'Receivable';
//   loanType: 'Official' | 'Personal' | 'Other';
//   status: 'Full' | 'Partial';
//   date: string;
//   mode: 'Cash' | 'Bank';
//   bankId?: string;
//   bankName?: string;
//   receiverType: 'Employee' | 'Person';
//   receiverName: string;
//   receiverId?: string;
//   receiverPhone?: string;
//   employeeId?: string;
//   employeeName?: string;
//   paymentHistory?: PaymentRecord[];
// };

// export type Bank = {
//   id: string;
//   name: string;
//   balance: number;
//   accountNumber: string;
// };

// export type BankTransfer = {
//   id: string;
//   date: string;
//   fromBankId: string;
//   fromBankName: string;
//   toBankId: string;
//   toBankName: string;
//   amount: number;
//   note: string;
// };

// export type Product = {
//   id: string;
//   brandName: string;
//   modelName: string;
//   category: string;
//   costPrice: number;
//   sellPrice: number;
//   buyType: 'Import' | 'Export';
//   warrantyYears: number;
//   stock: number;
//   serialNumbers: string[];
//   serialCities: { [serialNumber: string]: string };
//   serialStatus?: { [serialNumber: string]: 'Available' | 'In Transit' | 'Damaged' | 'Returned' };
//   description: string;
//   status: 'New' | 'Used' | 'Returned';
//   createdDate?: string;
// };

// export type CommissionSlab = {
//   id: string;
//   salesperson: string;
//   city: string;
//   fromAmount: number;
//   toAmount: number;
//   commissionPercentage: number;
// };

// export type Commission = {
//   id: string;
//   salesperson: string;
//   salespersonName: string;
//   city: string;
//   month: string;
//   totalSales: number;
//   appliedSlabFrom: number;
//   appliedSlabTo: number;
//   commissionPercentage: number;
//   calculatedCommissionAmount: number;
//   overriddenCommissionPercentage?: number;
//   overriddenCommissionAmount?: number;
//   status: 'Calculated' | 'Adjusted' | 'Confirmed';
//   calculatedBy: string;
//   confirmedBy?: string;
//   calculatedAt: string;
//   confirmedAt?: string;
//   isLocked: boolean;
// };

export type AppData = {
  employees: Employee[];
  budgets: Budget[];
  // transactions: Transaction[];
  // loans: Loan[];
  // banks: Bank[];
  // products: Product[];
  // invoices: Invoice[];
  // bankTransfers: BankTransfer[];
  // productTransfers: ProductTransfer[];
  // commissionSlabs: CommissionSlab[];
  // productCosting: ProductCostingType[];
  // commissions: Commission[];
  // receivableStock: any[];
};

export const initialData: AppData = {
  employees: [],
  budgets: [],
  // transactions: [],
  // loans: [],
  // banks: [],
  // products: [],
  // invoices: [],
  // bankTransfers: [],
  // productTransfers: [],
  // commissionSlabs: [],
  // productCosting: [],
  // commissions: [],
  // receivableStock: [],
};

// ============================================================
// APP ROOT
// ============================================================

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </AuthProvider>
  );
}