import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ArrowLeft, Eye, CreditCard, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

type PaymentStatus = 'paid' | 'unpaid' | 'partial';

type ModelPricing = {
  modelName: string;
  unitPrice: number;
  quantity: number;
  total: number;
};

type PaymentHistory = {
  id: string;
  amount: number;
  mode: 'Cash' | 'Cheque' | 'Bank Transfer';
  date: string;
};

type ReceivableStock = {
  id: string;
  shipmentMadeDate: string;
  expectedDeliveryDate: string;
  supplierFrom: string;
  stockQuantity: number;
  brandName: string;
  models: ModelPricing[];
  totalAmount: number;
  paymentStatus: PaymentStatus;
  transactionId: string;
  paidAmount: number;
  remainingAmount: number;
  status: 'On the Way';
  paymentHistory: PaymentHistory[];
};

const mockReceivableStocks: ReceivableStock[] = [
  {
    id: "RS-001",
    shipmentMadeDate: "2026-01-20",
    expectedDeliveryDate: "2026-02-12",
    supplierFrom: "China",
    stockQuantity: 80,
    brandName: "Samsung",
    models: [
      { modelName: "A15", unitPrice: 5000, quantity: 50, total: 250000 },
      { modelName: "A25", unitPrice: 6000, quantity: 30, total: 180000 }
    ],
    totalAmount: 500000,
    paymentStatus: 'partial',
    transactionId: "TXN-001",
    paidAmount: 250000,
    remainingAmount: 250000,
    status: 'On the Way',
    paymentHistory: [
      {
        id: "PH-001",
        amount: 250000,
        mode: "Bank Transfer",
        date: "2026-01-15"
      }
    ]
  },
  {
    id: "RS-002",
    shipmentMadeDate: "2026-01-25",
    expectedDeliveryDate: "2026-02-18",
    supplierFrom: "USA",
    stockQuantity: 20,
    brandName: "Dell",
    models: [
      { modelName: "Inspiron 15", unitPrice: 15000, quantity: 20, total: 300000 }
    ],
    totalAmount: 300000,
    paymentStatus: 'unpaid',
    transactionId: "",
    paidAmount: 0,
    remainingAmount: 300000,
    status: 'On the Way',
    paymentHistory: []
  }
];

export function ReceivableStockPage() {
  const navigate = useNavigate();
  const [selectedStock, setSelectedStock] = useState<ReceivableStock | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Cheque' | 'Bank Transfer'>('Bank Transfer');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleViewStock = (stock: ReceivableStock) => {
    setSelectedStock(stock);
    setViewModalOpen(true);
  };

  const handlePayRemaining = (stock: ReceivableStock) => {
    setSelectedStock(stock);
    setPaymentAmount(stock.remainingAmount.toString());
    setPayModalOpen(true);
  };

  const handlePaymentSubmit = () => {
    if (!selectedStock || !paymentAmount || !paymentMode) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (amount <= 0 || amount > selectedStock.remainingAmount) {
      toast.error('Invalid payment amount');
      return;
    }

    toast.success(`Payment of ${formatCurrency(amount)} processed successfully!`);
    setPayModalOpen(false);
    setPaymentAmount('');
    setPaymentMode('Bank Transfer');
    setSelectedStock(null);
  };

  const totalReceivable = mockReceivableStocks.reduce((sum, s) => sum + s.remainingAmount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="inventory-entry-container max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/inventory')}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-md hover:shadow-lg border border-gray-200"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-orange-600 to-amber-600 rounded-xl shadow-lg">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight mb-2">
                Receivable Stock
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                View shipments on the way but not yet received
              </p>
            </div>
          </div>
        </div>

        {/* Total Summary */}
        <div className="mb-6 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Total Receivable Payable</h3>
              <p className="text-sm text-gray-600">Amount pending for all shipments</p>
            </div>
            <div className="text-3xl font-bold text-orange-600">
              {formatCurrency(totalReceivable)}
            </div>
          </div>
        </div>

        {/* Stock Cards */}
        <div className="space-y-6">
          {mockReceivableStocks.map(stock => (
            <div key={stock.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{stock.brandName}</h3>
                  <p className="text-sm text-gray-600">Shipment ID: {stock.id}</p>
                </div>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  stock.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                  stock.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {stock.paymentStatus === 'paid' ? 'Paid' : 
                   stock.paymentStatus === 'partial' ? 'Partial' : 'Unpaid'}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">From:</p>
                  <p className="font-medium">{stock.supplierFrom}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Shipment Date:</p>
                  <p className="font-medium">{stock.shipmentMadeDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Expected Delivery:</p>
                  <p className="font-medium">{stock.expectedDeliveryDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Quantity:</p>
                  <p className="font-medium">{stock.stockQuantity} units</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Total Amount:</p>
                  <p className="font-medium">{formatCurrency(stock.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Paid:</p>
                  <p className="font-medium text-green-600">{formatCurrency(stock.paidAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Remaining:</p>
                  <p className="font-medium text-red-600">{formatCurrency(stock.remainingAmount)}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleViewStock(stock)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Eye size={18} />
                  View Details
                </button>
                {stock.remainingAmount > 0 && (
                  <button
                    onClick={() => handlePayRemaining(stock)}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <CreditCard size={18} />
                    Pay Remaining
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* View Modal */}
        {viewModalOpen && selectedStock && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold">Receivable Stock Details</h3>
                <button 
                  onClick={() => setViewModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Shipment Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Brand:</span>
                        <span className="font-medium">{selectedStock.brandName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">From:</span>
                        <span className="font-medium">{selectedStock.supplierFrom}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipment Date:</span>
                        <span className="font-medium">{selectedStock.shipmentMadeDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expected Delivery:</span>
                        <span className="font-medium">{selectedStock.expectedDeliveryDate}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Payment Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-medium">{formatCurrency(selectedStock.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Paid Amount:</span>
                        <span className="font-medium text-green-600">{formatCurrency(selectedStock.paidAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Remaining Amount:</span>
                        <span className="font-medium text-red-600">{formatCurrency(selectedStock.remainingAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-medium ${
                          selectedStock.paymentStatus === 'paid' ? 'text-green-600' :
                          selectedStock.paymentStatus === 'partial' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {selectedStock.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Models */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Models & Quantities</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedStock.models.map((model, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{model.modelName}</span>
                          <span className="text-sm text-gray-600">Qty: {model.quantity}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm text-gray-600">Unit Price:</span>
                          <span className="font-medium">{formatCurrency(model.unitPrice)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Total:</span>
                          <span className="font-medium">{formatCurrency(model.total)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment History */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Payment History</h4>
                  {selectedStock.paymentHistory.length > 0 ? (
                    <div className="space-y-2">
                      {selectedStock.paymentHistory.map((payment, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <span className="font-medium">{formatCurrency(payment.amount)}</span>
                            <span className="text-sm text-gray-600 ml-2">({payment.mode})</span>
                          </div>
                          <span className="text-sm text-gray-600">{payment.date}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No payment history available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pay Modal */}
        {payModalOpen && selectedStock && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold">Pay Remaining Amount</h3>
                <button 
                  onClick={() => setPayModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-medium">{formatCurrency(selectedStock.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Paid Amount:</span>
                    <span className="font-medium text-green-600">{formatCurrency(selectedStock.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-gray-600">Remaining Amount:</span>
                    <span className="font-medium text-red-600">{formatCurrency(selectedStock.remainingAmount)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Amount *
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter payment amount"
                    min="0"
                    max={selectedStock.remainingAmount}
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Mode *
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as 'Cash' | 'Cheque' | 'Bank Transfer')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setPayModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePaymentSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Process Payment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
