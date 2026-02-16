import { createBrowserRouter, useNavigate, Navigate } from 'react-router-dom';
import { Signup } from './pages/Signup';
import { Login } from './pages/Login';
import { Dashboard } from './features/finance/Dashboard';
import { Sidebar } from './layouts/Sidebar';
import { TopBar } from './layouts/TopBar';
import { useAuth } from './providers/context/AuthContext';
import { useState } from 'react';
import { AppData, initialData, normalizeInitialData } from './App';

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
  }
]);
