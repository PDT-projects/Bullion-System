// Inventory Module - Costing Table Component
// Dynamic table for managing multiple models in multi-model costing

import React from 'react';
import { CostingModel } from '../models/types';
import { Plus, Trash2 } from 'lucide-react';

interface CostingTableProps {
  models: CostingModel[];
  onAddModel: () => void;
  onUpdateModelField: (modelId: string, field: keyof CostingModel, value: string | number) => void;
  onRemoveModel: (modelId: string) => void;
}

export function CostingTable({
  models,
  onAddModel,
  onUpdateModelField,
  onRemoveModel,
}: CostingTableProps) {
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
  };

  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Inline styles for maximum visibility
  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#2563eb',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '18px',
    padding: '16px 32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  };

  const headerStyle: React.CSSProperties = {
    backgroundColor: '#fef3c7',
    padding: '16px',
    borderRadius: '8px',
    border: '2px solid #f59e0b',
    marginBottom: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const tableContainerStyle: React.CSSProperties = {
    overflowX: 'auto',
    maxHeight: '500px',
    overflowY: 'auto',
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    minWidth: '1800px',
    borderCollapse: 'collapse',
    fontSize: '14px',
  };

  const thStyle: React.CSSProperties = {
    backgroundColor: '#e5e7eb',
    padding: '12px 16px',
    textAlign: 'left',
    fontWeight: 'bold',
    border: '1px solid #d1d5db',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  };

  const tdStyle: React.CSSProperties = {
    padding: '12px 16px',
    border: '1px solid #d1d5db',
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      {/* Header with Add Model Button - VERY PROMINENT */}
      <div style={headerStyle}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
          Model Costing Details
        </h3>
        <button
          type="button"
          onClick={onAddModel}
          style={buttonStyle}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
        >
          <Plus size={28} />
          Add Model
        </button>
      </div>

      {models.length === 0 ? (
        <div style={{ 
          backgroundColor: '#f9fafb', 
          padding: '32px', 
          textAlign: 'center', 
          borderRadius: '8px',
          border: '2px dashed #d1d5db' 
        }}>
          <p style={{ color: '#6b7280', marginBottom: '8px', fontSize: '16px' }}>No models added yet</p>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>Click "Add Model" button above to add your first model</p>
        </div>
      ) : (
        <div style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={{ ...thStyle, minWidth: '200px' }}>Model Name</th>
                <th style={{ ...thStyle, minWidth: '120px', textAlign: 'right' }}>Units</th>
                <th style={{ ...thStyle, minWidth: '150px', textAlign: 'right' }}>Unit Cost (USD)</th>
                <th style={{ ...thStyle, minWidth: '140px', textAlign: 'right' }}>Total (USD)</th>
                <th style={{ ...thStyle, minWidth: '120px', textAlign: 'right' }}>% Weight</th>
                <th style={{ ...thStyle, minWidth: '140px', textAlign: 'right' }}>Custom/Model</th>
                <th style={{ ...thStyle, minWidth: '140px', textAlign: 'right' }}>Custom/Unit</th>
                <th style={{ ...thStyle, minWidth: '140px', textAlign: 'right' }}>Freight/Model</th>
                <th style={{ ...thStyle, minWidth: '140px', textAlign: 'right' }}>Freight/Unit</th>
                <th style={{ ...thStyle, minWidth: '150px', textAlign: 'right' }}>Cost PKR</th>
                <th style={{ ...thStyle, minWidth: '150px', textAlign: 'right' }}>Landed Cost</th>
                <th style={{ ...thStyle, minWidth: '160px', textAlign: 'right', backgroundColor: '#dbeafe' }}>Inventory Value</th>
                <th style={{ ...thStyle, minWidth: '120px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {models.map((model, index) => (
                <tr key={model.id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                  <td style={tdStyle}>
                    <input
                      type="text"
                      style={inputStyle}
                      value={model.modelName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        onUpdateModelField(model.id, 'modelName', e.target.value)
                      }
                      placeholder="Enter model name"
                    />
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <input
                      type="number"
                      style={{ ...inputStyle, textAlign: 'right' }}
                      value={model.units || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        onUpdateModelField(model.id, 'units', Number(e.target.value))
                      }
                      placeholder="0"
                      min={1}
                    />
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <input
                      type="number"
                      style={{ ...inputStyle, textAlign: 'right' }}
                      value={model.unitCostUSD || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        onUpdateModelField(model.id, 'unitCostUSD', Number(e.target.value))
                      }
                      placeholder="0.00"
                      min={0}
                      step="0.01"
                    />
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '600', color: '#1f2937' }}>
                    ${formatNumber(model.totalCostUSD)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', color: '#374151', fontWeight: '500' }}>
                    {formatNumber(model.percentage)}%
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', color: '#374151' }}>
                    {formatNumber(model.customPerModel)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', color: '#374151' }}>
                    {formatNumber(model.customPerUnit)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', color: '#374151' }}>
                    {formatNumber(model.freightPerModel)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', color: '#374151' }}>
                    {formatNumber(model.freightPerUnit)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', color: '#374151', fontWeight: '500' }}>
                    {formatNumber(model.unitCostPKR)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 'bold', color: '#111827' }}>
                    {formatNumber(model.totalLandedUnitCost)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 'bold', color: '#1d4ed8', backgroundColor: '#eff6ff' }}>
                    {formatNumber(model.totalShipmentValuePKR)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => onRemoveModel(model.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '8px 16px',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                      }}
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {models.length > 0 && (
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
          <p>Total Models: {models.length}</p>
          <p>💡 Use horizontal scroll to view all columns</p>
        </div>
      )}
    </div>
  );
}
