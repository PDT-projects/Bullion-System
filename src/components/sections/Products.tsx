import { useState } from "react";
import { Plus, Eye, Edit, Trash2, Search, Package } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";

interface Product {
  id: number;
  name: string;
  category: string;
  sku: string;
  price: number;
  stock: number;
  description: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

const initialProducts: Product[] = [
  {
    id: 1,
    name: 'Metal Detector - Pro Series',
    category: 'Detection Equipment',
    sku: 'MDT-PRO-001',
    price: 125000,
    stock: 15,
    description: 'Professional grade metal detector with advanced sensitivity',
    status: 'In Stock'
  },
  {
    id: 2,
    name: 'Gold Scanner - Advanced',
    category: 'Precious Metal Detection',
    sku: 'GLD-ADV-002',
    price: 285000,
    stock: 5,
    description: 'High-precision gold detection system',
    status: 'Low Stock'
  },
  {
    id: 3,
    name: 'Security Scanner - Commercial',
    category: 'Security Equipment',
    sku: 'SEC-COM-003',
    price: 450000,
    stock: 8,
    description: 'Commercial grade security scanning equipment',
    status: 'In Stock'
  },
  {
    id: 4,
    name: 'Underground Detector',
    category: 'Detection Equipment',
    sku: 'UND-DET-004',
    price: 195000,
    stock: 0,
    description: 'Deep ground metal detection system',
    status: 'Out of Stock'
  },
  {
    id: 5,
    name: 'Handheld Scanner',
    category: 'Portable Equipment',
    sku: 'HND-SCN-005',
    price: 45000,
    stock: 25,
    description: 'Portable handheld metal detector',
    status: 'In Stock'
  },
];

export function Products() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    sku: '',
    price: '',
    stock: '',
    description: '',
    status: 'In Stock' as 'In Stock' | 'Low Stock' | 'Out of Stock'
  });

  const handleAddProduct = () => {
    const newProduct: Product = {
      id: products.length + 1,
      name: formData.name,
      category: formData.category,
      sku: formData.sku,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      description: formData.description,
      status: formData.status
    };
    setProducts([...products, newProduct]);
    setIsAddModalOpen(false);
    setFormData({
      name: '',
      category: '',
      sku: '',
      price: '',
      stock: '',
      description: '',
      status: 'In Stock'
    });
    toast.success('Product added successfully');
  };

  const handleEditProduct = () => {
    if (editProduct) {
      setProducts(products.map(prod => 
        prod.id === editProduct.id 
          ? { 
              ...editProduct, 
              ...formData, 
              price: parseFloat(formData.price),
              stock: parseInt(formData.stock)
            }
          : prod
      ));
      setEditProduct(null);
      setFormData({
        name: '',
        category: '',
        sku: '',
        price: '',
        stock: '',
        description: '',
        status: 'In Stock'
      });
      toast.success('Product updated successfully');
    }
  };

  const handleDeleteProduct = (id: number) => {
    setProducts(products.filter(prod => prod.id !== id));
    toast.success('Product deleted successfully');
  };

  const openEditModal = (product: Product) => {
    setEditProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      sku: product.sku,
      price: product.price.toString(),
      stock: product.stock.toString(),
      description: product.description,
      status: product.status
    });
  };

  const filteredProducts = products.filter(prod =>
    prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prod.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prod.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'In Stock':
        return 'default';
      case 'Low Stock':
        return 'secondary';
      case 'Out of Stock':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-1">Manage your product inventory</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#4f46e5] hover:bg-[#4338ca]">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter product name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Detection Equipment">Detection Equipment</SelectItem>
                    <SelectItem value="Precious Metal Detection">Precious Metal Detection</SelectItem>
                    <SelectItem value="Security Equipment">Security Equipment</SelectItem>
                    <SelectItem value="Portable Equipment">Portable Equipment</SelectItem>
                    <SelectItem value="Accessories">Accessories</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="SKU-XXX-000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (PKR)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="Enter price"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="Enter stock quantity"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter product description"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
              <Button className="bg-[#4f46e5] hover:bg-[#4338ca]" onClick={handleAddProduct}>
                Add Product
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Products</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{products.length}</h3>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <Package className="w-6 h-6 text-[#4f46e5]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">In Stock</p>
                <h3 className="text-2xl font-bold text-[#10b981] mt-1">
                  {products.filter(p => p.status === 'In Stock').length}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
                <Package className="w-6 h-6 text-[#10b981]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Low Stock</p>
                <h3 className="text-2xl font-bold text-orange-500 mt-1">
                  {products.filter(p => p.status === 'Low Stock').length}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center">
                <Package className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Out of Stock</p>
                <h3 className="text-2xl font-bold text-[#ef4444] mt-1">
                  {products.filter(p => p.status === 'Out of Stock').length}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center">
                <Package className="w-6 h-6 text-[#ef4444]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search products by name, category, or SKU..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Products ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.category}</Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">{product.sku}</TableCell>
                  <TableCell className="font-semibold">PKR {product.price.toLocaleString()}</TableCell>
                  <TableCell>{product.stock} units</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(product.status)}>
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setViewProduct(product)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Product Details</DialogTitle>
                          </DialogHeader>
                          {viewProduct && (
                            <div className="space-y-4 py-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                  <p className="text-sm text-gray-500">Product Name</p>
                                  <p className="font-medium text-lg">{viewProduct.name}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Category</p>
                                  <p className="font-medium">{viewProduct.category}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">SKU</p>
                                  <p className="font-medium">{viewProduct.sku}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Price</p>
                                  <p className="font-medium">PKR {viewProduct.price.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Stock</p>
                                  <p className="font-medium">{viewProduct.stock} units</p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-sm text-gray-500">Status</p>
                                  <Badge variant={getStatusVariant(viewProduct.status)} className="mt-1">
                                    {viewProduct.status}
                                  </Badge>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-sm text-gray-500">Description</p>
                                  <p className="font-medium">{viewProduct.description}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Dialog open={editProduct?.id === product.id} onOpenChange={(open) => !open && setEditProduct(null)}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEditModal(product)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Edit Product</DialogTitle>
                          </DialogHeader>
                          <div className="grid grid-cols-2 gap-4 py-4">
                            <div className="space-y-2 col-span-2">
                              <Label htmlFor="edit-name">Product Name</Label>
                              <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-category">Category</Label>
                              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Detection Equipment">Detection Equipment</SelectItem>
                                  <SelectItem value="Precious Metal Detection">Precious Metal Detection</SelectItem>
                                  <SelectItem value="Security Equipment">Security Equipment</SelectItem>
                                  <SelectItem value="Portable Equipment">Portable Equipment</SelectItem>
                                  <SelectItem value="Accessories">Accessories</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-sku">SKU</Label>
                              <Input
                                id="edit-sku"
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-price">Price (PKR)</Label>
                              <Input
                                id="edit-price"
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-stock">Stock Quantity</Label>
                              <Input
                                id="edit-stock"
                                type="number"
                                value={formData.stock}
                                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2 col-span-2">
                              <Label htmlFor="edit-description">Description</Label>
                              <Textarea
                                id="edit-description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setEditProduct(null)}>Cancel</Button>
                            <Button className="bg-[#4f46e5] hover:bg-[#4338ca]" onClick={handleEditProduct}>
                              Save Changes
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <Trash2 className="w-4 h-4 text-[#ef4444]" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
