// Commission Auto-Calculation Service
// Location: src/modules/commission/models/Commissionautoservice.ts
//
// Exports TWO functions:
//
//  1. calculateAutoCommission()
//     Pure calculation — called by useSalaryFormViewModel to auto-fill
//     the commission field when selecting an employee + month.
//     Matches invoices by employee NAME (invoices store name strings)
//     Matches slabs by employee ID (slabs store Firestore IDs)
//
//  2. autoCalculateCommissionOnInvoiceSave()
//     Side-effect trigger — called by useInvoiceFormViewModel after a
//     Paid invoice is saved. Upserts a Commission record in Firestore.
//     Also matches by name→ID resolution for consistency.
//
// DATA SHAPE (from Firestore):
//   invoice.salesperson         = "Fatima Malik"        (name string)
//   invoice.salespersonLocation = "Faisalabad"          (city)
//   slab.salesperson            = "y2tY2P4dzBkrP8qOwhNf" (Firestore ID)
//   slab.city                   = "Faisalabad"

import { CommissionFirebaseService } from './Commissionfirebaseservice';
import { InvoiceFirebaseService }     from '../../invoices/models/InvoiceFirebaseService';
import { EmployeeFirebaseService }    from '../../employee/models/employeeFirebaseService';
import type { Invoice }               from '../../invoices/models/types';
import type { CommissionSlab }        from './types';

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface CommissionAutoResult {
  totalSales:           number;
  invoiceCount:         number;
  commissionAmount:     number;
  commissionPercentage: number;
  slabFrom:             number;
  slabTo:               number;
  city:                 string;
  breakdown:            CommissionCityBreakdown[];
  hasMatch:             boolean;
  noSlabCities:         string[];
}

export interface CommissionCityBreakdown {
  city:                 string;
  invoiceCount:         number;
  totalSales:           number;
  commissionPercentage: number;
  commissionAmount:     number;
  slabFrom:             number;
  slabTo:               number;
  matched:              boolean;
}

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

// ─── 1. Pure calculation helper (used by salary form) ────────────────────────

/**
 * Calculate commission for one employee for one month.
 *
 * @param employeeId   Firestore ID  — used to match commission slabs
 * @param employeeName Display name  — used to match invoices (invoices store name, not ID)
 * @param month        'YYYY-MM' e.g. '2025-03'
 * @param allInvoices  Full invoice list from Firestore
 * @param allSlabs     Full commission_slabs list from Firestore
 */
