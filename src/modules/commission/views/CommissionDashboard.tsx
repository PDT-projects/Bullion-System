import { useState, useEffect } from 'react';
import { Check, AlertTriangle, Calendar, DollarSign, User, TrendingUp, Award, FileText, Loader2, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { useCommissionCalculationViewModel } from '../viewModels/useCommissionCalculationViewModel';
import type { InvoiceReference, EmployeeReference, Commission } from '../models/types';
import { formatCurrency, formatMonth, CITIES } from '../models/commissionService';
import { CommissionFirebaseService } from '../models/Commissionfirebaseservice';

interface DashboardProps {
  invoices:      InvoiceReference[];
  employees:     EmployeeReference[];
  setActiveTab:  (tab: string) => void;
}

export function CommissionDashboard({ invoices, employees, setActiveTab }: DashboardProps) {
  const {
    liveCommissions,
    liveCommissionsLoading,
    refreshLiveCommissions,
    calculateCommission,
    confirmAllCommissions,
    cities,
  } = useCommissionCalculationViewModel(() => {});

  const [pendingCount,           setPendingCount]           = useState(0);
  const [totalPendingCommission, setTotalPendingCommission] = useState(0);
  const [recentCommissions,      setRecentCommissions]      = useState<Commission[]>([]);

  useEffect(() => {
    refreshLiveCommissions();
  }, [refreshLiveCommissions]);

  useEffect(() => {
    const pending = liveCommissions.filter(c => c.status === 'Calculated');
    setPendingCount(pending.length);
    setTotalPendingCommission(
      pending.reduce((sum, c) => sum + (c.calculatedCommissionAmount || 0), 0)
    );
    setRecentCommissions(liveCommissions.slice(0, 5));
  }, [liveCommissions]);

  const handleQuickConfirmCurrentMonth = async () => {
    if (pendingCount === 0) {
      toast.info('No pending commissions to confirm');
      return;
    }
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const success = await calculateCommission(invoices, employees);
      if (success) {
        confirmAllCommissions();
        toast.success(`Confirmed ${pendingCount} pending commissions`);
        refreshLiveCommissions();
      }
    } catch {
      toast.error('Quick confirm failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className={`p-3 rounded-full ${pendingCount > 0 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}`}>
              <AlertTriangle size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Confirmation</p>
              <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <Award size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Commission</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPendingCommission)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <TrendingUp size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Recent Activity</p>
              <p className="text-2xl font-bold text-gray-900">{recentCommissions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-200 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp size={20} /> Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleQuickConfirmCurrentMonth}
            disabled={pendingCount === 0 || liveCommissionsLoading}
            className="group flex flex-col items-center p-6 border-2 border-dashed border-orange-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={32} className="group-hover:scale-110 transition-transform text-orange-600 mb-2" />
            <div className="text-center">
              <p className="font-semibold text-lg text-orange-800">{pendingCount}</p>
              <p className="text-sm text-orange-600">Confirm Current Month</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('calculate')}
            className="flex flex-col items-center p-6 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
          >
            <Calculator size={32} className="transition-transform hover:scale-110 text-blue-600 mb-2" />
            <div className="text-center">
              <p className="font-semibold text-lg text-blue-800">Calculate New</p>
              <p className="text-sm text-blue-600">{cities.join(', ')}</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className="flex flex-col items-center p-6 border-2 border-dashed border-green-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all"
          >
            <FileText size={32} className="transition-transform hover:scale-110 text-green-600 mb-2" />
            <div className="text-center">
              <p className="font-semibold text-lg text-green-800">View Reports</p>
              <p className="text-sm text-green-600">All Commissions</p>
            </div>
          </button>
        </div>
      </div>

      {/* Pending Commissions Table */}
      {liveCommissionsLoading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="inline-flex items-center gap-3 text-gray-500">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            Loading pending commissions...
          </div>
        </div>
      ) : pendingCount > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-orange-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-orange-800">
              <AlertTriangle size={20} /> Pending Confirmation ({pendingCount})
            </h3>
            <button
              onClick={refreshLiveCommissions}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-orange-50 border-b border-orange-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-orange-800 uppercase">Salesperson</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-orange-800 uppercase">City</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-orange-800 uppercase">Month</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-orange-800 uppercase">Total Sales</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-orange-800 uppercase">Commission</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-orange-800 uppercase">Invoices</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-orange-800 uppercase">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100">
                {liveCommissions
                  .filter(c => c.status === 'Calculated')
                  .slice(0, 10)
                  .map((commission) => (
                    <tr key={commission.id} className="hover:bg-orange-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{commission.salespersonName}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{commission.city}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatMonth(commission.month)}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                        {formatCurrency(commission.totalSales)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-orange-600 text-right">
                        {formatCurrency(commission.calculatedCommissionAmount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 text-right">{commission.invoiceCount}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          Auto (from invoices)
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {liveCommissions.filter(c => c.status === 'Calculated').length > 10 && (
            <div className="px-6 py-4 text-center text-sm text-gray-500">
              Showing 10 of {pendingCount} pending commissions...
            </div>
          )}
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp size={20} /> Recent Commissions
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentCommissions.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500 text-sm">
              No commission records yet. Commissions appear here automatically when paid invoices are saved.
            </div>
          ) : recentCommissions.map((commission) => (
            <div key={commission.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    commission.status === 'Confirmed' ? 'bg-green-500' :
                    commission.status === 'Adjusted'  ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <div>
                    <p className="font-medium text-gray-900">{commission.salespersonName}</p>
                    <p className="text-sm text-gray-500">{commission.city} · {formatMonth(commission.month)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg">{formatCurrency(commission.calculatedCommissionAmount)}</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    commission.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                    commission.status === 'Adjusted'  ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {commission.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}