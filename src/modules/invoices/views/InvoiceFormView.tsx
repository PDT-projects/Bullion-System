// Invoice Module - Form View
// Create/Edit invoice form with customer info, products, and payment details

import { Plus, Trash2, X, Hash, Truck, User, CreditCard, Minimize2 } from 'lucide-react';
import { Invoice, InvoiceProduct, ProductInfo } from '../models/types';

// Employee interface for salesperson selection
interface Employee {
  id: string;
  name: string;
  position: string;
  status: 'active' | 'inactive';
}

interface InvoiceFormViewProps {
  // Form state
  formData: Partial<Invoice>;
  selectedProducts: InvoiceProduct[];
  customerSuggestions: Invoice[];
  showSuggestions: boolean;
  isEditing: boolean;
  
  // Options
  provinceCities: Record<string, string[]>;
  salespersonLocations: string[];
  deliveryStatuses: string[];
  collectionMethods: string[];
  availableProducts: ProductInfo[];
  activeEmployees: Employee[];
  banks: { id: string; name: string; accountNumber: string }[];
  
  // Actions
  onFormChange: (data: Partial<Invoice>) => void;
  onCustomerSearch: (value: string, field: 'customerName' | 'customerPhone') => void;
  onCustomerSelect: (customer: Invoice) => void;
  onAddProduct: () => void;
  onRemoveProduct: (id: string) => void;
  onUpdateProduct: (id: string, field: string, value: any) => void;
  onUpdateSerial: (productId: string, index: number, value: string) => void;
  getAvailableSerials: (productId: string) => string[];
  onSave: () => void;
  onCancel: () => void;
  
  // Helpers
  calculateTotal: () => number;
  formatCurrency: (amount: number) => string;
}

