// routes.tsx — updated
// NEW: Added /payable-to-futuristic route under Operations
// FIX: Salary module routes corrected to match actual navigation calls and
//      wrapper prop contracts (SalaryCreateWrapper needs `type`,
//      SalaryListWrapper needs `type` + `title`).

import React, { useState } from 'react';
import { createBrowserRouter, useNavigate, Navigate, Outlet } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './features/finance/Dashboard';
import { ReportsPage } from './features/finance/ReportsPage';

// ── Module imports ──────────────────────────────────────────────────────────

import { EmployeeListWrapper, EmployeeCreateWrapper, EmployeeEditWrapper, EmployeeDeleteWrapper } from './modules/employee';

import { LoanDashboardWrapper, LoanListWrapper, LoanFormWrapper, LoanPaymentWrapper } from './modules/loans';

import { SalaryListWrapper, SalaryCreateWrapper, SalaryEditWrapper, SalaryDeleteWrapper, SalaryDashboardWrapper } from './modules/salary';

import { BillsListWrapper, BillsCreateWrapper, BillsEditWrapper, BillsDeleteWrapper } from './modules/bills';

import { CommissionSlabListWrapper, CommissionCalculationWrapper, CommissionReportWrapper } from './modules/commission';

import {
  BankingDashboardWrapper,
  BankListWrapper,
  BankCreateWrapper,
  BankEditWrapper,
  BankDeleteWrapper,
  TransferListWrapper,
  TransferCreateWrapper,
  CashListWrapper,
  CashCreateWrapper,
} from './modules/banking';

import {
  InventoryDashboardWrapper,
  InventoryListWrapper,
  InventoryTypeSelectionWrapper,
  InventoryCostingOptionWrapper,
  InventoryCostingDetailsWrapper,
  InventoryProductDetailsWrapper,
  InventoryPaymentWrapper,
  InventoryAddExistingWrapper,
  DeletedInventoryWrapper,
  ProductTransferWrapper,
  ProductTransferCreateWrapper,
  InventoryEditWrapper,
  InventoryMultiModelWrapper,
} from './modules/inventory';

import {
  InvoiceListWrapper,
  InvoiceFormWrapper,
  InvoiceDeleteWrapper,
  InvoiceReportWrapper,
} from './modules/invoices';

// ── Against the Invoice — standalone module ──────────────────────────────────
import { AgainstInvoiceWrapper } from './modules/against-the-invoice';

import {
  TransactionListWrapper,
  TransactionCreateWrapper,
  TransactionEditWrapper,
  TransactionDeleteWrapper,
  PendingPaymentsWrapper,
} from './modules/transactions';

// ── Budget imports ───────────────────────────────────────────────────────────
import {
  BudgetListWrapper,
  BudgetCreateWrapper,
  BudgetEditWrapper,
  BudgetDeleteWrapper,
} from './modules/budget';

// ── Bank Activity Report ─────────────────────────────────────────────────────
import { BankActivityView } from './modules/banking/views/BankActivityView';

// ── Payable to Futuristic ────────────────────────────────────────────────────
import { PayableToFuturisticWrapper } from './modules/Payable-to-futuristic';

import { Sidebar }  from './layouts/Sidebar';
import { TopBar }   from './layouts/TopBar';
import { useAuth }  from './providers/context/AuthContext';
import { UserManagement } from './modules/user-management';
import { AssetsManagement } from './modules/assets-management';



// ============================================================
// PROTECTED ROUTE
// ============================================================

import { ProtectedRoute as ScreenProtectedRoute } from './modules/user-management/components/protectedroute';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}


// ============================================================
// AUTH PAGES
// ============================================================

function LoginPage() {
  const navigate = useNavigate();
  const { setUser, setRole } = useAuth();
  return (
    <Login
      onLoginSuccess={(user: any, role: 'super_admin' | 'user') => { 
        setUser(user); 
        setRole(role);
        navigate('/dashboard'); 
      }}
    />
  );
}


// ============================================================
// LAYOUT COMPONENTS
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

function DashboardLayout() {
  return (
    <AppLayout activeModule="dashboard">
      <Dashboard />
    </AppLayout>
  );
}


// ============================================================
// EMPLOYEE ROUTES
// ============================================================

function EmployeeListRoute()   { return <EmployeeListWrapper />; }
function EmployeeCreateRoute() { return <EmployeeCreateWrapper />; }
function EmployeeEditRoute()   { return <EmployeeEditWrapper />; }
function EmployeeDeleteRoute() { return <EmployeeDeleteWrapper />; }


