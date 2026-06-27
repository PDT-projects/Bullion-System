// Inventory Module - Shared Component
// InventoryCurrencyDropdown
//
// Drop-in currency selector that matches the Dashboard's CurrencyDropdown look & feel.
// Usage:
//   const currency = useInventoryCurrency();
//   <InventoryCurrencyDropdown {...currency} />

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Loader2, AlertCircle } from 'lucide-react';
import {
  CurrencyCode,
  CurrencyMeta,
  INVENTORY_CURRENCIES,
  getCurrencyMeta,
} from '../viewModels/useInventoryCurrency';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface InventoryCurrencyDropdownProps {
  primaryCurrency: CurrencyCode;
  extraCurrencies: CurrencyCode[];
  setPrimaryCurrency: (c: CurrencyCode) => void;
  setExtraCurrencies: (c: CurrencyCode[]) => void;
  loading: boolean;
  error: boolean;
  lastUpdated: Date | null;
  /** label shown before the trigger button, defaults to "Currency" */
  label?: string;
  /** if true, the dropdown has a compact pill style (for use inside table headers, etc.) */
  compact?: boolean;
}

// ── InventoryCurrencyDropdown ─────────────────────────────────────────────────

export function InventoryCurrencyDropdown({
  primaryCurrency,
  extraCurrencies,
  setPrimaryCurrency,
  setExtraCurrencies,
  loading,
  error,
  lastUpdated,
  label,
  compact = false,
}: InventoryCurrencyDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const primaryMeta = getCurrencyMeta(primaryCurrency);

  const toggleExtra = (code: CurrencyCode) => {
    if (code === primaryCurrency) return;
    setExtraCurrencies(
      extraCurrencies.includes(code)
        ? extraCurrencies.filter(c => c !== code)
        : [...extraCurrencies, code]
    );
  };

  const selectPrimary = (code: CurrencyCode) => {
    setPrimaryCurrency(code);
    setOpen(false);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      {label && (
        <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{label}</span>
      )}

      {/* ── Trigger ── */}
      <div style={{ position: 'relative' }} ref={ref}>
        <button
          onClick={() => setOpen(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            height: compact ? 32 : 38,
            padding: compact ? '0 10px' : '0 14px',
            background: '#fff',
            border: '2px solid #94a3b8',
            borderRadius: 10,
            cursor: 'pointer',
            fontSize: compact ? 12 : 14,
            color: '#334155',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            outline: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{
            fontSize: 9, fontWeight: 800, color: '#475569',
            background: '#f1f5f9', padding: '2px 5px',
            borderRadius: 4, letterSpacing: '0.05em', lineHeight: 1,
          }}>
            {primaryMeta.flag}
          </span>
          <span style={{ fontWeight: 600, color: '#334155' }}>{primaryMeta.code}</span>
          {extraCurrencies.length > 0 && (
            <span style={{
              width: 18, height: 18, borderRadius: '50%',
              background: '#1e293b', color: '#fff',
              fontSize: 9, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
            }}>
              +{extraCurrencies.length}
            </span>
          )}
          <ChevronDown
            size={13}
            style={{
              color: '#94a3b8',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          />
        </button>

        {/* ── Dropdown panel ── */}
        {open && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 0,
            width: 270, background: '#fff',
            border: '1px solid #f1f5f9', borderRadius: 16,
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            zIndex: 9999, overflow: 'hidden',
          }}>

            {/* Primary section */}
            <div style={{ padding: '14px 16px 6px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                Primary Currency
              </p>
            </div>
            {INVENTORY_CURRENCIES.map(cur => {
              const sel = primaryCurrency === cur.code;
              return (
                <button
                  key={cur.code}
                  onClick={() => selectPrimary(cur.code)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 16px', textAlign: 'left', border: 'none',
                    background: sel ? '#f8fafc' : 'transparent',
                    cursor: 'pointer', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!sel) e.currentTarget.style.background = '#f9fafb'; }}
                  onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{
                    fontSize: 9, fontWeight: 800,
                    padding: '2px 6px', borderRadius: 4, letterSpacing: '0.04em', lineHeight: 1,
                    background: sel ? '#1e293b' : '#f1f5f9',
                    color: sel ? '#fff' : '#6b7280',
                  }}>
                    {cur.flag}
                  </span>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: sel ? '#1e293b' : '#374151' }}>
                      {cur.code}
                    </p>
                    <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{cur.label}</p>
                  </div>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: sel ? '#1e293b' : 'transparent',
                    flexShrink: 0,
                  }}>
                    {sel && <Check size={11} color="#fff" strokeWidth={3} />}
                  </div>
                </button>
              );
            })}

            {/* Also show section */}
            <div style={{ borderTop: '1px solid #f1f5f9', margin: '4px 16px 0' }} />
            <div style={{ padding: '12px 16px 6px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                Also Show on Cards
              </p>
            </div>
            {INVENTORY_CURRENCIES.filter(c => c.code !== primaryCurrency).map(cur => {
              const chk = extraCurrencies.includes(cur.code);
              return (
                <button
                  key={cur.code}
                  onClick={() => toggleExtra(cur.code)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 16px', textAlign: 'left', border: 'none',
                    background: 'transparent', cursor: 'pointer', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{
                    fontSize: 9, fontWeight: 800,
                    background: '#f1f5f9', color: '#6b7280',
                    padding: '2px 6px', borderRadius: 4, letterSpacing: '0.04em',
                    lineHeight: 1, flexShrink: 0,
                  }}>
                    {cur.flag}
                  </span>
                  <span style={{ fontSize: 13, color: '#374151', flex: 1, textAlign: 'left' }}>
                    {cur.code}
                    <span style={{ color: '#9ca3af', fontWeight: 400 }}> · {cur.label}</span>
                  </span>
                  {/* Square checkbox */}
                  <div style={{
                    width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                    border: chk ? '2px solid #1e293b' : '2px solid #d1d5db',
                    background: chk ? '#1e293b' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {chk && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
            <div style={{ height: 12 }} />
          </div>
        )}
      </div>

      {/* ── Rate status indicators ── */}
      {loading && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
          <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> Updating…
        </span>
      )}
      {error && !loading && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#f59e0b', fontWeight: 500 }}>
          <AlertCircle size={11} /> Estimated rates
        </span>
      )}
      {lastUpdated && !loading && !error && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b', fontWeight: 600 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', flexShrink: 0 }} />
          Live · {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
}

// ── CurrencyExtraRows ─────────────────────────────────────────────────────────
// Renders secondary currency rows under a price value (same as Dashboard's CurrencyRows)

export function CurrencyExtraRows({
  extras,
  pkrAmount,
  rates,
}: {
  extras: CurrencyCode[];
  /** Base amount in the canonical stored unit (AED). Name kept for compatibility. */
  pkrAmount: number;
  rates: Record<CurrencyCode, number>;
}) {
  if (extras.length === 0) return null;

  const formatInCurrency = (amount: number, meta: CurrencyMeta): string => {
    // Round to the currency's decimal precision first to eliminate floating-point
    // drift (e.g. 699.9999999 → 700, or 700.0000001 → 700).
    const factor = Math.pow(10, meta.decimals);
    const rounded = Math.round(amount * factor) / factor;
    try {
      return new Intl.NumberFormat(meta.locale, {
        style: 'currency', currency: meta.code,
        minimumFractionDigits: meta.decimals,
        maximumFractionDigits: meta.decimals,
      }).format(rounded);
    } catch {
      return `${meta.symbol}${rounded.toFixed(meta.decimals)}`;
    }
  };

  // Base amount is AED. AED shows as-is; other currencies convert from the AED base.
  const aedAmount = pkrAmount;

  return (
    <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 3 }}>
      {extras.map(code => {
        const meta = getCurrencyMeta(code);
        const converted =
          code === 'AED'
            ? aedAmount
            : rates?.AED
              ? (aedAmount / rates.AED) * rates[code]
              : aedAmount;
        return (
          <div key={code} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#9ca3af' }}>
              <span style={{ fontSize: 9, fontWeight: 700, background: '#f1f5f9', color: '#6b7280', padding: '1px 4px', borderRadius: 3 }}>
                {meta.flag}
              </span>
              {code}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', fontVariantNumeric: 'tabular-nums' }}>
              {formatInCurrency(converted, meta)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── CurrencyPriceInput ────────────────────────────────────────────────────────
// AED is the single source of truth. The value typed is stored verbatim — no
// PKR round-trip, no toFixed() drift. Typing 700 stores exactly 700.
//
// The prop is still named `pkrValue`/`onChange(pkrEquivalent)` for backwards
// compatibility with every caller, but the number now represents the AED amount
// (i.e. the canonical stored unit). The currency <select> is retained only as a
// non-converting label so the UI looks unchanged.
//
// Usage:
//   <CurrencyPriceInput
//     pkrValue={product.sellPrice}   // canonical stored value (AED)
//     onChange={(v) => setField(v)}  // called with the exact typed value
//     rates={rates}
//     label="Sell Price"
//   />

export interface CurrencyPriceInputProps {
  /** Canonical stored value (AED). Name kept for backwards compatibility. */
  pkrValue: number;
  /** Called with the exact value the user typed (AED). No conversion applied. */
  onChange: (value: number) => void;
  rates: Record<CurrencyCode, number>;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  /** default input currency, falls back to AED */
  defaultInputCurrency?: CurrencyCode;
}

export function CurrencyPriceInput({
  pkrValue,
  onChange,
  rates: _rates, // intentionally unused — no conversion is performed
  label,
  disabled = false,
  required = false,
  placeholder = '0',
  defaultInputCurrency = 'AED',
}: CurrencyPriceInputProps) {
  const [inputCurrency, setInputCurrency] = useState<CurrencyCode>(defaultInputCurrency);
  const previousDefaultCurrency = useRef<CurrencyCode>(defaultInputCurrency);

  // Raw editable string. Stored value is used verbatim — values like 700 or
  // 499.99 are preserved exactly as typed, with no rounding or back-conversion.
  const [rawInput, setRawInput] = useState<string>(pkrValue > 0 ? String(pkrValue) : '');
  const isFocused = useRef(false);
  const lastEmitted = useRef<number>(pkrValue);

  useEffect(() => {
    if (previousDefaultCurrency.current !== defaultInputCurrency && inputCurrency === previousDefaultCurrency.current) {
      setInputCurrency(defaultInputCurrency);
    }
    previousDefaultCurrency.current = defaultInputCurrency;
  }, [defaultInputCurrency, inputCurrency]);

  // Sync display when the stored value changes externally (e.g. model picked
  // from a dropdown), but never while the user is actively typing.
  useEffect(() => {
    if (isFocused.current) return;
    if (Math.abs(lastEmitted.current - pkrValue) < 0.0001) return; // our own change
    lastEmitted.current = pkrValue;
    setRawInput(pkrValue > 0 ? String(pkrValue) : '');
  }, [pkrValue]);

  const displayValue = isFocused.current ? rawInput : (pkrValue > 0 ? pkrValue : '');

  const handleChange = (raw: string) => {
    setRawInput(raw);
    if (raw === '') { lastEmitted.current = 0; onChange(0); return; }
    const num = parseFloat(raw);
    if (isNaN(num) || num < 0) { lastEmitted.current = 0; onChange(0); return; }
    // Store exactly what was typed — no conversion, no rounding.
    lastEmitted.current = num;
    onChange(num);
  };

  const handleCurrencyChange = (newCurrency: CurrencyCode) => {
    // Label-only change. The stored value is not re-scaled, so the amount the
    // user entered stays intact regardless of the selector.
    setInputCurrency(newCurrency);
  };

  const inp: React.CSSProperties = {
    flex: 1,
    padding: '9px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '0 8px 8px 0',
    fontSize: 13,
    outline: 'none',
    color: '#111827',
    backgroundColor: disabled ? '#f9fafb' : '#fff',
    boxSizing: 'border-box',
    borderLeft: 'none',
  };

  return (
    <div>
      {label && (
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
      )}
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        {/* Currency selector — label only, does not convert the stored value */}
        <select
          value={inputCurrency}
          onChange={e => handleCurrencyChange(e.target.value as CurrencyCode)}
          disabled={disabled}
          style={{
            padding: '9px 8px',
            border: '1px solid #d1d5db',
            borderRadius: '8px 0 0 8px',
            fontSize: 12,
            fontWeight: 700,
            color: '#374151',
            backgroundColor: '#f8fafc',
            cursor: disabled ? 'not-allowed' : 'pointer',
            outline: 'none',
            flexShrink: 0,
            appearance: 'none',
            WebkitAppearance: 'none',
            paddingRight: 28,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239ca3af' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
          }}
        >
          {INVENTORY_CURRENCIES.map(c => (
            <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
          ))}
        </select>

        {/* Number input — value stored exactly as typed */}
        <input
          type="number"
          value={displayValue}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => {
            isFocused.current = true;
            setRawInput(pkrValue > 0 ? String(pkrValue) : '');
          }}
          onBlur={() => {
            isFocused.current = false;
            setRawInput(prev => prev);
          }}
          disabled={disabled}
          placeholder={placeholder}
          min={0}
          step="any"
          style={inp}
        />
      </div>
    </div>
  );
}