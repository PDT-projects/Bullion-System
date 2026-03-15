// Inventory Module - Component
// CostingTable - Dynamic table for managing multiple models in multi-model costing

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { CostingModel } from '../models/types';

interface CostingTableProps {
  models: CostingModel[];
  onAddModel: () => void;
  onUpdateModelField: (modelId: string, field: keyof CostingModel, value: string | number) => void;
  onRemoveModel: (modelId: string) => void;
}

export function CostingTable({ models, onAddModel, onUpdateModelField, onRemoveModel }: CostingTableProps) {
  const fmt = (n?: number) => (n ?? 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Header */}
      <div style={{ backgroundColor: '#fef3c7', padding: 16, borderRadius: 8, border: '2px solid #f59e0b', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Model Costing Details</h3>
        <button type="button" onClick={onAddModel}
          style={{ backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold', fontSize: 18, padding: '16px 32px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12, border: 'none', cursor: 'pointer' }}>
          <Plus size={28} /> Add Model
        </button>
      </div>

      {models.length === 0 ? (
        <div style={{ backgroundColor: '#f9fafb', padding: 32, textAlign: 'center', borderRadius: 8, border: '2px dashed #d1d5db' }}>
          <p style={{ color: '#6b7280', marginBottom: 8, fontSize: 16 }}>No models added yet</p>
          <p style={{ color: '#9ca3af', fontSize: 14 }}>Click "Add Model" to add your first model</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', maxHeight: 500, overflowY: 'auto' }}>
          <table style={{ width: '100%', minWidth: 1800, borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                {['Model Name','Units','Unit Cost (USD)','Total (USD)','% Weight','Custom/Model','Custom/Unit','Freight/Model','Freight/Unit','Cost PKR','Landed Cost','Inventory Value','Actions']
                  .map((h, i) => (
                    <th key={h} style={{ backgroundColor: i === 11 ? '#dbeafe' : '#e5e7eb', padding: '12px 16px', textAlign: i >= 1 && i <= 11 ? 'right' : 'left', fontWeight: 'bold', border: '1px solid #d1d5db', position: 'sticky', top: 0, zIndex: 10, minWidth: i === 0 ? 200 : i === 12 ? 120 : 140 }}>
                      {h}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {models.map((model, idx) => (
                <tr key={model.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                  <td style={{ padding: '12px 16px', border: '1px solid #d1d5db' }}>
                    <input type="text" value={model.modelName}
                      onChange={e => onUpdateModelField(model.id, 'modelName', e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                      placeholder="Enter model name" />
                  </td>
                  <td style={{ padding: '12px 16px', border: '1px solid #d1d5db', textAlign: 'right' }}>
                    <input type="number" value={model.units || ''}
                      onChange={e => onUpdateModelField(model.id, 'units', Number(e.target.value))}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, textAlign: 'right' }}
                      placeholder="0" min={1} />
                  </td>
                  <td style={{ padding: '12px 16px', border: '1px solid #d1d5db', textAlign: 'right' }}>
                    <input type="number" value={model.unitCostUSD || ''}
                      onChange={e => onUpdateModelField(model.id, 'unitCostUSD', Number(e.target.value))}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, textAlign: 'right' }}
                      placeholder="0.00" min={0} step="0.01" />
                  </td>
                  <td style={{ padding: '12px 16px', border: '1px solid #d1d5db', textAlign: 'right', fontWeight: 600 }}>${fmt(model.totalCostUSD)}</td>
                  <td style={{ padding: '12px 16px', border: '1px solid #d1d5db', textAlign: 'right' }}>{fmt(model.percentage)}%</td>
                  <td style={{ padding: '12px 16px', border: '1px solid #d1d5db', textAlign: 'right' }}>{fmt(model.customPerModel)}</td>
                  <td style={{ padding: '12px 16px', border: '1px solid #d1d5db', textAlign: 'right' }}>{fmt(model.customPerUnit)}</td>
                  <td style={{ padding: '12px 16px', border: '1px solid #d1d5db', textAlign: 'right' }}>{fmt(model.freightPerModel)}</td>
                  <td style={{ padding: '12px 16px', border: '1px solid #d1d5db', textAlign: 'right' }}>{fmt(model.freightPerUnit)}</td>
                  <td style={{ padding: '12px 16px', border: '1px solid #d1d5db', textAlign: 'right', fontWeight: 500 }}>{fmt(model.unitCostPKR)}</td>
                  <td style={{ padding: '12px 16px', border: '1px solid #d1d5db', textAlign: 'right', fontWeight: 'bold' }}>{fmt(model.totalLandedUnitCost)}</td>
                  <td style={{ padding: '12px 16px', border: '1px solid #d1d5db', textAlign: 'right', fontWeight: 'bold', color: '#1d4ed8', backgroundColor: '#eff6ff' }}>{fmt(model.totalShipmentValuePKR)}</td>
                  <td style={{ padding: '12px 16px', border: '1px solid #d1d5db', textAlign: 'center' }}>
                    <button type="button" onClick={() => onRemoveModel(model.id)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '8px 16px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
                      <Trash2 size={16} /> Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {models.length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', color: '#6b7280', fontSize: 14 }}>
          <p>Total Models: {models.length}</p>
          <p>💡 Use horizontal scroll to view all columns</p>
        </div>
      )}
    </div>
  );
}