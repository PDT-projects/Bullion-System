// Inventory Module - Costing Global Inputs Component
// Global input fields for multi-model costing (USD Rate, Customs, Freight)

import React from 'react';

interface CostingGlobalInputsProps {
  usdRate: number;
  totalCustomsValue: number;
  totalFreightValue: number;
  onUsdRateChange: (value: number) => void;
  onCustomsChange: (value: number) => void;
  onFreightChange: (value: number) => void;
}

export function CostingGlobalInputs({
  usdRate,
  totalCustomsValue,
  totalFreightValue,
  onUsdRateChange,
  onCustomsChange,
  onFreightChange,
}: CostingGlobalInputsProps) {
  const inputStyle = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelStyle = "block text-sm font-medium text-gray-700 mb-1";
  const helpTextStyle = "text-xs text-gray-500 mt-1";

  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Global Costing Inputs</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* USD Rate */}
        <div>
          <label htmlFor="usdRate" className={labelStyle}>
            USD Rate (PKR)
          </label>
          <input
            id="usdRate"
            type="number"
            className={inputStyle}
            value={usdRate || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUsdRateChange(Number(e.target.value))}
            placeholder="e.g., 280"
          />
          <p className={helpTextStyle}>1 USD = ? PKR</p>
        </div>

        {/* Customs Value */}
        <div>
          <label htmlFor="customsValue" className={labelStyle}>
            Total Customs Duty (PKR)
          </label>
          <input
            id="customsValue"
            type="number"
            className={inputStyle}
            value={totalCustomsValue || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onCustomsChange(Number(e.target.value))}
            placeholder="e.g., 50000"
          />
          <p className={helpTextStyle}>Total customs duty for shipment</p>
        </div>

        {/* Freight Value */}
        <div>
          <label htmlFor="freightValue" className={labelStyle}>
            Total Freight Charges (PKR)
          </label>
          <input
            id="freightValue"
            type="number"
            className={inputStyle}
            value={totalFreightValue || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFreightChange(Number(e.target.value))}
            placeholder="e.g., 25000"
          />
          <p className={helpTextStyle}>Total freight/logistics cost</p>
        </div>
      </div>
    </div>
  );
}
