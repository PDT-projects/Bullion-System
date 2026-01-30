// Mock data for charts and visualizations
export const mockCashFlowData = [
  { month: 'Jul', inflow: 450000, outflow: 320000 },
  { month: 'Aug', inflow: 520000, outflow: 380000 },
  { month: 'Sep', inflow: 480000, outflow: 350000 },
  { month: 'Oct', inflow: 580000, outflow: 420000 },
  { month: 'Nov', inflow: 620000, outflow: 450000 },
  { month: 'Dec', inflow: 550000, outflow: 390000 },
  { month: 'Jan', inflow: 735000, outflow: 610000 }
];

export const mockMonthlyTransactions = [
  { month: 'Jul', inflow: 125000, outflow: 95000, inflowCount: 12, outflowCount: 8 },
  { month: 'Aug', inflow: 145000, outflow: 110000, inflowCount: 15, outflowCount: 10 },
  { month: 'Sep', inflow: 135000, outflow: 105000, inflowCount: 13, outflowCount: 9 },
  { month: 'Oct', inflow: 165000, outflow: 125000, inflowCount: 18, outflowCount: 12 },
  { month: 'Nov', inflow: 175000, outflow: 135000, inflowCount: 20, outflowCount: 14 },
  { month: 'Dec', inflow: 155000, outflow: 115000, inflowCount: 16, outflowCount: 11 },
  { month: 'Jan', inflow: 195000, outflow: 155000, inflowCount: 22, outflowCount: 16 }
];

export const mockDailyTransactions = [
  { day: 'Jan 1', inflow: 25000, outflow: 18000, count: 5 },
  { day: 'Jan 2', inflow: 22000, outflow: 16000, count: 4 },
  { day: 'Jan 3', inflow: 28000, outflow: 20000, count: 6 },
  { day: 'Jan 4', inflow: 19000, outflow: 14000, count: 3 },
  { day: 'Jan 5', inflow: 32000, outflow: 24000, count: 7 },
  { day: 'Jan 6', inflow: 26000, outflow: 19000, count: 5 },
  { day: 'Jan 7', inflow: 21000, outflow: 15000, count: 4 },
  { day: 'Jan 8', inflow: 29000, outflow: 21000, count: 6 },
  { day: 'Jan 9', inflow: 24000, outflow: 17000, count: 5 },
  { day: 'Jan 10', inflow: 27000, outflow: 20000, count: 6 },
  { day: 'Jan 11', inflow: 23000, outflow: 16000, count: 4 },
  { day: 'Jan 12', inflow: 31000, outflow: 23000, count: 7 },
  { day: 'Jan 13', inflow: 25000, outflow: 18000, count: 5 },
  { day: 'Jan 14', inflow: 28000, outflow: 21000, count: 6 },
  { day: 'Jan 15', inflow: 20000, outflow: 15000, count: 4 }
];

export const mockIncomeExpenseData = [
  { name: 'Income', value: 735000 },
  { name: 'Expense', value: 610000 }
];

export const mockCategoryExpenseData = [
  { category: 'Salaries', amount: 250000 },
  { category: 'Office Rent', amount: 150000 },
  { category: 'Utilities', amount: 80000 },
  { category: 'Marketing', amount: 60000 },
  { category: 'Equipment', amount: 45000 },
  { category: 'Transportation', amount: 35000 },
  { category: 'Supplies', amount: 25000 },
  { category: 'Maintenance', amount: 20000 }
];

export const mockProductStockData = [
  { name: 'Metal Detector Pro X1', stock: 13, category: 'Detection Equipment', lowStock: false },
  { name: 'Security Scanner S200', stock: 8, category: 'Security Equipment', lowStock: false },
  { name: 'Handheld Detector HD-50', stock: 20, category: 'Detection Equipment', lowStock: false },
  { name: 'X-Ray Scanner XR-100', stock: 5, category: 'Imaging Equipment', lowStock: true },
  { name: 'Walk-through Metal Detector', stock: 3, category: 'Detection Equipment', lowStock: true },
  { name: 'Portable Scanner PS-300', stock: 7, category: 'Security Equipment', lowStock: false }
];

export const mockCategoryData = [
  { name: 'Detection Equipment', value: 41 },
  { name: 'Security Equipment', value: 15 },
  { name: 'Imaging Equipment', value: 5 }
];

