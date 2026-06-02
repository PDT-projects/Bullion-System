// Commission Slab List View — multi-currency, international locations

import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Filter, SlidersHorizontal, RefreshCw, Globe } from 'lucide-react';
import type { CommissionSlab, CommissionSlabFilter } from '../models/types';
import {
  COMMISSION_CURRENCIES,
  CommissionCurrency,
  convertCommissionCurrency,
} from '../viewModels/useCommissionSlabFormViewModel';
import { formatCommissionCurrency } from '../viewModels/useCommissionSlabListViewModel';

const CHARCOAL = '#374151';

interface CommissionSlabListViewProps {
  slabs: CommissionSlab[];
  filteredSlabs: CommissionSlab[];
  isLoading: boolean;
  filter: CommissionSlabFilter;
  setFilter: (filter: CommissionSlabFilter) => void;
  clearFilters: () => void;
  onAdd: () => void;
  onEdit: (slab: CommissionSlab) => void;
  onDelete: (id: string) => void;
  totalSlabs: number;
  getSalespersonName: (salespersonId: string) => string;
  formatCurrency: (amount: number) => string;
  employees: any[];
  currencyRates: Record<CommissionCurrency, number>;
  isFetchingRates: boolean;
  lastRatesFetchAt: Date | null;
  displayCurrencies: CommissionCurrency[];
  setDisplayCurrencies: (currencies: CommissionCurrency[]) => void;
  formatInCurrency: (pkrAmount: number, currency: CommissionCurrency) => string;
}

// ── CurrencyToggleBar ─────────────────────────────────────────────────────────
function CurrencyToggleBar({
  selected, onChange,
}: {
  selected: CommissionCurrency[];
  onChange: (c: CommissionCurrency[]) => void;
}) {
  const toggle = (code: CommissionCurrency) => {
    if (code === 'PKR') return;
    onChange(selected.includes(code)
      ? selected.filter(c => c !== code)
      : [...selected, code]);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Globe size={14} className="text-gray-400" />
      <span className="text-xs text-gray-500 font-medium">Show currencies:</span>
      {COMMISSION_CURRENCIES.map(c => {
        const active = selected.includes(c.code);
        const isPKR  = c.code === 'PKR';
        return (
          <button
            key={c.code}
            type="button"
            onClick={() => toggle(c.code)}
            disabled={isPKR}
            title={c.name}
            style={active ? { backgroundColor: CHARCOAL, borderColor: CHARCOAL } : {}}
            className={`px-2 py-0.5 rounded-full border text-xs font-semibold transition-all ${
              active ? 'text-white' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400 hover:bg-gray-50'
            } ${isPKR ? 'cursor-default' : ''}`}
          >
            {c.code}
          </button>
        );
      })}
    </div>
  );
}

