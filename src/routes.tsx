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

import { Sidebar } from './layouts/Sidebar';



import { TopBar } from './layouts/TopBar';
import { useAuth } from './providers/context/AuthContext';
import { useState } from 'react';
import { AppData, initialData, normalizeInitialData, Employee } from './App';


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
// --- INVENTORY LAYOUT WITH SIDEBAR AND TOPBAR ---
function InventoryLayout() {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-[#f0f2f5]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <TopBar notifications={[]} setNotifications={() => {}} activeModule="product-transfer" user={user} />
          <TopBar notifications={[]} setNotifications={() => {}} activeModule="inventory" user={user} />
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
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
    path: "/inventory",
    element: (
      <ProtectedRoute>
        <InventoryLayout />
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
    ],
  }


]);
