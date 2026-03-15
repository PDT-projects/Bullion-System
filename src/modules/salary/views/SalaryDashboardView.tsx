// Salary Module - View Layer
// SalaryDashboardView - Main dashboard with cards

import {
  Wallet,
  Plus,
  Calendar,
  ArrowUpCircle,
  ArrowDownCircle,
  FileText,
  CreditCard,
  TrendingUp
} from 'lucide-react';
import { SalaryService } from '../models/salaryService';

interface SalaryDashboardViewProps {
  stats: {
    totalSalariesPaid: number;
    advanceSalaries: number;
    thisMonth: number;
    pendingPayments: number;
  };
  isLoading: boolean;
  navigateToAllSalaries: () => void;
  navigateToRegularSalaries: () => void;
  navigateToAdvanceSalaries: () => void;
  navigateToCreateRegular: () => void;
  navigateToCreateAdvance: () => void;
}

export function SalaryDashboardView({
  stats,
  isLoading,
  navigateToAllSalaries,
  navigateToRegularSalaries,
  navigateToAdvanceSalaries,
  navigateToCreateRegular,
  navigateToCreateAdvance
}: SalaryDashboardViewProps) {
  const formatCurrency = SalaryService.formatCurrency;

  const salaryCards = [
    {
      title: 'All Salaries',
      description: 'View all salary records including regular and advance payments',
      icon: Wallet,
      onClick: navigateToAllSalaries,
      color: 'blue',
      bgColor: 'bg-blue-600',
      borderColor: 'border-blue-500'
    },
    {
      title: 'Regular Salaries',
      description: 'Manage regular monthly salary payments to employees',
      icon: CreditCard,
      onClick: navigateToRegularSalaries,
      color: 'green',
      bgColor: 'bg-green-600',
      borderColor: 'border-green-500'
    },
    {
      title: 'Advance Salaries',
      description: 'Track and manage advance salary payments',
      icon: ArrowUpCircle,
      onClick: navigateToAdvanceSalaries,
      color: 'orange',
      bgColor: 'bg-orange-600',
      borderColor: 'border-orange-500'
    },
    {
      title: 'Pay Regular Salary',
      description: 'Create a new regular salary payment',
      icon: Plus,
      onClick: navigateToCreateRegular,
      color: 'purple',
      bgColor: 'bg-purple-600',
      borderColor: 'border-purple-500'
    },
    {
      title: 'Pay Advance Salary',
      description: 'Create a new advance salary payment',
      icon: ArrowDownCircle,
      onClick: navigateToCreateAdvance,
      color: 'red',
      bgColor: 'bg-red-600',
      borderColor: 'border-red-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight mb-2">
                Salary Management
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Manage employee salaries, advance payments, and salary reports
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-8 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm text-gray-600">Total Salaries Paid</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalSalariesPaid)}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <ArrowUpCircle className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-sm text-gray-600">Advance Salaries</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.advanceSalaries)}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm text-gray-600">This Month</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.thisMonth)}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm text-gray-600">Pending Payments</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingPayments}</p>
            </div>
          </div>
        )}

        {/* Navigation Cards */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <h3 className="text-2xl font-bold text-slate-950 mb-8">Salary Management Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {salaryCards.map((card, index) => (
              <button
                key={index}
                onClick={card.onClick}
                className={`p-6 bg-gray-50 text-gray-700 border-2 border-gray-200 rounded-xl hover:${card.bgColor} hover:text-white hover:${card.borderColor} transition-all duration-200 text-left group`}
              >
                <div className="flex items-center mb-4">
                  <card.icon className={`w-8 h-8 text-${card.color}-600 mr-3 group-hover:text-white`} />
                  <h4 className="text-lg font-semibold">{card.title}</h4>
                </div>
                <p className="text-gray-600 text-sm group-hover:text-white/90">{card.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={navigateToCreateRegular}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              Pay Regular Salary
            </button>
            <button
              onClick={navigateToCreateAdvance}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <ArrowUpCircle size={18} />
              Pay Advance Salary
            </button>
            <button
              onClick={navigateToAllSalaries}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <FileText size={18} />
              View All Records
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}