// ── MultiCurrencyCell ─────────────────────────────────────────────────────────
function MultiCurrencyCell({
  pkrFrom, pkrTo, currencies, currencyRates,
}: {
  pkrFrom: number;
  pkrTo: number;
  currencies: CommissionCurrency[];
  currencyRates: Record<CommissionCurrency, number>;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? currencies : currencies.slice(0, 2);

  return (
    <div className="space-y-1">
      {visible.map(c => {
        const def  = COMMISSION_CURRENCIES.find(x => x.code === c)!;
        const from = c === 'PKR' ? pkrFrom : +convertCommissionCurrency(pkrFrom, 'PKR', c, currencyRates).toFixed(2);
        const to   = c === 'PKR' ? pkrTo   : +convertCommissionCurrency(pkrTo,   'PKR', c, currencyRates).toFixed(2);
        return (
          <div key={c} className="flex items-center gap-1 text-xs">
            <span
              style={c !== 'PKR' ? { backgroundColor: CHARCOAL, color: '#fff' } : {}}
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                c === 'PKR' ? 'bg-gray-100 text-gray-600' : ''
              }`}
            >
              {c}
            </span>
            <span className="font-medium text-gray-900">
              {def.symbol}{from.toLocaleString('en-PK', { maximumFractionDigits: 2 })}
              <span className="mx-1 text-gray-400">–</span>
              {def.symbol}{to.toLocaleString('en-PK', { maximumFractionDigits: 2 })}
            </span>
          </div>
        );
      })}
      {currencies.length > 2 && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-[10px] text-gray-500 hover:text-gray-700 font-medium"
        >
          {expanded ? '▲ less' : `+${currencies.length - 2} more`}
        </button>
      )}
    </div>
  );
}

// ── Main list view ────────────────────────────────────────────────────────────
export function CommissionSlabListView({
  slabs, filteredSlabs, isLoading,
  filter, setFilter, clearFilters,
  onAdd, onEdit, onDelete,
  totalSlabs, getSalespersonName, formatCurrency,
  employees,
  currencyRates, isFetchingRates, lastRatesFetchAt,
  displayCurrencies, setDisplayCurrencies, formatInCurrency,
}: CommissionSlabListViewProps) {
  // Defensive: guarantee arrays even if parent passes undefined during async loading
  const safeSlabs             = slabs             ?? [];
  const safeFilteredSlabs     = filteredSlabs     ?? [];
  const safeDisplayCurrencies = displayCurrencies ?? ['PKR'];
  const timeStr = lastRatesFetchAt
    ? lastRatesFetchAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  // resolve location — support both old "city" field and new "location" field
  const getLocation = (slab: CommissionSlab) =>
    (slab as any).location || (slab as any).city || '—';

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Commission Slabs</h1>
          <p className="text-gray-600 mt-1">Manage commission slabs for salespeople across locations</p>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-400">
            <RefreshCw size={11} className={isFetchingRates ? 'animate-spin text-gray-500' : ''} />
            {isFetchingRates
              ? 'Refreshing exchange rates…'
              : timeStr
                ? `Exchange rates updated at ${timeStr}`
                : 'Using fallback exchange rates'}
          </div>
        </div>
        <button
          onClick={onAdd}
          style={{ backgroundColor: CHARCOAL }}
          className="flex items-center gap-2 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
        >
          <Plus size={18} />
          Add Slab
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Total Slabs',    value: totalSlabs,           Icon: SlidersHorizontal },
          { label: 'Active Filters', value: Object.values(filter).filter(Boolean).length, Icon: Filter },
          { label: 'Showing',        value: safeFilteredSlabs.length, Icon: Search, sub: `of ${safeSlabs.length} total` },
        ].map(({ label, value, Icon, sub }) => (
          <div key={label} className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{label}</span>
              <Icon className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            {sub && <p className="text-xs text-gray-500">{sub}</p>}
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by salesperson…"
              value={filter.salesperson || ''}
              onChange={e => setFilter({ ...filter, salesperson: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Filter by location…"
              value={filter.city || ''}
              onChange={e => setFilter({ ...filter, city: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
            />
          </div>
          <button
            onClick={clearFilters}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 text-sm"
          >
            Clear Filters
          </button>
        </div>
        <div className="pt-3 border-t border-gray-100">
          <CurrencyToggleBar selected={safeDisplayCurrencies} onChange={setDisplayCurrencies} />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Commission Slabs</h3>
          {safeDisplayCurrencies.length > 1 && (
            <span className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded-full">
              {safeDisplayCurrencies.length} currencies · live rates
            </span>
          )}
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: CHARCOAL }} />
            </div>
          ) : safeFilteredSlabs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No commission slabs found. Add your first slab to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Salesperson', 'Location', `Amount Range (${safeDisplayCurrencies.join(', ')})`, 'Commission %', 'Created', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {safeFilteredSlabs.map(slab => (
                    <tr key={slab.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        {getSalespersonName(slab.salesperson)}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                          <Globe size={10} />
                          {getLocation(slab)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <MultiCurrencyCell
                          pkrFrom={slab.fromAmount}
                          pkrTo={slab.toAmount}
                          currencies={safeDisplayCurrencies}
                          currencyRates={currencyRates}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <span
                          style={{ backgroundColor: CHARCOAL }}
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold text-white"
                        >
                          {slab.commissionPercentage}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {slab.createdAt ? new Date(slab.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onEdit(slab)}
                            className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => onDelete(slab.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-500"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}