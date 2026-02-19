// Commission Service - Business Logic Layer

import type {
  CommissionSlab,
  Commission,
  CreateCommissionSlabDTO,
  UpdateCommissionSlabDTO,
  CreateCommissionDTO,
  UpdateCommissionDTO,
  CommissionSlabFilter,
  CommissionFilter,
  CommissionStats,
  CommissionCalculationResult,
  InvoiceReference,
  EmployeeReference,
  ValidationResult,
  SlabOverlap,
  CommissionStatus
} from './types';

// Storage keys
const STORAGE_KEYS = {
  COMMISSION_SLABS: 'commission_slabs',
  COMMISSIONS: 'commissions'
};

// Cities list
export const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Bullion RND/SITE'] as const;

// Generate unique ID
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Format month
export const formatMonth = (monthStr: string): string => {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
};

// Get current month string
export const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// ==================== COMMISSION SLAB OPERATIONS ====================

// Get all commission slabs
export const getAllCommissionSlabs = (): CommissionSlab[] => {
  const data = localStorage.getItem(STORAGE_KEYS.COMMISSION_SLABS);
  return data ? JSON.parse(data) : [];
};

// Get commission slab by ID
export const getCommissionSlabById = (id: string): CommissionSlab | null => {
  const slabs = getAllCommissionSlabs();
  return slabs.find(slab => slab.id === id) || null;
};

// Filter commission slabs
export const filterCommissionSlabs = (filter: CommissionSlabFilter): CommissionSlab[] => {
  let slabs = getAllCommissionSlabs();
  
  if (filter.salesperson) {
    slabs = slabs.filter(slab => slab.salesperson === filter.salesperson);
  }
  
  if (filter.city) {
    slabs = slabs.filter(slab => slab.city.toLowerCase().includes(filter.city!.toLowerCase()));
  }
  
  return slabs;
};

// Check for slab overlap
export const checkSlabOverlap = (
  newSlab: CreateCommissionSlabDTO | UpdateCommissionSlabDTO,
  excludeId?: string
): SlabOverlap => {
  const slabs = getAllCommissionSlabs();
  
  const conflictingSlab = slabs.find(slab => {
    // Skip if checking against self
    if (excludeId && slab.id === excludeId) return false;
    
    // Must be same salesperson and city
    if (slab.salesperson !== newSlab.salesperson) return false;
    if (slab.city !== newSlab.city) return false;
    
    // Check for overlap
    const newFrom = newSlab.fromAmount ?? slab.fromAmount;
    const newTo = newSlab.toAmount ?? slab.toAmount;
    
    return (
      (newFrom >= slab.fromAmount && newFrom < slab.toAmount) ||
      (newTo > slab.fromAmount && newTo <= slab.toAmount) ||
      (newFrom <= slab.fromAmount && newTo >= slab.toAmount)
    );
  });
  
  return {
    exists: !!conflictingSlab,
    conflictingSlab
  };
};

// Validate commission slab
export const validateCommissionSlab = (slab: CreateCommissionSlabDTO): ValidationResult => {
  const errors: string[] = [];
  
  if (!slab.salesperson) {
    errors.push('Salesperson is required');
  }
  
  if (!slab.city) {
    errors.push('City is required');
  }
  
  if (slab.fromAmount === undefined || slab.fromAmount < 0) {
    errors.push('From Amount must be 0 or greater');
  }
  
  if (slab.toAmount === undefined || slab.toAmount <= 0) {
    errors.push('To Amount must be greater than 0');
  }
  
  if (slab.fromAmount >= slab.toAmount) {
    errors.push('From Amount must be less than To Amount');
  }
  
  if (slab.commissionPercentage === undefined || slab.commissionPercentage < 0 || slab.commissionPercentage > 100) {
    errors.push('Commission Percentage must be between 0 and 100');
  }
  
  // Check for overlap
  const overlap = checkSlabOverlap(slab);
  if (overlap.exists) {
    errors.push('Commission slabs cannot overlap for the same salesperson and city');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Create commission slab
export const createCommissionSlab = (dto: CreateCommissionSlabDTO): CommissionSlab => {
  const validation = validateCommissionSlab(dto);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(', '));
  }
  
  const slab: CommissionSlab = {
    ...dto,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  const slabs = getAllCommissionSlabs();
  slabs.push(slab);
  localStorage.setItem(STORAGE_KEYS.COMMISSION_SLABS, JSON.stringify(slabs));
  
  return slab;
};

// Update commission slab
export const updateCommissionSlab = (dto: UpdateCommissionSlabDTO): CommissionSlab => {
  const slabs = getAllCommissionSlabs();
  const index = slabs.findIndex(s => s.id === dto.id);
  
  if (index === -1) {
    throw new Error('Commission slab not found');
  }
  
  // Check for overlap if salesperson or city or amounts changed
  const existingSlab = slabs[index];
  const updatedSlab: CommissionSlab = {
    ...existingSlab,
    ...dto,
    updatedAt: new Date().toISOString()
  };
  
  const overlap = checkSlabOverlap(updatedSlab, dto.id);
  if (overlap.exists) {
    throw new Error('Commission slabs cannot overlap for the same salesperson and city');
  }
  
  // Validate amounts
  if (updatedSlab.fromAmount >= updatedSlab.toAmount) {
    throw new Error('From Amount must be less than To Amount');
  }
  
  if (updatedSlab.commissionPercentage < 0 || updatedSlab.commissionPercentage > 100) {
    throw new Error('Commission Percentage must be between 0 and 100');
  }
  
  slabs[index] = updatedSlab;
  localStorage.setItem(STORAGE_KEYS.COMMISSION_SLABS, JSON.stringify(slabs));
  
  return updatedSlab;
};

// Delete commission slab
export const deleteCommissionSlab = (id: string): void => {
  const slabs = getAllCommissionSlabs();
  const filtered = slabs.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEYS.COMMISSION_SLABS, JSON.stringify(filtered));
};

