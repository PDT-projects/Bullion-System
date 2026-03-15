// Invoice Module - Form View
// Create/Edit invoice form

import React from 'react';
import { Plus, Trash2, X, Hash, Truck, User, CreditCard, Loader2 } from 'lucide-react';
import { Invoice, InvoiceProduct, ProductInfo } from '../models/types';

interface Employee { id: string; name: string; position: string; status: 'active' | 'inactive'; }
interface Bank    { id: string; name: string; accountNumber: string; }

interface Props {
  formData: Partial<Invoice>;
  selectedProducts: InvoiceProduct[];
  customerSuggestions: Invoice[];
  showSuggestions: boolean;
  isEditing: boolean;
  isLoading: boolean;
  isSaving: boolean;
  provinceCities: Record<string, string[]>;
  salespersonLocations: string[];
  deliveryStatuses: string[];
  collectionMethods: string[];
  availableProducts: ProductInfo[];
  activeEmployees: Employee[];
  banks: Bank[];
  setFormData: (data: Partial<Invoice>) => void;
  handleCustomerSearch: (value: string, field: 'customerName' | 'customerPhone') => void;
  handleCustomerSelect: (customer: Invoice) => void;
  addProduct: () => void;
  removeProduct: (id: string) => void;
  updateProduct: (id: string, field: string, value: any) => void;
  updateSerial: (productId: string, index: number, value: string) => void;
  getAvailableSerialsForProduct: (productId: string) => string[];
  handleSave: () => void;
  handleCancel: () => void;
  calculateTotal: () => number;
  formatCurrency: (amount: number) => string;
}

const inp = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm';
const lbl = 'block text-sm font-medium text-gray-700 mb-1';

