// Inventory Module - Brand Summary Component
// Footer component showing total calculations for multi-model costing

import React from 'react';
import { DollarSign, TrendingUp, Shield, Truck, Calculator } from 'lucide-react';

interface BrandSummaryProps {
  totalUnitCostUSD: number;
  shipmentTotalUSD: number;
  consignmentValue: number;
  totalValueOfBrand: number;
  totalCustomsValue: number;
  totalFreightValue: number;
}

export function BrandSummary({
  totalUnitCostUSD,
  shipmentTotalUSD,
  consignmentValue,
  totalValueOfBrand,
  totalCustomsValue,
  totalFreightValue,
}: BrandSummaryProps) {
  const formatCurrency = (value: number): string => {
    return value.toLocaleString('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Inline styles for maximum visibility
  const containerStyle: React.CSSProperties = {
    backgroundColor: '#eff6ff',
    padding: '24px',
    borderRadius: '12px',
    border: '2px solid #3b82f6',
    marginTop: '24px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
  };

  const totalCardStyle: React.CSSProperties = {
    backgroundColor: '#1d4ed8',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.15)',
    color: 'white',
  };

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Calculator style={{ width: '20px', height: '20px', color: '#2563eb' }} />
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
          Brand Summary
        </h3>
      </div>
      
      {/* Main Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px', marginBottom: '16px' }}>
        
        {/* Total Unit Cost USD - NEW */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <DollarSign style={{ width: '16px', height: '16px', color: '#0891b2' }} />
            <p style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500, margin: 0 }}>
              Total Unit Cost (USD)
            </p>
          </div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            ${formatCurrency(totalUnitCostUSD)}
          </p>
        </div>

        {/* Shipment Total USD */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <DollarSign style={{ width: '16px', height: '16px', color: '#16a34a' }} />
            <p style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500, margin: 0 }}>
              Shipment Total (USD)
            </p>
          </div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            ${formatCurrency(shipmentTotalUSD)}
          </p>
        </div>

        {/* Consignment Value */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <TrendingUp style={{ width: '16px', height: '16px', color: '#2563eb' }} />
            <p style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500, margin: 0 }}>
              Consignment Value (PKR)
            </p>
          </div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            Rs. {formatCurrency(consignmentValue)}
          </p>
        </div>

        {/* Customs */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Shield style={{ width: '16px', height: '16px', color: '#ea580c' }} />
            <p style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500, margin: 0 }}>
              Total Customs
            </p>
          </div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            Rs. {formatCurrency(totalCustomsValue)}
          </p>
        </div>

        {/* Freight */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Truck style={{ width: '16px', height: '16px', color: '#9333ea' }} />
            <p style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500, margin: 0 }}>
              Total Freight
            </p>
          </div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            Rs. {formatCurrency(totalFreightValue)}
          </p>
        </div>

        {/* Total Value of Brand - PROMINENT */}
        <div style={totalCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Calculator style={{ width: '16px', height: '16px', color: '#bfdbfe' }} />
            <p style={{ fontSize: '14px', color: '#bfdbfe', fontWeight: 600, margin: 0 }}>
              Total Brand Value
            </p>
          </div>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', margin: 0 }}>
            Rs. {formatCurrency(totalValueOfBrand)}
          </p>
        </div>
      </div>

      {/* Additional breakdown */}
      <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', fontSize: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#6b7280', fontWeight: 500 }}>Exchange Impact:</span>
            <span style={{ fontWeight: 'bold', color: '#111827' }}>Rs. {formatCurrency(consignmentValue - shipmentTotalUSD)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#6b7280', fontWeight: 500 }}>Total Additional Costs:</span>
            <span style={{ fontWeight: 'bold', color: '#111827' }}>Rs. {formatCurrency(totalCustomsValue + totalFreightValue)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#6b7280', fontWeight: 500 }}>Final Landed Value:</span>
            <span style={{ fontWeight: 'bold', color: '#16a34a' }}>Rs. {formatCurrency(totalValueOfBrand)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
