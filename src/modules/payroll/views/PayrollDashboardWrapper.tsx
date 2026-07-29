// Payroll Module - Unified Dashboard

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  DollarSign, Percent, Calculator, TrendingUp, CreditCard,
  ArrowUpCircle, Plus, LayoutDashboard, ChevronRight,
  Wallet, FileText, BarChart2, Clock, Users,
} from 'lucide-react';

import { SalaryDashboardWrapper }       from '../../salary/views/SalaryDashboardWrapper';
import { SalaryListWrapper }            from '../../salary/views/SalaryListWrapper';
import { SalaryCreateWrapper }          from '../../salary/views/SalaryCreateWrapper';
import { SalaryEditWrapper }            from '../../salary/views/SalaryEditWrapper';
import { SalaryDeleteWrapper }          from '../../salary/views/SalaryDeleteWrapper';
import { CommissionSlabListWrapper }    from '../../commission/views/CommissionSlabListWrapper';
import { CommissionCalculationWrapper } from '../../commission/views/CommissionCalculationWrapper';
import { CommissionReportWrapper }      from '../../commission/views/CommissionReportWrapper';
import { PayrollFirebaseService }       from '../models/payrollFirebaseService';

type PayrollTab =
  | 'overview' | 'salaries' | 'salary-regular' | 'salary-advance'
  | 'salary-create-regular' | 'salary-create-advance' | 'salary-edit' | 'salary-delete'
  | 'commission-slabs' | 'commission-calculate' | 'commission-reports';

const PRIMARY_TABS: { id: PayrollTab; label: string; icon: React.ElementType }[] = [
  { id: 'overview',             label: 'Overview',             icon: LayoutDashboard },
  { id: 'salaries',             label: 'Salaries',             icon: CreditCard      },
  { id: 'commission-slabs',     label: 'Commission Slabs',     icon: Percent         },
  { id: 'commission-calculate', label: 'Calculate Commission', icon: Calculator      },
  { id: 'commission-reports',   label: 'Commission Reports',   icon: TrendingUp      },
];

