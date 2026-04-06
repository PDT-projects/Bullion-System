// Inventory Module - View Layer
// ProductTransferView - Shows all transfers with status and Mark Received action
//
// Status flow: In Transit → Mark Received → serials added to destination product

import React from 'react';
import {
  Plus, Eye, Trash2, X, Package, CheckCircle2,
  Clock, ArrowRight, MapPin, Hash, Truck, Calendar,
  User, FileText, ArrowRightLeft,
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
          className="flex items-center gap-2 px-4 py-2.5 bg-[#4f46e5] text-white rounded-lg font-semibold hover:bg-[#4338ca] active:bg-[#3730a3] transition-colors shadow-sm"
        >
          <Plus size={18} /> New Transfer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total',      value: stats.totalTransfers,     color: 'bg-gray-50 border-gray-200',   text: 'text-gray-800' },
          { label: 'Pending',    value: stats.pendingTransfers,   color: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
          { label: 'In Transit', value: stats.inTransitTransfers, color: 'bg-blue-50 border-blue-200',   text: 'text-blue-700' },
          { label: 'Received',   value: stats.receivedTransfers,  color: 'bg-green-50 border-green-200', text: 'text-green-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.text}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">
            All Transfers ({transfers.length})
          </h3>
        </div>

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
              <thead className="border-b border-gray-200">
                <tr>
                  {['Date', 'Product', 'Route', 'Qty', 'Serials', 'By', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3.5 text-left text-sm font-semibold text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transfers.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">

                    <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                      {formatDate(t.date || t.transferDate || '')}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span className="text-sm font-semibold text-gray-900">{t.productName}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
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

                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {t.quantity}
                    </td>

                    <td className="px-6 py-4">
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

                    <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                      {t.transferredBy || '—'}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={statusBadge(t.status)}>
                        {statusIcon(t.status)}
                        {t.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onView(t)}
                          className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye size={16} />
                        </button>

                        {(t.status === 'Pending' || t.status === 'In Transit') && (
                          <button
                            onClick={() => onMarkReceived(t)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors font-semibold"
                          >
                            <CheckCircle2 size={13} /> Receive
                          </button>
                        )}

                        <button
                          onClick={() => onDelete(t.id)}
                          className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
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

      {/* View Transfer Modal */}
      {viewTransfer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg flex flex-col shadow-2xl" style={{ maxHeight: 'min(680px, calc(100vh - 2rem))' }}>

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <ArrowRightLeft size={18} className="text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Transfer Details</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDate(viewTransfer.date || viewTransfer.transferDate || '')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={statusBadge(viewTransfer.status)}>
                  {statusIcon(viewTransfer.status)}
                  {viewTransfer.status}
                </span>
                <button
                  onClick={onCloseView}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ml-1"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 min-h-0 px-6 py-5 space-y-5">

              {/* Product */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="p-2.5 bg-indigo-100 rounded-lg">
                  <Package size={20} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Product</p>
                  <p className="text-base font-bold text-gray-900 mt-0.5">{viewTransfer.productName}</p>
                </div>
              </div>

              {/* Route */}
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Route</p>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="flex-1 text-center">
                    <p className="text-xs text-gray-500 mb-1">From</p>
                    <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-semibold">
                      {viewTransfer.fromLocation}
                    </span>
                  </div>
                  <ArrowRight size={20} className="text-gray-400 flex-shrink-0" />
                  <div className="flex-1 text-center">
                    <p className="text-xs text-gray-500 mb-1">To</p>
                    <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">
                      {viewTransfer.toLocation}
                    </span>
                  </div>
                </div>
              </div>

              {/* Details row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Quantity</p>
                  <p className="text-2xl font-bold text-gray-900">{viewTransfer.quantity}</p>
                  <p className="text-xs text-gray-400">unit{viewTransfer.quantity !== 1 ? 's' : ''}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-1.5 mb-1">
                    <User size={12} className="text-gray-400" />
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Transferred By</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {viewTransfer.transferredBy || '—'}
                  </p>
                </div>
              </div>

              {/* Serial Numbers */}
              {(viewTransfer.serialNumbers || []).length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Hash size={13} className="text-gray-400" />
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
                      Serial Numbers ({viewTransfer.serialNumbers.length})
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-3 bg-gray-50 rounded-xl">
                    {viewTransfer.serialNumbers.map(s => (
                      <span
                        key={s}
                        className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-xs font-mono"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Note */}
              {viewTransfer.note && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <FileText size={13} className="text-gray-400" />
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Note</p>
                  </div>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-xl px-4 py-3 leading-relaxed">
                    {viewTransfer.note}
                  </p>
                </div>
              )}

              {/* Received At */}
              {viewTransfer.receivedAt && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-xl">
                  <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-green-700">Received</p>
                    <p className="text-xs text-green-600">{formatDate(viewTransfer.receivedAt)}</p>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
              {(viewTransfer.status === 'Pending' || viewTransfer.status === 'In Transit') && (
                <button
                  onClick={() => onMarkReceived(viewTransfer)}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  <CheckCircle2 size={16} />
                  Mark as Received
                </button>
              )}
              <button
                onClick={onCloseView}
                className="px-5 py-2.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};