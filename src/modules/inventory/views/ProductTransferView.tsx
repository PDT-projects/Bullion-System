// Inventory Module - View Layer
// ProductTransferView - Shows all transfers with status and Mark Received action
//
// Status flow: In Transit → Mark Received → serials added to destination product

import React from 'react';
import {
  Plus, Eye, Trash2, X, Package, CheckCircle2,
  Clock, ArrowRight, MapPin, Hash, Truck,
} from 'lucide-react';
import { ProductTransfer } from '../models/types';

interface ProductTransferViewProps {
  transfers: ProductTransfer[];
  viewTransfer: ProductTransfer | null;
  isLoading: boolean;
  stats: {
    totalTransfers: number;
    pendingTransfers: number;
    inTransitTransfers: number;
    receivedTransfers: number;
  };
  onAdd: () => void;
  onView: (transfer: ProductTransfer) => void;
  onMarkReceived: (transfer: ProductTransfer) => void;
  onDelete: (id: string) => void;
  onCloseView: () => void;
  formatDate: (date: string) => string;
}

export const ProductTransferView: React.FC<ProductTransferViewProps> = ({
  transfers, viewTransfer, isLoading, stats,
  onAdd, onView, onMarkReceived, onDelete, onCloseView, formatDate,
}) => {
  const statusBadge = (status: string) => {
    const base = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold';
    if (status === 'Received' || status === 'Completed')
      return `${base} bg-green-100 text-green-700`;
    if (status === 'In Transit')
      return `${base} bg-blue-100 text-blue-700`;
    if (status === 'Pending')
      return `${base} bg-amber-100 text-amber-700`;
    return `${base} bg-gray-100 text-gray-600`;
  };

  const statusIcon = (status: string) => {
    if (status === 'Received' || status === 'Completed') return <CheckCircle2 size={13} />;
    if (status === 'In Transit') return <Truck size={13} />;
    return <Clock size={13} />;
  };

  return (
    <div className="h-full overflow-y-auto p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Product Transfers</h2>
          <p className="text-sm text-gray-500 mt-1">
            Move products between locations — serials removed from source, added to destination on receipt
          </p>
        </div>

        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2.5
bg-indigo-600 text-black
                     rounded-lg font-semibold
                     hover:bg-indigo-700 active:bg-indigo-800
                     transition-colors shadow-sm"
        >
          <Plus size={18} /> New Transfer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total',      value: stats.totalTransfers,     color: 'bg-gray-50 border-gray-200',    text: 'text-gray-800' },
          { label: 'Pending',    value: stats.pendingTransfers,   color: 'bg-amber-50 border-amber-200',  text: 'text-amber-700' },
          { label: 'In Transit', value: stats.inTransitTransfers, color: 'bg-blue-50 border-blue-200',    text: 'text-blue-700' },
          { label: 'Received',   value: stats.receivedTransfers,  color: 'bg-green-50 border-green-200',  text: 'text-green-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.text}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Clock className="w-6 h-6 animate-spin mr-2" /> Loading transfers...
          </div>
        ) : transfers.length === 0 ? (
          <div className="text-center py-16">
            <Truck className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No transfers yet</p>
            <p className="text-gray-400 text-sm mt-1">Click "New Transfer" to move products between locations</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Date', 'Product', 'Route', 'Qty', 'Serials', 'By', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {transfers.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">

                    {/* Date */}
                    <td className="px-5 py-4 text-sm text-gray-700 whitespace-nowrap">
                      {formatDate(t.date || t.transferDate || '')}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span className="text-sm font-medium text-gray-900">{t.productName}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          {t.fromLocation}
                        </span>
                        <ArrowRight size={13} className="text-gray-400" />
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          {t.toLocation}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                      {t.quantity}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {(t.serialNumbers || []).slice(0, 2).map(s => (
                          <span key={s} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-mono">
                            {s}
                          </span>
                        ))}
                        {(t.serialNumbers || []).length > 2 && (
                          <span className="text-xs text-gray-400">+{t.serialNumbers.length - 2}</span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {t.transferredBy || '—'}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={statusBadge(t.status)}>
                        {statusIcon(t.status)}
                        {t.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button onClick={() => onView(t)}
                          className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors">
                          <Eye size={16} />
                        </button>

                        {(t.status === 'Pending' || t.status === 'In Transit') && (
                          <button onClick={() => onMarkReceived(t)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors font-semibold">
                            <CheckCircle2 size={13} /> Receive
                          </button>
                        )}

                        <button onClick={() => onDelete(t.id)}
                          className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal untouched */}
      {viewTransfer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal content unchanged */}
          </div>
        </div>
      )}
    </div>
  );
};