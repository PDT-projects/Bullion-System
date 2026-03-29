// Inventory Module - View Layer
// InventoryCostingDetailsView - Step 3: Costing Details

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Calculator, Check } from 'lucide-react';
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
  isSaving,
  saveError,
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!showCostingFields) {
      const type = searchParams.get('type') || 'in-stock';
      navigate(`/inventory/create-new/details?type=${type}&costing=without`, { replace: true });
    }
  }, [showCostingFields, navigate, searchParams]);

  const steps = [
    { number: 1, label: 'Inventory Type' },
    { number: 2, label: 'Costing Option' },
    { number: 3, label: 'Costing Details' },
    { number: 4, label: 'Product Details' },
    { number: 5, label: 'Payment' },
  ];

  const currentStep = 3;

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="inventory-entry-container max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={handleBack} className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-md hover:shadow-lg border border-gray-200">
            <ArrowLeft size={20} /><span className="font-medium">Back</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg">
              <Calculator className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight mb-2">Costing Details</h2>
              <p className="text-lg text-gray-600 leading-relaxed">Enter costing information for your products</p>
            </div>
          </div>
        </div>

        {/* ── Stepper ── */}
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-5">
          <div className="flex items-center w-full">
            {steps.map((step, index) => {
              const isActive = step.number === currentStep;
              const isDone   = step.number < currentStep;
              const isLast   = index === steps.length - 1;

              return (
                <React.Fragment key={step.number}>
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                        border-2 transition-all duration-200 shadow-sm
                        ${isDone
                          ? 'bg-green-500 border-green-500 text-white'
                          : isActive
                          ? 'bg-purple-600 border-purple-600 text-white ring-4 ring-purple-100'
                          : 'bg-white border-gray-300 text-gray-400'
                        }
                      `}
                    >
                      {isDone ? <Check size={16} strokeWidth={3} /> : step.number}
                    </div>
                    <span
                      className={`
                        mt-2 text-xs font-semibold whitespace-nowrap tracking-wide
                        ${isActive ? 'text-purple-600' : isDone ? 'text-green-600' : 'text-gray-400'}
                      `}
                    >
                      {step.label}
                    </span>
                  </div>
                  {!isLast && (
                    <div className="flex-1 mx-3 mb-5">
                      <div className={`h-0.5 w-full rounded-full ${isDone ? 'bg-green-400' : 'bg-gray-200'}`} />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Costing Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="space-y-6">
            <div className="border-b pb-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Calculator className="w-5 h-5 mr-2 text-purple-600" />
                Multi-Model Costing Information
              </h4>
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
              <CostingTable
                models={costingInfo?.models || []}
                onAddModel={addModel}
                onUpdateModelField={updateModelField}
                onRemoveModel={removeModel}
              />
              <BrandSummary
                totalUnitCostUSD={costingSummary.totalUnitCostUSD}
                shipmentTotalUSD={costingSummary.shipmentTotalUSD}
                consignmentValue={costingSummary.consignmentValue}
                totalValueOfBrand={costingSummary.totalValueOfBrand}
                totalCustomsValue={costingInfo?.totalCustomsValue || 0}
                totalFreightValue={costingInfo?.totalFreightValue || 0}
              />
              {validationErrors.models && <p className="text-red-500 text-sm mt-2">{validationErrors.models}</p>}
              {saveError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 font-medium">{saveError}</p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button onClick={handleBack} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
                <ArrowLeft size={20} />Back
              </button>
              <button onClick={handleNext} disabled={isSaving || !isValid}
                className={`px-8 py-4 rounded-lg transition-colors font-medium text-lg shadow-lg flex items-center gap-2 ${isSaving || !isValid ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#4f46e5] text-white hover:bg-[#4338ca]'}`}>
                {isSaving ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
                ) : (
                  <>Next: Product Details<ArrowRight size={20} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};