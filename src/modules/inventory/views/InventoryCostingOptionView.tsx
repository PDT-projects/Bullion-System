// Inventory Module - View Layer
// InventoryCostingOptionView - Step 2: Choose costing option

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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="inventory-entry-container max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={handleBack} className="p-2 text-gray-500 hover:bg-white hover:text-gray-700 rounded-lg transition-all border border-transparent hover:border-gray-200 hover:shadow-sm">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 rounded-lg shadow-sm border border-indigo-200">
              <Package className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Add New Inventory</h2>
              <p className="text-sm text-gray-500">Create a new product entry with optional costing information</p>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-5 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {/* Step 1 — Done */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold mb-1.5 shadow-sm bg-green-500 text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <span className="text-xs font-medium text-green-600">Inventory Type</span>
            </div>
            <div className="flex-1 h-0.5 mx-3 rounded-full bg-green-400" />
            {/* Step 2 — Active */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-1.5 bg-indigo-600 text-white ring-4 ring-indigo-100">2</div>
              <span className="text-xs font-semibold text-indigo-600">Costing Option</span>
            </div>
            <div className="flex-1 h-0.5 mx-3 rounded-full bg-gray-300" />
            {/* Step 3 — Inactive */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-1.5 bg-white text-gray-500 border-2 border-gray-300">3</div>
              <span className="text-xs font-medium text-gray-500">Product Details</span>
            </div>
            <div className="flex-1 h-0.5 mx-3 rounded-full bg-gray-300" />
            {/* Step 4 — Inactive */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-1.5 bg-white text-gray-500 border-2 border-gray-300">4</div>
              <span className="text-xs font-medium text-gray-500">Payment</span>
            </div>
          </div>
        </div>

        {/* Costing Option Cards */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">Do you want to include costing information?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={() => selectOption('with')}
              className={`p-5 border-2 rounded-xl transition-all duration-200 text-left ${selectedOption === 'with' ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100' : 'border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/50'}`}>
              <div className="flex items-center mb-2.5">
                <div className={`p-2 rounded-lg mr-3 ${selectedOption === 'with' ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                  <Calculator className="w-5 h-5 text-indigo-600" />
                </div>
                <h4 className="text-base font-semibold text-gray-900">With Costing</h4>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">Include detailed cost breakdown, expenses, and payment tracking</p>
            </button>
            <button onClick={() => selectOption('without')}
              className={`p-5 border-2 rounded-xl transition-all duration-200 text-left ${selectedOption === 'without' ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-100' : 'border-gray-200 hover:border-orange-400 hover:bg-orange-50/50'}`}>
              <div className="flex items-center mb-2.5">
                <div className={`p-2 rounded-lg mr-3 ${selectedOption === 'without' ? 'bg-orange-100' : 'bg-gray-100'}`}>
                  <Package className="w-5 h-5 text-orange-600" />
                </div>
                <h4 className="text-base font-semibold text-gray-900">Without Costing</h4>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">Simple inventory entry without cost details</p>
            </button>
          </div>
          <div className="mt-6 flex justify-end">
            <button onClick={handleContinue} disabled={!canContinue}
              className={`px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors ${canContinue ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
              Continue
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};