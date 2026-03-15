// Bills Module - View Layer
// Delete confirmation UI component

import React from 'react';
import { Bill } from '../models/types';
import { BillsService } from '../models/billsService';
import { Button } from '../../../components/ui/button';
import { AlertTriangle, Zap, Wifi, Droplets, Receipt } from 'lucide-react';

interface BillsDeleteViewProps {
  bill: Bill | null;
  isDeleting: boolean;
  categoryColor: string;
  handleConfirmDelete: () => void;
  handleCancel: () => void;
}

const CategoryIcon: React.FC<{ category: string }> = ({ category }) => {
  switch (category) {
    case 'Electricity': return <Zap className="w-5 h-5 text-yellow-600" />;
    case 'Internet':    return <Wifi className="w-5 h-5 text-blue-600" />;
    case 'Utilities':   return <Droplets className="w-5 h-5 text-cyan-600" />;
    default:            return <Receipt className="w-5 h-5 text-gray-600" />;
  }
};

export const BillsDeleteView: React.FC<BillsDeleteViewProps> = ({
  bill,
  isDeleting,
  categoryColor,
  handleConfirmDelete,
  handleCancel
}) => {
  const formatCurrency = BillsService.formatCurrency;
  const formatDate = BillsService.formatDate;

  if (!bill) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4f46e5]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Delete Bill</h2>
          <p className="text-gray-600 mt-1">Confirm deletion of this bill payment</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6 space-y-6">
          {/* Warning */}
          <div className="flex items-center gap-4 bg-red-50 p-4 rounded-lg border border-red-200">
            <AlertTriangle className="w-8 h-8 text-red-600 shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Warning: This action cannot be undone</h3>
              <p className="text-sm text-red-600">
                Deleting this bill will permanently remove it from the system.
              </p>
            </div>
          </div>

          {/* Bill Details */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Bill Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase">Transaction ID</p>
                <p className="font-medium text-gray-900 font-mono text-sm">{bill.transactionId || bill.id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Date</p>
                <p className="font-medium text-gray-900">{formatDate(bill.date)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Category</p>
                <div className="flex items-center gap-2 mt-1">
                  <CategoryIcon category={bill.subCategory} />
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${categoryColor}`}>
                    {bill.subCategory}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Amount</p>
                <p className="text-lg font-bold text-[#4f46e5]">{formatCurrency(bill.amount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Paid To</p>
                <p className="font-medium text-gray-900">{bill.paidTo || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Paid By</p>
                <p className="font-medium text-gray-900">{bill.paidBy || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Payment Method</p>
                <p className="font-medium text-gray-900">
                  {bill.mode}{bill.bankName ? ` (${bill.bankName})` : ''}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Company</p>
                <p className="font-medium text-gray-900">
                  {bill.company?.split(': ')[1] || bill.company || '-'}
                </p>
              </div>
            </div>
            {bill.note && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-gray-500 uppercase mb-1">Note</p>
                <p className="text-sm text-gray-700">{bill.note}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete Bill'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};