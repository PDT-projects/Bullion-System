import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface BankTransfer_Key {
  id: string;
  __typename?: 'BankTransfer_Key';
}

export interface Bank_Key {
  id: string;
  __typename?: 'Bank_Key';
}

export interface Brand_Key {
  id: string;
  __typename?: 'Brand_Key';
}

export interface Budget_Key {
  id: string;
  __typename?: 'Budget_Key';
}

export interface CashInHand_Key {
  id: string;
  __typename?: 'CashInHand_Key';
}

export interface Costing_Key {
  id: string;
  __typename?: 'Costing_Key';
}

export interface CreateLoanData {
  loan_insert: Loan_Key;
}

export interface CreateLoanPaymentData {
  loanPayment_insert: LoanPayment_Key;
}

export interface CreateLoanPaymentVariables {
  id: string;
  loanId: string;
  amount: number;
  mode: string;
  date: string;
  bankId?: string | null;
  bankName?: string | null;
}

export interface CreateLoanVariables {
  id: string;
  lenderName?: string | null;
  borrowerName?: string | null;
  totalAmount: number;
  paid: number;
  remaining: number;
  loanDate: string;
  dueDate?: string | null;
  type: string;
  category: string;
  status: string;
  notes?: string | null;
  bankId?: string | null;
  bankName?: string | null;
  employeeId?: string | null;
}

export interface Employee_Key {
  id: string;
  __typename?: 'Employee_Key';
}

export interface GetLoanByIdData {
  loan?: {
    id: string;
    lenderName?: string | null;
    borrowerName?: string | null;
    totalAmount: number;
    paid: number;
    remaining: number;
    loanDate: string;
    dueDate?: string | null;
    type: string;
    category: string;
    status: string;
    notes?: string | null;
    bankId?: string | null;
    bankName?: string | null;
    employeeId?: string | null;
    employeeName?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  } & Loan_Key;
}

export interface GetLoanByIdVariables {
  id: string;
}

export interface GetLoanPaymentByIdData {
  loanPayment?: {
    id: string;
    loanId: string;
    amount: number;
    mode: string;
    date: string;
    bankId?: string | null;
    bankName?: string | null;
    notes?: string | null;
    createdAt?: string | null;
  } & LoanPayment_Key;
}

export interface GetLoanPaymentByIdVariables {
  id: string;
}

export interface ListLoanPaymentsData {
  loanPayments: ({
    id: string;
    loanId: string;
    amount: number;
    mode: string;
    date: string;
    bankId?: string | null;
    bankName?: string | null;
    notes?: string | null;
    createdAt?: string | null;
  } & LoanPayment_Key)[];
}

export interface ListLoanPaymentsVariables {
  limit?: number | null;
  offset?: number | null;
}

export interface ListLoansData {
  loans: ({
    id: string;
    lenderName?: string | null;
    borrowerName?: string | null;
    totalAmount: number;
    paid: number;
    remaining: number;
    loanDate: string;
    dueDate?: string | null;
    type: string;
    category: string;
    status: string;
    notes?: string | null;
    bankId?: string | null;
    bankName?: string | null;
    employeeId?: string | null;
    employeeName?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  } & Loan_Key)[];
}

export interface ListLoansVariables {
  limit?: number | null;
  offset?: number | null;
}

export interface LoanPayment_Key {
  id: string;
  __typename?: 'LoanPayment_Key';
}

export interface Loan_Key {
  id: string;
  __typename?: 'Loan_Key';
}

export interface Model_Key {
  id: string;
  __typename?: 'Model_Key';
}

export interface ProductTransfer_Key {
  id: string;
  __typename?: 'ProductTransfer_Key';
}

export interface Product_Key {
  id: string;
  __typename?: 'Product_Key';
}

interface CreateLoanRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateLoanVariables): MutationRef<CreateLoanData, CreateLoanVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateLoanVariables): MutationRef<CreateLoanData, CreateLoanVariables>;
  operationName: string;
}
export const createLoanRef: CreateLoanRef;

export function createLoan(vars: CreateLoanVariables): MutationPromise<CreateLoanData, CreateLoanVariables>;
export function createLoan(dc: DataConnect, vars: CreateLoanVariables): MutationPromise<CreateLoanData, CreateLoanVariables>;

interface CreateLoanPaymentRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateLoanPaymentVariables): MutationRef<CreateLoanPaymentData, CreateLoanPaymentVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateLoanPaymentVariables): MutationRef<CreateLoanPaymentData, CreateLoanPaymentVariables>;
  operationName: string;
}
export const createLoanPaymentRef: CreateLoanPaymentRef;

export function createLoanPayment(vars: CreateLoanPaymentVariables): MutationPromise<CreateLoanPaymentData, CreateLoanPaymentVariables>;
export function createLoanPayment(dc: DataConnect, vars: CreateLoanPaymentVariables): MutationPromise<CreateLoanPaymentData, CreateLoanPaymentVariables>;

interface ListLoansRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListLoansVariables): QueryRef<ListLoansData, ListLoansVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: ListLoansVariables): QueryRef<ListLoansData, ListLoansVariables>;
  operationName: string;
}
export const listLoansRef: ListLoansRef;

export function listLoans(vars?: ListLoansVariables): QueryPromise<ListLoansData, ListLoansVariables>;
export function listLoans(dc: DataConnect, vars?: ListLoansVariables): QueryPromise<ListLoansData, ListLoansVariables>;

interface GetLoanByIdRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetLoanByIdVariables): QueryRef<GetLoanByIdData, GetLoanByIdVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetLoanByIdVariables): QueryRef<GetLoanByIdData, GetLoanByIdVariables>;
  operationName: string;
}
export const getLoanByIdRef: GetLoanByIdRef;

export function getLoanById(vars: GetLoanByIdVariables): QueryPromise<GetLoanByIdData, GetLoanByIdVariables>;
export function getLoanById(dc: DataConnect, vars: GetLoanByIdVariables): QueryPromise<GetLoanByIdData, GetLoanByIdVariables>;

interface ListLoanPaymentsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListLoanPaymentsVariables): QueryRef<ListLoanPaymentsData, ListLoanPaymentsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: ListLoanPaymentsVariables): QueryRef<ListLoanPaymentsData, ListLoanPaymentsVariables>;
  operationName: string;
}
export const listLoanPaymentsRef: ListLoanPaymentsRef;

export function listLoanPayments(vars?: ListLoanPaymentsVariables): QueryPromise<ListLoanPaymentsData, ListLoanPaymentsVariables>;
export function listLoanPayments(dc: DataConnect, vars?: ListLoanPaymentsVariables): QueryPromise<ListLoanPaymentsData, ListLoanPaymentsVariables>;

interface GetLoanPaymentByIdRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetLoanPaymentByIdVariables): QueryRef<GetLoanPaymentByIdData, GetLoanPaymentByIdVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetLoanPaymentByIdVariables): QueryRef<GetLoanPaymentByIdData, GetLoanPaymentByIdVariables>;
  operationName: string;
}
export const getLoanPaymentByIdRef: GetLoanPaymentByIdRef;

export function getLoanPaymentById(vars: GetLoanPaymentByIdVariables): QueryPromise<GetLoanPaymentByIdData, GetLoanPaymentByIdVariables>;
export function getLoanPaymentById(dc: DataConnect, vars: GetLoanPaymentByIdVariables): QueryPromise<GetLoanPaymentByIdData, GetLoanPaymentByIdVariables>;

