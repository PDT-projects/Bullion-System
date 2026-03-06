// Inventory Module - Component Layer
// BrandModelSelector - Cascading dropdown for Brand and Model selection

import { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { fetchBrands, fetchModelsByBrand, createBrand, createModel, Brand, Model } from '../../../api/dataconnect/brandModelDataConnectService';

interface BrandModelSelectorProps {
  selectedBrandId?: string;
  selectedModelId?: string;
  onBrandChange: (brandId: string, brandName: string) => void;
  onModelChange: (modelId: string, modelName: string, costPrice?: number, sellPrice?: number) => void;
  disabled?: boolean;
}

/**
 * BrandModelSelector - Cascading dropdown for selecting brand and model
 * Fetches data from Firebase Data Connect
 */
export function BrandModelSelector({
  selectedBrandId,
  selectedModelId,
  onBrandChange,
  onModelChange,
  disabled = false
}: BrandModelSelectorProps) {
  // State for brands and models
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  
  // Loading states
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);
  
  // Selected values
  const [currentBrandId, setCurrentBrandId] = useState<string>(selectedBrandId || '');
  const [currentModelId, setCurrentModelId] = useState<string>(selectedModelId || '');
  
  // New brand/model input states
  const [showNewBrand, setShowNewBrand] = useState(false);
  const [showNewModel, setShowNewModel] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newModelName, setNewModelName] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);

  // Fetch brands on mount
  useEffect(() => {
    loadBrands();
  }, []);

  // Fetch models when brand changes
  useEffect(() => {
    if (currentBrandId) {
      loadModels(currentBrandId);
    } else {
      setModels([]);
    }
    setCurrentModelId('');
  }, [currentBrandId]);

  // Load brands from Firebase Data Connect
  const loadBrands = async () => {
    setLoadingBrands(true);
    setError(null);
    try {
      const fetchedBrands = await fetchBrands();
      setBrands(fetchedBrands);
    } catch (err) {
      console.error('Error loading brands:', err);
      setError('Failed to load brands');
    } finally {
      setLoadingBrands(false);
    }
  };

  // Load models for selected brand
  const loadModels = async (brandId: string) => {
    setLoadingModels(true);
    setError(null);
    try {
      const fetchedModels = await fetchModelsByBrand(brandId);
      setModels(fetchedModels);
    } catch (err) {
      console.error('Error loading models:', err);
      setError('Failed to load models');
    } finally {
      setLoadingModels(false);
    }
  };

  // Handle brand selection
  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const brandId = e.target.value;
    setCurrentBrandId(brandId);
    
    if (brandId) {
      const selectedBrand = brands.find(b => b.id === brandId);
      if (selectedBrand) {
        onBrandChange(brandId, selectedBrand.name);
      }
    } else {
      onBrandChange('', '');
    }
    
    // Reset model selection
    setCurrentModelId('');
    onModelChange('', '');
  };

  // Handle model selection
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const modelId = e.target.value;
    setCurrentModelId(modelId);
    
    if (modelId) {
      const selectedModel = models.find(m => m.id === modelId);
      if (selectedModel) {
        // Pass model data including costPrice and sellPrice
        onModelChange(modelId, selectedModel.name, selectedModel.costPrice, selectedModel.sellPrice);
      }
    } else {
      onModelChange('', '');
    }
  };

  // Create new brand
  const handleCreateBrand = async () => {
    if (!newBrandName.trim()) return;
    
    setSaving(true);
    setError(null);
    try {
      const newBrand = await createBrand({ name: newBrandName.trim() });
      if (newBrand) {
        setBrands([...brands, newBrand]);
        setCurrentBrandId(newBrand.id);
        onBrandChange(newBrand.id, newBrand.name);
        setNewBrandName('');
        setShowNewBrand(false);
        
        // Also prompt to create a model
        setShowNewModel(true);
      }
    } catch (err) {
      console.error('Error creating brand:', err);
      setError('Failed to create brand');
    } finally {
      setSaving(false);
    }
  };

  // Create new model
  const handleCreateModel = async () => {
    if (!newModelName.trim() || !currentBrandId) return;
    
    setSaving(true);
    setError(null);
    try {
      const newModel = await createModel({ 
        name: newModelName.trim(), 
        brandId: currentBrandId 
      });
      if (newModel) {
        const updatedModels = [...models, newModel];
        setModels(updatedModels);
        setCurrentModelId(newModel.id);
        onModelChange(newModel.id, newModel.name);
        setNewModelName('');
        setShowNewModel(false);
      }
    } catch (err) {
      console.error('Error creating model:', err);
      setError('Failed to create model');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      
      {/* Brand Dropdown */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Brand *
          </label>
          <button
            type="button"
            onClick={() => setShowNewBrand(!showNewBrand)}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            disabled={disabled}
          >
            <Plus size={14} />
            Add New Brand
          </button>
        </div>
        
        {loadingBrands ? (
          <div className="flex items-center gap-2 text-gray-500 py-2">
            <Loader2 className="animate-spin h-4 w-4" />
            <span className="text-sm">Loading brands...</span>
          </div>
        ) : (
          <select
            value={currentBrandId}
            onChange={handleBrandChange}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="">Select a brand</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        )}
        
        {/* New Brand Input */}
        {showNewBrand && (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              placeholder="Enter brand name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={saving}
            />
            <button
              type="button"
              onClick={handleCreateBrand}
              disabled={saving || !newBrandName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="animate-spin h-4 w-4" /> : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => setShowNewBrand(false)}
              disabled={saving}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Model Dropdown */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Model *
          </label>
          <button
            type="button"
            onClick={() => setShowNewModel(!showNewModel)}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            disabled={disabled || !currentBrandId}
          >
            <Plus size={14} />
            Add New Model
          </button>
        </div>
        
        {!currentBrandId ? (
          <div className="text-sm text-gray-500 py-2">
            Please select a brand first
          </div>
        ) : loadingModels ? (
          <div className="flex items-center gap-2 text-gray-500 py-2">
            <Loader2 className="animate-spin h-4 w-4" />
            <span className="text-sm">Loading models...</span>
          </div>
        ) : (
          <select
            value={currentModelId}
            onChange={handleModelChange}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="">Select a model</option>
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        )}
        
        {/* New Model Input */}
        {showNewModel && currentBrandId && (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={newModelName}
              onChange={(e) => setNewModelName(e.target.value)}
              placeholder="Enter model name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={saving}
            />
            <button
              type="button"
              onClick={handleCreateModel}
              disabled={saving || !newModelName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="animate-spin h-4 w-4" /> : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => setShowNewModel(false)}
              disabled={saving}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Selected Info */}
      {currentBrandId && currentModelId && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>Selected:</strong>{' '}
            {brands.find(b => b.id === currentBrandId)?.name} -{' '}
            {models.find(m => m.id === currentModelId)?.name}
          </p>
        </div>
      )}
    </div>
  );
}

