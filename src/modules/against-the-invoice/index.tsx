// Against the Invoice Module — Barrel Export

export { AgainstInvoiceDashboard } from './views/AgainstInvoiceDashboard';
export { ATICreateForm }           from './views/ATICreateForm';
export { useATIViewModel }         from './viewModels/useATIViewModel';
export { ATIFirebaseService, generateATIId } from './models/atiFirebaseService';
export type {
  AgainstInvoiceEntry,
  ATIFilters,
  ATIStats,
  ATIStatus,
  ATIPaymentMode,
  InvoiceBalanceSummary,
} from './models/types';

// ── Route Wrapper (matches your existing pattern) ─────────────────────────────
import React from 'react';
import { AgainstInvoiceDashboard as ATIDashboard } from './views/AgainstInvoiceDashboard';

export function AgainstInvoiceWrapper() {
  return <ATIDashboard />;
}