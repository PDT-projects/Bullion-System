import { useState, useMemo, useRef, useEffect } from 'react';
import { Transaction } from '../../App';
import { Filter, Calendar, MapPin, FileText, DollarSign, Download, Eye, X, ChevronDown } from 'lucide-react';

type TransactionHistoryReportProps = {
  transactions: Transaction[];
};

const companyOptions = [
  'Pakistan Detectors Technologies: Dubai',
  'Pakistan Detectors Technologies: Saudi Arabia',
  'Pakistan Detectors Technologies: Chad',
  'Pakistan Detectors Technologies: Abu Dhabi',
  'Pakistan Detectors Technologies: Sharjah',
  'Pakistan Detectors Technologies: Oman',
  'Pakistan Detectors Technologies: Qatar',
  'Pakistan Detectors Technologies: Kuwait',
];

// All possible categories from Expenses, Bills, Salary, and Other categories
const allCategories = [
  // Expense categories
  'Office Rent', 'Stationery', 'Office Supplies', 'Furniture',
  'Kitchen Expense', 'Grocery', 'Petrol', 'Courier', 'Delivery', 'Medical', 'Repairs', 'Maintenance',
  // Bill categories
  'LESCO', 'IESCO', 'K-Electric', 'Generator Fuel',
  'PTCL', 'StormFiber', 'Nayatel',
  'Sui Gas', 'Water Board', 'Sanitation',
  // Salary
  'Salary',
  // Other categories (from transaction types)
  'Electricity', 'Internet', 'Utilities'
];

const transactionTypeOptions = [
  'Expenses',
  'Bills',
  'Salary',
  'Other Outflow',
  'Cash Inflow',
  'Cash Outflow',
  'Loans & Advances'
];

