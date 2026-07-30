// Payroll Batch Module - Types
// Matches the Excel sheet columns exactly:
// Select | Year | Salary Month | Emp ID | Employee Name | Department | Designation
// Basic Salary | Overtime | Performance Bonus | Commission | Gross Earning
// Leaves | Late Arrival | Early Depart | Penalty | Total Deductions
// Net Salary | Advance Salary | Remaining Amount
// Work Status | Approved Status by HR | Approved By Manager/Chief
// Make Payment | Payment Status | Generate Pay Slip | View Bank Slip

export type PayrollBatchStatus = 'Draft' | 'Pending' | 'Approved' | 'Paid' | 'Rejected';
export type WorkStatus         = 'Active' | 'Inactive';
export type ApprovalStatus     = 'Pending' | 'Approved' | 'Rejected';
export type PaymentStatus      = 'Pending' | 'Paid' | 'Partial';

export interface PayrollBatchRow {
  id:                  string;
  batchId:             string;       // which batch this row belongs to
  // Employee info
  empId:               string;       // employee Firestore ID
  empCode:             string;       // display Emp ID (e.g. EMP-001)
  employeeName:        string;
  department:          string;
  designation:         string;
  // Period
  year:                number;
  salaryMonth:         string;       // YYYY-MM
  // Earnings
  basicSalary:         number;
  overtime:            number;
  performanceBonus:    number;
  commission:          number;
  grossEarning:        number;       // auto = basicSalary + overtime + performanceBonus + commission
  // Deductions
  leaves:              number;       // days
  lateArrival:         number;       // AED deduction
  earlyDepart:         number;       // AED deduction
  penalty:             number;       // AED deduction
  totalDeductions:     number;       // auto = lateArrival + earlyDepart + penalty
  // Net
  netSalary:           number;       // auto = grossEarning - totalDeductions
  advanceSalary:       number;       // advance already paid this month
  remainingAmount:     number;       // auto = netSalary - advanceSalary
  // Status
  workStatus:          WorkStatus;
  approvedByHR:        ApprovalStatus;
  approvedByManager:   ApprovalStatus;
  paymentStatus:       PaymentStatus;
  // Meta
  paySlipGenerated:    boolean;
  paySlipUrl?:         string;
  bankSlipUrl?:        string;
  paidAt?:             string;
  paidBy?:             string;
  createdAt:           string;
  updatedAt:           string;
}

export interface PayrollBatch {
  id:          string;
  month:       string;   // YYYY-MM
  year:        number;
  title:       string;   // e.g. "July 2026 Payroll"
  status:      PayrollBatchStatus;
  totalRows:   number;
  totalNet:    number;
  createdBy:   string;
  createdAt:   string;
  updatedAt:   string;
}

export interface PayrollBatchFilter {
  search:        string;
  department:    string;
  paymentStatus: PaymentStatus | '';
  workStatus:    WorkStatus | '';
  approvalStatus:ApprovalStatus | '';
}