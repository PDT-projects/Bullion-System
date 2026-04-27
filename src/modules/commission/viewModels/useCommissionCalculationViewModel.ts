// Commission Calculation ViewModel
// UPDATED: Auto-saves commissions without manual confirmation modal
// SPECIAL RULE — Uzair Naseem:
//   His commission is calculated on a pooled total of:
//     1. ALL his own invoices (any city)
//     2. ALL invoices from Karachi branch (any salesperson)
//     3. ALL invoices from Lahore branch (any salesperson)
//   That combined total is matched against his commission slab (city = his own city / Islamabad)
//   and ONE combined commission record is produced for him.

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
  CITIES,
} from '../models/commissionService';
import { CommissionFirebaseService } from '../models/Commissionfirebaseservice';
import { SalaryFirebaseService }     from '../../salary/models/salaryFirebaseService';

// ─── Uzair Naseem special config ─────────────────────────────────────────────
// Change this name if the employee record ever changes.
const UZAIR_NAME_MATCH = 'uzair naseem'; // case-insensitive match against employee.name

// Branches whose FULL sales are pooled into Uzair's commission total.
const UZAIR_POOLED_CITIES = ['Karachi', 'Lahore'];

// The slab city used to look up Uzair's commission percentage.
// Uzair's slabs must be defined for this city in the commission slabs collection.
const UZAIR_SLAB_CITY = 'Islamabad';

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
  // Uzair-specific: extra breakdown info shown in the UI
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

  function cityMatches(inv: InvoiceReference, targetCity: string): boolean {
    return normalizeCity(inv.customerCity) === normalizeCity(targetCity);
  }

  // ── Identify Uzair ───────────────────────────────────────────────────────
  const uzairEmployee = employees.find(
    e => e.name?.trim().toLowerCase() === UZAIR_NAME_MATCH
  );

  // ── Standard city invoices (paid, correct city, correct month) ──────────
  const standardInvoices = invoices.filter(inv => {
    if (inv.status !== 'Paid') return false;
    if (!inv.salesperson)      return false;
    if (!isInMonth(inv))       return false;
    if (!cityMatches(inv, city)) return false;
    return true;
  });

  // ── Group standard invoices by salesperson ───────────────────────────────
  const grouped: Record<string, InvoiceReference[]> = {};
  standardInvoices.forEach(inv => {
    const key = inv.salesperson!;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(inv);
  });

  // ── Also grab Uzair's own invoices from ALL cities (he may appear across cities) ──
  // We need them only if Uzair is in the selected city OR if we are building his pool.
  // They will be merged into his pooled bucket below.

  const commissions: Commission[] = [];
  const breakdowns:  SalespersonInvoiceBreakdown[] = [];

  // ── Process each salesperson found in standard grouping ─────────────────
  Object.entries(grouped).forEach(([salespersonId, spInvoices]) => {
    const employee = employees.find(e => e.id === salespersonId);
    if (!employee) {
      errors.push(`Employee not found for salesperson ID: ${salespersonId}`);
      return;
    }

    const isUzair = employee.name?.trim().toLowerCase() === UZAIR_NAME_MATCH;

    // ── UZAIR SPECIAL LOGIC ──────────────────────────────────────────────
    if (isUzair) {
      // Collect invoices from the pooled cities (ALL paid, correct month, those cities, any salesperson)
      const pooledCityData: { city: string; amount: number; invoiceCount: number }[] = [];
      let pooledInvoices: InvoiceReference[] = [...spInvoices]; // start with Uzair's own in selected city

      UZAIR_POOLED_CITIES.forEach(poolCity => {
        const cityInvoices = invoices.filter(inv => {
          if (inv.status !== 'Paid') return false;
          if (!isInMonth(inv))       return false;
          if (!cityMatches(inv, poolCity)) return false;
          return true; // ALL salespersons from this city
        });

        const cityTotal = cityInvoices.reduce((s, i) => s + i.totalAmount, 0);
        pooledCityData.push({ city: poolCity, amount: cityTotal, invoiceCount: cityInvoices.length });
        pooledInvoices = [...pooledInvoices, ...cityInvoices];
      });

      // De-duplicate invoices by id (in case Uzair also has invoices in pooled cities)
      const seen = new Set<string>();
      pooledInvoices = pooledInvoices.filter(inv => {
        if (seen.has(inv.id)) return false;
        seen.add(inv.id);
        return true;
      });

      const totalSales = pooledInvoices.reduce((s, i) => s + i.totalAmount, 0);

      // Look up slab using Uzair's designated slab city
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

      // Own-city sales (for breakdown display)
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
        // Store breakdown note in a field the UI can show
        notes: `Pooled: ${city} (Rs ${ownCitySales.toLocaleString()}) + Karachi (Rs ${pooledCityData.find(p=>p.city==='Karachi')?.amount.toLocaleString() ?? 0}) + Lahore (Rs ${pooledCityData.find(p=>p.city==='Lahore')?.amount.toLocaleString() ?? 0})`,
      } as Commission);

      return; // ← Uzair processed; skip normal logic
    }

    // ── STANDARD LOGIC for all other salespersons ─────────────────────────
    const totalSales = spInvoices.reduce((s, inv) => s + inv.totalAmount, 0);

    const applicableSlab = slabs.find(
      slab =>
        slab.salesperson === salespersonId &&
        slab.city        === city &&
        totalSales       >= slab.fromAmount &&
        totalSales       <= slab.toAmount
    );

    const higherSlabs = slabs
      .filter(s => s.salesperson === salespersonId && s.city === city && s.fromAmount > totalSales)
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

  // ── Edge case: Uzair is not in the selected city but has pooled sales ────
  // If Uzair wasn't found in the standard grouping, still compute his pooled commission.
  if (uzairEmployee && !Object.keys(grouped).includes(uzairEmployee.id)) {
    const pooledCityData: { city: string; amount: number; invoiceCount: number }[] = [];
    let pooledInvoices: InvoiceReference[] = [];

    // Include Uzair's own invoices across ALL cities for the month
    const uzairAllInvoices = invoices.filter(inv =>
      inv.status === 'Paid' &&
      inv.salesperson === uzairEmployee.id &&
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
        if (!cityMatches(inv, poolCity)) return false;
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
      totalInvoicesUsed: [...new Set(commissions.flatMap(c => c.invoiceCount))].reduce((a, b) => a + b, 0),
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
  cities:                  readonly string[];
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

        if (result.commissions.length === 0) {
          toast.error('No commissions to save');
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

          resetState();
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
    cities: CITIES,
  };
}