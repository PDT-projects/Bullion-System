// Invoice Module - Delete View

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Invoice } from '../models/types';

interface Props {
  invoice: Invoice | null;
  handleDelete: () => void;
  handleCancel: () => void;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

export function InvoiceDeleteView({ invoice, handleDelete, handleCancel, formatCurrency, formatDate }: Props) {
  if (!invoice) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertTriangle size={24} />
            <h3 className="text-lg font-semibold">Invoice Not Found</h3>
          </div>
          <p className="text-gray-600 mb-6">The invoice you are trying to delete could not be found.</p>
          <div className="flex justify-end">
            <button onClick={handleCancel} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 text-red-600">
            <AlertTriangle size={24} />
            <h3 className="text-lg font-semibold">Delete Invoice</h3>
          </div>
          <button onClick={handleCancel} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-gray-600">
            Are you sure you want to delete this invoice? This cannot be undone and products will be returned to inventory.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            {[
              ['Invoice Number', invoice.invoiceNumber],
              ['Date',           formatDate(invoice.date)],
              ['Customer',       invoice.customerName],
              ['Amount',         formatCurrency(invoice.totalAmount)],
              ['Products',       `${invoice.products.length} item(s)`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-600">{label}:</span>
                <span className="font-medium text-gray-900">{value}</span>
              </div>
            ))}
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> {invoice.products.reduce((s, p) => s + p.quantity, 0)} unit(s) will be returned to inventory.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={handleCancel} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
            Delete Invoice
          </button>
        </div>
      </div>
    </div>
  );
}