export function calculateAutoCommission(
  employeeId:   string,
  employeeName: string,
  month:        string,
  allInvoices:  Invoice[],
  allSlabs:     CommissionSlab[]
): CommissionAutoResult {

  const empty: CommissionAutoResult = {
    totalSales: 0, invoiceCount: 0, commissionAmount: 0,
    commissionPercentage: 0, slabFrom: 0, slabTo: 0, city: '',
    breakdown: [], hasMatch: false, noSlabCities: [],
  };

  if (!employeeId || !employeeName || !month) return empty;

  const normalizedName = employeeName.trim().toLowerCase();

  // Filter paid invoices for this employee in this month — match by NAME
  const employeeInvoices = allInvoices.filter((inv) => {
    if (inv.status !== 'Paid') return false;
    if (!inv.salesperson) return false;
    if (inv.salesperson.trim().toLowerCase() !== normalizedName) return false;
    if (!inv.date) return false;
    const d = new Date(inv.date);
    if (isNaN(d.getTime())) return false;
    const invMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return invMonth === month;
  });

  if (employeeInvoices.length === 0) {
    console.log(`[CommissionAuto] No paid invoices for "${employeeName}" in ${month}`);
    return empty;
  }

  // Group by salespersonLocation (matches slab.city)
  const byCityMap: Record<string, Invoice[]> = {};
  employeeInvoices.forEach((inv) => {
    const city = (inv.salespersonLocation || '').trim();
    if (!city) return;
    if (!byCityMap[city]) byCityMap[city] = [];
    byCityMap[city].push(inv);
  });

  if (Object.keys(byCityMap).length === 0) {
    console.warn(
      `[CommissionAuto] "${employeeName}" has ${employeeInvoices.length} paid invoices ` +
      `in ${month} but none have salespersonLocation set.`
    );
    return { ...empty, invoiceCount: employeeInvoices.length };
  }

  // Match each city group against slabs using employeeId (slabs store ID)
  const breakdown: CommissionCityBreakdown[] = [];
  const noSlabCities: string[] = [];

  Object.entries(byCityMap).forEach(([city, invoices]) => {
    const cityTotal    = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const invoiceCount = invoices.length;

    const slab = allSlabs.find(
      (s) =>
        s.salesperson === employeeId &&
        s.city.trim().toLowerCase() === city.trim().toLowerCase() &&
        cityTotal >= s.fromAmount &&
        cityTotal <= s.toAmount
    );

    if (slab) {
      const commissionAmount = (cityTotal * slab.commissionPercentage) / 100;
      console.log(
        `[CommissionAuto] ✅ "${employeeName}" / ${city}: ` +
        `${invoiceCount} invoices, sales=${cityTotal}, ` +
        `slab ${slab.fromAmount}–${slab.toAmount} @ ${slab.commissionPercentage}% = ${commissionAmount}`
      );
      breakdown.push({
        city, invoiceCount, totalSales: cityTotal,
        commissionPercentage: slab.commissionPercentage,
        commissionAmount, slabFrom: slab.fromAmount,
        slabTo: slab.toAmount, matched: true,
      });
    } else {
      const candidateSlabs = allSlabs.filter(s => s.salesperson === employeeId);
      console.warn(
        `[CommissionAuto] ❌ No slab for "${employeeName}" (${employeeId}) ` +
        `in "${city}" covering ${cityTotal}. ` +
        `Employee has ${candidateSlabs.length} slab(s): ` +
        candidateSlabs.map(s => `${s.city} ${s.fromAmount}–${s.toAmount}`).join(', ')
      );
      noSlabCities.push(city);
      breakdown.push({
        city, invoiceCount, totalSales: cityTotal,
        commissionPercentage: 0, commissionAmount: 0,
        slabFrom: 0, slabTo: 0, matched: false,
      });
    }
  });

  const totalSales      = breakdown.reduce((s, b) => s + b.totalSales, 0);
  const totalCommission = breakdown.reduce((s, b) => s + b.commissionAmount, 0);
  const hasMatch        = breakdown.some((b) => b.matched);
  const bestMatch       = breakdown
    .filter(b => b.matched)
    .sort((a, b) => b.commissionAmount - a.commissionAmount)[0];

  return {
    totalSales,
    invoiceCount:         employeeInvoices.length,
    commissionAmount:     totalCommission,
    commissionPercentage: bestMatch?.commissionPercentage ?? 0,
    slabFrom:             bestMatch?.slabFrom ?? 0,
    slabTo:               bestMatch?.slabTo   ?? 0,
    city:                 bestMatch?.city     ?? '',
    breakdown,
    hasMatch,
    noSlabCities,
  };
}

export function formatCommissionSummary(
  result:         CommissionAutoResult,
  formatCurrency: (n: number) => string
): string {
  if (!result.hasMatch || result.invoiceCount === 0) return '';
  const matched = result.breakdown.filter(b => b.matched);
  if (matched.length === 1) {
    const b = matched[0];
    return (
      `${b.invoiceCount} paid invoice${b.invoiceCount !== 1 ? 's' : ''} · ` +
      `${formatCurrency(b.totalSales)} sales · ` +
      `${b.commissionPercentage}% → ${formatCurrency(b.commissionAmount)}`
    );
  }
  return matched
    .map(b =>
      `${b.city}: ${b.invoiceCount} inv, ` +
      `${formatCurrency(b.totalSales)} × ${b.commissionPercentage}% = ${formatCurrency(b.commissionAmount)}`
    )
    .join(' | ');
}

