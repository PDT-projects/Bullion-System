// Inventory Module - View Layer
// CreateInventoryView - Multi-step wizard for creating new products

import { ArrowLeft, ArrowRight, Check, Plus, Trash2 } from 'lucide-react';
import { ProductFormData, ValidationResult, InventoryEntryStep } from '../models/types';
import { InventoryService } from '../models/inventoryService';
import { BrandModelSelector } from '../components/BrandModelSelector';

interface CreateInventoryViewProps {
  formData: ProductFormData;
  currentStep: InventoryEntryStep;
  validation: ValidationResult;
  isSubmitting: boolean;
  serialInput: string;
  serialCity: string;
  setField: (field: string, value: any) => void;
  setCurrentStep: (step: InventoryEntryStep) => void;
  setSerialInput: (value: string) => void;
  setSerialCity: (value: string) => void;
  addSerialNumber: () => void;
  removeSerialNumber: (serial: string) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  handleSubmit: () => void;
  handleCancel: () => void;
}

export function CreateInventoryView({
  formData, currentStep, validation, isSubmitting,
  serialInput, serialCity,
  setField, setSerialInput, setSerialCity,
  addSerialNumber, removeSerialNumber,
  goToNextStep, goToPreviousStep, handleSubmit, handleCancel,
}: CreateInventoryViewProps) {
  const steps = [
    { id: 'details', label: 'Product Details', number: 1 },
    { id: 'payment', label: 'Payment Info', number: 2 },
    { id: 'confirmation', label: 'Confirmation', number: 3 },
  ];

  const currentIdx = steps.findIndex(s => s.id === currentStep);

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${currentStep === step.id ? 'bg-indigo-600 text-white' : currentIdx > index ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
            {currentIdx > index ? <Check size={20} /> : step.number}
          </div>
          <span className={`ml-2 mr-4 text-sm font-medium ${currentStep === step.id ? 'text-[#4f46e5]' : 'text-gray-500'}`}>{step.label}</span>
          {index < steps.length - 1 && <div className={`w-12 h-0.5 mx-2 ${currentIdx > index ? 'bg-green-600' : 'bg-gray-200'}`} />}
        </div>
      ))}
    </div>
  );

  const renderProductDetailsStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Brand & Model *</label>
          <BrandModelSelector
            onBrandChange={(brandId, brandName) => { setField('brandId', brandId); setField('brandName', brandName); }}
            onModelChange={(modelId, modelName, costPrice, sellPrice) => {
              setField('modelId', modelId); setField('modelName', modelName);
              if (sellPrice && sellPrice > 0) setField('sellPrice', sellPrice);
              if (costPrice && costPrice > 0) setField('costPrice', costPrice);
            }}
          />
          {(validation.fieldErrors?.brandName || validation.fieldErrors?.modelName) && (
            <p className="text-red-500 text-sm mt-1">Please select a brand and model</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
          <input type="text" value={formData.category || ''} onChange={e => setField('category', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${validation.fieldErrors?.category ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter category" />
          {validation.fieldErrors?.category && <p className="text-red-500 text-sm mt-1">{validation.fieldErrors.category}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Buy Type</label>
          <select value={formData.buyType || 'Import'} onChange={e => setField('buyType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="Import">Import</option><option value="Export">Export</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price *</label>
          <input type="number" value={formData.costPrice || ''} onChange={e => setField('costPrice', Number(e.target.value))}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${validation.fieldErrors?.costPrice ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter cost price" />
          {validation.fieldErrors?.costPrice && <p className="text-red-500 text-sm mt-1">{validation.fieldErrors.costPrice}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sell Price *</label>
          <input type="number" value={formData.sellPrice || ''} onChange={e => setField('sellPrice', Number(e.target.value))}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${validation.fieldErrors?.sellPrice ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter sell price" />
          {validation.fieldErrors?.sellPrice && <p className="text-red-500 text-sm mt-1">{validation.fieldErrors.sellPrice}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Warranty (Years)</label>
          <input type="number" value={formData.warrantyYears || ''} onChange={e => setField('warrantyYears', Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter warranty years" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={formData.description || ''} onChange={e => setField('description', e.target.value)} rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter product description" />
        </div>
      </div>

      {/* Serial Numbers */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-lg font-medium mb-4">Serial Numbers</h4>
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <input type="text" value={serialInput} onChange={e => setSerialInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addSerialNumber())}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter serial number" />
          </div>
          <div className="w-48">
            <input type="text" value={serialCity} onChange={e => setSerialCity(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addSerialNumber())}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="City (optional)" />
          </div>
          <button onClick={addSerialNumber} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors flex items-center gap-2 font-semibold">
            <Plus size={18} />Add
          </button>
        </div>
        {validation.fieldErrors?.serialNumbers && <p className="text-red-500 text-sm mb-4">{validation.fieldErrors.serialNumbers}</p>}
        {formData.serialNumbers && formData.serialNumbers.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{formData.serialNumbers.length} serial(s) added</span>
              <span className="text-sm text-gray-500">Stock: {formData.stock} units</span>
            </div>
            <div className="space-y-2">
              {formData.serialNumbers.map((serial, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm">{serial}</span>
                    {formData.serialCities?.[serial] && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{formData.serialCities[serial]}</span>}
                  </div>
                  <button onClick={() => removeSerialNumber(serial)} className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
          <select value={formData.paymentMethod || ''} onChange={e => setField('paymentMethod', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select payment method</option>
            <option value="Cash">Cash</option><option value="Bank">Bank Transfer</option>
            <option value="Cheque">Cheque</option><option value="Credit">Credit</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount</label>
          <input type="number" value={formData.paymentAmount || ''} onChange={e => setField('paymentAmount', Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter payment amount" />
        </div>
      </div>
      <div className="bg-gray-50 rounded-lg p-4 mt-6">
        <h4 className="font-medium mb-3">Product Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Product:</span><p className="font-medium">{formData.brandName} {formData.modelName}</p></div>
          <div><span className="text-gray-500">Category:</span><p className="font-medium">{formData.category}</p></div>
          <div><span className="text-gray-500">Stock:</span><p className="font-medium">{formData.stock} units</p></div>
          <div><span className="text-gray-500">Total Cost:</span><p className="font-medium">{InventoryService.formatCurrency((formData.costPrice || 0) * (formData.stock || 0))}</p></div>
        </div>
      </div>
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><Check className="w-8 h-8 text-green-600" /></div>
      <h3 className="text-xl font-bold mb-2">Ready to Create Product</h3>
      <p className="text-gray-600 mb-6">Please review the information and click Create to add the product to inventory.</p>
      <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto text-left">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Product:</span><span className="font-medium">{formData.brandName} {formData.modelName}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Category:</span><span className="font-medium">{formData.category}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Stock:</span><span className="font-medium">{formData.stock} units</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Cost Price:</span><span className="font-medium">{InventoryService.formatCurrency(formData.costPrice || 0)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Sell Price:</span><span className="font-medium">{InventoryService.formatCurrency(formData.sellPrice || 0)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Payment:</span><span className="font-medium">{formData.paymentMethod}</span></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={handleCancel} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ArrowLeft size={24} /></button>
          <div>
            <h2 className="text-2xl font-bold">Create New Inventory</h2>
            <p className="text-sm text-gray-600">Add a new product to your inventory</p>
          </div>
        </div>
        {renderStepIndicator()}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {currentStep === 'details' && renderProductDetailsStep()}
          {currentStep === 'payment' && renderPaymentStep()}
          {currentStep === 'confirmation' && renderConfirmationStep()}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button onClick={currentStep === 'details' ? handleCancel : goToPreviousStep}
              className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
              <ArrowLeft size={18} />{currentStep === 'details' ? 'Cancel' : 'Back'}
            </button>
            {currentStep !== 'confirmation' ? (
              <button onClick={goToNextStep} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors flex items-center gap-2 font-semibold">
                Next<ArrowRight size={18} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={isSubmitting}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50">
                {isSubmitting ? 'Creating...' : 'Create Product'}<Check size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}