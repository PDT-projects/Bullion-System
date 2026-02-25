// Mock data for charts and visualizations only
// All actual data (banks, transactions, products, etc.) will be loaded from Firebase

// Chart data structures - kept for visualization purposes
// These will be populated from actual transaction data

export const mockCashFlowData: { month: string; inflow: number; outflow: number }[] = [];

export const mockMonthlyTransactions: { 
  month: string; 
  inflow: number; 
  outflow: number; 
  inflowCount: number; 
  outflowCount: number 
}[] = [];

export const mockDailyTransactions: { 
  day: string; 
  inflow: number; 
  outflow: number; 
  count: number 
}[] = [];

export const mockIncomeExpenseData: { name: string; value: number }[] = [];

export const mockCategoryExpenseData: { category: string; amount: number }[] = [];

export const mockProductStockData: { 
  name: string; 
  stock: number; 
  category: string; 
  lowStock: boolean 
}[] = [];

export const mockCategoryData: { name: string; value: number }[] = [];

// Empty arrays - data will be loaded from Firebase
export const mockProducts: any[] = [];
export const mockTransactions: any[] = [];
export const mockData = {
  products: [],
  productTransfers: []
};

// Note: All actual business data (banks, transactions, products, employees, etc.)
// will be stored in and loaded from Firebase Data Connect database.
// Users will add data through the UI forms.
