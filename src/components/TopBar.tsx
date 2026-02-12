import { NotificationBell } from './NotificationBell';
import { Notification } from '../types/Notification';

type Props = {
  notifications: Notification[];
  setNotifications: (n: Notification[]) => void;
  activeModule: string;
};

const getModuleTitle = (moduleId: string): string => {
  const moduleTitles: { [key: string]: string } = {
    'firestore-test': 'Firestore Test',
    'dashboard': 'Dashboard',
    'employees': 'Employees',
    'inventory-entry': 'Inventory Entry',
    'transactions': 'Add Transaction',
    'loans': 'All Loans',
    'banks': 'Bank Balances',
    'invoices': 'Invoices',
    'product-transfer': 'Product Transfer',
    'bank-transfers': 'Bank Transfers',
    'transaction-history': 'Transaction History',
    'pending-payments': 'Pending Payments',
    'loan-history': 'Loan History',
    'transfer-history': 'Transfer History',
    'cash-inflow': 'Cash Inflow',
    'cash-outflow': 'Cash Outflow',
    'bills': 'Bills',
    'salary': 'Salary',
    'advance-salary': 'Advance Salary',
    'loans-payable': 'Loans Payable',
    'loans-receivable': 'Loans Receivable',
    'cash-in-hand': 'Cash in Hand',
    'sales-report': 'Sales Report',
    'referral-report': 'Referral Report',
    'inventory-report': 'Inventory Report',
    'transaction-history-report': 'Transaction History Report',
    'commission-slabs': 'Commission Slabs',
    'commission-calculation': 'Commission Calculation',
    'commission-report': 'Commission Report',
    'inventory-audit-log': 'Inventory Audit Log',
    'budgets': 'Budgets',
    'operations': 'Operations',
    'finance': 'Finance',
    'transaction-menu': 'Transactions',
    'banking-menu': 'Banking'
  };

  return moduleTitles[moduleId] || 'Dashboard';
};

export function TopBar({ notifications, setNotifications, activeModule }: Props) {
  const title = getModuleTitle(activeModule);

  return (
    <div className="flex items-center justify-between">
      {/* Left section: title or breadcrumbs */}
      <div className="text-lg font-semibold text-gray-800">
        {title}
      </div>

      {/* Right section: notification bell + profile */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <NotificationBell notifications={notifications} setNotifications={setNotifications} />

        {/* User Profile */}
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold">
            AD
          </div>
          <span className="text-gray-700 font-medium">Admin</span>
        </div>
      </div>
    </div>
  );
}
