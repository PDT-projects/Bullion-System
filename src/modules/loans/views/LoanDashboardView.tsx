/**
 * Loan Dashboard View
 * Presentational component for the loans dashboard.
 * Currency: AED (UAE Dirham)
 */

import React from 'react';
import { Wallet, ArrowUpRight, ArrowDownLeft, AlertTriangle, Calendar, Plus, RefreshCw, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import type { LoanDashboardCard, LoanQuickAction, LoanStatistics } from '../models/types';
import { formatCurrency } from '../models/loanService';

interface LoanDashboardViewProps {
  isLoading: boolean;
  error: string | null;
  statistics: LoanStatistics;
  totalReceivable: number;
  totalPayable: number;
  netPosition: number;
  overdueCount: number;
  upcomingCount: number;
  dashboardCards: LoanDashboardCard[];
  quickActions: LoanQuickAction[];
  onRefresh: () => void;
  onNavigateToAll: () => void;
  onNavigateToPayable: () => void;
  onNavigateToReceivable: () => void;
  onNavigateToOverdue: () => void;
  onCreatePayable: () => void;
  onCreateReceivable: () => void;
}

const iconMap: Record<string, React.ElementType> = { Wallet, ArrowUpRight, ArrowDownLeft, AlertTriangle, Calendar, Plus };

const colorMap: Record<string, string> = {
  blue:   'bg-blue-50 text-blue-600 border-blue-200',
  red:    'bg-red-50 text-red-600 border-red-200',
  green:  'bg-green-50 text-green-600 border-green-200',
  purple: 'bg-purple-50 text-purple-600 border-purple-200',
  orange: 'bg-orange-50 text-orange-600 border-orange-200',
};

export const LoanDashboardView: React.FC<LoanDashboardViewProps> = ({
  isLoading, error, statistics, totalReceivable, totalPayable, netPosition,
  overdueCount, upcomingCount, dashboardCards, quickActions,
  onRefresh, onNavigateToAll, onNavigateToPayable, onNavigateToReceivable,
  onNavigateToOverdue, onCreatePayable, onCreateReceivable,
}) => {
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="border border-red-200 bg-red-50 rounded-lg p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <p>{error}</p>
          </div>
          <button onClick={onRefresh} className="mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loans Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage payable and receivable loans</p>
        </div>
        <button onClick={onRefresh} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Receivable</p>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalReceivable)}</p>
              <p className="text-xs text-blue-600 mt-1">Money owed to us</p>
            </div>
            <div className="p-3 bg-blue-200 rounded-full"><TrendingUp className="h-6 w-6 text-blue-700" /></div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Total Payable</p>
              <p className="text-2xl font-bold text-red-900">{formatCurrency(totalPayable)}</p>
              <p className="text-xs text-red-600 mt-1">Money we owe</p>
            </div>
            <div className="p-3 bg-red-200 rounded-full"><TrendingDown className="h-6 w-6 text-red-700" /></div>
          </div>
        </div>

        <div className={`bg-gradient-to-br ${netPosition >= 0 ? 'from-green-50 to-green-100 border-green-200' : 'from-orange-50 to-orange-100 border-orange-200'} border rounded-lg p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${netPosition >= 0 ? 'text-green-600' : 'text-orange-600'}`}>Net Position</p>
              <p className={`text-2xl font-bold ${netPosition >= 0 ? 'text-green-900' : 'text-orange-900'}`}>
                {netPosition >= 0 ? '+' : ''}{formatCurrency(netPosition)}
              </p>
              <p className={`text-xs mt-1 ${netPosition >= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                {netPosition >= 0 ? 'Positive balance' : 'Negative balance'}
              </p>
            </div>
            <div className={`p-3 rounded-full ${netPosition >= 0 ? 'bg-green-200' : 'bg-orange-200'}`}>
              <DollarSign className={`h-6 w-6 ${netPosition >= 0 ? 'text-green-700' : 'text-orange-700'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dashboardCards.map(card => {
          const Icon = iconMap[card.icon] || Wallet;
          return (
            <div
              key={card.id}
              className={`cursor-pointer transition-all hover:shadow-md border rounded-lg p-6 ${colorMap[card.color]}`}
              onClick={() => {
                if (card.id === 'all-loans') onNavigateToAll();
                else if (card.id === 'payable') onNavigateToPayable();
                else if (card.id === 'receivable') onNavigateToReceivable();
                else if (card.id === 'overdue') onNavigateToOverdue();
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    <h3 className="font-semibold">{card.title}</h3>
                  </div>
                  <p className="text-sm mt-1 opacity-80">{card.description}</p>
                  {card.amount !== undefined && <p className="text-lg font-bold mt-2">{formatCurrency(card.amount)}</p>}
                </div>
                {card.count !== undefined && (
                  <span className="ml-2 px-2 py-1 text-xs font-medium bg-white rounded-full">{card.count}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="p-6 flex flex-wrap gap-3">
          <button onClick={onCreatePayable} className="flex items-center gap-2 px-4 py-2 border border-red-200 rounded-lg hover:bg-red-50 text-red-700 transition-colors">
            <Plus className="h-4 w-4" /> Create Payable Loan
          </button>
          <button onClick={onCreateReceivable} className="flex items-center gap-2 px-4 py-2 border border-green-200 rounded-lg hover:bg-green-50 text-green-700 transition-colors">
            <Plus className="h-4 w-4" /> Create Receivable Loan
          </button>
          <button onClick={onNavigateToAll} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Wallet className="h-4 w-4" /> View All Loans
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Loan Statistics</h3>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{statistics.totalLoans}</p>
            <p className="text-sm text-gray-500">Total Loans</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-900">{statistics.collectionRate}%</p>
            <p className="text-sm text-blue-600">Collection Rate</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-900">{statistics.fullCount}</p>
            <p className="text-sm text-green-600">Fully Paid</p>
          </div>
        </div>
      </div>
    </div>
  );
};