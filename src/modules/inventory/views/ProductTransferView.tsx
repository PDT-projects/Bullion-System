// Inventory Module - View Layer
// ProductTransferView - Product transfer management (matches original design)

import React from 'react';
import { Plus, Eye, Trash2, X, Package, CheckCircle2, Clock } from 'lucide-react';
import { ProductTransfer } from '../models/types';

interface ProductTransferViewProps {
  transfers: ProductTransfer[];
  products: any[];
  viewTransfer: ProductTransfer | null;
  onAdd: () => void;
  onView: (transfer: ProductTransfer) => void;
  onMarkReceived: (transfer: ProductTransfer) => void;
  onDelete: (id: string) => void;
  onCloseView: () => void;
  onPreviewPdf: (transfer: ProductTransfer) => void;
  onDownloadPdf: (transfer: ProductTransfer) => void;
  formatDate: (date: string) => string;
}

export const ProductTransferView: React.FC<ProductTransferViewProps> = ({
  transfers,
  viewTransfer,
  onAdd,
  onView,
  onMarkReceived,
  onDelete,
  onCloseView,
  onPreviewPdf,
  onDownloadPdf,
  formatDate,
}) => {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Product Transfer</h2>
          <p className="text-sm text-gray-600 mt-1">Transfer products between locations</p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 bg-[#4f46e5] text-white px-4 py-2 rounded-lg hover:bg-[#4338ca] transition-colors"
        >
          <Plus size={20} />
          New Transfer
        </button>
      </div>

      {/* Transfers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transferred By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transfers.map((transfer) => (
                <tr key={transfer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(transfer.date || transfer.transferDate || '')}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-900">{transfer.productName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                      {transfer.fromLocation}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                      {transfer.toLocation}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transfer.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{transfer.transferredBy || '-'}</td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        transfer.status === 'Received'
                          ? 'bg-green-100 text-green-700'
                          : transfer.status === 'Pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : transfer.status === 'In Transit'
                          ? 'bg-blue-100 text-blue-700'
                          : transfer.status === 'Completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {transfer.status === 'Received' ? (
                        <CheckCircle2 size={14} />
                      ) : transfer.status === 'Pending' ? (
                        <Clock size={14} />
                      ) : transfer.status === 'In Transit' ? (
                        <Clock size={14} />
                      ) : transfer.status === 'Completed' ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <X size={14} />
                      )}
                      {transfer.status === 'Received' ? 'Received' : transfer.status}
                    </span>

                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onView(transfer)}
                        className="p-2 text-[#4f46e5] hover:bg-[#4f46e5]/10 rounded-lg transition-colors"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                      {(transfer.status === 'Pending' || transfer.status === 'In Transit') && (

                        <button
                          onClick={() => onMarkReceived(transfer)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Mark as Received"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(transfer.id)}
                        className="p-2 text-[#ef4444] hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {transfers.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">

                    No transfers found. Click "New Transfer" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Transfer Modal */}
      {viewTransfer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Transfer Details</h3>
              <button onClick={onCloseView} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium text-gray-900">{formatDate(viewTransfer.date || viewTransfer.transferDate || '')}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Product</p>
                  <p className="font-medium text-gray-900">{viewTransfer.productName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">From Location</p>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                    {viewTransfer.fromLocation}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">To Location</p>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    {viewTransfer.toLocation}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Quantity</p>
                  <p className="font-medium text-gray-900">{viewTransfer.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Transferred By</p>
                  <p className="font-medium text-gray-900">{viewTransfer.transferredBy || '-'}</p>
                </div>

              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-2">Serial Numbers</p>
                <div className="flex flex-wrap gap-2">
                  {viewTransfer.serialNumbers.map((serial, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-[#4f46e5]/10 text-[#4f46e5] rounded-lg text-sm font-mono">
                      <Package size={14} />
                      {serial}
                    </span>
                  ))}
                </div>
              </div>

              {(viewTransfer.receiptDataUrl || viewTransfer.receiptName) && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2">Receipt</p>
                  <div className="flex items-center gap-3">
                    {viewTransfer.receiptDataUrl && (
                      <a
                        href={viewTransfer.receiptDataUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-[#4f46e5] hover:underline"
                      >
                        View
                      </a>
                    )}
                    {viewTransfer.receiptDataUrl && (
                      <a
                        href={viewTransfer.receiptDataUrl}
                        download={viewTransfer.receiptName || `transfer-${viewTransfer.id}-receipt`}
                        className="text-sm text-green-700 hover:underline"
                      >
                        Download
                      </a>
                    )}
                    {viewTransfer.receiptName && (
                      <span className="text-xs text-gray-500">{viewTransfer.receiptName}</span>
                    )}
                  </div>
                </div>
              )}

              {(viewTransfer.note || viewTransfer.notes) && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-1">Note</p>
                  <p className="font-medium text-gray-900">{viewTransfer.note || viewTransfer.notes}</p>
                </div>
              )}


              <div className="border-t pt-4 flex gap-3">
                <button
                  onClick={() => onPreviewPdf(viewTransfer)}
                  className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
                >
                  Preview PDF
                </button>
                <button
                  onClick={() => onDownloadPdf(viewTransfer)}
                  className="px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca]"
                >
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
