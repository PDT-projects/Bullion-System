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

const cancelBtn: React.CSSProperties = {
  padding: '10px 18px', borderRadius: 8, border: 'none',
  backgroundColor: '#f3f4f6', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer',
};

const deleteBtn: React.CSSProperties = {
  padding: '10px 18px', borderRadius: 8, border: 'none',
  backgroundColor: '#dc2626', color: '#ffffff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
};

export function InvoiceDeleteView({ invoice, handleDelete, handleCancel, formatCurrency, formatDate }: Props) {
  if (!invoice) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-4" style={{ color: '#dc2626' }}>
            <AlertTriangle size={24} />
            <h3 className="text-lg font-semibold">Invoice Not Found</h3>
          </div>
          <p className="text-gray-600 mb-6">The invoice you are trying to delete could not be found.</p>
          <div className="flex justify-end">
            <button onClick={handleCancel} style={cancelBtn}>Go Back</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3" style={{ color: '#dc2626' }}>
            <AlertTriangle size={24} />
            <h3 className="text-lg font-semibold">Delete Invoice</h3>
          </div>
          <button onClick={handleCancel} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-gray-600">
            Are you sure you want to delete this invoice? It will be moved to Deleted Invoices — it cannot be undone or deleted again — and its products will be returned to inventory.
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
          <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: 12 }}>
            <p style={{ fontSize: 13, color: '#92400e' }}>
              <strong>Note:</strong> {invoice.products.reduce((s, p) => s + p.quantity, 0)} unit(s) will be returned to inventory.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={handleCancel} style={cancelBtn}>Cancel</button>
          <button onClick={handleDelete} style={deleteBtn}>Delete Invoice</button>
        </div>
      </div>
    </div>
  );
}