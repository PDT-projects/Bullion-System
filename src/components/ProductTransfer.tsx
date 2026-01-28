import { useState } from 'react';
import { Product, ProductTransfer } from '../App';
import { Plus, Eye, Trash2, X, ArrowRightLeft, Package, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

type ProductTransferProps = {
  products: Product[];
  setProducts: (products: Product[]) => void;
  transfers: ProductTransfer[];
  setTransfers: (transfers: ProductTransfer[]) => void;
};

const locations = ['Islamabad', 'Karachi', 'Lahore', 'Bullion RND/SITE'];

export function ProductTransfers({ products, setProducts, transfers, setTransfers }: ProductTransferProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewTransfer, setViewTransfer] = useState<ProductTransfer | null>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    productId: '',
    fromLocation: '',
    toLocation: '',
    quantity: 1,
    transferredBy: '',
    note: ''
  });

  const [selectedSerials, setSelectedSerials] = useState<string[]>([]);
  const [receiptName, setReceiptName] = useState<string>('');
  const [receiptType, setReceiptType] = useState<string>('');
  const [receiptDataUrl, setReceiptDataUrl] = useState<string>('');

  const handleAdd = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      productId: '',
      fromLocation: '',
      toLocation: '',
      quantity: 1,
      transferredBy: '',
      note: ''
    });
    setSelectedSerials([]);
    setReceiptName('');
    setReceiptType('');
    setReceiptDataUrl('');
    setIsModalOpen(true);
  };

  const handleReceiptChange = (file?: File) => {
    if (!file) {
      setReceiptName('');
      setReceiptType('');
      setReceiptDataUrl('');
      return;
    }

    const isAllowed =
      file.type === 'application/pdf' ||
      file.type === 'image/jpeg' ||
      file.type === 'image/jpg' ||
      file.type === 'image/png';

    if (!isAllowed) {
      toast.error('Receipt must be a PDF, JPG, or PNG file');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setReceiptName(file.name);
      setReceiptType(file.type);
      setReceiptDataUrl(String(reader.result || ''));
      toast.success('Receipt attached');
    };
    reader.onerror = () => toast.error('Failed to read receipt file');
    reader.readAsDataURL(file);
  };

  const getAvailableSerials = () => {
    if (!formData.productId || !formData.fromLocation) return [];
    
    const product = products.find(p => p.id === formData.productId);
    if (!product) return [];

    return product.serialNumbers?.filter(serial => {
      const cityMatch = product.serialCities?.[serial] === formData.fromLocation;
      const status = product.serialStatus?.[serial] || 'Available';
      // Only allow serials that are physically at source and not in transit/damaged
      return cityMatch && status !== 'In Transit' && status !== 'Damaged';
    }) || [];
  };

  const getProductStockByLocation = (productId: string, location: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return 0;
    
    return product.serialNumbers?.filter(serial => 
      product.serialCities?.[serial] === location
    ).length || 0;
  };

  const handleQuantityChange = (newQuantity: number) => {
    const availableSerials = getAvailableSerials();
    setFormData({ ...formData, quantity: newQuantity });
    
    if (newQuantity > selectedSerials.length) {
      setSelectedSerials([...selectedSerials, ...Array(newQuantity - selectedSerials.length).fill('')]);
    } else {
      setSelectedSerials(selectedSerials.slice(0, newQuantity));
    }
  };

  const updateSerial = (index: number, value: string) => {
    const newSerials = [...selectedSerials];
    newSerials[index] = value;
    setSelectedSerials(newSerials);
  };

  const handleSave = () => {
    if (!formData.productId || !formData.fromLocation || !formData.toLocation || !formData.transferredBy) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.fromLocation === formData.toLocation) {
      toast.error('From and To locations must be different');
      return;
    }

    const validSerials = selectedSerials.filter(s => s.trim() !== '');
    if (validSerials.length !== formData.quantity) {
      toast.error('Please select all serial numbers');
      return;
    }

    const product = products.find(p => p.id === formData.productId);
    if (!product) return;

    // Create transfer record in Pending state
    const newTransfer: ProductTransfer = {
      id: Date.now().toString(),
      date: formData.date,
      productId: formData.productId,
      productName: `${product.brandName} ${product.modelName}`,
      brandName: product.brandName,
      modelName: product.modelName,
      serialNumbers: validSerials,
      fromLocation: formData.fromLocation,
      toLocation: formData.toLocation,
      quantity: formData.quantity,
      transferredBy: formData.transferredBy,
      note: formData.note,
      status: 'Pending',
      receiptName: receiptDataUrl ? receiptName : undefined,
      receiptType: receiptDataUrl ? receiptType : undefined,
      receiptDataUrl: receiptDataUrl || undefined,
    };

    // Mark selected serials as In Transit and remove them from source city inventory
    const updatedProducts = products.map(p => {
      if (p.id === formData.productId) {
        const newSerialCities = { ...p.serialCities };
        const newSerialStatus = { ...(p.serialStatus || {}) };

        validSerials.forEach(serial => {
          if (!serial) return;
          // Mark as in transit
          newSerialStatus[serial] = 'In Transit';
          // Remove from any concrete city so it doesn't count towards city stock
          newSerialCities[serial] = 'In Transit';
        });

        return { ...p, serialCities: newSerialCities, serialStatus: newSerialStatus };
      }
      return p;
    });

    setProducts(updatedProducts);
    setTransfers([newTransfer, ...transfers]);
    toast.success('Product transfer created and marked as In Transit');
    setIsModalOpen(false);
  };

  const handleMarkReceived = (transfer: ProductTransfer) => {
    if (transfer.status === 'Received') return;

    const updatedProducts = products.map((p: Product) => {
      if (p.id !== transfer.productId) return p;

      const newSerialCities = { ...p.serialCities };
      const newSerialStatus = { ...(p.serialStatus || {}) };

      transfer.serialNumbers.forEach(serial => {
        if (!serial) return;
        // Move serial to destination city and mark as Available
        newSerialCities[serial] = transfer.toLocation;
        newSerialStatus[serial] = 'Available';
      });

      return { ...p, serialCities: newSerialCities, serialStatus: newSerialStatus };
    });

    const updatedTransfers = transfers.map(t => 
      t.id === transfer.id 
        ? { ...t, status: 'Received', receivedAt: new Date().toISOString() } 
        : t
    );

    setProducts(updatedProducts);
    setTransfers(updatedTransfers);

    toast.success(
      `Transfer ${transfer.id} received at ${transfer.toLocation}. Inventory updated automatically.`
    );
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this transfer record?')) {
      setTransfers(transfers.filter(t => t.id !== id));
      toast.success('Transfer record deleted');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Product Transfer</h2>
          <p className="text-sm text-gray-600 mt-1">Transfer products between locations</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-[#4f46e5] text-white px-4 py-2 rounded-lg hover:bg-[#4338ca] transition-colors"
        >
          <Plus size={20} />
          New Transfer
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transferred By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transfers.map((transfer) => (
                <tr key={transfer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(transfer.date).toLocaleDateString('en-PK')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{transfer.productName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                      {transfer.fromLocation}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                      {transfer.toLocation}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transfer.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{transfer.transferredBy}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        transfer.status === 'Received'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {transfer.status === 'Received' ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <Clock size={14} />
                      )}
                      {transfer.status === 'Received' ? 'Received' : 'In Transit'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewTransfer(transfer)}
                        className="p-2 text-[#4f46e5] hover:bg-[#4f46e5]/10 rounded-lg transition-colors"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                      {transfer.status !== 'Received' && (
                        <button
                          onClick={() => handleMarkReceived(transfer)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Mark as Received"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(transfer.id)}
                        className="p-2 text-[#ef4444] hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {transfers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No transfers found. Click "New Transfer" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transfer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="text-[#4f46e5]" size={24} />
                <h3 className="text-xl font-bold">New Product Transfer</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
                  <select
                    value={formData.productId}
                    onChange={(e) => {
                      setFormData({ ...formData, productId: e.target.value, fromLocation: '', toLocation: '' });
                      setSelectedSerials([]);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                  >
                    <option value="">Select product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.brandName} {p.modelName} (Stock: {p.stock})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Location *</label>
                  <select
                    value={formData.fromLocation}
                    onChange={(e) => {
                      setFormData({ ...formData, fromLocation: e.target.value });
                      setSelectedSerials([]);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                  >
                    <option value="">Select location</option>
                    {locations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Location *</label>
                  <select
                    value={formData.toLocation}
                    onChange={(e) => setFormData({ ...formData, toLocation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                  >
                    <option value="">Select location</option>
                    {locations.filter(loc => loc !== formData.fromLocation).map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    max={getAvailableSerials().length}
                    value={formData.quantity}
                    onChange={(e) => handleQuantityChange(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                  />
                  {formData.productId && formData.fromLocation && (
                    <p className="text-xs text-gray-500 mt-1">
                      Available in {formData.fromLocation}: {getAvailableSerials().length}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transferred By *</label>
                  <input
                    type="text"
                    value={formData.transferredBy}
                    onChange={(e) => setFormData({ ...formData, transferredBy: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                    placeholder="e.g., Manager Ahmed"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Transfer Receipt (Optional)</label>
                <input
                  type="file"
                  accept="application/pdf,image/jpeg,image/jpg,image/png"
                  onChange={(e) => handleReceiptChange(e.target.files?.[0])}
                  className="w-full text-sm"
                />
                {receiptName && (
                  <p className="text-xs text-gray-600 mt-2">
                    Attached: <span className="font-medium">{receiptName}</span>
                  </p>
                )}
              </div>

              {/* Serial Number Selection */}
              {formData.productId && formData.fromLocation && formData.quantity > 0 && (
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Serial Numbers ({formData.quantity} required)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: formData.quantity }).map((_, index) => (
                      <select
                        key={index}
                        value={selectedSerials[index] || ''}
                        onChange={(e) => updateSerial(index, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] text-sm"
                      >
                        <option value="">Select serial #{index + 1}</option>
                        {getAvailableSerials().map(serial => (
                          <option
                            key={serial}
                            value={serial}
                            disabled={selectedSerials.includes(serial) && selectedSerials[index] !== serial}
                          >
                            {serial}
                          </option>
                        ))}
                      </select>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] resize-none"
                  placeholder="Additional notes about the transfer"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors"
              >
                Complete Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Transfer Modal */}
      {viewTransfer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Transfer Details</h3>
              <button onClick={() => setViewTransfer(null)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium text-gray-900">{new Date(viewTransfer.date).toLocaleDateString('en-PK')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Product</p>
                  <p className="font-medium text-gray-900">{viewTransfer.productName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">From Location</p>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                    {viewTransfer.fromLocation}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">To Location</p>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    {viewTransfer.toLocation}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Quantity</p>
                  <p className="font-medium text-gray-900">{viewTransfer.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Transferred By</p>
                  <p className="font-medium text-gray-900">{viewTransfer.transferredBy}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-2">Serial Numbers</p>
                <div className="flex flex-wrap gap-2">
                  {viewTransfer.serialNumbers.map((serial, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-[#4f46e5]/10 text-[#4f46e5] rounded-lg text-sm font-mono">
                      <Package size={14} />
                      {serial}
                    </span>
                  ))}
                </div>
              </div>

              {viewTransfer.receiptDataUrl && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2">Receipt</p>
                  <div className="flex items-center gap-3">
                    <a
                      href={viewTransfer.receiptDataUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-[#4f46e5] hover:underline"
                    >
                      View
                    </a>
                    <a
                      href={viewTransfer.receiptDataUrl}
                      download={viewTransfer.receiptName || `transfer-${viewTransfer.id}-receipt`}
                      className="text-sm text-green-700 hover:underline"
                    >
                      Download
                    </a>
                    {viewTransfer.receiptName && (
                      <span className="text-xs text-gray-500">{viewTransfer.receiptName}</span>
                    )}
                  </div>
                </div>
              )}

              {viewTransfer.note && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-1">Note</p>
                  <p className="font-medium text-gray-900">{viewTransfer.note}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}