export function InvoiceFormView({
  formData, selectedProducts, customerSuggestions, showSuggestions,
  isEditing, isLoading, isSaving,
  provinceCities, salespersonLocations, deliveryStatuses, collectionMethods,
  availableProducts, activeEmployees, banks,
  setFormData, handleCustomerSearch, handleCustomerSelect,
  addProduct, removeProduct, updateProduct, updateSerial,
  getAvailableSerialsForProduct,
  handleSave, handleCancel, calculateTotal, formatCurrency,
}: Props) {
  const total = calculateTotal();

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
        <h3 className="text-xl font-bold">{isEditing ? 'Edit Invoice' : 'Create Invoice'}</h3>
        <button onClick={handleCancel} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><X size={24} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Customer Information */}
        <div className="border-b pb-6">
          <h4 className="font-semibold text-gray-900 mb-4">Customer Information</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Invoice Number</label>
              <input type="text" value={formData.invoiceNumber || ''} readOnly className={`${inp} bg-gray-50`} />
            </div>
            <div>
              <label className={lbl}>Date *</label>
              <input type="date" value={formData.date || ''} onChange={e => setFormData({ date: e.target.value })} className={inp} />
            </div>
            {/* Customer Name with suggestions */}
            <div className="relative">
              <label className={lbl}>Customer Name *</label>
              <input type="text" value={formData.customerName || ''}
                onChange={e => handleCustomerSearch(e.target.value, 'customerName')}
                placeholder="Enter customer name" className={inp} />
              {showSuggestions && (
                <div className="absolute z-20 bg-white border border-gray-200 rounded-lg shadow-lg w-full max-h-40 overflow-y-auto mt-1">
                  {customerSuggestions.map(s => (
                    <div key={s.id} onClick={() => handleCustomerSelect(s)}
                      className="px-3 py-2 cursor-pointer hover:bg-gray-50 text-sm">
                      {s.customerName} <span className="text-gray-400">({s.customerPhone})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className={lbl}>CNIC *</label>
              <input type="text" value={formData.customerCNIC || ''} onChange={e => setFormData({ customerCNIC: e.target.value })}
                placeholder="42101-1234567-1" className={inp} />
            </div>
            <div className="relative">
              <label className={lbl}>Phone Number *</label>
              <input type="tel" value={formData.customerPhone || ''}
                onChange={e => handleCustomerSearch(e.target.value, 'customerPhone')}
                placeholder="+92 300 1234567" className={inp} />
            </div>
            <div>
              <label className={lbl}>Second Phone</label>
              <input type="tel" value={formData.customerPhone2 || ''} onChange={e => setFormData({ customerPhone2: e.target.value })} className={inp} />
            </div>
            <div>
              <label className={lbl}>Province</label>
              <select value={formData.customerProvince || ''} onChange={e => setFormData({ customerProvince: e.target.value, customerCity: '' })} className={inp}>
                <option value="">Select province</option>
                {Object.keys(provinceCities).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>City</label>
              <select value={formData.customerCity || ''} onChange={e => setFormData({ customerCity: e.target.value })}
                disabled={!formData.customerProvince} className={`${inp} disabled:bg-gray-50 disabled:text-gray-400`}>
                <option value="">Select city</option>
                {formData.customerProvince && provinceCities[formData.customerProvince]?.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Address</label>
              <input type="text" value={formData.customerAddress || ''} onChange={e => setFormData({ customerAddress: e.target.value })} className={inp} />
            </div>
            <div>
              <label className={lbl}>Warranty Location</label>
              <input type="text" value={formData.warrantyLocation || ''} onChange={e => setFormData({ warrantyLocation: e.target.value })} className={inp} />
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="border-b pb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">Products</h4>
            <button onClick={addProduct}
              className="flex items-center gap-1 text-sm bg-[#4f46e5] text-white px-3 py-1.5 rounded-lg hover:bg-[#4338ca] transition-colors">
              <Plus size={16} /> Add Product
            </button>
          </div>

          {selectedProducts.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6 bg-gray-50 rounded-lg">No products added yet</p>
          ) : (
            <div className="space-y-4">
              {selectedProducts.map((product, index) => {
                const serials = product.productId ? getAvailableSerialsForProduct(product.productId) : [];
                return (
                  <div key={product.id} className="border rounded-xl p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-700">Product {index + 1}</span>
                      <button onClick={() => removeProduct(product.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Product *</label>
                        <select value={product.productId} onChange={e => updateProduct(product.id, 'productId', e.target.value)} className={inp}>
                          <option value="">Select product</option>
                          {availableProducts.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.brandName} {p.modelName} ({getAvailableSerialsForProduct(p.id).length} available)
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Quantity *</label>
                        <input type="number" min="1" max={serials.length} value={product.quantity}
                          onChange={e => updateProduct(product.id, 'quantity', Number(e.target.value))} className={inp} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Price</label>
                        <input type="number" value={product.price}
                          onChange={e => updateProduct(product.id, 'price', Number(e.target.value))} className={inp} />
                      </div>
                    </div>
                    {/* Serial selects */}
                    {product.productId && product.quantity > 0 && (
                      <div className="border-t pt-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Hash size={13} className="text-[#4f46e5]" />
                          <span className="text-xs font-semibold text-gray-700">Serial Numbers ({product.quantity} required)</span>
                        </div>
                        {serials.length === 0 ? (
                          <p className="text-xs text-red-500">No available serials for this product</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {Array.from({ length: product.quantity }, (_, i) => (
                              <select key={i} value={product.serialNumbers?.[i] || ''}
                                onChange={e => updateSerial(product.id, i, e.target.value)} className={inp}>
                                <option value="">Select serial #{i + 1}</option>
                                {serials.map(s => (
                                  <option key={s} value={s}
                                    disabled={product.serialNumbers?.includes(s) && product.serialNumbers[i] !== s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="mt-3 text-right text-sm font-semibold text-gray-900">
                      Total: {formatCurrency(product.total)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Delivery & Info */}
        <div className="border-b pb-6">
          <div className="flex items-center gap-2 mb-4">
            <Truck size={18} className="text-[#4f46e5]" />
            <h4 className="font-semibold text-gray-900">Delivery & Information</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Delivery Status</label>
              <select value={formData.deliveryStatus || 'Self-collect'} onChange={e => setFormData({ deliveryStatus: e.target.value as any })} className={inp}>
                {deliveryStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Payment Status</label>
              <select value={formData.status || 'Unpaid'} onChange={e => setFormData({ status: e.target.value as any })} className={inp}>
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className={lbl}>Exchange & Warranty Note</label>
            <textarea value={formData.exchangeWarrantyNote || ''} onChange={e => setFormData({ exchangeWarrantyNote: e.target.value })}
              rows={3} placeholder="e.g., 2 years warranty, no exchange after 7 days"
              className={`${inp} resize-none`} />
          </div>
        </div>

        {/* Sales Details */}
        <div className="border-b pb-6 bg-blue-50 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <User size={18} className="text-[#4f46e5]" />
            <h4 className="font-semibold text-gray-900">Sales Details</h4>
            <span className="text-xs text-gray-400 ml-auto">Internal — not shown on invoice</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Salesperson</label>
              <select value={formData.salesperson || ''} onChange={e => setFormData({ salesperson: e.target.value })} className={inp}>
                <option value="">Select salesperson</option>
                {activeEmployees.map(e => <option key={e.id} value={e.name}>{e.name} — {e.position}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Salesperson Location</label>
              <select value={formData.salespersonLocation || ''} onChange={e => setFormData({ salespersonLocation: e.target.value })} className={inp}>
                <option value="">Select location</option>
                {salespersonLocations.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Referral To</label>
              <input type="text" value={formData.clientDealBy || ''} onChange={e => setFormData({ clientDealBy: e.target.value })} className={inp} />
            </div>
            <div>
              <label className={lbl}>Referral From</label>
              <input type="text" value={formData.referralBy || ''} onChange={e => setFormData({ referralBy: e.target.value })} className={inp} />
            </div>
            <div className="col-span-2">
              <label className={lbl}>Created By</label>
              <input type="text" value={formData.createdBy || ''} onChange={e => setFormData({ createdBy: e.target.value })} className={inp} />
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="border-b pb-6 bg-green-50 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={18} className="text-green-600" />
            <h4 className="font-semibold text-gray-900">Payment & Collection</h4>
            <span className="text-xs text-gray-400 ml-auto">Internal — not shown on invoice</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Payment Mode</label>
              <select value={formData.paymentMode || 'Cash'} onChange={e => setFormData({ paymentMode: e.target.value as any })} className={inp}>
                <option value="Cash">Cash</option>
                <option value="Online">Online (Bank)</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Payment Status</label>
              <select value={formData.paymentStatus || 'Full'} onChange={e => {
                const s = e.target.value as 'Full' | 'Partial';
                setFormData({ paymentStatus: s, paidAmount: s === 'Full' ? total : 0, remainingAmount: s === 'Full' ? 0 : total });
              }} className={inp}>
                <option value="Full">Full Payment</option>
                <option value="Partial">Partial Payment</option>
              </select>
            </div>
            {formData.paymentStatus === 'Partial' && (
              <>
                <div>
                  <label className={lbl}>Paid Amount</label>
                  <input type="number" value={formData.paidAmount || 0}
                    onChange={e => setFormData({ paidAmount: Number(e.target.value), remainingAmount: total - Number(e.target.value) })}
                    className={inp} />
                </div>
                <div>
                  <label className={lbl}>Remaining</label>
                  <input type="number" value={formData.remainingAmount || 0} readOnly className={`${inp} bg-white`} />
                </div>
              </>
            )}
            {formData.paymentMode === 'Online' && (
              <div>
                <label className={lbl}>Bank</label>
                <select value={formData.bankId || ''} onChange={e => {
                  const bank = banks.find(b => b.id === e.target.value);
                  setFormData({ bankId: bank?.id, bankName: bank?.name, bankAccountNumber: bank?.accountNumber });
                }} className={inp}>
                  <option value="">Select bank</option>
                  {banks.map(b => <option key={b.id} value={b.id}>{b.name} — {b.accountNumber}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className={lbl}>Collection Method</label>
              <select value={formData.collectionMethod || 'Self Collection'} onChange={e => setFormData({ collectionMethod: e.target.value as any })} className={inp}>
                {collectionMethods.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Deduction Charges</label>
              <input type="number" value={formData.deductionCharges || 0} readOnly className={`${inp} bg-white`} />
            </div>
          </div>
        </div>

        {/* Total & Save */}
        <div className="bg-indigo-50 rounded-xl p-5">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
            <span className="text-3xl font-bold text-[#4f46e5]">{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={handleCancel} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] disabled:opacity-50 transition-colors font-semibold">
              {isSaving
                ? <><Loader2 size={18} className="animate-spin" /> Saving...</>
                : isEditing ? 'Update Invoice' : 'Create Invoice'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}