export const mockProducts = [
  {
    id: 'mock-1',
    brandName: 'Metal Detector',
    modelName: 'Pro X1',
    category: 'Detection Equipment',
    costPrice: 100000,
    sellPrice: 125000,
    buyType: 'Import' as const,
    warrantyYears: 2,
    stock: 13,
    serialNumbers: ['MDX1-001', 'MDX1-002', 'MDX1-003'],
    serialCities: { 'MDX1-001': 'Karachi', 'MDX1-002': 'Lahore', 'MDX1-003': 'Islamabad' },
    description: 'Professional grade metal detector',
    status: 'New' as const
  },
  {
    id: 'mock-2',
    brandName: 'Security Scanner',
    modelName: 'S200',
    category: 'Security Equipment',
    costPrice: 200000,
    sellPrice: 250000,
    buyType: 'Export' as const,
    warrantyYears: 3,
    stock: 8,
    serialNumbers: ['SS200-001', 'SS200-002'],
    serialCities: { 'SS200-001': 'Karachi', 'SS200-002': 'Lahore' },
    description: 'High-precision security scanning system',
    status: 'New' as const
  },
  {
    id: 'mock-3',
    brandName: 'Handheld Detector',
    modelName: 'HD-50',
    category: 'Detection Equipment',
    costPrice: 30000,
    sellPrice: 45000,
    buyType: 'Import' as const,
    warrantyYears: 1,
    stock: 20,
    serialNumbers: ['HD50-001', 'HD50-002'],
    serialCities: { 'HD50-001': 'Karachi', 'HD50-002': 'Lahore' },
    description: 'Portable handheld metal detector',
    status: 'New' as const
  },
  {
    id: 'mock-4',
    brandName: 'X-Ray Scanner',
    modelName: 'XR-100',
    category: 'Imaging Equipment',
    costPrice: 400000,
    sellPrice: 450000,
    buyType: 'Export' as const,
    warrantyYears: 5,
    stock: 5,
    serialNumbers: ['XR100-001'],
    serialCities: { 'XR100-001': 'Karachi' },
    description: 'Advanced X-ray baggage scanner',
    status: 'New' as const
  }
];

export const mockTransactions = [
  {
    id: 'mock-1',
    transactionId: 'TXN-MOCK-001',
    date: '2024-01-15',
    time: '10:30',
    company: 'Pakistan Detectors Technologies',
    mainCategory: 'Cash Inflow' as const,
    subCategory: 'Product sale received',
    amount: 250000,
    mode: 'Bank' as const,
    bankId: '1',
    bankName: 'HBL Main Branch',
    note: 'Payment for Metal Detector Pro X1',
    paymentStatus: 'Full' as const,
    isFullyCleared: true,
    totalPaid: 250000,
    partialPayments: []
  },
  {
    id: 'mock-2',
    transactionId: 'TXN-MOCK-002',
    date: '2024-01-14',
    time: '14:15',
    company: 'Pakistan Detectors Technologies',
    mainCategory: 'Cash Outflow' as const,
    subCategory: 'Employee salary',
    amount: 85000,
    mode: 'Bank' as const,
    bankId: '2',
    bankName: 'UBL Corporate',
    note: 'January salary payment',
    paymentStatus: 'Full' as const,
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
    id: 'mock-3',
    transactionId: 'TXN-MOCK-003',
    date: '2024-01-13',
    time: '11:45',
    company: 'Pakistan Detectors Technologies',
    mainCategory: 'Cash Inflow' as const,
    subCategory: 'Payment received',
    amount: 150000,
    mode: 'Cash' as const,
    note: 'Customer payment - Security Scanner',
    paymentStatus: 'Full' as const,
    isFullyCleared: true,
    totalPaid: 150000,
    partialPayments: []
  },
  {
    id: 'mock-4',
    transactionId: 'TXN-MOCK-004',
    date: '2024-01-12',
    time: '09:30',
    company: 'Pakistan Detectors Technologies',
    mainCategory: 'Cash Outflow' as const,
    subCategory: 'Office Rent',
    amount: 50000,
    mode: 'Bank' as const,
    bankId: '1',
    bankName: 'HBL Main Branch',
    note: 'Monthly office rent payment',
    paymentStatus: 'Full' as const,
    isFullyCleared: true,
    totalPaid: 50000,
    partialPayments: []
  },
  {
    id: 'mock-5',
    transactionId: 'TXN-MOCK-005',
    date: '2024-01-11',
    time: '16:20',
    company: 'Pakistan Detectors Technologies',
    mainCategory: 'Cash Outflow' as const,
    subCategory: 'Utilities',
    amount: 25000,
    mode: 'Cash' as const,
    note: 'Electricity and water bills',
    paymentStatus: 'Full' as const,
    isFullyCleared: true,
    totalPaid: 25000,
    partialPayments: []
  }
];
