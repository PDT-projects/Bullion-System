// Payroll Module - Employee List embedded inside Payroll
// Replaces route navigation with internal tab callbacks
// so Add/Edit/Delete stay within /payroll without leaving the module.

import { useState, useMemo, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Plus, Filter, Eye, Edit, Trash2, Search,
  RefreshCw, Users, CheckCircle, XCircle,
} from 'lucide-react';
import { Employee, EmployeeFilters } from '../../employee/models/types';
import { EmployeeService } from '../../employee/models/employeeService';
import { EmployeeFirebaseService } from '../../employee/models/employeeFirebaseService';
import { EmployeeViewModal } from '../../employee/views/components/EmployeeViewModal';
import type { SalaryCurrency } from '../../employee/views/EmployeeFormView';

interface PayrollEmployeeListWrapperProps {
  onAdd:    () => void;
  onEdit:   (id: string) => void;
  onDelete: (id: string) => void;
}

export function PayrollEmployeeListWrapper({
  onAdd, onEdit, onDelete,
}: PayrollEmployeeListWrapperProps) {
  const [allEmployees,   setAllEmployees]   = useState<Employee[]>([]);
  const [isLoading,      setIsLoading]      = useState(true);
  const [viewEmployee,   setViewEmployee]   = useState<Employee | null>(null);
  const [displayCurrency, setDisplayCurrency] = useState<SalaryCurrency>('AED');
  const [showFilters,    setShowFilters]    = useState(false);
  const [search,         setSearch]         = useState('');
  const [statusFilter,   setStatusFilter]   = useState<'' | 'active' | 'inactive'>('');

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await EmployeeFirebaseService.fetchAllEmployees();
      setAllEmployees(data);
    } catch {
      toast.error('Failed to load employees');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => allEmployees.filter(e => {
    if (search && !e.name.toLowerCase().includes(search.toLowerCase()) &&
        !e.position.toLowerCase().includes(search.toLowerCase()) &&
        !e.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && e.status !== statusFilter) return false;
    return true;
  }), [allEmployees, search, statusFilter]);

  const stats = useMemo(() => EmployeeService.calculateStats(allEmployees), [allEmployees]);

  const displaySalary = (emp: Employee) => {
    const empCur: SalaryCurrency = (emp as any).salaryCurrency || 'AED';
    const val = empCur === displayCurrency
      ? emp.salary
      : EmployeeService.convertSalary(emp.salary, empCur, displayCurrency);
    return EmployeeService.formatCurrency(val, displayCurrency);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Toolbar ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Team Database</h2>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc', flex: 1, minWidth: 200 }}>
          <Search size={13} color="#94a3b8" />
          <input
            placeholder="Search by name, position, email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: 13, color: '#374151', background: 'transparent', width: '100%' }}
          />
        </div>

        {/* Currency toggle */}
        <div style={{ display: 'flex', gap: 2, background: '#f1f5f9', borderRadius: 8, padding: 3 }}>
          {(['AED', 'PKR'] as SalaryCurrency[]).map(cur => (
            <button key={cur} onClick={() => setDisplayCurrency(cur)} style={{
              padding: '5px 12px', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: displayCurrency === cur ? '#0f172a' : 'transparent',
              color: displayCurrency === cur ? '#fff' : '#64748b',
            }}>{cur}</button>
          ))}
        </div>

        {/* Filter toggle */}
        <button onClick={() => setShowFilters(v => !v)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
          background: showFilters ? '#0f172a' : '#fff', color: showFilters ? '#fff' : '#374151',
          border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          <Filter size={13} /> Filter
        </button>

        {/* Refresh */}
        <button onClick={load} style={{ padding: 8, border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>
          <RefreshCw size={14} color="#64748b" />
        </button>

        {/* Add Employee */}
        <button onClick={onAdd} style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px',
          background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8,
          fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}>
          <Plus size={14} /> Add Employee
        </button>
      </div>

      {/* ── Filter bar ── */}
      {showFilters && (
        <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 24px', display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, color: '#374151' }}>
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button onClick={() => { setSearch(''); setStatusFilter(''); }}
            style={{ padding: '7px 14px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: '#64748b', background: '#fff' }}>
            Clear
          </button>
        </div>
      )}

      {/* ── Stats strip ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '10px 24px', display: 'flex', gap: 20 }}>
        {[
          { label: 'Total',    value: stats.totalCount,    icon: Users,        color: '#0f172a' },
          { label: 'Active',   value: stats.activeCount,   icon: CheckCircle,  color: '#16a34a' },
          { label: 'Inactive', value: stats.inactiveCount, icon: XCircle,      color: '#dc2626' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon size={14} color={s.color} />
              <span style={{ fontSize: 12, color: '#64748b' }}>{s.label}:</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</span>
            </div>
          );
        })}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8' }}>1 AED = {EmployeeService.AED_TO_PKR} PKR</span>
      </div>

      {/* ── Table ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, flexDirection: 'column' }}>
            <RefreshCw size={24} color="#94a3b8" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#94a3b8', fontSize: 13 }}>Loading employees…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 10 }}>
            <Users size={40} color="#e2e8f0" />
            <p style={{ color: '#94a3b8', fontSize: 14, fontWeight: 600 }}>No employees found</p>
            <button onClick={onAdd} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>
              <Plus size={13} /> Add First Employee
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ background: '#0f172a', color: '#fff', position: 'sticky', top: 0, zIndex: 3 }}>
              <tr>
                {['Name', 'Position', 'Department', `Salary (${displayCurrency})`, 'Phone', 'Email', 'Location', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, idx) => (
                <tr key={emp.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f1f5f9' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f0f9ff'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = idx % 2 === 0 ? '#fff' : '#fafafa'; }}>
                  <td style={{ padding: '11px 16px', fontWeight: 600, color: '#0f172a' }}>{emp.name}</td>
                  <td style={{ padding: '11px 16px', color: '#374151' }}>{emp.position}</td>
                  <td style={{ padding: '11px 16px', color: '#64748b' }}>{(emp as any).department || '—'}</td>
                  <td style={{ padding: '11px 16px', fontWeight: 600, color: '#0f172a' }}>{displaySalary(emp)}</td>
                  <td style={{ padding: '11px 16px', color: '#64748b' }}>{emp.phone || '—'}</td>
                  <td style={{ padding: '11px 16px', color: '#64748b' }}>{emp.email}</td>
                  <td style={{ padding: '11px 16px', color: '#64748b' }}>{emp.location || '—'}</td>
                  <td style={{ padding: '11px 16px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: emp.status === 'active' ? '#dcfce7' : '#f1f5f9',
                      color: emp.status === 'active' ? '#16a34a' : '#64748b',
                    }}>{emp.status}</span>
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => setViewEmployee(emp)} title="View"
                        style={{ padding: 6, border: 'none', borderRadius: 6, background: '#f1f5f9', cursor: 'pointer' }}>
                        <Eye size={13} color="#64748b" />
                      </button>
                      <button onClick={() => onEdit(emp.id)} title="Edit"
                        style={{ padding: 6, border: 'none', borderRadius: 6, background: '#f0f9ff', cursor: 'pointer' }}>
                        <Edit size={13} color="#0369a1" />
                      </button>
                      <button onClick={() => onDelete(emp.id)} title="Delete"
                        style={{ padding: 6, border: 'none', borderRadius: 6, background: '#fef2f2', cursor: 'pointer' }}>
                        <Trash2 size={13} color="#dc2626" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── View Modal ── */}
      {viewEmployee && (
        <EmployeeViewModal
          employee={viewEmployee}
          onClose={() => setViewEmployee(null)}
          formatCurrency={EmployeeService.formatCurrency}
          formatDate={EmployeeService.formatDate}
          convertSalary={EmployeeService.convertSalary}
          displayCurrency={displayCurrency}
        />
      )}
    </div>
  );
}