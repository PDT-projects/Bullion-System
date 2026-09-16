// React hook + boot-time provider for the global currency setting.
//
// Usage in a component:
//   const { symbol, formatCurrency } = useGlobalCurrency();
//   <span>{formatCurrency(1234)}</span>
//
// Usage once, at the top of the app (e.g. App.tsx), so the real saved value
// is loaded before anything renders:
//   <GlobalCurrencyBoot><App /></GlobalCurrencyBoot>

import React, { useEffect, useState, useCallback } from 'react';
import {
  getGlobalCurrency, loadGlobalCurrency, subscribeToGlobalCurrency,
  formatGlobalCurrency, GlobalCurrencySetting, isGlobalCurrencyLoaded,
} from './globalCurrency';

export function useGlobalCurrency() {
  const [setting, setSetting] = useState<GlobalCurrencySetting>(getGlobalCurrency());

  useEffect(() => {
    if (!isGlobalCurrencyLoaded()) {
      loadGlobalCurrency().then(setSetting);
    }
    return subscribeToGlobalCurrency(setSetting);
  }, []);

  const formatCurrency = useCallback(
    (amount: number, opts?: { minimumFractionDigits?: number }) => formatGlobalCurrency(amount, opts),
    [setting], // re-create when the symbol changes so callers re-render with the new label
  );

  return { symbol: setting.symbol, name: setting.name, code: setting.code, formatCurrency };
}

/** Wrap your app root with this once, so the real Firestore value is loaded
 *  before the rest of the app uses formatGlobalCurrency(). Renders children
 *  immediately with the AED default while loading — nothing blocks. */
export const GlobalCurrencyBoot: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    loadGlobalCurrency();
  }, []);
  return <>{children}</>;
};
