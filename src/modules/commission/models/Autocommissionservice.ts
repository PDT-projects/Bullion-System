// Auto-Commission Service
// Location: src/modules/commission/models/autoCommissionService.ts
//
// Pure business logic — called whenever an invoice is created/updated.
// Responsibility:
//   1. Given a saved invoice, find the matching commission slab for its salesperson + city
//   2. Look up ALL paid invoices for that salesperson+city this month to get cumulative sales
//   3. Upsert (create or update) a Commission record with status 'Calculated'
//   4. If a 'Confirmed' commission already exists for that salesperson+month+city, leave it alone

import { CommissionFirebaseService } from './Commissionfirebaseservice';
import { InvoiceFirebaseService }     from '../../invoices/models/InvoiceFirebaseService';

export interface AutoCommissionTriggerResult {
  triggered:          boolean;
  salespersonId:      string;
  city:               string;
  month:              string;
  totalSales:         number;
  invoiceCount:       number;
  commissionAmount:   number;
  commissionPercent:  number;
  message:            string;
}

/**
 * Should be called right after an invoice is created or its status changes to 'Paid'.
 *
 * @param invoiceId    Firestore ID of the saved invoice
 * @param calculatedBy Display name of the actor (e.g. 'System' or current user name)
 */
export async function autoCalculateCommissionOnInvoiceSave(
  invoiceId: string,
  calculatedBy = 'System'
): Promise<AutoCommissionTriggerResult | null> {

  // ── 1. Load the invoice ──────────────────────────────────────────────────
  const invoice = await InvoiceFirebaseService.fetchInvoiceById(invoiceId);

  if (!invoice) {
    console.warn('[AutoCommission] Invoice not found:', invoiceId);
    console.log('[AutoCommission] DEBUG - Trigger failed for invoice:', invoiceId);
    return null;
  }

  // Only process Paid invoices that have a salesperson
  if (invoice.status !== 'Paid' || !invoice.salesperson) {
    const debugMsg = `[AutoCommission] Skipping ${invoiceId}: status=${invoice.status}, salesperson=${invoice.salesperson || 'MISSING'}`;
    console.log(debugMsg);
    return {
      triggered:         false,
      salespersonId:     invoice.salesperson || '',
      city:              invoice.customerCity || '',
      month:             '',
      totalSales:        0,
      invoiceCount:      0,
      commissionAmount:  0,
      commissionPercent: 0,
      message:           `Skipped — invoice is ${invoice.status || 'unknown'} or has no salesperson`,
    };
  }

  const salespersonId = invoice.salesperson;
  const city          = invoice.customerCity;

  // Derive the month string (YYYY-MM) from the invoice date
  const invoiceDate = new Date(invoice.date);
  if (isNaN(invoiceDate.getTime())) {
    console.warn('[AutoCommission] Invalid invoice date:', invoice.date);
    return null;
  }
  const month = `${invoiceDate.getFullYear()}-${String(invoiceDate.getMonth() + 1).padStart(2, '0')}`;

  // ── 2. Fetch slabs + all invoices in parallel ────────────────────────────
  const [slabs, allInvoices, existingCommissions] = await Promise.all([
    CommissionFirebaseService.fetchAllSlabs(),
    InvoiceFirebaseService.fetchAllInvoices(),
    CommissionFirebaseService.fetchAllCommissions(),
  ]);

  // ── 3. Check whether a Confirmed commission already exists ───────────────
  //    If it does, we must NOT overwrite it — the admin has already approved it.
  const confirmedRecord = existingCommissions.find(
    (c) =>
      c.salesperson === salespersonId &&
      c.city        === city          &&
      c.month       === month         &&
      c.status      === 'Confirmed'
  );

  if (confirmedRecord) {
    return {
      triggered:         false,
      salespersonId,
      city,
      month,
      totalSales:        confirmedRecord.totalSales,
      invoiceCount:      confirmedRecord.invoiceCount,
      commissionAmount:  confirmedRecord.overriddenCommissionAmount ?? confirmedRecord.calculatedCommissionAmount,
      commissionPercent: confirmedRecord.overriddenCommissionPercentage ?? confirmedRecord.commissionPercentage,
      message:           'Skipped — a Confirmed commission already exists for this salesperson+city+month',
    };
  }

  // ── 4. Aggregate all PAID invoices for this salesperson+city this month ──
  const relevantInvoices = allInvoices.filter((inv) => {
    if (inv.status      !== 'Paid')         return false;
    if (inv.salesperson !== salespersonId)   return false;
    if (inv.customerCity !== city)           return false;
    const d = new Date(inv.date);
    if (isNaN(d.getTime()))                 return false;
    const invMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return invMonth === month;
  });

  const totalSales   = relevantInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const invoiceCount = relevantInvoices.length;

  // ── 5. Find applicable commission slab ──────────────────────────────────
  const applicableSlab = slabs.find(
    (slab) =>
      slab.salesperson === salespersonId &&
      slab.city        === city           &&
      totalSales       >= slab.fromAmount &&
      totalSales       <= slab.toAmount
  );

  if (!applicableSlab) {
    // No slab covers current total — update existing Calculated record if present
    const existingCalc = existingCommissions.find(
      (c) =>
        c.salesperson === salespersonId &&
        c.city        === city          &&
        c.month       === month         &&
        c.status      !== 'Confirmed'
    );
    if (existingCalc) {
      await CommissionFirebaseService.updateCommission(existingCalc.id, {
        totalSales,
        invoiceCount,
        calculatedCommissionAmount: 0,
        commissionPercentage:       0,
        appliedSlabFrom:            0,
        appliedSlabTo:              0,
        status:                     'Calculated',
      } as any);
    }
    return {
      triggered:         false,
      salespersonId,
      city,
      month,
      totalSales,
      invoiceCount,
      commissionAmount:  0,
      commissionPercent: 0,
      message:           `No commission slab covers ${totalSales} sales for ${salespersonId} in ${city}`,
    };
  }

  const commissionAmount  = (totalSales * applicableSlab.commissionPercentage) / 100;
  const commissionPercent = applicableSlab.commissionPercentage;

  // ── 6. Upsert the Commission record ─────────────────────────────────────
  const existingCalc = existingCommissions.find(
    (c) =>
      c.salesperson === salespersonId &&
      c.city        === city          &&
      c.month       === month         &&
      c.status      !== 'Confirmed'
  );

  if (existingCalc) {
    await CommissionFirebaseService.updateCommission(existingCalc.id, {
      totalSales,
      invoiceCount,
      commissionPercentage:        commissionPercent,
      calculatedCommissionAmount:  commissionAmount,
      appliedSlabFrom:             applicableSlab.fromAmount,
      appliedSlabTo:               applicableSlab.toAmount,
      status:                      'Calculated',
    } as any);
    console.log(`[AutoCommission] Updated record ${existingCalc.id} — ${salespersonId} / ${city} / ${month}`);
  } else {
    await CommissionFirebaseService.saveCommissions([{
      salesperson:                salespersonId,
      salespersonName:            invoice.salesperson,
      city,
      month,
      totalSales,
      invoiceCount,
      appliedSlabFrom:            applicableSlab.fromAmount,
      appliedSlabTo:              applicableSlab.toAmount,
      commissionPercentage:       commissionPercent,
      calculatedCommissionAmount: commissionAmount,
      status:                     'Calculated' as const,
      calculatedBy,
      calculatedAt:               new Date().toISOString(),
      isLocked:                   false,
    }]);
    console.log(`[AutoCommission] Created new record — ${salespersonId} / ${city} / ${month}`);
  }

  return {
    triggered:         true,
    salespersonId,
    city,
    month,
    totalSales,
    invoiceCount,
    commissionAmount,
    commissionPercent,
    message:           `Commission calculated: PKR ${commissionAmount.toFixed(0)} (${commissionPercent}% of ${totalSales})`,
  };
}