import { createBrowserRouter, useNavigate, Navigate, Outlet } from 'react-router-dom';
import { Signup } from './pages/Signup';
import { Login } from './pages/Login';
import { Dashboard } from './features/finance/Dashboard';

// Employee Module
import { EmployeeListWrapper, EmployeeCreateWrapper, EmployeeEditWrapper, EmployeeDeleteWrapper } from './modules/employee';

// Loans Module
import { LoanDashboardWrapper, LoanListWrapper, LoanFormWrapper, LoanPaymentWrapper } from './modules/loans';

// Salary Module
import { SalaryListWrapper, SalaryCreateWrapper, SalaryEditWrapper, SalaryDeleteWrapper, SalaryDashboardWrapper } from './modules/salary';

// Bills Module
import { BillsListWrapper, BillsCreateWrapper, BillsEditWrapper, BillsDeleteWrapper } from './modules/bills';

// Commission Module
import { CommissionSlabListWrapper, CommissionCalculationWrapper, CommissionReportWrapper } from './modules/commission';

// Banking Module
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

// Inventory Module
import {
  InventoryDashboardWrapper,
  InventoryListWrapper,
  InventoryTypeSelectionWrapper,
  InventoryCostingOptionWrapper,
  InventoryCostingDetailsWrapper,
  InventoryProductDetailsWrapper,
  InventoryPaymentWrapper,
  InventoryAddExistingWrapper,
  ProductTransferWrapper,
  ProductTransferCreateWrapper,
} from './modules/inventory';

// Invoice Module
import {
  InvoiceListWrapper,
  InvoiceFormWrapper,
  InvoiceDeleteWrapper,
  InvoiceReportWrapper,
} from './modules/invoices';

// Budget Module (commented out — not yet converted to Firestore)
// import { BudgetListWrapper, BudgetCreateWrapper, BudgetEditWrapper, BudgetDeleteWrapper, Budget } from './modules/budget';
// Inventory Module
// import { ... } from './modules/inventory/...';
// Invoice Module
// import { ... } from './modules/invoices';
// Transactions Module
// import { ... } from './modules/transactions';

import { Sidebar } from './layouts/Sidebar';
import { TopBar } from './layouts/TopBar';
import { useAuth } from './providers/context/AuthContext';
import { useState } from 'react';
import { AppData, initialData } from './App';


// ============================================================
// PROTECTED ROUTE
// ============================================================

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}


// ============================================================
// AUTH PAGES
// ============================================================

function SignupPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  return (
    <Signup
      onNavigateToLogin={() => navigate('/login')}
      onSignupSuccess={(user) => { setUser(user); navigate('/dashboard'); }}
    />
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  return (
    <Login
      onNavigateToSignup={() => navigate('/signup')}
      onLoginSuccess={(user) => { setUser(user); navigate('/dashboard'); }}
    />
  );
}


// ============================================================
// SHARED LAYOUT FACTORY
// ============================================================

