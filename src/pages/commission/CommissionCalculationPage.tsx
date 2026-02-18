import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calculator, 
  Check, 
  Edit, 
  X,
  MapPin,
  Calendar,
  User,
  DollarSign,
  Percent,
  TrendingUp,
  Save
} from 'lucide-react';
import { toast } from 'sonner';

type Commission = {
  id: string;
  salesperson: string;
  salespersonName: string;
  city: string;
  month: string;
  totalSales: number;
  appliedSlabFrom: number;
  appliedSlabTo: number;
  commissionPercentage: number;
  calculatedCommissionAmount: number;
  overriddenCommissionPercentage?: number;
  overriddenCommissionAmount?: number;
  status: 'Calculated' | 'Adjusted' | 'Confirmed';
  calculatedBy: string;
  confirmedBy?: string;
  calculatedAt: string;
  confirmedAt?: string;
  isLocked: boolean;
};

type CommissionSlab = {
  id: string;
  salesperson: string;
  city: string;
  fromAmount: number;
  toAmount: number;
  commissionPercentage: number;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  date: string;
  customerCity: string;
  totalAmount: number;
  status: 'Paid' | 'Unpaid';
  salesperson?: string;
};

const cities = ['Karachi', 'Lahore', 'Islamabad', 'Bullion RND/SITE'];

