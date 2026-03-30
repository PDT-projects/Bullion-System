// Inventory Module - View Layer
// InventoryProductDetailsView - Step 4: Product Details
// Change: added Location dropdown (required) for both paths.
// The selected location is the primary stocking location — used by the Firebase service
// to auto-seed serialCities and set product.location.

import React, { useState, useEffect } from 'react';
import { Package, Hash, ArrowLeft, ArrowRight, Loader2, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { UseInventoryProductDetailsViewModelReturn, SelectedModel } from '../viewModels/useInventoryProductDetailsViewModel';

interface InventoryProductDetailsViewProps extends UseInventoryProductDetailsViewModelReturn {}

export const InventoryProductDetailsView: React.FC<InventoryProductDetailsViewProps> = ({
  formData, costingOption, singleModel, setSingleModelField,
  serialInputs, validationErrors,
  setBrandName, setModelName, setCategory, setSellPrice, setStock,
  setLocation, setDescription, setStatus, updateSerialNumber, updateSerialCity,
  handleNext, handleBack, categories, cities,
  costingBrandId, costingBrandName, preloadedModels, isLoadingModels,
}) => {
  // With-costing: local selectedModels state owns serial data
  const [selectedModels, setSelectedModels] = useState<SelectedModel[]>([]);
  const [expandedModel, setExpandedModel]   = useState<string | null>(null);

  useEffect(() => {
    if (preloadedModels.length > 0) {
      setSelectedModels(preloadedModels.map(m => ({
        ...m,
        serialNumbers: Array(m.quantity).fill(''),
        serialCities:  {},
      })));
      setExpandedModel(preloadedModels[0]?.modelId || null);
    }
  }, [preloadedModels]);

  const handleUpdateModel = (index: number, field: 'salePrice' | 'quantity', value: number) => {
    setSelectedModels(prev => prev.map((m, i) => {
      if (i !== index) return m;
      if (field === 'quantity') {
        const newQty = Math.max(1, value);
        const serials = [...m.serialNumbers];
        if (newQty > serials.length) {
          while (serials.length < newQty) serials.push('');
        } else {
          const removed = serials.splice(newQty);
          const newCities = { ...m.serialCities };
          removed.forEach(s => { if (s) delete newCities[s]; });
          return { ...m, quantity: newQty, serialNumbers: serials, serialCities: newCities };
        }
        return { ...m, quantity: newQty, serialNumbers: serials };
      }
      return { ...m, [field]: value };
    }));
  };

  const handleRemoveModel = (index: number) =>
    setSelectedModels(prev => prev.filter((_, i) => i !== index));

  const handleUpdateSerial = (modelIdx: number, serialIdx: number, value: string) => {
    setSelectedModels(prev => prev.map((m, i) => {
      if (i !== modelIdx) return m;
      const serials    = [...m.serialNumbers];
      const oldSerial  = serials[serialIdx];
      serials[serialIdx] = value;
      const newCities  = { ...m.serialCities };
      if (oldSerial && newCities[oldSerial]) {
        const city = newCities[oldSerial];
        delete newCities[oldSerial];
        if (value) newCities[value] = city;
      }
      return { ...m, serialNumbers: serials, serialCities: newCities };
    }));
  };

  const handleUpdateSerialCity = (modelIdx: number, serialIdx: number, city: string) => {
    setSelectedModels(prev => prev.map((m, i) => {
      if (i !== modelIdx) return m;
      const serial = m.serialNumbers[serialIdx];
      if (!serial) return m;
      return { ...m, serialCities: { ...m.serialCities, [serial]: city } };
    }));
  };

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500';

  const ProgressBar = () => (
    <div className="mb-6 bg-white rounded-xl shadow-lg border p-6">
      <div className="flex items-center justify-between">
        {[{ label: 'Type' }, { label: 'Costing' }].map((s, i) => (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center min-w-[70px]">
              <div className="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center font-bold shadow-md">✓</div>
              <span className="text-xs font-medium text-green-600 mt-1 text-center">{s.label}</span>
            </div>
            <div className="flex-1 h-1 bg-green-500 rounded-full mx-2" />
          </React.Fragment>
        ))}
        <div className="flex flex-col items-center min-w-[70px]">
          <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-md ring-4 ring-blue-100">3</div>
          <span className="text-xs font-semibold text-blue-600 mt-1 text-center">Details</span>
        </div>
        <div className="flex-1 h-1 bg-gray-200 rounded-full mx-2" />
        <div className="flex flex-col items-center min-w-[70px]">
          <div className="w-12 h-12 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xl font-bold shadow-sm border border-gray-300">4</div>
          <span className="text-xs font-medium text-gray-400 mt-1 text-center">Payment</span>
        </div>
      </div>
    </div>
  );

  // ── Location + common fields (shared between both paths) ────────────────────
  const LocationField = () => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
        <MapPin className="w-4 h-4 text-indigo-500" />
        Stocking Location <span className="text-red-500">*</span>
      </label>
      <select
        value={formData.location || ''}
        onChange={e => setLocation(e.target.value)}
        className={`${inputCls} ${validationErrors.location ? 'border-red-500' : ''}`}
      >
        <option value="">Select location</option>
        {cities.map(city => <option key={city} value={city}>{city}</option>)}
      </select>
      {validationErrors.location && (
        <p className="text-red-500 text-sm mt-1">{validationErrors.location}</p>
      )}
      <p className="text-xs text-gray-400 mt-1">
        Where these units are being stocked. Serial numbers will be assigned to this location.
      </p>
    </div>
  );

  const CommonFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
        <select value={formData.category} onChange={e => setCategory(e.target.value)}
          className={`${inputCls} ${validationErrors.category ? 'border-red-500' : ''}`}>
          <option value="">Select category</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        {validationErrors.category && <p className="text-red-500 text-sm mt-1">{validationErrors.category}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
        <select value={formData.status} onChange={e => setStatus(e.target.value as any)} className={inputCls}>
          <option value="New">New</option>
          <option value="Used">Used</option>
          <option value="Returned">Returned</option>
        </select>
      </div>
      {/* Location in the with-costing "common details" section */}
      <LocationField />
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
        <textarea value={formData.description} onChange={e => setDescription(e.target.value)} rows={3}
          className={`${inputCls} resize-vertical`} />
        {validationErrors.description && <p className="text-red-500 text-sm mt-1">{validationErrors.description}</p>}
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // WITHOUT COSTING — single model
  // ═══════════════════════════════════════════════════════════
  if (costingOption === 'without') {
    return (
      <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={handleBack} className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 shadow-md border">
              <ArrowLeft size={20} /> Back
            </button>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Simple Product Entry</h2>
                <p className="text-lg text-gray-600">Quick entry without detailed costing</p>
              </div>
            </div>
          </div>
          <ProgressBar />

          <div className="bg-white rounded-lg shadow-sm border p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand Name *</label>
                <input type="text" value={singleModel.brandName}
                  onChange={e => { setSingleModelField('brandName', e.target.value); setBrandName(e.target.value); }}
                  className={`${inputCls} ${validationErrors.brandName ? 'border-red-500' : ''}`} />
                {validationErrors.brandName && <p className="text-red-500 text-sm mt-1">{validationErrors.brandName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Model Name *</label>
                <input type="text" value={singleModel.modelName}
                  onChange={e => { setSingleModelField('modelName', e.target.value); setModelName(e.target.value); }}
                  className={`${inputCls} ${validationErrors.modelName ? 'border-red-500' : ''}`} />
                {validationErrors.modelName && <p className="text-red-500 text-sm mt-1">{validationErrors.modelName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cost Price (PKR)</label>
                <input type="number" value={singleModel.costPrice}
                  onChange={e => setSingleModelField('costPrice', Number(e.target.value))}
                  className={inputCls} min="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sell Price (PKR) *</label>
                <input type="number" value={singleModel.sellPrice}
                  onChange={e => { setSingleModelField('sellPrice', Number(e.target.value)); setSellPrice(Number(e.target.value)); }}
                  className={inputCls} min="0" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select value={formData.category} onChange={e => setCategory(e.target.value)}
                  className={`${inputCls} ${validationErrors.category ? 'border-red-500' : ''}`}>
                  <option value="">Select category</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                {validationErrors.category && <p className="text-red-500 text-sm mt-1">{validationErrors.category}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stock Qty *</label>
                <input type="number" value={formData.stock}
                  onChange={e => setStock(Number(e.target.value))}
                  className={inputCls} min="1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select value={formData.status} onChange={e => setStatus(e.target.value as any)} className={inputCls}>
                  <option value="New">New</option>
                  <option value="Used">Used</option>
                  <option value="Returned">Returned</option>
                </select>
              </div>

              {/* ── Location field ── */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-indigo-500" />
                  Stocking Location *
                </label>
                <select
                  value={formData.location || ''}
                  onChange={e => setLocation(e.target.value)}
                  className={`${inputCls} ${validationErrors.location ? 'border-red-500' : ''}`}>
                  <option value="">Select location</option>
                  {cities.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
                {validationErrors.location && <p className="text-red-500 text-sm mt-1">{validationErrors.location}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea value={formData.description} onChange={e => setDescription(e.target.value)} rows={3}
                  className={`${inputCls} resize-vertical`} />
                {validationErrors.description && <p className="text-red-500 text-sm mt-1">{validationErrors.description}</p>}
              </div>
            </div>

            {/* Serial numbers */}
            {formData.stock > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Hash className="w-5 h-5 mr-2" />
                  Serial Numbers ({formData.stock} units)
                  {formData.location && (
                    <span className="ml-2 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      📍 Location: {formData.location}
                    </span>
                  )}
                </h4>
                {validationErrors.serialNumbers && <p className="text-red-500 text-sm mb-2">{validationErrors.serialNumbers}</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto p-4 bg-gray-50 rounded-lg">
                  {Array.from({ length: formData.stock }, (_, i) => (
                    <div key={i} className="bg-white p-4 rounded-lg border">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Unit {i + 1}</label>
                      <input type="text" value={serialInputs[i] || ''}
                        onChange={e => updateSerialNumber(i, e.target.value)}
                        className="w-full px-3 py-1 border rounded-lg mb-1 text-sm" placeholder={`Serial #${i + 1}`} />
                      <select
                        value={formData.serialCities[serialInputs[i]] || formData.location || ''}
                        onChange={e => updateSerialCity(i, e.target.value)}
                        className="w-full px-3 py-1 border rounded-lg text-sm">
                        <option value="">Location</option>
                        {cities.map(city => <option key={city} value={city}>{city}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                {formData.location && (
                  <p className="text-xs text-gray-400 mt-2">
                    💡 City defaults to <strong>{formData.location}</strong> if not changed per-unit.
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-6 border-t">
              <button onClick={handleBack} className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg font-medium transition-colors flex items-center gap-2"><ArrowLeft size={18} />Back</button>
              <button onClick={() => handleNext()}
                className="px-8 py-3 rounded-lg font-semibold text-lg shadow-lg flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 transition-colors">
                Next: Payment <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // WITH COSTING — per-model serial inputs
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={handleBack} className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 shadow-md border">
            <ArrowLeft size={20} /> Back
          </button>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Product Details</h2>
              <p className="text-lg text-gray-600">
                Set sale prices & serial numbers for <span className="font-semibold text-indigo-700">{costingBrandName}</span> models
              </p>
            </div>
          </div>
        </div>
        <ProgressBar />

        <div className="bg-white rounded-lg shadow-sm border p-8 space-y-6">
          {/* Loading / status banner */}
          {isLoadingModels ? (
            <div className="flex items-center gap-3 px-5 py-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
              <span className="text-sm text-indigo-700 font-medium">Fetching models for <strong>{costingBrandName}</strong>...</span>
            </div>
          ) : selectedModels.length === 0 ? (
            <div className="flex items-center gap-3 px-5 py-4 bg-amber-50 border border-amber-200 rounded-lg">
              <Package className="w-5 h-5 text-amber-500" />
              <span className="text-sm text-amber-800">No models loaded. Check that the costing step saved models correctly.</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-5 py-3 bg-green-50 border border-green-200 rounded-lg">
              <Package className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-800">
                <strong>{selectedModels.length} model{selectedModels.length !== 1 ? 's' : ''}</strong> loaded.
                Set the sale price, quantity, and serial numbers for each model below.
              </span>
            </div>
          )}

          {/* Per-model cards */}
          {selectedModels.map((model, modelIdx) => {
            const isExpanded   = expandedModel === model.modelId;
            const filledSerials = model.serialNumbers.filter(s => s.trim() !== '').length;
            const serialError  = validationErrors[`serials_${modelIdx}`];

            return (
              <div key={model.modelId} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-indigo-100 rounded-lg"><Package className="w-5 h-5 text-indigo-600" /></div>
                    <div>
                      <p className="font-semibold text-gray-900">{model.modelName}</p>
                      <p className="text-xs text-gray-500">Cost: PKR {model.costPrice.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 font-medium whitespace-nowrap">Qty:</label>
                      <input type="number" min="1" value={model.quantity}
                        onChange={e => handleUpdateModel(modelIdx, 'quantity', Number(e.target.value))}
                        className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-indigo-300" />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 font-medium whitespace-nowrap">Sale Price:</label>
                      <input type="number" min="0" value={model.salePrice}
                        onChange={e => handleUpdateModel(modelIdx, 'salePrice', Number(e.target.value))}
                        className="w-28 px-2 py-1 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-indigo-300" />
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      filledSerials === model.quantity && model.quantity > 0 ? 'bg-green-100 text-green-700'
                      : filledSerials > 0 ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-500'
                    }`}>
                      {filledSerials}/{model.quantity} serials
                    </div>
                    <button onClick={() => handleRemoveModel(modelIdx)}
                      className="text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-lg transition-colors font-medium">
                      Remove
                    </button>
                    <button
                      onClick={() => setExpandedModel(isExpanded ? null : model.modelId)}
                      className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1.5 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                      <Hash size={14} /> Serials
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-6 py-5 bg-white">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="font-medium text-gray-800 flex items-center gap-2">
                        <Hash className="w-4 h-4 text-indigo-500" />
                        Serial Numbers for <span className="text-indigo-700">{model.modelName}</span>
                        <span className="text-xs text-gray-400 font-normal">({model.quantity} unit{model.quantity !== 1 ? 's' : ''})</span>
                        {formData.location && (
                          <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                            📍 {formData.location}
                          </span>
                        )}
                      </h5>
                      {serialError && <p className="text-red-500 text-xs font-medium">{serialError}</p>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Array.from({ length: model.quantity }, (_, serialIdx) => (
                        <div key={serialIdx} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Unit {serialIdx + 1}</label>
                          <input type="text"
                            value={model.serialNumbers[serialIdx] || ''}
                            onChange={e => handleUpdateSerial(modelIdx, serialIdx, e.target.value)}
                            placeholder={`Serial #${serialIdx + 1}`}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-white mb-2" />
                          <select
                            value={model.serialCities[model.serialNumbers[serialIdx]] || formData.location || ''}
                            onChange={e => handleUpdateSerialCity(modelIdx, serialIdx, e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 bg-white text-gray-600">
                            <option value="">Location (optional)</option>
                            {cities.map(city => <option key={city} value={city}>{city}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                    {formData.location && (
                      <p className="text-xs text-gray-400 mt-2">
                        💡 City pre-filled with <strong>{formData.location}</strong> — change per-unit if needed.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {validationErrors.models && <p className="text-red-500 text-sm">{validationErrors.models}</p>}

          {/* Common fields (includes location for with-costing path) */}
          <div className="border-t pt-6">
            <h4 className="font-semibold text-gray-900 mb-4">Common Details</h4>
            <CommonFields />
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-8 border-t">
            <button onClick={handleBack} className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg hover:bg-gray-200 font-medium transition-colors flex items-center gap-2"><ArrowLeft size={18} />Back to Costing</button>
            <div className="flex items-center gap-4">
              {!isLoadingModels && selectedModels.length === 0 && (
                <p className="text-amber-600 text-sm font-medium">At least one model is required</p>
              )}
              <button
                onClick={() => handleNext(selectedModels)}
                disabled={isLoadingModels || selectedModels.length === 0}
                className={`px-8 py-3 rounded-lg font-semibold text-lg shadow-lg flex items-center gap-2 transition-colors ${
                  !isLoadingModels && selectedModels.length > 0
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}>
                {isLoadingModels
                  ? <><Loader2 size={18} className="animate-spin" /> Loading...</>
                  : <>Next: Payment <ArrowRight size={20} /></>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};