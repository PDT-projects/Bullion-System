// Inventory Module - View Layer
// InventoryTypeSelectionView - Step 1: Choose inventory entry type (In-Stock vs On-Order)

import React from 'react';
import { Package, Truck, ArrowLeft, ChevronRight, Check } from 'lucide-react';
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
  const steps = [
    { number: 1, label: 'Inventory Type' },
    { number: 2, label: 'Costing Option' },
    { number: 3, label: 'Product Details' },
    { number: 4, label: 'Payment' },
  ];

  const currentStep = 1;

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
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">Add New Inventory</h2>
              <p className="text-xs text-gray-500">Step 1 of 4 — Select inventory entry type</p>
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

      {/* ── Main content — fills remaining height ── */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="w-full h-full flex flex-col">

          <p className="text-base font-semibold text-gray-700 mb-5">
            What type of inventory are you adding?
          </p>

          {/* Type cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1">

            {/* In-Stock */}
            <button
              onClick={() => selectTypeAndContinue('in-stock')}
              className={`flex flex-col p-6 border-2 rounded-2xl text-left transition-all duration-200 w-full ${
                selectedType === 'in-stock'
                  ? 'border-green-500 bg-green-50 shadow-md ring-2 ring-green-100'
                  : 'border-gray-200 bg-white hover:border-green-400 hover:bg-green-50/40 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-xl ${selectedType === 'in-stock' ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <Package className="w-7 h-7 text-green-600" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-900">In-Stock / Received</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Physically in warehouse</p>
                </div>
                {selectedType === 'in-stock' && (
                  <div className="ml-auto w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <Check size={14} className="text-white" strokeWidth={3} />
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 leading-relaxed flex-1">
                Products that are already in your warehouse or have been physically received and are ready for sale.
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  ● Available Now
                </span>
                <span className={`flex items-center gap-1 text-sm font-semibold ${selectedType === 'in-stock' ? 'text-green-600' : 'text-gray-400'}`}>
                  Select <ChevronRight size={16} />
                </span>
              </div>
            </button>

            {/* On-Order */}
            <button
              onClick={() => selectTypeAndContinue('on-order')}
              className={`flex flex-col p-6 border-2 rounded-2xl text-left transition-all duration-200 w-full ${
                selectedType === 'on-order'
                  ? 'border-orange-500 bg-orange-50 shadow-md ring-2 ring-orange-100'
                  : 'border-gray-200 bg-white hover:border-orange-400 hover:bg-orange-50/40 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-xl ${selectedType === 'on-order' ? 'bg-orange-100' : 'bg-gray-100'}`}>
                  <Truck className="w-7 h-7 text-orange-600" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-900">On-Order / Pending</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Ordered, not yet received</p>
                </div>
                {selectedType === 'on-order' && (
                  <div className="ml-auto w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                    <Check size={14} className="text-white" strokeWidth={3} />
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 leading-relaxed flex-1">
                Products that have been ordered from a supplier but not yet received or are currently in transit.
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                  ● Expected Soon
                </span>
                <span className={`flex items-center gap-1 text-sm font-semibold ${selectedType === 'on-order' ? 'text-orange-600' : 'text-gray-400'}`}>
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
