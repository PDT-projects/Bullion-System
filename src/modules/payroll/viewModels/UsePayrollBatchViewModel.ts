// Payroll Batch ViewModel
// Manages the Generate Payroll Batch flow and the batch row table

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { PayrollBatch, PayrollBatchRow, PayrollBatchFilter } from '../models/payrollBatchTypes';
import { PayrollBatchFirebaseService } from '../models/payrollBatchFirebaseService';
import { EmployeeFirebaseService } from '../../employee/models/employeeFirebaseService';
import { CommissionFirebaseService } from '../../commission/models/Commissionfirebaseservice';

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export function usePayrollBatchViewModel() {
  const [batches,       setBatches]       = useState<PayrollBatch[]>([]);
  const [activeBatch,   setActiveBatch]   = useState<PayrollBatch | null>(null);
  const [rows,          setRows]          = useState<PayrollBatchRow[]>([]);
  const [employees,     setEmployees]     = useState<any[]>([]);
  const [selectedRows,  setSelectedRows]  = useState<Set<string>>(new Set());
  const [isLoading,     setIsLoading]     = useState(true);
  const [isGenerating,  setIsGenerating]  = useState(false);
  const [editingRowId,  setEditingRowId]  = useState<string | null>(null);
  const [editValues,    setEditValues]    = useState<Partial<PayrollBatchRow>>({});
  const [showGenModal,  setShowGenModal]  = useState(false);
  const [genMonth,      setGenMonth]      = useState(currentMonth());
  const [filter,        setFilter]        = useState<PayrollBatchFilter>({
    search: '', department: '', paymentStatus: '', workStatus: '', approvalStatus: '',
  });

  // Load employees and batches on mount
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [emps, batchList] = await Promise.all([
          EmployeeFirebaseService.fetchAllEmployees(),
          PayrollBatchFirebaseService.fetchAllBatches(),
        ]);
        setEmployees(emps.filter((e: any) => e.status === 'active' || e.isActive));
        setBatches(batchList);
        // Auto-open latest batch
        if (batchList.length > 0) {
          await loadBatch(batchList[0]);
        }
      } catch {
        toast.error('Failed to load payroll data');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const loadBatch = useCallback(async (batch: PayrollBatch) => {
    setActiveBatch(batch);
    const batchRows = await PayrollBatchFirebaseService.fetchRowsByBatch(batch.id);
    setRows(batchRows);
    setSelectedRows(new Set());
  }, []);

  // ── Generate new batch ─────────────────────────────────────────────────────

  const generateBatch = useCallback(async (selectedEmpIds: string[]) => {
    if (!genMonth || selectedEmpIds.length === 0) {
      toast.error('Select a month and at least one employee');
      return;
    }
    setIsGenerating(true);
    try {
      const [yr, mo] = genMonth.split('-').map(Number);
      const monthLabel = new Date(yr, mo - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });

      // Fetch confirmed commissions for this month
      const allCommissions = await CommissionFirebaseService.fetchAllCommissions();
      const commissionMap: Record<string, number> = {};
      allCommissions
        .filter(c => c.month === genMonth && c.status === 'Confirmed')
        .forEach(c => {
          commissionMap[c.salesperson] = (commissionMap[c.salesperson] || 0) +
            (c.overriddenCommissionAmount ?? c.calculatedCommissionAmount);
        });

      const selectedEmps = employees.filter(e => selectedEmpIds.includes(e.id));
      const batch = await PayrollBatchFirebaseService.createBatch({
        month:     genMonth,
        year:      yr,
        title:     `${monthLabel} Payroll`,
        status:    'Draft',
        totalRows: selectedEmps.length,
        totalNet:  0,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const newRows = await PayrollBatchFirebaseService.generateBatchRows(
        batch.id, genMonth, yr, selectedEmps, commissionMap
      );

      const totalNet = newRows.reduce((s, r) => s + r.netSalary, 0);
      await PayrollBatchFirebaseService.updateBatch(batch.id, { totalNet });

      setBatches(prev => [{ ...batch, totalNet }, ...prev]);
      await loadBatch({ ...batch, totalNet });
      setShowGenModal(false);
      toast.success(`Payroll batch generated for ${selectedEmps.length} employees`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate batch');
    } finally {
      setIsGenerating(false);
    }
  }, [genMonth, employees, loadBatch]);

  // ── Inline row editing ─────────────────────────────────────────────────────

  const startEdit = useCallback((row: PayrollBatchRow) => {
    setEditingRowId(row.id);
    setEditValues({
      overtime: row.overtime, performanceBonus: row.performanceBonus,
      leaves: row.leaves, lateArrival: row.lateArrival,
      earlyDepart: row.earlyDepart, penalty: row.penalty,
    });
  }, []);

  const saveEdit = useCallback(async (rowId: string) => {
    const row = rows.find(r => r.id === rowId);
    if (!row) return;
    const overtime         = editValues.overtime         ?? row.overtime;
    const performanceBonus = editValues.performanceBonus ?? row.performanceBonus;
    const leaves           = editValues.leaves           ?? row.leaves;
    const lateArrival      = editValues.lateArrival      ?? row.lateArrival;
    const earlyDepart      = editValues.earlyDepart      ?? row.earlyDepart;
    const penalty          = editValues.penalty          ?? row.penalty;
    const grossEarning     = row.basicSalary + overtime + performanceBonus + row.commission;
    const totalDeductions  = lateArrival + earlyDepart + penalty;
    const netSalary        = grossEarning - totalDeductions;
    const remainingAmount  = netSalary - row.advanceSalary;
    const updates = {
      overtime, performanceBonus, leaves, lateArrival, earlyDepart, penalty,
      grossEarning, totalDeductions, netSalary, remainingAmount,
    };
    await PayrollBatchFirebaseService.updateRow(rowId, updates);
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, ...updates } : r));
    setEditingRowId(null);
    toast.success('Row updated');
  }, [rows, editValues]);

  const cancelEdit = useCallback(() => { setEditingRowId(null); setEditValues({}); }, []);

  // ── Row actions ────────────────────────────────────────────────────────────

  const recordPayment = useCallback(async (rowId: string) => {
    try {
      await PayrollBatchFirebaseService.recordPayment(rowId, 'current-user');
      setRows(prev => prev.map(r => r.id === rowId
        ? { ...r, paymentStatus: 'Paid', paidAt: new Date().toISOString() } : r));
      toast.success('Payment recorded');
    } catch { toast.error('Failed to record payment'); }
  }, []);

  const approveHR = useCallback(async (rowId: string) => {
    try {
      await PayrollBatchFirebaseService.approveByHR(rowId);
      setRows(prev => prev.map(r => r.id === rowId ? { ...r, approvedByHR: 'Approved' } : r));
      toast.success('Approved by HR');
    } catch { toast.error('Failed to approve'); }
  }, []);

  const approveManager = useCallback(async (rowId: string) => {
    try {
      await PayrollBatchFirebaseService.approveByManager(rowId);
      setRows(prev => prev.map(r => r.id === rowId ? { ...r, approvedByManager: 'Approved' } : r));
      toast.success('Approved by Manager');
    } catch { toast.error('Failed to approve'); }
  }, []);

  const toggleWorkStatus = useCallback(async (rowId: string, current: 'Active' | 'Inactive') => {
    const next = current === 'Active' ? 'Inactive' : 'Active';
    await PayrollBatchFirebaseService.updateRow(rowId, { workStatus: next });
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, workStatus: next } : r));
  }, []);

  // ── Selection ──────────────────────────────────────────────────────────────

  const toggleSelect = useCallback((id: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedRows(prev =>
      prev.size === filteredRows.length ? new Set() : new Set(filteredRows.map(r => r.id))
    );
  }, [rows, filter]);

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filteredRows = useMemo(() => rows.filter(r => {
    if (filter.search) {
      const s = filter.search.toLowerCase();
      if (!r.employeeName.toLowerCase().includes(s) &&
          !r.empCode.toLowerCase().includes(s) &&
          !r.department.toLowerCase().includes(s)) return false;
    }
    if (filter.department    && r.department    !== filter.department)    return false;
    if (filter.paymentStatus && r.paymentStatus !== filter.paymentStatus) return false;
    if (filter.workStatus    && r.workStatus    !== filter.workStatus)    return false;
    if (filter.approvalStatus) {
      if (r.approvedByHR !== filter.approvalStatus &&
          r.approvedByManager !== filter.approvalStatus) return false;
    }
    return true;
  }), [rows, filter]);

  const departments = useMemo(() => [...new Set(rows.map(r => r.department).filter(Boolean))], [rows]);

  const summaryStats = useMemo(() => ({
    totalEmployees: rows.length,
    totalGross:     rows.reduce((s, r) => s + r.grossEarning,    0),
    totalNet:       rows.reduce((s, r) => s + r.netSalary,       0),
    totalPaid:      rows.filter(r => r.paymentStatus === 'Paid').length,
    totalPending:   rows.filter(r => r.paymentStatus === 'Pending').length,
  }), [rows]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', minimumFractionDigits: 0 }).format(n);

  return {
    batches, activeBatch, rows: filteredRows, allRows: rows, employees,
    selectedRows, isLoading, isGenerating, editingRowId, editValues,
    showGenModal, setShowGenModal, genMonth, setGenMonth,
    filter, setFilter, departments, summaryStats, fmt,
    loadBatch, generateBatch, startEdit, saveEdit, cancelEdit,
    recordPayment, approveHR, approveManager, toggleWorkStatus,
    toggleSelect, toggleSelectAll,
    setEditValues: (v: Partial<PayrollBatchRow>) => setEditValues(prev => ({ ...prev, ...v })),
  };
}