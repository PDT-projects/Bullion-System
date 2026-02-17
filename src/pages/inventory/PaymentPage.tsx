import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, CheckCircle, X, AlertCircle, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useData } from '../../providers/context/DataContext';

type PaymentStatus = 'paid' | 'unpaid' | 'partial';

export function PaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data, setData } = useData();
  
  // Get form data from URL params
  const costingOption = searchParams.get('costing') || 'without';
  const brandName = searchParams.get('brandName') || '';
  const modelName = searchParams.get('modelName') || '';
  const category = searchParams.get('category') || '';
  const sellPrice = Number(searchParams.get('sellPrice')) || 0;
  const buyType = searchParams.get('buyType') as 'Import' | 'Export' || 'Import';
  const warrantyYears = Number(searchParams.get('warrantyYears')) || 0;
  const stock = Number(searchParams.get('stock')) || 0;
  const description = searchParams.get('description') || '';
  const status = searchParams.get('status') as 'New' | 'Used' | 'Returned' | 'Damaged' || 'New';
  const isDamaged = searchParams.get('isDamaged') === 'true';
  const serialNumbers = JSON.parse(searchParams.get('serialNumbers') || '[]');
  const serialCities = JSON.parse(searchParams.get('serialCities') || '{}');

  // Payment state
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid');
  const [transactionId, setTransactionId] = useState('');
  const [paidAmount, setPaidAmount] = useState(0);
  
  // Calculate total amount
  const totalAmount = sellPrice * stock;
  const remainingAmount = totalAmount - paidAmount;

  const handlePaymentStatusChange = (status: PaymentStatus) => {
    setPaymentStatus(status);
    if (status === 'unpaid') {
      setTransactionId('');
      setPaidAmount(0);
    } else if (status === 'paid') {
      setPaidAmount(totalAmount);
    } else if (status === 'partial') {
      setPaidAmount(0);
    }
  };

  const handlePaidAmountChange = (amount: number) => {
    setPaidAmount(amount);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleSubmit = () => {
    // Validate payment
    if ((paymentStatus === 'paid' || paymentStatus === 'partial') && !transactionId) {
      alert('Transaction ID is required for Paid and Partial payments');
      return;
    }
    if (paymentStatus === 'partial' && paidAmount <= 0) {
      alert('Paid amount must be greater than 0 for partial payments');
      return;
    }

    // Create new product
    const newProduct = {
      id: Date.now().toString(),
      brandName,
      modelName,
      category,
      costPrice: 0, // Would be calculated if costing was included
      sellPrice,
      buyType,
      warrantyYears,
      stock,
      serialNumbers,
      serialCities,
      serialStatus: serialNumbers.reduce((acc: any, serial: string) => {
        acc[serial] = isDamaged ? 'Damaged' : 'Available';
        return acc;
      }, {}),
      description,
      status: (isDamaged ? 'Used' : status) as 'New' | 'Used' | 'Returned',
      createdDate: new Date().toISOString().split('T')[0],
    };


    // Update global data with new product
    setData((prev: typeof data) => ({
      ...prev,
      products: [...prev.products, newProduct]
    }));

    // Log the created inventory
    console.log('Inventory Created:', newProduct);
    
    // Show success message
    toast.success('Inventory created successfully!');
    
    // Navigate to view inventory
    navigate('/inventory/view');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="inventory-entry-container max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-md hover:shadow-lg border border-gray-200"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight mb-2">
                Payment Information
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Complete payment details to finalize inventory creation
              </p>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {/* Step 1 - Completed */}
            <div className="flex flex-col items-center text-green-700">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mb-2 shadow-lg border-2 border-white bg-green-600 text-white">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm font-medium text-center leading-tight text-green-600">Inventory Type</span>
            </div>

            {/* Connector 1-2 */}
            <div className="flex-1 h-1 mx-4 rounded-full bg-gradient-to-r from-green-500 to-green-600"></div>

            {/* Step 2 - Completed */}
            <div className="flex flex-col items-center text-green-700">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mb-2 shadow-lg border-2 border-white bg-green-600 text-white">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm font-medium text-center leading-tight text-green-600">Costing Option</span>
            </div>

            {/* Connector 2-3 */}
            <div className="flex-1 h-1 mx-4 rounded-full bg-gradient-to-r from-green-500 to-green-600"></div>

            {/* Step 3 - Completed */}
            <div className="flex flex-col items-center text-green-700">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mb-2 shadow-lg border-2 border-white bg-green-600 text-white">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm font-medium text-center leading-tight text-green-600">Product Details</span>
            </div>

            {/* Connector 3-4 */}
            <div className="flex-1 h-1 mx-4 rounded-full bg-gradient-to-r from-green-500 to-blue-500"></div>

            {/* Step 4 - Active */}
            <div className="flex flex-col items-center text-blue-700">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mb-2 shadow-lg border-2 border-white bg-gradient-to-r from-blue-500 to-blue-600 text-white ring-2 ring-blue-300">
                4
              </div>
              <span className="text-sm font-medium text-center leading-tight text-blue-600">Payment</span>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="space-y-6">
            {/* Payment Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Payment Status *</label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => handlePaymentStatusChange('paid')}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    paymentStatus === 'paid'
                      ? 'border-green-600 bg-white text-green-600'
                      : 'border-gray-200 text-gray-700 hover:border-green-500 hover:bg-green-50'
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium">Paid</div>
                    <div className="text-xs text-gray-600">Full payment received</div>
                  </div>
                </button>

                <button
                  onClick={() => handlePaymentStatusChange('unpaid')}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    paymentStatus === 'unpaid'
                      ? 'border-red-600 bg-white text-red-600'
                      : 'border-gray-200 text-gray-700 hover:border-red-500 hover:bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    <X className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium">Unpaid</div>
                    <div className="text-xs text-gray-600">No payment yet</div>
                  </div>
                </button>

                <button
                  onClick={() => handlePaymentStatusChange('partial')}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    paymentStatus === 'partial'
                      ? 'border-yellow-600 bg-white text-yellow-600'
                      : 'border-gray-200 text-gray-700 hover:border-yellow-500 hover:bg-yellow-50'
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium">Partial</div>
                    <div className="text-xs text-gray-600">Partial payment</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Transaction ID (for Paid and Partial) */}
            {(paymentStatus === 'paid' || paymentStatus === 'partial') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID *</label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter transaction ID"
                />
              </div>
            )}

            {/* Paid Amount (for Partial) */}
            {paymentStatus === 'partial' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paid Amount *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paidAmount || ''}
                  onChange={(e) => handlePaidAmountChange(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            )}

            {/* Payment Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Payment Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Amount:</span>
                  <span className="text-sm font-medium">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Paid Amount:</span>
                  <span className="text-sm font-medium">{formatCurrency(paidAmount || 0)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium text-gray-900">Remaining Amount:</span>
                  <span className="text-sm font-medium text-red-600">{formatCurrency(remainingAmount)}</span>
                </div>
              </div>
            </div>

            {/* Product Summary */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-3">Product Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Brand:</span>
                  <span className="ml-2 font-medium text-blue-900">{brandName}</span>
                </div>
                <div>
                  <span className="text-blue-700">Model:</span>
                  <span className="ml-2 font-medium text-blue-900">{modelName}</span>
                </div>
                <div>
                  <span className="text-blue-700">Category:</span>
                  <span className="ml-2 font-medium text-blue-900">{category}</span>
                </div>
                <div>
                  <span className="text-blue-700">Stock:</span>
                  <span className="ml-2 font-medium text-blue-900">{stock} units</span>
                </div>
                <div>
                  <span className="text-blue-700">Sell Price:</span>
                  <span className="ml-2 font-medium text-blue-900">{formatCurrency(sellPrice)}</span>
                </div>
                <div>
                  <span className="text-blue-700">Status:</span>
                  <span className="ml-2 font-medium text-blue-900">{status}</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg shadow-lg flex items-center gap-2"
              >
                <Save size={20} />
                Submit Inventory
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
