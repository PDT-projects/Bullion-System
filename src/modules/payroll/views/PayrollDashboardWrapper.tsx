// Payroll Module - Main Entry
// Shows ALL payroll rows as a persistent list (like Transactions).
// Rows are fetched from Firestore on load — never regenerated automatically.
// Generate Batch = creates NEW records only. Does NOT overwrite existing ones.

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Plus, X, Check, Edit2, Search, Filter, RefreshCw,
  Users, DollarSign, Table2, Calculator, CreditCard,
  ChevronDown, Wallet, Clock, ToggleLeft, ToggleRight,
  BarChart2, CheckCircle, Percent, TrendingUp,
} from 'lucide-react';

import { EmployeeFirebaseService }     from '../../employee/models/employeeFirebaseService';
import { EmployeeService }             from '../../employee/models/employeeService';
import { EmployeeFormFields }          from '../../employee/views/components/EmployeeFormFields';
import { Employee, CreateEmployeeDTO } from '../../employee/models/types';

import { PayrollBatchFirebaseService } from '../models/payrollBatchFirebaseService';
import { PayrollBatchRow, PayrollBatch } from '../models/payrollBatchTypes';
import { CommissionFirebaseService }   from '../../commission/models/Commissionfirebaseservice';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', minimumFractionDigits: 0 }).format(n);

const currentYYYYMM = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const monthLabel = (ym: string) => {
  if (!ym) return '—';
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
};

// ─── Modal Shell ──────────────────────────────────────────────────────────────

