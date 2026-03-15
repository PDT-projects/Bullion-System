// Inventory Module - Model Layer
// InventoryService - Business logic, data manipulation, and utilities

import {
  Product, ProductTransfer, CreateProductDTO, UpdateProductDTO,
  CreateTransferDTO, ProductFilters, TransferFilters, ProductStats,
  TransferStats, ValidationResult, SerialStatus, CreatePaymentDTO
} from './types';

export class InventoryService {

  // ==================== PRODUCT OPERATIONS ====================

  static filterProducts(products: Product[], filters: ProductFilters): Product[] {
    return products.filter(product => {
      const matchesBrand = !filters.brandSearch ||
        product.brandName.toLowerCase().includes(filters.brandSearch.toLowerCase());
      const matchesModel = !filters.modelSearch ||
        product.modelName.toLowerCase().includes(filters.modelSearch.toLowerCase());
      const matchesCategory = !filters.categoryFilter ||
        product.category === filters.categoryFilter;
      const matchesStatus = !filters.statusFilter ||
        product.status === filters.statusFilter;
      const matchesBuyType = !filters.buyTypeFilter ||
        product.buyType === filters.buyTypeFilter;
      const matchesMinPrice = filters.minPrice === null ||
        product.sellPrice >= filters.minPrice;
      const matchesMaxPrice = filters.maxPrice === null ||
        product.sellPrice <= filters.maxPrice;
      const matchesStock = filters.hasStock === null ||
        (filters.hasStock ? product.stock > 0 : product.stock === 0);
      return matchesBrand && matchesModel && matchesCategory &&
        matchesStatus && matchesBuyType && matchesMinPrice &&
        matchesMaxPrice && matchesStock;
    });
  }

  static createProduct(products: Product[], data: CreateProductDTO): Product[] {
    const newProduct: Product = {
      ...data,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      serialStatus: data.serialNumbers.reduce((acc, serial) => {
        acc[serial] = 'Available';
        return acc;
      }, {} as { [key: string]: SerialStatus })
    };
    return [...products, newProduct];
  }

  static updateProduct(products: Product[], id: string, data: UpdateProductDTO): Product[] {
    return products.map(product =>
      product.id === id
        ? { ...product, ...data, updatedAt: new Date().toISOString() }
        : product
    );
  }

  static deleteProduct(products: Product[], id: string): Product[] {
    return products.filter(product => product.id !== id);
  }

  static findProductById(products: Product[], id: string): Product | undefined {
    return products.find(product => product.id === id);
  }

  static addStock(products: Product[], id: string, quantity: number, serialNumbers: string[]): Product[] {
    return products.map(product => {
      if (product.id === id) {
        const newSerialStatus = { ...product.serialStatus };
        serialNumbers.forEach(serial => { newSerialStatus[serial] = 'Available'; });
        return {
          ...product,
          stock: product.stock + quantity,
          serialNumbers: [...product.serialNumbers, ...serialNumbers],
          serialStatus: newSerialStatus,
          updatedAt: new Date().toISOString()
        };
      }
      return product;
    });
  }

  // ==================== TRANSFER OPERATIONS ====================

  static filterTransfers(transfers: ProductTransfer[], filters: TransferFilters): ProductTransfer[] {
    return transfers.filter(transfer => {
      const matchesProduct = !filters.productSearch ||
        transfer.productName.toLowerCase().includes(filters.productSearch.toLowerCase());
      const matchesFrom = !filters.fromLocation ||
        transfer.fromLocation.toLowerCase().includes(filters.fromLocation.toLowerCase());
      const matchesTo = !filters.toLocation ||
        transfer.toLocation.toLowerCase().includes(filters.toLocation.toLowerCase());
      const matchesStatus = !filters.statusFilter ||
        transfer.status === filters.statusFilter;
      const matchesDateFrom = !filters.dateFrom ||
        new Date(transfer.date || transfer.transferDate || '') >= new Date(filters.dateFrom);
      const matchesDateTo = !filters.dateTo ||
        new Date(transfer.date || transfer.transferDate || '') <= new Date(filters.dateTo);
      return matchesProduct && matchesFrom && matchesTo &&
        matchesStatus && matchesDateFrom && matchesDateTo;
    });
  }

