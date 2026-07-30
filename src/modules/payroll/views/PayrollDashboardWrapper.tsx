// Payroll Module - Main Entry
// Opens directly to the Payroll Batch table (like the Excel sheet).
// All actions (Add Employee, Generate Batch, Pay Salary, Calculate Commission)
// open as POPUPS — no page navigation, no sliding panels.

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Plus, X, Check, Edit2, Save, Search, Filter, RefreshCw,
  Users, DollarSign, Table2, Calculator, TrendingUp, Percent,
  CreditCard, ChevronDown, Wallet, Clock, ToggleLeft, ToggleRight,
  FileText, ArrowUpCircle, CheckCircle, BarChart2,
} from 'lucide-react';

import { EmployeeFirebaseService } from '../../employee/models/employeeFirebaseService';
import { EmployeeService }         from '../../employee/models/employeeService';
import { EmployeeFormFields }      from '../../employee/views/components/EmployeeFormFields';
import { Employee, CreateEmployeeDTO } from '../../employee/models/types';

import { PayrollBatchFirebaseService } from '../models/payrollBatchFirebaseService';
import { PayrollBatchRow, PayrollBatch, PayrollBatchFilter } from '../models/payrollBatchTypes';
import { CommissionFirebaseService }   from '../../commission/models/Commissionfirebaseservice';
import { SalaryFirebaseService }       from '../../salary/models/salaryFirebaseService';
import { EmployeeReference }           from '../models/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', minimumFractionDigits: 0 }).format(n);

const currentYYYYMM = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const monthLabel = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
};

// ─── Modal Shell ──────────────────────────────────────────────────────────────

function Modal({ title, subtitle, onClose, children, width = 600 }: {
  title: string; subtitle?: string; onClose: () => void;
  children: React.ReactNode; width?: number;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, width, maxWidth: '95vw',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.22)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ background: '#0f172a', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#fff' }}>{title}</h3>
            {subtitle && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ padding: 6, border: 'none', background: 'rgba(255,255,255,0.12)', borderRadius: 8, cursor: 'pointer', display: 'flex' }}>
            <X size={16} color="#fff" />
          </button>
        </div>
        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
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

  const setField = useCallback((field: keyof Employee, value: any) =>
    setFormData(prev => ({ ...prev, [field]: value })), []);

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
    <Modal title="Add Employee" subtitle="Register a new team member" onClose={onClose} width={740}>
      <div style={{ padding: '24px 28px' }}>
        {/* Hide the internal PKR/AED toggle since we lock to AED */}
        <style>{`.payroll-emp-modal .bg-gray-100.rounded-lg.p-1 { display:none !important; }`}</style>
        <div className="payroll-emp-modal">
          <EmployeeFormFields
            formData={formData}
            onFieldChange={setField}
            allLocations={['Dubai','Abu Dhabi','Sharjah','Riyadh','Jeddah','Dammam','Doha','Kuwait City','Muscat','Bahrain','Cairo','London','Karachi','Lahore','Islamabad','Other']}
            addCustomLocation={() => {}}
            salaryCurrency="AED"
            onSalaryCurrencyChange={() => {}}
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

// ─── Generate Batch Modal ────────────────────────────────────────────────────

