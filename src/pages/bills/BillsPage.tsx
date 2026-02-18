import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Transaction, Bank } from '../../App';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Trash2, 
  X, 
  FileText,
  Printer,
  Zap,
  Wifi,
  Droplets,
  Receipt,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

export function BillsPage() {
  const navigate = useNavigate();
  const { transactions, setTransactions, banks } = useOutletContext<{
    transactions: Transaction[];
    setTransactions: (transactions: Transaction[]) => void;
    banks: Bank[];
  }>();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'Electricity' | 'Internet' | 'Utilities'>('all');
  const [viewingBill, setViewingBill] = useState<Transaction | null>(null);
  const [viewingSlip, setViewingSlip] = useState<Transaction | null>(null);

  // Filter bills from all transactions
  const allBills = transactions.filter(t => t.mainCategory === 'Bills');

  // Apply additional filters
  const filteredBills = allBills.filter(bill => {
    const matchesSearch = 
      bill.paidTo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.paidBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.subCategory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || bill.subCategory === filterCategory;

    return matchesSearch && matchesCategory;
  });

  // Calculate statistics
  const stats = {
    totalBills: allBills.length,
    totalAmount: allBills.reduce((sum, bill) => sum + bill.amount, 0),
    electricityTotal: allBills.filter(b => b.subCategory === 'Electricity').reduce((sum, b) => sum + b.amount, 0),
    internetTotal: allBills.filter(b => b.subCategory === 'Internet').reduce((sum, b) => sum + b.amount, 0),
    utilitiesTotal: allBills.filter(b => b.subCategory === 'Utilities').reduce((sum, b) => sum + b.amount, 0)
  };

  const handleDeleteBill = (id: string) => {
    const billToDelete = allBills.find(b => b.id === id);
    if (!billToDelete) return;

    if (confirm('Are you sure you want to delete this bill?')) {
      // Reverse bank transaction if it was a bank payment
      if ((billToDelete.mode === 'Bank' || billToDelete.mode === 'Cheque') && billToDelete.bankName) {
        const updatedBanks = banks.map(bank => {
          if (bank.name === billToDelete.bankName) {
            return { ...bank, balance: bank.balance + billToDelete.amount };
          }
          return bank;
        });
        // Note: In a real app, you'd need setBanks here, but we're working with context
      }

      setTransactions(transactions.filter(t => t.id !== id));
      toast.success('Bill deleted successfully');
    }
  };

  const handlePrint = (bill: Transaction) => {
    toast.success('Printing bill slip...');
    window.print();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Electricity':
        return <Zap className="w-5 h-5 text-yellow-600" />;
      case 'Internet':
        return <Wifi className="w-5 h-5 text-blue-600" />;
      case 'Utilities':
        return <Droplets className="w-5 h-5 text-cyan-600" />;
      default:
        return <Receipt className="w-5 h-5 text-gray-600" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Electricity':
        return 'bg-yellow-100 text-yellow-800';
      case 'Internet':
        return 'bg-blue-100 text-blue-800';
      case 'Utilities':
        return 'bg-cyan-100 text-cyan-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/finance')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Bills</h2>
            <p className="text-gray-600">Manage utility bills and recurring payments</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/bills/new')}
          className="flex items-center gap-2 px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors"
        >
          <Plus size={18} />
          Add Bill
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Receipt size={18} className="text-[#4f46e5]" />
            <p className="text-sm text-gray-600">Total Bills</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalBills}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={18} className="text-yellow-600" />
            <p className="text-sm text-gray-600">Electricity</p>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.electricityTotal)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Wifi size={18} className="text-blue-600" />
            <p className="text-sm text-gray-600">Internet</p>
          </div>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.internetTotal)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Droplets size={18} className="text-cyan-600" />
            <p className="text-sm text-gray-600">Utilities</p>
          </div>
          <p className="text-2xl font-bold text-cyan-600">{formatCurrency(stats.utilitiesTotal)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by vendor, company, category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-500" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
          >
            <option value="all">All Categories</option>
            <option value="Electricity">Electricity</option>
            <option value="Internet">Internet</option>
            <option value="Utilities">Utilities</option>
          </select>
        </div>

        <button className="flex items-center gap-2 px-3 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
          <Download size={18} />
          Export
        </button>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Category</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Paid To</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Company</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Method</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredBills.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                  <Receipt className="mx-auto mb-3 text-gray-300" size={48} />
                  <p className="text-lg font-medium">No bills found</p>
                  <p className="text-sm mt-1">Create a new bill to get started</p>
                </td>
              </tr>
            ) : (
              filteredBills.map((bill) => (
                <tr key={bill.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(bill.date)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(bill.subCategory)}
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(bill.subCategory)}`}>
                        {bill.subCategory}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {bill.paidTo || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {bill.company?.split(': ')[1] || bill.company || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {bill.mode}{bill.bankName ? ` (${bill.bankName})` : ''}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {formatCurrency(bill.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setViewingBill(bill)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => setViewingSlip(bill)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                        title="View Slip"
                      >
                        <FileText size={16} />
                      </button>
                      <button
                        onClick={() => handlePrint(bill)}
                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                        title="Print"
                      >
                        <Printer size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteBill(bill.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Bill Modal */}
      {viewingBill && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Bill Details</h3>
              <button
                onClick={() => setViewingBill(null)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">{formatDate(viewingBill.date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Company</p>
                  <p className="font-medium">{viewingBill.company?.split(': ')[1] || viewingBill.company}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Category</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(viewingBill.subCategory)}`}>
                    {viewingBill.subCategory}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Paid To</p>
                  <p className="font-medium text-[#4f46e5]">{viewingBill.paidTo || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Paid By</p>
                  <p className="font-medium">{viewingBill.paidBy || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Transaction By</p>
                  <p className="font-medium">{viewingBill.transactionBy || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-medium">
                    {viewingBill.mode}{viewingBill.bankName ? ` (${viewingBill.bankName})` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="text-lg font-bold text-[#4f46e5]">{formatCurrency(viewingBill.amount)}</p>
                </div>
              </div>

              {viewingBill.note && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-1">Note</p>
                  <p className="font-medium">{viewingBill.note}</p>
                </div>
              )}

              {viewingBill.imageUrl && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2">Receipt Image</p>
                  <img src={viewingBill.imageUrl} alt="Receipt" className="max-w-full h-auto rounded border" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Slip Modal */}
      {viewingSlip && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Bill Payment Slip</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrint(viewingSlip)}
                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                >
                  <Printer size={20} />
                </button>
                <button
                  onClick={() => setViewingSlip(null)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="p-8">
              {/* Company Header */}
              <div className="text-center border-b pb-4 mb-6">
                <h2 className="text-2xl font-bold text-[#4f46e5]">Pakistan Detectors Technologies</h2>
                <p className="text-sm text-gray-600 mt-1">{viewingSlip.company?.split(': ')[1] || viewingSlip.company}</p>
                <p className="text-lg font-semibold mt-3">BILL PAYMENT SLIP</p>
              </div>

              {/* Bill Details */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Date:</p>
                  <p className="font-semibold">{formatDate(viewingSlip.date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Category:</p>
                  <p className="font-semibold">{viewingSlip.subCategory}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Paid To:</p>
                  <p className="font-semibold text-[#4f46e5]">{viewingSlip.paidTo || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Paid By:</p>
                  <p className="font-semibold">{viewingSlip.paidBy || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Transaction By:</p>
                  <p className="font-semibold">{viewingSlip.transactionBy || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Method:</p>
                  <p className="font-semibold">
                    {viewingSlip.mode}{viewingSlip.bankName ? ` (${viewingSlip.bankName})` : ''}
                  </p>
                </div>
              </div>

              {/* Amount */}
              <div className="bg-[#4f46e5]/10 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Amount Paid:</span>
                  <span className="text-2xl font-bold text-[#4f46e5]">{formatCurrency(viewingSlip.amount)}</span>
                </div>
              </div>

              {viewingSlip.note && (
                <div className="border-t pt-4 mb-6">
                  <p className="text-sm font-semibold mb-1">Note:</p>
                  <p className="text-sm text-gray-600">{viewingSlip.note}</p>
                </div>
              )}

              {viewingSlip.imageUrl && (
                <div className="border-t pt-4 mb-6">
                  <p className="text-sm font-semibold mb-2">Receipt:</p>
                  <img src={viewingSlip.imageUrl} alt="Receipt" className="max-w-full h-auto rounded border" />
                </div>
              )}

              {/* Footer */}
              <div className="border-t pt-4 text-center text-sm text-gray-500">
                <p>Generated on {new Date().toLocaleDateString('en-PK')} at {new Date().toLocaleTimeString('en-PK')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
