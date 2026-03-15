// Bills Module - View Layer
// List page UI component

import React from 'react';
import { Bill, BillFilters } from '../models/types';
import { BillsService } from '../models/billsService';
import { Button } from '../../../components/ui/button';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Trash2,
  X,
  FileText,
  Printer,
  Zap,
  Wifi,
  Droplets,
  Receipt
} from 'lucide-react';

interface BillsListViewProps {
  bills: Bill[];
  allBills: Bill[];
  filters: BillFilters;
  showFilters: boolean;
  activeFilterCount: number;
  viewingBill: Bill | null;
  viewingSlip: Bill | null;
  isLoading: boolean;
  stats: {
    totalBills: number;
    totalAmount: number;
    electricityCount: number;
    electricityTotal: number;
    internetCount: number;
    internetTotal: number;
    utilitiesCount: number;
    utilitiesTotal: number;
  };
  setFilter: (key: keyof BillFilters, value: any) => void;
  clearFilters: () => void;
  toggleFilters: () => void;
  setViewingBill: (bill: Bill | null) => void;
  setViewingSlip: (bill: Bill | null) => void;
  handleDelete: (id: string) => void;
  handleAdd: () => void;
  handlePrint: (bill: Bill) => void;
  getCategoryColor: (category: string) => string;
  getCategoryIconName: (category: string) => 'Zap' | 'Wifi' | 'Droplets' | 'Receipt';
}

const CategoryIcon: React.FC<{ name: string }> = ({ name }) => {
  switch (name) {
    case 'Zap':      return <Zap className="w-4 h-4 text-yellow-600" />;
    case 'Wifi':     return <Wifi className="w-4 h-4 text-blue-600" />;
    case 'Droplets': return <Droplets className="w-4 h-4 text-cyan-600" />;
    default:         return <Receipt className="w-4 h-4 text-gray-600" />;
  }
};

