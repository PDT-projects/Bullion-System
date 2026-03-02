import { createBrowserRouter, useNavigate, Navigate, Outlet, useParams } from 'react-router-dom';
import { Signup } from './pages/Signup';
import { Login } from './pages/Login';
import { Dashboard } from './features/finance/Dashboard';

// Employee Module - MVVM Architecture with Firebase Data Connect
import { 
  EmployeeListWrapper, 
  EmployeeCreateWrapper, 
  EmployeeEditWrapper, 
  EmployeeDeleteWrapper 
} from './modules/employee';


// Inventory Module - MVVM Architecture (5-Step Flow)
import { InventoryDashboardView } from './modules/inventory/views/InventoryDashboardView';
import { InventoryListView } from './modules/inventory/views/InventoryListView';
import { ProductTransferWrapper } from './modules/inventory/views/ProductTransferWrapper';
import { ProductTransferCreateWrapper } from './modules/inventory/views/ProductTransferCreateWrapper';
import { InventoryTypeSelectionWrapper } from './modules/inventory/views/InventoryTypeSelectionWrapper';
import { InventoryCostingOptionWrapper } from './modules/inventory/views/InventoryCostingOptionWrapper';
import { InventoryProductDetailsWrapper } from './modules/inventory/views/InventoryProductDetailsWrapper';
import { InventoryPaymentWrapper } from './modules/inventory/views/InventoryPaymentWrapper';
import { useInventoryDashboardViewModel } from './modules/inventory/viewModels/useInventoryDashboardViewModel';
import { useInventoryListViewModel } from './modules/inventory/viewModels/useInventoryListViewModel';



// Invoice Module - MVVM Architecture
import { 
  InvoiceListWrapper, 
  InvoiceFormWrapper, 
  InvoiceDeleteWrapper,
  InvoiceReportWrapper 
} from './modules/invoices';


// Budget Module - MVVM Architecture
import {
  BudgetListWrapper,
  BudgetCreateWrapper,
  BudgetEditWrapper,
  BudgetDeleteWrapper,
  Budget
} from './modules/budget';


import { Bills } from './features/finance/Bills';


// Banking Module - MVVM Architecture
import {
  BankingDashboardWrapper,
  BankListWrapper,
  BankCreateWrapper,
  BankEditWrapper,
  BankDeleteWrapper,
  TransferListWrapper,
  TransferCreateWrapper,
  CashListWrapper,
  CashCreateWrapper
} from './modules/banking';


// Bills Module - MVVM Architecture
import {
  BillsListWrapper,
  BillsCreateWrapper,
  BillsEditWrapper,
  BillsDeleteWrapper
} from './modules/bills';


// Transactions Module - MVVM Architecture
import {
  TransactionListWrapper,
  TransactionCreateWrapper,
  TransactionEditWrapper,
  TransactionDeleteWrapper,
  PendingPaymentsWrapper
} from './modules/transactions';

// Salary Module - MVVM Architecture
import {
  SalaryListWrapper,
  SalaryCreateWrapper,
  SalaryEditWrapper,
  SalaryDeleteWrapper,
  SalaryDashboardWrapper
} from './modules/salary';




// Commission Module - MVVM Architecture
import { 
  CommissionSlabListWrapper,
  CommissionCalculationWrapper,
  CommissionReportWrapper
} from './modules/commission';

// Loans Module - MVVM Architecture
import {
  LoanDashboardWrapper,
  LoanListWrapper,
  LoanFormWrapper,
  LoanPaymentWrapper
} from './modules/loans';

import { Sidebar } from './layouts/Sidebar';
import { TopBar } from './layouts/TopBar';
import { useAuth } from './providers/context/AuthContext';
import { DataProvider } from './providers/context/DataContext';
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AppData, initialData, normalizeInitialData, Employee, Bank, Transaction, Loan, BankTransfer } from './App';
import type { Transaction as ModuleTransaction } from './modules/transactions/models/types';

import { CashTransaction } from './modules/banking/models/types';