export function CommissionCalculationPage() {
  const navigate = useNavigate();
  const { commissions, setCommissions, commissionSlabs, invoices, employees } = useOutletContext<{
    commissions: Commission[];
    setCommissions: (commissions: Commission[]) => void;
    commissionSlabs: CommissionSlab[];
    invoices: Invoice[];
    employees: any[];
  }>();

  const [selectedCity, setSelectedCity] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [calculatedCommissions, setCalculatedCommissions] = useState<Commission[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ percentage: number; amount: number }>({ percentage: 0, amount: 0 });
  const [showResults, setShowResults] = useState(false);

  const calculateCommission = () => {
    if (!selectedCity || !selectedMonth) {
      toast.error('Please select both city and month');
      return;
    }

    // Filter invoices for the selected city and month
    const monthInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.date);
      const invoiceMonth = `${invoiceDate.getFullYear()}-${String(invoiceDate.getMonth() + 1).padStart(2, '0')}`;
      return invoice.customerCity === selectedCity && invoiceMonth === selectedMonth && invoice.status === 'Paid';
    });

    // Group sales by salesperson
    const salesBySalesperson: { [key: string]: number } = {};
    monthInvoices.forEach(invoice => {
      if (invoice.salesperson) {
        salesBySalesperson[invoice.salesperson] = (salesBySalesperson[invoice.salesperson] || 0) + invoice.totalAmount;
      }
    });

    // Calculate commission for each salesperson
    const newCommissions: Commission[] = [];
    Object.entries(salesBySalesperson).forEach(([salespersonId, totalSales]) => {
      const employee = employees.find(emp => emp.id === salespersonId);
      if (!employee) return;

      // Find applicable commission slab
      const applicableSlab = commissionSlabs
        .filter(slab => slab.salesperson === salespersonId && slab.city === selectedCity)
        .find(slab => totalSales >= slab.fromAmount && totalSales <= slab.toAmount);

      if (!applicableSlab) return;

      const commissionAmount = (totalSales * applicableSlab.commissionPercentage) / 100;

      const commission: Commission = {
        id: `COM-${Date.now()}-${salespersonId}`,
        salesperson: salespersonId,
        salespersonName: employee.name,
        city: selectedCity,
        month: selectedMonth,
        totalSales,
        appliedSlabFrom: applicableSlab.fromAmount,
        appliedSlabTo: applicableSlab.toAmount,
        commissionPercentage: applicableSlab.commissionPercentage,
        calculatedCommissionAmount: commissionAmount,
        status: 'Calculated',
        calculatedBy: 'Admin',
        calculatedAt: new Date().toISOString(),
        isLocked: false
      };

      newCommissions.push(commission);
    });

    if (newCommissions.length === 0) {
      toast.error('No sales data found for the selected city and month');
      return;
    }

    setCalculatedCommissions(newCommissions);
    setShowResults(true);
    toast.success(`Calculated commissions for ${newCommissions.length} salesperson(s)`);
  };

  const confirmCommission = (commissionId: string) => {
    const updatedCommissions = calculatedCommissions.map(commission => {
      if (commission.id === commissionId) {
        return {
          ...commission,
          status: 'Confirmed' as const,
          confirmedBy: 'Admin',
          confirmedAt: new Date().toISOString(),
          isLocked: true
        };
      }
      return commission;
    });

    setCalculatedCommissions(updatedCommissions);
    const commissionToSave = updatedCommissions.find(c => c.id === commissionId);
    if (commissionToSave) {
      setCommissions([...commissions, commissionToSave]);
    }
    toast.success('Commission confirmed and locked');
  };

  const confirmAllCommissions = () => {
    const confirmedCommissions = calculatedCommissions.map(commission => ({
      ...commission,
      status: 'Confirmed' as const,
      confirmedBy: 'Admin',
      confirmedAt: new Date().toISOString(),
      isLocked: true
    }));

    setCommissions([...commissions, ...confirmedCommissions]);
    setCalculatedCommissions(confirmedCommissions);
    toast.success('All commissions confirmed and saved');
  };

  const startEdit = (commission: Commission) => {
    setIsEditing(commission.id);
    setEditValues({
      percentage: commission.overriddenCommissionPercentage || commission.commissionPercentage,
      amount: commission.overriddenCommissionAmount || commission.calculatedCommissionAmount
    });
  };

  const saveEdit = (commissionId: string) => {
    const updatedCommissions = calculatedCommissions.map(commission => {
      if (commission.id === commissionId) {
        return {
          ...commission,
          overriddenCommissionPercentage: editValues.percentage,
          overriddenCommissionAmount: editValues.amount,
          status: 'Adjusted' as const
        };
      }
      return commission;
    });

    setCalculatedCommissions(updatedCommissions);
    setIsEditing(null);
    toast.success('Commission adjusted successfully');
  };

  const cancelEdit = () => {
    setIsEditing(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-PK', { year: 'numeric', month: 'long' });
  };

  const totalSales = calculatedCommissions.reduce((sum, c) => sum + c.totalSales, 0);
  const totalCommission = calculatedCommissions.reduce((sum, c) => 
    sum + (c.overriddenCommissionAmount || c.calculatedCommissionAmount), 0
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/commission')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Calculate Commission</h2>
            <p className="text-gray-600 mt-1">Calculate commissions based on sales and applied slabs</p>
          </div>
        </div>

        {/* Selection Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} className="inline mr-2" />
                City / Territory
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select City</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="inline mr-2" />
                Month & Year
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={calculateCommission}
                disabled={!selectedCity || !selectedMonth}
                className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Calculator size={20} />
                Calculate Commission
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {showResults && calculatedCommissions.length > 0 && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-gray-600">Salespersons</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{calculatedCommissions.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600">Total Sales</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalSales)}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                  <span className="text-sm text-gray-600">Total Commission</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalCommission)}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="w-5 h-5 text-orange-600" />
                  <span className="text-sm text-gray-600">Avg Rate</span>
                </div>
                <p className="text-2xl font-bold text-orange-600">
                  {totalSales > 0 ? ((totalCommission / totalSales) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>

            {/* Commissions Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Commission Results - {selectedCity} ({formatMonth(selectedMonth)})
                </h3>
                <button
                  onClick={confirmAllCommissions}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Save size={18} />
                  Confirm All
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salesperson</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Applied Slab</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Commission %</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {calculatedCommissions.map((commission) => (
                      <tr key={commission.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {commission.salespersonName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(commission.totalSales)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                          {formatCurrency(commission.appliedSlabFrom)} - {formatCurrency(commission.appliedSlabTo)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {isEditing === commission.id ? (
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={editValues.percentage}
                              onChange={(e) => setEditValues({ ...editValues, percentage: Number(e.target.value) })}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-right"
                            />
                          ) : (
                            `${commission.overriddenCommissionPercentage || commission.commissionPercentage}%`
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {isEditing === commission.id ? (
                            <input
                              type="number"
                              min="0"
                              step="100"
                              value={editValues.amount}
                              onChange={(e) => setEditValues({ ...editValues, amount: Number(e.target.value) })}
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-right"
                            />
                          ) : (
                            formatCurrency(commission.overriddenCommissionAmount || commission.calculatedCommissionAmount)
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            commission.status === 'Confirmed'
                              ? 'bg-green-100 text-green-800'
                              : commission.status === 'Adjusted'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {commission.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <div className="flex items-center justify-center gap-2">
                            {commission.status !== 'Confirmed' && (
                              <>
                                {isEditing === commission.id ? (
                                  <>
                                    <button
                                      onClick={() => saveEdit(commission.id)}
                                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                                      title="Save"
                                    >
                                      <Check size={16} />
                                    </button>
                                    <button
                                      onClick={cancelEdit}
                                      className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                                      title="Cancel"
                                    >
                                      <X size={16} />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => startEdit(commission)}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                    title="Edit"
                                  >
                                    <Edit size={16} />
                                  </button>
                                )}
                                <button
                                  onClick={() => confirmCommission(commission.id)}
                                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                                  title="Confirm"
                                >
                                  <Check size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* No Results Message */}
        {showResults && calculatedCommissions.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <Calculator className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Commissions Calculated</h3>
            <p className="text-gray-600">
              No sales data found for {selectedCity} in {formatMonth(selectedMonth)}. 
              Make sure you have invoices with matching city and month.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
