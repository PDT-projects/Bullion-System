import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface CreateEmployeeData {
  employee_insert: Employee_Key;
}

export interface CreateEmployeeVariables {
  id: string;
  name?: string | null;
  position?: string | null;
  salary?: number | null;
  phone?: string | null;
  email?: string | null;
  joinDate?: string | null;
  status?: string | null;
  location?: string | null;
  accountNumber?: string | null;
  bankName?: string | null;
  accountTitle?: string | null;
}

export interface DeleteEmployeeData {
  employee_delete?: Employee_Key | null;
}

export interface DeleteEmployeeVariables {
  id: string;
}

export interface Employee_Key {
  id: string;
  __typename?: 'Employee_Key';
}

export interface GetEmployeeByIdData {
  employee?: {
    id: string;
    name?: string | null;
    position?: string | null;
    salary?: number | null;
    phone?: string | null;
    email?: string | null;
    joinDate?: string | null;
    status?: string | null;
    location?: string | null;
    accountNumber?: string | null;
    bankName?: string | null;
    accountTitle?: string | null;
  } & Employee_Key;
}

export interface GetEmployeeByIdVariables {
  id: string;
}

export interface GetEmployeesData {
  employees: ({
    id: string;
    name?: string | null;
    position?: string | null;
    salary?: number | null;
    phone?: string | null;
    email?: string | null;
    joinDate?: string | null;
    status?: string | null;
    location?: string | null;
    accountNumber?: string | null;
    bankName?: string | null;
    accountTitle?: string | null;
  } & Employee_Key)[];
}

export interface UpdateEmployeeData {
  employee_update?: Employee_Key | null;
}

export interface UpdateEmployeeVariables {
  id: string;
  name?: string | null;
  position?: string | null;
  salary?: number | null;
  phone?: string | null;
  email?: string | null;
  joinDate?: string | null;
  status?: string | null;
  location?: string | null;
  accountNumber?: string | null;
  bankName?: string | null;
  accountTitle?: string | null;
}

interface GetEmployeesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetEmployeesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetEmployeesData, undefined>;
  operationName: string;
}
export const getEmployeesRef: GetEmployeesRef;

export function getEmployees(): QueryPromise<GetEmployeesData, undefined>;
export function getEmployees(dc: DataConnect): QueryPromise<GetEmployeesData, undefined>;

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

interface CreateEmployeeRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateEmployeeVariables): MutationRef<CreateEmployeeData, CreateEmployeeVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateEmployeeVariables): MutationRef<CreateEmployeeData, CreateEmployeeVariables>;
  operationName: string;
}
export const createEmployeeRef: CreateEmployeeRef;

export function createEmployee(vars: CreateEmployeeVariables): MutationPromise<CreateEmployeeData, CreateEmployeeVariables>;
export function createEmployee(dc: DataConnect, vars: CreateEmployeeVariables): MutationPromise<CreateEmployeeData, CreateEmployeeVariables>;

interface UpdateEmployeeRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateEmployeeVariables): MutationRef<UpdateEmployeeData, UpdateEmployeeVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateEmployeeVariables): MutationRef<UpdateEmployeeData, UpdateEmployeeVariables>;
  operationName: string;
}
export const updateEmployeeRef: UpdateEmployeeRef;

export function updateEmployee(vars: UpdateEmployeeVariables): MutationPromise<UpdateEmployeeData, UpdateEmployeeVariables>;
export function updateEmployee(dc: DataConnect, vars: UpdateEmployeeVariables): MutationPromise<UpdateEmployeeData, UpdateEmployeeVariables>;

interface DeleteEmployeeRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteEmployeeVariables): MutationRef<DeleteEmployeeData, DeleteEmployeeVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteEmployeeVariables): MutationRef<DeleteEmployeeData, DeleteEmployeeVariables>;
  operationName: string;
}
export const deleteEmployeeRef: DeleteEmployeeRef;

export function deleteEmployee(vars: DeleteEmployeeVariables): MutationPromise<DeleteEmployeeData, DeleteEmployeeVariables>;
export function deleteEmployee(dc: DataConnect, vars: DeleteEmployeeVariables): MutationPromise<DeleteEmployeeData, DeleteEmployeeVariables>;

