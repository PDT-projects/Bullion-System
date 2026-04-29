import { useState, useMemo, useRef, useEffect } from 'react';
import { Invoice } from '../../App';
import { Calendar, MapPin, User, Filter, Download, UserPlus, BarChart3, ChevronDown, X } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type ReferralReportProps = {
  invoices: Invoice[];
};

// ── Shared MultiSelect ────────────────────────────────────────────────────────
function MultiSelect({
  label, options, selected, onChange, placeholder = 'All', disabled = false, icon,
}: {
  label: string; options: string[]; selected: string[];
  onChange: (v: string[]) => void; placeholder?: string; disabled?: boolean; icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);
  const display = selected.length === 0 ? placeholder : selected.length === 1 ? selected[0] : `${selected.length} selected`;
  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">{icon}{label}</label>
      <button type="button" disabled={disabled} onClick={() => !disabled && setOpen(o => !o)}
        className={`w-full border rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between gap-2 transition-colors
          ${disabled ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' :
            open ? 'border-indigo-500 ring-1 ring-indigo-300 bg-white' :
            selected.length > 0 ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-medium' :
            'bg-white border-gray-300 hover:border-indigo-400 cursor-pointer'}`}>
        <span className={selected.length === 0 ? 'text-gray-400' : ''}>{display}</span>
        <ChevronDown size={13} className={`flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''} text-gray-400`} />
      </button>
      {selected.length > 1 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {selected.map(v => (
            <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
              {v}<button onClick={() => toggle(v)}><X size={9} /></button>
            </span>
          ))}
        </div>
      )}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {options.length === 0 ? <p className="px-3 py-2 text-xs text-gray-400 italic">No options</p> : (
            <>
              {selected.length > 0 && (
                <button onClick={() => { onChange([]); setOpen(false); }} className="w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 border-b border-gray-100 font-medium">
                  ✕ Clear selection
                </button>
              )}
              {options.map(opt => (
                <label key={opt} className="flex items-center gap-2 px-3 py-2 hover:bg-indigo-50 cursor-pointer text-sm">
                  <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} className="accent-indigo-600 w-3.5 h-3.5 rounded flex-shrink-0" />
                  <span className="text-gray-800">{opt}</span>
                </label>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function ReferralReport({ invoices }: ReferralReportProps) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedReferralPersons, setSelectedReferralPersons] = useState<string[]>([]);
  const [showVisualization, setShowVisualization] = useState(false);

  const cities = useMemo(() => {
    const s = new Set<string>();
    invoices.forEach(inv => { if (inv.customerCity && inv.referFrom) s.add(inv.customerCity); });
    return Array.from(s).sort();
  }, [invoices]);

  const referralPersons = useMemo(() => {
    const s = new Set<string>();
    invoices.forEach(inv => { if (inv.referFrom && inv.referFrom.trim() !== '') s.add(inv.referFrom); });
    return Array.from(s).sort();
  }, [invoices]);

  const referralData = useMemo(() => {
    return invoices
      .filter(invoice => invoice.referFrom && invoice.referFrom.trim() !== '')
      .flatMap(invoice =>
        invoice.products.map(product => ({
          id: `${invoice.id}-${product.id}`,
          date: invoice.date,
          clientName: invoice.customerName,
          city: invoice.customerCity,
          product: product.productName,
          brand: product.brandName,
          salePriceBeforeReferral: product.price,
          referralShare: product.price * 0.5,
          salePriceAfterReferral: product.price * 0.5,
          salesperson: invoice.referFrom || '',
          referBy: invoice.salesperson || '',
          invoiceNumber: invoice.invoiceNumber,
        }))
      );
  }, [invoices]);

  const filteredData = useMemo(() => {
    return referralData.filter(item => {
      if (dateFrom && item.date < dateFrom) return false;
      if (dateTo && item.date > dateTo) return false;
      if (selectedCities.length > 0 && !selectedCities.includes(item.city)) return false;
      if (selectedReferralPersons.length > 0 && !selectedReferralPersons.includes(item.salesperson)) return false;
      return true;
    });
  }, [referralData, dateFrom, dateTo, selectedCities, selectedReferralPersons]);

  const totals = useMemo(() => {
    return filteredData.reduce((acc, item) => ({
      sellPrice: acc.sellPrice + item.salePriceBeforeReferral,
      referralAmount: acc.referralAmount + item.referralShare
    }), { sellPrice: 0, referralAmount: 0 });
  }, [filteredData]);

  const hasActiveFilters = dateFrom || dateTo || selectedCities.length > 0 || selectedReferralPersons.length > 0;

  const handleClearFilters = () => {
    setDateFrom(''); setDateTo('');
    setSelectedCities([]); setSelectedReferralPersons([]);
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Client Name', 'City', 'Product / Brand', 'Sale Price (Before Referral)', 'Referral Share (50%)', 'Sale Price (After Referral)', 'Salesperson', 'Refer By'];
    const rows = filteredData.map(item => [item.date, item.clientName, item.city, `${item.product} / ${item.brand}`, item.salePriceBeforeReferral, item.referralShare, item.salePriceAfterReferral, item.salesperson, item.referBy]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `referral-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const referralSummary = useMemo(() => {
    const summary = new Map<string, { count: number; totalSales: number; totalReferral: number }>();
    filteredData.forEach(item => {
      const e = summary.get(item.salesperson) || { count: 0, totalSales: 0, totalReferral: 0 };
      summary.set(item.salesperson, { count: e.count + 1, totalSales: e.totalSales + item.salePriceBeforeReferral, totalReferral: e.totalReferral + item.referralShare });
    });
    return Array.from(summary.entries()).map(([person, data]) => ({ person, ...data }));
  }, [filteredData]);

  const visualizationData = useMemo(() => {
    const byDate: Record<string, number> = {};
    filteredData.forEach(i => { byDate[i.date] = (byDate[i.date] || 0) + i.referralShare; });
    const referralTrend = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, amount]) => ({ date, amount }));

    const byCity: Record<string, number> = {};
    filteredData.forEach(i => { byCity[i.city] = (byCity[i.city] || 0) + i.referralShare; });
    const cityReferrals = Object.entries(byCity).map(([city, amount]) => ({ city, amount })).sort((a, b) => b.amount - a.amount);

    const bySP: Record<string, number> = {};
    filteredData.forEach(i => { bySP[i.salesperson] = (bySP[i.salesperson] || 0) + i.referralShare; });
    const salespersonReferrals = Object.entries(bySP).map(([salesperson, amount]) => ({ salesperson, amount })).sort((a, b) => b.amount - a.amount);

    const byProduct: Record<string, number> = {};
    filteredData.forEach(i => { const k = `${i.product} / ${i.brand}`; byProduct[k] = (byProduct[k] || 0) + i.referralShare; });
    const productReferrals = Object.entries(byProduct).map(([product, amount]) => ({ product, amount })).sort((a, b) => b.amount - a.amount).slice(0, 10);

    const countBySP: Record<string, number> = {};
    filteredData.forEach(i => { countBySP[i.salesperson] = (countBySP[i.salesperson] || 0) + 1; });
    const referralCountData = Object.entries(countBySP).map(([salesperson, count]) => ({ salesperson, count }));
    const referralAmountData = Object.entries(bySP).map(([salesperson, amount]) => ({ salesperson, amount }));

    return { referralTrend, cityReferrals, salespersonReferrals, productReferrals, referralCountData, referralAmountData };
  }, [filteredData]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Referral Report</h2>
            <p className="text-sm text-gray-600 mt-1">Sales counted by Salesperson (Refer From) • Entries generated when Refer From is filled • Display only (no commission payout logic)</p>
          </div>
          <button onClick={() => setShowVisualization(!showVisualization)}
            className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-lg hover:bg-blue-200 flex items-center gap-2">
            <BarChart3 size={16} />
            {showVisualization ? 'Hide' : 'Show'} Visualization
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filters</h3>
            {hasActiveFilters && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">Active</span>}
          </div>
          {hasActiveFilters && (
            <button onClick={handleClearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
              <X size={12} /> Clear all filters
            </button>
          )}
        </div>

        {/* Row 1: Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 mb-4 border-b border-gray-100">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Calendar size={14} className="text-gray-500" />Date From</label>
            <input type="date" value={dateFrom} max={dateTo || undefined} onChange={e => setDateFrom(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Calendar size={14} className="text-gray-500" />Date To</label>
            <input type="date" value={dateTo} min={dateFrom || undefined} onChange={e => setDateTo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400" />
          </div>
        </div>

        {/* Row 2: Multi-select dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MultiSelect label="City" options={cities} selected={selectedCities} onChange={setSelectedCities} placeholder="All Cities" icon={<MapPin size={14} className="text-gray-500" />} />
          <MultiSelect label="Salesperson" options={referralPersons} selected={selectedReferralPersons} onChange={setSelectedReferralPersons} placeholder="All Salespersons" icon={<UserPlus size={14} className="text-gray-500" />} />
        </div>

        {/* Active filter pills */}
        {hasActiveFilters && (
          <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
            {dateFrom && <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">From: {dateFrom}<button onClick={() => setDateFrom('')}><X size={9} /></button></span>}
            {dateTo && <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">To: {dateTo}<button onClick={() => setDateTo('')}><X size={9} /></button></span>}
            {selectedCities.map(c => <span key={c} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">📍 {c}<button onClick={() => setSelectedCities(selectedCities.filter(v => v !== c))}><X size={9} /></button></span>)}
            {selectedReferralPersons.map(p => <span key={p} className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded-full">{p}<button onClick={() => setSelectedReferralPersons(selectedReferralPersons.filter(v => v !== p))}><X size={9} /></button></span>)}
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <button onClick={handleExportCSV}
            className="px-4 py-2 text-sm font-medium text-white bg-[#10b981] rounded-lg hover:bg-[#059669] flex items-center gap-2">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary by Salesperson */}
      {referralSummary.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Summary by Salesperson (Client Deal By)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {referralSummary.map((item) => (
              <div key={item.person} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2"><User size={16} className="text-[#4f46e5]" /><p className="font-medium text-gray-900">{item.person}</p></div>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">Referrals: <span className="font-medium text-gray-900">{item.count}</span></p>
                  <p className="text-gray-600">Total Sales: <span className="font-medium text-[#4f46e5]">Rs {item.totalSales.toLocaleString()}</span></p>
                  <p className="text-gray-600">Referral Amount: <span className="font-medium text-[#10b981]">Rs {item.totalReferral.toLocaleString()}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4"><p className="text-sm text-gray-600 mb-1">Total Referrals</p><p className="text-2xl font-bold text-gray-900">{filteredData.length}</p></div>
        <div className="bg-white rounded-lg border border-gray-200 p-4"><p className="text-sm text-gray-600 mb-1">Total Sell Price</p><p className="text-2xl font-bold text-[#4f46e5]">Rs {totals.sellPrice.toLocaleString()}</p></div>
        <div className="bg-white rounded-lg border border-gray-200 p-4"><p className="text-sm text-gray-600 mb-1">Total Referral Amount</p><p className="text-2xl font-bold text-[#10b981]">Rs {totals.referralAmount.toLocaleString()}</p></div>
      </div>

      {/* Visualization */}
      {showVisualization && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Referral Analytics</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Referral Trend Over Time</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={visualizationData.referralTrend}>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis />
                  <Tooltip formatter={(v) => [`Rs ${Number(v).toLocaleString()}`, 'Referral Amount']} />
                  <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Referrals by City</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={visualizationData.cityReferrals}>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="city" /><YAxis />
                  <Tooltip formatter={(v) => [`Rs ${Number(v).toLocaleString()}`, 'Referral Amount']} />
                  <Bar dataKey="amount" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Referrals by Salesperson</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={visualizationData.salespersonReferrals}>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="salesperson" /><YAxis />
                  <Tooltip formatter={(v) => [`Rs ${Number(v).toLocaleString()}`, 'Referral Amount']} />
                  <Bar dataKey="amount" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Top Referral Products</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={visualizationData.productReferrals} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis dataKey="product" type="category" width={100} />
                  <Tooltip formatter={(v) => [`Rs ${Number(v).toLocaleString()}`, 'Referral Amount']} />
                  <Bar dataKey="amount" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Referral Count by Salesperson</h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={visualizationData.referralCountData} cx="50%" cy="50%" labelLine={false} outerRadius={80} dataKey="count">
                    {visualizationData.referralCountData.map((_, i) => <Cell key={i} fill={['#10b981','#3b82f6','#f59e0b','#ef4444'][i % 4]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [v, 'Referral Count']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Referral Amount Distribution</h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={visualizationData.referralAmountData} cx="50%" cy="50%" labelLine={false} label={({ salesperson, amount }) => `${salesperson}: Rs ${amount.toLocaleString()}`} outerRadius={80} dataKey="amount">
                    {visualizationData.referralAmountData.map((_, i) => <Cell key={i} fill={['#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6'][i % 5]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`Rs ${Number(v).toLocaleString()}`, 'Referral Amount']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Referral Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Date', 'Client Name', 'City', 'Product / Brand', 'Sale Price (Before Referral)', 'Referral Share (50%)', 'Sale Price (After Referral)', 'Salesperson', 'Refer By'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">{referralData.length === 0 ? 'No referral data available. Create invoices with referral information to see reports.' : 'No data matches the selected filters.'}</td></tr>
              ) : filteredData.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{item.date}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.clientName}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.city}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.product} / {item.brand}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">Rs {item.salePriceBeforeReferral.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-[#10b981] text-right font-semibold">Rs {item.referralShare.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">Rs {item.salePriceAfterReferral.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm"><span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800"><User size={12} />{item.salesperson}</span></td>
                  <td className="px-4 py-3 text-sm">{item.referBy && <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800"><User size={12} />{item.referBy}</span>}</td>
                </tr>
              ))}
            </tbody>
            {filteredData.length > 0 && (
              <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-sm font-bold text-gray-900">TOTALS</td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">Rs {totals.sellPrice.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm font-bold text-[#10b981] text-right">Rs {totals.referralAmount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">Rs {totals.referralAmount.toLocaleString()}</td>
                  <td></td><td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
      <div className="mt-4 text-sm text-gray-600">Showing {filteredData.length} of {referralData.length} referral entries</div>
    </div>
  );
}