import React from 'react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Plus, Trash2, Edit3 } from 'lucide-react';
// import type { Model } from '../../../../api/dataconnect/brandModelDataConnectService';
import type { Model } from '../../../api/dataconnect/brandModelDataConnectService';
interface MultiModelRow {
  modelId: string;
  modelName: string;
  costPrice: number;
  salePrice: number;
  quantity: number;
}

interface MultiModelInventoryTableProps {
  models: MultiModelRow[];
  onUpdateModel: (index: number, field: 'salePrice' | 'quantity', value: number) => void;
  onAddModel: () => void;
  onRemoveModel: (index: number) => void;
  onEditModel: (index: number) => void;
}

export const MultiModelInventoryTable: React.FC<MultiModelInventoryTableProps> = ({
  models,
  onUpdateModel,
  onAddModel,
  onRemoveModel,
  onEditModel
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-900">Selected Models</h4>
        <Button onClick={onAddModel} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Model
        </Button>
      </div>

      {models.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No models selected. Add models using the brand/model dropdown above.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-semibold text-gray-900 w-48">Model</th>
                <th className="text-right p-3 font-semibold text-gray-900">DC Cost (PKR)</th>
                <th className="text-right p-3 font-semibold text-gray-900">Sale Price</th>
                <th className="text-right p-3 font-semibold text-gray-900">Qty</th>
                <th className="text-right p-3 font-semibold text-gray-900 w-24">Total Sale</th>
                <th className="w-16 p-3"></th>
              </tr>
            </thead>
            <tbody>
              {models.map((model, index) => (
                <tr key={model.modelId} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="p-3 font-medium">{model.modelName}</td>
                  <td className="p-3 text-right">
                    <Badge variant="secondary" className="text-xs">
                      PKR {model.costPrice.toLocaleString()}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={model.salePrice}
                      onChange={(e) => onUpdateModel(index, 'salePrice', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className="w-24 text-right border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={model.quantity}
                      onChange={(e) => onUpdateModel(index, 'quantity', parseInt(e.target.value) || 0)}
                      min="1"
                      className="w-20 text-right border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="p-3 text-right font-semibold text-lg text-green-600">
                    PKR {(model.salePrice * model.quantity).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditModel(index)}
                        title="Edit model"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveModel(index)}
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t font-bold bg-gray-50">
                <td colSpan={4} className="p-3 text-right">Grand Total:</td>
                <td className="p-3 text-right text-2xl text-green-700">
                  PKR {models.reduce((sum, m) => sum + (m.salePrice * m.quantity), 0).toLocaleString()}
                </td>
                <td className="p-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

