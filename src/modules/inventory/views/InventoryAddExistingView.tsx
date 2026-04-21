// Inventory Module - View Layer
// InventoryAddExistingView

import React from 'react';
import { Search, Package, ArrowLeft, Loader2, Plus, Hash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UseInventoryAddExistingViewModelReturn } from '../viewModels/useInventoryAddExistingViewModel';

interface Props extends UseInventoryAddExistingViewModelReturn {}

export const InventoryAddExistingView: React.FC<Props> = ({
  isLoading, error,
  searchTerm, setSearchTerm, filteredProducts,
  selectedProduct, selectProduct,
  entry, setAddQty, setNewSerial, setNewSerialCity, setNewSellPrice, setNewCostPrice,
  handleSave, isSaving,
  cities, formatCurrency,
}) => {
  const navigate = useNavigate();

  const grouped = filteredProducts.reduce<Record<string, typeof filteredProducts>>((acc, p) => {
    const key = p.brandName || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8,
    fontSize: 13, outline: 'none', color: '#111827', backgroundColor: '#fff', boxSizing: 'border-box',
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={36} color="#6366f1" style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
          <p style={{ fontSize: 13, color: '#6b7280' }}>Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 20, color: '#dc2626', fontSize: 13 }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', backgroundColor: '#f8fafc' }}>

      {/* Header */}
      <div style={{ flexShrink: 0, backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/inventory')}
            style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0 }}
          >
            <ArrowLeft size={17} />
          </button>
          <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Package size={17} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Add to Existing Inventory</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Select a product to add units, update prices, or add serial numbers</div>
          </div>
        </div>
      </div>

      {/* Body — two columns */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '340px 1fr', overflow: 'hidden' }}>

        {/* LEFT — product list */}
        <div style={{ borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', backgroundColor: '#fff', overflow: 'hidden' }}>
          {/* Search */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} color="#9ca3af" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search brand, model, category..."
                style={{ ...inp, paddingLeft: 32, borderRadius: 8 }}
              />
            </div>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredProducts.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 10 }}>
                <Package size={32} color="#d1d5db" />
                <p style={{ fontSize: 13, color: '#9ca3af' }}>No products found</p>
              </div>
            ) : (
              Object.entries(grouped).map(([brand, prods]) => (
                <div key={brand}>
                  <div style={{ padding: '8px 16px', backgroundColor: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Package size={12} color="#6366f1" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{brand}</span>
                  </div>
                  {prods.map(product => {
                    const sel = selectedProduct?.id === product.id;
                    return (
                      <button
                        key={product.id}
                        onClick={() => selectProduct(product)}
                        style={{
                          width: '100%', textAlign: 'left', padding: '10px 16px', cursor: 'pointer', border: 'none',
                          borderBottom: '1px solid #f8fafc',
                          backgroundColor: sel ? '#eef2ff' : '#fff',
                          borderLeft: sel ? '3px solid #4f46e5' : '3px solid transparent',
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 600, color: sel ? '#3730a3' : '#111827' }}>{product.modelName}</div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 3 }}>
                          <span style={{ fontSize: 11, color: '#6b7280' }}>Stock: {product.stock}</span>
                          {product.location && <span style={{ fontSize: 11, color: '#6366f1' }}>📍 {product.location}</span>}
                          <span style={{ fontSize: 11, color: '#9ca3af' }}>{formatCurrency(product.sellPrice)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT — edit panel */}
        <div style={{ overflowY: 'auto', padding: 24, backgroundColor: '#f8fafc' }}>
          {!selectedProduct || !entry ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10 }}>
              <Package size={40} color="#d1d5db" />
              <p style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>Select a product to continue</p>
            </div>
          ) : (
            <div style={{ maxWidth: 560, margin: '0 auto' }}>

              {/* Banner */}
              <div style={{ backgroundColor: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#3730a3' }}>{entry.brandName} — {entry.modelName}</div>
                <div style={{ fontSize: 11, color: '#6366f1', marginTop: 2 }}>Current stock: {entry.currentStock} units</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Units to Add */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Units to Add *</label>
                  <input type="number" value={entry.addQty} onChange={e => setAddQty(Number(e.target.value))} style={inp} min={1} />
                </div>

                {/* Prices */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Updated Sell Price (PKR)</label>
                    <input type="number" value={entry.newSellPrice || ''} onChange={e => setNewSellPrice(Number(e.target.value))} style={inp} min={0} placeholder="0" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Updated Cost Price (PKR)</label>
                    <input type="number" value={entry.newCostPrice || ''} onChange={e => setNewCostPrice(Number(e.target.value))} style={inp} min={0} placeholder="0" />
                  </div>
                </div>

                {/* Serials */}
                {entry.addQty > 0 && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                      <Hash size={14} color="#6366f1" />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Serial Numbers ({entry.addQty} required)</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 260, overflowY: 'auto' }}>
                      {Array.from({ length: entry.addQty }, (_, i) => (
                        <div key={i} style={{ backgroundColor: '#fff', borderRadius: 8, padding: '12px 14px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unit {i + 1}</label>
                          <input type="text" value={entry.newSerials[i] || ''} onChange={e => setNewSerial(i, e.target.value)} placeholder={`Serial #${i + 1}`} style={inp} />
                          <select
                            value={entry.newSerials[i] ? entry.newSerialCities[entry.newSerials[i]] || '' : ''}
                            onChange={e => setNewSerialCity(i, e.target.value)}
                            style={inp}
                          >
                            <option value="">Select location (optional)</option>
                            {cities.map(city => <option key={city} value={city}>{city}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Save */}
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '12px 20px', borderRadius: 10, border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer',
                    backgroundColor: '#16a34a', color: '#fff', fontWeight: 700, fontSize: 14,
                    boxShadow: '0 2px 8px rgba(22,163,74,0.35)', opacity: isSaving ? 0.7 : 1, transition: 'all 0.2s',
                  }}
                >
                  {isSaving ? (
                    <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
                  ) : (
                    <><Plus size={16} /> Add {entry.addQty} Unit{entry.addQty > 1 ? 's' : ''} to Stock</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};