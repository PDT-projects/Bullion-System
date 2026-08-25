// Commission Slab Form View — international locations, All Salespersons, multi-currency
// CHANGED:
//   - "All Salespersons" now clearly states it saves ONE shared slab (not N copies).
//   - Footer count removed (no fan-out). Save button says "Save Shared Slab".
//   - All other UI unchanged.

import { useState, useEffect, useRef } from 'react';
import {
  X, Maximize2, Minimize2, AlertCircle, RefreshCw,
  TrendingUp, ChevronDown, ChevronUp, PlusCircle, Globe, Users,
} from 'lucide-react';
import type { CommissionSlab } from '../models/types';
import {
  COMMISSION_CURRENCIES,
  CommissionCurrency,
  convertCommissionCurrency,
  ALL_SALESPERSONS,
  ADD_NEW_LOCATION,
} from '../viewModels/useCommissionSlabFormViewModel';

// ── Design tokens ─────────────────────────────────────────────────────────────
const CHARCOAL   = '#374151';
const CHARCOAL_R = '#4b5563';
const inp = `w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[${CHARCOAL_R}] text-sm bg-white`;

// ── CurrencyAmountInput ───────────────────────────────────────────────────────
function CurrencyAmountInput({
  pkrValue, currency, onCurrencyChange, onPkrChange, currencyRates, label, required,
}: {
  pkrValue: number;
  currency: CommissionCurrency;
  onCurrencyChange: (c: CommissionCurrency) => void;
  onPkrChange: (pkr: number) => void;
  currencyRates: Record<CommissionCurrency, number>;
  label: string;
  required?: boolean;
}) {
  const toDisplay = (pkr: number, cur: CommissionCurrency) =>
    cur === 'PKR' ? pkr : +convertCommissionCurrency(pkr, 'PKR', cur, currencyRates).toFixed(2);

  const [displayValue, setDisplayValue] = useState<number>(() => toDisplay(pkrValue, currency));
  const prevRef = useRef({ pkrValue, currency });

  useEffect(() => {
    const prev = prevRef.current;
    if (prev.currency !== currency || prev.pkrValue !== pkrValue) {
      setDisplayValue(toDisplay(pkrValue, currency));
    }
    prevRef.current = { pkrValue, currency };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pkrValue, currency]);

  const handleChange = (raw: number) => {
    setDisplayValue(raw);
    onPkrChange(
      currency === 'PKR'
        ? raw
        : +convertCommissionCurrency(raw, currency, 'PKR', currencyRates).toFixed(2)
    );
  };

  const handleCurrencyChange = (newCur: CommissionCurrency) => {
    setDisplayValue(toDisplay(pkrValue, newCur));
    onCurrencyChange(newCur);
  };

  const pkrPer1Unit = currency === 'PKR'
    ? 1
    : +convertCommissionCurrency(1, currency, 'PKR', currencyRates).toFixed(2);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex gap-2">
        <input
          type="number" min="0" step="any"
          value={displayValue || ''}
          onChange={e => handleChange(parseFloat(e.target.value) || 0)}
          className={`${inp} flex-1`}
          placeholder="0"
        />
        <select
          value={currency}
          onChange={e => handleCurrencyChange(e.target.value as CommissionCurrency)}
          className={`px-2 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[${CHARCOAL_R}] min-w-[68px]`}
        >
          {(COMMISSION_CURRENCIES ?? []).map(c => (
            <option key={c.code} value={c.code}>{c.code}</option>
          ))}
        </select>
      </div>
      {currency !== 'PKR' && displayValue > 0 && (
        <p className="mt-1 text-xs text-gray-500">
          ≈ <strong className="text-gray-700">
            ₨{pkrValue.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
          </strong>
          <span className="ml-2 text-gray-400">· 1 {currency} = ₨{pkrPer1Unit.toLocaleString('en-PK')}</span>
        </p>
      )}
    </div>
  );
}

