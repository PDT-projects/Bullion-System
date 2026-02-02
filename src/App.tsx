import { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { Employees } from './components/Employees';
import { Products } from './components/Products';
import { Transactions } from './components/Transactions';
import { Loans } from './components/Loans';
import { Banks } from './components/Banks';
import { Invoices } from './components/Invoices';
import { BankTransfers } from './components/BankTransfers';
import { TransactionHistory } from './components/TransactionHistory';
import { LoanHistory } from './components/LoanHistory';
import { TransferHistory } from './components/TransferHistory';
import { CashInflow } from './components/CashInflow';
import { CashOutflow } from './components/CashOutflow';
import { Bills } from './components/Bills';
import { Salary } from './components/Salary';
import { LoansPayable } from './components/LoansPayable';
import { LoansReceivable } from './components/LoansReceivable';
import { CashInHand } from './components/CashInHand';
import { ProductTransfers } from './components/ProductTransfer';
import { SalesReport } from './components/SalesReport';
import { ReferralReport } from './components/ReferralReport';
import { InventoryReport } from './components/InventoryReport';
import { TransactionHistoryReport } from './components/TransactionHistoryReport';
import { PendingPayments } from './components/PendingPayments';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { NotificationBell } from './components/NotificationBell';
import { Toaster } from './components/ui/sonner';
import { Notification } from './types/Notification';

import { AdvanceSalary } from './components/AdvanceSalary';
import { CommissionSlabs } from './components/CommissionSlabs';
import { CommissionCalculation } from './components/CommissionCalculation';
import { CommissionReport } from './components/CommissionReport';
import { InventoryAuditLogComponent } from './components/InventoryAuditLog';
import { ProductCosting } from './components/ProductCosting';
import { Budgets } from './components/budgets/Budgets';
import { Budget } from './types/Budget';



export type Employee = {
  id: string;
  name: string;
  position: string;
  salary: number;
  phone: string;
  email: string;
  joinDate: string;
  status: 'active' | 'inactive';
};

export type Product = {
  id: string;
  brandName: string;
  modelName: string;
  category: string;
  costPrice: number;
  sellPrice: number;
  buyType: 'Import' | 'Export';
  warrantyYears: number;
  stock: number;
  serialNumbers: string[];
  serialCities: { [serialNumber: string]: string };
  serialStatus?: { [serialNumber: string]: 'Available' | 'In Transit' | 'Damaged' | 'Returned' };
  description: string;
  status: 'New' | 'Used' | 'Returned';
  createdDate?: string;
};

export type InvoiceProduct = {
  id: string;
  productId: string;
  productName: string;
  brandName: string;
  modelName: string;
  category: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
  serialNumbers: string[];
  serialCities?: { [serialNumber: string]: string };
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerPhone2?: string;
  customerCNIC: string;
  customerProvince: string;
  customerCity: string;
  customerAddress?: string;
  warrantyLocation?: string;
  products: InvoiceProduct[];
  exchangeWarrantyNote: string;
  deliveryStatus: 'Self-collect' | 'LCS' | 'Daewoo' | 'Self-delivered';
  deliveryReceivedStatus: 'Pending' | 'In Process' | 'Received'; // UPDATED: Dynamic delivery tracking with multiple statuses
  totalAmount: number;
  status: 'Paid' | 'Unpaid';
  salesperson?: string;
  salespersonLocation?: string;
  referFrom?: string; // NEW: Replaced clientDealBy, now required
  referTo?: string; // NEW: Optional referral destination
  createdBy?: string;
  paymentMode?: 'Cash' | 'Online';
  bankId?: string;
  bankName?: string;
  bankAccountNumber?: string;
  paymentStatus?: 'Full' | 'Partial';
  paidAmount?: number;
  remainingAmount?: number;
  collectionMethod?: 'Self Collection' | 'TCS' | 'LCS' | 'Daewoo' | 'Others';
  deductionCharges: number; // UPDATED: Now manually editable, required field (defaults to 0)
  imageUrl?: string;
  paidBy?: string;
  paidTo?: string;
};

export type PartialPayment = {
  id: string; // Unique payment ID
  amount: number;
  date: string;
  time: string;
  method: 'Cash' | 'Cheque' | 'Bank';
  bankId?: string;
  chequeNumber?: string;
  isCleared: boolean; // True if cleared/deposited, false if pending
  depositedDate?: string; // When it was deposited
  attachments?: Attachment[];
};

export type Attachment = {
  id: string;
  name: string;
  type: string; // MIME type
  dataUrl: string; // Base64 data URL
  uploadedAt: string;
};

export type Transaction = {
  id: string;
  transactionId: string; // System-generated unique ID (TXN-XXXXX format)
  date: string;
  time: string; // Added: time component
  company: string;
  mainCategory: 'Cash Inflow' | 'Cash Outflow' | 'Loans & Advances' | 'Salary' | 'Bills';
  subCategory: string;
  amount: number;
  mode: 'Cash' | 'Bank' | 'Cheque'; // Payment method
  bankName?: string;
  bankId?: string; // Added for better bank tracking
  note: string;
  paidBy?: string; // Person/company who paid (e.g., "Ahmed Khan", "Pakistan Detectors - Islamabad")
  paidTo?: string; // Person/company/vendor who received payment
  accountablePerson?: string; // New: Person on whose behalf payment is made
  transactionBy?: string; // Person who handled/processed the transaction (e.g., "Sir ABC", "Manager Ahmed")
  employeeId?: string; // For salary transactions
  employeeName?: string; // For salary transactions
  baseSalary?: number; // For salary transactions
  commission?: number; // For salary transactions
  deductions?: number; // For salary transactions
  netAmount?: number; // For salary transactions (base + commission - deductions)
  imageUrl?: string; // Optional image upload
  paymentStatus?: 'Full' | 'Partial'; // Payment status
  remainingAmount?: number; // Remaining amount for partial payments

  // Advance Salary fields
  isAdvanceSalary?: boolean; // Flag to identify advance salary transactions
  advanceAmount?: number; // Amount paid as advance
  remainingSalary?: number; // Remaining salary after advance
  salaryMonth?: string; // Month for which advance was given

  // New payment tracking fields
  partialPayments?: PartialPayment[]; // Track all partial payments under same transaction ID
  totalPaid?: number; // Total amount paid across all partial payments
  isFullyCleared?: boolean; // True when all payments are cleared AND fully paid
  depositedToBank?: boolean; // For cash/cheque: whether deposited to bank
  attachments?: Attachment[]; // New: Attachments for transaction
};

export type ProductTransfer = {
  id: string;
  date: string;
  productId: string;
  productName: string;
  brandName: string;
  modelName: string;
  serialNumbers: string[];
  fromLocation: string;
  toLocation: string;
  quantity: number;
  transferredBy: string;
  note: string;
  status?: 'Pending' | 'Received';
  receivedAt?: string;
  receiptName?: string;
  receiptType?: string;
  receiptDataUrl?: string;
};

export type Loan = {
  id: string;
  entityName: string;
  loanAmount: number;
  paid: number;
  remaining: number;
  type: 'Payable' | 'Receivable';
  loanType: 'Official' | 'Personal' | 'Other';
  status: 'Full' | 'Partial';
  date: string;
  mode: 'Cash' | 'Bank';
  bankId?: string;
  bankName?: string;
  receiverType: 'Employee' | 'Person';
  receiverName: string;
  receiverId?: string;
  receiverPhone?: string;
  employeeId?: string;
  employeeName?: string;
};

export type Bank = {
  id: string;
  name: string;
  balance: number;
  accountNumber: string;
};

export type BankTransfer = {
  id: string;
  date: string;
  fromBankId: string;
  fromBankName: string;
  toBankId: string;
  toBankName: string;
  amount: number;
  note: string;
};

export type CommissionSlab = {
  id: string;
  salesperson: string;
  city: string;
  fromAmount: number;
  toAmount: number;
  commissionPercentage: number;
};

export type ProductCostingType = {
  id: string;
  brandName: string;
  modelName: string;
  category: string;
  units: number;
  unitCostUSD: number;
  totalCostUSD: number;
  percentage: number;
  customPerModel: number;
  customPerUnit: number;
  freightPerModel: number;
  freightPerUnit: number;
  unitCostPKR: number;
  totalUnitCost: number;
  totalShipmentValuePKR: number;
};

export type Commission = {
  id: string;
  salesperson: string;
  salespersonName: string;
  city: string;
  month: string; // Format: "YYYY-MM"
  totalSales: number;
  appliedSlabFrom: number;
  appliedSlabTo: number;
  commissionPercentage: number;
  calculatedCommissionAmount: number;
  overriddenCommissionPercentage?: number;
  overriddenCommissionAmount?: number;
  status: 'Calculated' | 'Adjusted' | 'Confirmed';
  calculatedBy: string;
  confirmedBy?: string;
  calculatedAt: string;
  confirmedAt?: string;
  isLocked: boolean;
};

export type AppData = {
  employees: Employee[];
  products: Product[];
  transactions: Transaction[];
  loans: Loan[];
  banks: Bank[];
  invoices: Invoice[];
  bankTransfers: BankTransfer[];
  productTransfers: ProductTransfer[];
  commissionSlabs: CommissionSlab[];
  productCosting: ProductCostingType[];
  commissions: Commission[];
  budgets: Budget[];
};

const normalizeInitialData = (data: AppData): AppData => {
  const productsById = new Map<string, Product>();
  data.products.forEach((p) => {
    const initialStatus: { [serial: string]: 'Available' } = {};
    (p.serialNumbers || []).forEach((serial) => {
      if (serial) {
        initialStatus[serial] = 'Available';
      }
    });

    productsById.set(p.id, {
      ...p,
      serialNumbers: [...p.serialNumbers],
      serialCities: { ...p.serialCities },
      serialStatus: { ...(p.serialStatus || {}), ...initialStatus },
    });
  });

  data.invoices.forEach((invoice) => {
    invoice.products.forEach((invProd) => {
      const product = productsById.get(invProd.productId);
      if (!product) return;

      (invProd.serialNumbers || []).forEach((serial) => {
        if (!serial) return;
        if (!product.serialNumbers.includes(serial)) {
          product.serialNumbers.push(serial);
        }
        if (invoice.customerCity) {
          product.serialCities[serial] = invoice.customerCity;
        }
        if (!product.serialStatus) {
          product.serialStatus = {};
        }
        if (!product.serialStatus[serial]) {
          product.serialStatus[serial] = 'Available';
        }
      });
    });
  });

  const normalizedProducts = Array.from(productsById.values()).map((p) => ({
    ...p,
    stock: p.serialNumbers.length,
  }));

  return {
    ...data,
    products: normalizedProducts,
  };
};

const initialData: AppData = {
  employees: [
    {
      id: '1',
      name: 'Ahmed Khan',
      position: 'Sales Manager',
      salary: 85000,
      phone: '+92 300 1234567',
      email: 'ahmed.khan@pdt.com',
      joinDate: '2023-01-15',
      status: 'active'
    },
    {
      id: '2',
      name: 'Fatima Ali',
      position: 'Product Developer',
      salary: 75000,
      phone: '+92 321 9876543',
      email: 'fatima.ali@pdt.com',
      joinDate: '2023-03-20',
      status: 'active'
    },
    {
      id: '3',
      name: 'Hassan Raza',
      position: 'Marketing Executive',
      salary: 65000,
      phone: '+92 333 5551234',
      email: 'hassan.raza@pdt.com',
      joinDate: '2023-06-10',
      status: 'active'
    },
    {
      id: '4',
      name: 'Ayesha Malik',
      position: 'Accountant',
      salary: 70000,
      phone: '+92 345 7778888',
      email: 'ayesha.malik@pdt.com',
      joinDate: '2022-11-05',
      status: 'active'
    }
  ],
  products: [
    {
      id: '1',
      brandName: 'Metal Detector',
      modelName: 'Pro X1',
      category: 'Detection Equipment',
      costPrice: 100000,
      sellPrice: 125000,
      buyType: 'Import',
      warrantyYears: 2,
      stock: 13,
      serialNumbers: ['MDX1-003', 'MDX1-004', 'MDX1-005', 'MDX1-006', 'MDX1-007', 'MDX1-008', 'MDX1-009', 'MDX1-010', 'MDX1-011', 'MDX1-012', 'MDX1-013', 'MDX1-014', 'MDX1-015'],
      serialCities: {
        'MDX1-003': 'Karachi',
        'MDX1-004': 'Lahore',
        'MDX1-005': 'Islamabad',
        'MDX1-006': 'Karachi',
        'MDX1-007': 'Lahore',
        'MDX1-008': 'Islamabad',
        'MDX1-009': 'Karachi',
        'MDX1-010': 'Lahore',
        'MDX1-011': 'Islamabad',
        'MDX1-012': 'Karachi',
        'MDX1-013': 'Lahore',
        'MDX1-014': 'Islamabad',
        'MDX1-015': 'Karachi'
      },
      description: 'Professional grade metal detector with advanced sensitivity',
      status: 'New'
    },
    {
      id: '2',
      brandName: 'Security Scanner',
      modelName: 'S200',
      category: 'Security Equipment',
      costPrice: 200000,
      sellPrice: 250000,
      buyType: 'Export',
      warrantyYears: 3,
      stock: 8,
      serialNumbers: ['SS200-001', 'SS200-002', 'SS200-003', 'SS200-004', 'SS200-005', 'SS200-006', 'SS200-007', 'SS200-008'],
      serialCities: {
        'SS200-001': 'Karachi',
        'SS200-002': 'Lahore',
        'SS200-003': 'Islamabad',
        'SS200-004': 'Karachi',
        'SS200-005': 'Lahore',
        'SS200-006': 'Islamabad',
        'SS200-007': 'Karachi',
        'SS200-008': 'Lahore'
      },
      description: 'High-precision security scanning system',
      status: 'New'
    },
    {
      id: '3',
      brandName: 'Handheld Detector',
      modelName: 'HD-50',
      category: 'Detection Equipment',
      costPrice: 30000,
      sellPrice: 45000,
      buyType: 'Import',
      warrantyYears: 1,
      stock: 20,
      serialNumbers: ['HD50-006', 'HD50-007', 'HD50-008', 'HD50-009', 'HD50-010', 'HD50-011', 'HD50-012', 'HD50-013', 'HD50-014', 'HD50-015', 'HD50-016', 'HD50-017', 'HD50-018', 'HD50-019', 'HD50-020', 'HD50-021', 'HD50-022', 'HD50-023', 'HD50-024', 'HD50-025'],
      serialCities: {
        'HD50-006': 'Karachi',
        'HD50-007': 'Lahore',
        'HD50-008': 'Islamabad',
        'HD50-009': 'Karachi',
        'HD50-010': 'Lahore',
        'HD50-011': 'Islamabad',
        'HD50-012': 'Karachi',
        'HD50-013': 'Lahore',
        'HD50-014': 'Islamabad',
        'HD50-015': 'Karachi',
        'HD50-016': 'Lahore',
        'HD50-017': 'Islamabad',
        'HD50-018': 'Karachi',
        'HD50-019': 'Lahore',
        'HD50-020': 'Islamabad',
        'HD50-021': 'Karachi',
        'HD50-022': 'Lahore',
        'HD50-023': 'Islamabad',
        'HD50-024': 'Karachi',
        'HD50-025': 'Lahore'
      },
      description: 'Portable handheld metal detector',
      status: 'New'
    },
    {
      id: '4',
      brandName: 'X-Ray Scanner',
      modelName: 'XR-100',
      category: 'Imaging Equipment',
      costPrice: 400000,
      sellPrice: 450000,
      buyType: 'Export',
      warrantyYears: 5,
      stock: 5,
      serialNumbers: ['XR100-001', 'XR100-002', 'XR100-003', 'XR100-004', 'XR100-005'],
      serialCities: {
        'XR100-001': 'Karachi',
        'XR100-002': 'Lahore',
        'XR100-003': 'Islamabad',
        'XR100-004': 'Karachi',
        'XR100-005': 'Lahore'
      },
      description: 'Advanced X-ray baggage scanner',
      status: 'New'
    }
  ],
  transactions: [
    {
      id: '1',
      transactionId: 'TXN-00001',
      date: '2024-01-15',
      time: '10:30',
      company: 'Pakistan Detectors Technologies: Islamabad/ Head Office',
      mainCategory: 'Cash Inflow',
      subCategory: 'Product sale received',
      amount: 250000,
      mode: 'Bank',
      bankId: '1',
      bankName: 'HBL Main Branch',
      note: 'Payment for Metal Detector Pro X1 - 2 units',
      paymentStatus: 'Full',
      isFullyCleared: true,
      totalPaid: 250000,
      partialPayments: []
    },
    {
      id: '2',
      transactionId: 'TXN-00002',
      date: '2024-01-14',
      time: '14:15',
      company: 'Pakistan Detectors Technologies: Islamabad/ Head Office',
      mainCategory: 'Cash Outflow',
      subCategory: 'Employee salary',
      amount: 85000,
      mode: 'Bank',
      bankId: '2',
      bankName: 'UBL Corporate',
      note: 'January salary - Ahmed Khan',
      paymentStatus: 'Full',
      isFullyCleared: true,
      totalPaid: 85000,
      partialPayments: [],
      employeeId: '1',
      employeeName: 'Ahmed Khan',
      baseSalary: 85000,
      commission: 0,
      deductions: 0,
      netAmount: 85000
    },
    {
      id: '3',
      transactionId: 'TXN-00003',
      date: '2024-01-14',
      time: '11:45',
      company: 'Pakistan Detectors Technologies: Karachi',
      mainCategory: 'Cash Inflow',
      subCategory: 'Payment received: Customers',
      amount: 150000,
      mode: 'Cash',
      note: 'Customer payment - Security Scanner',
      paymentStatus: 'Partial',
      isFullyCleared: false,
      totalPaid: 0,
      depositedToBank: false,
      partialPayments: [],
      remainingAmount: 150000
    },
    {
      id: '4',
      transactionId: 'TXN-00004',
      date: '2024-01-10',
      time: '09:30',
      company: 'Pakistan Detectors Technologies: Islamabad/ Head Office',
      mainCategory: 'Cash Outflow',
      subCategory: 'Advance Salary',
      amount: 25000,
      mode: 'Cash',
      note: 'Advance salary for January 2024 - Ahmed Khan',
      paymentStatus: 'Full',
      isFullyCleared: true,
      totalPaid: 25000,
      partialPayments: [],
      employeeId: '1',
      employeeName: 'Ahmed Khan',
      isAdvanceSalary: true,
      advanceAmount: 25000,
      remainingSalary: 60000,
      salaryMonth: '2024-01'
    },
    {
      id: '5',
      transactionId: 'TXN-00005',
      date: '2024-01-12',
      time: '11:00',
      company: 'Pakistan Detectors Technologies: Islamabad/ Head Office',
      mainCategory: 'Cash Outflow',
      subCategory: 'Advance Salary',
      amount: 15000,
      mode: 'Bank',
      bankId: '1',
      bankName: 'HBL Main Branch',
      note: 'Advance salary for January 2024 - Fatima Ali',
      paymentStatus: 'Full',
      isFullyCleared: true,
      totalPaid: 15000,
      partialPayments: [],
      employeeId: '2',
      employeeName: 'Fatima Ali',
      isAdvanceSalary: true,
      advanceAmount: 15000,
      remainingSalary: 60000,
      salaryMonth: '2024-01'
    }
  ],
  loans: [
    {
      id: '1',
      entityName: 'Ahmed Khan',
      loanAmount: 150000,
      paid: 50000,
      remaining: 100000,
      type: 'Receivable',
      loanType: 'Personal',
      status: 'Partial',
      date: '2023-11-01',
      mode: 'Bank',
      bankId: '1',
      bankName: 'HBL Main Branch',
      receiverType: 'Employee',
      receiverName: 'Ahmed Khan'
    },
    {
      id: '2',
      entityName: 'Hassan Raza',
      loanAmount: 80000,
      paid: 80000,
      remaining: 0,
      type: 'Receivable',
      loanType: 'Official',
      status: 'Full',
      date: '2023-08-15',
      mode: 'Bank',
      bankId: '2',
      bankName: 'UBL Corporate',
      receiverType: 'Employee',
      receiverName: 'Hassan Raza'
    }
  ],
  banks: [
    {
      id: '1',
      name: 'HBL Main Branch',
      balance: 1850000,
      accountNumber: 'HBL-2345678901'
    },
    {
      id: '2',
      name: 'UBL Corporate',
      balance: 950000,
      accountNumber: 'UBL-9876543210'
    },
    {
      id: '3',
      name: 'MCB Business',
      balance: 620000,
      accountNumber: 'MCB-5556667777'
    }
  ],
  invoices: [
    {
      id: '1',
      invoiceNumber: 'INV-2024-001',
      date: '2024-01-15',
      customerName: 'ABC Corporation',
      customerPhone: '+92 300 1234567',
      customerCNIC: '42101-1234567-1',
      customerProvince: 'Sindh',
      customerCity: 'Karachi',
      products: [
        {
          id: '1',
          productId: '1',
          productName: 'Metal Detector Pro X1',
          brandName: 'Metal Detector',
          modelName: 'Pro X1',
          category: 'Detection Equipment',
          description: 'Professional grade metal detector with advanced sensitivity',
          quantity: 2,
          price: 125000,
          total: 250000,
          serialNumbers: ['MDX1-001', 'MDX1-002']
        }
      ],
      exchangeWarrantyNote: '2 years warranty, no exchange after 7 days',
      deliveryStatus: 'Self-delivered',
      deliveryReceivedStatus: 'Received', // NEW: Delivery tracking
      totalAmount: 250000,
      status: 'Paid',
      salesperson: '1', // Employee ID for Ahmed Khan
      salespersonLocation: 'Karachi',
      referFrom: 'Ahmed Khan', // NEW: Required field replacing clientDealBy
      referTo: 'Lahore Branch', // NEW: Optional referral destination
      createdBy: 'Admin',
      collectionMethod: 'Self Collection', // NEW: Collection method
      deductionCharges: 0 // NEW: Manually editable deduction
    },
    {
      id: '2',
      invoiceNumber: 'INV-2024-002',
      date: '2024-01-14',
      customerName: 'XYZ Enterprises',
      customerPhone: '+92 321 7654321',
      customerCNIC: '42101-7654321-9',
      customerProvince: 'Punjab',
      customerCity: 'Lahore',
      products: [
        {
          id: '1',
          productId: '3',
          productName: 'Handheld Detector HD-50',
          brandName: 'Handheld Detector',
          modelName: 'HD-50',
          category: 'Detection Equipment',
          description: 'Portable handheld metal detector',
          quantity: 5,
          price: 45000,
          total: 225000,
          serialNumbers: ['HD50-001', 'HD50-002', 'HD50-003', 'HD50-004', 'HD50-005']
        }
      ],
      exchangeWarrantyNote: '1 year warranty',
      deliveryStatus: 'Self-collect',
      deliveryReceivedStatus: 'Pending', // NEW: Delivery tracking
      totalAmount: 225000,
      status: 'Paid', // Changed to Paid so it can be used for commission calculation
      salesperson: '3', // Employee ID for Hassan Raza
      salespersonLocation: 'Lahore',
      referFrom: 'Hassan Raza', // NEW: Required field replacing clientDealBy
      referTo: '', // NEW: Optional referral destination
      createdBy: 'Admin',
      collectionMethod: 'Self Collection', // NEW: Collection method
      deductionCharges: 0 // NEW: Manually editable deduction
    }
  ],
  bankTransfers: [
    {
      id: '1',
      date: '2024-01-10',
      fromBankId: '1',
      fromBankName: 'HBL Main Branch',
      toBankId: '2',
      toBankName: 'UBL Corporate',
      amount: 100000,
      note: 'Operational fund transfer'
    }
  ],
  productTransfers: [
    {
      id: '1',
      date: '2024-01-15',
      productId: '1',
      productName: 'Metal Detector Pro X1',
      brandName: 'Metal Detector',
      modelName: 'Pro X1',
      serialNumbers: ['MDX1-003', 'MDX1-004'],
      fromLocation: 'Karachi',
      toLocation: 'Lahore',
      quantity: 2,
      transferredBy: 'Ahmed Khan',
      note: 'Transfer for sales'
    }
  ],
  commissionSlabs: [
    {
      id: '1',
      salesperson: '1', // Ahmed Khan
      city: 'Karachi',
      fromAmount: 0,
      toAmount: 500000,
      commissionPercentage: 5
    },
    {
      id: '2',
      salesperson: '1', // Ahmed Khan
      city: 'Karachi',
      fromAmount: 500001,
      toAmount: 1000000,
      commissionPercentage: 7
    },
    {
      id: '3',
      salesperson: '1', // Ahmed Khan
      city: 'Karachi',
      fromAmount: 1000001,
      toAmount: 2000000,
      commissionPercentage: 10
    },
    {
      id: '4',
      salesperson: '3', // Hassan Raza
      city: 'Lahore',
      fromAmount: 0,
      toAmount: 300000,
      commissionPercentage: 4
    },
    {
      id: '5',
      salesperson: '3', // Hassan Raza
      city: 'Lahore',
      fromAmount: 300001,
      toAmount: 600000,
      commissionPercentage: 6
    },
    {
      id: '6',
      salesperson: '3', // Hassan Raza
      city: 'Lahore',
      fromAmount: 600001,
      toAmount: 1000000,
      commissionPercentage: 8
    }
  ],
  productCosting: [],
  commissions: [
    {
      id: 'COM-001',
      salesperson: '1',
      salespersonName: 'Ahmed Khan',
      city: 'Karachi',
      month: '2024-01',
      totalSales: 250000,
      appliedSlabFrom: 0,
      appliedSlabTo: 500000,
      commissionPercentage: 5,
      calculatedCommissionAmount: 12500,
      status: 'Confirmed',
      calculatedBy: 'Admin',
      confirmedBy: 'Manager',
      calculatedAt: '2024-01-20T10:00:00Z',
      confirmedAt: '2024-01-25T14:30:00Z',
      isLocked: true
    },
    {
      id: 'COM-002',
      salesperson: '3',
      salespersonName: 'Hassan Raza',
      city: 'Lahore',
      month: '2024-01',
      totalSales: 225000,
      appliedSlabFrom: 0,
      appliedSlabTo: 300000,
      commissionPercentage: 4,
      calculatedCommissionAmount: 9000,
      status: 'Confirmed',
      calculatedBy: 'Admin',
      confirmedBy: 'Manager',
      calculatedAt: '2024-01-20T10:15:00Z',
      confirmedAt: '2024-01-25T15:00:00Z',
      isLocked: true
    },
    {
      id: 'COM-003',
      salesperson: '1',
      salespersonName: 'Ahmed Khan',
      city: 'Karachi',
      month: '2024-02',
      totalSales: 750000,
      appliedSlabFrom: 500001,
      appliedSlabTo: 1000000,
      commissionPercentage: 7,
      calculatedCommissionAmount: 52500,
      status: 'Calculated',
      calculatedBy: 'Admin',
      calculatedAt: '2024-02-20T09:00:00Z',
      isLocked: false
    },
    {
      id: 'COM-004',
      salesperson: '3',
      salespersonName: 'Hassan Raza',
      city: 'Lahore',
      month: '2024-02',
      totalSales: 450000,
      appliedSlabFrom: 300001,
      appliedSlabTo: 600000,
      commissionPercentage: 6,
      calculatedCommissionAmount: 27000,
      overriddenCommissionPercentage: 8,
      overriddenCommissionAmount: 36000,
      status: 'Adjusted',
      calculatedBy: 'Admin',
      confirmedBy: 'Manager',
      calculatedAt: '2024-02-20T09:30:00Z',
      confirmedAt: '2024-02-25T11:00:00Z',
      isLocked: true
    }
  ],
  budgets: [
    {
      id: '1',
      category: 'Expenses',
      subCategory: 'Salaries',
      period: 'Monthly',
      budgetLimit: 500000,
      spent: 450000,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-15T00:00:00.000Z'
    },
    {
      id: '2',
      category: 'Expenses',
      subCategory: 'Office Rent',
      period: 'Monthly',
      budgetLimit: 150000,
      spent: 150000,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-15T00:00:00.000Z'
    },
    {
      id: '3',
      category: 'Expenses',
      subCategory: 'Utilities',
      period: 'Monthly',
      budgetLimit: 80000,
      spent: 55000,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-15T00:00:00.000Z'
    },
    {
      id: '4',
      category: 'Expenses',
      subCategory: 'Marketing',
      period: 'Quarterly',
      budgetLimit: 200000,
      spent: 120000,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-15T00:00:00.000Z'
    }
  ]
};

export default function App() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [data, setData] = useState<AppData>(() => normalizeInitialData(initialData));
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard data={data} />;
      case 'employees':
        return <Employees employees={data.employees} setEmployees={(employees) => setData({ ...data, employees })} />;
      case 'products':
        return <Products products={data.products} setProducts={(products) => setData({ ...data, products })} productCosting={data.productCosting} />;
      case 'product-costing':
        return <ProductCosting products={data.products} productCosting={data.productCosting} setProductCosting={(productCosting) => setData({ ...data, productCosting })} />;
      case 'transactions':
        return <Transactions 
          transactions={data.transactions} 
          setTransactions={(transactions) => setData({ ...data, transactions })} 
          banks={data.banks}
          setBanks={(banks) => setData({ ...data, banks })}
        />;
      case 'loans':
        return <Loans 
          loans={data.loans} 
          setLoans={(loans) => setData({ ...data, loans })} 
          employees={data.employees}
          banks={data.banks}
          setBanks={(banks) => setData({ ...data, banks })}
        />;
      case 'banks':
        return <Banks banks={data.banks} setBanks={(banks) => setData({ ...data, banks })} />;
      case 'invoices':
        return <Invoices 
          invoices={data.invoices} 
          setInvoices={(invoices) => setData({ ...data, invoices })}
          products={data.products}
          setProducts={(products) => setData({ ...data, products })}
          banks={data.banks}
          employees={data.employees}
        />;
      case 'product-transfer':
        return <ProductTransfers
          products={data.products}
          setProducts={(products) => setData({ ...data, products })}
          transfers={data.productTransfers}
          setTransfers={(transfers) => setData({ ...data, productTransfers: transfers })}
        />;
  
      case 'bank-transfers':
        return <BankTransfers 
          transfers={data.bankTransfers}
          setTransfers={(transfers) => setData({ ...data, bankTransfers: transfers })}
          banks={data.banks}
          setBanks={(banks) => setData({ ...data, banks })}
        />;
      case 'transaction-history':
        return <TransactionHistory transactions={data.transactions} />;
      case 'pending-payments':
        return <PendingPayments 
          transactions={data.transactions}
          setTransactions={(transactions) => setData({ ...data, transactions })}
          banks={data.banks}
        />;
      case 'loan-history':
        return <LoanHistory loans={data.loans} />;
      case 'transfer-history':
        return <TransferHistory transfers={data.bankTransfers} />;
      case 'cash-inflow':
        return <CashInflow 
          transactions={data.transactions} 
          setTransactions={(transactions) => setData({ ...data, transactions })}
          banks={data.banks}
          setBanks={(banks) => setData({ ...data, banks })}
        />;
      case 'cash-outflow':
        return <CashOutflow 
          transactions={data.transactions} 
          setTransactions={(transactions) => setData({ ...data, transactions })}
          banks={data.banks}
          setBanks={(banks) => setData({ ...data, banks })}
        />;
      case 'bills':
        return <Bills 
          transactions={data.transactions} 
          setTransactions={(transactions) => setData({ ...data, transactions })}
          banks={data.banks}
          setBanks={(banks) => setData({ ...data, banks })}
        />;
      case 'salary':
        return <Salary
          transactions={data.transactions}
          setTransactions={(transactions) => setData({ ...data, transactions })}
          banks={data.banks}
          setBanks={(banks) => setData({ ...data, banks })}
          employees={data.employees}
          setActiveModule={setActiveModule}
        />;
      case 'advance-salary':
        return <AdvanceSalary
          employees={data.employees}
          banks={data.banks}
          transactions={data.transactions}
          setTransactions={(transactions) => setData({ ...data, transactions })}
          setBanks={(banks) => setData({ ...data, banks })}
        />;
      case 'loans-payable':
        return <LoansPayable 
          loans={data.loans} 
          setLoans={(loans) => setData({ ...data, loans })}
          employees={data.employees}
          banks={data.banks}
          setBanks={(banks) => setData({ ...data, banks })}
        />;
      case 'loans-receivable':
        return <LoansReceivable 
          loans={data.loans} 
          setLoans={(loans) => setData({ ...data, loans })}
          employees={data.employees}
          banks={data.banks}
          setBanks={(banks) => setData({ ...data, banks })}
        />;
      case 'cash-in-hand':
        return <CashInHand transactions={data.transactions} />;
      case 'sales-report':
        return <SalesReport invoices={data.invoices} products={data.products} />;
      case 'referral-report':
        return <ReferralReport invoices={data.invoices} />;
      case 'inventory-report':
        return <InventoryReport products={data.products} />;
      case 'transaction-history-report':
        return <TransactionHistoryReport transactions={data.transactions} />;
      case 'commission-slabs':
        return <CommissionSlabs commissionSlabs={data.commissionSlabs} setCommissionSlabs={(commissionSlabs) => setData({ ...data, commissionSlabs })} employees={data.employees} />;
      case 'commission-calculation':
        return <CommissionCalculation
          commissions={data.commissions}
          setCommissions={(commissions) => setData({ ...data, commissions })}
          commissionSlabs={data.commissionSlabs}
          invoices={data.invoices}
          employees={data.employees}
        />;
      case 'commission-report':
        return <CommissionReport commissions={data.commissions} />;
      case 'inventory-audit-log':
        return <InventoryAuditLogComponent auditLogs={[]} />;
      case 'budgets':
        return <Budgets budgets={data.budgets} setBudgets={(budgets) => setData({ ...data, budgets })} />;
      default:
        return <Dashboard data={data} />;
    }
  };

// In your App.tsx, find the header section and replace it with this:
return (
  <div className="flex h-screen bg-[#f0f2f5]">
    <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} />
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
  <TopBar notifications={notifications} setNotifications={setNotifications} />
</header>

      <main className="flex-1 overflow-y-auto">
        {renderModule()}
      </main>
    </div>
    <Toaster position="top-right" />
  </div>
);
}