export function PayrollDashboardWrapper() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as PayrollTab) || 'overview';
  const [activeTab,      setActiveTab]      = useState<PayrollTab>(initialTab);
  const [salaryEditId,   setSalaryEditId]   = useState<string | null>(null);
  const [salaryDeleteId, setSalaryDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab !== 'overview') setSearchParams({ tab: activeTab }, { replace: true });
    else setSearchParams({}, { replace: true });
  }, [activeTab]);

  const goToTab = (tab: PayrollTab) => { setSalaryEditId(null); setSalaryDeleteId(null); setActiveTab(tab); };
  const handleSalaryAdd    = (type: 'regular' | 'advance') => setActiveTab(type === 'regular' ? 'salary-create-regular' : 'salary-create-advance');
  const handleSalaryEdit   = (id: string) => { setSalaryEditId(id);   setActiveTab('salary-edit');   };
  const handleSalaryDelete = (id: string) => { setSalaryDeleteId(id); setActiveTab('salary-delete'); };
  const handleSalaryBack   = () => setActiveTab('salaries');
  const isInSalaryTab = activeTab === 'salaries' || activeTab.startsWith('salary');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f1f5f9' }}>

      {/* ── Header ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 0 16px' }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <DollarSign size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>Payroll Management</h1>
            <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Salaries · Commissions · Reports</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2 }}>
          {PRIMARY_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id || (tab.id === 'salaries' && isInSalaryTab);
            return (
              <button key={tab.id} onClick={() => goToTab(tab.id)} style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px',
                background: isActive ? '#0f172a' : 'transparent',
                color: isActive ? '#fff' : '#64748b',
                border: 'none', borderRadius: '8px 8px 0 0', fontSize: 13,
                fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.15s', marginBottom: isActive ? -1 : 0,
              }}>
                <Icon size={14} />{tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'overview'              && <PayrollOverview goToTab={goToTab} />}
        {activeTab === 'salaries'              && <SalaryDashboardWrapper />}
        {activeTab === 'salary-regular'        && <SalaryListWrapper type="regular" title="Regular Salaries" onAdd={() => handleSalaryAdd('regular')} onEdit={handleSalaryEdit} onDelete={handleSalaryDelete} onBack={handleSalaryBack} />}
        {activeTab === 'salary-advance'        && <SalaryListWrapper type="advance" title="Advance Salaries" onAdd={() => handleSalaryAdd('advance')} onEdit={handleSalaryEdit} onDelete={handleSalaryDelete} onBack={handleSalaryBack} />}
        {activeTab === 'salary-create-regular' && <SalaryCreateWrapper type="regular" onSuccess={handleSalaryBack} onCancel={handleSalaryBack} />}
        {activeTab === 'salary-create-advance' && <SalaryCreateWrapper type="advance" onSuccess={handleSalaryBack} onCancel={handleSalaryBack} />}
        {activeTab === 'salary-edit'   && salaryEditId   && <SalaryEditWrapper   id={salaryEditId}   onSuccess={handleSalaryBack} onCancel={handleSalaryBack} />}
        {activeTab === 'salary-delete' && salaryDeleteId && <SalaryDeleteWrapper id={salaryDeleteId} onSuccess={handleSalaryBack} onCancel={handleSalaryBack} />}
        {activeTab === 'commission-slabs'     && <CommissionSlabListWrapper />}
        {activeTab === 'commission-calculate' && <CommissionCalculationWrapper onCommissionsSaved={() => goToTab('commission-reports')} />}
        {activeTab === 'commission-reports'   && <CommissionReportWrapper />}
      </div>
    </div>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────────

interface OverviewProps { goToTab: (tab: PayrollTab) => void; }

function PayrollOverview({ goToTab }: OverviewProps) {
  const [stats, setStats] = useState({ totalSalaryPaid: 0, thisMonth: 0, advanceTotal: 0, pendingPayments: 0, isLoading: true });

  useEffect(() => {
    PayrollFirebaseService.fetchAllSalaries().then(salaries => {
      const cm = new Date().toISOString().slice(0, 7);
      setStats({
        totalSalaryPaid: salaries.reduce((s, r) => s + (r.amount || 0), 0),
        thisMonth:       salaries.filter(r => r.salaryMonth === cm).reduce((s, r) => s + (r.amount || 0), 0),
        advanceTotal:    salaries.filter(r => r.subCategory?.toLowerCase().includes('advance')).reduce((s, r) => s + (r.amount || 0), 0),
        pendingPayments: salaries.filter(r => !r.paymentStatus || r.paymentStatus === 'Partial').length,
        isLoading: false,
      });
    }).catch(() => setStats(s => ({ ...s, isLoading: false })));
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', minimumFractionDigits: 0 }).format(n);

  const statCards = [
    { label: 'Total Salary Paid',  value: fmt(stats.totalSalaryPaid),       icon: Wallet,        accent: '#0f172a' },
    { label: 'This Month',         value: fmt(stats.thisMonth),              icon: BarChart2,     accent: '#0f172a' },
    { label: 'Advance Salaries',   value: fmt(stats.advanceTotal),           icon: ArrowUpCircle, accent: '#0f172a' },
    { label: 'Pending Payments',   value: String(stats.pendingPayments),     icon: Clock,         accent: '#dc2626' },
  ];

  const salaryLinks: { label: string; sub: string; icon: React.ElementType; tab: PayrollTab }[] = [
    { label: 'All Salaries',       sub: 'View full salary history',         icon: FileText,      tab: 'salaries'              },
    { label: 'Regular Salaries',   sub: 'Monthly employee payments',        icon: CreditCard,    tab: 'salary-regular'        },
    { label: 'Advance Salaries',   sub: 'Advance payment records',          icon: ArrowUpCircle, tab: 'salary-advance'        },
    { label: 'Pay Regular Salary', sub: 'Create a new regular payment',     icon: Plus,          tab: 'salary-create-regular' },
    { label: 'Pay Advance Salary', sub: 'Create a new advance payment',     icon: Plus,          tab: 'salary-create-advance' },
  ];

  const commLinks: { label: string; sub: string; icon: React.ElementType; tab: PayrollTab }[] = [
    { label: 'Commission Slabs',     sub: 'Manage rate slabs per city',    icon: Percent,    tab: 'commission-slabs'     },
    { label: 'Calculate Commission', sub: 'Run monthly calculation',       icon: Calculator, tab: 'commission-calculate' },
    { label: 'Commission Reports',   sub: 'View all commission records',   icon: TrendingUp, tab: 'commission-reports'   },
  ];

  return (
    <div style={{ padding: '28px 32px 40px', width: '100%', boxSizing: 'border-box' }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {stats.isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 14, height: 100, border: '1px solid #e2e8f0' }} />
            ))
          : statCards.map(sc => {
              const Icon = sc.icon;
              return (
                <div key={sc.label} style={{
                  background: '#fff', borderRadius: 14, padding: '20px 22px',
                  border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  display: 'flex', flexDirection: 'column', gap: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {sc.label}
                    </span>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={15} color={sc.accent} />
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>{sc.value}</p>
                </div>
              );
            })}
      </div>

      {/* Two-column module cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* Salaries */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          {/* Card header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={17} color="#0f172a" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Salaries</p>
                <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>Employee payroll management</p>
              </div>
            </div>
            <button onClick={() => goToTab('salary-create-regular')} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8,
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>
              <Plus size={12} /> Pay Now
            </button>
          </div>
          {/* Rows */}
          {salaryLinks.map((item, i) => {
            const Icon = item.icon;
            return (
              <button key={item.label} onClick={() => goToTab(item.tab)} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '13px 22px', background: 'transparent', border: 'none',
                borderBottom: i < salaryLinks.length - 1 ? '1px solid #f8fafc' : 'none',
                cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={13} color="#64748b" />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{item.label}</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{item.sub}</p>
                  </div>
                </div>
                <ChevronRight size={14} color="#cbd5e1" />
              </button>
            );
          })}
        </div>

        {/* Commission */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Percent size={17} color="#0f172a" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Commission</p>
                <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>Slabs, calculation & reports</p>
              </div>
            </div>
            <button onClick={() => goToTab('commission-calculate')} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8,
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>
              <Calculator size={12} /> Calculate
            </button>
          </div>
          {commLinks.map((item, i) => {
            const Icon = item.icon;
            return (
              <button key={item.label} onClick={() => goToTab(item.tab)} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '13px 22px', background: 'transparent', border: 'none',
                borderBottom: i < commLinks.length - 1 ? '1px solid #f8fafc' : 'none',
                cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={13} color="#64748b" />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{item.label}</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{item.sub}</p>
                  </div>
                </div>
                <ChevronRight size={14} color="#cbd5e1" />
              </button>
            );
          })}
        </div>
      </div>

      {/* CTA Banner */}
      <div style={{
        borderRadius: 16, padding: '22px 28px',
        background: '#0f172a',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        boxShadow: '0 4px 20px rgba(15,23,42,0.15)',
      }}>
        <div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fff' }}>Ready to process payroll?</p>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>Pay salaries or run commission calculations for this month.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <button onClick={() => goToTab('salary-create-regular')} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px',
            background: '#fff', color: '#0f172a', border: 'none', borderRadius: 10,
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>
            <CreditCard size={14} /> Pay Regular Salary
          </button>
          <button onClick={() => goToTab('commission-calculate')} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px',
            background: 'rgba(255,255,255,0.1)', color: '#fff',
            border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10,
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>
            <Calculator size={14} /> Calculate Commission
          </button>
        </div>
      </div>
    </div>
  );
}