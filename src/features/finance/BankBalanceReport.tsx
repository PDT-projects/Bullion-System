// BankBalanceReport.tsx — self-contained, fetches own data from Firestore
import { useState, useMemo, useEffect, useRef } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../api/firebase/firebase';
import {
  Download, Eye, Building2, DollarSign, TrendingUp,
  XCircle, Loader2, Filter, ChevronDown, X, FileText
} from 'lucide-react';
import { toast } from 'sonner';

type Bank = {
  id: string;
  name: string;
  balance: number;
  accountNumber: string;
  transactions: any[];
};

// ─── Multi-Select Dropdown ────────────────────────────────────────────────────
function MultiSelectDropdown({
  options,
  selected,
  onChange,
  placeholder,
}: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const toggle = (opt: string) =>
    onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt]);

  const label =
    selected.length === 0 ? placeholder :
    selected.length === 1 ? selected[0] :
    `${selected.length} selected`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
      >
        <span className={selected.length === 0 ? 'text-gray-400' : 'text-gray-900'}>{label}</span>
        <ChevronDown size={15} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
            <button type="button" onClick={() => onChange([...options])} className="text-xs text-[#4f46e5] font-medium hover:underline">
              Select all
            </button>
            <button type="button" onClick={() => onChange([])} className="text-xs text-gray-500 hover:underline">
              Clear
            </button>
          </div>
          <div className="overflow-y-auto">
            {options.map(opt => (
              <label key={opt} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggle(opt)}
                  className="accent-[#4f46e5] w-4 h-4 rounded"
                />
                <span className="text-gray-800">{opt}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Pill ─────────────────────────────────────────────────────────────────────
function Pill({ label, onRemove, colorClass = 'bg-[#4f46e5]/10 text-[#4f46e5]' }: {
  label: string; onRemove: () => void; colorClass?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${colorClass}`}>
      {label}
      <button type="button" onClick={onRemove} className="hover:opacity-70"><X size={11} /></button>
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function BankBalanceReport() {
  const [data, setData]         = useState<Bank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewBank, setViewBank] = useState<Bank | null>(null);

  const [filters, setFilters] = useState({
    banks:         [] as string[],   // multi-select by bank name
    balanceStatus: [] as string[],   // 'Positive' | 'Negative' | 'Zero'
    sortBy:        'balance' as 'balance' | 'name',
    search:        '',
  });

  useEffect(() => {
    (async () => {
      try {
        const [banksSnap, txSnap] = await Promise.all([
          getDocs(collection(db, 'banks')),
          getDocs(collection(db, 'bank_transactions')),
        ]);

        const txByBank: Record<string, any[]> = {};
        txSnap.docs.forEach(d => {
          const t = d.data() as any;
          if (t.bankId) {
            if (!txByBank[t.bankId]) txByBank[t.bankId] = [];
            txByBank[t.bankId].push({ ...t, id: d.id });
          }
        });

        const banks: Bank[] = banksSnap.docs.map(d => {
          const b = d.data() as any;
          const txns = (txByBank[d.id] || []).sort((a: any, x: any) =>
            new Date(x.date).getTime() - new Date(a.date).getTime()
          );
          return {
            id:            d.id,
            name:          b.name           || '—',
            balance:       Number(b.balance) || 0,
            accountNumber: b.accountNumber   || b.account || '—',
            transactions:  txns,
          };
        });
        setData(banks);
      } catch (err) {
        console.error('BankBalanceReport fetch error:', err);
        toast.error('Failed to load bank data');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const bankNameOptions = useMemo(() => [...new Set(data.map(b => b.name))].sort(), [data]);
  const balanceStatusOptions = ['Positive', 'Negative', 'Zero'];

  const filteredData = useMemo(() => {
    return [...data]
      .filter(b => {
        if (filters.search && !b.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
        if (filters.banks.length > 0 && !filters.banks.includes(b.name)) return false;
        if (filters.balanceStatus.length > 0) {
          const status = b.balance > 0 ? 'Positive' : b.balance < 0 ? 'Negative' : 'Zero';
          if (!filters.balanceStatus.includes(status)) return false;
        }
        return true;
      })
      .sort((a, b) =>
        filters.sortBy === 'balance' ? b.balance - a.balance : a.name.localeCompare(b.name)
      );
  }, [data, filters]);

  const totalBalance  = useMemo(() => filteredData.reduce((s, b) => s + b.balance, 0), [filteredData]);
  const positiveTotal = useMemo(() => filteredData.filter(b => b.balance > 0).reduce((s, b) => s + b.balance, 0), [filteredData]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  const handleExportCSV = () => {
    const headers = ['Bank Name', 'Account Number', 'Balance', 'Status'];
    const rows = filteredData.map(b => [
      `"${b.name}"`, `"${b.accountNumber}"`, b.balance,
      b.balance > 0 ? 'Positive' : b.balance < 0 ? 'Negative' : 'Zero'
    ].join(','));
    const csv  = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `bank-balance-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Bank balance report exported');
  };

  const hasActiveFilters = filters.banks.length > 0 || filters.balanceStatus.length > 0 || filters.search !== '';

  const clearAll = () => setFilters({ banks: [], balanceStatus: [], sortBy: 'balance', search: '' });

  if (isLoading) return (
    <div className="flex items-center justify-center py-20 gap-3">
      <Loader2 size={26} className="text-[#4f46e5] animate-spin" />
      <span className="text-gray-500 text-sm">Loading bank data…</span>
    </div>
  );

  return (
    <div className="p-8 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#4f46e5] rounded-lg flex items-center justify-center">
            <Building2 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bank Balance Report</h1>
            <p className="text-sm text-gray-600">All bank accounts and their current balances</p>
          </div>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Banks</p>
              <p className="text-3xl font-bold text-gray-900">{filteredData.length}</p>
            </div>
            <div className="w-12 h-12 bg-[#4f46e5]/10 rounded-lg flex items-center justify-center">
              <Building2 size={24} className="text-[#4f46e5]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Balance</p>
              <p className={`text-3xl font-bold ${totalBalance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                {formatCurrency(totalBalance)}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#10b981]/10 rounded-lg flex items-center justify-center">
              <DollarSign size={24} className="text-[#10b981]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Positive Balance</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(positiveTotal)}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
              <TrendingUp size={24} className="text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-[#4f46e5]" />
          <h2 className="font-semibold text-gray-900">Filters</h2>
          {hasActiveFilters && (
            <button onClick={clearAll} className="ml-auto text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1">
              <X size={13} /> Clear all
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
              <Building2 size={13} /> Search
            </label>
            <input
              type="text"
              placeholder="Search by bank name…"
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
            />
          </div>

          {/* Bank multi-select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
              <Building2 size={13} /> Bank
            </label>
            <MultiSelectDropdown
              options={bankNameOptions}
              selected={filters.banks}
              onChange={v => setFilters({ ...filters, banks: v })}
              placeholder="All Banks"
            />
          </div>

          {/* Balance Status multi-select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
              <DollarSign size={13} /> Balance Status
            </label>
            <MultiSelectDropdown
              options={balanceStatusOptions}
              selected={filters.balanceStatus}
              onChange={v => setFilters({ ...filters, balanceStatus: v })}
              placeholder="All Statuses"
            />
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={e => setFilters({ ...filters, sortBy: e.target.value as 'balance' | 'name' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
            >
              <option value="balance">Balance (High → Low)</option>
              <option value="name">Name (A → Z)</option>
            </select>
          </div>
        </div>

        {/* Active filter pills */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-500">Active:</span>
            {filters.search && (
              <Pill
                label={`"${filters.search}"`}
                onRemove={() => setFilters({ ...filters, search: '' })}
                colorClass="bg-[#4f46e5]/10 text-[#4f46e5]"
              />
            )}
            {filters.banks.map(b => (
              <Pill
                key={b} label={b}
                onRemove={() => setFilters({ ...filters, banks: filters.banks.filter(x => x !== b) })}
                colorClass="bg-[#4f46e5]/10 text-[#4f46e5]"
              />
            ))}
            {filters.balanceStatus.map(s => (
              <Pill
                key={s} label={s}
                onRemove={() => setFilters({ ...filters, balanceStatus: filters.balanceStatus.filter(x => x !== s) })}
                colorClass={
                  s === 'Positive' ? 'bg-green-100 text-green-700' :
                  s === 'Negative' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Bank Accounts</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Showing {filteredData.length} of {data.length} banks
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account No.</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Transaction</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                    <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No banks found</p>
                    <p className="text-sm mt-1">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((bank, index) => (
                  <tr key={bank.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <Building2 size={16} className="text-gray-400" />
                        {bank.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-600">{bank.accountNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                        bank.balance > 0  ? 'bg-green-100 text-green-800' :
                        bank.balance < 0  ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {formatCurrency(bank.balance)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {bank.transactions[0]
                        ? new Date(bank.transactions[0].date).toLocaleDateString('en-AE', { year: 'numeric', month: 'short', day: 'numeric' })
                        : <span className="text-gray-400 italic">No transactions</span>
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => setViewBank(bank)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#4f46e5] bg-[#4f46e5]/10 rounded-lg hover:bg-[#4f46e5]/20 transition-colors"
                      >
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer total */}
        {filteredData.length > 0 && (
          <div className="bg-gray-50 border-t-2 border-[#4f46e5] px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign size={18} className="text-[#4f46e5]" />
                <span className="font-semibold text-gray-900">Total Balance</span>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">{filteredData.length} bank{filteredData.length !== 1 ? 's' : ''}</p>
                <p className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-[#4f46e5]' : 'text-red-600'}`}>
                  {formatCurrency(totalBalance)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {viewBank && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#4f46e5]/10 rounded-lg flex items-center justify-center">
                  <Building2 size={18} className="text-[#4f46e5]" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{viewBank.name}</h3>
              </div>
              <button onClick={() => setViewBank(null)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <XCircle size={22} className="text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Account Number</p>
                  <p className="font-mono text-sm font-medium text-gray-900">{viewBank.accountNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Status</p>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                    viewBank.balance > 0 ? 'bg-green-100 text-green-800' :
                    viewBank.balance < 0 ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {viewBank.balance > 0 ? 'Positive' : viewBank.balance < 0 ? 'Negative' : 'Zero'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Balance</p>
                <p className={`text-3xl font-bold ${viewBank.balance >= 0 ? 'text-[#4f46e5]' : 'text-red-600'}`}>
                  {formatCurrency(viewBank.balance)}
                </p>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Recent Transactions</p>
                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {viewBank.transactions.length === 0
                    ? <p className="text-sm text-gray-400 italic">No transactions</p>
                    : viewBank.transactions.slice(0, 5).map((tx: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-sm p-2.5 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString('en-AE', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                          <p className="text-gray-800 font-medium">{tx.description || tx.note || '—'}</p>
                        </div>
                        <span className={`font-semibold text-sm ${(tx.amount || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(tx.amount || 0)}
                        </span>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}