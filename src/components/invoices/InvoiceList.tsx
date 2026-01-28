import { Invoice } from '../../App';
import { Plus, Eye, Edit, Trash2, Download, Printer } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

type InvoiceListProps = {
  invoices: Invoice[];
  onView: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
};

export function InvoiceList({ invoices, onView, onEdit, onDelete, onCreate }: InvoiceListProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Unpaid':
        return 'bg-red-100 text-red-800';
      case 'Partial':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownload = (invoice: Invoice) => {
    toast.success(`Downloading invoice ${invoice.invoiceNumber}`);
  };

  const handlePrint = (invoice: Invoice) => {
    toast.success(`Printing invoice ${invoice.invoiceNumber}`);
  };

  const handleDelete = (id: string, invoiceNumber: string) => {
    if (confirm(`Are you sure you want to delete invoice ${invoiceNumber}?`)) {
      onDelete(id);
      toast.success('Invoice deleted successfully');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Invoices</h2>
          <p className="text-sm text-gray-600 mt-1">Manage and track all your invoices</p>
        </div>
        <button
          onClick={onCreate}
          className="flex items-center gap-2 bg-[#4f46e5] text-white px-4 py-2 rounded-lg hover:bg-[#4338ca] transition-colors"
        >
          <Plus size={20} />
          Create Invoice
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total Invoices</p>
          <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Paid</p>
          <p className="text-2xl font-bold text-green-600">
            {invoices.filter(inv => inv.paymentStatus === 'Paid').length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Unpaid</p>
          <p className="text-2xl font-bold text-red-600">
            {invoices.filter(inv => inv.paymentStatus === 'Unpaid').length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Partial</p>
          <p className="text-2xl font-bold text-yellow-600">
            {invoices.filter(inv => inv.paymentStatus === 'Partial').length}
          </p>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(invoice.date).toLocaleDateString('en-PK')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.customerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(invoice.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.paymentStatus)}`}>
                      {invoice.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onView(invoice)}
                        className="p-2 text-[#4f46e5] hover:bg-[#4f46e5]/10 rounded-lg transition-colors"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => onEdit(invoice)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDownload(invoice)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Download PDF"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => handlePrint(invoice)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Print"
                      >
                        <Printer size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(invoice.id, invoice.invoiceNumber)}
                        className="p-2 text-[#ef4444] hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
