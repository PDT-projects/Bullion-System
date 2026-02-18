import { createBrowserRouter, useNavigate, Navigate, Outlet } from 'react-router-dom';
import { Signup } from './pages/Signup';
import { Login } from './pages/Login';
import { Dashboard } from './features/finance/Dashboard';
import { EmployeesPage } from './pages/employee/EmployeesPage';
import { CreateEmployeePage } from './pages/employee/CreateEmployeePage';
import { EditEmployeePage } from './pages/employee/EditEmployeePage';
import { DeleteEmployeePage } from './pages/employee/DeleteEmployeePage';
import { ProductTransferPage } from './pages/inventory/ProductTransferPage';
import { NewProductTransferPage } from './pages/inventory/NewProductTransferPage';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { CreateNewInventoryPage } from './pages/inventory/CreateNewInventoryPage';
import { ProductDetailsPage } from './pages/inventory/ProductDetailsPage';
import { PaymentPage } from './pages/inventory/PaymentPage';
import { AddExistingInventoryPage } from './pages/inventory/AddExistingInventoryPage';
import { ReceivableStockPage } from './pages/inventory/ReceivableStockPage';
import { ViewInventoryPage } from './pages/inventory/ViewInventoryPage';
import { InvoicesPage } from './pages/invoices/InvoicesPage';
import { CreateInvoicePage } from './pages/invoices/CreateInvoicePage';


import { BudgetsPage } from './pages/budgets/BudgetsPage';
import { CreateBudgetPage } from './pages/budgets/CreateBudgetPage';
import { Transactions } from './features/finance/Transactions';
import { PendingPayments } from './features/finance/PendingPayments';
import { Bills } from './features/finance/Bills';
import { Salary } from './features/hr/Salary';

import { LoansPage } from './pages/loans/LoansPage';
import { AllLoansPage } from './pages/loans/AllLoansPage';
import { PayableLoansPage } from './pages/loans/PayableLoansPage';
import { ReceivableLoansPage } from './pages/loans/ReceivableLoansPage';
import { CreatePayableLoanPage } from './pages/loans/CreatePayableLoanPage';
import { CreateReceivableLoanPage } from './pages/loans/CreateReceivableLoanPage';
import { EditLoanPage } from './pages/loans/EditLoanPage';
import { DeleteLoanPage } from './pages/loans/DeleteLoanPage';

// Banking Pages
import { BankingPage } from './pages/banking/BankingPage';
import { BanksPage } from './pages/banking/BanksPage';
import { CreateBankPage } from './pages/banking/CreateBankPage';
import { EditBankPage } from './pages/banking/EditBankPage';
import { DeleteBankPage } from './pages/banking/DeleteBankPage';
import { BankTransfersPage } from './pages/banking/BankTransfersPage';
import { CreateTransferPage } from './pages/banking/CreateTransferPage';
import { CashInHandPage } from './pages/banking/CashInHandPage';

// Bills Pages
import { BillsPage } from './pages/bills/BillsPage';
import { CreateBillPage } from './pages/bills/CreateBillPage';

// Transactions Pages
import { TransactionsPage } from './pages/transactions/TransactionsPage';
import { CreateTransactionPage } from './pages/transactions/CreateTransactionPage';
import { EditTransactionPage } from './pages/transactions/EditTransactionPage';
import { DeleteTransactionPage } from './pages/transactions/DeleteTransactionPage';

// Salary Pages
import { SalaryPage } from './pages/salary/SalaryPage';
import { AllSalariesPage } from './pages/salary/AllSalariesPage';
import { RegularSalariesPage } from './pages/salary/RegularSalariesPage';
import { AdvanceSalariesPage } from './pages/salary/AdvanceSalariesPage';
import { CreateRegularSalaryPage } from './pages/salary/CreateRegularSalaryPage';
import { CreateAdvanceSalaryPage } from './pages/salary/CreateAdvanceSalaryPage';
import { EditSalaryPage } from './pages/salary/EditSalaryPage';
import { DeleteSalaryPage } from './pages/salary/DeleteSalaryPage';

// Commission Pages
import { CommissionPage } from './pages/commission/CommissionPage';
import { CommissionSlabsPage } from './pages/commission/CommissionSlabsPage';
import { CommissionCalculationPage } from './pages/commission/CommissionCalculationPage';
import { CommissionReportsPage } from './pages/commission/CommissionReportsPage';









import { Sidebar } from './layouts/Sidebar';
import { TopBar } from './layouts/TopBar';
import { useAuth } from './providers/context/AuthContext';
import { DataProvider } from './providers/context/DataContext';
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AppData, initialData, normalizeInitialData, Employee, Bank, Transaction, Loan, BankTransfer } from './App';




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
function EmployeesLayout() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);

  return (
    <div className="flex h-screen bg-[#f0f2f5]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <TopBar notifications={[]} setNotifications={() => {}} activeModule="employees" user={user} />
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet context={{ employees, setEmployees }} />
        </main>
      </div>
    </div>
  );
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

  return (
    <DataProvider>
      <div className="flex h-screen bg-[#f0f2f5]">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
            <TopBar notifications={[]} setNotifications={() => {}} activeModule="inventory" user={user} />
          </header>
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </DataProvider>
  );
}

