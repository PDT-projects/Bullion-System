// Invoice Module - Delete View
// Delete confirmation dialog for invoices

import { AlertTriangle, X } from 'lucide-react';
import { Invoice } from '../models/types';

interface InvoiceDeleteViewProps {
  invoice: Invoice | null;
  onConfirm: () => void;
  onCancel: () => void;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

export function InvoiceDeleteView({
  invoice,
  onConfirm,
  onCancel,
  formatCurrency,
  formatDate
}: InvoiceDeleteViewProps) {
  if (!invoice) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertTriangle size={24} />
            <h3 className="text-lg font-semibold">Invoice Not Found</h3>
          </div>
          <p className="text-gray-600 mb-6">The invoice you are trying to delete could not be found.</p>
          <div className="flex justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 text-red-600">
            <AlertTriangle size={24} />
            <h3 className="text-lg font-semibold">Delete Invoice</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-gray-600">
            Are you sure you want to delete this invoice? This action cannot be undone and the products will be returned to inventory.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Invoice Number:</span>
              <span className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Date:</span>
              <span className="text-sm font-medium text-gray-900">{formatDate(invoice.date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Customer:</span>
              <span className="text-sm font-medium text-gray-900">{invoice.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Amount:</span>
              <span className="text-sm font-medium text-gray-900">{formatCurrency(invoice.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Products:</span>
              <span className="text-sm font-medium text-gray-900">{invoice.products.length} item(s)</span>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> {invoice.products.reduce((sum, p) => sum + p.quantity, 0)} unit(s) will be returned to inventory.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
