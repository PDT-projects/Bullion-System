// Commission Module - Service Layer
// Pure business logic — no localStorage, no React, no Firestore

import type {
  CommissionSlab,
  Commission,
  CreateCommissionSlabDTO,
  UpdateCommissionSlabDTO,
  CommissionSlabFilter,
  CommissionFilter,
  CommissionStats,
  CommissionCalculationResult,
  InvoiceReference,
  EmployeeReference,
  ValidationResult,
  SlabOverlap
} from './types';

export const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Bullion RND/SITE'] as const;

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);

export const formatMonth = (monthStr: string): string => {
  const [year, month] = monthStr.split('-');
  return new Date(parseInt(year), parseInt(month) - 1)
    .toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
};

export const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// ==================== SLAB FILTERING ====================

export const filterCommissionSlabs = (
  slabs: CommissionSlab[],
  filter: CommissionSlabFilter
): CommissionSlab[] => {
  return slabs.filter(slab => {
    if (filter.salesperson && slab.salesperson !== filter.salesperson) return false;
    if (filter.city && !slab.city.toLowerCase().includes(filter.city.toLowerCase())) return false;
    return true;
  });
};

// ==================== VALIDATION ====================

export const validateCommissionSlab = (
  dto: CreateCommissionSlabDTO,
  existingSlabs: CommissionSlab[],
  excludeId?: string
): ValidationResult => {
  const errors: string[] = [];

  if (!dto.salesperson) errors.push('Salesperson is required');
  if (!dto.city) errors.push('City is required');
  if (dto.fromAmount === undefined || dto.fromAmount < 0) errors.push('From Amount must be 0 or greater');
  if (dto.toAmount === undefined || dto.toAmount <= 0) errors.push('To Amount must be greater than 0');
  if (dto.fromAmount >= dto.toAmount) errors.push('From Amount must be less than To Amount');
  if (dto.commissionPercentage === undefined || dto.commissionPercentage < 0 || dto.commissionPercentage > 100) {
    errors.push('Commission Percentage must be between 0 and 100');
  }

  const overlap = checkSlabOverlap(dto, existingSlabs, excludeId);
  if (overlap.exists) errors.push('Commission slabs cannot overlap for the same salesperson and city');

  return { isValid: errors.length === 0, errors };
};

export const checkSlabOverlap = (
  newSlab: CreateCommissionSlabDTO | UpdateCommissionSlabDTO,
  existingSlabs: CommissionSlab[],
  excludeId?: string
): SlabOverlap => {
  const conflictingSlab = existingSlabs.find(slab => {
    if (excludeId && slab.id === excludeId) return false;
    if (slab.salesperson !== newSlab.salesperson) return false;
    if (slab.city !== newSlab.city) return false;
    const newFrom = newSlab.fromAmount ?? slab.fromAmount;
    const newTo = newSlab.toAmount ?? slab.toAmount;
    return (
      (newFrom >= slab.fromAmount && newFrom < slab.toAmount) ||
      (newTo > slab.fromAmount && newTo <= slab.toAmount) ||
      (newFrom <= slab.fromAmount && newTo >= slab.toAmount)
    );
  });
  return { exists: !!conflictingSlab, conflictingSlab };
};

// ==================== COMMISSION CALCULATION ====================

export const calculateCommissions = (
  city: string,
  month: string,
  invoices: InvoiceReference[],
  employees: EmployeeReference[],
  slabs: CommissionSlab[],
  calculatedBy: string = 'Admin'
): CommissionCalculationResult => {
  const errors: string[] = [];

  const monthInvoices = invoices.filter(invoice => {
    const invoiceDate = new Date(invoice.date);
    const invoiceMonth = `${invoiceDate.getFullYear()}-${String(invoiceDate.getMonth() + 1).padStart(2, '0')}`;
    return invoice.customerCity === city && invoiceMonth === month && invoice.status === 'Paid';
  });

  const salesBySalesperson: { [key: string]: number } = {};
  monthInvoices.forEach(invoice => {
    if (invoice.salesperson) {
      salesBySalesperson[invoice.salesperson] =
        (salesBySalesperson[invoice.salesperson] || 0) + invoice.totalAmount;
    }
  });

  const commissions: Commission[] = [];

  Object.entries(salesBySalesperson).forEach(([salespersonId, totalSales]) => {
    const employee = employees.find(emp => emp.id === salespersonId);
    if (!employee) {
      errors.push(`Employee not found for salesperson ID: ${salespersonId}`);
      return;
    }

    const applicableSlab = slabs.find(
      slab =>
        slab.salesperson === salespersonId &&
        slab.city === city &&
        totalSales >= slab.fromAmount &&
        totalSales <= slab.toAmount
    );

    if (!applicableSlab) {
      errors.push(`No commission slab found for ${employee.name} in ${city}`);
      return;
    }

    const commissionAmount = (totalSales * applicableSlab.commissionPercentage) / 100;

    commissions.push({
      id: `COM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
    });
  });

  const totalSales = Object.values(salesBySalesperson).reduce((sum, s) => sum + s, 0);
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

// ==================== COMMISSION FILTERING & STATS ====================

export const filterCommissions = (
  commissions: Commission[],
  filter: CommissionFilter
): Commission[] => {
  return commissions.filter(c => {
    if (filter.salesperson && !c.salespersonName.toLowerCase().includes(filter.salesperson.toLowerCase())) return false;
    if (filter.city && !c.city.toLowerCase().includes(filter.city.toLowerCase())) return false;
    if (filter.month && !c.month.includes(filter.month)) return false;
    if (filter.status && c.status !== filter.status) return false;
    return true;
  });
};

export const getCommissionStats = (commissions: Commission[]): CommissionStats => {
  const totalAmount = commissions.reduce(
    (sum, c) => sum + (c.overriddenCommissionAmount || c.calculatedCommissionAmount), 0
  );
  const totalRate = commissions.reduce(
    (sum, c) => sum + (c.overriddenCommissionPercentage || c.commissionPercentage), 0
  );
  return {
    totalCommissions: commissions.length,
    totalAmount,
    confirmedCount: commissions.filter(c => c.status === 'Confirmed').length,
    adjustedCount: commissions.filter(c => c.status === 'Adjusted').length,
    calculatedCount: commissions.filter(c => c.status === 'Calculated').length,
    averageRate: commissions.length > 0 ? totalRate / commissions.length : 0
  };
};

export const exportCommissionsToCSV = (commissions: Commission[]): string => {
  const headers = [
    'Salesperson', 'City', 'Month', 'Total Sales', 'Applied Slab From',
    'Applied Slab To', 'Commission %', 'Commission Amount', 'Status',
    'Calculated By', 'Confirmed By', 'Calculated At', 'Confirmed At'
  ];
  const rows = commissions.map(c => [
    c.salespersonName, c.city, formatMonth(c.month), c.totalSales,
    c.appliedSlabFrom, c.appliedSlabTo,
    c.overriddenCommissionPercentage || c.commissionPercentage,
    c.overriddenCommissionAmount || c.calculatedCommissionAmount,
    c.status, c.calculatedBy, c.confirmedBy || '',
    new Date(c.calculatedAt).toLocaleDateString(),
    c.confirmedAt ? new Date(c.confirmedAt).toLocaleDateString() : ''
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};