// Get slabs for salesperson and city
export const getSlabsForSalespersonAndCity = (
  salespersonId: string,
  city: string
): CommissionSlab[] => {
  return getAllCommissionSlabs().filter(
    slab => slab.salesperson === salespersonId && slab.city === city
  );
};

// Find applicable slab for sales amount
export const findApplicableSlab = (
  salespersonId: string,
  city: string,
  totalSales: number
): CommissionSlab | null => {
  const slabs = getSlabsForSalespersonAndCity(salespersonId, city);
  return slabs.find(
    slab => totalSales >= slab.fromAmount && totalSales <= slab.toAmount
  ) || null;
};

// ==================== COMMISSION CALCULATION ====================

// Get all commissions
export const getAllCommissions = (): Commission[] => {
  const data = localStorage.getItem(STORAGE_KEYS.COMMISSIONS);
  return data ? JSON.parse(data) : [];
};

// Filter commissions
export const filterCommissions = (filter: CommissionFilter): Commission[] => {
  let commissions = getAllCommissions();
  
  if (filter.salesperson) {
    commissions = commissions.filter(c => 
      c.salespersonName.toLowerCase().includes(filter.salesperson!.toLowerCase())
    );
  }
  
  if (filter.city) {
    commissions = commissions.filter(c => 
      c.city.toLowerCase().includes(filter.city!.toLowerCase())
    );
  }
  
  if (filter.month) {
    commissions = commissions.filter(c => c.month.includes(filter.month!));
  }
  
  if (filter.status) {
    commissions = commissions.filter(c => c.status === filter.status);
  }
  
  return commissions;
};

// Calculate commissions for a city and month
export const calculateCommissions = (
  city: string,
  month: string,
  invoices: InvoiceReference[],
  employees: EmployeeReference[],
  calculatedBy: string = 'Admin'
): CommissionCalculationResult => {
  const errors: string[] = [];
  
  // Filter paid invoices for the selected city and month
  const monthInvoices = invoices.filter(invoice => {
    const invoiceDate = new Date(invoice.date);
    const invoiceMonth = `${invoiceDate.getFullYear()}-${String(invoiceDate.getMonth() + 1).padStart(2, '0')}`;
    return (
      invoice.customerCity === city &&
      invoiceMonth === month &&
      invoice.status === 'Paid'
    );
  });
  
  // Group sales by salesperson
  const salesBySalesperson: { [key: string]: number } = {};
  monthInvoices.forEach(invoice => {
    if (invoice.salesperson) {
      salesBySalesperson[invoice.salesperson] = 
        (salesBySalesperson[invoice.salesperson] || 0) + invoice.totalAmount;
    }
  });
  
  // Calculate commission for each salesperson
  const commissions: Commission[] = [];
  
  Object.entries(salesBySalesperson).forEach(([salespersonId, totalSales]) => {
    const employee = employees.find(emp => emp.id === salespersonId);
    
    if (!employee) {
      errors.push(`Employee not found for salesperson ID: ${salespersonId}`);
      return;
    }
    
    // Find applicable commission slab
    const applicableSlab = findApplicableSlab(salespersonId, city, totalSales);
    
    if (!applicableSlab) {
      errors.push(`No commission slab found for ${employee.name} in ${city}`);
      return;
    }
    
    const commissionAmount = (totalSales * applicableSlab.commissionPercentage) / 100;
    
    const commission: Commission = {
      id: `COM-${generateId()}`,
      salesperson: salespersonId,
      salespersonName: employee.name,
      city,
      month,
      totalSales,
      appliedSlabFrom: applicableSlab.fromAmount,
      appliedSlabTo: applicableSlab.toAmount,
      commissionPercentage: applicableSlab.commissionPercentage,
      calculatedCommissionAmount: commissionAmount,
      status: 'Calculated',
      calculatedBy,
      calculatedAt: new Date().toISOString(),
      isLocked: false
    };
    
    commissions.push(commission);
  });
  
  const totalSales = Object.values(salesBySalesperson).reduce((sum, sales) => sum + sales, 0);
  const totalCommission = commissions.reduce((sum, c) => sum + c.calculatedCommissionAmount, 0);
  
  return {
    commissions,
    errors,
    summary: {
      totalSalespeople: commissions.length,
      totalSales,
      totalCommission
    }
  };
};

