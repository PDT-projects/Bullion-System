import React, { useState } from 'react';
import { Package, Hash, MapPin, ArrowLeft, ArrowRight } from 'lucide-react';
import { UseInventoryProductDetailsViewModelReturn } from '../viewModels/useInventoryProductDetailsViewModel';
import { BrandModelDropdown } from '../components/BrandModelDropdown';
import { MultiModelInventoryTable } from '../components/MultiModelInventoryTable';

interface InventoryProductDetailsViewProps extends UseInventoryProductDetailsViewModelReturn {}

export const InventoryProductDetailsView: React.FC<InventoryProductDetailsViewProps> = ({
  formData,
  costingOption,
  inventoryType,
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
  updateSerialNumber,
  updateSerialCity,
  handleNext,
  handleBack,
  categories,
  cities,
}) => {
  const [selectedModels, setSelectedModels] = useState<Array<{
    modelId: string;
    modelName: string;
    costPrice: number;
    salePrice: number;
    quantity: number;
  }>>([]);

  const handleAddModelToTable = (modelId: string, modelName: string, costPrice: number) => {
    const newModel = {
      modelId,
      modelName,
      costPrice,
      salePrice: costPrice * 1.3, // Default 30% margin
      quantity: 1
    };
    setSelectedModels(prev => [...prev, newModel]);
    setModelName(modelName);
  };

  const handleUpdateModel = (index: number, field: 'salePrice' | 'quantity', value: number) => {
    setSelectedModels(prev => prev.map((model, i) => 
      i === index 
        ? { ...model, [field]: value }
        : model
    ));
  };

  const handleRemoveModel = (index: number) => {
    setSelectedModels(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditModel = (index: number) => {
    // Open BrandModelDropdown prefilled with current model
    console.log('Edit model:', selectedModels[index]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 shadow-md border"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Product Details
              </h2>
              <p className="text-lg text-gray-600">Select brands/models from DataConnect and set sale prices</p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6 bg-white rounded-xl shadow-lg border p-6">
          <div className="flex items-center max-w-4xl mx-auto">
            {/* Step 1 Complete */}
            <div className="flex flex-col items-center text-green-700 mr-6">
              <div className="w-16 h-16 rounded-full bg-green-600 text-white flex items-center justify-center font-bold shadow-lg">
                ✓
              </div>
              <span className="text-xs font-medium text-green-600 mt-1">Type</span>
            </div>
            <div className="flex-1 h-1 bg-green-500 rounded-full mx-3"></div>
            {/* Step 2 Complete */}
            <div className="flex flex-col items-center text-green-700 mr-6">
              <div className="w-16 h-16 rounded-full bg-green-600 text-white flex items-center justify-center font-bold shadow-lg">
                ✓
              </div>
              <span className="text-xs font-medium text-green-600 mt-1">Costing</span>
            </div>
            <div className="flex-1 h-1 bg-blue-500 rounded-full mx-3"></div>
            {/* Step 3 Active */}
            <div className="flex flex-col items-center text-blue-700">
              <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-lg ring-2 ring-blue-300">
                3
              </div>
              <span className="text-sm font-medium text-blue-600 mt-1">Details</span>
            </div>
            <div className="flex-1 h-1 bg-gray-300 rounded-full mx-3"></div>
            {/* Step 4 */}
            <div className="flex flex-col items-center text-gray-500">
              <div className="w-16 h-16 rounded-full bg-gray-400 text-white flex items-center justify-center font-bold shadow-lg">
                4
              </div>
              <span className="text-xs font-medium text-gray-500 mt-1">Payment</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-8 space-y-8">
          
          {/* Brand & Model Selection */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
              <Package className="w-5 h-5 mr-2 text-blue-600" />
              Select from DataConnect (Brands/Models)
            </h4>
            <BrandModelDropdown
              onBrandChange={(brandId, brandName) => {
                setBrandName(brandName);
                console.log('Brand selected:', brandId, brandName);
              }}
              onModelChange={handleAddModelToTable}
            />
            {validationErrors.brandName && (
              <p className="text-red-500 text-sm mt-2">{validationErrors.brandName}</p>
            )}
          </div>

          {/* Multi Model Table */}
          <div>
            <MultiModelInventoryTable
              models={selectedModels}
              onUpdateModel={handleUpdateModel}
              onAddModel={() => console.log('Add new model row')}
              onRemoveModel={handleRemoveModel}
              onEditModel={handleEditModel}
            />
          </div>

          {/* Other Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stock Qty</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="New">New</option>
                <option value="Used">Used</option>
                <option value="Returned">Returned</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-vertical"
              />
            </div>
          </div>

          {/* Serial Numbers - Only if stock > 0 */}
          {formData.stock > 0 && (
            <div className="border-t pt-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Hash className="w-5 h-5 mr-2 text-blue-600" />
                Serial Numbers ({formData.stock} units)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto p-4 bg-gray-50 rounded-lg">
                {serialInputs.map((serial, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg border shadow-sm">
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Unit {index + 1}
                    </label>
                    <input
                      type="text"
                      value={serial}
                      onChange={(e) => updateSerialNumber(index, e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder={`Serial #${index + 1}`}
                    />
                    <select
                      value={formData.serialCities[serial] || ''}
                      onChange={(e) => updateSerialCity(index, e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">Location</option>
                      {cities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-8 border-t">
            <button
              onClick={handleBack}
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
            >
              ← Back to Costing
            </button>
            <button
              onClick={handleNext}
              disabled={!isValid || selectedModels.length === 0}
              className={`px-8 py-3 rounded-lg font-semibold text-lg shadow-lg flex items-center gap-2 transition-all ${
                isValid && selectedModels.length > 0
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-xl hover:scale-[1.02]'
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
  );
};

