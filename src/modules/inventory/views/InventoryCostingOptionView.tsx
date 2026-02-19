// Inventory Module - View Layer
// InventoryCostingOptionView - Step 1: Choose costing option

import React from 'react';
import { Calculator, Package, ArrowLeft } from 'lucide-react';
import { UseInventoryCostingOptionViewModelReturn } from '../viewModels/useInventoryCostingOptionViewModel';

interface InventoryCostingOptionViewProps extends UseInventoryCostingOptionViewModelReturn {}

export const InventoryCostingOptionView: React.FC<InventoryCostingOptionViewProps> = ({
  selectedOption,
  selectOption,
  handleContinue,
  handleBack,
  canContinue,
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
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight mb-2">
                Add New Inventory
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Create a new product entry with optional costing information
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
            <div className="flex-1 h-1 mx-4 rounded-full bg-gradient-to-r from-green-500 to-blue-500"></div>

            {/* Step 2 - Active */}
            <div className="flex flex-col items-center text-blue-700">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mb-2 shadow-lg border-2 border-white bg-gradient-to-r from-blue-500 to-blue-600 text-white ring-2 ring-blue-300">
                2
              </div>
              <span className="text-sm font-medium text-center leading-tight text-blue-600">Costing Option</span>
            </div>

            {/* Connector 2-3 */}
            <div className="flex-1 h-1 mx-4 rounded-full bg-gray-300"></div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-gray-700">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-2 shadow-lg border-2 border-white bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800">
                3
              </div>
              <span className="text-sm font-medium text-center leading-tight text-gray-500">Product Details</span>
            </div>

            {/* Connector 3-4 */}
            <div className="flex-1 h-1 mx-4 rounded-full bg-gray-300"></div>

            {/* Step 4 */}
            <div className="flex flex-col items-center text-gray-700">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-2 shadow-lg border-2 border-white bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800">
                4
              </div>
              <span className="text-sm font-medium text-center leading-tight text-gray-500">Payment</span>
            </div>
          </div>
        </div>

        {/* Costing Option Cards */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Do you want to include costing information?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* With Costing Card */}
            <button
              onClick={() => selectOption('with')}
              className={`p-6 border-2 rounded-lg transition-colors text-left ${
                selectedOption === 'with'
                  ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                  : 'border-gray-200 hover:border-purple-500 hover:bg-purple-50'
              }`}
            >
              <div className="flex items-center mb-3">
                <Calculator className="w-8 h-8 text-purple-600 mr-3" />
                <h4 className="text-lg font-medium text-gray-900">With Costing</h4>
              </div>
              <p className="text-gray-600">Include detailed cost breakdown, expenses, and payment tracking</p>
            </button>

            {/* Without Costing Card */}
            <button
              onClick={() => selectOption('without')}
              className={`p-6 border-2 rounded-lg transition-colors text-left ${
                selectedOption === 'without'
                  ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                  : 'border-gray-200 hover:border-orange-500 hover:bg-orange-50'
              }`}
            >
              <div className="flex items-center mb-3">
                <Package className="w-8 h-8 text-orange-600 mr-3" />
                <h4 className="text-lg font-medium text-gray-900">Without Costing</h4>
              </div>
              <p className="text-gray-600">Simple inventory entry without cost details</p>
            </button>
          </div>

          {/* Continue Button */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleContinue}
              disabled={!canContinue}
              className={`px-8 py-4 rounded-lg font-medium text-lg shadow-lg flex items-center gap-2 transition-colors ${
                canContinue
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Continue
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
