// Payroll Batch View
// Excel-style table with all columns from the Google Sheet:
// Select | Year | Salary Month | Emp ID | Employee Name | Department | Designation
// Basic Salary | Overtime | Performance Bonus | Commission | Gross Earning
// Leaves | Late Arrival | Early Depart | Penalty | Total Deductions
// Net Salary | Advance Salary | Remaining Amount
// Work Status | Approved by HR | Approved by Manager
// Make Payment | Payment Status | Generate Pay Slip | View Bank Slip

import { useState } from 'react';
import {
  Plus, RefreshCw, ChevronDown, Check, X, Edit2, Save,
  FileText, CreditCard, Eye, Filter, Search, Users,
  CheckCircle, Clock, XCircle, Wallet, ToggleLeft, ToggleRight,
  Download, Printer, ChevronRight,
} from 'lucide-react';
import { PayrollBatch, PayrollBatchRow, PayrollBatchFilter } from '../models/payrollBatchTypes';

// ─── Sub-component: Generate Batch Modal ─────────────────────────────────────

interface GenModalProps {
  employees:    any[];
  genMonth:     string;
  setGenMonth:  (m: string) => void;
  onGenerate:   (selectedIds: string[]) => void;
  onClose:      () => void;
  isGenerating: boolean;
}

function GenerateBatchModal({ employees, genMonth, setGenMonth, onGenerate, onClose, isGenerating }: GenModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(employees.map(e => e.id)));

  const toggle = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleAll = () =>
    setSelected(prev => prev.size === employees.length ? new Set() : new Set(employees.map(e => e.id)));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: 580, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Generate Payroll Batch</h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>Select employees and salary month</p>
          </div>
          <button onClick={onClose} style={{ padding: 6, border: 'none', background: '#f1f5f9', borderRadius: 8, cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        {/* Month picker */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Salary Month</label>
          <input
            type="month" value={genMonth}
            onChange={e => setGenMonth(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, width: 200 }}
          />
        </div>

        {/* Employee list */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
              Active Employees ({selected.size}/{employees.length} selected)
            </label>
            <button onClick={toggleAll} style={{ fontSize: 12, color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              {selected.size === employees.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 24px' }}>
            {employees.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 24 }}>No active employees found</p>
            ) : employees.map(emp => (
              <div
                key={emp.id}
                onClick={() => toggle(emp.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                  borderRadius: 8, cursor: 'pointer', marginBottom: 4,
                  background: selected.has(emp.id) ? '#f0f9ff' : 'transparent',
                  border: `1px solid ${selected.has(emp.id) ? '#bae6fd' : '#f1f5f9'}`,
                  transition: 'all 0.1s',
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: 4, border: `2px solid ${selected.has(emp.id) ? '#0f172a' : '#d1d5db'}`,
                  background: selected.has(emp.id) ? '#0f172a' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {selected.has(emp.id) && <Check size={11} color="#fff" />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{emp.name}</p>
                  <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>
                    {emp.empCode || emp.empId || ''} · {emp.department || ''} · {emp.designation || emp.position || ''}
                  </p>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>
                  AED {(emp.salary || 0).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
            Cancel
          </button>
          <button
            onClick={() => onGenerate(Array.from(selected))}
            disabled={isGenerating || selected.size === 0}
            style={{
              padding: '10px 20px', border: 'none', borderRadius: 8,
              background: isGenerating || selected.size === 0 ? '#94a3b8' : '#0f172a',
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: isGenerating ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {isGenerating ? <><RefreshCw size={13} className="animate-spin" /> Generating...</> : <><Plus size={13} /> Generate Batch</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Status Badges ─────────────────────────────────────────────────────────────

function PaymentBadge({ status }: { status: string }) {
  const cfg = status === 'Paid'
    ? { bg: '#dcfce7', color: '#166534', label: 'Paid' }
    : status === 'Partial'
    ? { bg: '#fef9c3', color: '#854d0e', label: 'Partial' }
    : { bg: '#fee2e2', color: '#991b1b', label: 'Pending' };
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

function ApprovalBadge({ status }: { status: string }) {
  const cfg = status === 'Approved'
    ? { bg: '#dcfce7', color: '#166534' }
    : status === 'Rejected'
    ? { bg: '#fee2e2', color: '#991b1b' }
    : { bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color }}>
      {status}
    </span>
  );
}

// ─── Inline editable cell ──────────────────────────────────────────────────────

function EditCell({ value, field, editValues, isEditing, onChange }: {
  value: number; field: string; editValues: any; isEditing: boolean; onChange: (f: string, v: number) => void;
}) {
  if (!isEditing) return <span style={{ fontSize: 12, color: '#374151' }}>{value.toLocaleString()}</span>;
  return (
    <input
      type="number" min={0}
      value={editValues[field] ?? value}
      onChange={e => onChange(field, parseFloat(e.target.value) || 0)}
      style={{ width: 70, padding: '2px 6px', border: '1px solid #6366f1', borderRadius: 4, fontSize: 12, textAlign: 'right' }}
    />
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

interface PayrollBatchViewProps {
  batches:         PayrollBatch[];
  activeBatch:     PayrollBatch | null;
  rows:            PayrollBatchRow[];
  allRows:         PayrollBatchRow[];
  employees:       any[];
  selectedRows:    Set<string>;
  isLoading:       boolean;
  isGenerating:    boolean;
  editingRowId:    string | null;
  editValues:      Partial<PayrollBatchRow>;
  showGenModal:    boolean;
  setShowGenModal: (v: boolean) => void;
  genMonth:        string;
  setGenMonth:     (m: string) => void;
  filter:          PayrollBatchFilter;
  setFilter:       (f: PayrollBatchFilter) => void;
  departments:     string[];
  summaryStats:    { totalEmployees: number; totalGross: number; totalNet: number; totalPaid: number; totalPending: number };
  fmt:             (n: number) => string;
  loadBatch:       (b: PayrollBatch) => void;
  generateBatch:   (ids: string[]) => void;
  startEdit:       (row: PayrollBatchRow) => void;
  saveEdit:        (id: string) => void;
  cancelEdit:      () => void;
  recordPayment:   (id: string) => void;
  approveHR:       (id: string) => void;
  approveManager:  (id: string) => void;
  toggleWorkStatus:(id: string, current: 'Active' | 'Inactive') => void;
  toggleSelect:    (id: string) => void;
  toggleSelectAll: () => void;
  setEditValues:   (v: Partial<PayrollBatchRow>) => void;
}

export function PayrollBatchView({
  batches, activeBatch, rows, allRows, employees,
  selectedRows, isLoading, isGenerating, editingRowId, editValues,
  showGenModal, setShowGenModal, genMonth, setGenMonth,
  filter, setFilter, departments, summaryStats, fmt,
  loadBatch, generateBatch, startEdit, saveEdit, cancelEdit,
  recordPayment, approveHR, approveManager, toggleWorkStatus,
  toggleSelect, toggleSelectAll, setEditValues,
}: PayrollBatchViewProps) {

  const [showBatchList, setShowBatchList] = useState(false);
  const [showFilters,   setShowFilters]   = useState(false);

  const setF = (key: keyof PayrollBatchFilter, val: string) =>
    setFilter({ ...filter, [key]: val });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, flexDirection: 'column', gap: 12 }}>
        <RefreshCw size={28} color="#94a3b8" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#94a3b8', fontSize: 14 }}>Loading payroll data…</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc' }}>

      {/* ── Top toolbar ───────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>

        {/* Batch selector */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowBatchList(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
              border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc',
              fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
            }}
          >
            <Wallet size={14} />
            {activeBatch ? activeBatch.title : 'Select Batch'}
            <ChevronDown size={13} />
          </button>
          {showBatchList && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, zIndex: 20, marginTop: 4,
              background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)', minWidth: 280, maxHeight: 300, overflowY: 'auto',
            }}>
              {batches.length === 0
                ? <p style={{ padding: 16, fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>No batches yet</p>
                : batches.map(b => (
                  <div
                    key={b.id}
                    onClick={() => { loadBatch(b); setShowBatchList(false); }}
                    style={{
                      padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #f8fafc',
                      background: activeBatch?.id === b.id ? '#f0f9ff' : 'transparent',
                    }}
                  >
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{b.title}</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{b.totalRows} employees · {fmt(b.totalNet)}</p>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Generate batch button */}
        <button
          onClick={() => setShowGenModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px',
            background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8,
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >
          <Plus size={14} /> Generate Payroll Batch
        </button>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
            background: showFilters ? '#0f172a' : '#fff', color: showFilters ? '#fff' : '#374151',
            border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Filter size={13} /> Filters
        </button>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', flex: 1, minWidth: 200 }}>
          <Search size={13} color="#94a3b8" />
          <input
            placeholder="Search by name, emp ID, department…"
            value={filter.search}
            onChange={e => setF('search', e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: 13, color: '#374151', background: 'transparent', width: '100%' }}
          />
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Users size={13} color="#94a3b8" />
          <span style={{ fontSize: 12, color: '#64748b' }}>{rows.length} employees</span>
        </div>
      </div>

      {/* ── Filters bar ───────────────────────────────────────────────────── */}
      {showFilters && (
        <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 24px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'Department', key: 'department', options: ['', ...departments] },
            { label: 'Payment',    key: 'paymentStatus', options: ['', 'Pending', 'Paid', 'Partial'] },
            { label: 'Work Status',key: 'workStatus',    options: ['', 'Active', 'Inactive'] },
            { label: 'Approval',   key: 'approvalStatus',options: ['', 'Pending', 'Approved', 'Rejected'] },
          ].map(({ label, key, options }) => (
            <div key={key}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>{label}</label>
              <select
                value={(filter as any)[key]}
                onChange={e => setF(key as keyof PayrollBatchFilter, e.target.value)}
                style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, color: '#374151', background: '#fff' }}
              >
                {options.map(o => <option key={o} value={o}>{o || `All ${label}s`}</option>)}
              </select>
            </div>
          ))}
          <button onClick={() => setFilter({ search: '', department: '', paymentStatus: '', workStatus: '', approvalStatus: '' })}
            style={{ alignSelf: 'flex-end', padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: '#64748b', background: '#fff' }}>
            Clear
          </button>
        </div>
      )}

      {/* ── Summary cards ─────────────────────────────────────────────────── */}
      {activeBatch && (
        <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 24px', display: 'flex', gap: 16, overflowX: 'auto' }}>
          {[
            { label: 'Total Employees', value: String(summaryStats.totalEmployees), icon: Users },
            { label: 'Gross Payroll',   value: fmt(summaryStats.totalGross),        icon: Wallet },
            { label: 'Net Payroll',     value: fmt(summaryStats.totalNet),          icon: CreditCard },
            { label: 'Paid',            value: String(summaryStats.totalPaid),      icon: CheckCircle },
            { label: 'Pending',         value: String(summaryStats.totalPending),   icon: Clock },
          ].map(card => {
            const Icon = card.icon;
            return (
              <div key={card.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                <Icon size={14} color="#0f172a" />
                <div>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</p>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{card.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto' }}>
        {!activeBatch ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, gap: 12 }}>
            <Wallet size={48} color="#e2e8f0" />
            <p style={{ fontSize: 15, fontWeight: 600, color: '#94a3b8' }}>No payroll batch selected</p>
            <p style={{ fontSize: 13, color: '#cbd5e1' }}>Generate a new batch to get started</p>
            <button
              onClick={() => setShowGenModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}
            >
              <Plus size={14} /> Generate Payroll Batch
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
            <p style={{ color: '#94a3b8', fontSize: 14 }}>No employees match the current filters</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ background: '#0f172a', color: '#fff', position: 'sticky', top: 0, zIndex: 5 }}>
                {/* Select */}
                <th style={th}>
                  <input type="checkbox"
                    checked={selectedRows.size === rows.length && rows.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th style={th}>Year</th>
                <th style={th}>Salary Month</th>
                <th style={th}>Emp ID</th>
                <th style={{ ...th, textAlign: 'left', minWidth: 140 }}>Employee Name</th>
                <th style={th}>Department</th>
                <th style={th}>Designation</th>
                {/* Earnings */}
                <th style={{ ...th, background: '#1e3a5f' }}>Basic Salary</th>
                <th style={{ ...th, background: '#1e3a5f' }}>Overtime</th>
                <th style={{ ...th, background: '#1e3a5f' }}>Perf. Bonus</th>
                <th style={{ ...th, background: '#1e3a5f' }}>Commission</th>
                <th style={{ ...th, background: '#1e3a5f' }}>Gross Earning</th>
                {/* Deductions */}
                <th style={{ ...th, background: '#4a1942' }}>Leaves</th>
                <th style={{ ...th, background: '#4a1942' }}>Late Arrival</th>
                <th style={{ ...th, background: '#4a1942' }}>Early Depart</th>
                <th style={{ ...th, background: '#4a1942' }}>Penalty</th>
                <th style={{ ...th, background: '#4a1942' }}>Total Deductions</th>
                {/* Net */}
                <th style={{ ...th, background: '#14532d' }}>Net Salary</th>
                <th style={{ ...th, background: '#14532d' }}>Advance Salary</th>
                <th style={{ ...th, background: '#14532d' }}>Remaining</th>
                {/* Status */}
                <th style={th}>Work Status</th>
                <th style={th}>Approved by HR</th>
                <th style={th}>Approved by Manager</th>
                {/* Actions */}
                <th style={th}>Make Payment</th>
                <th style={th}>Payment Status</th>
                <th style={th}>Pay Slip</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const isEditing = editingRowId === row.id;
                const isSelected = selectedRows.has(row.id);
                const bg = isSelected ? '#eff6ff' : idx % 2 === 0 ? '#fff' : '#fafafa';
                return (
                  <tr key={row.id} style={{ background: bg, borderBottom: '1px solid #f1f5f9' }}>
                    {/* Select */}
                    <td style={td}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(row.id)} />
                    </td>
                    {/* Year */}
                    <td style={{ ...td, color: '#64748b' }}>{row.year}</td>
                    {/* Month */}
                    <td style={{ ...td, color: '#64748b' }}>
                      {new Date(row.salaryMonth + '-01').toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                    </td>
                    {/* Emp ID */}
                    <td style={{ ...td, fontFamily: 'monospace', fontSize: 11, color: '#64748b' }}>{row.empCode || row.empId}</td>
                    {/* Name */}
                    <td style={{ ...td, textAlign: 'left', fontWeight: 600, color: '#0f172a' }}>{row.employeeName}</td>
                    {/* Dept */}
                    <td style={{ ...td, color: '#64748b' }}>{row.department}</td>
                    {/* Designation */}
                    <td style={{ ...td, color: '#64748b' }}>{row.designation}</td>

                    {/* ── Earnings (light blue bg) ── */}
                    <td style={{ ...td, background: '#f0f7ff' }}>
                      {row.basicSalary.toLocaleString()}
                    </td>
                    <td style={{ ...td, background: '#f0f7ff' }}>
                      <EditCell value={row.overtime} field="overtime" editValues={editValues} isEditing={isEditing} onChange={(f, v) => setEditValues({ [f]: v })} />
                    </td>
                    <td style={{ ...td, background: '#f0f7ff' }}>
                      <EditCell value={row.performanceBonus} field="performanceBonus" editValues={editValues} isEditing={isEditing} onChange={(f, v) => setEditValues({ [f]: v })} />
                    </td>
                    <td style={{ ...td, background: '#f0f7ff', color: '#0369a1' }}>
                      {row.commission.toLocaleString()}
                    </td>
                    <td style={{ ...td, background: '#f0f7ff', fontWeight: 700, color: '#0f172a' }}>
                      {isEditing
                        ? ((editValues.overtime ?? row.overtime) + (editValues.performanceBonus ?? row.performanceBonus) + row.commission + row.basicSalary).toLocaleString()
                        : row.grossEarning.toLocaleString()
                      }
                    </td>

                    {/* ── Deductions (light red bg) ── */}
                    <td style={{ ...td, background: '#fff5f5' }}>
                      <EditCell value={row.leaves} field="leaves" editValues={editValues} isEditing={isEditing} onChange={(f, v) => setEditValues({ [f]: v })} />
                    </td>
                    <td style={{ ...td, background: '#fff5f5', color: '#dc2626' }}>
                      <EditCell value={row.lateArrival} field="lateArrival" editValues={editValues} isEditing={isEditing} onChange={(f, v) => setEditValues({ [f]: v })} />
                    </td>
                    <td style={{ ...td, background: '#fff5f5', color: '#dc2626' }}>
                      <EditCell value={row.earlyDepart} field="earlyDepart" editValues={editValues} isEditing={isEditing} onChange={(f, v) => setEditValues({ [f]: v })} />
                    </td>
                    <td style={{ ...td, background: '#fff5f5', color: '#dc2626' }}>
                      <EditCell value={row.penalty} field="penalty" editValues={editValues} isEditing={isEditing} onChange={(f, v) => setEditValues({ [f]: v })} />
                    </td>
                    <td style={{ ...td, background: '#fff5f5', fontWeight: 700, color: '#dc2626' }}>
                      {isEditing
                        ? ((editValues.lateArrival ?? row.lateArrival) + (editValues.earlyDepart ?? row.earlyDepart) + (editValues.penalty ?? row.penalty)).toLocaleString()
                        : row.totalDeductions.toLocaleString()
                      }
                    </td>

                    {/* ── Net (light green bg) ── */}
                    <td style={{ ...td, background: '#f0fdf4', fontWeight: 700, color: '#16a34a', fontSize: 13 }}>
                      {isEditing
                        ? Math.max(0,
                            (row.basicSalary + (editValues.overtime ?? row.overtime) + (editValues.performanceBonus ?? row.performanceBonus) + row.commission)
                            - ((editValues.lateArrival ?? row.lateArrival) + (editValues.earlyDepart ?? row.earlyDepart) + (editValues.penalty ?? row.penalty))
                          ).toLocaleString()
                        : row.netSalary.toLocaleString()
                      }
                    </td>
                    <td style={{ ...td, background: '#f0fdf4', color: '#f97316' }}>
                      {row.advanceSalary.toLocaleString()}
                    </td>
                    <td style={{ ...td, background: '#f0fdf4', fontWeight: 600, color: '#0f172a' }}>
                      {row.remainingAmount.toLocaleString()}
                    </td>

                    {/* ── Work Status toggle ── */}
                    <td style={td}>
                      <button
                        onClick={() => toggleWorkStatus(row.id, row.workStatus)}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', border: 'none', borderRadius: 6, cursor: 'pointer',
                          background: row.workStatus === 'Active' ? '#dcfce7' : '#f1f5f9',
                          color: row.workStatus === 'Active' ? '#16a34a' : '#64748b',
                        }}
                      >
                        {row.workStatus === 'Active' ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        <span style={{ fontSize: 11, fontWeight: 600 }}>{row.workStatus}</span>
                      </button>
                    </td>

                    {/* ── HR Approval ── */}
                    <td style={td}>
                      {row.approvedByHR === 'Approved'
                        ? <ApprovalBadge status="Approved" />
                        : <button onClick={() => approveHR(row.id)} style={{ padding: '4px 10px', border: 'none', borderRadius: 6, background: '#0f172a', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                            Approve
                          </button>
                      }
                    </td>

                    {/* ── Manager Approval ── */}
                    <td style={td}>
                      {row.approvedByManager === 'Approved'
                        ? <ApprovalBadge status="Approved" />
                        : <button onClick={() => approveManager(row.id)} style={{ padding: '4px 10px', border: 'none', borderRadius: 6, background: '#0f172a', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                            Approve
                          </button>
                      }
                    </td>

                    {/* ── Make Payment ── */}
                    <td style={td}>
                      {row.paymentStatus === 'Paid'
                        ? <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>✓ Paid</span>
                        : <button
                            onClick={() => recordPayment(row.id)}
                            disabled={row.approvedByHR !== 'Approved'}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              padding: '5px 10px', border: 'none', borderRadius: 6,
                              background: row.approvedByHR === 'Approved' ? '#16a34a' : '#e2e8f0',
                              color: row.approvedByHR === 'Approved' ? '#fff' : '#94a3b8',
                              fontSize: 11, fontWeight: 700, cursor: row.approvedByHR === 'Approved' ? 'pointer' : 'not-allowed',
                            }}
                          >
                            <CreditCard size={11} /> Record Payment
                          </button>
                      }
                    </td>

                    {/* ── Payment Status ── */}
                    <td style={td}>
                      <PaymentBadge status={row.paymentStatus} />
                    </td>

                    {/* ── Pay Slip ── */}
                    <td style={td}>
                      <button
                        onClick={() => window.print()}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', color: '#374151' }}
                      >
                        <FileText size={11} /> Generate
                      </button>
                    </td>

                    {/* ── Actions ── */}
                    <td style={td}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {isEditing ? (
                          <>
                            <button onClick={() => saveEdit(row.id)} title="Save"
                              style={{ padding: 5, border: 'none', borderRadius: 6, background: '#dcfce7', color: '#16a34a', cursor: 'pointer' }}>
                              <Save size={13} />
                            </button>
                            <button onClick={cancelEdit} title="Cancel"
                              style={{ padding: 5, border: 'none', borderRadius: 6, background: '#fee2e2', color: '#dc2626', cursor: 'pointer' }}>
                              <X size={13} />
                            </button>
                          </>
                        ) : (
                          <button onClick={() => startEdit(row)} title="Edit"
                            style={{ padding: 5, border: 'none', borderRadius: 6, background: '#f1f5f9', color: '#374151', cursor: 'pointer' }}>
                            <Edit2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Generate Modal ────────────────────────────────────────────────── */}
      {showGenModal && (
        <GenerateBatchModal
          employees={employees}
          genMonth={genMonth}
          setGenMonth={setGenMonth}
          onGenerate={generateBatch}
          onClose={() => setShowGenModal(false)}
          isGenerating={isGenerating}
        />
      )}
    </div>
  );
}

// ── Style constants ────────────────────────────────────────────────────────────
const th: React.CSSProperties = {
  padding: '10px 12px', fontSize: 11, fontWeight: 700,
  textAlign: 'center', whiteSpace: 'nowrap', letterSpacing: '0.03em',
};
const td: React.CSSProperties = {
  padding: '8px 12px', textAlign: 'center', verticalAlign: 'middle',
  fontSize: 12, color: '#374151',
};