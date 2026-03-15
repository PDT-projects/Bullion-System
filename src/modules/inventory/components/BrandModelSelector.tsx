// Inventory Module - Component
// BrandModelSelector - Cascading dropdown for Brand and Model selection
// Fetches brands/models from Firestore via BrandModelFirebaseService

import { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { BrandModelFirebaseService, BrandDoc, ModelDoc } from '../models/InventoryFirebaseService';

interface BrandModelSelectorProps {
  selectedBrandId?: string;
  selectedModelId?: string;
  onBrandChange: (brandId: string, brandName: string) => void;
  onModelChange: (modelId: string, modelName: string, costPrice?: number, sellPrice?: number) => void;
  disabled?: boolean;
}

export function BrandModelSelector({
  selectedBrandId, selectedModelId,
  onBrandChange, onModelChange, disabled = false
}: BrandModelSelectorProps) {
  const [brands, setBrands] = useState<BrandDoc[]>([]);
  const [models, setModels] = useState<ModelDoc[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);
  const [currentBrandId, setCurrentBrandId] = useState(selectedBrandId || '');
  const [currentModelId, setCurrentModelId] = useState(selectedModelId || '');
  const [showNewBrand, setShowNewBrand] = useState(false);
  const [showNewModel, setShowNewModel] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newModelName, setNewModelName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadBrands(); }, []);
  useEffect(() => {
    if (currentBrandId) loadModels(currentBrandId);
    else setModels([]);
    setCurrentModelId('');
  }, [currentBrandId]);

  const loadBrands = async () => {
    setLoadingBrands(true); setError(null);
    try {
      const fetched = await BrandModelFirebaseService.fetchAllBrands();
      setBrands(fetched);
      if (selectedBrandId) {
        const match = fetched.find(b => b.id === selectedBrandId);
        if (match) { setCurrentBrandId(match.id); onBrandChange(match.id, match.name); }
      }
    } catch { setError('Failed to load brands'); }
    finally { setLoadingBrands(false); }
  };

  const loadModels = async (brandId: string) => {
    setLoadingModels(true); setError(null);
    try {
      const fetched = await BrandModelFirebaseService.fetchModelsByBrand(brandId);
      setModels(fetched);
      if (selectedModelId) {
        const match = fetched.find(m => m.id === selectedModelId);
        if (match) { setCurrentModelId(match.id); onModelChange(match.id, match.name, match.costPrice, match.sellPrice); }
      }
    } catch { setError('Failed to load models'); }
    finally { setLoadingModels(false); }
  };

  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const brandId = e.target.value;
    setCurrentBrandId(brandId);
    if (brandId) { const b = brands.find(b => b.id === brandId); if (b) onBrandChange(brandId, b.name); }
    else onBrandChange('', '');
    setCurrentModelId(''); onModelChange('', '');
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const modelId = e.target.value;
    setCurrentModelId(modelId);
    if (modelId) { const m = models.find(m => m.id === modelId); if (m) onModelChange(modelId, m.name, m.costPrice, m.sellPrice); }
    else onModelChange('', '');
  };

  const handleCreateBrand = async () => {
    if (!newBrandName.trim()) return;
    setSaving(true); setError(null);
    try {
      const newBrand = await BrandModelFirebaseService.createBrand(newBrandName.trim());
      setBrands(prev => [...prev, newBrand]);
      setCurrentBrandId(newBrand.id);
      onBrandChange(newBrand.id, newBrand.name);
      setNewBrandName(''); setShowNewBrand(false); setShowNewModel(true);
    } catch { setError('Failed to create brand'); }
    finally { setSaving(false); }
  };

  const handleCreateModel = async () => {
    if (!newModelName.trim() || !currentBrandId) return;
    setSaving(true); setError(null);
    try {
      const newModel = await BrandModelFirebaseService.createModel(currentBrandId, newModelName.trim());
      setModels(prev => [...prev, newModel]);
      setCurrentModelId(newModel.id);
      onModelChange(newModel.id, newModel.name, newModel.costPrice, newModel.sellPrice);
      setNewModelName(''); setShowNewModel(false);
    } catch { setError('Failed to create model'); }
    finally { setSaving(false); }
  };

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100';

  return (
    <div className="space-y-4">
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

      {/* Brand */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">Brand *</label>
          <button type="button" onClick={() => setShowNewBrand(!showNewBrand)}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1" disabled={disabled}>
            <Plus size={14} /> Add New Brand
          </button>
        </div>
        {loadingBrands ? (
          <div className="flex items-center gap-2 text-gray-500 py-2">
            <Loader2 className="animate-spin h-4 w-4" /><span className="text-sm">Loading brands...</span>
          </div>
        ) : (
          <select value={currentBrandId} onChange={handleBrandChange} disabled={disabled} className={inputCls}>
            <option value="">Select a brand</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
        {showNewBrand && (
          <div className="mt-2 flex gap-2">
            <input type="text" value={newBrandName} onChange={e => setNewBrandName(e.target.value)}
              placeholder="Enter brand name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={saving} />
            <button type="button" onClick={handleCreateBrand} disabled={saving || !newBrandName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              {saving ? <Loader2 className="animate-spin h-4 w-4" /> : 'Add'}
            </button>
            <button type="button" onClick={() => setShowNewBrand(false)} disabled={saving}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Cancel</button>
          </div>
        )}
      </div>

      {/* Model */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">Model *</label>
          <button type="button" onClick={() => setShowNewModel(!showNewModel)}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            disabled={disabled || !currentBrandId}>
            <Plus size={14} /> Add New Model
          </button>
        </div>
        {!currentBrandId
          ? <div className="text-sm text-gray-500 py-2">Please select a brand first</div>
          : loadingModels
            ? <div className="flex items-center gap-2 text-gray-500 py-2"><Loader2 className="animate-spin h-4 w-4" /><span className="text-sm">Loading models...</span></div>
            : <select value={currentModelId} onChange={handleModelChange} disabled={disabled} className={inputCls}>
                <option value="">Select a model</option>
                {models.map(m => <option key={m.id} value={m.id}>{m.name}{m.costPrice ? ` — PKR ${m.costPrice.toLocaleString()}` : ''}</option>)}
              </select>
        }
        {showNewModel && currentBrandId && (
          <div className="mt-2 flex gap-2">
            <input type="text" value={newModelName} onChange={e => setNewModelName(e.target.value)}
              placeholder="Enter model name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={saving} />
            <button type="button" onClick={handleCreateModel} disabled={saving || !newModelName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              {saving ? <Loader2 className="animate-spin h-4 w-4" /> : 'Add'}
            </button>
            <button type="button" onClick={() => setShowNewModel(false)} disabled={saving}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Cancel</button>
          </div>
        )}
      </div>

      {currentBrandId && currentModelId && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>Selected:</strong> {brands.find(b => b.id === currentBrandId)?.name} — {models.find(m => m.id === currentModelId)?.name}
          </p>
        </div>
      )}
    </div>
  );
}