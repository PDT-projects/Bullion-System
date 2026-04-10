// Inventory Module - View Layer
// InventoryCostingOptionView - Step 2: Choose costing option

import React from 'react';
import { Calculator, Package, ArrowLeft, ChevronRight, Check } from 'lucide-react';
import { UseInventoryCostingOptionViewModelReturn } from '../viewModels/useInventoryCostingOptionViewModel';

interface InventoryCostingOptionViewProps extends UseInventoryCostingOptionViewModelReturn {}

export const InventoryCostingOptionView: React.FC<InventoryCostingOptionViewProps> = ({
  selectedOption,
  selectOption,
  selectOptionAndContinue,
  handleContinue,
  handleBack,
  canContinue,
}) => {
  const steps = [
    { number: 1, label: 'Inventory Type' },
    { number: 2, label: 'Costing Option' },
    { number: 3, label: 'Product Details' },
    { number: 4, label: 'Payment' },
  ];

  const currentStep = 2;

  return (
    <div className="flex flex-col h-full w-full bg-gray-50">

      {/* ── Top header bar ── */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 rounded-lg transition-all border border-gray-200"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">Costing Options</h2>
              <p className="text-xs text-gray-500">Step 2 of 4 — Include costing information?</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stepper ── */}
      <div className="flex-shrink-0 sticky top-16 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm px-6 py-5">
        <div className="flex items-center w-full max-w-4xl mx-auto">
          {steps.map((step, index) => {
            const isActive = step.number === currentStep;
            const isDone   = step.number < currentStep;
            const isLast   = index === steps.length - 1;

            return (
              <React.Fragment key={step.number}>
                {/* Step node */}
                <div className="flex flex-col items-center flex-shrink-0 min-w-[120px]">
                  {/* Circle */}
                  <div
                    className={`
                      w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg transition-all duration-300
                      border-3 ${isDone || isActive ? 'ring-4 ring-indigo-100/50' : ''}
                      ${isDone
                        ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 border-indigo-600 text-white shadow-indigo-500/25'
                        : isActive
                        ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 border-white text-white shadow-indigo-400/50'
                        : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:shadow-md'
                      }
                    `}
                  >
                    {isDone ? <Check className="w-6 h-6 stroke-width-3" /> : step.number}
                  </div>
                  {/* Label */}
                  <span
                    className={`
                      mt-3 text-sm font-semibold tracking-wide leading-tight px-2 py-1 rounded-full transition-colors
                      ${isDone || isActive 
                        ? 'bg-indigo-50 text-indigo-800 shadow-sm' 
                        : 'text-gray-500 group-hover:text-gray-700'
                      }
                    `}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connector line (not after last step) */}
                {!isLast && (
                  <div className="flex-1 mx-4 max-w-xs">
                    <div
                      className={`h-1.5 rounded-full shadow-sm transition-all ${isDone 
                        ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 shadow-indigo-200/50' 
                        : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="w-full h-full flex flex-col">

          <p className="text-base font-semibold text-gray-700 mb-5">
            Do you want to include costing information?
          </p>

          {/* Option cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1">

            {/* With Costing */}
            <button
              onClick={() => selectOptionAndContinue('with')}
              className={`flex flex-col p-6 border-2 rounded-2xl text-left transition-all duration-200 w-full ${
                selectedOption === 'with'
                  ? 'border-indigo-500 bg-indigo-50 shadow-md ring-2 ring-indigo-100'
                  : 'border-gray-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/40 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-xl ${selectedOption === 'with' ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                  <Calculator className="w-7 h-7 text-indigo-600" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-900">With Costing</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Detailed breakdown</p>
                </div>
                {selectedOption === 'with' && (
                  <div className="ml-auto w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                    <Check size={14} className="text-white" strokeWidth={3} />
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 leading-relaxed flex-1">
                Include detailed cost breakdown with USD rate, customs, freight expenses, and full payment tracking per shipment.
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                  ● Full Tracking
                </span>
                <span className={`flex items-center gap-1 text-sm font-semibold ${selectedOption === 'with' ? 'text-indigo-600' : 'text-gray-400'}`}>
                  Select <ChevronRight size={16} />
                </span>
              </div>
            </button>

            {/* Without Costing */}
            <button
              onClick={() => selectOptionAndContinue('without')}
              className={`flex flex-col p-6 border-2 rounded-2xl text-left transition-all duration-200 w-full ${
                selectedOption === 'without'
                  ? 'border-orange-500 bg-orange-50 shadow-md ring-2 ring-orange-100'
                  : 'border-gray-200 bg-white hover:border-orange-400 hover:bg-orange-50/40 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-xl ${selectedOption === 'without' ? 'bg-orange-100' : 'bg-gray-100'}`}>
                  <Package className="w-7 h-7 text-orange-600" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-900">Without Costing</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Simple quick entry</p>
                </div>
                {selectedOption === 'without' && (
                  <div className="ml-auto w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                    <Check size={14} className="text-white" strokeWidth={3} />
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 leading-relaxed flex-1">
                Skip cost details and go straight to product entry. Best for quick stock additions where cost tracking is not needed.
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                  ● Quick Entry
                </span>
                <span className={`flex items-center gap-1 text-sm font-semibold ${selectedOption === 'without' ? 'text-orange-600' : 'text-gray-400'}`}>
                  Select <ChevronRight size={16} />
                </span>
              </div>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
