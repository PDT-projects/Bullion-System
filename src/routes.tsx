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
  ProductTransferWrapper,
  ProductTransferCreateWrapper,
  InventoryEditWrapper,
} from './modules/inventory';

import {
  InvoiceListWrapper,
  InvoiceFormWrapper,
  InvoiceDeleteWrapper,
  InvoiceReportWrapper,
} from './modules/invoices';

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

import { Sidebar }  from './layouts/Sidebar';
import { TopBar }   from './layouts/TopBar';
import { useAuth }  from './providers/context/AuthContext';
import { UserManagement } from './modules/user-management';
import { AssetsManagement } from './modules/assets-management';
import { mockData } from './mockData';
const initialData = mockData;


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

function BankingDashboardRoute()   { return <BankingDashboardWrapper />; }
function BankListRoute()           { return <BankListWrapper />; }
function BankCreateRoute()         { return <BankCreateWrapper />; }
function BankEditRoute()           { return <BankEditWrapper />; }
function BankDeleteRoute()         { return <BankDeleteWrapper />; }
function BankTransferListRoute()   { return <TransferListWrapper />; }
function BankTransferCreateRoute() { return <TransferCreateWrapper />; }
function CashListRoute()           { return <CashListWrapper />; }
function CashCreateRoute()         { return <CashCreateWrapper />; }


// ============================================================
// TRANSACTIONS ROUTES
// ============================================================

function TransactionListRoute()   { return <TransactionListWrapper />; }
function TransactionCreateRoute() { return <TransactionCreateWrapper />; }
function TransactionEditRoute()   { return <TransactionEditWrapper />; }
function TransactionDeleteRoute() { return <TransactionDeleteWrapper />; }
function PendingPaymentsRoute()   { return <PendingPaymentsWrapper />; }


// ============================================================
// INVOICES ROUTES
// ============================================================

function InvoiceListRoute()   { return <InvoiceListWrapper />; }
function InvoiceFormRoute()   { return <InvoiceFormWrapper />; }
function InvoiceEditRoute()   { return <InvoiceFormWrapper />; }
function InvoiceDeleteRoute() { return <InvoiceDeleteWrapper />; }
function InvoiceReportRoute() { return <InvoiceReportWrapper />; }


// ============================================================
// INVENTORY ROUTES
// ============================================================

function InventoryDashboardRoute()      { return <InventoryDashboardWrapper />; }
function InventoryViewRoute()           { return <InventoryListWrapper inventoryType="in-stock" />; }
function InventoryReceivableRoute()     { return <InventoryListWrapper inventoryType="on-order" />; }
function InventoryTypeSelectionRoute()  { return <InventoryTypeSelectionWrapper />; }
function InventoryCostingOptionRoute()  { return <InventoryCostingOptionWrapper />; }
function InventoryCostingDetailsRoute() { return <InventoryCostingDetailsWrapper />; }
function InventoryProductDetailsRoute() { return <InventoryProductDetailsWrapper />; }
function InventoryPaymentRoute()        { return <InventoryPaymentWrapper />; }
function InventoryAddExistingRoute()    { return <InventoryAddExistingWrapper />; }
function ProductTransferListRoute()     { return <ProductTransferWrapper />; }
function ProductTransferNewRoute()      { return <ProductTransferCreateWrapper />; }


// ============================================================
// BUDGET ROUTES
// ============================================================

function BudgetListRoute()   { return <BudgetListWrapper />; }
function BudgetCreateRoute() { return <BudgetCreateWrapper />; }
function BudgetEditRoute()   { return <BudgetEditWrapper />; }
function BudgetDeleteRoute() { return <BudgetDeleteWrapper />; }


// ============================================================
// ROUTER
// ============================================================

