import { useNavigate } from 'react-router-dom';
import { 
  HandCoins, 
  Plus, 
  TrendingDown, 
  TrendingUp, 
  FileText, 
  History,
  ArrowRight
} from 'lucide-react';

export function LoansPage() {
  const navigate = useNavigate();

  const loanCards = [
    {
      id: 'all-loans',
      title: 'All Loans',
      description: 'View and manage all loans in one place',
      icon: HandCoins,
      path: '/loans/all',
      color: 'blue',
      bgColor: 'bg-blue-600',
      borderColor: 'border-blue-500',
      hoverBg: 'hover:bg-blue-600',
      iconColor: 'text-blue-600'
    },
    {
      id: 'payable',
      title: 'Payable Loans',
      description: 'Loans taken from companies or individuals',
      icon: TrendingDown,
      path: '/loans/payable',
      color: 'red',
      bgColor: 'bg-red-600',
      borderColor: 'border-red-500',
      hoverBg: 'hover:bg-red-600',
      iconColor: 'text-red-600'
    },
    {
      id: 'receivable',
      title: 'Receivable Loans',
      description: 'Loans given to employees or individuals',
      icon: TrendingUp,
      path: '/loans/receivable',
      color: 'green',
      bgColor: 'bg-green-600',
      borderColor: 'border-green-500',
      hoverBg: 'hover:bg-green-600',
      iconColor: 'text-green-600'
    },
    {
      id: 'history',
      title: 'Loan History',
      description: 'Complete history and reports of all loans',
      icon: History,
      path: '/loans/history',
      color: 'purple',
      bgColor: 'bg-purple-600',
      borderColor: 'border-purple-500',
      hoverBg: 'hover:bg-purple-600',
      iconColor: 'text-purple-600'
    }
  ];

  const quickActions = [
    {
      id: 'create-payable',
      title: 'Add Loan Payable',
      description: 'Record a new loan taken',
      icon: Plus,
      path: '/loans/create-payable',
      color: 'red',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      hoverBg: 'hover:bg-red-100',
      iconColor: 'text-red-600'
    },
    {
      id: 'create-receivable',
      title: 'Add Loan Receivable',
      description: 'Record a new loan given',
      icon: Plus,
      path: '/loans/create-receivable',
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      hoverBg: 'hover:bg-green-100',
      iconColor: 'text-green-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <HandCoins className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight mb-2">
                Loans & Advances
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Manage all loans, advances, and credit transactions
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => navigate(action.path)}
                className={`flex items-center gap-4 p-4 ${action.bgColor} border-2 ${action.borderColor} rounded-lg ${action.hoverBg} transition-all duration-200 text-left group`}
              >
                <div className={`p-3 bg-white rounded-lg shadow-sm ${action.iconColor}`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className={`text-lg font-semibold ${action.iconColor} group-hover:scale-105 transition-transform`}>
                    {action.title}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                </div>
                <ArrowRight className={`w-5 h-5 ${action.iconColor} opacity-0 group-hover:opacity-100 transition-opacity`} />
              </button>
            ))}
          </div>
        </div>

        {/* Main Navigation Cards */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">Loan Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loanCards.map((card) => (
              <button
                key={card.id}
                onClick={() => navigate(card.path)}
                className={`p-6 bg-gray-50 text-gray-700 border-2 border-gray-200 rounded-lg ${card.hoverBg} hover:text-white hover:border-transparent transition-all duration-200 text-left group`}
              >
                <div className="flex items-center mb-4">
                  <card.icon className={`w-10 h-10 ${card.iconColor} group-hover:text-white transition-colors`} />
                </div>
                <h4 className={`text-xl font-bold ${card.iconColor} group-hover:text-white mb-2 transition-colors`}>
                  {card.title}
                </h4>
                <p className="text-sm text-gray-600 group-hover:text-white/90 transition-colors">
                  {card.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-blue-900">Payable Loans</h4>
            </div>
            <p className="text-sm text-blue-700">
              Loans taken from banks, companies, or individuals that need to be repaid.
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-green-900">Receivable Loans</h4>
            </div>
            <p className="text-sm text-green-700">
              Loans given to employees or external parties that will be received back.
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-purple-900">Loan Tracking</h4>
            </div>
            <p className="text-sm text-purple-700">
              Track payments, view history, and generate reports for all loans.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
