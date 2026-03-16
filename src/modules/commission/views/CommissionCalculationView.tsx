// Commission Calculation View - Presentational Component

import {
  Calculator, X, Maximize2, Minimize2, Check,
  AlertCircle, Edit2, Save, XCircle, FileText, Info
} from 'lucide-react';
import type { Commission } from '../models/types';

interface CommissionCalculationViewProps {
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  commissionData: Commission[];
  calculationErrors: string[];
  summary: {
    totalSalespeople: number;
    totalSales: number;
    totalCommission: number;
  } | null;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  isFullScreen: boolean;
  setIsFullScreen: (full: boolean) => void;
  isCalculating: boolean;
  isEditing: string | null;
  editValues: { percentage: number; amount: number };
  setEditValues: (values: { percentage: number; amount: number }) => void;
  calculateCommission: () => void;
  confirmSingleCommission: (commissionId: string) => void;
  confirmAllCommissions: () => void;
  startEdit: (commission: Commission) => void;
  saveEdit: (commissionId: string) => void;
  cancelEdit: () => void;
  handleModalConfirm: () => void;
  handleModalCancel: () => void;
  formatCurrency: (amount: number) => string;
  formatMonth: (monthStr: string) => string;
  cities: readonly string[];
  employees: any[];
  totalInvoices?: number;
  paidInvoices?: number;
}

export function CommissionCalculationView({
  selectedCity,
  setSelectedCity,
  selectedMonth,
  setSelectedMonth,
  commissionData,
  calculationErrors,
  summary,
  showModal,
  setShowModal,
  isFullScreen,
  setIsFullScreen,
  isCalculating,
  isEditing,
  editValues,
  setEditValues,
  calculateCommission,
  confirmSingleCommission,
  confirmAllCommissions,
  startEdit,
  saveEdit,
  cancelEdit,
  handleModalConfirm,
  handleModalCancel,
  formatCurrency,
  formatMonth,
  cities,
  employees,
  totalInvoices = 0,
  paidInvoices = 0,
}: CommissionCalculationViewProps) {
  const getEmployeeName = (id: string) =>
    employees.find(e => e.id === id)?.name || id;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Commission Calculation</h1>
        <p className="text-gray-600 mt-1">Calculate commissions based on paid invoice sales</p>
      </div>

      {/* Invoice Data Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Invoices Loaded</p>
              <p className="text-2xl font-bold text-gray-900">{totalInvoices}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Check size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Paid Invoices</p>
              <p className="text-2xl font-bold text-green-600">{paidInvoices}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Info size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Commission Basis</p>
              <p className="text-sm font-semibold text-purple-700 mt-0.5">Paid invoices by salesperson location</p>
            </div>
          </div>
        </div>
      </div>

      {/* Selection Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Select Criteria</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Commission is calculated from paid invoices where the salesperson's location matches the selected city
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City / Territory <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
              >
                <option value="">Select City</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Month <span className="text-red-500">*</span>
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
              />
            </div>
          </div>

          {calculationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  {calculationErrors.map((error, index) => (
                    <p key={index} className="text-sm text-red-600">{error}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={calculateCommission}
              disabled={isCalculating || !selectedCity || !selectedMonth}
              className="flex items-center gap-2 bg-[#4f46e5] text-white px-6 py-2.5 rounded-lg hover:bg-[#4338ca] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Calculator size={20} />
              {isCalculating ? 'Calculating...' : 'Calculate Commission'}
            </button>
          </div>
        </div>
      </div>

      {/* Results Modal */}
      {showModal && (
        <div className={
          isFullScreen
            ? 'fixed inset-0 z-50 bg-white overflow-auto'
            : 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
        }>
          <div className={
            isFullScreen
              ? 'w-full min-h-full'
              : 'bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-auto'
          }>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Commission Calculation Results</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {selectedCity} — {formatMonth(selectedMonth)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
                >
                  {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
                <button
                  onClick={handleModalCancel}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            {summary && (
              <div className="grid grid-cols-3 gap-4 p-6 border-b border-gray-200 bg-gray-50">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500">Total Salespeople</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalSalespeople}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500">Total Sales (Paid Invoices)</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(summary.totalSales)}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500">Total Commission Payable</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(summary.totalCommission)}</p>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Calculated Commissions</h3>
                <button
                  onClick={confirmAllCommissions}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Check size={16} />
                  Confirm All
                </button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salesperson</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Applied Slab</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Commission %</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Commission Amount</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {commissionData.map((commission) => (
                      <tr key={commission.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {getEmployeeName(commission.salesperson)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {formatCurrency(commission.totalSales)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 text-center">
                          {formatCurrency(commission.appliedSlabFrom)} – {formatCurrency(commission.appliedSlabTo)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isEditing === commission.id ? (
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                value={editValues.percentage}
                                onChange={(e) =>
                                  setEditValues({ ...editValues, percentage: parseFloat(e.target.value) || 0 })
                                }
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                                step="0.01"
                                min="0"
                                max="100"
                              />
                              <span className="text-gray-500 text-sm">%</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-900">
                              {commission.overriddenCommissionPercentage || commission.commissionPercentage}%
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isEditing === commission.id ? (
                            <input
                              type="number"
                              value={editValues.amount}
                              onChange={(e) =>
                                setEditValues({ ...editValues, amount: parseFloat(e.target.value) || 0 })
                              }
                              className="w-32 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-900">
                              {formatCurrency(
                                commission.overriddenCommissionAmount || commission.calculatedCommissionAmount
                              )}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            commission.status === 'Confirmed'
                              ? 'bg-green-100 text-green-800'
                              : commission.status === 'Adjusted'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {commission.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {isEditing === commission.id ? (
                              <>
                                <button
                                  onClick={() => saveEdit(commission.id)}
                                  className="p-1.5 hover:bg-green-50 rounded transition-colors text-green-600"
                                  title="Save"
                                >
                                  <Save size={16} />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="p-1.5 hover:bg-red-50 rounded transition-colors text-red-600"
                                  title="Cancel"
                                >
                                  <XCircle size={16} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEdit(commission)}
                                  disabled={commission.isLocked}
                                  className="p-1.5 hover:bg-blue-50 rounded transition-colors text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Edit"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => confirmSingleCommission(commission.id)}
                                  disabled={commission.isLocked}
                                  className="p-1.5 hover:bg-green-50 rounded transition-colors text-green-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Confirm"
                                >
                                  <Check size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50 sticky bottom-0">
              <p className="text-sm text-gray-500">
                {commissionData.filter(c => c.status === 'Confirmed').length} of {commissionData.length} confirmed
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleModalCancel}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleModalConfirm}
                  className="px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors"
                >
                  Save All to Firestore
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}