function GenerateBatchModal({ employees, onClose, onGenerated }: {
  employees: any[]; onClose: () => void; onGenerated: (batch: PayrollBatch, rows: PayrollBatchRow[]) => void;
}) {
  const [genMonth,     setGenMonth]     = useState(currentYYYYMM());
  const [selected,     setSelected]     = useState<Set<string>>(new Set(employees.map(e => e.id)));
  const [isGenerating, setIsGenerating] = useState(false);

  const toggle = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(prev => prev.size === employees.length ? new Set() : new Set(employees.map(e => e.id)));

  const handleGenerate = async () => {
    if (selected.size === 0) { toast.error('Select at least one employee'); return; }
    setIsGenerating(true);
    try {
      const [yr, mo] = genMonth.split('-').map(Number);
      const allCommissions = await CommissionFirebaseService.fetchAllCommissions();
      const commMap: Record<string, number> = {};
      allCommissions.filter(c => c.month === genMonth && c.status === 'Confirmed')
        .forEach(c => { commMap[c.salesperson] = (commMap[c.salesperson] || 0) + (c.overriddenCommissionAmount ?? c.calculatedCommissionAmount); });

      const selEmps = employees.filter(e => selected.has(e.id));
      const batch = await PayrollBatchFirebaseService.createBatch({
        month: genMonth, year: yr,
        title: `${monthLabel(genMonth)} Payroll`,
        status: 'Draft', totalRows: selEmps.length, totalNet: 0,
        createdBy: 'system', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      });
      const rows = await PayrollBatchFirebaseService.generateBatchRows(batch.id, genMonth, yr, selEmps, commMap);
      const totalNet = rows.reduce((s, r) => s + r.netSalary, 0);
      await PayrollBatchFirebaseService.updateBatch(batch.id, { totalNet });
      toast.success(`Payroll batch generated for ${selEmps.length} employees`);
      onGenerated({ ...batch, totalNet }, rows);
    } catch (e: any) { toast.error(e.message || 'Failed to generate batch'); }
    finally { setIsGenerating(false); }
  };

  return (
    <Modal title="Generate Payroll Batch" subtitle="Select month and employees" onClose={onClose} width={560}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Salary Month</label>
        <input type="month" value={genMonth} onChange={e => setGenMonth(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, width: 220 }} />
      </div>
      <div style={{ padding: '12px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{selected.size}/{employees.length} selected</span>
        <button onClick={toggleAll} style={{ fontSize: 12, color: '#0f172a', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
          {selected.size === employees.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>
      <div style={{ maxHeight: 320, overflowY: 'auto', padding: '8px 24px' }}>
        {employees.length === 0
          ? <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 24 }}>No active employees. Add employees first.</p>
          : employees.map(emp => (
            <div key={emp.id} onClick={() => toggle(emp.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8,
              cursor: 'pointer', marginBottom: 4, transition: 'background 0.1s',
              background: selected.has(emp.id) ? '#f0f9ff' : 'transparent',
              border: `1px solid ${selected.has(emp.id) ? '#bae6fd' : '#f1f5f9'}`,
            }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${selected.has(emp.id) ? '#0f172a' : '#d1d5db'}`, background: selected.has(emp.id) ? '#0f172a' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {selected.has(emp.id) && <Check size={11} color="#fff" />}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{emp.name}</p>
                <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{emp.department || ''} · {emp.position || ''}</p>
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

function RecordPaymentModal({ row, onClose, onPaid }: {
  row: PayrollBatchRow; onClose: () => void; onPaid: () => void;
}) {
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
          {[
            ['Employee',        row.employeeName],
            ['Month',           monthLabel(row.salaryMonth)],
            ['Basic Salary',    fmt(row.basicSalary)],
            ['Gross Earning',   fmt(row.grossEarning)],
            ['Total Deductions',fmt(row.totalDeductions)],
            ['Advance Paid',    fmt(row.advanceSalary)],
          ].map(([l, v]) => (
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

function EditRowModal({ row, onClose, onSaved }: {
  row: PayrollBatchRow; onClose: () => void; onSaved: (updated: PayrollBatchRow) => void;
}) {
  const [vals, setVals] = useState({
    overtime: row.overtime, performanceBonus: row.performanceBonus,
    leaves: row.leaves, lateArrival: row.lateArrival,
    earlyDepart: row.earlyDepart, penalty: row.penalty,
  });
  const [isSaving, setIsSaving] = useState(false);

  const gross = row.basicSalary + vals.overtime + vals.performanceBonus + row.commission;
  const deductions = vals.lateArrival + vals.earlyDepart + vals.penalty;
  const net = Math.max(0, gross - deductions);

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

  const field = (label: string, key: keyof typeof vals, color?: string) => (
    <div key={label}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>{label}</label>
      <input type="number" min={0} value={vals[key]}
        onChange={e => setVals(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
        style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: color || '#0f172a', boxSizing: 'border-box' as const }} />
    </div>
  );

  return (
    <Modal title={`Edit — ${row.employeeName}`} subtitle={monthLabel(row.salaryMonth)} onClose={onClose} width={520}>
      <div style={{ padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
          {field('Overtime (AED)', 'overtime')}
          {field('Performance Bonus (AED)', 'performanceBonus')}
          {field('Leaves (days)', 'leaves')}
          {field('Late Arrival Deduction', 'lateArrival', '#dc2626')}
          {field('Early Departure Deduction', 'earlyDepart', '#dc2626')}
          {field('Penalty (AED)', 'penalty', '#dc2626')}
        </div>
        {/* Live preview */}
        <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, border: '1px solid #e2e8f0', marginBottom: 20 }}>
          <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Preview</p>
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

// ─── Batch Selector Dropdown ──────────────────────────────────────────────────

function BatchSelector({ batches, active, onSelect }: {
  batches: PayrollBatch[]; active: PayrollBatch | null; onSelect: (b: PayrollBatch) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
        <Wallet size={14} />
        {active ? active.title : 'Select Batch'}
        <ChevronDown size={13} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '110%', left: 0, zIndex: 30, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', minWidth: 260, maxHeight: 280, overflowY: 'auto' }}>
          {batches.length === 0
            ? <p style={{ padding: 16, fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>No batches yet</p>
            : batches.map(b => (
              <div key={b.id} onClick={() => { onSelect(b); setOpen(false); }} style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #f8fafc', background: active?.id === b.id ? '#f0f9ff' : 'transparent' }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{b.title}</p>
                <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{b.totalRows} employees · {fmt(b.totalNet)}</p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// ─── Status badges ─────────────────────────────────────────────────────────────

function PayBadge({ s }: { s: string }) {
  const c = s === 'Paid' ? ['#dcfce7','#166534'] : s === 'Partial' ? ['#fef9c3','#854d0e'] : ['#fee2e2','#991b1b'];
  return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: c[0], color: c[1] }}>{s}</span>;
}
function ApprBadge({ s }: { s: string }) {
  const c = s === 'Approved' ? ['#dcfce7','#166534'] : s === 'Rejected' ? ['#fee2e2','#991b1b'] : ['#f1f5f9','#64748b'];
  return <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: c[0], color: c[1] }}>{s}</span>;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function PayrollDashboardWrapper() {
  // Data
  const [employees,    setEmployees]    = useState<any[]>([]);
  const [batches,      setBatches]      = useState<PayrollBatch[]>([]);
  const [activeBatch,  setActiveBatch]  = useState<PayrollBatch | null>(null);
  const [rows,         setRows]         = useState<PayrollBatchRow[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);

  // Modals
  const [showAddEmp,   setShowAddEmp]   = useState(false);
  const [showGenBatch, setShowGenBatch] = useState(false);
  const [payRow,       setPayRow]       = useState<PayrollBatchRow | null>(null);
  const [editRow,      setEditRow]      = useState<PayrollBatchRow | null>(null);

  // Filters
  const [search,       setSearch]       = useState('');
  const [filterDept,   setFilterDept]   = useState('');
  const [filterPay,    setFilterPay]    = useState('');
  const [showFilter,   setShowFilter]   = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Load on mount
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const [emps, batchList] = await Promise.all([
          EmployeeFirebaseService.fetchAllEmployees(),
          PayrollBatchFirebaseService.fetchAllBatches(),
        ]);
        setEmployees(emps.filter((e: any) => e.status === 'active' || !e.status));
        setBatches(batchList);
        if (batchList.length > 0) await loadBatch(batchList[0]);
      } catch { toast.error('Failed to load payroll data'); }
      finally { setIsLoading(false); }
    })();
  }, []);

  const loadBatch = async (batch: PayrollBatch) => {
    setActiveBatch(batch);
    const batchRows = await PayrollBatchFirebaseService.fetchRowsByBatch(batch.id);
    setRows(batchRows);
    setSelectedRows(new Set());
  };

  // Filtered rows
  const filtered = useMemo(() => rows.filter(r => {
    if (search && !r.employeeName.toLowerCase().includes(search.toLowerCase()) && !r.empCode.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterDept && r.department !== filterDept) return false;
    if (filterPay  && r.paymentStatus !== filterPay) return false;
    return true;
  }), [rows, search, filterDept, filterPay]);

  const departments = useMemo(() => [...new Set(rows.map(r => r.department).filter(Boolean))], [rows]);

  // Stats
  const stats = useMemo(() => ({
    totalGross:   rows.reduce((s, r) => s + r.grossEarning, 0),
    totalNet:     rows.reduce((s, r) => s + r.netSalary, 0),
    totalPaid:    rows.filter(r => r.paymentStatus === 'Paid').length,
    totalPending: rows.filter(r => r.paymentStatus === 'Pending').length,
  }), [rows]);

  // Row actions
  const approveHR = async (rowId: string) => {
    await PayrollBatchFirebaseService.approveByHR(rowId);
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, approvedByHR: 'Approved' } : r));
    toast.success('Approved by HR');
  };
  const approveManager = async (rowId: string) => {
    await PayrollBatchFirebaseService.approveByManager(rowId);
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, approvedByManager: 'Approved' } : r));
    toast.success('Approved by Manager');
  };
  const toggleWork = async (rowId: string, cur: 'Active' | 'Inactive') => {
    const next = cur === 'Active' ? 'Inactive' : 'Active';
    await PayrollBatchFirebaseService.updateRow(rowId, { workStatus: next });
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, workStatus: next } : r));
  };
  const toggleSelect = (id: string) => setSelectedRows(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelectedRows(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(r => r.id)));

  // Table header style
  const TH: React.CSSProperties = { padding: '10px 10px', fontSize: 10, fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap', letterSpacing: '0.04em', color: '#fff' };
  const TD: React.CSSProperties = { padding: '8px 10px', textAlign: 'center', verticalAlign: 'middle', fontSize: 12, color: '#374151', whiteSpace: 'nowrap' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f1f5f9' }}>

      {/* ── Top action bar ──────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '14px 24px' }}>
        {/* Module title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <DollarSign size={18} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Payroll Management</h1>
            <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>Employees · Salaries · Commissions</p>
          </div>
        </div>

        {/* Action buttons row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Batch selector */}
          <BatchSelector batches={batches} active={activeBatch} onSelect={loadBatch} />

          <div style={{ width: 1, height: 28, background: '#e2e8f0', margin: '0 4px' }} />

          {/* Primary actions */}
          {[
            { label: 'Add Employee',      icon: Users,      onClick: () => setShowAddEmp(true),   bg: '#0f172a' },
            { label: 'Generate Batch',    icon: Table2,     onClick: () => setShowGenBatch(true),  bg: '#0f172a' },
          ].map(btn => {
            const Icon = btn.icon;
            return (
              <button key={btn.label} onClick={btn.onClick} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', background: btn.bg, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                <Icon size={14} />{btn.label}
              </button>
            );
          })}

          <div style={{ width: 1, height: 28, background: '#e2e8f0', margin: '0 4px' }} />

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc', flex: 1, minWidth: 200 }}>
            <Search size={13} color="#94a3b8" />
            <input placeholder="Search employee or ID…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: 13, color: '#374151', background: 'transparent', width: '100%' }} />
          </div>

          <button onClick={() => setShowFilter(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: showFilter ? '#0f172a' : '#fff', color: showFilter ? '#fff' : '#374151', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Filter size={13} /> Filter
          </button>

          <button onClick={() => activeBatch && loadBatch(activeBatch)} style={{ padding: 8, border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', cursor: 'pointer', display: 'flex' }}>
            <RefreshCw size={14} color="#64748b" />
          </button>
        </div>

        {/* Filter bar */}
        {showFilter && (
          <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            {[
              { label: 'Department', val: filterDept, set: setFilterDept, opts: ['', ...departments] },
              { label: 'Payment',    val: filterPay,  set: setFilterPay,  opts: ['', 'Pending', 'Paid', 'Partial'] },
            ].map(({ label, val, set, opts }) => (
              <div key={label}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>{label}</label>
                <select value={val} onChange={e => set(e.target.value)}
                  style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, color: '#374151' }}>
                  {opts.map(o => <option key={o} value={o}>{o || `All ${label}s`}</option>)}
                </select>
              </div>
            ))}
            <button onClick={() => { setFilterDept(''); setFilterPay(''); setSearch(''); }}
              style={{ padding: '7px 14px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: '#64748b', background: '#fff' }}>
              Clear
            </button>
          </div>
        )}
      </div>

      {/* ── Stats strip ─────────────────────────────────────────────────────── */}
      {activeBatch && (
        <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '10px 24px', display: 'flex', gap: 20, overflowX: 'auto' }}>
          {[
            { label: 'Batch',    value: activeBatch.title,         icon: Table2,        c: '#0f172a' },
            { label: 'Gross',    value: fmt(stats.totalGross),      icon: BarChart2,     c: '#0f172a' },
            { label: 'Net',      value: fmt(stats.totalNet),        icon: Wallet,        c: '#16a34a' },
            { label: 'Paid',     value: `${stats.totalPaid} of ${rows.length}`,  icon: CheckCircle,   c: '#16a34a' },
            { label: 'Pending',  value: String(stats.totalPending), icon: Clock,         c: '#dc2626' },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
                <Icon size={13} color={s.c} />
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{s.label}:</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: s.c }}>{s.value}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto' }}>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, flexDirection: 'column', gap: 12 }}>
            <RefreshCw size={28} color="#94a3b8" />
            <p style={{ color: '#94a3b8', fontSize: 14 }}>Loading payroll data…</p>
          </div>
        ) : !activeBatch ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, gap: 12 }}>
            <Table2 size={52} color="#e2e8f0" />
            <p style={{ fontSize: 15, fontWeight: 600, color: '#94a3b8' }}>No payroll batch yet</p>
            <p style={{ fontSize: 13, color: '#cbd5e1' }}>Generate a batch to see payroll records here</p>
            <button onClick={() => setShowGenBatch(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>
              <Plus size={14} /> Generate Payroll Batch
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
            <p style={{ color: '#94a3b8', fontSize: 14 }}>No records match filters</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 5 }}>
              <tr style={{ background: '#0f172a' }}>
                <th style={TH}><input type="checkbox" checked={selectedRows.size === filtered.length && filtered.length > 0} onChange={toggleAll} /></th>
                <th style={TH}>Year</th>
                <th style={TH}>Salary Month</th>
                <th style={TH}>Emp ID</th>
                <th style={{ ...TH, textAlign: 'left', minWidth: 130 }}>Employee Name</th>
                <th style={TH}>Department</th>
                <th style={TH}>Designation</th>
                {/* Earnings */}
                <th style={{ ...TH, background: '#1e3a5f' }}>Basic Salary</th>
                <th style={{ ...TH, background: '#1e3a5f' }}>Overtime</th>
                <th style={{ ...TH, background: '#1e3a5f' }}>Perf. Bonus</th>
                <th style={{ ...TH, background: '#1e3a5f' }}>Commission</th>
                <th style={{ ...TH, background: '#1e3a5f' }}>Gross Earning</th>
                {/* Deductions */}
                <th style={{ ...TH, background: '#4a1942' }}>Leaves</th>
                <th style={{ ...TH, background: '#4a1942' }}>Late Arrival</th>
                <th style={{ ...TH, background: '#4a1942' }}>Early Depart</th>
                <th style={{ ...TH, background: '#4a1942' }}>Penalty</th>
                <th style={{ ...TH, background: '#4a1942' }}>Total Deductions</th>
                {/* Net */}
                <th style={{ ...TH, background: '#14532d' }}>Net Salary</th>
                <th style={{ ...TH, background: '#14532d' }}>Advance Salary</th>
                <th style={{ ...TH, background: '#14532d' }}>Remaining</th>
                {/* Status */}
                <th style={TH}>Work Status</th>
                <th style={TH}>Approved by HR</th>
                <th style={TH}>Approved by Manager</th>
                <th style={TH}>Make Payment</th>
                <th style={TH}>Payment Status</th>
                <th style={TH}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, idx) => {
                const isSel = selectedRows.has(row.id);
                const bg = isSel ? '#eff6ff' : idx % 2 === 0 ? '#fff' : '#fafafa';
                return (
                  <tr key={row.id} style={{ background: bg, borderBottom: '1px solid #f1f5f9' }}>
                    <td style={TD}><input type="checkbox" checked={isSel} onChange={() => toggleSelect(row.id)} /></td>
                    <td style={{ ...TD, color: '#94a3b8' }}>{row.year}</td>
                    <td style={{ ...TD, color: '#64748b' }}>{monthLabel(row.salaryMonth)}</td>
                    <td style={{ ...TD, fontFamily: 'monospace', fontSize: 11, color: '#94a3b8' }}>{row.empCode || '—'}</td>
                    <td style={{ ...TD, textAlign: 'left', fontWeight: 600, color: '#0f172a' }}>{row.employeeName}</td>
                    <td style={{ ...TD, color: '#64748b' }}>{row.department || '—'}</td>
                    <td style={{ ...TD, color: '#64748b' }}>{row.designation || '—'}</td>
                    {/* Earnings */}
                    <td style={{ ...TD, background: '#f0f7ff' }}>{fmt(row.basicSalary)}</td>
                    <td style={{ ...TD, background: '#f0f7ff' }}>{fmt(row.overtime)}</td>
                    <td style={{ ...TD, background: '#f0f7ff' }}>{fmt(row.performanceBonus)}</td>
                    <td style={{ ...TD, background: '#f0f7ff', color: '#0369a1', fontWeight: 600 }}>{fmt(row.commission)}</td>
                    <td style={{ ...TD, background: '#f0f7ff', fontWeight: 700, color: '#0f172a' }}>{fmt(row.grossEarning)}</td>
                    {/* Deductions */}
                    <td style={{ ...TD, background: '#fff5f5' }}>{row.leaves}</td>
                    <td style={{ ...TD, background: '#fff5f5', color: '#dc2626' }}>{fmt(row.lateArrival)}</td>
                    <td style={{ ...TD, background: '#fff5f5', color: '#dc2626' }}>{fmt(row.earlyDepart)}</td>
                    <td style={{ ...TD, background: '#fff5f5', color: '#dc2626' }}>{fmt(row.penalty)}</td>
                    <td style={{ ...TD, background: '#fff5f5', fontWeight: 700, color: '#dc2626' }}>{fmt(row.totalDeductions)}</td>
                    {/* Net */}
                    <td style={{ ...TD, background: '#f0fdf4', fontWeight: 700, color: '#16a34a', fontSize: 13 }}>{fmt(row.netSalary)}</td>
                    <td style={{ ...TD, background: '#f0fdf4', color: '#f97316' }}>{fmt(row.advanceSalary)}</td>
                    <td style={{ ...TD, background: '#f0fdf4', fontWeight: 600 }}>{fmt(row.remainingAmount)}</td>
                    {/* Work status */}
                    <td style={TD}>
                      <button onClick={() => toggleWork(row.id, row.workStatus)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', border: 'none', borderRadius: 6, cursor: 'pointer', background: row.workStatus === 'Active' ? '#dcfce7' : '#f1f5f9', color: row.workStatus === 'Active' ? '#16a34a' : '#64748b' }}>
                        {row.workStatus === 'Active' ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        <span style={{ fontSize: 11, fontWeight: 600 }}>{row.workStatus}</span>
                      </button>
                    </td>
                    {/* HR approval */}
                    <td style={TD}>
                      {row.approvedByHR === 'Approved'
                        ? <ApprBadge s="Approved" />
                        : <button onClick={() => approveHR(row.id)} style={{ padding: '4px 10px', border: 'none', borderRadius: 6, background: '#0f172a', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Approve</button>}
                    </td>
                    {/* Manager approval */}
                    <td style={TD}>
                      {row.approvedByManager === 'Approved'
                        ? <ApprBadge s="Approved" />
                        : <button onClick={() => approveManager(row.id)} style={{ padding: '4px 10px', border: 'none', borderRadius: 6, background: '#0f172a', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Approve</button>}
                    </td>
                    {/* Payment */}
                    <td style={TD}>
                      {row.paymentStatus === 'Paid'
                        ? <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>✓ Paid</span>
                        : <button onClick={() => setPayRow(row)} disabled={row.approvedByHR !== 'Approved'} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', border: 'none', borderRadius: 6, background: row.approvedByHR === 'Approved' ? '#16a34a' : '#e2e8f0', color: row.approvedByHR === 'Approved' ? '#fff' : '#94a3b8', fontSize: 11, fontWeight: 700, cursor: row.approvedByHR === 'Approved' ? 'pointer' : 'not-allowed' }}>
                            <CreditCard size={11} /> Record Payment
                          </button>}
                    </td>
                    {/* Status */}
                    <td style={TD}><PayBadge s={row.paymentStatus} /></td>
                    {/* Actions */}
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
          onSaved={() => {
            setShowAddEmp(false);
            EmployeeFirebaseService.fetchAllEmployees()
              .then(emps => setEmployees(emps.filter((e: any) => e.status === 'active' || !e.status)));
          }}
        />
      )}
      {showGenBatch && (
        <GenerateBatchModal
          employees={employees}
          onClose={() => setShowGenBatch(false)}
          onGenerated={(batch, newRows) => {
            setBatches(prev => [batch, ...prev]);
            setActiveBatch(batch);
            setRows(newRows);
            setShowGenBatch(false);
          }}
        />
      )}
      {payRow && (
        <RecordPaymentModal
          row={payRow}
          onClose={() => setPayRow(null)}
          onPaid={() => {
            setRows(prev => prev.map(r => r.id === payRow!.id ? { ...r, paymentStatus: 'Paid' } : r));
            setPayRow(null);
          }}
        />
      )}
      {editRow && (
        <EditRowModal
          row={editRow}
          onClose={() => setEditRow(null)}
          onSaved={updated => {
            setRows(prev => prev.map(r => r.id === updated.id ? updated : r));
            setEditRow(null);
          }}
        />
      )}
    </div>
  );
}