function AppLayout({ activeModule, children }: { activeModule: string; children: React.ReactNode }) {
  const { user } = useAuth();
  return (
    <div className="flex h-screen bg-[#f0f2f5]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <TopBar notifications={[]} setNotifications={() => {}} activeModule={activeModule} user={user} />
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

function OutletLayout({ activeModule }: { activeModule: string }) {
  return (
    <AppLayout activeModule={activeModule}>
      <Outlet />
    </AppLayout>
  );
}


// ============================================================
// DASHBOARD LAYOUT
// ============================================================

function DashboardLayout() {
  const [data] = useState<AppData>(() => initialData);
  return (
    <AppLayout activeModule="dashboard">
      <Dashboard data={data} />
    </AppLayout>
  );
}


// ============================================================
// LOAN ROUTES
// LoanFormWrapper and LoanPaymentWrapper are self-contained —
// they fetch employees and banks from Firestore internally.
// Do NOT pass banks={[]} or employees={[]} props here.
// ============================================================

function LoanDashboardRoute()        { return <LoanDashboardWrapper />; }
function LoanListRoute()             { return <LoanListWrapper />; }
function LoanPayableListRoute()      { return <LoanListWrapper />; }
function LoanReceivableListRoute()   { return <LoanListWrapper />; }
function LoanCreateRoute()           { return <LoanFormWrapper />; }
function LoanCreatePayableRoute()    { return <LoanFormWrapper defaultType="Payable" />; }
function LoanCreateReceivableRoute() { return <LoanFormWrapper defaultType="Receivable" />; }
function LoanEditRoute()             { return <LoanFormWrapper />; }
function LoanPaymentRoute()          { return <LoanPaymentWrapper />; }


// ============================================================
// SALARY ROUTES
// ============================================================

function SalaryDashboardRoute()     { return <SalaryDashboardWrapper />; }
function SalaryAllListRoute()       { return <SalaryListWrapper type="all" title="All Salaries" />; }
function SalaryRegularListRoute()   { return <SalaryListWrapper type="regular" title="Regular Salaries" />; }
function SalaryAdvanceListRoute()   { return <SalaryListWrapper type="advance" title="Advance Salaries" />; }
function SalaryCreateRegularRoute() { return <SalaryCreateWrapper type="regular" />; }
function SalaryCreateAdvanceRoute() { return <SalaryCreateWrapper type="advance" />; }
function SalaryEditRoute()          { return <SalaryEditWrapper />; }
function SalaryDeleteRoute()        { return <SalaryDeleteWrapper />; }


// ============================================================
// BILLS ROUTES
// ============================================================

function BillsListRoute()   { return <BillsListWrapper />; }
function BillsCreateRoute() { return <BillsCreateWrapper />; }
function BillsEditRoute()   { return <BillsEditWrapper />; }
function BillsDeleteRoute() { return <BillsDeleteWrapper />; }


// ============================================================
// COMMISSION ROUTES
// ============================================================

function CommissionSlabsRoute()       { return <CommissionSlabListWrapper />; }
function CommissionCalculationRoute() { return <CommissionCalculationWrapper />; }
function CommissionReportsRoute()     { return <CommissionReportWrapper />; }


// ============================================================
// BANKING ROUTES
// ============================================================

function BankingDashboardRoute() { return <BankingDashboardWrapper />; }
function BankListRoute()         { return <BankListWrapper />; }
function BankCreateRoute()       { return <BankCreateWrapper />; }
function BankEditRoute()         { return <BankEditWrapper />; }
function BankDeleteRoute()       { return <BankDeleteWrapper />; }
function TransferListRoute()     { return <TransferListWrapper />; }
function TransferCreateRoute()   { return <TransferCreateWrapper />; }
function CashListRoute()         { return <CashListWrapper />; }
function CashCreateRoute()       { return <CashCreateWrapper />; }


// ============================================================
// INVENTORY ROUTES
// ============================================================

function InventoryDashboardRoute()        { return <InventoryDashboardWrapper />; }
function InventoryViewRoute()             { return <InventoryListWrapper inventoryType="in-stock" />; }
function InventoryReceivableRoute()       { return <InventoryListWrapper inventoryType="on-order" />; }
function InventoryTypeSelectionRoute()    { return <InventoryTypeSelectionWrapper />; }
function InventoryCostingOptionRoute()    { return <InventoryCostingOptionWrapper />; }
function InventoryCostingDetailsRoute()   { return <InventoryCostingDetailsWrapper />; }
function InventoryProductDetailsRoute()   { return <InventoryProductDetailsWrapper />; }
function InventoryPaymentRoute()          { return <InventoryPaymentWrapper />; }
function InvoiceListRoute()   { return <InvoiceListWrapper />; }
function InvoiceFormRoute()   { return <InvoiceFormWrapper />; }
function InvoiceEditRoute()   { return <InvoiceFormWrapper />; }
function InvoiceDeleteRoute() { return <InvoiceDeleteWrapper />; }
function InvoiceReportRoute() { return <InvoiceReportWrapper />; }
function InventoryAddExistingRoute()       { return <InventoryAddExistingWrapper />; }
function ProductTransferListRoute()       { return <ProductTransferWrapper />; }
function ProductTransferNewRoute()        { return <ProductTransferCreateWrapper />; }


// ============================================================
// COMMENTED-OUT MODULE ROUTES (preserved for future use)
// ============================================================

// --- BUDGETS ---
// function BudgetListRoute()   { return <BudgetListWrapper />; }
// function BudgetCreateRoute() { return <BudgetCreateWrapper />; }
// function BudgetEditRoute()   { return <BudgetEditWrapper />; }
// function BudgetDeleteRoute() { return <BudgetDeleteWrapper />; }

// --- INVENTORY ---
// function InventoryLayout() { ... }

// --- INVOICES ---
// function InvoiceListRoute()   { ... }
// function InvoiceFormRoute()   { ... }
// function InvoiceDeleteRoute() { ... }
// function InvoiceReportRoute() { ... }

// --- TRANSACTIONS ---
// function TransactionListRoute()   { return <TransactionListWrapper />; }
// function TransactionCreateRoute() { ... }
// function TransactionEditRoute()   { ... }
// function TransactionDeleteRoute() { ... }


// ============================================================
// ROUTER
// ============================================================

export const router = createBrowserRouter([
  { path: "/",       element: <Navigate to="/dashboard" replace /> },
  { path: "/login",  element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },

  {
    path: "/dashboard",
    element: (<ProtectedRoute><DashboardLayout /></ProtectedRoute>),
  },

  // --- EMPLOYEES ---
  {
    path: "/employees",
    element: (<ProtectedRoute><OutletLayout activeModule="employees" /></ProtectedRoute>),
    children: [
      { index: true,        element: <EmployeeListWrapper /> },
      { path: "create",     element: <EmployeeCreateWrapper /> },
      { path: ":id/edit",   element: <EmployeeEditWrapper /> },
      { path: ":id/delete", element: <EmployeeDeleteWrapper /> },
    ],
  },

  // --- LOANS ---
  {
    path: "/loans",
    element: (<ProtectedRoute><OutletLayout activeModule="loans" /></ProtectedRoute>),
    children: [
      { index: true,               element: <LoanDashboardRoute /> },
      { path: "all",               element: <LoanListRoute /> },
      { path: "payable",           element: <LoanPayableListRoute /> },
      { path: "receivable",        element: <LoanReceivableListRoute /> },
      { path: "create",            element: <LoanCreateRoute /> },
      { path: "create-payable",    element: <LoanCreatePayableRoute /> },
      { path: "create-receivable", element: <LoanCreateReceivableRoute /> },
      { path: ":id/edit",          element: <LoanEditRoute /> },
      { path: ":id/payment",       element: <LoanPaymentRoute /> },
    ],
  },

  // --- SALARY ---
  {
    path: "/salary",
    element: (<ProtectedRoute><OutletLayout activeModule="salary" /></ProtectedRoute>),
    children: [
      { index: true,            element: <SalaryDashboardRoute /> },
      { path: "all",            element: <SalaryAllListRoute /> },
      { path: "regular",        element: <SalaryRegularListRoute /> },
      { path: "advance",        element: <SalaryAdvanceListRoute /> },
      { path: "create-regular", element: <SalaryCreateRegularRoute /> },
      { path: "create-advance", element: <SalaryCreateAdvanceRoute /> },
      { path: ":id/edit",       element: <SalaryEditRoute /> },
      { path: ":id/delete",     element: <SalaryDeleteRoute /> },
    ],
  },

  // --- BILLS ---
  {
    path: "/bills",
    element: (<ProtectedRoute><OutletLayout activeModule="bills" /></ProtectedRoute>),
    children: [
      { index: true,        element: <BillsListRoute /> },
      { path: "create",     element: <BillsCreateRoute /> },
      { path: ":id/edit",   element: <BillsEditRoute /> },
      { path: ":id/delete", element: <BillsDeleteRoute /> },
    ],
  },

  // --- COMMISSION ---
  {
    path: "/commission",
    element: (<ProtectedRoute><OutletLayout activeModule="commission" /></ProtectedRoute>),
    children: [
      { index: true,       element: <CommissionSlabsRoute /> },
      { path: "slabs",     element: <CommissionSlabsRoute /> },
      { path: "calculate", element: <CommissionCalculationRoute /> },
      { path: "reports",   element: <CommissionReportsRoute /> },
    ],
  },

  // --- BANKING ---
  {
    path: "/banking",
    element: (<ProtectedRoute><OutletLayout activeModule="banking" /></ProtectedRoute>),
    children: [
      { index: true,              element: <BankingDashboardRoute /> },
      { path: "banks",            element: <BankListRoute /> },
      { path: "banks/new",        element: <BankCreateRoute /> },
      { path: "banks/:id/edit",   element: <BankEditRoute /> },
      { path: "banks/:id/delete", element: <BankDeleteRoute /> },
      { path: "transfers",        element: <TransferListRoute /> },
      { path: "transfers/new",    element: <TransferCreateRoute /> },
      { path: "cash",             element: <CashListRoute /> },
      { path: "cash/new",         element: <CashCreateRoute /> },
    ],
  },

  // --- INVOICES ---
  {
    path: "/invoices",
    element: (<ProtectedRoute><OutletLayout activeModule="invoices" /></ProtectedRoute>),
    children: [
      { index: true,          element: <InvoiceListRoute /> },
      { path: "new",          element: <InvoiceFormRoute /> },
      { path: ":id/edit",     element: <InvoiceEditRoute /> },
      { path: ":id/delete",   element: <InvoiceDeleteRoute /> },
      { path: "reports",      element: <InvoiceReportRoute /> },
    ],
  },

  // --- INVENTORY ---
  {
    path: "/inventory",
    element: (<ProtectedRoute><OutletLayout activeModule="inventory" /></ProtectedRoute>),
    children: [
      { index: true,                        element: <InventoryDashboardRoute /> },
      { path: "view",                       element: <InventoryViewRoute /> },
      { path: "receivable",                 element: <InventoryReceivableRoute /> },
      { path: "create-new",                 element: <InventoryTypeSelectionRoute /> },
      { path: "create-new/costing",         element: <InventoryCostingOptionRoute /> },
      { path: "create-new/costing-details", element: <InventoryCostingDetailsRoute /> },
      { path: "create-new/details",         element: <InventoryProductDetailsRoute /> },
      { path: "create-new/payment",         element: <InventoryPaymentRoute /> },
      { path: "add-existing",                 element: <InventoryAddExistingRoute /> },
    ],
  },

  // --- PRODUCT TRANSFER ---
  {
    path: "/product-transfer",
    element: (<ProtectedRoute><OutletLayout activeModule="inventory" /></ProtectedRoute>),
    children: [
      { index: true, element: <ProductTransferListRoute /> },
      { path: "new",  element: <ProductTransferNewRoute /> },
    ],
  },

  // --- BUDGETS (commented out) ---
  // { path: "/budgets", element: (<ProtectedRoute><OutletLayout activeModule="budgets" /></ProtectedRoute>), children: [ ... ] },

  // --- INVENTORY (commented out) ---
  // { path: "/inventory", element: (<ProtectedRoute><OutletLayout activeModule="inventory" /></ProtectedRoute>), children: [ ... ] },

  // --- INVOICES (commented out) ---
  // { path: "/invoices", element: (<ProtectedRoute><OutletLayout activeModule="invoices" /></ProtectedRoute>), children: [ ... ] },

  // --- FINANCE (commented out) ---
  // { path: "/finance", element: (<ProtectedRoute><OutletLayout activeModule="finance" /></ProtectedRoute>), children: [ ... ] },

  // --- TRANSACTIONS (commented out) ---
  // { path: "/transactions", element: (<ProtectedRoute><OutletLayout activeModule="transactions" /></ProtectedRoute>), children: [ ... ] },
]);