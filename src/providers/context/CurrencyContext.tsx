import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export type CurrencyCode = 'AED' | string;

type CurrencyContextValue = {
  primary: CurrencyCode;
  extras: CurrencyCode[];
  setPrimary: (c: CurrencyCode) => void;
  setExtras: (c: CurrencyCode[]) => void;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [primary, setPrimary] = useState<CurrencyCode>('AED');
  const [extras, setExtras] = useState<CurrencyCode[]>([]);

  return (
    <CurrencyContext.Provider value={{ primary, extras, setPrimary, setExtras }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}

export default CurrencyProvider;
