// Inventory Module - View Layer
// ProductTransferCreateView - UI for creating new product transfers

import React from 'react';
import { X, Package, Maximize2, Minimize2 } from 'lucide-react';
import { Product } from '../models/types';

interface TransferLine {
  productId: string;
  quantity: number;
  selectedSerials: string[];
}

interface ProductTransferCreateViewProps {
  // Data
  products: Product[];
  locations: string[];
  
  // Form State
  formData: {
    date: string;
    fromLocation: string;
    toLocation: string;
    transferredBy: string;
    note: string;
  };
  transferItems: TransferLine[];
  receiptName: string;
  receiptType: string;
  receiptDataUrl: string;
  showSummary: boolean;
  isSubmitting: boolean;
  
  // Validation
  validation: {
    isValid: boolean;
    error?: string;
  };
  
  // UI State
  isFullScreen: boolean;
  
  // Actions
  setFormField: (field: string, value: any) => void;
  addTransferItem: () => void;
  removeTransferItem: (index: number) => void;
  updateTransferItemProduct: (index: number, productId: string) => void;
  updateTransferItemQuantity: (index: number, quantity: number) => void;
  updateTransferItemSerial: (lineIndex: number, serialIndex: number, value: string) => void;
  handleReceiptChange: (file?: File) => void;
  toggleSummary: () => void;
  toggleFullScreen: () => void;
  handleSave: () => void;
  handlePreviewPdf: () => void;
  handleDownloadPdf: () => void;
  onBack: () => void;
  
  // Helpers
  getAvailableSerials: (productId?: string, location?: string) => string[];
  getProductStockByLocation: (productId: string, location: string) => number;
  getProductById: (productId: string) => Product | undefined;
}

export const ProductTransferCreateView: React.FC<ProductTransferCreateViewProps> = ({
  products,
  locations,
  formData,
  transferItems,
  receiptName,
  receiptType,
  receiptDataUrl,
  showSummary,
  isSubmitting,
  validation,
  isFullScreen,
  setFormField,
  addTransferItem,
  removeTransferItem,
  updateTransferItemProduct,
  updateTransferItemQuantity,
  updateTransferItemSerial,
  handleReceiptChange,
  toggleSummary,
  toggleFullScreen,
  handleSave,
  handlePreviewPdf,
  handleDownloadPdf,
  onBack,
  getAvailableSerials,
  getProductStockByLocation,
  getProductById,
}) => {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">New Product Transfer</h2>
          <p className="text-sm text-gray-600 mt-1">Create a new product transfer between locations</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullScreen}
            className="p-2 text-gray-500 hover:text-gray-700"
            title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
          >
            {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          <button
            onClick={onBack}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Form */}
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${isFullScreen ? 'p-6' : 'p-6'}`}>
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormField('date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Location *</label>
            <select
              value={formData.fromLocation}
              onChange={(e) => setFormField('fromLocation', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
            >
              <option value="">Select location</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Location *</label>
            <select
              value={formData.toLocation}
              onChange={(e) => setFormField('toLocation', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
            >
              <option value="">Select location</option>
              {locations.filter(loc => loc !== formData.fromLocation).map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transferred By *</label>
            <input
              type="text"
              value={formData.transferredBy}
              onChange={(e) => setFormField('transferredBy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
              placeholder="e.g., Manager Ahmed"
            />
          </div>
        </div>

        {/* Transfer Items */}
        <div className="border-t pt-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Items to Transfer</label>
          <div className="space-y-3">
            {transferItems.map((line, li) => (
              <div key={li} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-5">
                  <select
                    value={line.productId}
                    onChange={(e) => updateTransferItemProduct(li, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.brandName} {p.modelName} (Stock: {getProductStockByLocation(p.id, formData.fromLocation || '')})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) => updateTransferItemQuantity(li, Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="col-span-4">
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: line.quantity }).map((_, si) => (
                      <select
                        key={si}
                        value={line.selectedSerials[si] || ''}
                        onChange={(e) => updateTransferItemSerial(li, si, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">Select serial</option>
                        {getAvailableSerials(line.productId, formData.fromLocation).map(serial => (
                          <option 
                            key={serial} 
                            value={serial} 
                            disabled={transferItems.some((it, idx) => idx !== li && it.selectedSerials.includes(serial))}
                          >
                            {serial}
                          </option>
                        ))}
                      </select>
                    ))}
                  </div>
                </div>
                <div className="col-span-1 flex gap-2">
                  <button
                    onClick={() => removeTransferItem(li)}
                    className="px-2 py-1 text-sm text-red-600 bg-red-50 rounded"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            <div>
              <button
                onClick={addTransferItem}
                className="px-3 py-2 bg-[#eef2ff] text-[#4f46e5] rounded text-sm"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>

        {/* Receipt Upload */}
        <div className="border-t pt-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Transfer Receipt (Optional)</label>
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/jpg,image/png"
            onChange={(e) => handleReceiptChange(e.target.files?.[0])}
            className="w-full text-sm"
          />
          {receiptDataUrl && (
            <div className="mt-2 flex items-center gap-3">
              {receiptType.startsWith('image/') ? (
                <img src={receiptDataUrl} alt={receiptName} className="w-20 h-20 object-cover rounded" />
              ) : (
                <div className="w-20 h-20 flex items-center justify-center bg-gray-100 rounded text-sm">PDF</div>
              )}
              <div className="text-sm">
                <div className="font-medium">{receiptName}</div>
                <a href={receiptDataUrl} download={receiptName} className="text-green-700 hover:underline">Download</a>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="border-t pt-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
          <textarea
            value={formData.note}
            onChange={(e) => setFormField('note', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] resize-none"
            placeholder="Additional notes about the transfer"
          />
        </div>

        {/* Summary */}
        {showSummary && (
          <div className="border-t pt-4 mb-6">
            <h3 className="text-lg font-medium mb-4">Transfer Summary</h3>
            <p className="text-sm text-gray-600 mb-4">
              From: <span className="font-medium">{formData.fromLocation}</span> — To: <span className="font-medium">{formData.toLocation}</span>
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Product</th>
                    <th className="px-3 py-2 text-left">Qty</th>
                    <th className="px-3 py-2 text-left">Serials</th>
                  </tr>
                </thead>
                <tbody>
                  {transferItems.map((it, idx) => {
                    const p = getProductById(it.productId);
                    return (
                      <tr key={idx} className="border-b">
                        <td className="px-3 py-2">{p ? `${p.brandName} ${p.modelName}` : '—'}</td>
                        <td className="px-3 py-2">{it.quantity}</td>
                        <td className="px-3 py-2">{it.selectedSerials.join(', ')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePreviewPdf}
              className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
            >
              Preview PDF
            </button>
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca]"
            >
              Download PDF
            </button>
          </div>
          <div className="flex items-center gap-3">
            {!showSummary ? (
              <button
                onClick={toggleSummary}
                className="px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca]"
              >
                Review & Create
              </button>
            ) : (
              <>
                <button
                  onClick={toggleSummary}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Edit
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSubmitting || !validation.isValid}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating...' : 'Confirm Transfer'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
