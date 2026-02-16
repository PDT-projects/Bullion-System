import { ArrowLeft, Download, FileSpreadsheet, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type ProfitLossReportProps = {
  onBack: () => void;
};

export function ProfitLossReport({ onBack }: ProfitLossReportProps) {
  // Dummy data as specified
  const data = {
    revenue: {
      productSales: 1500000,
      serviceIncome: 300000,
      totalRevenue: 1800000
    },
    cogs: {
      openingStock: 500000,
      purchases: 700000,
      closingStock: 400000,
      totalCOGS: 800000
    },
    grossProfit: 1000000,
    expenses: {
      salaries: 200000,
      rent: 80000,
      utilities: 40000,
      marketing: 30000,
      misc: 20000,
      totalExpenses: 370000
    },
    netProfit: 630000
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleExportCSV = () => {
    const headers = ['Category', 'Item', 'Amount'];
    const rows = [
      ['Revenue', 'Product Sales', data.revenue.productSales.toString()],
      ['Revenue', 'Service Income', data.revenue.serviceIncome.toString()],
      ['Revenue', 'Total Revenue', data.revenue.totalRevenue.toString()],
      ['COGS', 'Opening Stock', data.cogs.openingStock.toString()],
      ['COGS', 'Purchases', data.cogs.purchases.toString()],
      ['COGS', 'Closing Stock', data.cogs.closingStock.toString()],
      ['COGS', 'Total COGS', data.cogs.totalCOGS.toString()],
      ['Profit', 'Gross Profit', data.grossProfit.toString()],
      ['Expenses', 'Salaries', data.expenses.salaries.toString()],
      ['Expenses', 'Rent', data.expenses.rent.toString()],
      ['Expenses', 'Utilities', data.expenses.utilities.toString()],
      ['Expenses', 'Marketing', data.expenses.marketing.toString()],
      ['Expenses', 'Misc', data.expenses.misc.toString()],
      ['Expenses', 'Total Expenses', data.expenses.totalExpenses.toString()],
      ['Profit', 'Net Profit', data.netProfit.toString()]
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profit-loss-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('profit-loss-report');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`profit-loss-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profit & Loss Report</h1>
          <p className="text-gray-600 mt-1">Financial performance overview for the period</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
          >
            <FileSpreadsheet size={16} />
            Export CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
          >
            <FileText size={16} />
            Export PDF
          </button>
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Reports Hub
          </button>
        </div>
      </div>

      <div id="profit-loss-report" className="space-y-6">
        {/* Revenue Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Revenue</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-700">Product Sales</span>
              <span className="font-medium text-gray-900">{formatCurrency(data.revenue.productSales)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-700">Service Income</span>
              <span className="font-medium text-gray-900">{formatCurrency(data.revenue.serviceIncome)}</span>
            </div>
            <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-3">
              <span className="font-semibold text-gray-900">Total Revenue</span>
              <span className="font-bold text-lg text-gray-900">{formatCurrency(data.revenue.totalRevenue)}</span>
            </div>
          </div>
        </div>

        {/* Cost of Goods Sold Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Cost of Goods Sold (COGS)</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-700">Opening Stock</span>
              <span className="font-medium text-gray-900">{formatCurrency(data.cogs.openingStock)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-700">Purchases</span>
              <span className="font-medium text-gray-900">{formatCurrency(data.cogs.purchases)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-700">Closing Stock</span>
              <span className="font-medium text-gray-900">{formatCurrency(data.cogs.closingStock)}</span>
            </div>
            <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-3">
              <span className="font-semibold text-gray-900">Total COGS</span>
              <span className="font-bold text-lg text-gray-900">{formatCurrency(data.cogs.totalCOGS)}</span>
            </div>
          </div>
        </div>

        {/* Gross Profit Section */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Gross Profit</h2>
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Revenue - COGS</span>
            <span className="font-bold text-2xl text-green-600">{formatCurrency(data.grossProfit)}</span>
          </div>
        </div>

        {/* Expenses Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Expenses</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-700">Salaries</span>
              <span className="font-medium text-gray-900">{formatCurrency(data.expenses.salaries)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-700">Rent</span>
              <span className="font-medium text-gray-900">{formatCurrency(data.expenses.rent)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-700">Utilities</span>
              <span className="font-medium text-gray-900">{formatCurrency(data.expenses.utilities)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-700">Marketing</span>
              <span className="font-medium text-gray-900">{formatCurrency(data.expenses.marketing)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-700">Misc</span>
              <span className="font-medium text-gray-900">{formatCurrency(data.expenses.misc)}</span>
            </div>
            <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-3">
              <span className="font-semibold text-gray-900">Total Expenses</span>
              <span className="font-bold text-lg text-gray-900">{formatCurrency(data.expenses.totalExpenses)}</span>
            </div>
          </div>
        </div>

        {/* Net Profit Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Net Profit / Loss</h2>
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Gross Profit - Total Expenses</span>
            <span className="font-bold text-3xl text-blue-600">{formatCurrency(data.netProfit)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
