// Commission Report ViewModel
// UPDATED:
//   - Fetches salary records alongside commissions to show the salary-linkage
//     status of each commission (whether it has been reflected in salary).
//   - Exposes `getSalaryLinkStatus(commission)` so the report UI can show a
//     badge: 'Linked to Salary' | 'Salary Not Yet Created' | 'Not Confirmed'.

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type { Commission, CommissionFilter, CommissionStats } from '../models/types';
import type { Salary } from '../../salary/models/types';
import {
  filterCommissions,
  getCommissionStats,
  formatCurrency,
  formatMonth,
  exportCommissionsToCSV,
} from '../models/commissionService';
import { CommissionFirebaseService } from '../models/Commissionfirebaseservice';
import { SalaryFirebaseService }     from '../../salary/models/salaryFirebaseService';

// ─── Salary linkage status for a commission row ───────────────────────────

export type SalaryLinkStatus =
  | 'linked'                // A salary record exists for this employee+month with commission > 0
  | 'salary-exists-no-commission' // Salary record exists but commission field is 0
  | 'no-salary'             // No salary record for this employee+month
  | 'not-confirmed';        // Commission is not yet Confirmed — salary can't be auto-linked

// ─── Return type ─────────────────────────────────────────────────────────────

interface UseCommissionReportViewModelReturn {
  commissions:             Commission[];
  filteredCommissions:     Commission[];
  isLoading:               boolean;
  filters:                 CommissionFilter;
  setFilters:              (filters: CommissionFilter) => void;
  updateFilter:            (key: keyof CommissionFilter, value: string) => void;
  clearFilters:            () => void;
  activeFilterCount:       number;
  showFilters:             boolean;
  setShowFilters:          (show: boolean) => void;
  stats:                   CommissionStats;
  refreshCommissions:      () => void;
  exportToCSV:             () => string;
  formatCurrency:          (amount: number) => string;
  formatMonth:             (monthStr: string) => string;
  // Salary linkage
  getSalaryLinkStatus:     (commission: Commission) => SalaryLinkStatus;
  salaryLinkLoading:       boolean;
}

// ─── Initial filter state ─────────────────────────────────────────────────

const initialFilters: CommissionFilter = {
  salesperson: '',
  city:        '',
  month:       '',
  status:      undefined,
};

// ─── ViewModel ───────────────────────────────────────────────────────────────

export function useCommissionReportViewModel(): UseCommissionReportViewModelReturn {
  const [commissions,       setCommissions]       = useState<Commission[]>([]);
  const [salaryRecords,     setSalaryRecords]     = useState<Salary[]>([]);
  const [isLoading,         setIsLoading]         = useState(true);
  const [salaryLinkLoading, setSalaryLinkLoading] = useState(false);
  const [filters,           setFilters]           = useState<CommissionFilter>(initialFilters);
  const [showFilters,       setShowFilters]       = useState(false);

  // ── Data loading ──────────────────────────────────────────────────────
  const loadCommissions = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await CommissionFirebaseService.fetchAllCommissions();
      setCommissions(data);
    } catch (error) {
      console.error('Error loading commissions:', error);
      toast.error('Failed to load commission records');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadSalaryRecords = useCallback(async () => {
    try {
      setSalaryLinkLoading(true);
      const data = await SalaryFirebaseService.fetchAllSalaries();
      setSalaryRecords(data);
    } catch (error) {
      // Non-fatal — salary linkage badges will just show 'no-salary'
      console.warn('[CommissionReport] Could not load salary records for linkage check:', error);
    } finally {
      setSalaryLinkLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCommissions();
    loadSalaryRecords();
  }, [loadCommissions, loadSalaryRecords]);

  // ── Filtering ─────────────────────────────────────────────────────────
  const filteredCommissions = useMemo(
    () => filterCommissions(commissions, filters),
    [commissions, filters]
  );

  const updateFilter = useCallback((key: keyof CommissionFilter, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => setFilters(initialFilters), []);

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== '' && v !== undefined
  ).length;

  // ── Stats ─────────────────────────────────────────────────────────────
  const stats = useMemo(
    () => getCommissionStats(filteredCommissions),
    [filteredCommissions]
  );

  // ── Salary linkage status ─────────────────────────────────────────────
  // Determines whether a commission has been reflected in the salary module.
  const getSalaryLinkStatus = useCallback(
    (commission: Commission): SalaryLinkStatus => {
      if (commission.status !== 'Confirmed') return 'not-confirmed';

      const matchingSalary = salaryRecords.find(
        (s) =>
          s.employeeId  === commission.salesperson &&
          s.salaryMonth === commission.month       &&
          s.subCategory === 'Employee salary'
      );

      if (!matchingSalary) return 'no-salary';

      const commissionOnSalary = matchingSalary.commission || 0;
      const expectedAmount     =
        commission.overriddenCommissionAmount ?? commission.calculatedCommissionAmount;

      if (commissionOnSalary > 0 && Math.abs(commissionOnSalary - expectedAmount) < 1) {
        return 'linked';
      }

      return 'salary-exists-no-commission';
    },
    [salaryRecords]
  );

  // ── Misc ──────────────────────────────────────────────────────────────
  const refreshCommissions = useCallback(() => {
    loadCommissions();
    loadSalaryRecords();
  }, [loadCommissions, loadSalaryRecords]);

  const exportToCSV = useCallback(
    () => exportCommissionsToCSV(filteredCommissions),
    [filteredCommissions]
  );

  return {
    commissions,
    filteredCommissions,
    isLoading,
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    activeFilterCount,
    showFilters,
    setShowFilters,
    stats,
    refreshCommissions,
    exportToCSV,
    formatCurrency,
    formatMonth,
    getSalaryLinkStatus,
    salaryLinkLoading,
  };
}