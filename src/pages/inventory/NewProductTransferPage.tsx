import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, ProductTransfer } from '../../App';
import { ArrowRightLeft, X, Package, Maximize2, Minimize2 } from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { mockData } from '../../mockData';

const locations = ['Islamabad', 'Karachi', 'Lahore', 'Bullion RND/SITE'];

export function NewProductTransferPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>(mockData.products);
  const [transfers, setTransfers] = useState<ProductTransfer[]>(mockData.productTransfers);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    fromLocation: '',
    toLocation: '',
    quantity: 1,
    transferredBy: '',
    note: ''
  });

  const [receiptName, setReceiptName] = useState<string>('');
  const [receiptType, setReceiptType] = useState<string>('');
  const [receiptDataUrl, setReceiptDataUrl] = useState<string>('');

  const [transferItems, setTransferItems] = useState<Array<{ productId: string; quantity: number; selectedSerials: string[] }>>([
    { productId: '', quantity: 1, selectedSerials: [] }
  ]);

  const [showSummary, setShowSummary] = useState(false);

  const handleReceiptChange = (file?: File) => {
    if (!file) {
      setReceiptName('');
      setReceiptType('');
      setReceiptDataUrl('');
      return;
    }

    const isAllowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(file.type);
    const maxSize = 5 * 1024 * 1024;

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
    const pid = productId;
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
    navigate('/product-transfer');
  };

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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">New Product Transfer</h2>
          <p className="text-sm text-gray-600 mt-1">Create a new product transfer between locations</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-2 text-gray-500 hover:text-gray-700"
            title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
          >
            {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          <button
            onClick={() => navigate('/product-transfer')}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${isFullScreen ? 'p-6' : 'p-6'}`}>
        <div className="grid grid-cols-2 gap-4 mb-6">
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
        <div className="border-t pt-4 mb-6">
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

        <div className="border-t pt-4 mb-6">
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

        <div className="border-t pt-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
          <textarea
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] resize-none"
            placeholder="Additional notes about the transfer"
          />
        </div>

        {/* Transfer Summary */}
        {showSummary && (
          <div className="border-t pt-4 mb-6">
            <h3 className="text-lg font-medium mb-4">Transfer Summary</h3>
            <p className="text-sm text-gray-600 mb-4">From: <span className="font-medium">{formData.fromLocation}</span> — To: <span className="font-medium">{formData.toLocation}</span></p>
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
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-4 border-t">
          <div className="flex items-center gap-3">
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
                window.open(doc.output('bloburl'));
              }}
              className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
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
              className="px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca]"
            >
              Download PDF
            </button>
          </div>
          <div className="flex items-center gap-3">
            {!showSummary ? (
              <button
                onClick={() => setShowSummary(true)}
                className="px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca]"
              >
                Review & Create
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowSummary(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Edit
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Confirm Transfer
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