// --- INVOICES LAYOUT WITH SIDEBAR AND TOPBAR ---
function InvoicesLayout() {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-[#f0f2f5]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <TopBar notifications={[]} setNotifications={() => {}} activeModule="invoices" user={user} />
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// --- BUDGETS LAYOUT WITH SIDEBAR AND TOPBAR ---
function BudgetsLayout() {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-[#f0f2f5]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <TopBar notifications={[]} setNotifications={() => {}} activeModule="budgets" user={user} />
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
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
  return <Transactions />;
}

function FinancePendingPaymentsWrapper() {

  const { transactions, setTransactions, banks } = useOutletContext<{
    transactions: Transaction[];
    setTransactions: (transactions: Transaction[]) => void;
    banks: Bank[];
  }>();

  return (
    <PendingPayments 
      transactions={transactions}
      setTransactions={setTransactions}
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

function FinanceSalaryWrapper() {
  const { transactions, setTransactions, banks, setBanks } = useOutletContext<{
    transactions: Transaction[];
    setTransactions: (transactions: Transaction[]) => void;
    banks: Bank[];
    setBanks: (banks: Bank[]) => void;
  }>();

  // Get employees from context or use empty array
  const [employees, setEmployees] = useState<Employee[]>([]);

  return (
    <Salary 
      transactions={transactions}
      setTransactions={setTransactions}
      banks={banks}
      setBanks={setBanks}
      employees={employees}
      setActiveModule={() => {}}
    />
  );
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
  const [commissions, setCommissions] = useState<any[]>([]);
  const [commissionSlabs, setCommissionSlabs] = useState<any[]>([]);

  return (
    <div className="flex h-screen bg-[#f0f2f5]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <TopBar notifications={[]} setNotifications={() => {}} activeModule="commission" user={user} />
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet context={{ 
            commissions,
            setCommissions,
            commissionSlabs,
            setCommissionSlabs,
            invoices: data.invoices || [],
            employees: data.employees
          }} />
        </main>
      </div>
    </div>
  );
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

// --- BANKING LAYOUT WITH SIDEBAR AND TOPBAR ---
function BankingLayout() {
  const { user } = useAuth();
  const [data, setData] = useState<AppData>(() => normalizeInitialData(initialData));
  const [transfers, setTransfers] = useState<BankTransfer[]>([]);

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
            setTransfers
          }} />
        </main>
      </div>
    </div>
  );
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
        element: <EmployeesPage />,
      },
      {
        path: "create",
        element: <CreateEmployeePage />,
      },
      {
        path: ":id/edit",
        element: <EditEmployeePage />,
      },
      {
        path: ":id/delete",
        element: <DeleteEmployeePage />,
      }
    ],
  },
  {
    path: "/product-transfer",
    element: (
      <ProtectedRoute>
        <ProductTransferLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <ProductTransferPage />,
      },
      {
        path: "new",
        element: <NewProductTransferPage />,
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
        element: <InventoryPage />,
      },
      {
        path: "create-new",
        element: <CreateNewInventoryPage />,
      },
      {
        path: "create-new/details",
        element: <ProductDetailsPage />,
      },
      {
        path: "create-new/payment",
        element: <PaymentPage />,
      },
      {
        path: "add-existing",
        element: <AddExistingInventoryPage />,
      },
      {
        path: "receivable",
        element: <ReceivableStockPage />,
      },
      {
        path: "view",
        element: <ViewInventoryPage />,
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
        element: <InvoicesPage />,
      },
      {
        path: "new",
        element: <CreateInvoicePage />,
      },
      {
        path: ":id/edit",
        element: <CreateInvoicePage />,
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
        element: <BudgetsPage />,
      },
      {
        path: "new",
        element: <CreateBudgetPage />,
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
        element: <LoansPage />,
      },
      {
        path: "all",
        element: <AllLoansPage />,
      },
      {
        path: "payable",
        element: <PayableLoansPage />,
      },
      {
        path: "receivable",
        element: <ReceivableLoansPage />,
      },
      {
        path: "create-payable",
        element: <CreatePayableLoanPage />,
      },
      {
        path: "create-receivable",
        element: <CreateReceivableLoanPage />,
      },
      {
        path: ":id/edit",
        element: <EditLoanPage />,
      },
      {
        path: ":id/delete",
        element: <DeleteLoanPage />,
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
        element: <BankingPage />,
      },
      {
        path: "banks",
        element: <BanksPage />,
      },
      {
        path: "banks/new",
        element: <CreateBankPage />,
      },
      {
        path: "banks/:id/edit",
        element: <EditBankPage />,
      },
      {
        path: "banks/:id/delete",
        element: <DeleteBankPage />,
      },
      {
        path: "transfers",
        element: <BankTransfersPage />,
      },
      {
        path: "transfers/new",
        element: <CreateTransferPage />,
      },
      {
        path: "cash-in-hand",
        element: <CashInHandPage />,
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
        element: <BillsPage />,
      },
      {
        path: "new",
        element: <CreateBillPage />,
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
        element: <TransactionsPage />,
      },
      {
        path: "new",
        element: <CreateTransactionPage />,
      },
      {
        path: ":id/edit",
        element: <EditTransactionPage />,
      },
      {
        path: ":id/delete",
        element: <DeleteTransactionPage />,
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
        element: <SalaryPage />,
      },
      {
        path: "all",
        element: <AllSalariesPage />,
      },
      {
        path: "regular",
        element: <RegularSalariesPage />,
      },
      {
        path: "advance",
        element: <AdvanceSalariesPage />,
      },
      {
        path: "create-regular",
        element: <CreateRegularSalaryPage />,
      },
      {
        path: "create-advance",
        element: <CreateAdvanceSalaryPage />,
      },
      {
        path: ":id/edit",
        element: <EditSalaryPage />,
      },
      {
        path: ":id/delete",
        element: <DeleteSalaryPage />,
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
        element: <CommissionPage />,
      },
      {
        path: "slabs",
        element: <CommissionSlabsPage />,
      },
      {
        path: "slabs/new",
        element: <CommissionSlabsPage />,
      },
      {
        path: "calculate",
        element: <CommissionCalculationPage />,
      },
      {
        path: "reports",
        element: <CommissionReportsPage />,
      },
    ],
  }









]);