// Multi-select dropdown component
function MultiSelectDropdown({
  options,
  selected,
  onChange,
  placeholder,
  labelFn
}: {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
  labelFn?: (value: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const selectAll = () => onChange([...options]);
  const clearAll = () => onChange([]);

  const label =
    selected.length === 0
      ? placeholder
      : selected.length === options.length
      ? placeholder.replace('All ', 'All ')  // keep as-is
      : selected.length === 1
      ? (labelFn ? labelFn(selected[0]) : selected[0])
      : `${selected.length} selected`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent bg-white text-left flex items-center justify-between text-sm"
      >
        <span className={selected.length === 0 ? 'text-gray-400' : 'text-gray-900'}>
          {label}
        </span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-hidden flex flex-col">
          {/* Select / Clear all */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
            <button
              type="button"
              onClick={selectAll}
              className="text-xs text-[#4f46e5] font-medium hover:underline"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-gray-500 hover:underline"
            >
              Clear
            </button>
          </div>

          <div className="overflow-y-auto flex-1">
            {options.map(option => (
              <label
                key={option}
                className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => toggleOption(option)}
                  className="accent-[#4f46e5] w-4 h-4 rounded"
                />
                <span className="text-gray-800">{labelFn ? labelFn(option) : option}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function TransactionHistoryReport({ transactions }: TransactionHistoryReportProps) {
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [allTime, setAllTime] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: firstDayOfMonth,
    dateTo: today,
    categories: [] as string[],      // empty = all
    transactionTypes: [] as string[], // empty = all
    cities: [] as string[]            // empty = all
  });

  const [viewTransaction, setViewTransaction] = useState<Transaction | null>(null);

  // Filter and process transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // Date filter (skip if All Time)
      if (!allTime) {
        const transactionDate = new Date(transaction.date);
        const fromDate = new Date(filters.dateFrom);
        const toDate = new Date(filters.dateTo);
        if (transactionDate < fromDate || transactionDate > toDate) return false;
      }

      // Multi-category filter (empty selection = show all)
      if (filters.categories.length > 0) {
        if (!filters.categories.includes(transaction.subCategory || '')) return false;
      }

      // Transaction type filter
      if (filters.transactionTypes.length > 0) {
        if (!filters.transactionTypes.includes(transaction.mainCategory)) return false;
      }

      // City/Office filter
      if (filters.cities.length > 0) {
        if (!filters.cities.includes(transaction.company)) return false;
      }

      return true;
    });
  }, [transactions, filters, allTime]);

  // Calculate totals
  const totalAmount = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [filteredTransactions]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Extract city name from company string
  const getCityFromCompany = (company: string) => {
    if (company.includes('Dubai'))        return 'Dubai';
    if (company.includes('Saudi Arabia')) return 'Saudi Arabia';
    if (company.includes('Chad'))          return 'Chad';
    if (company.includes('Abu Dhabi'))    return 'Abu Dhabi';
    if (company.includes('Sharjah'))      return 'Sharjah';
    if (company.includes('Oman'))         return 'Oman';
    if (company.includes('Qatar'))        return 'Qatar';
    if (company.includes('Kuwait'))       return 'Kuwait';
    if (company.includes('Bullion')) return 'Bullion RND/SITE';
    return company;
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Category', 'Description', 'Amount', 'City', 'Payment Mode', 'Type'];
    const rows = filteredTransactions.map(t => [
      t.date,
      t.subCategory || '',
      t.note || '',
      t.amount.toString(),
      getCityFromCompany(t.company),
      t.mode || 'Cash',
      t.mainCategory
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = allTime
      ? `transaction-history-all-time.csv`
      : `transaction-history-${filters.dateFrom}-to-${filters.dateTo}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#4f46e5] rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Transaction History Report</h1>
              <p className="text-sm text-gray-600">View and analyze all financial transactions</p>
            </div>
          </div>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors flex items-center gap-2"
          >
            <Download size={16} />
            Export to CSV
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-[#4f46e5]" />
          <h2 className="font-semibold text-gray-900">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
              <Calendar size={14} />
              Date From
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              disabled={allTime}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
              <Calendar size={14} />
              Date To
            </label>
            <input
              type="date"
              value={filters.dateTo}
              disabled={allTime}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
            />
            {/* All Time toggle lives below dateTo */}
            <button
              type="button"
              onClick={() => setAllTime(v => !v)}
              className={`mt-1.5 w-full text-xs font-medium py-1 rounded-md border transition-colors ${
                allTime
                  ? 'bg-[#4f46e5] text-white border-[#4f46e5]'
                  : 'bg-white text-[#4f46e5] border-[#4f46e5] hover:bg-[#4f46e5]/10'
              }`}
            >
              {allTime ? '✓ All Time' : 'Show All Time'}
            </button>
          </div>

          {/* Category (multi-select) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
              <FileText size={14} />
              Category
            </label>
            <MultiSelectDropdown
              options={allCategories}
              selected={filters.categories}
              onChange={(cats) => setFilters({ ...filters, categories: cats })}
              placeholder="All Categories"
            />
          </div>

          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
              <FileText size={14} />
              Transaction Type
            </label>
            <MultiSelectDropdown
              options={transactionTypeOptions}
              selected={filters.transactionTypes}
              onChange={(types) => setFilters({ ...filters, transactionTypes: types })}
              placeholder="All Types"
            />
          </div>

          {/* City/Office */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
              <MapPin size={14} />
              City/Office
            </label>
            <MultiSelectDropdown
              options={companyOptions}
              selected={filters.cities}
              onChange={(cities) => setFilters({ ...filters, cities: cities })}
              placeholder="All Offices"
              labelFn={getCityFromCompany}
            />
          </div>
        </div>

        {/* Active Filters Summary */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Active Filters:</span>
            <span className="px-2 py-1 bg-[#4f46e5]/10 text-[#4f46e5] rounded">
              {allTime ? 'All Time' : `${filters.dateFrom} to ${filters.dateTo}`}
            </span>
            {filters.categories.length > 0 && filters.categories.map(cat => (
              <span key={cat} className="px-2 py-1 bg-[#10b981]/10 text-[#10b981] rounded flex items-center gap-1">
                {cat}
                <button
                  type="button"
                  onClick={() => setFilters({ ...filters, categories: filters.categories.filter(c => c !== cat) })}
                  className="hover:text-[#059669]"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            {filters.transactionTypes.length > 0 && filters.transactionTypes.map(type => (
              <span key={type} className="px-2 py-1 bg-[#ef4444]/10 text-[#ef4444] rounded flex items-center gap-1">
                {type}
                <button type="button" onClick={() => setFilters({ ...filters, transactionTypes: filters.transactionTypes.filter(t => t !== type) })} className="hover:text-[#dc2626]"><X size={12} /></button>
              </span>
            ))}
            {filters.cities.length > 0 && filters.cities.map(city => (
              <span key={city} className="px-2 py-1 bg-gray-100 text-gray-700 rounded flex items-center gap-1">
                {getCityFromCompany(city)}
                <button type="button" onClick={() => setFilters({ ...filters, cities: filters.cities.filter(c => c !== city) })} className="hover:text-gray-900"><X size={12} /></button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
              <p className="text-3xl font-bold text-gray-900">{filteredTransactions.length}</p>
            </div>
            <div className="w-12 h-12 bg-[#4f46e5]/10 rounded-lg flex items-center justify-center">
              <FileText size={24} className="text-[#4f46e5]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="w-12 h-12 bg-[#10b981]/10 rounded-lg flex items-center justify-center">
              <DollarSign size={24} className="text-[#10b981]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Average Amount</p>
              <p className="text-3xl font-bold text-gray-900">
                {filteredTransactions.length > 0
                  ? formatCurrency(totalAmount / filteredTransactions.length)
                  : formatCurrency(0)
                }
              </p>
            </div>
            <div className="w-12 h-12 bg-[#ef4444]/10 rounded-lg flex items-center justify-center">
              <DollarSign size={24} className="text-[#ef4444]" />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Mode</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No transactions found</p>
                    <p className="text-sm mt-1">Try adjusting your filters to see more results</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction, index) => (
                  <tr
                    key={transaction.id}
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 cursor-pointer transition-colors`}
                    onClick={() => setViewTransaction(transaction)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.date).toLocaleDateString('en-AE', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.mainCategory === 'Cash Inflow' ? 'bg-emerald-100 text-emerald-800' :
                        transaction.mainCategory === 'Cash Outflow' ? 'bg-red-100 text-red-800' :
                        transaction.mainCategory === 'Bills' ? 'bg-yellow-100 text-yellow-800' :
                        transaction.mainCategory === 'Salary' ? 'bg-green-100 text-green-800' :
                        transaction.mainCategory === 'Loans & Advances' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {transaction.mainCategory}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.subCategory || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {transaction.note || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getCityFromCompany(transaction.company)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.mode === 'Cash' ? 'bg-green-100 text-green-800' :
                        transaction.mode === 'Bank' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {transaction.mode || 'Cash'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-right text-gray-900 flex items-center justify-between">
                      <span>{formatCurrency(transaction.amount)}</span>
                      <Eye size={16} className="text-gray-400 ml-2" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Total Summary Footer */}
        {filteredTransactions.length > 0 && (
          <div className="bg-gray-50 border-t-2 border-[#4f46e5] px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign size={20} className="text-[#4f46e5]" />
                <span className="font-semibold text-gray-900">Total Summary</span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-[#4f46e5]">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Additional Stats */}
      {filteredTransactions.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-600 mb-1">Cash Payments</p>
            <p className="text-xl font-bold text-gray-900">
              {filteredTransactions.filter(t => t.mode === 'Cash').length}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatCurrency(filteredTransactions.filter(t => t.mode === 'Cash').reduce((sum, t) => sum + t.amount, 0))}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-600 mb-1">Bank Payments</p>
            <p className="text-xl font-bold text-gray-900">
              {filteredTransactions.filter(t => t.mode === 'Bank').length}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatCurrency(filteredTransactions.filter(t => t.mode === 'Bank').reduce((sum, t) => sum + t.amount, 0))}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-600 mb-1">Cheque Payments</p>
            <p className="text-xl font-bold text-gray-900">
              {filteredTransactions.filter(t => t.mode === 'Cheque').length}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatCurrency(filteredTransactions.filter(t => t.mode === 'Cheque').reduce((sum, t) => sum + t.amount, 0))}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-600 mb-1">Partial Payments</p>
            <p className="text-xl font-bold text-gray-900">
              {filteredTransactions.filter(t => t.paymentStatus === 'Partial').length}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Remaining: {formatCurrency(filteredTransactions.filter(t => t.paymentStatus === 'Partial').reduce((sum, t) => sum + (t.remainingAmount || 0), 0))}
            </p>
          </div>
        </div>
      )}

      {/* View Transaction Details Modal */}
      {viewTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Transaction Details</h3>
              <button onClick={() => setViewTransaction(null)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">{new Date(viewTransaction.date).toLocaleDateString('en-AE')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Office</p>
                  <p className="font-medium">{viewTransaction.company}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                    viewTransaction.mainCategory === 'Cash Inflow' ? 'bg-green-100 text-green-800' :
                    viewTransaction.mainCategory === 'Cash Outflow' ? 'bg-red-100 text-red-800' :
                    viewTransaction.mainCategory === 'Bills' ? 'bg-yellow-100 text-yellow-800' :
                    viewTransaction.mainCategory === 'Salary' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {viewTransaction.mainCategory}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Category</p>
                  <p className="font-medium">{viewTransaction.subCategory || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="font-bold text-lg">{formatCurrency(viewTransaction.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Mode</p>
                  <p className="font-medium">{viewTransaction.mode || 'Cash'}</p>
                </div>
                {viewTransaction.bankName && (
                  <div>
                    <p className="text-sm text-gray-600">Bank</p>
                    <p className="font-medium">{viewTransaction.bankName}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Payment Status</p>
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                    viewTransaction.paymentStatus === 'Full' ? 'bg-green-100 text-green-800' :
                    viewTransaction.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {viewTransaction.paymentStatus || 'Full'}
                  </span>
                </div>
                {viewTransaction.paidBy && (
                  <div>
                    <p className="text-sm text-gray-600">Paid By</p>
                    <p className="font-medium">{viewTransaction.paidBy}</p>
                  </div>
                )}
                {viewTransaction.paidTo && (
                  <div>
                    <p className="text-sm text-gray-600">Paid To</p>
                    <p className="font-medium">{viewTransaction.paidTo}</p>
                  </div>
                )}
                {viewTransaction.note && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Note</p>
                    <p className="font-medium">{viewTransaction.note}</p>
                  </div>
                )}
                {viewTransaction.imageUrl && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600 mb-2">Receipt Image</p>
                    <img
                      src={viewTransaction.imageUrl}
                      alt="Receipt"
                      className="w-full max-w-md rounded-lg border border-gray-200"
                    />
                  </div>
                )}
                {viewTransaction.paymentStatus === 'Partial' && viewTransaction.remainingAmount && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Remaining Amount</p>
                    <p className="font-medium text-orange-600">{formatCurrency(viewTransaction.remainingAmount)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}