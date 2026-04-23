// Inventory Module - Component Layer
// BrandModelSelector.tsx
// Smart brand + model dropdowns that:
//   - Load from Firestore via BrandModelService (auto-seeds 33 brands on first use)
//   - Show "➕ Add new brand…" / "➕ Add new model…" at the bottom of each dropdown
//   - New entries are saved to Firestore immediately and appear in the list
//   - onBrandChange / onModelChange callbacks update the parent form
//   - Supports edit mode via initialBrandId / initialModelId props

import { useState, useEffect, useRef } from 'react';
import { Loader2, Check, ChevronDown } from 'lucide-react';
import { fetchBrands, addBrand, addModel, BrandModel, ModelEntry } from '../models/BrandModelService';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface BrandModelSelectorProps {
  initialBrandId?: string;
  initialModelId?: string;
  onBrandChange: (brandId: string, brandName: string) => void;
  onModelChange: (modelId: string, modelName: string, costPrice?: number, sellPrice?: number) => void;
  brandError?: string;
  modelError?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const ADD_NEW_VALUE = '__ADD_NEW__';

const SEL_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '10px 36px 10px 12px',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  fontSize: 14,
  color: '#111827',
  backgroundColor: '#fff',
  appearance: 'none',
  outline: 'none',
  cursor: 'pointer',
  backgroundImage: 'none',
};

const BTN_PRIMARY: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  padding: '8px 14px',
  borderRadius: 8,
  border: 'none',
  backgroundColor: '#4f46e5',
  color: '#fff',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
};

