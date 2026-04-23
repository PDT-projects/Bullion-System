// Inventory Module - Component
// CostingGlobalInputs - Global input fields for multi-model costing

import React from 'react';
import { BrandModelSelector } from './BrandModelSelector';


interface CostingGlobalInputsProps {
  brandName: string;
  usdRate: number;
  totalCustomsValue: number;
  totalFreightValue: number;
  onBrandNameChange: (value: string) => void;
  onUsdRateChange: (value: number) => void;
  onCustomsChange: (value: number) => void;
  onFreightChange: (value: number) => void;
}

export function CostingGlobalInputs({
  brandName, usdRate, totalCustomsValue, totalFreightValue,
  onBrandNameChange, onUsdRateChange, onCustomsChange, onFreightChange,
}: CostingGlobalInputsProps) {
  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1';
  const helpCls = 'text-xs text-gray-500 mt-1';

  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Global Costing Inputs</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Brand & Model *</label>
            <BrandModelSelector
              initialBrandId={''}
              initialModelId={''}
              onBrandChange={onBrandNameChange}
              onModelChange={(_, modelName) => onBrandNameChange(modelName)}
            />
        </div>
        <div>
          <label htmlFor="usdRate" className={labelCls}>USD Rate (PKR)</label>
          <input id="usdRate" type="number" className={inputCls}
            value={usdRate || ''} onChange={e => onUsdRateChange(Number(e.target.value))}
            placeholder="e.g., 280" />
          <p className={helpCls}>1 USD = ? PKR</p>
        </div>
        <div>
          <label htmlFor="customsValue" className={labelCls}>Total Customs Duty (PKR)</label>
          <input id="customsValue" type="number" className={inputCls}
            value={totalCustomsValue || ''} onChange={e => onCustomsChange(Number(e.target.value))}
            placeholder="e.g., 50000" />
          <p className={helpCls}>Total customs duty for shipment</p>
        </div>
        <div>
          <label htmlFor="freightValue" className={labelCls}>Total Freight Charges (PKR)</label>
          <input id="freightValue" type="number" className={inputCls}
            value={totalFreightValue || ''} onChange={e => onFreightChange(Number(e.target.value))}
            placeholder="e.g., 25000" />
          <p className={helpCls}>Total freight/logistics cost</p>
        </div>
      </div>
    </div>
  );
}