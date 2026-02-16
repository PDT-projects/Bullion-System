import { Invoice } from '../../App';
import { X, Printer, Download, Edit } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

type InvoiceViewProps = {
  invoice: Invoice;
  onClose: () => void;
  onEdit: () => void;
};

export function InvoiceView({ invoice, onClose, onEdit }: InvoiceViewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handlePrint = () => {
    window.print();
    toast.success('Printing invoice...');
  };

  const handleDownload = () => {
    toast.success(`Downloading ${invoice.invoiceNumber}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header Actions */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900">Invoice Details</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              <Printer size={16} />
              Print
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <Download size={16} />
              Download PDF
            </button>
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-3 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors text-sm"
            >
              <Edit size={16} />
              Edit
            </button>
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="p-8" id="invoice-content">
          {/* Company Header */}
          <div className="border-b-2 border-[#4f46e5] pb-6 mb-6">
            <h1 className="text-3xl font-bold text-[#4f46e5] mb-2">Pakistan Detectors Technologies</h1>
            <p className="text-sm text-gray-600">Islamabad / Head Office</p>
            <p className="text-sm text-gray-600">Email: info@pdt.com | Phone: +92 51 1234567</p>
          </div>

          {/* Invoice Info & Customer Details */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-3">Bill To:</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-bold text-gray-900 mb-1">{invoice.customerName}</p>
                {invoice.customerEmail && (
                  <p className="text-sm text-gray-600 mb-1">{invoice.customerEmail}</p>
                )}
                {invoice.customerPhone && (
                  <p className="text-sm text-gray-600 mb-1">{invoice.customerPhone}</p>
                )}
                {invoice.customerAddress && (
                  <p className="text-sm text-gray-600">{invoice.customerAddress}</p>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">INVOICE</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Invoice Number:</span>
                    <span className="font-medium text-gray-900">{invoice.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(invoice.date).toLocaleDateString('en-PK')}
                    </span>
                  </div>
                  {invoice.dueDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Due Date:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(invoice.dueDate).toLocaleDateString('en-PK')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      invoice.paymentStatus === 'Paid' 
                        ? 'bg-green-100 text-green-800' 
                        : invoice.paymentStatus === 'Unpaid'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {invoice.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <table className="w-full">
              <thead className="bg-[#4f46e5] text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">#</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Description</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Quantity</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Rate</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoice.items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatCurrency(item.rate)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium text-gray-900">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.tax && invoice.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(invoice.tax)}</span>
                </div>
              )}
              {invoice.discount && invoice.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-medium text-red-600">-{formatCurrency(invoice.discount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t-2 border-gray-300">
                <span className="font-bold text-gray-900">Total:</span>
                <span className="font-bold text-xl text-[#4f46e5]">{formatCurrency(invoice.total)}</span>
              </div>
              {invoice.paymentStatus === 'Partial' && invoice.paidAmount && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Paid Amount:</span>
                    <span className="font-medium text-green-600">{formatCurrency(invoice.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-300">
                    <span className="font-bold text-gray-900">Balance Due:</span>
                    <span className="font-bold text-red-600">
                      {formatCurrency(invoice.total - invoice.paidAmount)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Notes:</h4>
              <p className="text-sm text-gray-600">{invoice.notes}</p>
            </div>
          )}

          {/* Digital Stamp */}
          {invoice.digitalStamp && (
            <div className="flex justify-end mt-8 mb-4">
              <div className="border-2 border-gray-400 p-3 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <img
                    src="/src/assets/PDT-logo.png"
                    alt="PDT Digital Stamp"
                    className="w-16 h-16 mx-auto mb-2"
                  />
                  <p className="text-xs font-bold text-gray-700">DIGITAL STAMP</p>
                  <p className="text-xs text-gray-600">PAK-DET</p>
                  <p className="text-xs text-gray-600">{new Date().toLocaleDateString('en-PK')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-200 pt-6 mt-8 text-center text-sm text-gray-600">
            <p>Thank you for your business!</p>
            <p className="mt-2">For any queries, please contact us at info@pdt.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
