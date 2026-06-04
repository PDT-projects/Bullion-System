// Commission Calculation ViewModel
// FIXED:
//   - Invoices in Firestore store salesperson as a NAME string (e.g. "Fatima Malik"),
//     NOT a Firestore ID. The old code grouped by inv.salesperson (name) and then
//     tried employees.find(e => e.id === salespersonId) — which NEVER matched.
//   - Now resolves name → employee before grouping, so all lookups use the employee
//     object directly and commission slabs are matched by employee ID correctly.
//   - Cities dropdown is derived from real invoice `salespersonLocation` values,
//     NOT from the hardcoded CITIES constant. The wrapper calls
//     `setInvoiceCities(cities)` after loading invoices so the dropdown always
//     reflects what actually exists in your invoice data.
//   - All other logic (Uzair pooled rule, auto-save, salary linking) unchanged.

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type {
  Commission,
  CommissionCalculationResult,
  InvoiceReference,
  EmployeeReference,
} from '../models/types';
import {
  formatCurrency,
  formatMonth,
  getCurrentMonth,
} from '../models/commissionService';
import { CommissionFirebaseService } from '../models/Commissionfirebaseservice';
import { SalaryFirebaseService }     from '../../salary/models/salaryFirebaseService';

// ─── Uzair Naseem special config ─────────────────────────────────────────────
const UZAIR_NAME_MATCH    = 'uzair naseem'; // case-insensitive match against employee.name
const UZAIR_POOLED_CITIES = ['Karachi', 'Lahore'];
const UZAIR_SLAB_CITY     = 'Islamabad';

// ─── Per-salesperson invoice breakdown ───────────────────────────────────────

export interface SalespersonInvoiceBreakdown {
  salespersonId:       string;
  salespersonName:     string;
  invoices:            InvoiceReference[];
  totalSales:          number;
  invoiceCount:        number;
  slabFrom:            number;
  slabTo:              number;
  nextSlabThreshold:   number | null;
  slabProgressPercent: number;
  isPooled?:           boolean;
  pooledCitySales?:    { city: string; amount: number; invoiceCount: number }[];
}

// ─── Local calculation helper ─────────────────────────────────────────────────