export const router = createBrowserRouter([

  // ── Public / Auth ─────────────────────────────────────────
  { path: '/',        element: <Navigate to="/dashboard" replace /> },
  { path: '/login',   element: <LoginPage /> },
  { path: '/signup',  element: <Navigate to="/login" replace /> }, // signup disabled

  // ── Dashboard ─────────────────────────────────────────────
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

  // ── Loans ─────────────────────────────────────────────────
  {
    path: '/loans',
    element: (<ProtectedRoute><OutletLayout activeModule="loans" /></ProtectedRoute>),
    children: [
      { index: true,               element: <ScreenProtectedRoute requiredScreen="Loans Dashboard"><LoanDashboardRoute /></ScreenProtectedRoute> },
      { path: 'all',               element: <ScreenProtectedRoute requiredScreen="All Loans List"><LoanListRoute /></ScreenProtectedRoute> },
      { path: 'payable',           element: <ScreenProtectedRoute requiredScreen="Loans Payable"><LoanPayableListRoute /></ScreenProtectedRoute> },
      { path: 'receivable',        element: <ScreenProtectedRoute requiredScreen="Loans Receivable"><LoanReceivableListRoute /></ScreenProtectedRoute> },
      { path: 'create',            element: <ScreenProtectedRoute requiredScreen="Create Loan"><LoanCreateRoute /></ScreenProtectedRoute> },
      { path: 'create-payable',    element: <ScreenProtectedRoute requiredScreen="Create Payable Loan"><LoanCreatePayableRoute /></ScreenProtectedRoute> },
      { path: 'create-receivable', element: <ScreenProtectedRoute requiredScreen="Create Receivable Loan"><LoanCreateReceivableRoute /></ScreenProtectedRoute> },
      { path: ':id/edit',          element: <ScreenProtectedRoute requiredScreen="Edit Loan"><LoanEditRoute /></ScreenProtectedRoute> },
      { path: ':id/payment',       element: <ScreenProtectedRoute requiredScreen="Loan Payment"><LoanPaymentRoute /></ScreenProtectedRoute> },
    ],
  },

  // ── Salary ────────────────────────────────────────────────
  {
    path: '/salary',
    element: (<ProtectedRoute><OutletLayout activeModule="salary" /></ProtectedRoute>),
    children: [
      { index: true,            element: <ScreenProtectedRoute requiredScreen="Salary Dashboard"><SalaryDashboardRoute /></ScreenProtectedRoute> },
      { path: 'all',            element: <ScreenProtectedRoute requiredScreen="Salary All List"><SalaryAllListRoute /></ScreenProtectedRoute> },
      { path: 'regular',        element: <ScreenProtectedRoute requiredScreen="Salary Regular List"><SalaryRegularListRoute /></ScreenProtectedRoute> },
      { path: 'advance',        element: <ScreenProtectedRoute requiredScreen="Salary Advance List"><SalaryAdvanceListRoute /></ScreenProtectedRoute> },
      { path: 'create-regular', element: <ScreenProtectedRoute requiredScreen="Create Regular Salary"><SalaryCreateRegularRoute /></ScreenProtectedRoute> },
      { path: 'create-advance', element: <ScreenProtectedRoute requiredScreen="Create Advance Salary"><SalaryCreateAdvanceRoute /></ScreenProtectedRoute> },
      { path: ':id/edit',       element: <ScreenProtectedRoute requiredScreen="Salary Edit"><SalaryEditRoute /></ScreenProtectedRoute> },
      { path: ':id/delete',     element: <ScreenProtectedRoute requiredScreen="Salary Delete"><SalaryDeleteRoute /></ScreenProtectedRoute> },
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
      { path: 'create-new/details',         element: <ScreenProtectedRoute requiredScreen="Inventory Product Details"><InventoryProductDetailsRoute /></ScreenProtectedRoute> },
      { path: 'create-new/payment',         element: <ScreenProtectedRoute requiredScreen="Inventory Payment"><InventoryPaymentRoute /></ScreenProtectedRoute> },
      { path: 'add-existing',               element: <ScreenProtectedRoute requiredScreen="Inventory Add Existing"><InventoryAddExistingRoute /></ScreenProtectedRoute> },
      { path: ':id/edit',                element: <ScreenProtectedRoute requiredScreen="Inventory View"><InventoryEditWrapper /></ScreenProtectedRoute> },
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
  }
]);
