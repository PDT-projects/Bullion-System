import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Product } from '../App';
import { mockProductStockData, mockCategoryData, mockProducts } from '../mockData';

type InventoryChartsProps = {
  products: Product[];
};

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function InventoryCharts({ products }: InventoryChartsProps) {
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  // Prepare data for bar chart (Product vs Stock)
  const productStockData = products.map(product => ({
    name: `${product.brandName} ${product.modelName}`,
    stock: product.stock,
    category: product.category,
    lowStock: product.stock < 5 // Highlight low stock items
  }));

  // Prepare data for pie chart (Category distribution)
  const categoryData = products.reduce((acc, product) => {
    const existing = acc.find(item => item.name === product.category);
    if (existing) {
      existing.value += product.stock;
    } else {
      acc.push({
        name: product.category,
        value: product.stock
      });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  // Use mock data if no real data available
  const finalProductStockData = productStockData.length > 0 ? productStockData : mockProductStockData;
  const finalCategoryData = categoryData.length > 0 ? categoryData : mockCategoryData;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <h3 className="font-semibold text-lg mb-4">Date Range Filter</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
            />
          </div>
        </div>
      </div>

      {/* Product Stock Bar Chart */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="font-bold text-lg mb-4">Product Stock Levels</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={productStockData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              stroke="#9ca3af"
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              formatter={(value: number, name: string) => [value, 'Stock Quantity']}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
            <Legend />
            <Bar
              dataKey="stock"
              fill="#4f46e5"
              name="Stock Quantity"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 text-sm text-gray-600">
          <p><span className="inline-block w-3 h-3 bg-red-500 rounded mr-2"></span>Low stock items (less than 5 units)</p>
        </div>
      </div>

      {/* Category Distribution Pie Chart */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="font-bold text-lg mb-4">Inventory Distribution by Category</h3>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={finalCategoryData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [value, 'Total Stock']}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Low Stock Alert */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="font-bold text-lg mb-4 text-red-600">Low Stock Alert</h3>
        <div className="space-y-2">
          {products.filter(p => p.stock < 5).map(product => (
            <div key={product.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <div>
                <p className="font-medium text-red-800">{product.brandName} {product.modelName}</p>
                <p className="text-sm text-red-600">Category: {product.category}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-red-800">{product.stock} units</p>
                <p className="text-sm text-red-600">Low stock!</p>
              </div>
            </div>
          ))}
          {products.filter(p => p.stock < 5).length === 0 && (
            <p className="text-green-600 text-center py-4">All products are well-stocked!</p>
          )}
        </div>
      </div>
    </div>
  );
}
