// Inventory Module - View Layer
// InventoryProductDetailsView - Step 2: Product details with conditional costing fields

import React from 'react';
import { Package, Hash, MapPin, ArrowLeft, ArrowRight, Calculator } from 'lucide-react';
import { UseInventoryProductDetailsViewModelReturn } from '../viewModels/useInventoryProductDetailsViewModel';

interface InventoryProductDetailsViewProps extends UseInventoryProductDetailsViewModelReturn {}

export const InventoryProductDetailsView: React.FC<InventoryProductDetailsViewProps> = ({
  formData,
  costingOption,
  serialInputs,
  validationErrors,
  isValid,
  setBrandName,
  setModelName,
  setCategory,
  setSellPrice,
  setBuyType,
  setWarrantyYears,
  setStock,
  setDescription,
  setStatus,
  setIsDamaged,
  setCostingUnits,
  setUnitCostUSD,
  setTotalCostUSD,
  setPercentage,
  setCustomPerModel,
  setCustomPerUnit,
  setFreightPerModel,
  setFreightPerUnit,
  setUnitCostPKR,
  setTotalUnitCost,
  setTotalShipmentValuePKR,
  updateSerialNumber,
  updateSerialCity,
  handleNext,
  handleBack,
  showCostingFields,
  categories,
  cities,
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
                Product Details
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Enter product information for new inventory
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
            <div className="flex-1 h-1 mx-4 rounded-full bg-gradient-to-r from-green-500 to-green-600"></div>

            {/* Step 2 - Completed */}
            <div className="flex flex-col items-center text-green-700">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mb-2 shadow-lg border-2 border-white bg-green-600 text-white">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm font-medium text-center leading-tight text-green-600">Costing Option</span>
            </div>

            {/* Connector 2-3 */}
            <div className="flex-1 h-1 mx-4 rounded-full bg-gradient-to-r from-green-500 to-blue-500"></div>

            {/* Step 3 - Active */}
            <div className="flex flex-col items-center text-blue-700">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mb-2 shadow-lg border-2 border-white bg-gradient-to-r from-blue-500 to-blue-600 text-white ring-2 ring-blue-300">
                3
              </div>
              <span className="text-sm font-medium text-center leading-tight text-blue-600">Product Details</span>
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

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="space-y-8">
            {/* Costing Fields - Only shown when costingOption === 'with' */}
            {showCostingFields && (
              <div className="border-b pb-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Calculator className="w-5 h-5 mr-2 text-purple-600" />
                  Costing Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name *</label>
                    <input
                      type="text"
                      value={formData.brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        validationErrors.brandName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-500'
                      }`}
                      placeholder="Enter brand name"
                    />
                    {validationErrors.brandName && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.brandName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model Name *</label>
                    <input
                      type="text"
                      value={formData.modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        validationErrors.modelName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-500'
                      }`}
                      placeholder="Enter model name"
                    />
                    {validationErrors.modelName && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.modelName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setCategory(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        validationErrors.category ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-500'
                      }`}
                      placeholder="Enter category"
                    />
                    {validationErrors.category && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.category}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Units</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.costing?.units || ''}
                      onChange={(e) => setCostingUnits(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost (USD)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.costing?.unitCostUSD || ''}
                      onChange={(e) => setUnitCostUSD(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Cost (USD)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.costing?.totalCostUSD || ''}
                      onChange={(e) => setTotalCostUSD(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Percentage (%)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.costing?.percentage || ''}
                      onChange={(e) => setPercentage(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom per Model</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.costing?.customPerModel || ''}
                      onChange={(e) => setCustomPerModel(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom per Unit</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.costing?.customPerUnit || ''}
                      onChange={(e) => setCustomPerUnit(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Freight per Model</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.costing?.freightPerModel || ''}
                      onChange={(e) => setFreightPerModel(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Freight per Unit</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.costing?.freightPerUnit || ''}
                      onChange={(e) => setFreightPerUnit(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost (PKR)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.costing?.unitCostPKR || ''}
                      onChange={(e) => setUnitCostPKR(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Unit Cost</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.costing?.totalUnitCost || ''}
                      onChange={(e) => setTotalUnitCost(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Shipment Value (PKR)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.costing?.totalShipmentValuePKR || ''}
                      onChange={(e) => setTotalShipmentValuePKR(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Basic Information - Always shown */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2 text-blue-600" />
                Inventory Details
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {/* Show Brand/Model/Category only when WITHOUT costing (when WITH costing, they're in costing section) */}
                {!showCostingFields && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name *</label>
                      <input
                        type="text"
                        value={formData.brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                          validationErrors.brandName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        placeholder="Enter brand name"
                      />
                      {validationErrors.brandName && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.brandName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Model Name *</label>
                      <input
                        type="text"
                        value={formData.modelName}
                        onChange={(e) => setModelName(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                          validationErrors.modelName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        placeholder="Enter model name"
                      />
                      {validationErrors.modelName && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.modelName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setCategory(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                          validationErrors.category ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      >
                        <option value="">Select category</option>
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                      {validationErrors.category && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.category}</p>
                      )}
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sell Price *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sellPrice || ''}
                    onChange={(e) => setSellPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buy Type *</label>
                  <select
                    value={formData.buyType}
                    onChange={(e) => setBuyType(e.target.value as 'Import' | 'Export')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Import">Import</option>
                    <option value="Export">Export</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Years *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.warrantyYears || ''}
                    onChange={(e) => setWarrantyYears(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setStatus(e.target.value as 'New' | 'Used' | 'Returned' | 'Damaged')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="New">New</option>
                    <option value="Used">Used</option>
                    <option value="Returned">Returned</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center mt-6">
                    <input
                      type="checkbox"
                      checked={formData.isDamaged}
                      onChange={(e) => setIsDamaged(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Is this item damaged?</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Serial Numbers Section */}
            <div className="border-t pt-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Hash className="w-5 h-5 mr-2 text-blue-600" />
                Serial Numbers & Locations
              </h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
                <input
                  type="number"
                  value={formData.stock || ''}
                  onChange={(e) => setStock(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">Serial number fields will be generated based on quantity</p>
              </div>

              {(formData.stock || 0) > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Hash size={18} className="text-blue-600" />
                    <label className="text-sm font-medium text-gray-700">Serial Numbers * ({formData.stock} units)</label>
                  </div>
                  <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto p-3 bg-gray-50 rounded-lg border border-gray-200">
                    {serialInputs.map((serial, index) => (
                      <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Unit {index + 1}</label>
                        <input
                          type="text"
                          value={serial}
                          onChange={(e) => updateSerialNumber(index, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm mb-2"
                          placeholder={`e.g., ${formData.brandName?.substring(0, 3).toUpperCase() || 'PRD'}-${String(index + 1).padStart(3, '0')}`}
                        />
                        <div className="flex items-center gap-1">
                          <MapPin size={14} className="text-gray-500" />
                          <select
                            value={formData.serialCities[serial] || ''}
                            onChange={(e) => updateSerialCity(index, e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select city/location</option>
                            {cities.map(city => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                  {validationErrors.serialNumbers && (
                    <p className="text-red-500 text-xs mt-2">{validationErrors.serialNumbers}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">💡 Each serial number must be unique across all products</p>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="border-t pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 resize-none ${
                  validationErrors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="Enter product description..."
              />
              {validationErrors.description && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.description}</p>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                onClick={handleBack}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleNext}
                disabled={!isValid}
                className={`px-8 py-4 rounded-lg transition-colors font-medium text-lg shadow-lg flex items-center gap-2 ${
                  isValid
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Next: Payment
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
