// Inventory Module - View Layer
// InventoryPaymentView - Step 3: Payment information

import React from 'react';
import { CreditCard, CheckCircle, X, AlertCircle, ArrowLeft, Save } from 'lucide-react';
import { UseInventoryPaymentViewModelReturn } from '../viewModels/useInventoryPaymentViewModel';

interface InventoryPaymentViewProps extends UseInventoryPaymentViewModelReturn {}

export const InventoryPaymentView: React.FC<InventoryPaymentViewProps> = ({
  costingOption,
  inventoryType,
  totalAmount,

  paymentStatus,
  transactionId,
  paidAmount,
  remainingAmount,
  validationErrors,
  isValid,
  setPaymentStatus,
  setTransactionId,
  setPaidAmount,
  handleSubmit,
  handleBack,
  formatCurrency,
  productSummary,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="inventory-entry-container max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-md hover:shadow-lg border border-gray-200"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight mb-2">
                Payment Information
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Complete payment details to finalize inventory creation
              </p>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {/* Step 1 - Completed */}
            <div className="flex flex-col items-center text-green-700">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mb-2 shadow-lg border-2 border-white bg-green-600 text-white">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm font-medium text-center leading-tight text-green-600">Inventory Type</span>
            </div>

            {/* Connector 1-2 */}
            <div className="flex-1 h-1 mx-4 rounded-full bg-gradient-to-r from-green-500 to-green-600"></div>

            {/* Step 2 - Completed */}
            <div className="flex flex-col items-center text-green-700">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mb-2 shadow-lg border-2 border-white bg-green-600 text-white">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm font-medium text-center leading-tight text-green-600">Costing Option</span>
            </div>

            {/* Connector 2-3 */}
            <div className="flex-1 h-1 mx-4 rounded-full bg-gradient-to-r from-green-500 to-green-600"></div>

            {/* Step 3 - Completed */}
            <div className="flex flex-col items-center text-green-700">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mb-2 shadow-lg border-2 border-white bg-green-600 text-white">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm font-medium text-center leading-tight text-green-600">Product Details</span>
            </div>

            {/* Connector 3-4 */}
            <div className="flex-1 h-1 mx-4 rounded-full bg-gradient-to-r from-green-500 to-blue-500"></div>

            {/* Step 4 - Active */}
            <div className="flex flex-col items-center text-blue-700">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mb-2 shadow-lg border-2 border-white bg-gradient-to-r from-blue-500 to-blue-600 text-white ring-2 ring-blue-300">
                4
              </div>
              <span className="text-sm font-medium text-center leading-tight text-blue-600">Payment</span>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="space-y-6">
            {/* Payment Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Payment Status *</label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setPaymentStatus('paid')}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    paymentStatus === 'paid'
                      ? 'border-green-600 bg-white text-green-600'
                      : 'border-gray-200 text-gray-700 hover:border-green-500 hover:bg-green-50'
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium">Paid</div>
                    <div className="text-xs text-gray-600">Full payment received</div>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentStatus('unpaid')}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    paymentStatus === 'unpaid'
                      ? 'border-red-600 bg-white text-red-600'
                      : 'border-gray-200 text-gray-700 hover:border-red-500 hover:bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    <X className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium">Unpaid</div>
                    <div className="text-xs text-gray-600">No payment yet</div>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentStatus('partial')}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    paymentStatus === 'partial'
                      ? 'border-yellow-600 bg-white text-yellow-600'
                      : 'border-gray-200 text-gray-700 hover:border-yellow-500 hover:bg-yellow-50'
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium">Partial</div>
                    <div className="text-xs text-gray-600">Partial payment</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Transaction ID (for Paid and Partial) */}
            {(paymentStatus === 'paid' || paymentStatus === 'partial') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID *</label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    validationErrors.transactionId
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Enter transaction ID"
                />
                {validationErrors.transactionId && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.transactionId}</p>
                )}
              </div>
            )}

            {/* Paid Amount (for Partial) */}
            {paymentStatus === 'partial' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paid Amount *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paidAmount || ''}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    validationErrors.paidAmount
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="0.00"
                />
                {validationErrors.paidAmount && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.paidAmount}</p>
                )}
              </div>
            )}

            {/* Payment Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Payment Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Amount:</span>
                  <span className="text-sm font-medium">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Paid Amount:</span>
                  <span className="text-sm font-medium">{formatCurrency(paidAmount || 0)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium text-gray-900">Remaining Amount:</span>
                  <span className="text-sm font-medium text-red-600">{formatCurrency(remainingAmount)}</span>
                </div>
              </div>
            </div>

            {/* Product Summary */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-3">Product Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Brand:</span>
                  <span className="ml-2 font-medium text-blue-900">{productSummary.brandName}</span>
                </div>
                <div>
                  <span className="text-blue-700">Model:</span>
                  <span className="ml-2 font-medium text-blue-900">{productSummary.modelName}</span>
                </div>
                <div>
                  <span className="text-blue-700">Category:</span>
                  <span className="ml-2 font-medium text-blue-900">{productSummary.category}</span>
                </div>
                <div>
                  <span className="text-blue-700">Stock:</span>
                  <span className="ml-2 font-medium text-blue-900">{productSummary.stock} units</span>
                </div>
                <div>
                  <span className="text-blue-700">Sell Price:</span>
                  <span className="ml-2 font-medium text-blue-900">{formatCurrency(productSummary.sellPrice)}</span>
                </div>
                <div>
                  <span className="text-blue-700">Status:</span>
                  <span className="ml-2 font-medium text-blue-900">{productSummary.status}</span>
                </div>
                <div>
                  <span className="text-blue-700">Costing:</span>
                  <span className="ml-2 font-medium text-blue-900">
                    {costingOption === 'with' ? 'With Costing' : 'Without Costing'}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">Type:</span>
                  <span className="ml-2 font-medium text-blue-900">
                    {inventoryType === 'in-stock' ? 'In-Stock / Received' : 'On-Order / Pending'}
                  </span>
                </div>
                
                {/* Multi-model costing summary */}
                {costingOption === 'with' && productSummary.modelCount !== undefined && productSummary.modelCount > 0 && (
                  <>
                    <div className="col-span-2 border-t border-blue-200 pt-2 mt-2">
                      <span className="text-blue-700 font-medium">Multi-Model Costing Summary:</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Models:</span>
                      <span className="ml-2 font-medium text-blue-900">{productSummary.modelCount}</span>
                    </div>
                    {productSummary.totalValueOfBrand !== undefined && (
                      <div>
                        <span className="text-blue-700">Total Brand Value:</span>
                        <span className="ml-2 font-bold text-blue-900">{formatCurrency(productSummary.totalValueOfBrand)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>


            {/* Submit Button */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                onClick={handleBack}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isValid}
                className={`px-8 py-4 rounded-lg transition-colors font-medium text-lg shadow-lg flex items-center gap-2 ${
                  isValid
                    ? 'bg-[#4f46e5] text-white hover:bg-[#4338ca]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Save size={20} />
                Submit Inventory
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
