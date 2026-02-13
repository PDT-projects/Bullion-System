import { createBrowserRouter, Navigate, useNavigate, Outlet } from 'react-router-dom';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { Dashboard } from './components/Dashboard';
import { Employees } from './components/Employees';
import { CreateEmployee } from './components/CreateEmployee';
import { EmployeesPage } from './pages/EmployeesPage';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Toaster } from './components/ui/sonner';
import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Employee, Product, Transaction, Loan, Bank, Invoice, BankTransfer, ProductTransfer, CommissionSlab, Commission, ProductCostingType, AppData } from './App';
import { Budget } from './types/Budget';

// Initial data for the app
const initialData = {
  employees: [
    {
      id: '1',
      name: 'Ahmed Khan',
      position: 'Sales Manager',
      salary: 85000,
      phone: '+92 300 1234567',
      email: 'ahmed.khan@pdt.com',
      joinDate: '2023-01-15',
      status: 'active' as const
    },
    {
      id: '2',
      name: 'Fatima Ali',
      position: 'Product Developer',
      salary: 75000,
      phone: '+92 321 9876543',
      email: 'fatima.ali@pdt.com',
      joinDate: '2023-03-20',
      status: 'active' as const
    },
    {
      id: '3',
      name: 'Hassan Raza',
      position: 'Marketing Executive',
      salary: 65000,
      phone: '+92 333 5551234',
      email: 'hassan.raza@pdt.com',
      joinDate: '2023-06-10',
      status: 'active' as const
    },
    {
      id: '4',
      name: 'Ayesha Malik',
      position: 'Accountant',
      salary: 70000,
      phone: '+92 345 7778888',
      email: 'ayesha.malik@pdt.com',
      joinDate: '2022-11-05',
      status: 'active' as const
    }
  ] as Employee[],
  products: [] as Product[],
  transactions: [] as Transaction[],
  loans: [] as Loan[],
  banks: [] as Bank[],
  invoices: [] as Invoice[],
  bankTransfers: [] as BankTransfer[],
  productTransfers: [] as ProductTransfer[],
  commissionSlabs: [] as CommissionSlab[],
  productCosting: [] as ProductCostingType[],
  commissions: [] as Commission[],
  budgets: [] as Budget[],
  receivableStock: [] as any[]
};

// Create a context for app data
import { createContext, useContext } from 'react';

type AppDataContextType = {
  data: typeof initialData;
  setData: React.Dispatch<React.SetStateAction<typeof initialData>>;
};

export const AppDataContext = createContext<AppDataContextType | null>(null);

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within AppDataProvider');
  }
  return context;
};

// App Layout Component with Sidebar and TopBar
function AppLayout() {
  const { user } = useAuth();
  const [data, setData] = useState<AppData>(initialData);
  const [activeModule, setActiveModule] = useState('dashboard');

  // Handler to update employees
  const setEmployees = (employees: Employee[]) => {
    setData(prev => ({ ...prev, employees }));
  };

  // Render component based on activeModule
  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard data={data} />;
      case 'employees':
        return <Employees employees={data.employees} setEmployees={setEmployees} />;
      default:
        return <Dashboard data={data} />;
    }
  };

  return (
    <AppDataContext.Provider value={{ data, setData }}>
      <div className="flex h-screen bg-[#f0f2f5]">
        <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
            <TopBar notifications={[]} setNotifications={() => {}} activeModule="layout" user={user} />
          </header>
          <main className="flex-1 overflow-y-auto">
            {renderModule()}
          </main>
        </div>
        <Toaster position="top-right" />
      </div>
    </AppDataContext.Provider>
  );
}

// Login Page Component
function LoginPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  
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

// Signup Page Component
function SignupPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  
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

// Protected Route Wrapper
function ProtectedRoute() {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <AppLayout />;
}

// App Layout with module from URL params
function AppLayoutWithModule({ module = 'dashboard' }: { module?: string }) {
  const { user } = useAuth();
  const [data, setData] = useState<AppData>(initialData);
  const [activeModule, setActiveModule] = useState(module);

  // Handler to update employees
  const setEmployees = (employees: Employee[]) => {
    setData(prev => ({ ...prev, employees }));
  };

  // Render component based on activeModule
  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard data={data} />;
      case 'employees':
        return <EmployeesPage />;
      case 'inventory-entry':
        return <div>Inventory Entry</div>;
      case 'invoices':
        return <div>Invoices</div>;
      case 'product-transfer':
        return <div>Product Transfer</div>;
      case 'transactions':
        return <div>Transactions</div>;
      case 'pending-payments':
        return <div>Pending Payments</div>;
      case 'bills':
        return <div>Bills</div>;
      case 'salary':
        return <div>Salary</div>;
      case 'banks':
        return <div>Banks</div>;
      case 'bank-transfers':
        return <div>Bank Transfers</div>;
      case 'cash-in-hand':
        return <div>Cash in Hand</div>;
      case 'budgets':
        return <div>Budgets</div>;
      case 'loans-payable':
        return <div>Loans Payable</div>;
      case 'loans-receivable':
        return <div>Loans Receivable</div>;
      case 'loans':
        return <div>Loans</div>;
      default:
        return <Dashboard data={data} />;
    }
  };

  return (
    <AppDataContext.Provider value={{ data, setData }}>
      <div className="flex h-screen bg-[#f0f2f5]">
        <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
            <TopBar notifications={[]} setNotifications={() => {}} activeModule="layout" user={user} />
          </header>
          <main className="flex-1 overflow-y-auto">
            {renderModule()}
          </main>
        </div>
        <Toaster position="top-right" />
      </div>
    </AppDataContext.Provider>
  );
}

// Create the router
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />
  },
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/signup',
    element: <SignupPage />
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute />,
    loader: () => {
      // Set default module to dashboard
      return null;
    }
  },
  {
    path: '/employees',
    element: <AppLayoutWithModule module="employees" />
  },
  {
    path: '/inventory-entry',
    element: <AppLayoutWithModule module="inventory-entry" />
  },
  {
    path: '/invoices',
    element: <AppLayoutWithModule module="invoices" />
  },
  {
    path: '/product-transfer',
    element: <AppLayoutWithModule module="product-transfer" />
  },
  {
    path: '/transactions',
    element: <AppLayoutWithModule module="transactions" />
  },
  {
    path: '/pending-payments',
    element: <AppLayoutWithModule module="pending-payments" />
  },
  {
    path: '/bills',
    element: <AppLayoutWithModule module="bills" />
  },
  {
    path: '/salary',
    element: <AppLayoutWithModule module="salary" />
  },
  {
    path: '/banks',
    element: <AppLayoutWithModule module="banks" />
  },
  {
    path: '/bank-transfers',
    element: <AppLayoutWithModule module="bank-transfers" />
  },
  {
    path: '/cash-in-hand',
    element: <AppLayoutWithModule module="cash-in-hand" />
  },
  {
    path: '/budgets',
    element: <AppLayoutWithModule module="budgets" />
  },
  {
    path: '/loans-payable',
    element: <AppLayoutWithModule module="loans-payable" />
  },
  {
    path: '/loans-receivable',
    element: <AppLayoutWithModule module="loans-receivable" />
  },
  {
    path: '/loans',
    element: <AppLayoutWithModule module="loans" />
  }
]);
