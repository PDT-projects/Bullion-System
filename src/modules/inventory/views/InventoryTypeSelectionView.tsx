// Inventory Module - View Layer
// InventoryTypeSelectionView - Step 1: Choose inventory entry type (In-Stock vs On-Order)

import React from 'react';
import { Package, Truck, ArrowLeft } from 'lucide-react';
import { UseInventoryTypeSelectionViewModelReturn } from '../viewModels/useInventoryTypeSelectionViewModel';

interface InventoryTypeSelectionViewProps extends UseInventoryTypeSelectionViewModelReturn {}

export const InventoryTypeSelectionView: React.FC<InventoryTypeSelectionViewProps> = ({
  selectedType,
  selectType,
  selectTypeAndContinue,
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
              <p className="text-sm text-gray-500">Select the inventory entry type to proceed</p>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-5 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {/* Step 1 — Active */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-1.5 shadow-sm bg-indigo-600 text-white ring-4 ring-indigo-100">1</div>
              <span className="text-xs font-semibold text-indigo-600">Inventory Type</span>
            </div>
            <div className="flex-1 h-0.5 mx-3 rounded-full bg-gray-300" />
            {/* Step 2 — Inactive */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-1.5 bg-white text-gray-500 border-2 border-gray-300">2</div>
              <span className="text-xs font-medium text-gray-500">Costing Option</span>
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

        {/* Selection Cards */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">What type of inventory are you adding?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={() => selectTypeAndContinue('in-stock')}
              className={`p-5 border-2 rounded-xl transition-all duration-200 text-left ${selectedType === 'in-stock' ? 'border-green-500 bg-green-50 ring-2 ring-green-100' : 'border-gray-200 hover:border-green-400 hover:bg-green-50/50'}`}>
              <div className="flex items-center mb-2.5">
                <div className={`p-2 rounded-lg mr-3 ${selectedType === 'in-stock' ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <Package className="w-5 h-5 text-green-600" />
                </div>
                <h4 className="text-base font-semibold text-gray-900">In-Stock / Received</h4>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">Products that are already in your warehouse or have been physically received</p>
              <div className="mt-3"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Available Now</span></div>
            </button>
            <button onClick={() => selectTypeAndContinue('on-order')}
              className={`p-5 border-2 rounded-xl transition-all duration-200 text-left ${selectedType === 'on-order' ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-100' : 'border-gray-200 hover:border-orange-400 hover:bg-orange-50/50'}`}>
              <div className="flex items-center mb-2.5">
                <div className={`p-2 rounded-lg mr-3 ${selectedType === 'on-order' ? 'bg-orange-100' : 'bg-gray-100'}`}>
                  <Truck className="w-5 h-5 text-orange-600" />
                </div>
                <h4 className="text-base font-semibold text-gray-900">On-Order / Pending</h4>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">Products that have been ordered but not yet received or are in transit</p>
              <div className="mt-3"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Expected Soon</span></div>
            </button>
          </div>
          <div className="mt-6 flex justify-end">
            <button onClick={handleContinue} disabled={!canContinue}
              className={`px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm ${canContinue ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'}`}>
              Continue
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};