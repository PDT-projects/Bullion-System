import { useState, useMemo } from 'react';
import { Invoice } from '../App';
import { Calendar, MapPin, User, Filter, Download, UserPlus } from 'lucide-react';

type ReferralReportProps = {
  invoices: Invoice[];
};

export function ReferralReport({ invoices }: ReferralReportProps) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedReferralPerson, setSelectedReferralPerson] = useState('');

  // Get unique values for filters
  const cities = useMemo(() => {
    const citySet = new Set<string>();
    invoices.forEach(inv => {
      if (inv.customerCity && inv.clientDealBy) citySet.add(inv.customerCity);
    });
    return Array.from(citySet).sort();
  }, [invoices]);

  const referralPersons = useMemo(() => {
    const referralSet = new Set<string>();
    invoices.forEach(inv => {
      if (inv.clientDealBy && inv.clientDealBy.trim() !== '') referralSet.add(inv.clientDealBy);
    });
    return Array.from(referralSet).sort();
  }, [invoices]);

  // Prepare referral data from invoices (only those with clientDealBy)
  const referralData = useMemo(() => {
    return invoices
      .filter(invoice => {
        // Referral entry only if clientDealBy is filled (new rule)
        return invoice.clientDealBy && invoice.clientDealBy.trim() !== '';
      })
      .flatMap(invoice => {
        return invoice.products.map(product => {
          const salePriceBeforeReferral = product.price;
          const referralShare = product.price * 0.5; // 50% referral share
          const salePriceAfterReferral = product.price * 0.5; // Remaining 50%
          const salesperson = invoice.clientDealBy || ''; // Salesperson is Client Deal By
          const referBy = invoice.salesperson || ''; // Refer By is the salesperson field

          return {
            id: `${invoice.id}-${product.id}`,
            date: invoice.date,
            clientName: invoice.customerName,
            city: invoice.customerCity,
            product: product.productName,
            brand: product.brandName,
            salePriceBeforeReferral,
            referralShare,
            salePriceAfterReferral,
            salesperson,
            referBy,
            invoiceNumber: invoice.invoiceNumber
          };
        });
      });
  }, [invoices]);

  // Filter referral data
  const filteredData = useMemo(() => {
    return referralData.filter(item => {
      // Date filter
      if (dateFrom && item.date < dateFrom) return false;
      if (dateTo && item.date > dateTo) return false;
      
      // City filter
      if (selectedCity && item.city !== selectedCity) return false;
      
      // Salesperson filter (now filtering by clientDealBy / salesperson)
      if (selectedReferralPerson && item.salesperson !== selectedReferralPerson) return false;
      
      return true;
    });
  }, [referralData, dateFrom, dateTo, selectedCity, selectedReferralPerson]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredData.reduce((acc, item) => ({
      sellPrice: acc.sellPrice + item.salePriceBeforeReferral,
      referralAmount: acc.referralAmount + item.referralShare
    }), { sellPrice: 0, referralAmount: 0 });
  }, [filteredData]);

  const handleExportCSV = () => {
    const headers = ['Date', 'Client Name', 'City', 'Product / Brand', 'Sale Price (Before Referral)', 'Referral Share (50%)', 'Sale Price (After Referral)', 'Salesperson', 'Refer By'];
    const rows = filteredData.map(item => [
      item.date,
      item.clientName,
      item.city,
      `${item.product} / ${item.brand}`,
      item.salePriceBeforeReferral,
      item.referralShare,
      item.salePriceAfterReferral,
      item.salesperson,
      item.referBy
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `referral-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleClearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSelectedCity('');
    setSelectedReferralPerson('');
  };

  // Group by salesperson for summary
  const referralSummary = useMemo(() => {
    const summary = new Map<string, { count: number; totalSales: number; totalReferral: number }>();
    
    filteredData.forEach(item => {
      const existing = summary.get(item.salesperson) || { count: 0, totalSales: 0, totalReferral: 0 };
      summary.set(item.salesperson, {
        count: existing.count + 1,
        totalSales: existing.totalSales + item.salePriceBeforeReferral,
        totalReferral: existing.totalReferral + item.referralShare
      });
    });
    
    return Array.from(summary.entries()).map(([person, data]) => ({
      person,
      ...data
    }));
  }, [filteredData]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Referral Report</h2>
        <p className="text-sm text-gray-600 mt-1">Sales counted by Salesperson (Client Deal By) • Entries generated when Client Deal By is filled • Display only (no commission payout logic)</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar size={14} className="inline mr-1" />
              Date From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar size={14} className="inline mr-1" />
              Date To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin size={14} className="inline mr-1" />
              City
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Cities</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Salesperson Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <UserPlus size={14} className="inline mr-1" />
              Salesperson
            </label>
            <select
              value={selectedReferralPerson}
              onChange={(e) => setSelectedReferralPerson(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Salespersons</option>
              {referralPersons.map(rp => (
                <option key={rp} value={rp}>{rp}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Clear Filters
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 text-sm font-medium text-white bg-[#10b981] rounded-lg hover:bg-[#059669] flex items-center gap-2"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary by Salesperson */}
      {referralSummary.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Summary by Salesperson (Client Deal By)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {referralSummary.map((item) => (
              <div key={item.person} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <User size={16} className="text-[#4f46e5]" />
                  <p className="font-medium text-gray-900">{item.person}</p>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">Referrals: <span className="font-medium text-gray-900">{item.count}</span></p>
                  <p className="text-gray-600">Total Sales: <span className="font-medium text-[#4f46e5]">Rs {item.totalSales.toLocaleString()}</span></p>
                  <p className="text-gray-600">Referral Amount: <span className="font-medium text-[#10b981]">Rs {item.totalReferral.toLocaleString()}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Referrals</p>
          <p className="text-2xl font-bold text-gray-900">{filteredData.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Sell Price</p>
          <p className="text-2xl font-bold text-[#4f46e5]">Rs {totals.sellPrice.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Referral Amount</p>
          <p className="text-2xl font-bold text-[#10b981]">Rs {totals.referralAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* Referral Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Client Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">City</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Product / Brand</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Sale Price (Before Referral)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Referral Share (50%)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Sale Price (After Referral)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Salesperson</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Refer By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    {referralData.length === 0 
                      ? 'No referral data available. Create invoices with referral information to see reports.'
                      : 'No data matches the selected filters.'}
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{item.date}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.clientName}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.city}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.product} / {item.brand}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">Rs {item.salePriceBeforeReferral.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-[#10b981] text-right font-semibold">Rs {item.referralShare.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">Rs {item.salePriceAfterReferral.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        <User size={12} />
                        {item.salesperson}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {item.referBy && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                          <User size={12} />
                          {item.referBy}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredData.length > 0 && (
              <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-sm font-bold text-gray-900">TOTALS</td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">Rs {totals.sellPrice.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm font-bold text-[#10b981] text-right">Rs {totals.referralAmount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">Rs {totals.referralAmount.toLocaleString()}</td>
                  <td></td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Showing {filteredData.length} of {referralData.length} referral entries
      </div>
    </div>
  );
}