// ============================================================
// LOAN ROUTES
// ============================================================

function LoanDashboardRoute()        { return <LoanDashboardWrapper />; }
function LoanListRoute()             { return <LoanListWrapper />; }
function LoanListPayableRoute()      { return <LoanListWrapper defaultType="Payable" />; }
function LoanListReceivableRoute()   { return <LoanListWrapper defaultType="Receivable" />; }
function LoanFormRoute()             { return <LoanFormWrapper />; }
function LoanFormPayableRoute()      { return <LoanFormWrapper defaultType="Payable" />; }
function LoanFormReceivableRoute()   { return <LoanFormWrapper defaultType="Receivable" />; }
function LoanPaymentRoute()          { return <LoanPaymentWrapper />; }


// ============================================================
// SALARY ROUTES
// ============================================================
// NOTE on the fix:
//  - SalaryDashboardWrapper takes no props (reads its own viewModel) — unchanged.
//  - SalaryListWrapper requires `type: 'regular' | 'advance' | 'all'` and `title`.
//    The dashboard/list viewmodels navigate to /salary/all, /salary/regular,
//    and /salary/advance — so those are the three list routes we register.
//  - SalaryCreateWrapper requires `type: 'regular' | 'advance'`.
//    Both useSalaryDashboardViewModel and useSalaryListViewModel's handleAdd()
//    navigate to /salary/create-regular and /salary/create-advance — so those
//    are the two create routes we register (the old generic '/salary/create'
//    route never matched what the app actually navigates to, hence the 404).
//  - SalaryEditWrapper and SalaryDeleteWrapper take no props (read useParams
//    internally) — unchanged, still under /salary/:id/edit and /salary/:id/delete.

function SalaryListAllRoute()      { return <SalaryListWrapper type="all" title="All Salaries" />; }
function SalaryListRegularRoute()  { return <SalaryListWrapper type="regular" title="Regular Salaries" />; }
function SalaryListAdvanceRoute()  { return <SalaryListWrapper type="advance" title="Advance Salaries" />; }
function SalaryCreateRegularRoute(){ return <SalaryCreateWrapper type="regular" />; }
function SalaryCreateAdvanceRoute(){ return <SalaryCreateWrapper type="advance" />; }
function SalaryEditRoute()      { return <SalaryEditWrapper />; }
function SalaryDeleteRoute()    { return <SalaryDeleteWrapper />; }
function SalaryDashboardRoute() { return <SalaryDashboardWrapper />; }


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

function CommissionSlabsRoute()      { return <CommissionSlabListWrapper />; }
function CommissionCalculationRoute(){ return <CommissionCalculationWrapper />; }
function CommissionReportsRoute()    { return <CommissionReportWrapper />; }


// ============================================================
// BANKING ROUTES
// ============================================================

function BankingDashboardRoute() { return <BankingDashboardWrapper />; }
function BankListRoute()         { return <BankListWrapper />; }
function BankCreateRoute()       { return <BankCreateWrapper />; }
function BankEditRoute()         { return <BankEditWrapper />; }
function BankDeleteRoute()       { return <BankDeleteWrapper />; }
function BankTransferListRoute() { return <TransferListWrapper />; }
function BankTransferCreateRoute(){ return <TransferCreateWrapper />; }
function CashListRoute()         { return <CashListWrapper />; }
function CashCreateRoute()       { return <CashCreateWrapper />; }
function BankActivityRoute()     { return <BankActivityView />; }


// ============================================================
// INVENTORY ROUTES
// ============================================================

function InventoryDashboardRoute()      { return <InventoryDashboardWrapper />; }
function InventoryViewRoute()           { return <InventoryListWrapper />; }
function InventoryReceivableRoute()     { return <InventoryListWrapper />; }
function InventoryTypeSelectionRoute()  { return <InventoryTypeSelectionWrapper />; }
function InventoryCostingOptionRoute()  { return <InventoryCostingOptionWrapper />; }
function InventoryCostingDetailsRoute() { return <InventoryCostingDetailsWrapper />; }
function InventoryProductDetailsRoute() { return <InventoryProductDetailsWrapper />; }
function InventoryPaymentRoute()        { return <InventoryPaymentWrapper />; }
function InventoryAddExistingRoute()    { return <InventoryAddExistingWrapper />; }
function DeletedInventoryRoute()        { return <DeletedInventoryWrapper />; }
function ProductTransferListRoute()     { return <ProductTransferWrapper />; }
function ProductTransferNewRoute()      { return <ProductTransferCreateWrapper />; }
function InventoryMultiModelRoute()     { return <InventoryMultiModelWrapper />; }