export function InvoiceFormView({
  formData,
  selectedProducts,
  customerSuggestions,
  showSuggestions,
  isEditing,
  provinceCities,
  salespersonLocations,
  deliveryStatuses,
  collectionMethods,
  availableProducts,
  activeEmployees,
  banks,
  onFormChange,
  onCustomerSearch,
  onCustomerSelect,
  onAddProduct,
  onRemoveProduct,
  onUpdateProduct,
  onUpdateSerial,
  getAvailableSerials,
  onSave,
  onCancel,
  calculateTotal,
  formatCurrency
}: InvoiceFormViewProps) {
  const total = calculateTotal();
  
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
        <h3 className="text-xl font-bold">{isEditing ? 'Edit Invoice' : 'Create Invoice'}</h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={onCancel} 
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Exit Full Screen"
          >
            <Minimize2 size={20} />
          </button>
          <button 
            onClick={onCancel} 
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Customer Information */}
        <div className="border-b pb-4">
          <h4 className="font-semibold text-gray-900 mb-3">Customer Information</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
              <input
                type="text"
                value={formData.invoiceNumber || ''}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                value={formData.date || ''}
                onChange={(e) => onFormChange({ date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
              <input
                type="text"
                value={formData.customerName || ''}
                onChange={(e) => onCustomerSearch(e.target.value, 'customerName')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                placeholder="Enter customer name"
              />
              {showSuggestions && (
                <div className="absolute z-10 bg-white border border-gray-300 rounded-lg shadow-md w-full max-h-40 overflow-y-auto mt-1">
                  {customerSuggestions.map(suggestion => (
                    <div
                      key={suggestion.id}
                      className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                      onClick={() => onCustomerSelect(suggestion)}
                    >
                      {suggestion.customerName} ({suggestion.customerPhone})
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CNIC *</label>
              <input
                type="text"
                value={formData.customerCNIC || ''}
                onChange={(e) => onFormChange({ customerCNIC: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                placeholder="42101-1234567-1"
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                value={formData.customerPhone || ''}
                onChange={(e) => onCustomerSearch(e.target.value, 'customerPhone')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                placeholder="+92 300 1234567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Second Phone Number</label>
              <input
                type="tel"
                value={formData.customerPhone2 || ''}
                onChange={(e) => onFormChange({ customerPhone2: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                placeholder="+92 321 7654321"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Province</label>
              <select
                value={formData.customerProvince || ''}
                onChange={(e) => onFormChange({ customerProvince: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm"
              >
                <option value="">Select province</option>
                {Object.keys(provinceCities).map(province => (
                  <option key={province} value={province}>{province}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer City</label>
              <select
                value={formData.customerCity || ''}
                onChange={(e) => onFormChange({ customerCity: e.target.value })}
                disabled={!formData.customerProvince}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="">Select city</option>
                {formData.customerProvince && provinceCities[formData.customerProvince]?.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Address</label>
              <input
                type="text"
                value={formData.customerAddress || ''}
                onChange={(e) => onFormChange({ customerAddress: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                placeholder="e.g., Warehouse A, Section 3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Location</label>
              <input
                type="text"
                value={formData.warrantyLocation || ''}
                onChange={(e) => onFormChange({ warrantyLocation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                placeholder="e.g., Warranty Center, Floor 2"
              />
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="border-b pb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">Products</h4>
            <button 
              onClick={onAddProduct} 
              className="flex items-center gap-1 text-sm bg-[#4f46e5] text-white px-3 py-1.5 rounded-lg hover:bg-[#4338ca] transition-colors"
            >
              <Plus size={16} />
              Add Product
            </button>
          </div>

          {selectedProducts.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No products added yet</p>
          ) : (
            <div className="space-y-4">
              {selectedProducts.map((product, index) => {
                const availableSerials = product.productId ? getAvailableSerials(product.productId) : [];
                return (
                  <div key={product.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">Product {index + 1}</span>
                      <button
                        onClick={() => onRemoveProduct(product.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Product *</label>
                        <select
                          value={product.productId}
                          onChange={(e) => onUpdateProduct(product.id, 'productId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm"
                        >
                          <option value="">Select product</option>
                          {availableProducts.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.brandName} {p.modelName} ({getAvailableSerials(p.id).length} available)
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Quantity *</label>
                        <input
                          type="number"
                          value={product.quantity}
                          onChange={(e) => onUpdateProduct(product.id, 'quantity', Number(e.target.value))}
                          min="1"
                          max={availableSerials.length}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Price</label>
                        <input
                          type="number"
                          value={product.price}
                          onChange={(e) => onUpdateProduct(product.id, 'price', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm"
                        />
                      </div>
                    </div>

                    {product.productId && product.quantity > 0 && (
                      <div className="border-t pt-3 mt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Hash size={14} className="text-[#4f46e5]" />
                          <label className="text-xs font-medium text-gray-700">Select Serial Numbers ({product.quantity} required)</label>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {Array.from({ length: product.quantity }).map((_, serialIndex) => (
                            <select
                              key={serialIndex}
                              value={product.serialNumbers?.[serialIndex] || ''}
                              onChange={(e) => onUpdateSerial(product.id, serialIndex, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm"
                            >
                              <option value="">Select serial #{serialIndex + 1}</option>
                              {availableSerials.map(serial => (
                                <option 
                                  key={serial} 
                                  value={serial}
                                  disabled={product.serialNumbers?.includes(serial) && product.serialNumbers[serialIndex] !== serial}
                                >
                                  {serial}
                                </option>
                              ))}
                            </select>
                          ))}
                        </div>
                        {availableSerials.length === 0 && (
                          <p className="text-xs text-red-600 mt-1">No available serial numbers for this product</p>
                        )}
                      </div>
                    )}

                    <div className="mt-3 text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        Total: {formatCurrency(product.total)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Delivery & Additional Information */}
        <div className="border-b pb-4">
          <div className="flex items-center gap-2 mb-3">
            <Truck size={18} className="text-[#4f46e5]" />
            <h4 className="font-semibold text-gray-900">Delivery & Additional Information</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Status *</label>
              <select
                value={formData.deliveryStatus || 'Self-collect'}
                onChange={(e) => onFormChange({ deliveryStatus: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
              >
                {deliveryStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status *</label>
              <select
                value={formData.status || 'Unpaid'}
                onChange={(e) => onFormChange({ status: e.target.value as 'Paid' | 'Unpaid' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
              >
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Exchange & Warranty Note</label>
            <textarea
              value={formData.exchangeWarrantyNote || ''}
              onChange={(e) => onFormChange({ exchangeWarrantyNote: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] resize-none"
              placeholder="e.g., 2 years warranty, no exchange after 7 days"
            />
          </div>
        </div>

        {/* Sales Details Section */}
        <div className="border-b pb-4 bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <User size={18} className="text-[#4f46e5]" />
            <h4 className="font-semibold text-gray-900">Sales Details</h4>
            <span className="text-xs text-gray-500 ml-auto">(Internal - not shown on invoice slip)</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salesperson</label>
              <select
                value={formData.salesperson || ''}
                onChange={(e) => onFormChange({ salesperson: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
              >
                <option value="">Select salesperson</option>
                {activeEmployees.map(emp => (
                  <option key={emp.id} value={emp.name}>
                    {emp.name} - {emp.position}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salesperson Location</label>
              <select
                value={formData.salespersonLocation || ''}
                onChange={(e) => onFormChange({ salespersonLocation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
              >
                <option value="">Select location</option>
                {salespersonLocations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Referral To</label>
              <input
                type="text"
                value={formData.clientDealBy || ''}
                onChange={(e) => onFormChange({ clientDealBy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                placeholder="e.g., Ahmed Khan, Company XYZ"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Referral From</label>
              <input
                type="text"
                value={formData.referralBy || ''}
                onChange={(e) => onFormChange({ referralBy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                placeholder="e.g., Existing customer, Partner company"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
              <input
                type="text"
                value={formData.createdBy || ''}
                onChange={(e) => onFormChange({ createdBy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                placeholder="e.g., Manager Ali, Admin User"
              />
            </div>
          </div>
        </div>

        {/* Payment Details Section */}
        <div className="border-b pb-4 bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={18} className="text-[#10b981]" />
            <h4 className="font-semibold text-gray-900">Payment & Collection Details</h4>
            <span className="text-xs text-gray-500 ml-auto">(Internal - not shown on invoice slip)</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
              <select
                value={formData.paymentMode || 'Cash'}
                onChange={(e) => onFormChange({ paymentMode: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
              >
                <option value="Cash">Cash</option>
                <option value="Online">Online (Bank)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
              <select
                value={formData.paymentStatus || 'Full'}
                onChange={(e) => {
                  const newStatus = e.target.value as 'Full' | 'Partial';
                  onFormChange({ 
                    paymentStatus: newStatus,
                    paidAmount: newStatus === 'Full' ? total : formData.paidAmount || 0,
                    remainingAmount: newStatus === 'Full' ? 0 : total - (formData.paidAmount || 0)
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
              >
                <option value="Full">Full Payment</option>
                <option value="Partial">Partial Payment</option>
              </select>
            </div>
            {formData.paymentStatus === 'Partial' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Paid Amount
                  </label>
                  <input
                    type="number"
                    value={formData.paidAmount || 0}
                    onChange={(e) => onFormChange({ 
                      paidAmount: Number(e.target.value), 
                      remainingAmount: total - Number(e.target.value) 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remaining Amount
                  </label>
                  <input
                    type="number"
                    value={formData.remainingAmount || 0}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
              </>
            )}
            {formData.paymentMode === 'Online' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank</label>
                <select
                  value={formData.bankId || ''}
                  onChange={(e) => {
                    const bank = banks.find(b => b.id === e.target.value);
                    onFormChange({ 
                      bankId: bank?.id,
                      bankName: bank?.name,
                      bankAccountNumber: bank?.accountNumber
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                >
                  <option value="">Select bank</option>
                  {banks.map(bank => (
                    <option key={bank.id} value={bank.id}>
                      {bank.name} - {bank.accountNumber}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Collection Method</label>
              <select
                value={formData.collectionMethod || 'Self Collection'}
                onChange={(e) => onFormChange({ collectionMethod: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
              >
                {collectionMethods.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deduction Charges</label>
              <input
                type="number"
                value={formData.deductionCharges || 0}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Total & Save */}
        <div className="bg-[#4f46e5]/10 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold">Total Amount:</span>
            <span className="text-2xl font-bold text-[#4f46e5]">{formatCurrency(total)}</span>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors"
            >
              {isEditing ? 'Update Invoice' : 'Create Invoice'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