const BTN_CANCEL: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  backgroundColor: '#fff',
  cursor: 'pointer',
  fontSize: 13,
  color: '#374151',
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function BrandModelSelector({
  initialBrandId,
  initialModelId,
  onBrandChange,
  onModelChange,
  brandError,
  modelError,
}: BrandModelSelectorProps) {

  // ── Data state ──────────────────────────────────────────────────────────────
  const [brands, setBrands]                   = useState<BrandModel[]>([]);
  const [isLoading, setIsLoading]             = useState(true);
  const [selectedBrandId, setSelectedBrandId] = useState(initialBrandId || '');
  const [selectedModelId, setSelectedModelId] = useState(initialModelId || '');

  // ── "Add new" inline form state ─────────────────────────────────────────────
  const [addingBrand, setAddingBrand]     = useState(false);
  const [addingModel, setAddingModel]     = useState(false);
  const [newBrandName, setNewBrandName]   = useState('');
  const [newModelName, setNewModelName]   = useState('');
  const [isSavingBrand, setIsSavingBrand] = useState(false);
  const [isSavingModel, setIsSavingModel] = useState(false);

  const brandInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);

  // ── Load brands from Firestore (seeds on first call if collection is empty) ─
  useEffect(() => {
    setIsLoading(true);
    fetchBrands()
      .then(data => {
        setBrands(data);
        // Pre-select in edit mode
        if (initialBrandId) {
          const brand = data.find(b => b.id === initialBrandId);
          if (brand) onBrandChange(brand.id, brand.name);
        }
        if (initialBrandId && initialModelId) {
          const brand = data.find(b => b.id === initialBrandId);
          const model = brand?.models.find(m => m.id === initialModelId);
          if (model) onModelChange(model.id, model.name, model.costPrice, model.sellPrice);
        }
      })
      .catch(() => toast.error('Failed to load brands'))
      .finally(() => setIsLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-focus inline inputs when they appear
  useEffect(() => { if (addingBrand) brandInputRef.current?.focus(); }, [addingBrand]);
  useEffect(() => { if (addingModel) modelInputRef.current?.focus(); }, [addingModel]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const selectedBrand = brands.find(b => b.id === selectedBrandId) ?? null;
  const modelList     = selectedBrand?.models ?? [];
  const selectedModel = modelList.find(m => m.id === selectedModelId) ?? null;

  // ── Brand handlers ───────────────────────────────────────────────────────────
  const handleBrandChange = (value: string) => {
    if (value === ADD_NEW_VALUE) {
      setAddingBrand(true);
      setNewBrandName('');
      return;
    }
    setSelectedBrandId(value);
    setSelectedModelId('');
    const brand = brands.find(b => b.id === value);
    if (brand) onBrandChange(brand.id, brand.name);
    else       onBrandChange('', '');
  };

  const handleSaveNewBrand = async () => {
    const name = newBrandName.trim();
    if (!name) return;
    setIsSavingBrand(true);
    try {
      const created = await addBrand(name);
      setBrands(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedBrandId(created.id);
      setSelectedModelId('');
      onBrandChange(created.id, created.name);
      setAddingBrand(false);
      setNewBrandName('');
      toast.success(`Brand "${created.name}" added`);
    } catch {
      toast.error('Failed to save brand');
    } finally {
      setIsSavingBrand(false);
    }
  };

  // ── Model handlers ───────────────────────────────────────────────────────────
  const handleModelChange = (value: string) => {
    if (value === ADD_NEW_VALUE) {
      setAddingModel(true);
      setNewModelName('');
      return;
    }
    setSelectedModelId(value);
    const model = modelList.find(m => m.id === value);
    if (model) onModelChange(model.id, model.name, model.costPrice, model.sellPrice);
    else       onModelChange('', '');
  };

  const handleSaveNewModel = async () => {
    const name = newModelName.trim();
    if (!name || !selectedBrandId) return;
    setIsSavingModel(true);
    try {
      const created = await addModel(selectedBrandId, name);
      setBrands(prev =>
        prev.map(b =>
          b.id === selectedBrandId
            ? { ...b, models: [...b.models, created].sort((a, b) => a.name.localeCompare(b.name)) }
            : b
        )
      );
      setSelectedModelId(created.id);
      onModelChange(created.id, created.name);
      setAddingModel(false);
      setNewModelName('');
      toast.success(`Model "${created.name}" added`);
    } catch {
      toast.error('Failed to save model');
    } finally {
      setIsSavingModel(false);
    }
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', border: '1px solid #e5e7eb',
        borderRadius: 8, backgroundColor: '#f9fafb',
      }}>
        <Loader2 size={16} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: 13, color: '#6b7280' }}>Loading brands…</span>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── Brand ─────────────────────────────────────────────────────────────── */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
          Brand *
        </label>

        {addingBrand ? (
          /* Inline: add new brand */
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              ref={brandInputRef}
              type="text"
              value={newBrandName}
              onChange={e => setNewBrandName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter')  handleSaveNewBrand();
                if (e.key === 'Escape') { setAddingBrand(false); setNewBrandName(''); }
              }}
              placeholder="Enter new brand name…"
              style={{
                flex: 1, padding: '10px 12px',
                border: '2px solid #6366f1', borderRadius: 8,
                fontSize: 14, outline: 'none',
              }}
            />
            <button
              onClick={handleSaveNewBrand}
              disabled={isSavingBrand || !newBrandName.trim()}
              style={{
                ...BTN_PRIMARY,
                backgroundColor: isSavingBrand || !newBrandName.trim() ? '#a5b4fc' : '#4f46e5',
                cursor: isSavingBrand || !newBrandName.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {isSavingBrand
                ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                : <Check size={14} />}
              Save
            </button>
            <button
              onClick={() => { setAddingBrand(false); setNewBrandName(''); }}
              style={BTN_CANCEL}
            >
              Cancel
            </button>
          </div>
        ) : (
          /* Brand dropdown */
          <div style={{ position: 'relative' }}>
            <select
              value={selectedBrandId}
              onChange={e => handleBrandChange(e.target.value)}
              style={{ ...SEL_STYLE, borderColor: brandError ? '#ef4444' : '#d1d5db' }}
            >
              <option value="">— Select brand —</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
              <option value={ADD_NEW_VALUE}>➕ Add new brand…</option>
            </select>
            <ChevronDown
              size={16}
              style={{
                position: 'absolute', right: 10, top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none', color: '#6b7280',
              }}
            />
          </div>
        )}

        {brandError && (
          <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{brandError}</p>
        )}
      </div>

      {/* ── Model — only shown once a brand is selected ────────────────────────── */}
      {selectedBrandId && !addingBrand && (
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
            Model *
          </label>

          {addingModel ? (
            /* Inline: add new model */
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                ref={modelInputRef}
                type="text"
                value={newModelName}
                onChange={e => setNewModelName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter')  handleSaveNewModel();
                  if (e.key === 'Escape') { setAddingModel(false); setNewModelName(''); }
                }}
                placeholder={`New model for ${selectedBrand?.name}…`}
                style={{
                  flex: 1, padding: '10px 12px',
                  border: '2px solid #6366f1', borderRadius: 8,
                  fontSize: 14, outline: 'none',
                }}
              />
              <button
                onClick={handleSaveNewModel}
                disabled={isSavingModel || !newModelName.trim()}
                style={{
                  ...BTN_PRIMARY,
                  backgroundColor: isSavingModel || !newModelName.trim() ? '#a5b4fc' : '#4f46e5',
                  cursor: isSavingModel || !newModelName.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {isSavingModel
                  ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  : <Check size={14} />}
                Save
              </button>
              <button
                onClick={() => { setAddingModel(false); setNewModelName(''); }}
                style={BTN_CANCEL}
              >
                Cancel
              </button>
            </div>
          ) : (
            /* Model dropdown */
            <div style={{ position: 'relative' }}>
              <select
                value={selectedModelId}
                onChange={e => handleModelChange(e.target.value)}
                style={{ ...SEL_STYLE, borderColor: modelError ? '#ef4444' : '#d1d5db' }}
              >
                <option value="">— Select model —</option>
                {modelList.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
                <option value={ADD_NEW_VALUE}>➕ Add new model…</option>
              </select>
              <ChevronDown
                size={16}
                style={{
                  position: 'absolute', right: 10, top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none', color: '#6b7280',
                }}
              />
            </div>
          )}

          {modelError && (
            <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{modelError}</p>
          )}

          {/* Selected model confirmation pill */}
          {selectedModel && !addingModel && (
            <div style={{
              marginTop: 6, padding: '6px 10px',
              backgroundColor: '#eef2ff', borderRadius: 6,
              fontSize: 12, color: '#4338ca', fontWeight: 600,
            }}>
              ✓ {selectedBrand?.name} — {selectedModel.name}
              {(selectedModel.costPrice || selectedModel.sellPrice) && (
                <span style={{ marginLeft: 8, fontWeight: 400, color: '#6366f1' }}>
                  {selectedModel.costPrice ? `Cost: PKR ${selectedModel.costPrice.toLocaleString()}` : ''}
                  {selectedModel.costPrice && selectedModel.sellPrice ? ' · ' : ''}
                  {selectedModel.sellPrice ? `Sell: PKR ${selectedModel.sellPrice.toLocaleString()}` : ''}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}