// --- PROTECTED ROUTE WRAPPER ---
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// --- SIGNUP WRAPPER ---
function SignupPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  return (
    <Signup 
      onNavigateToLogin={() => navigate('/login')} 
      onSignupSuccess={(user) => {
        setUser(user);
        navigate('/dashboard');
      }} 
    />
  );
}

// --- LOGIN WRAPPER ---
function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  return (
    <Login 
      onNavigateToSignup={() => navigate('/signup')} 
      onLoginSuccess={(user) => {
        setUser(user);
        navigate('/dashboard');
      }} 
    />
  );
}

// --- DASHBOARD LAYOUT WITH SIDEBAR AND TOPBAR ---
function DashboardLayout() {
  const { user } = useAuth();
  const [data] = useState<AppData>(() => normalizeInitialData(initialData));

  return (
    <div className="flex h-screen bg-[#f0f2f5]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <TopBar notifications={[]} setNotifications={() => {}} activeModule="dashboard" user={user} />
        </header>
        <main className="flex-1 overflow-y-auto">
          <Dashboard data={data} />
        </main>
      </div>
    </div>
  );
}

// --- EMPLOYEES LAYOUT WITH SIDEBAR AND TOPBAR ---
// Now uses Firebase Data Connect - no outlet context needed
function EmployeesLayout() {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-[#f0f2f5]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <TopBar notifications={[]} setNotifications={() => {}} activeModule="employees" user={user} />
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}



// --- INVENTORY MVVM WRAPPER COMPONENTS ---

function InventoryDashboardWrapper() {
  const viewModel = useInventoryDashboardViewModel();
  return <InventoryDashboardView {...viewModel} />;
}

function InventoryListWrapper() {
  const viewModel = useInventoryListViewModel();
  return <InventoryListView {...viewModel} />;
}

// New 5-Step Inventory Flow Wrappers
function InventoryTypeSelectionRoute() {
  return <InventoryTypeSelectionWrapper />;
}

function InventoryCostingOptionRoute() {
  return <InventoryCostingOptionWrapper />;
}


function InventoryProductDetailsRoute() {
  return <InventoryProductDetailsWrapper />;
}

function InventoryPaymentRoute() {
  return <InventoryPaymentWrapper />;
}

// --- PRODUCT TRANSFER LAYOUT WITH SIDEBAR AND TOPBAR ---
function ProductTransferLayout() {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-[#f0f2f5]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <TopBar notifications={[]} setNotifications={() => {}} activeModule="product-transfer" user={user} />
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// --- INVENTORY LAYOUT WITH SIDEBAR AND TOPBAR ---
function InventoryLayout() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);

  return (
    <div className="flex h-screen bg-[#f0f2f5]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <TopBar notifications={[]} setNotifications={() => {}} activeModule="inventory" user={user} />
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet context={{ products, setProducts, transfers, setTransfers }} />
        </main>
      </div>
    </div>
  );
}


// --- INVOICES LAYOUT WITH SIDEBAR AND TOPBAR ---
function InvoicesLayout() {
  const { user } = useAuth();
  const [data, setData] = useState<AppData>(() => normalizeInitialData(initialData));

  return (
    <div className="flex h-screen bg-[#f0f2f5]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <TopBar notifications={[]} setNotifications={() => {}} activeModule="invoices" user={user} />
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet context={{ 
            invoices: data.invoices || [], 
            setInvoices: (invoices: any[]) => setData({ ...data, invoices }),
            products: data.products || [],
            setProducts: (products: any[]) => setData({ ...data, products }),
            employees: data.employees,
            banks: data.banks
          }} />
        </main>
      </div>
    </div>
  );
}

// --- INVOICE MVVM WRAPPER COMPONENTS ---

function InvoiceListRoute() {
  const { invoices, setInvoices, products, setProducts } = useOutletContext<{
    invoices: any[];
    setInvoices: (invoices: any[]) => void;
    products: any[];
    setProducts: (products: any[]) => void;
  }>();
  
  return (
    <InvoiceListWrapper 
      invoices={invoices}
      products={products}
      setInvoices={setInvoices}
      setProducts={setProducts}
    />
  );
}

function InvoiceFormRoute() {
  const { invoices, setInvoices, products, setProducts, employees, banks } = useOutletContext<{
    invoices: any[];
    setInvoices: (invoices: any[]) => void;
    products: any[];
    setProducts: (products: any[]) => void;
    employees: Employee[];
    banks: Bank[];
  }>();
  
  return (
    <InvoiceFormWrapper 
      invoices={invoices}
      products={products}
      employees={employees}
      banks={banks}
      setInvoices={setInvoices}
      setProducts={setProducts}
    />
  );
}

function InvoiceDeleteRoute() {
  const { invoices, setInvoices, products, setProducts } = useOutletContext<{
    invoices: any[];
    setInvoices: (invoices: any[]) => void;
    products: any[];
    setProducts: (products: any[]) => void;
  }>();
  
  return (
    <InvoiceDeleteWrapper 
      invoices={invoices}
      products={products}
      setInvoices={setInvoices}
      setProducts={setProducts}
    />
  );
}

function InvoiceReportRoute() {
  const { invoices } = useOutletContext<{
    invoices: any[];
  }>();
  
  return (
    <InvoiceReportWrapper 
      invoices={invoices}
    />
  );
}

// --- BUDGETS LAYOUT WITH SIDEBAR AND TOPBAR ---
function BudgetsLayout() {
  const { user } = useAuth();
  const [data, setData] = useState<AppData>(() => normalizeInitialData(initialData));

  return (
    <div className="flex h-screen bg-[#f0f2f5]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <TopBar notifications={[]} setNotifications={() => {}} activeModule="budgets" user={user} />
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet context={{
            budgets: data.budgets,
            setBudgets: (budgets: Budget[]) => setData({ ...data, budgets })
          }} />
        </main>
      </div>
    </div>
  );
}

// --- BUDGET MVVM WRAPPER COMPONENTS ---

function BudgetListRoute() {
  return <BudgetListWrapper />;
}

function BudgetCreateRoute() {
  return <BudgetCreateWrapper />;
}

function BudgetEditRoute() {
  return <BudgetEditWrapper />;
}

function BudgetDeleteRoute() {
  return <BudgetDeleteWrapper />;
}

// --- FINANCE LAYOUT WITH SIDEBAR AND TOPBAR ---
function FinanceLayout() {
  const { user } = useAuth();
  const [data, setData] = useState<AppData>(() => normalizeInitialData(initialData));

  return (
    <div className="flex h-screen bg-[#f0f2f5]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <TopBar notifications={[]} setNotifications={() => {}} activeModule="finance" user={user} />
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet context={{ 
            banks: data.banks, 
            setBanks: (banks: Bank[]) => setData({ ...data, banks }),
            transactions: data.transactions,
            setTransactions: (transactions: Transaction[]) => setData({ ...data, transactions })
          }} />
        </main>
      </div>
    </div>
  );
}

// --- WRAPPER COMPONENTS FOR FINANCE ROUTES ---
function FinanceTransactionsWrapper() {
  // Transactions component manages its own state internally
  return <TransactionListWrapper />;
}

function FinancePendingPaymentsWrapper() {

  const { transactions, setTransactions, banks } = useOutletContext<{
    transactions: Transaction[];
    setTransactions: (transactions: Transaction[]) => void;
    banks: Bank[];
  }>();

  return (
    <PendingPaymentsWrapper 
      transactions={transactions as ModuleTransaction[]}
      setTransactions={setTransactions as (transactions: ModuleTransaction[]) => void}
      banks={banks}
    />
  );
}


function FinanceBillsWrapper() {
  const { transactions, setTransactions, banks, setBanks } = useOutletContext<{
    transactions: Transaction[];
    setTransactions: (transactions: Transaction[]) => void;
    banks: Bank[];
    setBanks: (banks: Bank[]) => void;
  }>();

  return (
    <Bills 
      transactions={transactions}
      setTransactions={setTransactions}
      banks={banks}
      setBanks={setBanks}
    />
  );
}

// --- BILLS MVVM WRAPPER COMPONENTS ---

function BillsListRoute() {
  return <BillsListWrapper />;
}

function BillsCreateRoute() {
  return <BillsCreateWrapper />;
}

function BillsEditRoute() {
  return <BillsEditWrapper />;
}

function BillsDeleteRoute() {
  return <BillsDeleteWrapper />;
}

// --- TRANSACTIONS MVVM WRAPPER COMPONENTS ---

function TransactionListRoute() {
  return <TransactionListWrapper />;
}




function TransactionCreateRoute() {
  const { transactions, setTransactions } = useOutletContext<{
    transactions: Transaction[];
    setTransactions: (transactions: Transaction[]) => void;
  }>();
  
  return (
    <TransactionCreateWrapper 
      transactions={transactions as ModuleTransaction[]}
      setTransactions={setTransactions as (transactions: ModuleTransaction[]) => void}
    />
  );
}


function TransactionEditRoute() {
  const { transactions, setTransactions } = useOutletContext<{
    transactions: Transaction[];
    setTransactions: (transactions: Transaction[]) => void;
  }>();
  
  return (
    <TransactionEditWrapper 
      transactions={transactions as ModuleTransaction[]}
      setTransactions={setTransactions as (transactions: ModuleTransaction[]) => void}
    />
  );
}


function TransactionDeleteRoute() {
  const { transactions, setTransactions } = useOutletContext<{
    transactions: Transaction[];
    setTransactions: (transactions: Transaction[]) => void;
  }>();
  
  return (
    <TransactionDeleteWrapper 
      transactions={transactions as ModuleTransaction[]}
      setTransactions={setTransactions as (transactions: ModuleTransaction[]) => void}
    />
  );
}


function FinanceSalaryWrapper() {
  // Salary feature component - redirects to salary page
  return <Navigate to="/salary" replace />;
}


// --- SALARY MVVM WRAPPER COMPONENTS ---


function SalaryDashboardRoute() {
  return <SalaryDashboardWrapper />;
}

function SalaryAllListRoute() {
  return <SalaryListWrapper type="all" title="All Salaries" />;
}

function SalaryRegularListRoute() {
  return <SalaryListWrapper type="regular" title="Regular Salaries" />;
}

function SalaryAdvanceListRoute() {
  return <SalaryListWrapper type="advance" title="Advance Salaries" />;
}

function SalaryCreateRegularRoute() {
  return <SalaryCreateWrapper type="regular" />;
}

function SalaryCreateAdvanceRoute() {
  return <SalaryCreateWrapper type="advance" />;
}

function SalaryEditRoute() {
  return <SalaryEditWrapper />;
}

function SalaryDeleteRoute() {
  return <SalaryDeleteWrapper />;
}

// --- SALARY LAYOUT WITH SIDEBAR AND TOPBAR ---
function SalaryLayout() {
  const { user } = useAuth();
  const [data, setData] = useState<AppData>(() => normalizeInitialData(initialData));

  return (
    <div className="flex h-screen bg-[#f0f2f5]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <TopBar notifications={[]} setNotifications={() => {}} activeModule="salary" user={user} />
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet context={{ 
            transactions: data.transactions,
            setTransactions: (transactions: Transaction[]) => setData({ ...data, transactions }),
            employees: data.employees,
            banks: data.banks
          }} />
        </main>
      </div>
    </div>
  );
}

// --- COMMISSION LAYOUT WITH SIDEBAR AND TOPBAR ---
function CommissionLayout() {
  const { user } = useAuth();
  const [data, setData] = useState<AppData>(() => normalizeInitialData(initialData));

  return (
    <div className="flex h-screen bg-[#f0f2f5]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <TopBar notifications={[]} setNotifications={() => {}} activeModule="commission" user={user} />
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet context={{ 
            invoices: data.invoices || [],
            employees: data.employees
          }} />
        </main>
      </div>
    </div>
  );
}

// --- COMMISSION MVVM WRAPPER COMPONENTS ---

function CommissionSlabsRoute() {
  const { employees } = useOutletContext<{
    employees: Employee[];
  }>();
  
  return <CommissionSlabListWrapper employees={employees} />;
}

function CommissionCalculationRoute() {
  const { invoices, employees } = useOutletContext<{
    invoices: any[];
    employees: Employee[];
  }>();
  
  return (
    <CommissionCalculationWrapper 
      employees={employees}
      invoices={invoices}
      onCommissionsSaved={() => {
        // Could add toast notification here
        console.log('Commissions saved successfully');
      }}
    />
  );
}

function CommissionReportsRoute() {
  const { employees } = useOutletContext<{
    employees: Employee[];
  }>();
  
  return <CommissionReportWrapper employees={employees} />;
}




// --- LOANS LAYOUT WITH SIDEBAR AND TOPBAR ---
function LoansLayout() {
  const { user } = useAuth();
  const [data, setData] = useState<AppData>(() => normalizeInitialData(initialData));

  return (
    <div className="flex h-screen bg-[#f0f2f5]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <TopBar notifications={[]} setNotifications={() => {}} activeModule="loans" user={user} />
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet context={{ 
            loans: data.loans, 
            setLoans: (loans: Loan[]) => setData({ ...data, loans }),
            employees: data.employees,
            banks: data.banks,
            setBanks: (banks: Bank[]) => setData({ ...data, banks })
          }} />
        </main>
      </div>
    </div>
  );
}

// --- LOANS MVVM WRAPPER COMPONENTS ---

function LoanDashboardRoute() {
  const { banks, employees } = useOutletContext<{
    banks: Bank[];
    employees: Employee[];
  }>();
  
  return <LoanDashboardWrapper banks={banks} employees={employees} />;
}

function LoanListRoute() {
  const { banks, employees, setBanks } = useOutletContext<{
    banks: Bank[];
    employees: Employee[];
    setBanks: (banks: Bank[]) => void;
  }>();
  
  return <LoanListWrapper banks={banks} employees={employees} setBanks={setBanks} />;
}

function LoanPayableListRoute() {
  const { banks, employees, setBanks } = useOutletContext<{
    banks: Bank[];
    employees: Employee[];
    setBanks: (banks: Bank[]) => void;
  }>();
  
  return <LoanListWrapper banks={banks} employees={employees} setBanks={setBanks} initialType="Payable" />;
}

function LoanReceivableListRoute() {
  const { banks, employees, setBanks } = useOutletContext<{
    banks: Bank[];
    employees: Employee[];
    setBanks: (banks: Bank[]) => void;
  }>();
  
  return <LoanListWrapper banks={banks} employees={employees} setBanks={setBanks} initialType="Receivable" />;
}

function LoanCreatePayableRoute() {
  const { banks, employees, setBanks } = useOutletContext<{
    banks: Bank[];
    employees: Employee[];
    setBanks: (banks: Bank[]) => void;
  }>();
  
  return <LoanFormWrapper banks={banks} employees={employees} setBanks={setBanks} defaultType="Payable" />;
}

function LoanCreateReceivableRoute() {
  const { banks, employees, setBanks } = useOutletContext<{
    banks: Bank[];
    employees: Employee[];
    setBanks: (banks: Bank[]) => void;
  }>();
  
  return <LoanFormWrapper banks={banks} employees={employees} setBanks={setBanks} defaultType="Receivable" />;
}

function LoanEditRoute() {
  const { banks, employees, setBanks } = useOutletContext<{
    banks: Bank[];
    employees: Employee[];
    setBanks: (banks: Bank[]) => void;
  }>();
  
  return <LoanFormWrapper banks={banks} employees={employees} setBanks={setBanks} />;
}

function LoanPaymentRoute() {
  const { banks, setBanks } = useOutletContext<{
    banks: Bank[];
    setBanks: (banks: Bank[]) => void;
  }>();
  
  return <LoanPaymentWrapper banks={banks} setBanks={setBanks} />;
}


// --- BANKING LAYOUT WITH SIDEBAR AND TOPBAR ---
function BankingLayout() {
  const { user } = useAuth();
  const [data, setData] = useState<AppData>(() => normalizeInitialData(initialData));
  const [transfers, setTransfers] = useState<BankTransfer[]>([]);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);

  return (
    <div className="flex h-screen bg-[#f0f2f5]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <TopBar notifications={[]} setNotifications={() => {}} activeModule="banking" user={user} />
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet context={{ 
            banks: data.banks, 
            setBanks: (banks: Bank[]) => setData({ ...data, banks }),
            transactions: data.transactions,
            transfers,
            setTransfers,
            cashTransactions,
            setCashTransactions
          }} />
        </main>
      </div>
    </div>
  );
}

