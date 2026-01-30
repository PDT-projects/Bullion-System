import { useState } from 'react';
import { Product, ProductTransfer } from '../App';
import { Plus, Eye, Trash2, X, ArrowRightLeft, Package, CheckCircle2, Clock, Maximize2, Minimize2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { jsPDF } from 'jspdf';

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
  const [isFullScreen, setIsFullScreen] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    productId: '', // kept for backward compat when single-item used
    fromLocation: '',
    toLocation: '',
    quantity: 1,
    transferredBy: '',
    note: ''
  });

  // legacy single-selected serials removed; using `transferItems` instead for per-line serials
  const [receiptName, setReceiptName] = useState<string>('');
  const [receiptType, setReceiptType] = useState<string>('');
  const [receiptDataUrl, setReceiptDataUrl] = useState<string>('');

  // Support multiple products per transfer: each item has productId, quantity and selected serials
  const [transferItems, setTransferItems] = useState<Array<{ productId: string; quantity: number; selectedSerials: string[] }>>([
    { productId: '', quantity: 1, selectedSerials: [] }
  ]);

  const [showSummary, setShowSummary] = useState(false);

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
    // reset line items
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

    const isAllowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(file.type);
    const maxSize = 5 * 1024 * 1024; // 5MB limit

    if (!isAllowed) {
      toast.error('Receipt must be a PDF, JPG, or PNG file');
      return;
    }

    if (file.size > maxSize) {
      toast.error('Receipt must be smaller than 5MB');
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

  const getAvailableSerials = (productId?: string, location?: string) => {
    const pid = productId || formData.productId;
    const loc = location || formData.fromLocation;
    if (!pid || !loc) return [];

    const product = products.find(p => p.id === pid);
    if (!product) return [];

    return product.serialNumbers?.filter(serial => {
      const cityMatch = product.serialCities?.[serial] === loc;
      const status = product.serialStatus?.[serial] || 'Available';
      return cityMatch && status !== 'In Transit' && status !== 'Damaged' && status !== 'Returned';
    }) || [];
  };

  const getProductStockByLocation = (productId: string, location: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return 0;
    return product.serialNumbers?.filter(serial => product.serialCities?.[serial] === location).length || 0;
  };

  const handleQuantityChange = (index: number, newQuantity: number) => {
    const items = [...transferItems];
    items[index] = { ...items[index], quantity: newQuantity };
    // adjust serials array length
    if (items[index].selectedSerials.length < newQuantity) {
      items[index].selectedSerials = [...items[index].selectedSerials, ...Array(newQuantity - items[index].selectedSerials.length).fill('')];
    } else {
      items[index].selectedSerials = items[index].selectedSerials.slice(0, newQuantity);
    }
    setTransferItems(items);
  };

  const updateSerial = (lineIndex: number, serialIndex: number, value: string) => {
    const items = [...transferItems];
    items[lineIndex].selectedSerials[serialIndex] = value;
    setTransferItems(items);
  };

  const handleSave = () => {
    if (!formData.fromLocation || !formData.toLocation || !formData.transferredBy) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.fromLocation === formData.toLocation) {
      toast.error('From and To locations must be different');
      return;
    }
    // Validate all transfer lines
    for (let i = 0; i < transferItems.length; i++) {
      const item = transferItems[i];
      if (!item.productId || item.quantity < 1) {
        toast.error('Please select product and quantity for all lines');
        return;
      }
      const validSerials = (item.selectedSerials || []).filter(s => s && s.trim() !== '');
      if (validSerials.length !== item.quantity) {
        toast.error('Please select all serial numbers for each product line');
        return;
      }
    }

    const newTransfer: ProductTransfer = {
      id: Date.now().toString(),
      date: formData.date,
      // product-level fields kept for compatibility - set to first item's product
      productId: transferItems[0].productId,
      productName: (() => {
        const p = products.find(pp => pp.id === transferItems[0].productId);
        return p ? `${p.brandName} ${p.modelName}` : '';
      })(),
      brandName: '',
      modelName: '',
      serialNumbers: transferItems.flatMap(it => it.selectedSerials.filter(Boolean)),
      fromLocation: formData.fromLocation,
      toLocation: formData.toLocation,
      quantity: transferItems.reduce((s, it) => s + it.quantity, 0),
      transferredBy: formData.transferredBy,
      note: formData.note,
      status: 'Pending',
      receiptName: receiptDataUrl ? receiptName : undefined,
      receiptType: receiptDataUrl ? receiptType : undefined,
      receiptDataUrl: receiptDataUrl || undefined,
    };

    // Update all affected products serials to In Transit
    const updatedProducts = products.map(p => {
      const item = transferItems.find(it => it.productId === p.id);
      if (!item) return p;
      const newSerialCities = { ...p.serialCities };
      const newSerialStatus = { ...(p.serialStatus || {}) };

      item.selectedSerials.forEach(serial => {
        if (!serial) return;
        newSerialStatus[serial] = 'In Transit';
        newSerialCities[serial] = 'In Transit';
      });

      return { ...p, serialCities: newSerialCities, serialStatus: newSerialStatus };
    });

    setProducts(updatedProducts);
    setTransfers([newTransfer, ...transfers]);
    toast.success('Product transfer created and marked as In Transit');
    setIsModalOpen(false);
    setTransferItems([{ productId: '', quantity: 1, selectedSerials: [] }]);
  };

  // Generate a simple PDF preview for the transfer
  const generatePDF = (transfer: ProductTransfer) => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const left = 40;
    let y = 40;
    doc.setFontSize(14);
    doc.text(`Transfer ID: ${transfer.id}`, left, y);
    y += 20;
    doc.setFontSize(12);
    doc.text(`Date: ${new Date(transfer.date).toLocaleString()}`, left, y);
    y += 18;
    doc.text(`From: ${transfer.fromLocation}`, left, y);
    y += 16;
    doc.text(`To: ${transfer.toLocation}`, left, y);
    y += 16;
    doc.text(`Transferred By: ${transfer.transferredBy}`, left, y);
    y += 24;

    doc.setFontSize(13);
    doc.text('Items:', left, y);
    y += 18;

    transfer.serialNumbers.forEach((s, idx) => {
      doc.text(`${idx + 1}. ${s}`, left + 10, y);
      y += 14;
      if (y > 740) {
        doc.addPage();
        y = 40;
      }
    });

    y += 10;
    doc.setFontSize(11);
    doc.text(`Status: ${transfer.status || 'Pending'}`, left, y);
    return doc;
  };

  const handleMarkReceived = (transfer: ProductTransfer) => {
    if (transfer.status === 'Received') return;

    const updatedProducts = products.map((p: Product) => {
      const newSerialCities = { ...p.serialCities };
      const newSerialStatus = { ...(p.serialStatus || {}) };

      transfer.serialNumbers.forEach(serial => {
        if (!serial) return;
        // If this product includes the serial, move it
        if (p.serialNumbers.includes(serial)) {
          newSerialCities[serial] = transfer.toLocation;
          newSerialStatus[serial] = 'Available';
        }
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
        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 ${isFullScreen ? 'p-0' : ''}`}>
          <div className={`bg-white rounded-lg ${isFullScreen ? 'w-full h-full max-w-none max-h-none' : 'max-w-3xl w-full max-h-[90vh]'} overflow-y-auto`}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="text-[#4f46e5]" size={24} />
                <h3 className="text-xl font-bold">New Product Transfer</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                  title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
                >
                  {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Location *</label>
                  <select
                    value={formData.fromLocation}
                    onChange={(e) => setFormData({ ...formData, fromLocation: e.target.value })}
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

              {/* Transfer lines - multiple products */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Items to Transfer</label>
                <div className="space-y-3">
                  {transferItems.map((line, li) => (
                    <div key={li} className="grid grid-cols-12 gap-2 items-start">
                      <div className="col-span-5">
                        <select
                          value={line.productId}
                          onChange={(e) => {
                            const items = [...transferItems];
                            items[li].productId = e.target.value;
                            items[li].selectedSerials = [];
                            setTransferItems(items);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="">Select product</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.brandName} {p.modelName} (Stock: {getProductStockByLocation(p.id, formData.fromLocation || '')})</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(e) => handleQuantityChange(li, Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div className="col-span-4">
                        <div className="grid grid-cols-2 gap-2">
                          {Array.from({ length: line.quantity }).map((_, si) => (
                            <select
                              key={si}
                              value={line.selectedSerials[si] || ''}
                              onChange={(e) => updateSerial(li, si, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            >
                              <option value="">Select serial</option>
                              {getAvailableSerials(line.productId, formData.fromLocation).map(serial => (
                                <option key={serial} value={serial} disabled={transferItems.some((it, idx) => idx !== li && it.selectedSerials.includes(serial))}>{serial}</option>
                              ))}
                            </select>
                          ))}
                        </div>
                      </div>
                      <div className="col-span-1 flex gap-2">
                        <button
                          onClick={() => {
                            const items = transferItems.filter((_, idx) => idx !== li);
                            setTransferItems(items.length ? items : [{ productId: '', quantity: 1, selectedSerials: [] }]);
                          }}
                          className="px-2 py-1 text-sm text-red-600 bg-red-50 rounded"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}

                  <div>
                    <button
                      onClick={() => setTransferItems([...transferItems, { productId: '', quantity: 1, selectedSerials: [] }])}
                      className="px-3 py-2 bg-[#eef2ff] text-[#4f46e5] rounded text-sm"
                    >
                      Add Item
                    </button>
                  </div>
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
                {receiptDataUrl && (
                  <div className="mt-2 flex items-center gap-3">
                    {receiptType.startsWith('image/') ? (
                      <img src={receiptDataUrl} alt={receiptName} className="w-20 h-20 object-cover rounded" />
                    ) : (
                      <div className="w-20 h-20 flex items-center justify-center bg-gray-100 rounded text-sm">PDF</div>
                    )}
                    <div className="text-sm">
                      <div className="font-medium">{receiptName}</div>
                      <a href={receiptDataUrl} download={receiptName} className="text-green-700 hover:underline">Download</a>
                    </div>
                  </div>
                )}
              </div>

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
                onClick={() => setShowSummary(true)}
                className="px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors"
              >
                Complete Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Summary / PDF Preview Modal */}
      {showSummary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Transfer Summary</h3>
              <button onClick={() => setShowSummary(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">From: <span className="font-medium">{formData.fromLocation}</span> — To: <span className="font-medium">{formData.toLocation}</span></p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Product</th>
                      <th className="px-3 py-2 text-left">Qty</th>
                      <th className="px-3 py-2 text-left">Serials</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transferItems.map((it, idx) => {
                      const p = products.find(pp => pp.id === it.productId);
                      return (
                        <tr key={idx} className="border-b">
                          <td className="px-3 py-2">{p ? `${p.brandName} ${p.modelName}` : '—'}</td>
                          <td className="px-3 py-2">{it.quantity}</td>
                          <td className="px-3 py-2">{it.selectedSerials.join(', ')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => {
                    // create a temporary transfer object to preview PDF
                    const tmpTransfer: ProductTransfer = {
                      id: Date.now().toString(),
                      date: formData.date,
                      productId: transferItems[0]?.productId || '',
                      productName: products.find(p=>p.id===transferItems[0]?.productId)?.brandName || '',
                      brandName: '',
                      modelName: '',
                      serialNumbers: transferItems.flatMap(it => it.selectedSerials.filter(Boolean)),
                      fromLocation: formData.fromLocation,
                      toLocation: formData.toLocation,
                      quantity: transferItems.reduce((s, it) => s + it.quantity, 0),
                      transferredBy: formData.transferredBy,
                      note: formData.note,
                      status: 'Pending',
                    };
                    const doc = generatePDF(tmpTransfer);
                    window.open(doc.output('bloburl'));
                  }}
                  className="px-3 py-2 bg-white border rounded"
                >
                  Preview PDF
                </button>
                <button
                  onClick={() => {
                    const tmpTransfer: ProductTransfer = {
                      id: Date.now().toString(),
                      date: formData.date,
                      productId: transferItems[0]?.productId || '',
                      productName: products.find(p=>p.id===transferItems[0]?.productId)?.brandName || '',
                      brandName: '',
                      modelName: '',
                      serialNumbers: transferItems.flatMap(it => it.selectedSerials.filter(Boolean)),
                      fromLocation: formData.fromLocation,
                      toLocation: formData.toLocation,
                      quantity: transferItems.reduce((s, it) => s + it.quantity, 0),
                      transferredBy: formData.transferredBy,
                      note: formData.note,
                      status: 'Pending',
                    };
                    const doc = generatePDF(tmpTransfer);
                    doc.save(`transfer-${tmpTransfer.id}.pdf`);
                  }}
                  className="px-3 py-2 bg-[#4f46e5] text-white rounded"
                >
                  Download PDF
                </button>
                <button
                  onClick={() => {
                    // Confirm and save transfer
                    handleSave();
                    setShowSummary(false);
                  }}
                  className="px-3 py-2 bg-green-600 text-white rounded"
                >
                  Confirm Transfer
                </button>
              </div>
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