function Modal({ title, subtitle, onClose, children, width = 600 }: {
  title: string; subtitle?: string; onClose: () => void;
  children: React.ReactNode; width?: number;
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width, maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.22)', overflow: 'hidden' }}>
        <div style={{ background: '#0f172a', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#fff' }}>{title}</h3>
            {subtitle && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ padding: 6, border: 'none', background: 'rgba(255,255,255,0.12)', borderRadius: 8, cursor: 'pointer', display: 'flex' }}>
            <X size={16} color="#fff" />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Add Employee Modal ───────────────────────────────────────────────────────

function AddEmployeeModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [formData, setFormData] = useState<Partial<Employee>>(
    { ...EmployeeService.getDefaultFormData(), salaryCurrency: 'AED' }
  );
  const [isSaving, setIsSaving] = useState(false);
  const setField = useCallback((f: keyof Employee, v: any) => setFormData(p => ({ ...p, [f]: v })), []);

  const handleSave = async () => {
    const v = EmployeeService.validateEmployee(formData);
    if (!v.isValid) { toast.error(v.error || 'Please fill required fields'); return; }
    setIsSaving(true);
    try {
      await EmployeeFirebaseService.createEmployee({ ...(formData as CreateEmployeeDTO), salaryCurrency: 'AED' });
      toast.success('Employee added successfully');
      onSaved();
    } catch { toast.error('Failed to add employee'); }
    finally { setIsSaving(false); }
  };

  return (
    <Modal title="Add Employee" subtitle="Register a new team member — AED salary" onClose={onClose} width={740}>
      <div style={{ padding: '24px 28px' }}>
        <style>{`.pe-aed-only .bg-gray-100.rounded-lg.p-1{display:none!important}`}</style>
        <div className="pe-aed-only">
          <EmployeeFormFields
            formData={formData} onFieldChange={setField}
            allLocations={['Dubai','Abu Dhabi','Sharjah','Riyadh','Jeddah','Dammam','Doha','Kuwait City','Muscat','Bahrain','Cairo','London','Karachi','Lahore','Islamabad','Other']}
            addCustomLocation={() => {}} salaryCurrency="AED" onSalaryCurrencyChange={() => {}}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
          <button onClick={onClose} style={{ padding: '9px 20px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>Cancel</button>
          <button onClick={handleSave} disabled={isSaving} style={{ padding: '9px 22px', border: 'none', borderRadius: 8, background: isSaving ? '#94a3b8' : '#0f172a', color: '#fff', fontSize: 13, fontWeight: 700, cursor: isSaving ? 'not-allowed' : 'pointer' }}>
            {isSaving ? 'Saving…' : 'Save Employee'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Generate Batch Modal ─────────────────────────────────────────────────────

function GenerateBatchModal({ employees, existingBatches, onClose, onGenerated }: {
  employees: any[];
  existingBatches: PayrollBatch[];
  onClose: () => void;
  onGenerated: (rows: PayrollBatchRow[], batch: PayrollBatch) => void;
}) {
  const [genMonth,     setGenMonth]     = useState(currentYYYYMM());
  const [selected,     setSelected]     = useState<Set<string>>(new Set(employees.map(e => e.id)));
  const [isGenerating, setIsGenerating] = useState(false);

  // Check if a batch already exists for this month
  const alreadyExists = existingBatches.some(b => b.month === genMonth);

  const toggle = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(prev => prev.size === employees.length ? new Set() : new Set(employees.map(e => e.id)));

  const handleGenerate = async () => {
    if (selected.size === 0) { toast.error('Select at least one employee'); return; }
    if (alreadyExists) {
      toast.error(`A payroll batch for ${monthLabel(genMonth)} already exists. Delete the existing batch first or choose a different month.`);
      return;
    }
    setIsGenerating(true);
    try {
      const [yr, mo] = genMonth.split('-').map(Number);
      const allCommissions = await CommissionFirebaseService.fetchAllCommissions();
      const commMap: Record<string, number> = {};
      allCommissions
        .filter(c => c.month === genMonth && c.status === 'Confirmed')
        .forEach(c => { commMap[c.salesperson] = (commMap[c.salesperson] || 0) + (c.overriddenCommissionAmount ?? c.calculatedCommissionAmount); });

      const selEmps = employees.filter(e => selected.has(e.id));
      const batch = await PayrollBatchFirebaseService.createBatch({
        month: genMonth, year: yr,
        title: `${monthLabel(genMonth)} Payroll`,
        status: 'Draft', totalRows: selEmps.length, totalNet: 0,
        createdBy: 'system', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      });
      const newRows = await PayrollBatchFirebaseService.generateBatchRows(batch.id, genMonth, yr, selEmps, commMap);
      const totalNet = newRows.reduce((s, r) => s + r.netSalary, 0);
      await PayrollBatchFirebaseService.updateBatch(batch.id, { totalNet });
      toast.success(`Payroll batch generated — ${selEmps.length} employee records saved`);
      onGenerated(newRows, { ...batch, totalNet });
    } catch (e: any) { toast.error(e.message || 'Failed to generate batch'); }
    finally { setIsGenerating(false); }
  };

  return (
    <Modal title="Generate Payroll Batch" subtitle="Creates new records in Firestore — existing records are kept" onClose={onClose} width={560}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Salary Month</label>
        <input type="month" value={genMonth} onChange={e => setGenMonth(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, width: 220 }} />
        {alreadyExists && (
          <p style={{ margin: '8px 0 0', fontSize: 12, color: '#f97316', fontWeight: 600 }}>
            ⚠ A batch for {monthLabel(genMonth)} already exists. Generating will add new records.
          </p>
        )}
      </div>
      <div style={{ padding: '12px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{selected.size}/{employees.length} employees selected</span>
        <button onClick={toggleAll} style={{ fontSize: 12, color: '#0f172a', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
          {selected.size === employees.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>
      <div style={{ maxHeight: 300, overflowY: 'auto', padding: '8px 24px' }}>
        {employees.length === 0
          ? <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 24 }}>No active employees found. Add employees first.</p>
          : employees.map(emp => (
            <div key={emp.id} onClick={() => toggle(emp.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 4, background: selected.has(emp.id) ? '#f0f9ff' : 'transparent', border: `1px solid ${selected.has(emp.id) ? '#bae6fd' : '#f1f5f9'}` }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${selected.has(emp.id) ? '#0f172a' : '#d1d5db'}`, background: selected.has(emp.id) ? '#0f172a' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {selected.has(emp.id) && <Check size={11} color="#fff" />}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{emp.name}</p>
                <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{emp.department || emp.position || ''}</p>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{fmt(emp.salary || 0)}</span>
            </div>
          ))}
      </div>
      <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ padding: '9px 20px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>Cancel</button>
        <button onClick={handleGenerate} disabled={isGenerating || selected.size === 0} style={{ padding: '9px 22px', border: 'none', borderRadius: 8, background: isGenerating || selected.size === 0 ? '#94a3b8' : '#0f172a', color: '#fff', fontSize: 13, fontWeight: 700, cursor: isGenerating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          {isGenerating ? <><RefreshCw size={13} /> Generating…</> : <><Table2 size={13} /> Generate Batch</>}
        </button>
      </div>
    </Modal>
  );
}

// ─── Record Payment Modal ─────────────────────────────────────────────────────

function RecordPaymentModal({ row, onClose, onPaid }: { row: PayrollBatchRow; onClose: () => void; onPaid: () => void }) {
  const [isPaying, setIsPaying] = useState(false);
  const handlePay = async () => {
    setIsPaying(true);
    try {
      await PayrollBatchFirebaseService.recordPayment(row.id, 'current-user');
      toast.success(`Payment recorded for ${row.employeeName}`);
      onPaid();
    } catch { toast.error('Failed to record payment'); }
    finally { setIsPaying(false); }
  };
  return (
    <Modal title="Record Payment" subtitle={`Confirm salary payment for ${row.employeeName}`} onClose={onClose} width={440}>
      <div style={{ padding: 24 }}>
        <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20, marginBottom: 20, border: '1px solid #e2e8f0' }}>
          {[['Employee', row.employeeName], ['Month', monthLabel(row.salaryMonth)], ['Basic Salary', fmt(row.basicSalary)], ['Gross Earning', fmt(row.grossEarning)], ['Total Deductions', fmt(row.totalDeductions)], ['Advance Paid', fmt(row.advanceSalary)]].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>{l}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{v}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', marginTop: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Net Payable</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#16a34a' }}>{fmt(row.remainingAmount)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 20px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>Cancel</button>
          <button onClick={handlePay} disabled={isPaying} style={{ padding: '9px 22px', border: 'none', borderRadius: 8, background: isPaying ? '#94a3b8' : '#16a34a', color: '#fff', fontSize: 13, fontWeight: 700, cursor: isPaying ? 'not-allowed' : 'pointer' }}>
            {isPaying ? 'Processing…' : '✓ Confirm Payment'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Edit Row Modal ────────────────────────────────────────────────────────────

function EditRowModal({ row, onClose, onSaved }: { row: PayrollBatchRow; onClose: () => void; onSaved: (r: PayrollBatchRow) => void }) {
  const [vals, setVals] = useState({
    overtime: row.overtime, performanceBonus: row.performanceBonus,
    leaves: row.leaves, lateArrival: row.lateArrival,
    earlyDepart: row.earlyDepart, penalty: row.penalty,
  });
  const [isSaving, setIsSaving] = useState(false);
  const gross      = row.basicSalary + vals.overtime + vals.performanceBonus + row.commission;
  const deductions = vals.lateArrival + vals.earlyDepart + vals.penalty;
  const net        = Math.max(0, gross - deductions);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates = { ...vals, grossEarning: gross, totalDeductions: deductions, netSalary: net, remainingAmount: net - row.advanceSalary };
      await PayrollBatchFirebaseService.updateRow(row.id, updates);
      toast.success('Row updated');
      onSaved({ ...row, ...updates });
    } catch { toast.error('Failed to update'); }
    finally { setIsSaving(false); }
  };

  const numField = (label: string, key: keyof typeof vals, color?: string) => (
    <div key={label}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>{label}</label>
      <input type="number" min={0} value={vals[key]} onChange={e => setVals(p => ({ ...p, [key]: parseFloat(e.target.value) || 0 }))}
        style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: color || '#0f172a', boxSizing: 'border-box' as const }} />
    </div>
  );

  return (
    <Modal title={`Edit — ${row.employeeName}`} subtitle={monthLabel(row.salaryMonth)} onClose={onClose} width={520}>
      <div style={{ padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
          {numField('Overtime (AED)', 'overtime')}
          {numField('Performance Bonus (AED)', 'performanceBonus')}
          {numField('Leaves (days)', 'leaves')}
          {numField('Late Arrival Deduction', 'lateArrival', '#dc2626')}
          {numField('Early Departure Deduction', 'earlyDepart', '#dc2626')}
          {numField('Penalty (AED)', 'penalty', '#dc2626')}
        </div>
        <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, border: '1px solid #e2e8f0', marginBottom: 20 }}>
          <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Live Preview</p>
          {[['Gross Earning', fmt(gross), '#0f172a'], ['Total Deductions', fmt(deductions), '#dc2626'], ['Net Salary', fmt(net), '#16a34a']].map(([l, v, c]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>{l}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: c }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 20px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>Cancel</button>
          <button onClick={handleSave} disabled={isSaving} style={{ padding: '9px 22px', border: 'none', borderRadius: 8, background: isSaving ? '#94a3b8' : '#0f172a', color: '#fff', fontSize: 13, fontWeight: 700, cursor: isSaving ? 'not-allowed' : 'pointer' }}>
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Batch filter dropdown ────────────────────────────────────────────────────

function BatchDropdown({ batches, active, onSelect, onDelete }: {
  batches: PayrollBatch[]; active: string;
  onSelect: (v: string) => void;
  onDelete: (id: string, title: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const label = active === 'all' ? 'All Batches' : batches.find(b => b.id === active)?.title || 'Select Batch';
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
        <Wallet size={14} />{label}<ChevronDown size={13} />
      </button>
      {open && (
        <>
          {/* Backdrop */}
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 29 }} />
          <div style={{ position: 'absolute', top: '110%', left: 0, zIndex: 30, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 280, maxHeight: 320, overflowY: 'auto' }}>
            <div onClick={() => { onSelect('all'); setOpen(false); }} style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', background: active === 'all' ? '#f0f9ff' : 'transparent', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
              All Batches
            </div>
            {batches.map(b => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #f1f5f9', background: active === b.id ? '#f0f9ff' : 'transparent' }}>
                <div onClick={() => { onSelect(b.id); setOpen(false); }} style={{ flex: 1, padding: '10px 16px', cursor: 'pointer' }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{b.title}</p>
                  <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{b.totalRows} employees · {fmt(b.totalNet)}</p>
                </div>
                {/* Delete batch button */}
                <button
                  onClick={e => { e.stopPropagation(); setOpen(false); onDelete(b.id, b.title); }}
                  title="Delete this batch"
                  style={{ padding: '6px 10px', margin: '0 8px', border: 'none', borderRadius: 6, background: '#fee2e2', color: '#dc2626', cursor: 'pointer', flexShrink: 0, fontSize: 11, fontWeight: 700 }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function PayBadge({ s }: { s: string }) {
  const c = s === 'Paid' ? ['#dcfce7','#166534'] : s === 'Partial' ? ['#fef9c3','#854d0e'] : ['#fee2e2','#991b1b'];
  return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: c[0], color: c[1] }}>{s}</span>;
}
function ApprBadge({ s }: { s: string }) {
  const c = s === 'Approved' ? ['#dcfce7','#166534'] : s === 'Rejected' ? ['#fee2e2','#991b1b'] : ['#f1f5f9','#64748b'];
  return <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: c[0], color: c[1] }}>{s}</span>;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export function PayrollDashboardWrapper() {
  const [employees,     setEmployees]     = useState<any[]>([]);
  const [batches,       setBatches]       = useState<PayrollBatch[]>([]);
  const [allRows,       setAllRows]       = useState<PayrollBatchRow[]>([]);
  const [activeBatchId, setActiveBatchId] = useState<string>('all');
  const [isLoading,     setIsLoading]     = useState(true);

  // Modals
  const [showAddEmp,   setShowAddEmp]   = useState(false);
  const [showGenBatch, setShowGenBatch] = useState(false);
  const [payRow,       setPayRow]       = useState<PayrollBatchRow | null>(null);
  const [editRow,      setEditRow]      = useState<PayrollBatchRow | null>(null);

  // Filters
  const [search,      setSearch]      = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterPay,   setFilterPay]   = useState('');
  const [filterDept,  setFilterDept]  = useState('');
  const [showFilter,  setShowFilter]  = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── Load all data once on mount ──────────────────────────────────────────

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [emps, batchList, allRowsData] = await Promise.all([
        EmployeeFirebaseService.fetchAllEmployees(),
        PayrollBatchFirebaseService.fetchAllBatches(),
        PayrollBatchFirebaseService.fetchAllRows(),   // fetch all rows directly — no per-batch loop
      ]);
      setEmployees(emps.filter((e: any) => e.status === 'active' || !e.status));
      setBatches(batchList);
      setAllRows(allRowsData);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load payroll data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Filtering ────────────────────────────────────────────────────────────

  const visibleRows = useMemo(() => {
    return allRows.filter(r => {
      if (activeBatchId !== 'all' && r.batchId !== activeBatchId) return false;
      if (search && !r.employeeName.toLowerCase().includes(search.toLowerCase()) && !r.empCode.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterMonth && r.salaryMonth !== filterMonth) return false;
      if (filterPay   && r.paymentStatus !== filterPay) return false;
      if (filterDept  && r.department !== filterDept) return false;
      return true;
    });
  }, [allRows, activeBatchId, search, filterMonth, filterPay, filterDept]);

  const departments = useMemo(() => [...new Set(allRows.map(r => r.department).filter(Boolean))], [allRows]);
  const months      = useMemo(() => [...new Set(allRows.map(r => r.salaryMonth).filter(Boolean))].sort().reverse(), [allRows]);

  // ── Stats ────────────────────────────────────────────────────────────────

  const stats = useMemo(() => ({
    total:   visibleRows.length,
    gross:   visibleRows.reduce((s, r) => s + r.grossEarning, 0),
    net:     visibleRows.reduce((s, r) => s + r.netSalary, 0),
    paid:    visibleRows.filter(r => r.paymentStatus === 'Paid').length,
    pending: visibleRows.filter(r => r.paymentStatus === 'Pending').length,
  }), [visibleRows]);

  // ── Row actions ──────────────────────────────────────────────────────────

  const approveHR = async (id: string) => {
    await PayrollBatchFirebaseService.approveByHR(id);
    setAllRows(prev => prev.map(r => r.id === id ? { ...r, approvedByHR: 'Approved' } : r));
    toast.success('HR approved');
  };
  const approveManager = async (id: string) => {
    await PayrollBatchFirebaseService.approveByManager(id);
    setAllRows(prev => prev.map(r => r.id === id ? { ...r, approvedByManager: 'Approved' } : r));
    toast.success('Manager approved');
  };
  const toggleWork = async (id: string, cur: 'Active' | 'Inactive') => {
    const next = cur === 'Active' ? 'Inactive' : 'Active';
    await PayrollBatchFirebaseService.updateRow(id, { workStatus: next });
    setAllRows(prev => prev.map(r => r.id === id ? { ...r, workStatus: next } : r));
  };
  const toggleSel = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelectedIds(prev => prev.size === visibleRows.length ? new Set() : new Set(visibleRows.map(r => r.id)));

  // ── Delete batch ─────────────────────────────────────────────────────────
  const deleteBatch = useCallback(async (batchId: string, batchTitle: string) => {
    if (!window.confirm(`Delete "${batchTitle}" and all its payroll records? This cannot be undone.`)) return;
    try {
      await PayrollBatchFirebaseService.deleteBatch(batchId);
      setBatches(prev => prev.filter(b => b.id !== batchId));
      setAllRows(prev => prev.filter(r => r.batchId !== batchId));
      if (activeBatchId === batchId) setActiveBatchId('all');
      toast.success(`Batch "${batchTitle}" deleted`);
    } catch { toast.error('Failed to delete batch'); }
  }, [activeBatchId]);

  // Table styles
  const TH: React.CSSProperties = { padding: '10px 10px', fontSize: 10, fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap', letterSpacing: '0.04em', color: '#fff' };
  const TD: React.CSSProperties = { padding: '8px 10px', textAlign: 'center', verticalAlign: 'middle', fontSize: 12, color: '#374151', whiteSpace: 'nowrap' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f1f5f9' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '14px 24px' }}>

        {/* Title + actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 200 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <DollarSign size={18} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Payroll Management</h1>
              <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{allRows.length} records · {batches.length} batches</p>
            </div>
          </div>

          {/* Action buttons */}
          <button onClick={() => setShowAddEmp(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <Users size={14} /> Add Employee
          </button>
          <button onClick={() => setShowGenBatch(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <Table2 size={14} /> Generate Batch
          </button>
          <button onClick={loadAll} title="Refresh" style={{ padding: 8, border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', cursor: 'pointer', display: 'flex' }}>
            <RefreshCw size={14} color="#64748b" />
          </button>
        </div>

        {/* Filter/search row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Batch dropdown */}
          <BatchDropdown batches={batches} active={activeBatchId} onSelect={setActiveBatchId} onDelete={deleteBatch} />

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc', flex: 1, minWidth: 200 }}>
            <Search size={13} color="#94a3b8" />
            <input placeholder="Search name or employee ID…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: 13, color: '#374151', background: 'transparent', width: '100%' }} />
          </div>

          <button onClick={() => setShowFilter(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: showFilter ? '#0f172a' : '#fff', color: showFilter ? '#fff' : '#374151', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Filter size={13} /> Filter {(filterMonth || filterPay || filterDept) && '●'}
          </button>
        </div>

        {/* Expanded filter bar */}
        {showFilter && (
          <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            {[
              { label: 'Month',      val: filterMonth, set: setFilterMonth, opts: ['', ...months.map(m => ({ v: m, l: monthLabel(m) }))] as any },
              { label: 'Payment',    val: filterPay,   set: setFilterPay,   opts: ['', 'Pending', 'Paid', 'Partial'] },
              { label: 'Department', val: filterDept,  set: setFilterDept,  opts: ['', ...departments] },
            ].map(({ label, val, set, opts }) => (
              <div key={label}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>{label}</label>
                <select value={val} onChange={e => set(e.target.value)}
                  style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, color: '#374151', background: '#fff' }}>
                  {opts.map((o: any) => typeof o === 'string'
                    ? <option key={o} value={o}>{o || `All ${label}s`}</option>
                    : <option key={o.v} value={o.v}>{o.l}</option>
                  )}
                </select>
              </div>
            ))}
            <button onClick={() => { setFilterMonth(''); setFilterPay(''); setFilterDept(''); setSearch(''); }}
              style={{ padding: '7px 14px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: '#64748b', background: '#fff' }}>
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* ── Stats strip ─────────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '10px 24px', display: 'flex', gap: 24, overflowX: 'auto' }}>
        {[
          { label: 'Records',  value: String(stats.total),   icon: Table2,       c: '#0f172a' },
          { label: 'Gross',    value: fmt(stats.gross),       icon: BarChart2,    c: '#0f172a' },
          { label: 'Net',      value: fmt(stats.net),         icon: Wallet,       c: '#16a34a' },
          { label: 'Paid',     value: `${stats.paid} of ${stats.total}`, icon: CheckCircle, c: '#16a34a' },
          { label: 'Pending',  value: String(stats.pending),  icon: Clock,        c: '#dc2626' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}>
              <Icon size={13} color={s.c} />
              <span style={{ fontSize: 11, color: '#94a3b8' }}>{s.label}:</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: s.c }}>{s.value}</span>
            </div>
          );
        })}
      </div>

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto' }}>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, flexDirection: 'column', gap: 12 }}>
            <RefreshCw size={28} color="#94a3b8" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#94a3b8', fontSize: 14 }}>Loading payroll records…</p>
          </div>
        ) : allRows.length === 0 ? (
          /* ── No records yet — first time ── */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, gap: 12 }}>
            <Table2 size={52} color="#e2e8f0" />
            <p style={{ fontSize: 15, fontWeight: 600, color: '#94a3b8' }}>No payroll records yet</p>
            <p style={{ fontSize: 13, color: '#cbd5e1', textAlign: 'center', maxWidth: 320 }}>
              Add employees first, then generate a payroll batch. All records will appear here and persist automatically.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button onClick={() => setShowAddEmp(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                <Users size={14} /> Add Employee
              </button>
              <button onClick={() => setShowGenBatch(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                <Table2 size={14} /> Generate Batch
              </button>
            </div>
          </div>
        ) : visibleRows.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
            <p style={{ color: '#94a3b8', fontSize: 14 }}>No records match the current filters</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 5 }}>
              <tr style={{ background: '#0f172a' }}>
                <th style={TH}><input type="checkbox" checked={selectedIds.size === visibleRows.length && visibleRows.length > 0} onChange={toggleAll} /></th>
                <th style={TH}>Year</th>
                <th style={TH}>Salary Month</th>
                <th style={TH}>Emp ID</th>
                <th style={{ ...TH, textAlign: 'left', minWidth: 130 }}>Employee Name</th>
                <th style={TH}>Department</th>
                <th style={TH}>Designation</th>
                <th style={{ ...TH, background: '#1e3a5f' }}>Basic Salary</th>
                <th style={{ ...TH, background: '#1e3a5f' }}>Overtime</th>
                <th style={{ ...TH, background: '#1e3a5f' }}>Perf. Bonus</th>
                <th style={{ ...TH, background: '#1e3a5f' }}>Commission</th>
                <th style={{ ...TH, background: '#1e3a5f' }}>Gross Earning</th>
                <th style={{ ...TH, background: '#4a1942' }}>Leaves</th>
                <th style={{ ...TH, background: '#4a1942' }}>Late Arrival</th>
                <th style={{ ...TH, background: '#4a1942' }}>Early Depart</th>
                <th style={{ ...TH, background: '#4a1942' }}>Penalty</th>
                <th style={{ ...TH, background: '#4a1942' }}>Total Deductions</th>
                <th style={{ ...TH, background: '#14532d' }}>Net Salary</th>
                <th style={{ ...TH, background: '#14532d' }}>Advance Salary</th>
                <th style={{ ...TH, background: '#14532d' }}>Remaining</th>
                <th style={TH}>Work Status</th>
                <th style={TH}>Approved by HR</th>
                <th style={TH}>Approved by Manager</th>
                <th style={TH}>Make Payment</th>
                <th style={TH}>Payment Status</th>
                <th style={TH}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, idx) => {
                const isSel = selectedIds.has(row.id);
                const bg    = isSel ? '#eff6ff' : idx % 2 === 0 ? '#fff' : '#fafafa';
                return (
                  <tr key={row.id} style={{ background: bg, borderBottom: '1px solid #f1f5f9' }}>
                    <td style={TD}><input type="checkbox" checked={isSel} onChange={() => toggleSel(row.id)} /></td>
                    <td style={{ ...TD, color: '#94a3b8' }}>{row.year}</td>
                    <td style={{ ...TD, color: '#64748b' }}>{monthLabel(row.salaryMonth)}</td>
                    <td style={{ ...TD, fontFamily: 'monospace', fontSize: 11, color: '#94a3b8' }}>{row.empCode || '—'}</td>
                    <td style={{ ...TD, textAlign: 'left', fontWeight: 600, color: '#0f172a' }}>{row.employeeName}</td>
                    <td style={{ ...TD, color: '#64748b' }}>{row.department || '—'}</td>
                    <td style={{ ...TD, color: '#64748b' }}>{row.designation || '—'}</td>
                    <td style={{ ...TD, background: '#f0f7ff' }}>{fmt(row.basicSalary)}</td>
                    <td style={{ ...TD, background: '#f0f7ff' }}>{fmt(row.overtime)}</td>
                    <td style={{ ...TD, background: '#f0f7ff' }}>{fmt(row.performanceBonus)}</td>
                    <td style={{ ...TD, background: '#f0f7ff', color: '#0369a1', fontWeight: 600 }}>{fmt(row.commission)}</td>
                    <td style={{ ...TD, background: '#f0f7ff', fontWeight: 700, color: '#0f172a' }}>{fmt(row.grossEarning)}</td>
                    <td style={{ ...TD, background: '#fff5f5' }}>{row.leaves}</td>
                    <td style={{ ...TD, background: '#fff5f5', color: '#dc2626' }}>{fmt(row.lateArrival)}</td>
                    <td style={{ ...TD, background: '#fff5f5', color: '#dc2626' }}>{fmt(row.earlyDepart)}</td>
                    <td style={{ ...TD, background: '#fff5f5', color: '#dc2626' }}>{fmt(row.penalty)}</td>
                    <td style={{ ...TD, background: '#fff5f5', fontWeight: 700, color: '#dc2626' }}>{fmt(row.totalDeductions)}</td>
                    <td style={{ ...TD, background: '#f0fdf4', fontWeight: 700, color: '#16a34a', fontSize: 13 }}>{fmt(row.netSalary)}</td>
                    <td style={{ ...TD, background: '#f0fdf4', color: '#f97316' }}>{fmt(row.advanceSalary)}</td>
                    <td style={{ ...TD, background: '#f0fdf4', fontWeight: 600 }}>{fmt(row.remainingAmount)}</td>
                    <td style={TD}>
                      <button onClick={() => toggleWork(row.id, row.workStatus)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', border: 'none', borderRadius: 6, cursor: 'pointer', background: row.workStatus === 'Active' ? '#dcfce7' : '#f1f5f9', color: row.workStatus === 'Active' ? '#16a34a' : '#64748b' }}>
                        {row.workStatus === 'Active' ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        <span style={{ fontSize: 11, fontWeight: 600 }}>{row.workStatus}</span>
                      </button>
                    </td>
                    <td style={TD}>
                      {row.approvedByHR === 'Approved'
                        ? <ApprBadge s="Approved" />
                        : <button onClick={() => approveHR(row.id)} style={{ padding: '4px 10px', border: 'none', borderRadius: 6, background: '#0f172a', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Approve</button>}
                    </td>
                    <td style={TD}>
                      {row.approvedByManager === 'Approved'
                        ? <ApprBadge s="Approved" />
                        : <button onClick={() => approveManager(row.id)} style={{ padding: '4px 10px', border: 'none', borderRadius: 6, background: '#0f172a', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Approve</button>}
                    </td>
                    <td style={TD}>
                      {row.paymentStatus === 'Paid'
                        ? <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>✓ Paid</span>
                        : <button onClick={() => setPayRow(row)} disabled={row.approvedByHR !== 'Approved'} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', border: 'none', borderRadius: 6, background: row.approvedByHR === 'Approved' ? '#16a34a' : '#e2e8f0', color: row.approvedByHR === 'Approved' ? '#fff' : '#94a3b8', fontSize: 11, fontWeight: 700, cursor: row.approvedByHR === 'Approved' ? 'pointer' : 'not-allowed' }}>
                            <CreditCard size={11} /> Record Payment
                          </button>}
                    </td>
                    <td style={TD}><PayBadge s={row.paymentStatus} /></td>
                    <td style={TD}>
                      <button onClick={() => setEditRow(row)} style={{ padding: 6, border: 'none', borderRadius: 6, background: '#f1f5f9', cursor: 'pointer' }}>
                        <Edit2 size={13} color="#374151" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      {showAddEmp && (
        <AddEmployeeModal
          onClose={() => setShowAddEmp(false)}
          onSaved={async () => {
            setShowAddEmp(false);
            const emps = await EmployeeFirebaseService.fetchAllEmployees();
            setEmployees(emps.filter((e: any) => e.status === 'active' || !e.status));
          }}
        />
      )}
      {showGenBatch && (
        <GenerateBatchModal
          employees={employees}
          existingBatches={batches}
          onClose={() => setShowGenBatch(false)}
          onGenerated={async (newRows, batch) => {
            // Reload all rows from Firestore to ensure full persistence
            setBatches(prev => [batch, ...prev]);
            setShowGenBatch(false);
            const refreshed = await PayrollBatchFirebaseService.fetchAllRows();
            setAllRows(refreshed);
          }}
        />
      )}
      {payRow && (
        <RecordPaymentModal
          row={payRow}
          onClose={() => setPayRow(null)}
          onPaid={() => {
            setAllRows(prev => prev.map(r => r.id === payRow!.id ? { ...r, paymentStatus: 'Paid' } : r));
            setPayRow(null);
          }}
        />
      )}
      {editRow && (
        <EditRowModal
          row={editRow}
          onClose={() => setEditRow(null)}
          onSaved={updated => {
            setAllRows(prev => prev.map(r => r.id === updated.id ? updated : r));
            setEditRow(null);
          }}
        />
      )}
    </div>
  );
}