// --- BANKING MVVM WRAPPER COMPONENTS ---

function BankingDashboardRoute() {
  return <BankingDashboardWrapper />;
}

function BankListRoute() {
  return <BankListWrapper />;
}

function BankCreateRoute() {
  return <BankCreateWrapper />;
}

function BankEditRoute() {
  return <BankEditWrapper />;
}

function BankDeleteRoute() {
  return <BankDeleteWrapper />;
}

function TransferListRoute() {
  return <TransferListWrapper />;
}

function TransferCreateRoute() {
  return <TransferCreateWrapper />;
}

function CashListRoute() {
  return <CashListWrapper />;
}

function CashCreateRoute() {
  return <CashCreateWrapper />;
}


export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/signup",
    element: <SignupPage />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
  },
  {
    path: "/employees",
    element: (
      <ProtectedRoute>
        <EmployeesLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <EmployeeListWrapper />,
      },
      {
        path: "create",
        element: <EmployeeCreateWrapper />,
      },
      {
        path: ":id/edit",
        element: <EmployeeEditWrapper />,
      },
      {
        path: ":id/delete",
        element: <EmployeeDeleteWrapper />,
      }
    ],
  },

  {
    path: "/product-transfer",
    element: (
      <ProtectedRoute>
        <InventoryLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <ProductTransferWrapper />,
      },
      {
        path: "new",
        element: <ProductTransferCreateWrapper />,
      },

    ],
  },


  {
    path: "/inventory",
    element: (
      <ProtectedRoute>
        <InventoryLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <InventoryDashboardWrapper />,
      },
      {
        path: "create-new",
        element: <InventoryTypeSelectionRoute />,
      },
      {
        path: "create-new/costing",
        element: <InventoryCostingOptionRoute />,
      },
      {
        path: "create-new/details",
        element: <InventoryProductDetailsRoute />,
      },

      {
        path: "create-new/payment",
        element: <InventoryPaymentRoute />,
      },
      {
        path: "add-existing",
        element: <InventoryListWrapper />,
      },
      {
        path: "receivable",
        element: <InventoryListWrapper />,
      },
      {
        path: "view",
        element: <InventoryListWrapper />,
      }
    ],
  },


  {
    path: "/invoices",
    element: (
      <ProtectedRoute>
        <InvoicesLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <InvoiceListRoute />,
      },
      {
        path: "new",
        element: <InvoiceFormRoute />,
      },
      {
        path: ":id/edit",
        element: <InvoiceFormRoute />,
      },
      {
        path: ":id/delete",
        element: <InvoiceDeleteRoute />,
      },
      {
        path: "reports",
        element: <InvoiceReportRoute />,
      },
    ],
  },



  {
    path: "/budgets",
    element: (
      <ProtectedRoute>
        <BudgetsLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <BudgetListRoute />,
      },
      {
        path: "create",
        element: <BudgetCreateRoute />,
      },
      {
        path: ":id/edit",
        element: <BudgetEditRoute />,
      },
      {
        path: ":id/delete",
        element: <BudgetDeleteRoute />,
      },
    ],
  },

  {
    path: "/finance",
    element: (
      <ProtectedRoute>
        <FinanceLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "transactions",
        element: <Navigate to="/transactions" replace />,
      },

      {
        path: "banks",
        element: <Navigate to="/banking/banks" replace />,
      },

      {
        path: "pending-payments",
        element: <FinancePendingPaymentsWrapper />,
      },
      {
        path: "bills",
        element: <Navigate to="/bills" replace />,
      },

      {
        path: "salary",
        element: <FinanceSalaryWrapper />,
      },
      {
        path: "bank-transfers",
        element: <Navigate to="/banking/transfers" replace />,
      },
      {
        path: "cash-in-hand",
        element: <Navigate to="/banking/cash-in-hand" replace />,
      },

    ],
  },
  {
    path: "/loans",
    element: (
      <ProtectedRoute>
        <LoansLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <LoanDashboardRoute />,
      },
      {
        path: "all",
        element: <LoanListRoute />,
      },
      {
        path: "payable",
        element: <LoanPayableListRoute />,
      },
      {
        path: "receivable",
        element: <LoanReceivableListRoute />,
      },
      {
        path: "create-payable",
        element: <LoanCreatePayableRoute />,
      },
      {
        path: "create-receivable",
        element: <LoanCreateReceivableRoute />,
      },
      { path: "create", element: <LoanEditRoute /> },
      {
        path: ":id/edit",
        element: <LoanEditRoute />,
      },
      {
        path: "create",
        element: <LoanEditRoute />, 
      },
      {
        path: "payable",
        element: <LoanPayableListRoute />,
      },
      {
        path: ":id/payment",
        element: <LoanPaymentRoute />,
      },
    ],
  },

  {
    path: "/banking",
    element: (
      <ProtectedRoute>
        <BankingLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <BankingDashboardRoute />,
      },
      {
        path: "banks",
        element: <BankListRoute />,
      },
      {
        path: "banks/new",
        element: <BankCreateRoute />,
      },
      {
        path: "banks/:id/edit",
        element: <BankEditRoute />,
      },
      {
        path: "banks/:id/delete",
        element: <BankDeleteRoute />,
      },
      {
        path: "transfers",
        element: <TransferListRoute />,
      },
      {
        path: "transfers/new",
        element: <TransferCreateRoute />,
      },
      {
        path: "cash",
        element: <CashListRoute />,
      },
      {
        path: "cash/new",
        element: <CashCreateRoute />,
      },
    ],
  },

  {
    path: "/bills",
    element: (
      <ProtectedRoute>
        <FinanceLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <BillsListRoute />,
      },
      {
        path: "create",
        element: <BillsCreateRoute />,
      },
      {
        path: ":id/edit",
        element: <BillsEditRoute />,
      },
      {
        path: ":id/delete",
        element: <BillsDeleteRoute />,
      },
    ],
  },

  {
    path: "/transactions",
    element: (
      <ProtectedRoute>
        <FinanceLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <TransactionListRoute />,
      },
      {
        path: "new",
        element: <TransactionCreateRoute />,
      },
      {
        path: ":id/edit",
        element: <TransactionEditRoute />,
      },
      {
        path: ":id/delete",
        element: <TransactionDeleteRoute />,
      },
    ],
  },

  {
    path: "/salary",
    element: (
      <ProtectedRoute>
        <SalaryLayout />
      </ProtectedRoute>
    ),
children: [
      {
        index: true,
        element: <SalaryDashboardRoute />,
      },

      {
        path: "all",
        element: <SalaryAllListRoute />,
      },
      {
        path: "regular",
        element: <SalaryRegularListRoute />,
      },
      {
        path: "advance",
        element: <SalaryAdvanceListRoute />,
      },
      {
        path: "create-regular",
        element: <SalaryCreateRegularRoute />,
      },
      {
        path: "create-advance",
        element: <SalaryCreateAdvanceRoute />,
      },
      {
        path: ":id/edit",
        element: <SalaryEditRoute />,
      },
      {
        path: ":id/delete",
        element: <SalaryDeleteRoute />,
      },

    ],
  },
  {
    path: "/commission",
    element: (
      <ProtectedRoute>
        <CommissionLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <CommissionSlabsRoute />,
      },
      {
        path: "slabs",
        element: <CommissionSlabsRoute />,
      },
      {
        path: "calculate",
        element: <CommissionCalculationRoute />,
      },
      {
        path: "reports",
        element: <CommissionReportsRoute />,
      },
    ],
  }

]);
