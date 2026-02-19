import { 
  Product, 
  ProductTransfer, 
  CreateProductDTO, 
  UpdateProductDTO,
  CreateTransferDTO,
  ProductFilters,
  TransferFilters,
  ProductStats,
  TransferStats,
  ValidationResult,
  ProductStatus,
  BuyType,
  SerialStatus,
  CostingOption,
  ProductFormData
} from './types';

/**
 * Service class for Inventory operations
 * Contains all business logic, data manipulation, and utilities
 */
export class InventoryService {
  
  // ==================== PRODUCT OPERATIONS ====================

  /**
   * Filter products based on criteria
   */
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

  /**
   * Create a new product
   */
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

  /**
   * Update an existing product
   */
  static updateProduct(products: Product[], id: string, data: UpdateProductDTO): Product[] {
    return products.map(product => 
      product.id === id 
        ? { ...product, ...data, updatedAt: new Date().toISOString() }
        : product
    );
  }

  /**
   * Delete a product
   */
  static deleteProduct(products: Product[], id: string): Product[] {
    return products.filter(product => product.id !== id);
  }

  /**
   * Find product by ID
   */
  static findProductById(products: Product[], id: string): Product | undefined {
    return products.find(product => product.id === id);
  }

  /**
   * Add stock to existing product
   */
  static addStock(products: Product[], id: string, quantity: number, serialNumbers: string[]): Product[] {
    return products.map(product => {
      if (product.id === id) {
        const newSerialStatus = { ...product.serialStatus };
        serialNumbers.forEach(serial => {
          newSerialStatus[serial] = 'Available';
        });

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

  /**
   * Filter transfers based on criteria
   */
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
        new Date(transfer.transferDate) >= new Date(filters.dateFrom);
      
      const matchesDateTo = !filters.dateTo || 
        new Date(transfer.transferDate) <= new Date(filters.dateTo);

      return matchesProduct && matchesFrom && matchesTo && 
             matchesStatus && matchesDateFrom && matchesDateTo;
    });
  }

  /**
   * Create a new product transfer
   */
  static createTransfer(transfers: ProductTransfer[], data: CreateTransferDTO, productName: string): ProductTransfer[] {
    const newTransfer: ProductTransfer = {
      ...data,
      id: this.generateId(),
      productName,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    return [...transfers, newTransfer];
  }

  /**
   * Update transfer status
   */
  static updateTransferStatus(
    transfers: ProductTransfer[], 
    id: string, 
    status: ProductTransfer['status']
  ): ProductTransfer[] {
    return transfers.map(transfer => 
      transfer.id === id ? { ...transfer, status } : transfer
    );
  }

  /**
   * Cancel a transfer
   */
  static cancelTransfer(transfers: ProductTransfer[], id: string): ProductTransfer[] {
    return this.updateTransferStatus(transfers, id, 'Cancelled');
  }

  /**
   * Complete a transfer
   */
  static completeTransfer(transfers: ProductTransfer[], id: string): ProductTransfer[] {
    return this.updateTransferStatus(transfers, id, 'Completed');
  }

  // ==================== STATISTICS ====================

  /**
   * Calculate product statistics
   */
  static calculateProductStats(products: Product[]): ProductStats {
    const categories: { [key: string]: number } = {};
    
    products.forEach(product => {
      categories[product.category] = (categories[product.category] || 0) + 1;
    });

    return {
      totalProducts: products.length,
      totalStock: products.reduce((sum, p) => sum + p.stock, 0),
      totalValue: products.reduce((sum, p) => sum + (p.costPrice * p.stock), 0),
      newProducts: products.filter(p => p.status === 'New').length,
      inTransit: products.filter(p => p.status === 'In Transit').length,
      available: products.filter(p => p.status === 'Available').length,
      categories
    };
  }

  /**
   * Calculate transfer statistics
   */
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

  /**
   * Validate product data
   */
  static validateProduct(data: Partial<CreateProductDTO>): ValidationResult {
    const fieldErrors: { [key: string]: string } = {};

    if (!data.brandName?.trim()) {
      fieldErrors.brandName = 'Brand name is required';
    }

    if (!data.modelName?.trim()) {
      fieldErrors.modelName = 'Model name is required';
    }

    if (!data.category?.trim()) {
      fieldErrors.category = 'Category is required';
    }

    if (data.costPrice === undefined || data.costPrice < 0) {
      fieldErrors.costPrice = 'Valid cost price is required';
    }

    if (data.sellPrice === undefined || data.sellPrice < 0) {
      fieldErrors.sellPrice = 'Valid sell price is required';
    }

    if (data.stock === undefined || data.stock < 0) {
      fieldErrors.stock = 'Valid stock quantity is required';
    }

    if (!data.serialNumbers || data.serialNumbers.length === 0) {
      fieldErrors.serialNumbers = 'At least one serial number is required';
    }

    const isValid = Object.keys(fieldErrors).length === 0;

    return {
      isValid,
      error: isValid ? undefined : 'Please fix the errors below',
      fieldErrors
    };
  }

  /**
   * Validate transfer data
   */
  static validateTransfer(data: Partial<CreateTransferDTO>, availableStock: number): ValidationResult {
    const fieldErrors: { [key: string]: string } = {};

    if (!data.productId) {
      fieldErrors.productId = 'Product is required';
    }

    if (!data.fromLocation?.trim()) {
      fieldErrors.fromLocation = 'From location is required';
    }

    if (!data.toLocation?.trim()) {
      fieldErrors.toLocation = 'To location is required';
    }

    if (!data.quantity || data.quantity <= 0) {
      fieldErrors.quantity = 'Valid quantity is required';
    } else if (data.quantity > availableStock) {
      fieldErrors.quantity = `Quantity exceeds available stock (${availableStock})`;
    }

    if (!data.serialNumbers || data.serialNumbers.length === 0) {
      fieldErrors.serialNumbers = 'At least one serial number is required';
    } else if (data.serialNumbers.length !== data.quantity) {
      fieldErrors.serialNumbers = 'Number of serial numbers must match quantity';
    }

    const isValid = Object.keys(fieldErrors).length === 0;

    return {
      isValid,
      error: isValid ? undefined : 'Please fix the errors below',
      fieldErrors
    };
  }

  /**
   * Validate payment data
   */
  static validatePayment(data: Partial<CreatePaymentDTO>): ValidationResult {
    const fieldErrors: { [key: string]: string } = {};

    if (!data.productId) {
      fieldErrors.productId = 'Product is required';
    }

    if (!data.amount || data.amount <= 0) {
      fieldErrors.amount = 'Valid payment amount is required';
    }

    if (!data.paymentMethod) {
      fieldErrors.paymentMethod = 'Payment method is required';
    }

    if (data.paymentMethod === 'Bank' && !data.bankId) {
      fieldErrors.bankId = 'Bank selection is required for bank payments';
    }

    const isValid = Object.keys(fieldErrors).length === 0;

    return {
      isValid,
      error: isValid ? undefined : 'Please fix the errors below',
      fieldErrors
    };
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get unique categories from products
   */
  static getUniqueCategories(products: Product[]): string[] {
    return [...new Set(products.map(p => p.category))].sort();
  }

  /**
   * Get unique locations from transfers
   */
  static getUniqueLocations(transfers: ProductTransfer[]): string[] {
    const locations = new Set<string>();
    transfers.forEach(t => {
      locations.add(t.fromLocation);
      locations.add(t.toLocation);
    });
    return [...locations].sort();
  }

  /**
   * Get available serial numbers for a product
   */
  static getAvailableSerials(product: Product): string[] {
    if (!product.serialStatus) return product.serialNumbers;
    
    return product.serialNumbers.filter(serial => 
      product.serialStatus?.[serial] === 'Available'
    );
  }

  /**
   * Check if product has available stock
   */
  static hasAvailableStock(product: Product, quantity: number): boolean {
    const availableSerials = this.getAvailableSerials(product);
    return availableSerials.length >= quantity;
  }

  /**
   * Get default form data for new product
   */
  static getDefaultProductFormData(): Partial<CreateProductDTO> {
    return {
      brandName: '',
      modelName: '',
      category: '',
      costPrice: 0,
      sellPrice: 0,
      buyType: 'Import',
      warrantyYears: 1,
      stock: 0,
      serialNumbers: [],
      serialCities: {},
      description: '',
      status: 'New'
    };
  }

  /**
   * Get default form data for transfer
   */
  static getDefaultTransferFormData(): Partial<CreateTransferDTO> {
    return {
      productId: '',
      fromLocation: '',
      toLocation: '',
      quantity: 0,
      serialNumbers: [],
      transferDate: new Date().toISOString().split('T')[0],
      notes: ''
    };
  }

  /**
   * Count active filters
   */
  static countActiveProductFilters(filters: ProductFilters): number {
    return Object.values(filters).filter(v => 
      v !== '' && v !== null && v !== undefined
    ).length;
  }

  /**
   * Format currency
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  /**
   * Format date
   */
  static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Generate unique ID
   */
  private static generateId(): string {
    return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