export const BillsListView: React.FC<BillsListViewProps> = ({
  bills,
  filters,
  showFilters,
  activeFilterCount,
  viewingBill,
  viewingSlip,
  isLoading,
  stats,
  setFilter,
  clearFilters,
  toggleFilters,
  setViewingBill,
  setViewingSlip,
  handleDelete,
  handleAdd,
  handlePrint,
  getCategoryColor,
  getCategoryIconName
}) => {
  const formatCurrency = BillsService.formatCurrency;
  const formatDate = BillsService.formatDate;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bills</h2>
          <p className="text-gray-600">Manage utility bills and recurring payments</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleFilters}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter size={18} />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
          <Button onClick={handleAdd} className="flex items-center gap-2">
            <Plus size={18} />
            Add Bill
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Receipt size={18} className="text-[#4f46e5]" />
            <p className="text-sm text-gray-600">Total Bills</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalBills}</p>
          <p className="text-sm text-gray-500 mt-1">{formatCurrency(stats.totalAmount)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={18} className="text-yellow-600" />
            <p className="text-sm text-gray-600">Electricity</p>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.electricityTotal)}</p>
          <p className="text-sm text-gray-500 mt-1">{stats.electricityCount} bills</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Wifi size={18} className="text-blue-600" />
            <p className="text-sm text-gray-600">Internet</p>
          </div>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.internetTotal)}</p>
          <p className="text-sm text-gray-500 mt-1">{stats.internetCount} bills</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Droplets size={18} className="text-cyan-600" />
            <p className="text-sm text-gray-600">Utilities</p>
          </div>
          <p className="text-2xl font-bold text-cyan-600">{formatCurrency(stats.utilitiesTotal)}</p>
          <p className="text-sm text-gray-500 mt-1">{stats.utilitiesCount} bills</p>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Vendor, company..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilter('searchTerm', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.categoryFilter}
                onChange={(e) => setFilter('categoryFilter', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
              >
                <option value="all">All Categories</option>
                <option value="Electricity">Electricity</option>
                <option value="Internet">Internet</option>
                <option value="Utilities">Utilities</option>
                <option value="Purchase Order">Purchase Order</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select
                value={filters.paymentMethodFilter}
                onChange={(e) => setFilter('paymentMethodFilter', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
              >
                <option value="">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="Bank">Bank</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilter('dateFrom', e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => setFilter('dateTo', e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
              />
            </div>
          </div>
          {activeFilterCount > 0 && (
            <div className="mt-3 flex justify-end">
              <button onClick={clearFilters} className="text-sm text-red-600 hover:text-red-800 font-medium">
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4f46e5] mx-auto mb-3" />
            <p className="text-gray-600">Loading bills...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid To</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bills.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      <Receipt className="mx-auto mb-3 text-gray-300" size={48} />
                      <p className="text-lg font-medium">No bills found</p>
                      <p className="text-sm mt-1">Add a new bill to get started</p>
                    </td>
                  </tr>
                ) : (
                  bills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(bill.date)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <CategoryIcon name={getCategoryIconName(bill.subCategory)} />
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(bill.subCategory)}`}>
                            {bill.subCategory}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{bill.paidTo || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {bill.company?.split(': ')[1] || bill.company || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {bill.mode}{bill.bankName ? ` (${bill.bankName})` : ''}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(bill.amount)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setViewingBill(bill)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => setViewingSlip(bill)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                            title="View Slip"
                          >
                            <FileText size={16} />
                          </button>
                          <button
                            onClick={() => handlePrint(bill)}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                            title="Print"
                          >
                            <Printer size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(bill.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Bill Modal */}
      {viewingBill && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Bill Details</h3>
              <button onClick={() => setViewingBill(null)} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-600">Date</p><p className="font-medium">{formatDate(viewingBill.date)}</p></div>
                <div><p className="text-sm text-gray-600">Company</p><p className="font-medium">{viewingBill.company?.split(': ')[1] || viewingBill.company}</p></div>
                <div>
                  <p className="text-sm text-gray-600">Category</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(viewingBill.subCategory)}`}>
                    {viewingBill.subCategory}
                  </span>
                </div>
                <div><p className="text-sm text-gray-600">Paid To</p><p className="font-medium text-[#4f46e5]">{viewingBill.paidTo || '-'}</p></div>
                <div><p className="text-sm text-gray-600">Paid By</p><p className="font-medium">{viewingBill.paidBy || '-'}</p></div>
                <div><p className="text-sm text-gray-600">Transaction By</p><p className="font-medium">{viewingBill.transactionBy || '-'}</p></div>
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-medium">{viewingBill.mode}{viewingBill.bankName ? ` (${viewingBill.bankName})` : ''}</p>
                </div>
                <div><p className="text-sm text-gray-600">Amount</p><p className="text-lg font-bold text-[#4f46e5]">{formatCurrency(viewingBill.amount)}</p></div>
              </div>
              {viewingBill.note && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-1">Note</p>
                  <p className="font-medium">{viewingBill.note}</p>
                </div>
              )}
              {viewingBill.imageUrl && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2">Receipt</p>
                  <img src={viewingBill.imageUrl} alt="Receipt" className="max-w-full h-auto rounded border" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Slip Modal */}
      {viewingSlip && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Bill Payment Slip</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => handlePrint(viewingSlip)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg">
                  <Printer size={20} />
                </button>
                <button onClick={() => setViewingSlip(null)} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg">
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="p-8">
              <div className="text-center border-b pb-4 mb-6">
                <h2 className="text-2xl font-bold text-[#4f46e5]">Pakistan Detectors Technologies</h2>
                <p className="text-sm text-gray-600 mt-1">{viewingSlip.company?.split(': ')[1] || viewingSlip.company}</p>
                <p className="text-lg font-semibold mt-3">BILL PAYMENT SLIP</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div><p className="text-sm text-gray-600">Date:</p><p className="font-semibold">{formatDate(viewingSlip.date)}</p></div>
                <div><p className="text-sm text-gray-600">Category:</p><p className="font-semibold">{viewingSlip.subCategory}</p></div>
                <div><p className="text-sm text-gray-600">Paid To:</p><p className="font-semibold text-[#4f46e5]">{viewingSlip.paidTo || '-'}</p></div>
                <div><p className="text-sm text-gray-600">Paid By:</p><p className="font-semibold">{viewingSlip.paidBy || '-'}</p></div>
                <div><p className="text-sm text-gray-600">Transaction By:</p><p className="font-semibold">{viewingSlip.transactionBy || '-'}</p></div>
                <div>
                  <p className="text-sm text-gray-600">Payment Method:</p>
                  <p className="font-semibold">{viewingSlip.mode}{viewingSlip.bankName ? ` (${viewingSlip.bankName})` : ''}</p>
                </div>
              </div>
              <div className="bg-[#4f46e5]/10 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Amount Paid:</span>
                  <span className="text-2xl font-bold text-[#4f46e5]">{formatCurrency(viewingSlip.amount)}</span>
                </div>
              </div>
              {viewingSlip.note && (
                <div className="border-t pt-4 mb-6">
                  <p className="text-sm font-semibold mb-1">Note:</p>
                  <p className="text-sm text-gray-600">{viewingSlip.note}</p>
                </div>
              )}
              {viewingSlip.imageUrl && (
                <div className="border-t pt-4 mb-6">
                  <p className="text-sm font-semibold mb-2">Receipt:</p>
                  <img src={viewingSlip.imageUrl} alt="Receipt" className="max-w-full h-auto rounded border" />
                </div>
              )}
              <div className="border-t pt-4 text-center text-sm text-gray-500">
                <p>Generated on {new Date().toLocaleDateString('en-PK')} at {new Date().toLocaleTimeString('en-PK')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};