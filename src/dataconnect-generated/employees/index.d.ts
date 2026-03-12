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

export interface EmployeeDeleteData {
  employee_delete?: Employee_Key | null;
}

export interface EmployeeDeleteVariables {
  id?: string;
}

export interface EmployeeInsertData {
  employee_insert: Employee_Key;
}

export interface EmployeeInsertVariables {
  id?: string;
  name?: string;
  position?: string;
  salary?: number;
  phone?: string;
  email?: string;
  joinDate?: string;
  status?: string;
  location?: string;
  accountNumber?: string | null;
  bankName?: string | null;
  accountTitle?: string | null;
}

export interface EmployeeUpdateData {
  employee_update?: Employee_Key | null;
}

export interface EmployeeUpdateVariables {
  id?: string;
  name?: string;
  position?: string;
  salary?: number;
  phone?: string;
  email?: string;
  joinDate?: string;
  status?: string;
  location?: string;
  accountNumber?: string | null;
  bankName?: string | null;
  accountTitle?: string | null;
}

export interface Employee_Key {
  id: string;
  __typename?: 'Employee_Key';
}

export interface GetEmployeeByIdData {
  employee?: {
    id: string;
    name: string;
    position: string;
    salary: number;
    phone: string;
    email: string;
    joinDate: string;
    status: string;
    location: string;
    accountNumber?: string | null;
    bankName?: string | null;
    accountTitle?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  } & Employee_Key;
}

export interface GetEmployeeByIdVariables {
  id: string;
}

export interface ListEmployeesData {
  employees: ({
    id: string;
    name: string;
    position: string;
    salary: number;
    phone: string;
    email: string;
    joinDate: string;
    status: string;
    location: string;
    accountNumber?: string | null;
    bankName?: string | null;
    accountTitle?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  } & Employee_Key)[];
}

export interface ListEmployeesVariables {
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

interface ListEmployeesRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListEmployeesVariables): QueryRef<ListEmployeesData, ListEmployeesVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: ListEmployeesVariables): QueryRef<ListEmployeesData, ListEmployeesVariables>;
  operationName: string;
}
export const listEmployeesRef: ListEmployeesRef;

export function listEmployees(vars?: ListEmployeesVariables): QueryPromise<ListEmployeesData, ListEmployeesVariables>;
export function listEmployees(dc: DataConnect, vars?: ListEmployeesVariables): QueryPromise<ListEmployeesData, ListEmployeesVariables>;

interface GetEmployeeByIdRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetEmployeeByIdVariables): QueryRef<GetEmployeeByIdData, GetEmployeeByIdVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetEmployeeByIdVariables): QueryRef<GetEmployeeByIdData, GetEmployeeByIdVariables>;
  operationName: string;
}
export const getEmployeeByIdRef: GetEmployeeByIdRef;

export function getEmployeeById(vars: GetEmployeeByIdVariables): QueryPromise<GetEmployeeByIdData, GetEmployeeByIdVariables>;
export function getEmployeeById(dc: DataConnect, vars: GetEmployeeByIdVariables): QueryPromise<GetEmployeeByIdData, GetEmployeeByIdVariables>;

interface EmployeeInsertRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: EmployeeInsertVariables): MutationRef<EmployeeInsertData, EmployeeInsertVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: EmployeeInsertVariables): MutationRef<EmployeeInsertData, EmployeeInsertVariables>;
  operationName: string;
}
export const employeeInsertRef: EmployeeInsertRef;

export function employeeInsert(vars?: EmployeeInsertVariables): MutationPromise<EmployeeInsertData, EmployeeInsertVariables>;
export function employeeInsert(dc: DataConnect, vars?: EmployeeInsertVariables): MutationPromise<EmployeeInsertData, EmployeeInsertVariables>;

interface EmployeeUpdateRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: EmployeeUpdateVariables): MutationRef<EmployeeUpdateData, EmployeeUpdateVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: EmployeeUpdateVariables): MutationRef<EmployeeUpdateData, EmployeeUpdateVariables>;
  operationName: string;
}
export const employeeUpdateRef: EmployeeUpdateRef;

export function employeeUpdate(vars?: EmployeeUpdateVariables): MutationPromise<EmployeeUpdateData, EmployeeUpdateVariables>;
export function employeeUpdate(dc: DataConnect, vars?: EmployeeUpdateVariables): MutationPromise<EmployeeUpdateData, EmployeeUpdateVariables>;

interface EmployeeDeleteRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: EmployeeDeleteVariables): MutationRef<EmployeeDeleteData, EmployeeDeleteVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: EmployeeDeleteVariables): MutationRef<EmployeeDeleteData, EmployeeDeleteVariables>;
  operationName: string;
}
export const employeeDeleteRef: EmployeeDeleteRef;

export function employeeDelete(vars?: EmployeeDeleteVariables): MutationPromise<EmployeeDeleteData, EmployeeDeleteVariables>;
export function employeeDelete(dc: DataConnect, vars?: EmployeeDeleteVariables): MutationPromise<EmployeeDeleteData, EmployeeDeleteVariables>;

