// Inventory Module - View Layer
// InventoryCostingDetailsView - Step 3: Costing Details only (NEW SEPARATED SCREEN)
// Shows only costing fields - inventory details come on next screen

import React from 'react';
import { Package, ArrowLeft, ArrowRight, Calculator } from 'lucide-react';
import { UseInventoryCostingDetailsViewModelReturn } from '../viewModels/useInventoryCostingDetailsViewModel';
import { CostingGlobalInputs } from '../components/CostingGlobalInputs';
import { CostingTable } from '../components/CostingTable';
import { BrandSummary } from '../components/BrandSummary';

interface InventoryCostingDetailsViewProps extends UseInventoryCostingDetailsViewModelReturn {}

export const InventoryCostingDetailsView: React.FC<InventoryCostingDetailsViewProps> = ({
  costingInfo,
  costingOption,
  inventoryType,
  validationErrors,
  isValid,
  setCostingBrandName,
  setUsdRate,
  setTotalCustomsValue,
  setTotalFreightValue,
  addModel,
  updateModelField,
  removeModel,
  handleNext,
  handleBack,
  showCostingFields,
  costingSummary,
}) => {
  // If "without costing" option was selected, skip this screen
  if (!showCostingFields) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <div className="inventory-entry-container max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-600">No costing details required. Redirecting...</p>
          </div>
        </div>
      </div>
    );
  }

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
            <div className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg">
              <Calculator className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight mb-2">
                Costing Details
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Enter costing information for your products
              </p>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {/* Step 1 - Completed */}
            <div className="flex flex-col items-center text-green-700">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-2 shadow-lg border-2 border-white bg-green-600 text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-xs font-medium text-center leading-tight text-green-600">Inventory Type</span>
            </div>

            {/* Connector 1-2 */}
            <div className="flex-1 h-1 mx-2 rounded-full bg-gradient-to-r from-green-500 to-green-600"></div>

            {/* Step 2 - Completed */}
            <div className="flex flex-col items-center text-green-700">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-2 shadow-lg border-2 border-white bg-green-600 text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-xs font-medium text-center leading-tight text-green-600">Costing Option</span>
            </div>

            {/* Connector 2-3 */}
            <div className="flex-1 h-1 mx-2 rounded-full bg-gradient-to-r from-green-500 to-purple-500"></div>

            {/* Step 3 - Active */}
            <div className="flex flex-col items-center text-purple-700">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mb-2 shadow-lg border-2 border-white bg-gradient-to-r from-purple-500 to-purple-600 text-white ring-2 ring-purple-300">
                3
              </div>
              <span className="text-sm font-medium text-center leading-tight text-purple-600">Costing Details</span>
            </div>

            {/* Connector 3-4 */}
            <div className="flex-1 h-1 mx-2 rounded-full bg-gray-300"></div>

            {/* Step 4 */}
            <div className="flex flex-col items-center text-gray-700">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-2 shadow-lg border-2 border-white bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800">
                4
              </div>
              <span className="text-xs font-medium text-center leading-tight text-gray-500">Product Details</span>
            </div>

            {/* Connector 4-5 */}
            <div className="flex-1 h-1 mx-2 rounded-full bg-gray-300"></div>

            {/* Step 5 */}
            <div className="flex flex-col items-center text-gray-700">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-2 shadow-lg border-2 border-white bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800">
                5
              </div>
              <span className="text-xs font-medium text-center leading-tight text-gray-500">Payment</span>
            </div>
          </div>
        </div>

        {/* Costing Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="space-y-6">
            {/* Costing Fields Section */}
            <div className="border-b pb-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Calculator className="w-5 h-5 mr-2 text-purple-600" />
                Multi-Model Costing Information
              </h4>
              
              {/* Global Inputs Component */}
              <CostingGlobalInputs
                brandName={costingInfo?.brandName || ''}
                usdRate={costingInfo?.usdRate || 0}
                totalCustomsValue={costingInfo?.totalCustomsValue || 0}
                totalFreightValue={costingInfo?.totalFreightValue || 0}
                onBrandNameChange={setCostingBrandName}
                onUsdRateChange={setUsdRate}
                onCustomsChange={setTotalCustomsValue}
                onFreightChange={setTotalFreightValue}
              />

              {/* Models Table Component */}
              <CostingTable
                models={costingInfo?.models || []}
                onAddModel={addModel}
                onUpdateModelField={updateModelField}
                onRemoveModel={removeModel}
              />

              {/* Brand Summary Component */}
              <BrandSummary
                totalUnitCostUSD={costingSummary.totalUnitCostUSD}
                shipmentTotalUSD={costingSummary.shipmentTotalUSD}
                consignmentValue={costingSummary.consignmentValue}
                totalValueOfBrand={costingSummary.totalValueOfBrand}
                totalCustomsValue={costingInfo?.totalCustomsValue || 0}
                totalFreightValue={costingInfo?.totalFreightValue || 0}
              />

              {/* Show errors if any */}
              {validationErrors.models && (
                <p className="text-red-500 text-sm mt-2">{validationErrors.models}</p>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                onClick={handleBack}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <ArrowLeft size={20} />
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={!isValid}
                className={`px-8 py-4 rounded-lg transition-colors font-medium text-lg shadow-lg flex items-center gap-2 ${
                  isValid
                    ? 'bg-[#4f46e5] text-white hover:bg-[#4338ca]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Next: Product Details
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