// ── RatesBadge ────────────────────────────────────────────────────────────────
function RatesBadge({ isFetchingRates, lastRatesFetchAt }: {
  isFetchingRates: boolean;
  lastRatesFetchAt: Date | null;
}) {
  const t = lastRatesFetchAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-400">
      <RefreshCw size={11} className={isFetchingRates ? 'animate-spin' : ''} />
      {isFetchingRates ? 'Fetching live rates…' : t ? `Rates updated ${t}` : 'Using fallback rates'}
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface FormDataShape {
  salesperson: string;
  location: string;
  newLocationInput: string;
  fromAmount: number;
  toAmount: number;
  commissionPercentage: number;
  inputCurrency: CommissionCurrency;
}

interface CommissionSlabFormViewProps {
  formData: FormDataShape;
  setFormData: (data: Partial<FormDataShape>) => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  isFullScreen: boolean;
  setIsFullScreen: (full: boolean) => void;
  isSubmitting: boolean;
  errors: string[];
  editingSlab: CommissionSlab | null;
  handleSave: () => void;
  allLocations: string[];
  employees: any[];
  currencyRates: Record<CommissionCurrency, number>;
  isFetchingRates: boolean;
  lastRatesFetchAt: Date | null;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function CommissionSlabFormView({
  formData, setFormData,
  isModalOpen, setIsModalOpen,
  isFullScreen, setIsFullScreen,
  isSubmitting, errors,
  editingSlab, handleSave,
  allLocations: allLocationsProp,
  employees: employeesProp,
  currencyRates, isFetchingRates, lastRatesFetchAt,
}: CommissionSlabFormViewProps) {

  const [previewOpen, setPreviewOpen] = useState(false);

  const employees    = employeesProp    ?? [];
  const allLocations = allLocationsProp ?? [];

  const currency       = formData?.inputCurrency ?? 'AED';
  const salesperson    = formData?.salesperson    ?? '';
  const location       = formData?.location       ?? '';
  const newLocInput    = formData?.newLocationInput ?? '';
  const fromAmount     = formData?.fromAmount      ?? 0;
  const toAmount       = formData?.toAmount        ?? 0;
  const commPct        = formData?.commissionPercentage ?? 0;

  const isAllSP        = salesperson === ALL_SALESPERSONS;
  const isAddingLoc    = location    === ADD_NEW_LOCATION;
  const hasBothAmounts = fromAmount > 0 && toAmount > 0;

  if (!isModalOpen) return null;

  return (
    <div className={
      isFullScreen
        ? 'fixed inset-0 z-50 bg-white'
        : 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
    }>
      <div
        className={
          isFullScreen
            ? 'w-full h-full flex flex-col bg-white'
            : 'bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col'
        }
        style={isFullScreen ? {} : { maxHeight: '90vh' }}
      >
        {/* ── Header ── */}
        <div className="flex-none flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingSlab ? 'Edit Commission Slab' : 'Add Commission Slab'}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            >
              {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Amount Currency
              <span className="ml-2 text-xs font-normal text-gray-400">(displayed in AED, stored in PKR)</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-lg border bg-white text-xs font-semibold inline-flex items-center gap-2">
                <span className="opacity-70">د.إ</span>
                AED
              </div>
              <div className="text-xs text-gray-500">Values entered are shown in AED and saved as PKR behind the scenes.</div>
            </div>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  {errors.map((e, i) => (
                    <p key={i} className="text-sm text-red-600">{e}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Salesperson ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Salesperson <span className="text-red-500">*</span>
            </label>
            <select
              value={salesperson}
              onChange={e => setFormData({ salesperson: e.target.value })}
              className={inp}
            >
              <option value="">Select Salesperson</option>
              <option value={ALL_SALESPERSONS}>★ All Salespersons (shared slab)</option>
              <option disabled>──────────────────</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>

            {isAllSP && (
              <div
                className="mt-2 flex items-start gap-2 px-3 py-2 rounded-lg text-xs"
                style={{ backgroundColor: '#f0fdfa', border: '1px solid #99f6e4', color: '#0f766e' }}
              >
                <Users size={13} className="mt-0.5 shrink-0" />
                <span>
                  Saves as <strong>one shared slab</strong>. Applied to every salesperson who
                  doesn't have their own personal slab for this location. Personal slabs always
                  take priority.
                </span>
              </div>
            )}
          </div>

          {/* ── Location / Country ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Location / Country <span className="text-red-500">*</span>
            </label>
            <select
              value={location}
              onChange={e => setFormData({ location: e.target.value, newLocationInput: '' })}
              className={inp}
            >
              <option value="">Select Location</option>
              {allLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
              <option value={ADD_NEW_LOCATION}>＋ Add new location…</option>
            </select>

            {isAddingLoc && (
              <div className="mt-2 flex gap-2 items-start">
                <input
                  type="text"
                  autoFocus
                  placeholder="Enter new location name (e.g. Karachi, Nairobi)"
                  value={newLocInput}
                  onChange={e => setFormData({ newLocationInput: e.target.value })}
                  className={`${inp} flex-1`}
                  onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
                />
                <div
                  className="flex shrink-0 items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium"
                  style={{ backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}
                >
                  <PlusCircle size={12} />
                  Saved for future
                </div>
              </div>
            )}
          </div>

          {/* ── Currency toggle ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Amount Currency
              <span className="ml-2 text-xs font-normal text-gray-400">(stored in PKR)</span>
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {(COMMISSION_CURRENCIES ?? []).map(c => {
                const sel = currency === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setFormData({ inputCurrency: c.code })}
                    title={c.name}
                    style={sel ? { backgroundColor: CHARCOAL, borderColor: CHARCOAL } : {}}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1 ${
                      sel
                        ? 'text-white ring-2 ring-gray-300'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <span className="opacity-70">{c.symbol}</span>
                    {c.code}
                  </button>
                );
              })}
            </div>
            {currency !== 'PKR' && (
              <p className="mt-1.5 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
                Entering in <strong>{currency}</strong> — auto-converted to PKR on save.{' '}
                1 {currency} ≈ ₨{convertCommissionCurrency(1, currency, 'PKR', currencyRates).toLocaleString('en-PK', { maximumFractionDigits: 2 })}
              </p>
            )}
          </div>

          {/* ── From / To amounts ── */}
          <div className="grid grid-cols-2 gap-4">
            <CurrencyAmountInput
              label="From Amount" required
              pkrValue={fromAmount}
              currency={currency}
              currencyRates={currencyRates}
              onCurrencyChange={c => setFormData({ inputCurrency: c })}
              onPkrChange={pkr => setFormData({ fromAmount: pkr })}
            />
            <CurrencyAmountInput
              label="To Amount" required
              pkrValue={toAmount}
              currency={currency}
              currencyRates={currencyRates}
              onCurrencyChange={c => setFormData({ inputCurrency: c })}
              onPkrChange={pkr => setFormData({ toAmount: pkr })}
            />
          </div>

          {/* ── Commission % ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Commission Percentage <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={commPct || ''}
                onChange={e => setFormData({ commissionPercentage: parseFloat(e.target.value) || 0 })}
                className={`${inp} pr-10`}
                min="0" max="100" step="0.01" placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">%</span>
            </div>
          </div>

          {/* ── Collapsible currency preview ── */}
          {hasBothAmounts && (
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setPreviewOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
              >
                <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                  <TrendingUp size={12} />
                  Amount Range Preview (live rates)
                </span>
                {previewOpen
                  ? <ChevronUp size={14} className="text-gray-400" />
                  : <ChevronDown size={14} className="text-gray-400" />}
              </button>
              {previewOpen && (
                <div className="p-3 bg-white grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(COMMISSION_CURRENCIES ?? []).map(c => {
                    const from = c.code === 'PKR'
                      ? fromAmount
                      : +convertCommissionCurrency(fromAmount, 'PKR', c.code, currencyRates).toFixed(2);
                    const to = c.code === 'PKR'
                      ? toAmount
                      : +convertCommissionCurrency(toAmount, 'PKR', c.code, currencyRates).toFixed(2);
                    const isActive = c.code === currency;
                    return (
                      <div
                        key={c.code}
                        style={isActive ? { backgroundColor: CHARCOAL } : {}}
                        className={`rounded-lg px-3 py-2 border ${
                          isActive ? 'border-transparent' : 'border-gray-100 bg-gray-50'
                        }`}
                      >
                        <p className={`text-[10px] font-bold uppercase tracking-wide mb-0.5 ${
                          isActive ? 'text-gray-300' : 'text-gray-400'
                        }`}>
                          {c.name}
                        </p>
                        <p className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-gray-800'}`}>
                          {c.symbol}{from.toLocaleString('en-PK', { maximumFractionDigits: 2 })}
                          <span className={`mx-1 ${isActive ? 'text-gray-400' : 'text-gray-300'}`}>–</span>
                          {c.symbol}{to.toLocaleString('en-PK', { maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex-none flex items-center justify-end px-6 py-3 border-t border-gray-200 bg-white rounded-b-xl gap-3">
          <button
            onClick={() => setIsModalOpen(false)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            style={{ backgroundColor: isSubmitting ? '#9ca3af' : CHARCOAL }}
            className="px-5 py-2 text-white rounded-lg transition-opacity disabled:opacity-60 text-sm font-semibold hover:opacity-90"
          >
            {isSubmitting
              ? 'Saving…'
              : isAllSP && !editingSlab
                ? 'Save Shared Slab'
                : editingSlab
                  ? 'Update Slab'
                  : 'Save Slab'}
          </button>
        </div>
      </div>
    </div>
  );
}