import { useState, useMemo } from 'react';
import { Invoice } from '../App';
import { Calendar, MapPin, User, Filter, Download, UserPlus, BarChart3 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type ReferralReportProps = {
  invoices: Invoice[];
};

export function ReferralReport({ invoices }: ReferralReportProps) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedReferralPerson, setSelectedReferralPerson] = useState('');
  const [showVisualization, setShowVisualization] = useState(false);

  // Get unique values for filters
  const cities = useMemo(() => {
    const citySet = new Set<string>();
    invoices.forEach(inv => {
      if (inv.customerCity && inv.referFrom) citySet.add(inv.customerCity);
    });
    return Array.from(citySet).sort();
  }, [invoices]);

  const referralPersons = useMemo(() => {
    const referralSet = new Set<string>();
    invoices.forEach(inv => {
      if (inv.referFrom && inv.referFrom.trim() !== '') referralSet.add(inv.referFrom);
    });
    return Array.from(referralSet).sort();
  }, [invoices]);

  // Prepare referral data from invoices (only those with referFrom)
  const referralData = useMemo(() => {
    return invoices
      .filter(invoice => {
        // Referral entry only if referFrom is filled (new rule)
        return invoice.referFrom && invoice.referFrom.trim() !== '';
      })
      .flatMap(invoice => {
        return invoice.products.map(product => {
          const salePriceBeforeReferral = product.price;
          const referralShare = product.price * 0.5; // 50% referral share
          const salePriceAfterReferral = product.price * 0.5; // Remaining 50%
          const salesperson = invoice.referFrom || ''; // Salesperson is Refer From
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

  // Prepare visualization data
  const visualizationData = useMemo(() => {
    // Referral trend over time
    const referralByDate = filteredData.reduce((acc, item) => {
      if (!acc[item.date]) acc[item.date] = 0;
      acc[item.date] += item.referralShare;
      return acc;
    }, {} as Record<string, number>);
    const referralTrend = Object.entries(referralByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({ date, amount }));

    // Referrals by city
    const referralByCity = filteredData.reduce((acc, item) => {
      if (!acc[item.city]) acc[item.city] = 0;
      acc[item.city] += item.referralShare;
      return acc;
    }, {} as Record<string, number>);
    const cityReferrals = Object.entries(referralByCity)
      .map(([city, amount]) => ({ city, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Referrals by salesperson
    const referralBySalesperson = filteredData.reduce((acc, item) => {
      if (!acc[item.salesperson]) acc[item.salesperson] = 0;
      acc[item.salesperson] += item.referralShare;
      return acc;
    }, {} as Record<string, number>);
    const salespersonReferrals = Object.entries(referralBySalesperson)
      .map(([salesperson, amount]) => ({ salesperson, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Referrals by product
    const referralByProduct = filteredData.reduce((acc, item) => {
      const key = `${item.product} / ${item.brand}`;
      if (!acc[key]) acc[key] = 0;
      acc[key] += item.referralShare;
      return acc;
    }, {} as Record<string, number>);
    const productReferrals = Object.entries(referralByProduct)
      .map(([product, amount]) => ({ product, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10); // Top 10 products

    // Referral count by salesperson
    const referralCountBySalesperson = filteredData.reduce((acc, item) => {
      if (!acc[item.salesperson]) acc[item.salesperson] = 0;
      acc[item.salesperson] += 1;
      return acc;
    }, {} as Record<string, number>);
    const referralCountData = Object.entries(referralCountBySalesperson)
      .map(([salesperson, count]) => ({ salesperson, count }));

    // Referral amount distribution by salesperson
    const referralAmountData = Object.entries(referralBySalesperson)
      .map(([salesperson, amount]) => ({ salesperson, amount }));

    return {
      referralTrend,
      cityReferrals,
      salespersonReferrals,
      productReferrals,
      referralCountData,
      referralAmountData
    };
  }, [filteredData]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Referral Report</h2>
            <p className="text-sm text-gray-600 mt-1">Sales counted by Salesperson (Refer From) • Entries generated when Refer From is filled • Display only (no commission payout logic)</p>
          </div>
          <button
            onClick={() => setShowVisualization(!showVisualization)}
            className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-lg hover:bg-blue-200 flex items-center gap-2"
          >
            <BarChart3 size={16} />
            {showVisualization ? 'Hide' : 'Show'} Visualization
          </button>
        </div>
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

      {/* Visualization Section */}
      {showVisualization && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Referral Analytics</h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Referral Trend Over Time */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Referral Trend Over Time</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={visualizationData.referralTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`Rs ${Number(value).toLocaleString()}`, 'Referral Amount']} />
                  <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Referrals by City */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Referrals by City</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={visualizationData.cityReferrals}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="city" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`Rs ${Number(value).toLocaleString()}`, 'Referral Amount']} />
                  <Bar dataKey="amount" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Referrals by Salesperson */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Referrals by Salesperson</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={visualizationData.salespersonReferrals}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="salesperson" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`Rs ${Number(value).toLocaleString()}`, 'Referral Amount']} />
                  <Bar dataKey="amount" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Referral Products */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Top Referral Products</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={visualizationData.productReferrals} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="product" type="category" width={100} />
                  <Tooltip formatter={(value) => [`Rs ${Number(value).toLocaleString()}`, 'Referral Amount']} />
                  <Bar dataKey="amount" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Referral Count by Salesperson */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Referral Count by Salesperson</h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={visualizationData.referralCountData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {visualizationData.referralCountData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b', '#ef4444'][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Referral Count']} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Referral Amount Distribution */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Referral Amount Distribution</h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={visualizationData.referralAmountData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ salesperson, amount }) => `${salesperson}: Rs ${amount.toLocaleString()}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {visualizationData.referralAmountData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`Rs ${Number(value).toLocaleString()}`, 'Referral Amount']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

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