// ============================================================
// INVOICE ROUTES
// ============================================================

function InvoiceListRoute()   { return <InvoiceListWrapper />; }
function InvoiceFormRoute()   { return <InvoiceFormWrapper />; }
function InvoiceEditRoute()   { return <InvoiceFormWrapper />; }
function InvoiceDeleteRoute() { return <InvoiceDeleteWrapper />; }
function InvoiceReportRoute() { return <InvoiceReportWrapper />; }


// ============================================================
// AGAINST THE INVOICE ROUTE
// ============================================================

function AgainstInvoiceRoute() { return <AgainstInvoiceWrapper />; }


// ============================================================
// TRANSACTION ROUTES
// ============================================================

function TransactionListRoute()   { return <TransactionListWrapper />; }
function TransactionCreateRoute() { return <TransactionCreateWrapper />; }
function TransactionEditRoute()   { return <TransactionEditWrapper />; }
function TransactionDeleteRoute() { return <TransactionDeleteWrapper />; }
function PendingPaymentsRoute()   { return <PendingPaymentsWrapper />; }


// ============================================================
// BUDGET ROUTES
// ============================================================

function BudgetListRoute()   { return <BudgetListWrapper />; }
function BudgetCreateRoute() { return <BudgetCreateWrapper />; }
function BudgetEditRoute()   { return <BudgetEditWrapper />; }
function BudgetDeleteRoute() { return <BudgetDeleteWrapper />; }


// ============================================================
// PAYABLE TO FUTURISTIC ROUTE  ← NEW
// ============================================================

function PayableToFuturisticRoute() { return <PayableToFuturisticWrapper />; }


