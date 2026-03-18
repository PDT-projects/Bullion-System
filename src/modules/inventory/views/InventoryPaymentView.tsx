// Inventory Module - View Layer
// InventoryPaymentView - Step 5: Payment information
// Change: shows Location in the Product Summary panel

import React from 'react';
import {
  CreditCard, CheckCircle, X, AlertCircle, ArrowLeft, Save,
  Edit2, Check, Loader2, MapPin,
} from 'lucide-react';
import { UseInventoryPaymentViewModelReturn } from '../viewModels/useInventoryPaymentViewModel';

interface InventoryPaymentViewProps extends UseInventoryPaymentViewModelReturn {}

export const InventoryPaymentView: React.FC<InventoryPaymentViewProps> = ({
  costingOption, inventoryType, totalAmount,
  paymentStatus, transactionId, isGeneratingId, isEditingTransactionId,
  paidAmount, remainingAmount, validationErrors, isValid, isSaving,
  setPaymentStatus, setTransactionId, setIsEditingTransactionId,
  setPaidAmount, handleSubmit, handleBack, formatCurrency, productSummary,
}) => {
  const CheckIconSVG = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="inventory-entry-container max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={handleBack} className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 shadow-md border">
            <ArrowLeft size={20} /><span className="font-medium">Back</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight mb-2">
                Payment Information
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">Complete payment details to finalize inventory creation</p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {[{ label: 'Inventory Type' }, { label: 'Costing Option' }, { label: 'Product Details' }].map((s, i) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center text-green-700">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mb-2 shadow-lg border-2 border-white bg-green-600 text-white"><CheckIconSVG /></div>
                  <span className="text-sm font-medium text-center leading-tight text-green-600">{s.label}</span>
                </div>
                <div className="flex-1 h-1 mx-4 rounded-full bg-gradient-to-r from-green-500 to-green-600" />
              </React.Fragment>
            ))}
            <div className="flex flex-col items-center text-blue-700">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mb-2 shadow-lg border-2 border-white bg-gradient-to-r from-blue-500 to-blue-600 text-white ring-2 ring-blue-300">4</div>
              <span className="text-sm font-medium text-center leading-tight text-blue-600">Payment</span>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-6">

          {/* Transaction ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Transaction ID</label>
            {isGeneratingId ? (
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                <span className="text-sm text-gray-500">Generating transaction ID...</span>
              </div>
            ) : isEditingTransactionId ? (
              <div className="flex items-center gap-2">
                <input type="text" value={transactionId}
                  onChange={e => setTransactionId(e.target.value.toUpperCase())}
                  autoFocus
                  className={`flex-1 px-4 py-3 border rounded-lg font-mono text-sm focus:outline-none focus:ring-2 ${
                    validationErrors.transactionId ? 'border-red-400 focus:ring-red-200' : 'border-indigo-400 focus:ring-indigo-200'
                  }`}
                  placeholder="e.g. INV-150326-001" />
                <button type="button" onClick={() => setIsEditingTransactionId(false)}
                  className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700"><Check size={18} /></button>
                <button type="button" onClick={() => setIsEditingTransactionId(false)}
                  className="p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"><X size={18} /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <span className="font-mono text-sm font-semibold text-indigo-800 tracking-widest">{transactionId}</span>
                  <span className="text-xs text-indigo-400 ml-auto">auto-generated</span>
                </div>
                <button type="button" onClick={() => setIsEditingTransactionId(true)}
                  className="p-3 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-indigo-400 hover:text-indigo-600"><Edit2 size={18} /></button>
              </div>
            )}
            {validationErrors.transactionId && <p className="text-red-500 text-xs mt-1">{validationErrors.transactionId}</p>}
            <p className="text-xs text-gray-500 mt-1">Auto-generated in format INV-DDMMYY-NNN. Click the pencil icon to customise.</p>
          </div>

          {/* Payment Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Payment Status *</label>
            <div className="grid grid-cols-3 gap-4">
              {([
                { value: 'paid',    icon: CheckCircle, label: 'Paid',    desc: 'Full payment received', activeColor: 'border-green-600 text-green-600' },
                { value: 'unpaid',  icon: X,           label: 'Unpaid',  desc: 'No payment yet',        activeColor: 'border-red-600 text-red-600' },
                { value: 'partial', icon: AlertCircle, label: 'Partial', desc: 'Partial payment',        activeColor: 'border-yellow-600 text-yellow-600' },
              ] as const).map(({ value, icon: Icon, label, desc, activeColor }) => (
                <button key={value} onClick={() => setPaymentStatus(value)}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    paymentStatus === value ? `${activeColor} bg-white` : 'border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                  }`}>
                  <div className="flex items-center justify-center mb-2"><Icon className="w-6 h-6" /></div>
                  <div className="text-center">
                    <div className="font-medium">{label}</div>
                    <div className="text-xs text-gray-600">{desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {paymentStatus === 'partial' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paid Amount *</label>
              <input type="number" min="0" step="0.01" value={paidAmount || ''}
                onChange={e => setPaidAmount(Number(e.target.value))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 ${
                  validationErrors.paidAmount ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`} placeholder="0.00" />
              {validationErrors.paidAmount && <p className="text-red-500 text-xs mt-1">{validationErrors.paidAmount}</p>}
            </div>
          )}

          {/* Payment Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Payment Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-sm text-gray-600">Total Amount:</span><span className="text-sm font-medium">{formatCurrency(totalAmount)}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-600">Paid Amount:</span><span className="text-sm font-medium">{formatCurrency(paidAmount || 0)}</span></div>
              <div className="flex justify-between border-t pt-2"><span className="text-sm font-medium">Remaining Amount:</span><span className="text-sm font-medium text-red-600">{formatCurrency(remainingAmount)}</span></div>
            </div>
          </div>

          {/* Product Summary — includes location */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-3">Product Summary</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Brand',    productSummary.brandName],
                ['Model',    productSummary.modelName],
                ['Category', productSummary.category],
                ['Stock',    `${productSummary.stock} units`],
                ['Sell Price', formatCurrency(productSummary.sellPrice)],
                ['Status',   productSummary.status],
                ['Costing',  costingOption === 'with' ? 'With Costing' : 'Without Costing'],
                ['Type',     inventoryType === 'in-stock' ? 'In-Stock / Received' : 'On-Order / Pending'],
              ].map(([l, v]) => (
                <div key={l}><span className="text-blue-700">{l}:</span><span className="ml-2 font-medium text-blue-900">{v}</span></div>
              ))}
              {/* Location prominently */}
              <div className="col-span-2 flex items-center gap-2 mt-1 pt-2 border-t border-blue-200">
                <MapPin className="w-4 h-4 text-indigo-500" />
                <span className="text-blue-700 font-medium">Stocking Location:</span>
                <span className="font-bold text-indigo-700 text-base">{productSummary.location || '—'}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button onClick={handleBack} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">← Back</button>
            <button onClick={handleSubmit} disabled={!isValid || isSaving}
              className={`px-8 py-4 rounded-lg font-medium text-lg shadow-lg flex items-center gap-2 ${
                isValid && !isSaving ? 'bg-[#4f46e5] text-white hover:bg-[#4338ca]' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}>
              {isSaving ? <><Loader2 size={20} className="animate-spin" />Saving...</> : <><Save size={20} />Submit Inventory</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};