// Save calculated commissions
export const saveCalculatedCommissions = (commissions: Commission[]): void => {
  const existingCommissions = getAllCommissions();
  
  // Add new commissions
  const updatedCommissions = [...existingCommissions, ...commissions];
  
  localStorage.setItem(STORAGE_KEYS.COMMISSIONS, JSON.stringify(updatedCommissions));
};

// Update commission (for adjustments)
export const updateCommission = (dto: UpdateCommissionDTO): Commission => {
  const commissions = getAllCommissions();
  const index = commissions.findIndex(c => c.id === dto.id);
  
  if (index === -1) {
    throw new Error('Commission not found');
  }
  
  const existing = commissions[index];
  
  // Cannot update confirmed/locked commissions
  if (existing.isLocked) {
    throw new Error('Cannot modify a confirmed commission');
  }
  
  const updated: Commission = {
    ...existing,
    ...dto,
    status: dto.status || (dto.overriddenCommissionAmount !== undefined || dto.overriddenCommissionPercentage !== undefined 
      ? 'Adjusted' 
      : existing.status)
  };
  
  commissions[index] = updated;
  localStorage.setItem(STORAGE_KEYS.COMMISSIONS, JSON.stringify(commissions));
  
  return updated;
};

// Confirm commission
export const confirmCommission = (id: string, confirmedBy: string = 'Admin'): Commission => {
  return updateCommission({
    id,
    status: 'Confirmed',
    confirmedBy,
    confirmedAt: new Date().toISOString()
  });
};

// Confirm multiple commissions
export const confirmMultipleCommissions = (ids: string[], confirmedBy: string = 'Admin'): Commission[] => {
  return ids.map(id => confirmCommission(id, confirmedBy));
};

// Delete commission
export const deleteCommission = (id: string): void => {
  const commissions = getAllCommissions();
  const filtered = commissions.filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEYS.COMMISSIONS, JSON.stringify(filtered));
};

// ==================== STATISTICS ====================

// Get commission statistics
export const getCommissionStats = (commissions?: Commission[]): CommissionStats => {
  const data = commissions || getAllCommissions();
  
  const totalAmount = data.reduce(
    (sum, c) => sum + (c.overriddenCommissionAmount || c.calculatedCommissionAmount), 
    0
  );
  
  const totalRate = data.reduce(
    (sum, c) => sum + (c.overriddenCommissionPercentage || c.commissionPercentage), 
    0
  );
  
  return {
    totalCommissions: data.length,
    totalAmount,
    confirmedCount: data.filter(c => c.status === 'Confirmed').length,
    adjustedCount: data.filter(c => c.status === 'Adjusted').length,
    calculatedCount: data.filter(c => c.status === 'Calculated').length,
    averageRate: data.length > 0 ? totalRate / data.length : 0
  };
};

// Export commissions to CSV
export const exportCommissionsToCSV = (commissions?: Commission[]): string => {
  const data = commissions || getAllCommissions();
  
  const headers = [
    'Salesperson',
    'City',
    'Month',
    'Total Sales',
    'Applied Slab From',
    'Applied Slab To',
    'Commission %',
    'Commission Amount',
    'Status',
    'Calculated By',
    'Confirmed By',
    'Calculated At',
    'Confirmed At'
  ];
  
  const rows = data.map(c => [
    c.salespersonName,
    c.city,
    formatMonth(c.month),
    c.totalSales,
    c.appliedSlabFrom,
    c.appliedSlabTo,
    c.overriddenCommissionPercentage || c.commissionPercentage,
    c.overriddenCommissionAmount || c.calculatedCommissionAmount,
    c.status,
    c.calculatedBy,
    c.confirmedBy || '',
    new Date(c.calculatedAt).toLocaleDateString(),
    c.confirmedAt ? new Date(c.confirmedAt).toLocaleDateString() : ''
  ]);
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};

// Initialize with sample data (optional)
export const initializeSampleSlabs = (): void => {
  const existing = getAllCommissionSlabs();
  if (existing.length > 0) return;
  
  // Sample data can be added here if needed
  console.log('Commission slabs storage initialized');
};
