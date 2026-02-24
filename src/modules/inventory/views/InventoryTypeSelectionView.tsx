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
                Select the inventory entry type to proceed
              </p>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {/* Step 1 - Active */}
            <div className="flex flex-col items-center text-blue-700">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mb-2 shadow-lg border-2 border-white bg-gradient-to-r from-blue-500 to-blue-600 text-white ring-2 ring-blue-300">
                1
              </div>
              <span className="text-sm font-medium text-center leading-tight text-blue-600">Inventory Type</span>
            </div>

            {/* Connector 1-2 */}
            <div className="flex-1 h-1 mx-4 rounded-full bg-gray-300"></div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-gray-700">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-2 shadow-lg border-2 border-white bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800">
                2
              </div>
              <span className="text-sm font-medium text-center leading-tight text-gray-500">Costing Option</span>
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

        {/* Inventory Type Selection Cards */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">What type of inventory are you adding?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* In-Stock / Received Card */}
            <button
              onClick={() => selectTypeAndContinue('in-stock')}
              className={`p-6 border-2 rounded-lg transition-colors text-left ${
                selectedType === 'in-stock'
                  ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                  : 'border-gray-200 hover:border-green-500 hover:bg-green-50'
              }`}
            >
              <div className="flex items-center mb-3">
                <Package className="w-8 h-8 text-green-600 mr-3" />
                <h4 className="text-lg font-medium text-gray-900">In-Stock / Received</h4>
              </div>
              <p className="text-gray-600">Products that are already in your warehouse or have been physically received</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Available Now
                </span>
              </div>
            </button>

            {/* On-Order / Pending Card */}
            <button
              onClick={() => selectTypeAndContinue('on-order')}
              className={`p-6 border-2 rounded-lg transition-colors text-left ${
                selectedType === 'on-order'
                  ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                  : 'border-gray-200 hover:border-orange-500 hover:bg-orange-50'
              }`}
            >
              <div className="flex items-center mb-3">
                <Truck className="w-8 h-8 text-orange-600 mr-3" />
                <h4 className="text-lg font-medium text-gray-900">On-Order / Pending</h4>
              </div>
              <p className="text-gray-600">Products that have been ordered but not yet received or are in transit</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Expected Soon
                </span>
              </div>
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