// ─── 2. Invoice-save trigger (called by useInvoiceFormViewModel) ──────────────

/**
 * Called right after a Paid invoice is created or updated.
 * Resolves the invoice salesperson name → employee ID, then upserts
 * a Commission record in Firestore with status 'Calculated'.
 * If a 'Confirmed' commission already exists for that salesperson+city+month
 * it is left untouched.
 *
 * This function is NON-BLOCKING — caller should not await it on the UI path.
 *
 * @param invoiceId    Firestore ID of the saved invoice
 * @param calculatedBy Display name of the actor (e.g. 'Admin')
 */
export async function autoCalculateCommissionOnInvoiceSave(
  invoiceId:    string,
  calculatedBy = 'System'
): Promise<AutoCommissionTriggerResult | null> {

  // 1. Load the invoice
  const invoice = await InvoiceFirebaseService.fetchInvoiceById(invoiceId);
  if (!invoice) {
    console.warn('[AutoCommission] Invoice not found:', invoiceId);
    return null;
  }

  // Only process Paid invoices that have a salesperson name
  if (invoice.status !== 'Paid' || !invoice.salesperson) {
    console.log(
      `[AutoCommission] Skipping ${invoiceId}: ` +
      `status=${invoice.status}, salesperson=${invoice.salesperson || 'MISSING'}`
    );
    return {
      triggered: false, salespersonId: invoice.salesperson || '',
      city: '', month: '', totalSales: 0, invoiceCount: 0,
      commissionAmount: 0, commissionPercent: 0,
      message: `Skipped — invoice is ${invoice.status || 'unknown'} or has no salesperson`,
    };
  }

  // City comes from salespersonLocation (NOT customerCity)
  const salespersonName = invoice.salesperson.trim();
  const city            = (invoice.salespersonLocation || '').trim();

  if (!city) {
    console.warn('[AutoCommission] Invoice has no salespersonLocation:', invoiceId);
    return {
      triggered: false, salespersonId: salespersonName,
      city: '', month: '', totalSales: 0, invoiceCount: 0,
      commissionAmount: 0, commissionPercent: 0,
      message: 'Skipped — invoice has no salespersonLocation',
    };
  }

  // Derive month from invoice date
  const invoiceDate = new Date(invoice.date);
  if (isNaN(invoiceDate.getTime())) {
    console.warn('[AutoCommission] Invalid invoice date:', invoice.date);
    return null;
  }
  const month = `${invoiceDate.getFullYear()}-${String(invoiceDate.getMonth() + 1).padStart(2, '0')}`;

  // 2. Resolve salesperson name → Firestore employee ID
  const employees = await EmployeeFirebaseService.fetchAllEmployees();
  const employee  = employees.find(
    (e: any) => e.name.trim().toLowerCase() === salespersonName.toLowerCase()
  );

  if (!employee) {
    console.warn(
      `[AutoCommission] Could not resolve employee ID for name "${salespersonName}". ` +
      `Available: ${employees.map((e: any) => e.name).join(', ')}`
    );
    return {
      triggered: false, salespersonId: salespersonName,
      city, month, totalSales: 0, invoiceCount: 0,
      commissionAmount: 0, commissionPercent: 0,
      message: `Could not resolve employee ID for "${salespersonName}"`,
    };
  }

  const salespersonId = (employee as any).id;

  // 3. Fetch slabs + all invoices + existing commissions in parallel
  const [slabs, allInvoices, existingCommissions] = await Promise.all([
    CommissionFirebaseService.fetchAllSlabs(),
    InvoiceFirebaseService.fetchAllInvoices(),
    CommissionFirebaseService.fetchAllCommissions(),
  ]);

  // 4. If a Confirmed commission already exists — leave it alone
  const confirmedRecord = existingCommissions.find(
    (c) =>
      c.salesperson === salespersonId &&
      c.city        === city          &&
      c.month       === month         &&
      c.status      === 'Confirmed'
  );

  if (confirmedRecord) {
    return {
      triggered: false, salespersonId, city, month,
      totalSales:       confirmedRecord.totalSales,
      invoiceCount:     confirmedRecord.invoiceCount,
      commissionAmount: confirmedRecord.overriddenCommissionAmount ?? confirmedRecord.calculatedCommissionAmount,
      commissionPercent: confirmedRecord.overriddenCommissionPercentage ?? confirmedRecord.commissionPercentage,
      message: 'Skipped — a Confirmed commission already exists for this salesperson+city+month',
    };
  }

  // 5. Aggregate all PAID invoices for this salesperson+city this month
  //    Match invoices by NAME (salespersonName), filter by salespersonLocation
  const normalizedName = salespersonName.toLowerCase();
  const relevantInvoices = allInvoices.filter((inv) => {
    if (inv.status !== 'Paid') return false;
    if (!inv.salesperson) return false;
    if (inv.salesperson.trim().toLowerCase() !== normalizedName) return false;
    const invCity = (inv.salespersonLocation || '').trim();
    if (invCity.toLowerCase() !== city.toLowerCase()) return false;
    const d = new Date(inv.date);
    if (isNaN(d.getTime())) return false;
    const invMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return invMonth === month;
  });

  const totalSales   = relevantInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const invoiceCount = relevantInvoices.length;

  // 6. Find applicable commission slab (match by employee ID + city + range)
  const applicableSlab = slabs.find(
    (slab) =>
      slab.salesperson === salespersonId &&
      slab.city.trim().toLowerCase() === city.toLowerCase() &&
      totalSales >= slab.fromAmount &&
      totalSales <= slab.toAmount
  );

  if (!applicableSlab) {
    console.warn(
      `[AutoCommission] No slab for "${salespersonName}" (${salespersonId}) ` +
      `in "${city}" covering ${totalSales}`
    );
    // Update existing Calculated record if present (reset amounts)
    const existingCalc = existingCommissions.find(
      (c) =>
        c.salesperson === salespersonId &&
        c.city  === city  &&
        c.month === month &&
        c.status !== 'Confirmed'
    );
    if (existingCalc) {
      await CommissionFirebaseService.updateCommission(existingCalc.id, {
        totalSales, invoiceCount,
        calculatedCommissionAmount: 0, commissionPercentage: 0,
        appliedSlabFrom: 0, appliedSlabTo: 0, status: 'Calculated',
      } as any);
    }
    return {
      triggered: false, salespersonId, city, month,
      totalSales, invoiceCount,
      commissionAmount: 0, commissionPercent: 0,
      message: `No slab covers ${totalSales} sales for "${salespersonName}" in ${city}`,
    };
  }

  const commissionAmount  = (totalSales * applicableSlab.commissionPercentage) / 100;
  const commissionPercent = applicableSlab.commissionPercentage;

  // 7. Upsert the Commission record
  const existingCalc = existingCommissions.find(
    (c) =>
      c.salesperson === salespersonId &&
      c.city  === city  &&
      c.month === month &&
      c.status !== 'Confirmed'
  );

  if (existingCalc) {
    await CommissionFirebaseService.updateCommission(existingCalc.id, {
      totalSales, invoiceCount,
      commissionPercentage:       commissionPercent,
      calculatedCommissionAmount: commissionAmount,
      appliedSlabFrom:            applicableSlab.fromAmount,
      appliedSlabTo:              applicableSlab.toAmount,
      status:                     'Calculated',
    } as any);
    console.log(`[AutoCommission] Updated record ${existingCalc.id} — ${salespersonId} / ${city} / ${month}`);
  } else {
    await CommissionFirebaseService.saveCommissions([{
      salesperson:                salespersonId,
      salespersonName:            salespersonName,
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
    triggered: true, salespersonId, city, month,
    totalSales, invoiceCount, commissionAmount, commissionPercent,
    message: `Commission calculated: PKR ${commissionAmount.toFixed(0)} (${commissionPercent}% of ${totalSales})`,
  };
}