function calculateCommissionsFromInvoices(
  city:        string,
  month:       string,
  invoices:    InvoiceReference[],
  employees:   EmployeeReference[],
  slabs:       any[],
  calculatedBy = 'Admin'
): CommissionCalculationResult & { breakdowns: SalespersonInvoiceBreakdown[] } {
  const errors: string[] = [];

  // ── Helpers ──────────────────────────────────────────────────────────────
  function isInMonth(inv: InvoiceReference): boolean {
    const d = new Date(inv.date);
    if (isNaN(d.getTime())) return false;
    const invMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return invMonth === month;
  }

  function normalizeCity(raw: string | undefined): string {
    return (raw ?? '').trim().toLowerCase();
  }

  function normalizeStr(s: string | undefined): string {
    return (s ?? '').trim().toLowerCase();
  }

  // Invoices store salesperson as a NAME. We match by salespersonLocation for city.
  function cityMatches(inv: InvoiceReference, targetCity: string): boolean {
    const normalizedTarget = normalizeCity(targetCity);
    if (normalizeCity(inv.salespersonLocation) === normalizedTarget) return true;
    if (normalizeCity(inv.customerCity) === normalizedTarget) return true;
    if (normalizeCity(inv.branch) === normalizedTarget) return true;
    return false;
  }

  // ── Build a name → employee lookup map ───────────────────────────────────
  // Key: lowercased name, Value: EmployeeReference
  const employeeByName = new Map<string, EmployeeReference>();
  employees.forEach(e => {
    if (e.name) employeeByName.set(normalizeStr(e.name), e);
  });

  // Also build an ID → employee lookup map for invoices that may store the
  // salesperson as an employee ID instead of a name.
  const employeeById = new Map<string, EmployeeReference>();
  employees.forEach(e => {
    if (e.id) employeeById.set(e.id, e);
  });

  // ── Identify Uzair by employee object ────────────────────────────────────
  const uzairEmployee = employees.find(
    e => normalizeStr(e.name) === UZAIR_NAME_MATCH
  );

  // ── Standard city invoices (paid, salesperson present, correct month) ──
  const standardInvoices = invoices.filter(inv => {
    if (inv.status !== 'Paid')      return false;
    if (!inv.salesperson)           return false;
    if (!isInMonth(inv))            return false;
    if (!cityMatches(inv, city))    return false;
    return true;
  });

  // ── Group invoices by salesperson — prefer employee ID when available,
  // otherwise fall back to the raw salesperson string (usually a name).
  const grouped: Record<string, InvoiceReference[]> = {};
  standardInvoices.forEach(inv => {
    const raw = inv.salesperson!.trim();
    const byId = employeeById.get(raw);
    const byName = employeeByName.get(normalizeStr(raw));
    const key = byId ? byId.id : byName ? byName.id : raw;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(inv);
  });

  const commissions: Commission[] = [];
  const breakdowns:  SalespersonInvoiceBreakdown[] = [];

  // ── Process each salesperson found in standard grouping ─────────────────
  Object.entries(grouped).forEach(([salespersonKey, spInvoices]) => {
    // Resolve key → employee (key may be an ID or a raw name)
    const employee = employeeById.get(salespersonKey) ?? employeeByName.get(normalizeStr(salespersonKey));
    if (!employee) {
      errors.push(`Employee record not found for salesperson: "${salespersonKey}"`);
      return;
    }

    const salespersonId = employee.id;
    const isUzair       = normalizeStr(employee.name) === UZAIR_NAME_MATCH;

    // ── UZAIR SPECIAL LOGIC ──────────────────────────────────────────────
    if (isUzair && normalizeCity(city) === normalizeCity(UZAIR_SLAB_CITY)) {
      const pooledCityData: { city: string; amount: number; invoiceCount: number }[] = [];
      let pooledInvoices: InvoiceReference[] = [...spInvoices];

      UZAIR_POOLED_CITIES.forEach(poolCity => {
        const cityInvoices = invoices.filter(inv => {
          if (inv.status !== 'Paid') return false;
          if (!isInMonth(inv))       return false;
          if (normalizeCity(inv.salespersonLocation) !== normalizeCity(poolCity)) return false;
          return true;
        });
        const cityTotal = cityInvoices.reduce((s, i) => s + i.totalAmount, 0);
        pooledCityData.push({ city: poolCity, amount: cityTotal, invoiceCount: cityInvoices.length });
        pooledInvoices = [...pooledInvoices, ...cityInvoices];
      });

      // De-duplicate by id
      const seen = new Set<string>();
      pooledInvoices = pooledInvoices.filter(inv => {
        if (seen.has(inv.id)) return false;
        seen.add(inv.id);
        return true;
      });

      const totalSales = pooledInvoices.reduce((s, i) => s + i.totalAmount, 0);

      const applicableSlab = slabs.find(
        slab =>
          slab.salesperson === salespersonId &&
          normalizeCity(slab.city) === normalizeCity(UZAIR_SLAB_CITY) &&
          totalSales >= slab.fromAmount &&
          totalSales <= slab.toAmount
      );

      const higherSlabs = slabs
        .filter(s =>
          s.salesperson === salespersonId &&
          normalizeCity(s.city) === normalizeCity(UZAIR_SLAB_CITY) &&
          s.fromAmount > totalSales
        )
        .sort((a, b) => a.fromAmount - b.fromAmount);

      const nextSlabThreshold = higherSlabs.length > 0 ? higherSlabs[0].fromAmount : null;

      let slabProgressPercent = 0;
      if (applicableSlab) {
        slabProgressPercent = Math.min(
          100,
          Math.round(((totalSales - applicableSlab.fromAmount) / (applicableSlab.toAmount - applicableSlab.fromAmount)) * 100)
        );
      } else if (nextSlabThreshold) {
        slabProgressPercent = Math.min(100, Math.round((totalSales / nextSlabThreshold) * 100));
      }

      const ownCitySales = spInvoices.reduce((s, i) => s + i.totalAmount, 0);
      const allPooledData = [
        { city: city, amount: ownCitySales, invoiceCount: spInvoices.length },
        ...pooledCityData,
      ];

      breakdowns.push({
        salespersonId,
        salespersonName:   employee.name,
        invoices:          pooledInvoices,
        totalSales,
        invoiceCount:      pooledInvoices.length,
        slabFrom:          applicableSlab?.fromAmount ?? 0,
        slabTo:            applicableSlab?.toAmount   ?? 0,
        nextSlabThreshold,
        slabProgressPercent,
        isPooled:          true,
        pooledCitySales:   allPooledData,
      });

      if (!applicableSlab) {
        errors.push(
          `No commission slab for ${employee.name} (pooled: ${UZAIR_SLAB_CITY}) covering combined sales of ${formatCurrency(totalSales)}`
        );
        return;
      }

      const commissionAmount = (totalSales * applicableSlab.commissionPercentage) / 100;

      commissions.push({
        id:                         `TEMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        salesperson:                salespersonId,
        salespersonName:            employee.name,
        city:                       `${city} + Karachi + Lahore (Pooled)`,
        month,
        totalSales,
        invoiceCount:               pooledInvoices.length,
        appliedSlabFrom:            applicableSlab.fromAmount,
        appliedSlabTo:              applicableSlab.toAmount,
        commissionPercentage:       applicableSlab.commissionPercentage,
        calculatedCommissionAmount: commissionAmount,
        status:                     'Calculated',
        calculatedBy,
        calculatedAt:               new Date().toISOString(),
        isLocked:                   false,
        notes: `Pooled: ${city} (Rs ${ownCitySales.toLocaleString()}) + Karachi (Rs ${pooledCityData.find(p=>p.city==='Karachi')?.amount.toLocaleString() ?? 0}) + Lahore (Rs ${pooledCityData.find(p=>p.city==='Lahore')?.amount.toLocaleString() ?? 0})`,
      } as Commission);

      return;
    }

    // ── STANDARD LOGIC for all other salespersons ─────────────────────────
    const totalSales = spInvoices.reduce((s, inv) => s + inv.totalAmount, 0);

    const applicableSlab = slabs.find(
      slab =>
        slab.salesperson === salespersonId &&
        normalizeCity(slab.city) === normalizeCity(city) &&
        totalSales >= slab.fromAmount &&
        totalSales <= slab.toAmount
    );

    const higherSlabs = slabs
      .filter(s =>
        s.salesperson === salespersonId &&
        normalizeCity(s.city) === normalizeCity(city) &&
        s.fromAmount > totalSales
      )
      .sort((a, b) => a.fromAmount - b.fromAmount);

    const nextSlabThreshold = higherSlabs.length > 0 ? higherSlabs[0].fromAmount : null;

    let slabProgressPercent = 0;
    if (applicableSlab) {
      slabProgressPercent = Math.min(
        100,
        Math.round(((totalSales - applicableSlab.fromAmount) / (applicableSlab.toAmount - applicableSlab.fromAmount)) * 100)
      );
    } else if (nextSlabThreshold) {
      slabProgressPercent = Math.min(100, Math.round((totalSales / nextSlabThreshold) * 100));
    }

    breakdowns.push({
      salespersonId,
      salespersonName:   employee.name,
      invoices:          spInvoices,
      totalSales,
      invoiceCount:      spInvoices.length,
      slabFrom:          applicableSlab?.fromAmount ?? 0,
      slabTo:            applicableSlab?.toAmount   ?? 0,
      nextSlabThreshold,
      slabProgressPercent,
      isPooled:          false,
    });

    if (!applicableSlab) {
      errors.push(`No commission slab for ${employee.name} in ${city} covering sales of ${formatCurrency(totalSales)}`);
      return;
    }

    const commissionAmount = (totalSales * applicableSlab.commissionPercentage) / 100;

    commissions.push({
      id:                         `TEMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      salesperson:                salespersonId,
      salespersonName:            employee.name,
      city, month, totalSales,
      invoiceCount:               spInvoices.length,
      appliedSlabFrom:            applicableSlab.fromAmount,
      appliedSlabTo:              applicableSlab.toAmount,
      commissionPercentage:       applicableSlab.commissionPercentage,
      calculatedCommissionAmount: commissionAmount,
      status:                     'Calculated',
      calculatedBy,
      calculatedAt:               new Date().toISOString(),
      isLocked:                   false,
    });
  });

  // ── Edge case: Uzair is not in the selected city's invoices ─────────────
  const groupedContainsUzair = Object.keys(grouped).some(k => {
    const emp = employeeById.get(k) ?? employeeByName.get(normalizeStr(k));
    return emp ? normalizeStr(emp.name) === UZAIR_NAME_MATCH : false;
  });

  if (uzairEmployee && normalizeCity(city) === normalizeCity(UZAIR_SLAB_CITY) && !groupedContainsUzair) {
    const pooledCityData: { city: string; amount: number; invoiceCount: number }[] = [];
    let pooledInvoices: InvoiceReference[] = [];

    // Include Uzair's own invoices across ALL cities for the month
    const uzairAllInvoices = invoices.filter(inv =>
      inv.status === 'Paid' &&
      normalizeStr(inv.salesperson) === UZAIR_NAME_MATCH &&
      isInMonth(inv)
    );
    const uzairOwnTotal = uzairAllInvoices.reduce((s, i) => s + i.totalAmount, 0);
    pooledInvoices = [...uzairAllInvoices];

    if (uzairOwnTotal > 0) {
      pooledCityData.push({ city: city, amount: uzairOwnTotal, invoiceCount: uzairAllInvoices.length });
    }

    UZAIR_POOLED_CITIES.forEach(poolCity => {
      const cityInvoices = invoices.filter(inv => {
        if (inv.status !== 'Paid') return false;
        if (!isInMonth(inv))       return false;
        if (normalizeCity(inv.salespersonLocation) !== normalizeCity(poolCity)) return false;
        return true;
      });
      const cityTotal = cityInvoices.reduce((s, i) => s + i.totalAmount, 0);
      pooledCityData.push({ city: poolCity, amount: cityTotal, invoiceCount: cityInvoices.length });
      pooledInvoices = [...pooledInvoices, ...cityInvoices];
    });

    // De-duplicate
    const seen = new Set<string>();
    pooledInvoices = pooledInvoices.filter(inv => {
      if (seen.has(inv.id)) return false;
      seen.add(inv.id);
      return true;
    });

    const totalSales = pooledInvoices.reduce((s, i) => s + i.totalAmount, 0);

    if (totalSales > 0) {
      const applicableSlab = slabs.find(
        slab =>
          slab.salesperson === uzairEmployee.id &&
          normalizeCity(slab.city) === normalizeCity(UZAIR_SLAB_CITY) &&
          totalSales >= slab.fromAmount &&
          totalSales <= slab.toAmount
      );

      const higherSlabs = slabs
        .filter(s =>
          s.salesperson === uzairEmployee.id &&
          normalizeCity(s.city) === normalizeCity(UZAIR_SLAB_CITY) &&
          s.fromAmount > totalSales
        )
        .sort((a, b) => a.fromAmount - b.fromAmount);

      const nextSlabThreshold = higherSlabs.length > 0 ? higherSlabs[0].fromAmount : null;

      let slabProgressPercent = 0;
      if (applicableSlab) {
        slabProgressPercent = Math.min(
          100,
          Math.round(((totalSales - applicableSlab.fromAmount) / (applicableSlab.toAmount - applicableSlab.fromAmount)) * 100)
        );
      } else if (nextSlabThreshold) {
        slabProgressPercent = Math.min(100, Math.round((totalSales / nextSlabThreshold) * 100));
      }

      breakdowns.push({
        salespersonId:     uzairEmployee.id,
        salespersonName:   uzairEmployee.name,
        invoices:          pooledInvoices,
        totalSales,
        invoiceCount:      pooledInvoices.length,
        slabFrom:          applicableSlab?.fromAmount ?? 0,
        slabTo:            applicableSlab?.toAmount   ?? 0,
        nextSlabThreshold,
        slabProgressPercent,
        isPooled:          true,
        pooledCitySales:   pooledCityData,
      });

      if (!applicableSlab) {
        errors.push(
          `No commission slab for ${uzairEmployee.name} (pooled: ${UZAIR_SLAB_CITY}) covering combined sales of ${formatCurrency(totalSales)}`
        );
      } else {
        const commissionAmount = (totalSales * applicableSlab.commissionPercentage) / 100;
        commissions.push({
          id:                         `TEMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          salesperson:                uzairEmployee.id,
          salespersonName:            uzairEmployee.name,
          city:                       `Pooled: ${UZAIR_SLAB_CITY} + ${UZAIR_POOLED_CITIES.join(' + ')}`,
          month,
          totalSales,
          invoiceCount:               pooledInvoices.length,
          appliedSlabFrom:            applicableSlab.fromAmount,
          appliedSlabTo:              applicableSlab.toAmount,
          commissionPercentage:       applicableSlab.commissionPercentage,
          calculatedCommissionAmount: commissionAmount,
          status:                     'Calculated',
          calculatedBy,
          calculatedAt:               new Date().toISOString(),
          isLocked:                   false,
          notes: `Pooled: ${pooledCityData.map(p => `${p.city}: Rs ${p.amount.toLocaleString()}`).join(' | ')}`,
        } as Commission);
      }
    }
  }

  return {
    commissions, errors,
    summary: {
      totalSalespeople:  commissions.length,
      totalSales:        commissions.reduce((s, c) => s + c.totalSales, 0),
      totalCommission:   commissions.reduce((s, c) => s + c.calculatedCommissionAmount, 0),
      totalInvoicesUsed: commissions.reduce((s, c) => s + c.invoiceCount, 0),
    },
    breakdowns,
  };
}

// ─── Return type ──────────────────────────────────────────────────────────────

interface UseCommissionCalculationViewModelReturn {
  selectedCity:            string;
  setSelectedCity:         (city: string) => void;
  selectedMonth:           string;
  setSelectedMonth:        (month: string) => void;
  commissionData:          Commission[];
  calculationErrors:       string[];
  summary: {
    totalSalespeople: number; totalSales: number;
    totalCommission: number;  totalInvoicesUsed: number;
  } | null;
  invoiceBreakdowns:       SalespersonInvoiceBreakdown[];
  expandedSalesperson:     string | null;
  setExpandedSalesperson:  (id: string | null) => void;
  showModal:               boolean;
  setShowModal:            (show: boolean) => void;
  isFullScreen:            boolean;
  setIsFullScreen:         (full: boolean) => void;
  isCalculating:           boolean;
  isEditing:               string | null;
  editValues:              { percentage: number; amount: number };
  setEditValues:           (values: { percentage: number; amount: number }) => void;
  liveCommissions:         Commission[];
  liveCommissionsLoading:  boolean;
  refreshLiveCommissions:  () => void;
  calculateCommission:     (invoices: InvoiceReference[], employees: EmployeeReference[]) => Promise<boolean>;
  confirmSingleCommission: (commissionId: string) => void;
  confirmAllCommissions:   () => void;
  startEdit:               (commission: Commission) => void;
  saveEdit:                (commissionId: string) => void;
  cancelEdit:              () => void;
  cancelCalculation:       () => void;
  handleModalConfirm:      () => Promise<void>;
  handleModalCancel:       () => void;
  formatCurrency:          (amount: number) => string;
  formatMonth:             (monthStr: string) => string;
  cities:                  string[];
  setInvoiceCities:        (cities: string[]) => void;
}

// ─── ViewModel ────────────────────────────────────────────────────────────────

export function useCommissionCalculationViewModel(
  onCommissionsSaved: () => void
): UseCommissionCalculationViewModelReturn {

  const [selectedCity,        setSelectedCity]        = useState('');
  const [selectedMonth,       setSelectedMonth]       = useState(getCurrentMonth());
  const [commissionData,      setCommissionData]      = useState<Commission[]>([]);
  const [calculationErrors,   setCalculationErrors]   = useState<string[]>([]);
  const [summary,             setSummary]             = useState<{
    totalSalespeople: number; totalSales: number;
    totalCommission: number;  totalInvoicesUsed: number;
  } | null>(null);
  const [invoiceBreakdowns,   setInvoiceBreakdowns]   = useState<SalespersonInvoiceBreakdown[]>([]);
  const [expandedSalesperson, setExpandedSalesperson] = useState<string | null>(null);
  const [showModal,           setShowModal]           = useState(false);
  const [isFullScreen,        setIsFullScreen]        = useState(false);
  const [isCalculating,       setIsCalculating]       = useState(false);
  const [isEditing,           setIsEditing]           = useState<string | null>(null);
  const [editValues,          setEditValues]          = useState({ percentage: 0, amount: 0 });
  const [liveCommissions,         setLiveCommissions]         = useState<Commission[]>([]);
  const [liveCommissionsLoading,  setLiveCommissionsLoading]  = useState(false);

  // Dynamic cities — set by the wrapper after invoices are loaded
  const [invoiceCities, setInvoiceCities] = useState<string[]>([]);

  // ── Fetch ALL commissions for live panel ──────────────────────────────
  const refreshLiveCommissions = useCallback(async () => {
    setLiveCommissionsLoading(true);
    try {
      const all = await CommissionFirebaseService.fetchAllCommissions();
      const sorted = [...all].sort(
        (a, b) => new Date(b.calculatedAt).getTime() - new Date(a.calculatedAt).getTime()
      );
      setLiveCommissions(sorted);
    } catch (err) {
      console.warn('[CommissionCalc] Could not load live commissions:', err);
    } finally {
      setLiveCommissionsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshLiveCommissions();
  }, [refreshLiveCommissions]);

  // ── Calculate + AUTO SAVE ─────────────────────────────────────────────
  const calculateCommission = useCallback(
    async (invoices: InvoiceReference[], employees: EmployeeReference[]): Promise<boolean> => {
      if (!selectedCity || !selectedMonth) {
        setCalculationErrors(['Please select both a city and a month']);
        return false;
      }
      setIsCalculating(true);
      setCalculationErrors([]);

      try {
        const slabs  = await CommissionFirebaseService.fetchAllSlabs();
        const result = calculateCommissionsFromInvoices(
          selectedCity, selectedMonth, invoices, employees, slabs, 'Admin'
        );

        setCommissionData(result.commissions);
        setCalculationErrors(result.errors);
        setSummary(result.summary);
        setInvoiceBreakdowns(result.breakdowns);

        // Clean up stale records for salespersons whose slab didn't match
        {
          const savedSalespersonIds = new Set(result.commissions.map(c => c.salesperson));
          const staleCleanups = result.breakdowns
            .filter(b => !savedSalespersonIds.has(b.salespersonId))
            .map(b =>
              CommissionFirebaseService.deleteExistingCommissions(
                b.salespersonId,
                selectedMonth,
                b.isPooled
                  ? `Pooled: ${selectedCity} + Karachi + Lahore`
                  : selectedCity
              )
            );
          await Promise.allSettled(staleCleanups);
        }

        if (result.commissions.length === 0) {
          toast.error('No commissions to save — check that salesperson names match employee records and slabs are configured for this city.');
          return false;
        }

        // ✅ AUTO-SAVE
        try {
          const toSave = result.commissions.map(({ id, ...rest }) => ({
            ...rest,
            status:      'Confirmed' as const,
            confirmedBy: 'Admin',
            confirmedAt: new Date().toISOString(),
            isLocked:    true,
          }));

          const savedCommissions = await CommissionFirebaseService.saveCommissions(toSave);

          // ✅ Link commission amounts to salary records
          let linkedCount = 0;
          try {
            const allSalaries = await SalaryFirebaseService.fetchAllSalaries();

            const updatePromises = savedCommissions.map(async (commission) => {
              const commissionAmount =
                commission.overriddenCommissionAmount ?? commission.calculatedCommissionAmount;

              const matchingSalary = allSalaries.find(
                (s) =>
                  s.employeeId  === commission.salesperson &&
                  s.salaryMonth === commission.month       &&
                  s.subCategory === 'Employee salary'
              );

              if (matchingSalary) {
                await SalaryFirebaseService.updateSalary(matchingSalary.id, {
                  commission: commissionAmount,
                  netAmount:  Math.max(
                    0,
                    (matchingSalary.baseSalary || 0) + commissionAmount - (matchingSalary.deductions || 0)
                  ),
                });
                linkedCount++;
              }
            });

            await Promise.allSettled(updatePromises);
          } catch (linkErr) {
            console.warn('[CommissionCalc] Salary linking failed (non-fatal):', linkErr);
          }

          toast.success(
            `${toSave.length} commission(s) saved.` +
            (linkedCount > 0 ? ` Linked to ${linkedCount} salary record(s).` : ' Ready for salary forms.')
          );

          await refreshLiveCommissions();
          onCommissionsSaved();
          return true;

        } catch (saveErr) {
          const msg = saveErr instanceof Error ? saveErr.message : 'Failed to save commissions';
          toast.error(msg);
          return false;
        }

      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Calculation failed';
        setCalculationErrors([msg]);
        toast.error(msg);
        return false;
      } finally {
        setIsCalculating(false);
      }
    },
    [selectedCity, selectedMonth, onCommissionsSaved, refreshLiveCommissions]
  );

  // ── Confirm helpers ───────────────────────────────────────────────────
  const confirmSingleCommission = useCallback((commissionId: string) => {
    setCommissionData(prev =>
      prev.map(c =>
        c.id === commissionId
          ? { ...c, status: 'Confirmed' as const, confirmedBy: 'Admin', confirmedAt: new Date().toISOString(), isLocked: true }
          : c
      )
    );
  }, []);

  const confirmAllCommissions = useCallback(() => {
    const now = new Date().toISOString();
    setCommissionData(prev =>
      prev.map(c => ({ ...c, status: 'Confirmed' as const, confirmedBy: 'Admin', confirmedAt: now, isLocked: true }))
    );
  }, []);

  // ── Edit helpers ──────────────────────────────────────────────────────
  const startEdit = useCallback((commission: Commission) => {
    setIsEditing(commission.id);
    setEditValues({
      percentage: commission.overriddenCommissionPercentage ?? commission.commissionPercentage,
      amount:     commission.overriddenCommissionAmount     ?? commission.calculatedCommissionAmount,
    });
  }, []);

  const saveEdit = useCallback((commissionId: string) => {
    setCommissionData(prev =>
      prev.map(c =>
        c.id === commissionId
          ? { ...c, overriddenCommissionPercentage: editValues.percentage, overriddenCommissionAmount: editValues.amount, status: 'Adjusted' as const }
          : c
      )
    );
    setIsEditing(null);
  }, [editValues]);

  const cancelEdit = useCallback(() => {
    setIsEditing(null);
    setEditValues({ percentage: 0, amount: 0 });
  }, []);

  // ── Reset ─────────────────────────────────────────────────────────────
  const resetState = useCallback(() => {
    setCommissionData([]);
    setSelectedCity('');
    setSelectedMonth(getCurrentMonth());
    setCalculationErrors([]);
    setSummary(null);
    setInvoiceBreakdowns([]);
    setExpandedSalesperson(null);
  }, []);

  const cancelCalculation = useCallback(() => resetState(), [resetState]);

  const handleModalConfirm = useCallback(async () => {
    toast.info('Commissions already saved automatically');
  }, []);

  const handleModalCancel = useCallback(() => {
    setShowModal(false);
    resetState();
  }, [resetState]);

  return {
    selectedCity,          setSelectedCity,
    selectedMonth,         setSelectedMonth,
    commissionData,
    calculationErrors,
    summary,
    invoiceBreakdowns,
    expandedSalesperson,   setExpandedSalesperson,
    showModal,             setShowModal,
    isFullScreen,          setIsFullScreen,
    isCalculating,
    isEditing,
    editValues,            setEditValues,
    liveCommissions,
    liveCommissionsLoading,
    refreshLiveCommissions,
    calculateCommission,
    confirmSingleCommission,
    confirmAllCommissions,
    startEdit,
    saveEdit,
    cancelEdit,
    cancelCalculation,
    handleModalConfirm,
    handleModalCancel,
    formatCurrency,
    formatMonth,
    cities:          invoiceCities,
    setInvoiceCities,
  };
}