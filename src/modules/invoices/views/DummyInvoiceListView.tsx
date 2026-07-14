// Dummy Invoice Module - List View
// Shows all dummy/proforma/booking/quotation invoices

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, FileText, Loader2, Download } from 'lucide-react';
import { downloadInvoicePdf } from '../models/invoicePdfService';
import { DummyInvoice } from '../models/DummyInvoiceFirebaseService';
import { DummyInvoiceFirebaseService, DummyInvoice, DummyInvoiceType } from '../models/DummyInvoiceFirebaseService';
import { toast } from 'sonner';

const TYPE_COLORS: Record<DummyInvoiceType, { bg: string; color: string }> = {
  Dummy:     { bg: '#f1f5f9', color: '#334155' },
  Proforma:  { bg: '#dbeafe', color: '#1d4ed8' },
  Booking:   { bg: '#dcfce7', color: '#15803d' },
  Quotation: { bg: '#ede9fe', color: '#7c3aed' },
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  Draft:     { bg: '#f1f5f9', color: '#475569' },
  Sent:      { bg: '#dbeafe', color: '#1d4ed8' },
  Accepted:  { bg: '#dcfce7', color: '#15803d' },
  Rejected:  { bg: '#fee2e2', color: '#b91c1c' },
  Expired:   { bg: '#fef3c7', color: '#92400e' },
  Converted: { bg: '#e0e7ff', color: '#4338ca' },
};

export function DummyInvoiceListView() {
  const navigate = useNavigate();
  const [invoices, setInvoices]   = useState<DummyInvoice[]>([]);
  const [loading,  setLoading]    = useState(true);
  const [typeFilter, setTypeFilter] = useState<DummyInvoiceType | 'All'>('All');

  const load = () => {
    setLoading(true);
    DummyInvoiceFirebaseService.fetchAll()
      .then(setInvoices)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const displayed = typeFilter === 'All' ? invoices : invoices.filter(i => i.invoiceType === typeFilter);




  // Map DummyInvoice → Invoice shape for PDF service
  const downloadPdf = async (inv: DummyInvoice) => {
    try {
      const invoiceForPdf: any = {
        id:            inv.id,
        invoiceNumber: inv.invoiceNumber,
        date:          inv.date,
        status:        'Draft',
        deliveryStatus: 'Self-collect',
        customerName:    inv.customerName   || '',
        customerPhone:   inv.customerPhone  || '',
        customerPhone2:  inv.customerPhone2,
        customerCNIC:    inv.customerCNIC   || '',
        customerCity:    inv.customerCity   || '',
        customerProvince:inv.customerProvince || '',
        customerAddress: inv.customerAddress,
        salesperson:     inv.salesperson,
        totalAmount:     inv.totalAmount || 0,
        paidAmount:      0,
        remainingAmount: inv.totalAmount || 0,
        paymentStatus:   'Unpaid',
        payments:        [],
        products: inv.products.map((p, i) => ({
          id:          p.id || String(i),
          productId:   '',
          productName: p.productName,
          brandName:   '',
          modelName:   p.productName,
          category:    '',
          description: p.description || '',
          quantity:    p.quantity,
          price:       p.unitPrice,
          total:       p.total,
          serialNumbers: [],
          currency:    'AED',
        })),
        exchangeWarrantyNote: inv.notes || '',
        selectedCurrencies:   ['AED'],
        supplierCostTotal:    0,
        purchaseCostTotal:    0,
        miscExpense:          0,
        deductionCharges:     0,
        cargoAmount:          0,
        customsAmount:        0,
        agentAmount:          0,
        branch:               '',
        digitalStamp:         false,
      };
      await downloadInvoicePdf(invoiceForPdf);
    } catch (err: any) {
      toast.error('PDF generation failed: ' + (err?.message || 'Unknown error'));
    }
  };

  const handleDelete = async (inv: DummyInvoice) => {
    if (!window.confirm(`Delete ${inv.invoiceNumber}?`)) return;
    try {
      await DummyInvoiceFirebaseService.delete(inv.id);
      toast.success('Invoice deleted');
      load();
    } catch (err: any) {
      toast.error('Delete failed: ' + (err?.message || 'Unknown error'));
    }
  };

  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Draft Invoices</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Dummy, Proforma, Booking & Quotation invoices</div>
        </div>
        <button onClick={() => navigate('/invoices/dummy/new')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 9, border: 'none', backgroundColor: '#0f172a', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          <Plus size={16} /> Create
        </button>
      </div>

      {/* Type filter tabs */}
      <div style={{ display: 'flex', gap: 8 }}>
        {(['All', 'Dummy', 'Proforma', 'Booking', 'Quotation'] as const).map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            style={{ padding: '6px 14px', borderRadius: 8, border: `1.5px solid ${typeFilter === t ? '#0f172a' : '#e2e8f0'}`,
              backgroundColor: typeFilter === t ? '#0f172a' : '#fff',
              color: typeFilter === t ? '#fff' : '#475569',
              fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {t}
            {t !== 'All' && (
              <span style={{ marginLeft: 6, fontSize: 10, backgroundColor: typeFilter === t ? 'rgba(255,255,255,0.2)' : '#f1f5f9', color: typeFilter === t ? '#fff' : '#64748b', padding: '1px 5px', borderRadius: 99, fontWeight: 700 }}>
                {invoices.filter(i => i.invoiceType === t).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '28px 20px', color: '#64748b', fontSize: 13 }}>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading…
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
            <FileText size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
            <div style={{ fontSize: 14, fontWeight: 600 }}>No {typeFilter === 'All' ? 'draft' : typeFilter} invoices yet</div>
            <button onClick={() => navigate('/invoices/dummy/new')}
              style={{ marginTop: 12, padding: '8px 18px', borderRadius: 8, border: 'none', backgroundColor: '#0f172a', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              + Create one
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ backgroundColor: '#0f172a' }}>
                {['Invoice #', 'Type', 'Date', 'Valid Until', 'Customer', 'Products', 'Total', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map((inv, i) => {
                const tc = TYPE_COLORS[inv.invoiceType];
                const sc = STATUS_COLORS[inv.status] || { bg: '#f1f5f9', color: '#475569' };
                return (
                  <tr key={inv.id} style={{ borderBottom: i < displayed.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#f8fafc'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = ''}>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>{inv.invoiceNumber}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, backgroundColor: tc.bg, color: tc.color }}>{inv.invoiceType}</span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>{new Date(inv.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td style={{ padding: '10px 14px', color: inv.validUntil ? '#64748b' : '#cbd5e1' }}>
                      {inv.validUntil ? new Date(inv.validUntil).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{inv.customerName || '—'}</div>
                      {inv.customerPhone && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{inv.customerPhone}</div>}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>{inv.products.length} item{inv.products.length !== 1 ? 's' : ''}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0f172a' }}>
                      AED {(inv.totalAmount || 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, backgroundColor: sc.bg, color: sc.color }}>{inv.status}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => navigate(`/invoices/dummy/${inv.id}`)}
                          title="View / Edit"
                          style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <Eye size={13} color="#64748b" />
                        </button>
                        <button onClick={() => downloadPdf(inv)}
                          title="Download PDF"
                          style={{ padding: '5px 9px', borderRadius: 6, border: '1px solid #bfdbfe', backgroundColor: '#eff6ff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Download size={13} color="#2563eb" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}