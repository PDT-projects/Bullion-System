// Commission Calculation View - Presentational Component

import { Calculator, X, Maximize2, Minimize2, Check, AlertCircle, Edit2, Save, XCircle } from 'lucide-react';
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
  employees
}: CommissionCalculationViewProps) {
  const getEmployeeName = (id: string) =>
    employees.find(e => e.id === id)?.name || id;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Commission Calculation</h1>
        <p className="text-gray-600 mt-1">Calculate commissions based on sales performance</p>
      </div>

      {/* Selection Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Select Criteria</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City <span className="text-red-500">*</span>
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
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
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
              className="flex items-center gap-2 bg-[#4f46e5] text-white px-4 py-2 rounded-lg hover:bg-[#4338ca] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Calculator size={20} />
              {isCalculating ? 'Calculating...' : 'Calculate Commission'}
            </button>
          </div>
        </div>
      </div>

      {/* Results Modal */}
      {showModal && (
        <div className={isFullScreen ? 'fixed inset-0 z-50 bg-white' : 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'}>
          <div className={isFullScreen ? 'w-full h-full overflow-auto' : 'bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-auto'}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Commission Calculation Results</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedCity} — {formatMonth(selectedMonth)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-2 hover:bg-gray-100 rounded-lg">
                  {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
                <button onClick={handleModalCancel} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Summary */}
            {summary && (
              <div className="grid grid-cols-3 gap-4 p-6 border-b border-gray-200 bg-gray-50">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600">Total Salespeople</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalSalespeople}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600">Total Sales</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalSales)}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600">Total Commission</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalCommission)}</p>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Calculated Commissions</h3>
                <button
                  onClick={confirmAllCommissions}
                  className="flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Check size={16} />
                  Confirm All
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salesperson</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission %</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {commissionData.map((commission) => (
                      <tr key={commission.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {getEmployeeName(commission.salesperson)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatCurrency(commission.totalSales)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {isEditing === commission.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={editValues.percentage}
                                onChange={(e) => setEditValues({ ...editValues, percentage: parseFloat(e.target.value) || 0 })}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                step="0.01"
                              />
                              <span>%</span>
                            </div>
                          ) : (
                            `${commission.overriddenCommissionPercentage || commission.commissionPercentage}%`
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {isEditing === commission.id ? (
                            <input
                              type="number"
                              value={editValues.amount}
                              onChange={(e) => setEditValues({ ...editValues, amount: parseFloat(e.target.value) || 0 })}
                              className="w-28 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            formatCurrency(commission.overriddenCommissionAmount || commission.calculatedCommissionAmount)
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            commission.status === 'Confirmed' ? 'bg-green-100 text-green-800'
                            : commission.status === 'Adjusted' ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                          }`}>
                            {commission.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {isEditing === commission.id ? (
                              <>
                                <button onClick={() => saveEdit(commission.id)} className="p-1 hover:bg-gray-100 rounded text-green-600" title="Save">
                                  <Save size={16} />
                                </button>
                                <button onClick={cancelEdit} className="p-1 hover:bg-gray-100 rounded text-red-600" title="Cancel">
                                  <XCircle size={16} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => startEdit(commission)} className="p-1 hover:bg-gray-100 rounded text-blue-600" title="Edit">
                                  <Edit2 size={16} />
                                </button>
                                <button onClick={() => confirmSingleCommission(commission.id)} className="p-1 hover:bg-gray-100 rounded text-green-600" title="Confirm">
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

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button onClick={handleModalCancel} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">
                Cancel
              </button>
              <button onClick={handleModalConfirm} className="px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca]">
                Save All Commissions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}