// ============================================================
// ROUTER
// ============================================================

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },

  // ── Dashboard ─────────────────────────────────────────────
  {
    path: '/',
    element: (<ProtectedRoute><DashboardLayout /></ProtectedRoute>),
  },
  {
    path: '/dashboard',
    element: (<ProtectedRoute><DashboardLayout /></ProtectedRoute>),
  },

  // ── Employees ─────────────────────────────────────────────
  {
    path: '/employees',
    element: (<ProtectedRoute><OutletLayout activeModule="employees" /></ProtectedRoute>),
    children: [
      { index: true,        element: <ScreenProtectedRoute requiredScreen="Employees List"><EmployeeListRoute /></ScreenProtectedRoute> },
      { path: 'create',     element: <ScreenProtectedRoute requiredScreen="Create Employee"><EmployeeCreateRoute /></ScreenProtectedRoute> },
      { path: ':id/edit',   element: <ScreenProtectedRoute requiredScreen="Edit Employee"><EmployeeEditRoute /></ScreenProtectedRoute> },
      { path: ':id/delete', element: <ScreenProtectedRoute requiredScreen="Delete Employee"><EmployeeDeleteRoute /></ScreenProtectedRoute> },
    ],
  },

  // ── Loans ────────────────────────────────────────────────
  {
    path: '/loans',
    element: (<ProtectedRoute><OutletLayout activeModule="loans" /></ProtectedRoute>),
    children: [
      { index: true,            element: <ScreenProtectedRoute requiredScreen="Loans Dashboard"><LoanDashboardRoute /></ScreenProtectedRoute> },
      { path: 'all',            element: <ScreenProtectedRoute requiredScreen="Loans Dashboard"><LoanListRoute /></ScreenProtectedRoute> },
      { path: 'payable',        element: <ScreenProtectedRoute requiredScreen="Loans Payable"><LoanListPayableRoute /></ScreenProtectedRoute> },
      { path: 'receivable',     element: <ScreenProtectedRoute requiredScreen="Loans Receivable"><LoanListReceivableRoute /></ScreenProtectedRoute> },
      { path: 'new',            element: <ScreenProtectedRoute requiredScreen="Loans Dashboard"><LoanFormRoute /></ScreenProtectedRoute> },
      { path: 'create-payable',    element: <ScreenProtectedRoute requiredScreen="Loans Payable"><LoanFormPayableRoute /></ScreenProtectedRoute> },
      { path: 'create-receivable', element: <ScreenProtectedRoute requiredScreen="Loans Receivable"><LoanFormReceivableRoute /></ScreenProtectedRoute> },
      { path: ':id/payment',    element: <ScreenProtectedRoute requiredScreen="Loans Dashboard"><LoanPaymentRoute /></ScreenProtectedRoute> },
    ],
  },

  // ── Salary ────────────────────────────────────────────────
  // FIXED: routes now match the actual paths the salary module navigates to
  // (create-regular / create-advance / all / regular / advance), and pass
  // the `type` (and `title`) props the wrappers require.
  {
    path: '/salary',
    element: (<ProtectedRoute><OutletLayout activeModule="salary" /></ProtectedRoute>),
    children: [
      { index: true,            element: <ScreenProtectedRoute requiredScreen="Salary Dashboard"><SalaryDashboardRoute /></ScreenProtectedRoute> },
      { path: 'all',             element: <ScreenProtectedRoute requiredScreen="Salary Dashboard"><SalaryListAllRoute /></ScreenProtectedRoute> },
      { path: 'regular',         element: <ScreenProtectedRoute requiredScreen="Salary Dashboard"><SalaryListRegularRoute /></ScreenProtectedRoute> },
      { path: 'advance',         element: <ScreenProtectedRoute requiredScreen="Salary Dashboard"><SalaryListAdvanceRoute /></ScreenProtectedRoute> },
      { path: 'create-regular',  element: <ScreenProtectedRoute requiredScreen="Create Salary"><SalaryCreateRegularRoute /></ScreenProtectedRoute> },
      { path: 'create-advance',  element: <ScreenProtectedRoute requiredScreen="Create Salary"><SalaryCreateAdvanceRoute /></ScreenProtectedRoute> },
      { path: ':id/edit',        element: <ScreenProtectedRoute requiredScreen="Edit Salary"><SalaryEditRoute /></ScreenProtectedRoute> },
      { path: ':id/delete',      element: <ScreenProtectedRoute requiredScreen="Delete Salary"><SalaryDeleteRoute /></ScreenProtectedRoute> },
    ],
  },

  // ── Bills ─────────────────────────────────────────────────
  {
    path: '/bills',
    element: (<ProtectedRoute><OutletLayout activeModule="bills" /></ProtectedRoute>),
    children: [
      { index: true,        element: <ScreenProtectedRoute requiredScreen="Bills List"><BillsListRoute /></ScreenProtectedRoute> },
      { path: 'create',     element: <ScreenProtectedRoute requiredScreen="Create Bill"><BillsCreateRoute /></ScreenProtectedRoute> },
      { path: ':id/edit',   element: <ScreenProtectedRoute requiredScreen="Edit Bill"><BillsEditRoute /></ScreenProtectedRoute> },
      { path: ':id/delete', element: <ScreenProtectedRoute requiredScreen="Delete Bill"><BillsDeleteRoute /></ScreenProtectedRoute> },
    ],
  },

  // ── Commission ────────────────────────────────────────────
  {
    path: '/commission',
    element: (<ProtectedRoute><OutletLayout activeModule="commission" /></ProtectedRoute>),
    children: [
      { index: true,       element: <ScreenProtectedRoute requiredScreen="Commission Slabs"><CommissionSlabsRoute /></ScreenProtectedRoute> },
      { path: 'slabs',     element: <ScreenProtectedRoute requiredScreen="Commission Slabs"><CommissionSlabsRoute /></ScreenProtectedRoute> },
      { path: 'calculate', element: <ScreenProtectedRoute requiredScreen="Commission Calculation"><CommissionCalculationRoute /></ScreenProtectedRoute> },
      { path: 'reports',   element: <ScreenProtectedRoute requiredScreen="Commission Reports"><CommissionReportsRoute /></ScreenProtectedRoute> },
    ],
  },

  // ── Banking ───────────────────────────────────────────────
  {
    path: '/banking',
    element: (<ProtectedRoute><OutletLayout activeModule="banking" /></ProtectedRoute>),
    children: [
      { index: true,              element: <ScreenProtectedRoute requiredScreen="Banking Dashboard"><BankingDashboardRoute /></ScreenProtectedRoute> },
      { path: 'banks',            element: <ScreenProtectedRoute requiredScreen="Bank Accounts List"><BankListRoute /></ScreenProtectedRoute> },
      { path: 'banks/new',        element: <ScreenProtectedRoute requiredScreen="Create Bank"><BankCreateRoute /></ScreenProtectedRoute> },
      { path: 'banks/:id/edit',   element: <ScreenProtectedRoute requiredScreen="Edit Bank"><BankEditRoute /></ScreenProtectedRoute> },
      { path: 'banks/:id/delete', element: <ScreenProtectedRoute requiredScreen="Delete Bank"><BankDeleteRoute /></ScreenProtectedRoute> },
      { path: 'transfers',        element: <ScreenProtectedRoute requiredScreen="Bank Transfers List"><BankTransferListRoute /></ScreenProtectedRoute> },
      { path: 'transfers/new',    element: <ScreenProtectedRoute requiredScreen="Create Bank Transfer"><BankTransferCreateRoute /></ScreenProtectedRoute> },
      { path: 'cash',             element: <ScreenProtectedRoute requiredScreen="Cash List"><CashListRoute /></ScreenProtectedRoute> },
      { path: 'cash/new',         element: <ScreenProtectedRoute requiredScreen="Create Cash Entry"><CashCreateRoute /></ScreenProtectedRoute> },
      { path: 'activity',         element: <ScreenProtectedRoute requiredScreen="Bank Activity Report"><BankActivityRoute /></ScreenProtectedRoute> },
    ],
  },

  // ── Transactions ──────────────────────────────────────────
  {
    path: '/transactions',
    element: (<ProtectedRoute><OutletLayout activeModule="transactions" /></ProtectedRoute>),
    children: [
      { index: true,        element: <ScreenProtectedRoute requiredScreen="Transaction List"><TransactionListRoute /></ScreenProtectedRoute> },
      { path: 'new',        element: <ScreenProtectedRoute requiredScreen="Add Transaction"><TransactionCreateRoute /></ScreenProtectedRoute> },
      { path: ':id/edit',   element: <ScreenProtectedRoute requiredScreen="Transaction Edit"><TransactionEditRoute /></ScreenProtectedRoute> },
      { path: ':id/delete', element: <ScreenProtectedRoute requiredScreen="Transaction Delete"><TransactionDeleteRoute /></ScreenProtectedRoute> },
      { path: 'pending',    element: <ScreenProtectedRoute requiredScreen="Pending Payments"><PendingPaymentsRoute /></ScreenProtectedRoute> },
    ],
  },

  // ── Invoices ──────────────────────────────────────────────
  {
    path: '/invoices',
    element: (<ProtectedRoute><OutletLayout activeModule="invoices" /></ProtectedRoute>),
    children: [
      { index: true,        element: <ScreenProtectedRoute requiredScreen="Invoices List"><InvoiceListRoute /></ScreenProtectedRoute> },
      { path: 'new',        element: <ScreenProtectedRoute requiredScreen="Create Invoice"><InvoiceFormRoute /></ScreenProtectedRoute> },
      { path: ':id/edit',   element: <ScreenProtectedRoute requiredScreen="Edit Invoice"><InvoiceEditRoute /></ScreenProtectedRoute> },
      { path: ':id/delete', element: <ScreenProtectedRoute requiredScreen="Delete Invoice"><InvoiceDeleteRoute /></ScreenProtectedRoute> },
      { path: 'reports',    element: <ScreenProtectedRoute requiredScreen="Invoice Reports"><InvoiceReportRoute /></ScreenProtectedRoute> },
    ],
  },

  // ── Against the Invoice (standalone module) ───────────────
  {
    path: '/against-the-invoice',
    element: (
      <ProtectedRoute>
        <AppLayout activeModule="against-the-invoice">
          <ScreenProtectedRoute requiredScreen="Invoices List">
            <AgainstInvoiceRoute />
          </ScreenProtectedRoute>
        </AppLayout>
      </ProtectedRoute>
    ),
  },

  // ── Inventory ─────────────────────────────────────────────
  {
    path: '/inventory',
    element: (<ProtectedRoute><OutletLayout activeModule="inventory" /></ProtectedRoute>),
    children: [
      { index: true,                        element: <ScreenProtectedRoute requiredScreen="Inventory Dashboard"><InventoryDashboardRoute /></ScreenProtectedRoute> },
      { path: 'view',                       element: <ScreenProtectedRoute requiredScreen="Inventory View"><InventoryViewRoute /></ScreenProtectedRoute> },
      { path: 'receivable',                 element: <ScreenProtectedRoute requiredScreen="Inventory Receivable"><InventoryReceivableRoute /></ScreenProtectedRoute> },
      { path: 'create-new',                 element: <ScreenProtectedRoute requiredScreen="Inventory Type Selection"><InventoryTypeSelectionRoute /></ScreenProtectedRoute> },
      { path: 'create-new/costing',         element: <ScreenProtectedRoute requiredScreen="Inventory Costing Option"><InventoryCostingOptionRoute /></ScreenProtectedRoute> },
      { path: 'create-new/costing-details', element: <ScreenProtectedRoute requiredScreen="Inventory Costing Details"><InventoryCostingDetailsRoute /></ScreenProtectedRoute> },
      { path: 'create-new/multi-models',    element: <ScreenProtectedRoute requiredScreen="Inventory Multi Models"><InventoryMultiModelRoute /></ScreenProtectedRoute> },
      { path: 'create-new/details',         element: <ScreenProtectedRoute requiredScreen="Inventory Product Details"><InventoryProductDetailsRoute /></ScreenProtectedRoute> },
      { path: 'create-new/payment',         element: <ScreenProtectedRoute requiredScreen="Inventory Payment"><InventoryPaymentRoute /></ScreenProtectedRoute> },
      { path: 'add-existing',               element: <ScreenProtectedRoute requiredScreen="Inventory Add Existing"><InventoryAddExistingRoute /></ScreenProtectedRoute> },
      { path: 'deleted',                    element: <ScreenProtectedRoute requiredScreen="Deleted Inventory"><DeletedInventoryRoute /></ScreenProtectedRoute> },
      { path: ':id/edit',                   element: <ScreenProtectedRoute requiredScreen="Inventory View"><InventoryEditWrapper /></ScreenProtectedRoute> },
    ],
  },

  // ── Product Transfer ──────────────────────────────────────
  {
    path: '/product-transfer',
    element: (<ProtectedRoute><OutletLayout activeModule="inventory" /></ProtectedRoute>),
    children: [
      { index: true, element: <ScreenProtectedRoute requiredScreen="Product Transfer List"><ProductTransferListRoute /></ScreenProtectedRoute> },
      { path: 'new', element: <ScreenProtectedRoute requiredScreen="Create Product Transfer"><ProductTransferNewRoute /></ScreenProtectedRoute> },
    ],
  },

  // ── Budgets ───────────────────────────────────────────────
  {
    path: '/budgets',
    element: (<ProtectedRoute><OutletLayout activeModule="budgets" /></ProtectedRoute>),
    children: [
      { index: true,        element: <ScreenProtectedRoute requiredScreen="Budgets List"><BudgetListRoute /></ScreenProtectedRoute> },
      { path: 'create',     element: <ScreenProtectedRoute requiredScreen="Create Budget"><BudgetCreateRoute /></ScreenProtectedRoute> },
      { path: ':id/edit',   element: <ScreenProtectedRoute requiredScreen="Edit Budget"><BudgetEditRoute /></ScreenProtectedRoute> },
      { path: ':id/delete', element: <ScreenProtectedRoute requiredScreen="Delete Budget"><BudgetDeleteRoute /></ScreenProtectedRoute> },
    ],
  },

  // ── Assets Management ──────────────────────────────────────
  {
    path: '/assets-management',
    element: (<ProtectedRoute><OutletLayout activeModule="assets-management" /></ProtectedRoute>),
    children: [
      { index: true, element: <ScreenProtectedRoute requiredScreen="Assets Management"><AssetsManagement /></ScreenProtectedRoute> },
    ],
  },

  // ── User Management ──────────────────────────────────────
  {
    path: '/user-management',
    element: (<ProtectedRoute><OutletLayout activeModule="user-management" /></ProtectedRoute>),
    children: [
      { index: true, element: <ScreenProtectedRoute requiredScreen="User Management"><UserManagement /></ScreenProtectedRoute> },
    ],
  },

  // ── Reports ───────────────────────────────────────────────
  {
    path: '/reports',
    element: (
      <ProtectedRoute>
        <AppLayout activeModule="reports">
          <ReportsPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  // ── Bank Activity accessible from Reports hub ────────
  {
    path: '/reports/bank-activity',
    element: (
      <ProtectedRoute>
        <AppLayout activeModule="reports">
          <ScreenProtectedRoute requiredScreen="Bank Activity Report">
            <BankActivityView />
          </ScreenProtectedRoute>
        </AppLayout>
      </ProtectedRoute>
    ),
  },

  // ── Payable to Futuristic ─────────────────────────────────  ← NEW
  {
    path: '/payable-to-futuristic',
    element: (
      <ProtectedRoute>
        <AppLayout activeModule="payable-to-futuristic">
          <ScreenProtectedRoute requiredScreen="Payable to Futuristic">
            <PayableToFuturisticRoute />
          </ScreenProtectedRoute>
        </AppLayout>
      </ProtectedRoute>
    ),
  },
]);