  static createTransfer(transfers: ProductTransfer[], data: CreateTransferDTO, productName: string): ProductTransfer[] {
    const newTransfer: ProductTransfer = {
      ...data,
      id: this.generateId(),
      productName,
      date: data.transferDate,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    return [...transfers, newTransfer];
  }

  static updateTransferStatus(transfers: ProductTransfer[], id: string, status: ProductTransfer['status']): ProductTransfer[] {
    return transfers.map(transfer =>
      transfer.id === id ? { ...transfer, status } : transfer
    );
  }

  static cancelTransfer(transfers: ProductTransfer[], id: string): ProductTransfer[] {
    return this.updateTransferStatus(transfers, id, 'Cancelled');
  }

  static completeTransfer(transfers: ProductTransfer[], id: string): ProductTransfer[] {
    return this.updateTransferStatus(transfers, id, 'Completed');
  }

  // ==================== STATISTICS ====================

  static calculateProductStats(products: Product[]): ProductStats {
    const categories: { [key: string]: number } = {};
    products.forEach(product => {
      categories[product.category] = (categories[product.category] || 0) + 1;
    });
    return {
      totalProducts: products.length,
      totalStock: products.reduce((sum, p) => sum + p.stock, 0),
      totalValue: products.reduce((sum, p) => sum + ((p.costPrice || 0) * p.stock), 0),
      newProducts: products.filter(p => p.status === 'New').length,
      inTransit: products.filter(p => p.status === 'In Transit').length,
      available: products.filter(p => p.status === 'Available').length,
      categories
    };
  }

  static calculateTransferStats(transfers: ProductTransfer[]): TransferStats {
    return {
      totalTransfers: transfers.length,
      pendingTransfers: transfers.filter(t => t.status === 'Pending').length,
      completedTransfers: transfers.filter(t => t.status === 'Completed').length,
      inTransitTransfers: transfers.filter(t => t.status === 'In Transit').length,
      totalQuantityMoved: transfers.reduce((sum, t) => sum + t.quantity, 0)
    };
  }

  // ==================== VALIDATION ====================

  static validateProduct(data: Partial<CreateProductDTO>): ValidationResult {
    const fieldErrors: { [key: string]: string } = {};
    if (!data.brandName?.trim()) fieldErrors.brandName = 'Brand name is required';
    if (!data.modelName?.trim()) fieldErrors.modelName = 'Model name is required';
    if (!data.category?.trim()) fieldErrors.category = 'Category is required';
    if (data.sellPrice === undefined || data.sellPrice < 0) fieldErrors.sellPrice = 'Valid sell price is required';
    if (data.stock === undefined || data.stock < 0) fieldErrors.stock = 'Valid stock quantity is required';
    if (!data.serialNumbers || data.serialNumbers.length === 0) fieldErrors.serialNumbers = 'At least one serial number is required';
    const isValid = Object.keys(fieldErrors).length === 0;
    return { isValid, error: isValid ? undefined : 'Please fix the errors below', fieldErrors };
  }

  static validateTransfer(data: Partial<CreateTransferDTO>, availableStock: number): ValidationResult {
    const fieldErrors: { [key: string]: string } = {};
    if (!data.productId) fieldErrors.productId = 'Product is required';
    if (!data.fromLocation?.trim()) fieldErrors.fromLocation = 'From location is required';
    if (!data.toLocation?.trim()) fieldErrors.toLocation = 'To location is required';
    if (!data.quantity || data.quantity <= 0) fieldErrors.quantity = 'Valid quantity is required';
    else if (data.quantity > availableStock) fieldErrors.quantity = `Quantity exceeds available stock (${availableStock})`;
    if (!data.serialNumbers || data.serialNumbers.length === 0) fieldErrors.serialNumbers = 'At least one serial number is required';
    else if (data.serialNumbers.length !== data.quantity) fieldErrors.serialNumbers = 'Number of serial numbers must match quantity';
    const isValid = Object.keys(fieldErrors).length === 0;
    return { isValid, error: isValid ? undefined : 'Please fix the errors below', fieldErrors };
  }

  // ==================== UTILITY METHODS ====================

  static getUniqueCategories(products: Product[]): string[] {
    return [...new Set(products.map(p => p.category))].sort();
  }

  static getUniqueLocations(transfers: ProductTransfer[]): string[] {
    const locations = new Set<string>();
    transfers.forEach(t => { locations.add(t.fromLocation); locations.add(t.toLocation); });
    return [...locations].sort();
  }

  static getAvailableSerials(product: Product): string[] {
    if (!product.serialStatus) return product.serialNumbers;
    return product.serialNumbers.filter(serial => product.serialStatus?.[serial] === 'Available');
  }

  static hasAvailableStock(product: Product, quantity: number): boolean {
    return this.getAvailableSerials(product).length >= quantity;
  }

  static getDefaultProductFormData(): Partial<CreateProductDTO> {
    return {
      brandName: '', modelName: '', category: '', sellPrice: 0,
      buyType: 'Import', warrantyYears: 1, stock: 0,
      serialNumbers: [], serialCities: {}, description: '', status: 'New'
    };
  }

  static getDefaultTransferFormData(): Partial<CreateTransferDTO> {
    return {
      productId: '', fromLocation: '', toLocation: '', quantity: 0,
      serialNumbers: [], transferDate: new Date().toISOString().split('T')[0], notes: ''
    };
  }

  static countActiveProductFilters(filters: ProductFilters): number {
    return Object.values(filters).filter(v => v !== '' && v !== null && v !== undefined).length;
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(amount);
  }

  static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  private static generateId(): string {
    return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}