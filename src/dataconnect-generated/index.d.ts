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

export interface CashInHand_Key {
  id: string;
  __typename?: 'CashInHand_Key';
}

export interface CreateBankData {
  bank_insert: Bank_Key;
}

export interface CreateBankTransferData {
  bankTransfer_insert: BankTransfer_Key;
}

export interface CreateBankTransferVariables {
  id: string;
  date?: string | null;
  fromBankId?: string | null;
  fromBankName?: string | null;
  toBankId?: string | null;
  toBankName?: string | null;
  amount?: number | null;
  note?: string | null;
  createdAt?: string | null;
}

export interface CreateBankVariables {
  id: string;
  name?: string | null;
  accountNumber?: string | null;
  balance?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CreateCashInHandData {
  cashInHand_insert: CashInHand_Key;
}

export interface CreateCashInHandVariables {
  id: string;
  location?: string | null;
  balance?: number | null;
  lastUpdated?: string | null;
  updatedBy?: string | null;
}

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

export interface DeleteBankData {
  bank_delete?: Bank_Key | null;
}

export interface DeleteBankTransferData {
  bankTransfer_delete?: BankTransfer_Key | null;
}

export interface DeleteBankTransferVariables {
  id: string;
}

export interface DeleteBankVariables {
  id: string;
}

export interface DeleteCashInHandData {
  cashInHand_delete?: CashInHand_Key | null;
}

export interface DeleteCashInHandVariables {
  id: string;
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

export interface GetBankByIdData {
  bank?: {
    id: string;
    name?: string | null;
    accountNumber?: string | null;
    balance?: number | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  } & Bank_Key;
}

export interface GetBankByIdVariables {
  id: string;
}

export interface GetBankTransfersByBankData {
  bankTransfers: ({
    id: string;
    date?: string | null;
    fromBankId?: string | null;
    fromBankName?: string | null;
    toBankId?: string | null;
    toBankName?: string | null;
    amount?: number | null;
    note?: string | null;
    createdAt?: string | null;
  } & BankTransfer_Key)[];
}

export interface GetBankTransfersByBankVariables {
  bankId: string;
}

export interface GetBankTransfersData {
  bankTransfers: ({
    id: string;
    date?: string | null;
    fromBankId?: string | null;
    fromBankName?: string | null;
    toBankId?: string | null;
    toBankName?: string | null;
    amount?: number | null;
    note?: string | null;
    createdAt?: string | null;
  } & BankTransfer_Key)[];
}

export interface GetBanksData {
  banks: ({
    id: string;
    name?: string | null;
    accountNumber?: string | null;
    balance?: number | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  } & Bank_Key)[];
}

export interface GetCashInHandByIdData {
  cashInHand?: {
    id: string;
    location?: string | null;
    balance?: number | null;
    lastUpdated?: string | null;
    updatedBy?: string | null;
  } & CashInHand_Key;
}

export interface GetCashInHandByIdVariables {
  id: string;
}

export interface GetCashInHandByLocationData {
  cashInHands: ({
    id: string;
    location?: string | null;
    balance?: number | null;
    lastUpdated?: string | null;
    updatedBy?: string | null;
  } & CashInHand_Key)[];
}

export interface GetCashInHandByLocationVariables {
  location: string;
}

export interface GetCashInHandRecordsData {
  cashInHands: ({
    id: string;
    location?: string | null;
    balance?: number | null;
    lastUpdated?: string | null;
    updatedBy?: string | null;
  } & CashInHand_Key)[];
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

export interface UpdateBankData {
  bank_update?: Bank_Key | null;
}

export interface UpdateBankVariables {
  id: string;
  name?: string | null;
  accountNumber?: string | null;
  balance?: number | null;
  updatedAt?: string | null;
}

export interface UpdateCashInHandData {
  cashInHand_update?: CashInHand_Key | null;
}

export interface UpdateCashInHandVariables {
  id: string;
  balance?: number | null;
  lastUpdated?: string | null;
  updatedBy?: string | null;
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

interface GetBanksRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetBanksData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetBanksData, undefined>;
  operationName: string;
}
export const getBanksRef: GetBanksRef;

export function getBanks(): QueryPromise<GetBanksData, undefined>;
export function getBanks(dc: DataConnect): QueryPromise<GetBanksData, undefined>;

interface GetBankByIdRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetBankByIdVariables): QueryRef<GetBankByIdData, GetBankByIdVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetBankByIdVariables): QueryRef<GetBankByIdData, GetBankByIdVariables>;
  operationName: string;
}
export const getBankByIdRef: GetBankByIdRef;

export function getBankById(vars: GetBankByIdVariables): QueryPromise<GetBankByIdData, GetBankByIdVariables>;
export function getBankById(dc: DataConnect, vars: GetBankByIdVariables): QueryPromise<GetBankByIdData, GetBankByIdVariables>;

interface CreateBankRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateBankVariables): MutationRef<CreateBankData, CreateBankVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateBankVariables): MutationRef<CreateBankData, CreateBankVariables>;
  operationName: string;
}
export const createBankRef: CreateBankRef;

export function createBank(vars: CreateBankVariables): MutationPromise<CreateBankData, CreateBankVariables>;
export function createBank(dc: DataConnect, vars: CreateBankVariables): MutationPromise<CreateBankData, CreateBankVariables>;

interface UpdateBankRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateBankVariables): MutationRef<UpdateBankData, UpdateBankVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateBankVariables): MutationRef<UpdateBankData, UpdateBankVariables>;
  operationName: string;
}
export const updateBankRef: UpdateBankRef;

export function updateBank(vars: UpdateBankVariables): MutationPromise<UpdateBankData, UpdateBankVariables>;
export function updateBank(dc: DataConnect, vars: UpdateBankVariables): MutationPromise<UpdateBankData, UpdateBankVariables>;

interface DeleteBankRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteBankVariables): MutationRef<DeleteBankData, DeleteBankVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteBankVariables): MutationRef<DeleteBankData, DeleteBankVariables>;
  operationName: string;
}
export const deleteBankRef: DeleteBankRef;

export function deleteBank(vars: DeleteBankVariables): MutationPromise<DeleteBankData, DeleteBankVariables>;
export function deleteBank(dc: DataConnect, vars: DeleteBankVariables): MutationPromise<DeleteBankData, DeleteBankVariables>;

interface GetCashInHandRecordsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetCashInHandRecordsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetCashInHandRecordsData, undefined>;
  operationName: string;
}
export const getCashInHandRecordsRef: GetCashInHandRecordsRef;

export function getCashInHandRecords(): QueryPromise<GetCashInHandRecordsData, undefined>;
export function getCashInHandRecords(dc: DataConnect): QueryPromise<GetCashInHandRecordsData, undefined>;

interface GetCashInHandByLocationRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetCashInHandByLocationVariables): QueryRef<GetCashInHandByLocationData, GetCashInHandByLocationVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetCashInHandByLocationVariables): QueryRef<GetCashInHandByLocationData, GetCashInHandByLocationVariables>;
  operationName: string;
}
export const getCashInHandByLocationRef: GetCashInHandByLocationRef;

export function getCashInHandByLocation(vars: GetCashInHandByLocationVariables): QueryPromise<GetCashInHandByLocationData, GetCashInHandByLocationVariables>;
export function getCashInHandByLocation(dc: DataConnect, vars: GetCashInHandByLocationVariables): QueryPromise<GetCashInHandByLocationData, GetCashInHandByLocationVariables>;

interface GetCashInHandByIdRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetCashInHandByIdVariables): QueryRef<GetCashInHandByIdData, GetCashInHandByIdVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetCashInHandByIdVariables): QueryRef<GetCashInHandByIdData, GetCashInHandByIdVariables>;
  operationName: string;
}
export const getCashInHandByIdRef: GetCashInHandByIdRef;

export function getCashInHandById(vars: GetCashInHandByIdVariables): QueryPromise<GetCashInHandByIdData, GetCashInHandByIdVariables>;
export function getCashInHandById(dc: DataConnect, vars: GetCashInHandByIdVariables): QueryPromise<GetCashInHandByIdData, GetCashInHandByIdVariables>;

interface CreateCashInHandRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateCashInHandVariables): MutationRef<CreateCashInHandData, CreateCashInHandVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateCashInHandVariables): MutationRef<CreateCashInHandData, CreateCashInHandVariables>;
  operationName: string;
}
export const createCashInHandRef: CreateCashInHandRef;

export function createCashInHand(vars: CreateCashInHandVariables): MutationPromise<CreateCashInHandData, CreateCashInHandVariables>;
export function createCashInHand(dc: DataConnect, vars: CreateCashInHandVariables): MutationPromise<CreateCashInHandData, CreateCashInHandVariables>;

interface UpdateCashInHandRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateCashInHandVariables): MutationRef<UpdateCashInHandData, UpdateCashInHandVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateCashInHandVariables): MutationRef<UpdateCashInHandData, UpdateCashInHandVariables>;
  operationName: string;
}
export const updateCashInHandRef: UpdateCashInHandRef;

export function updateCashInHand(vars: UpdateCashInHandVariables): MutationPromise<UpdateCashInHandData, UpdateCashInHandVariables>;
export function updateCashInHand(dc: DataConnect, vars: UpdateCashInHandVariables): MutationPromise<UpdateCashInHandData, UpdateCashInHandVariables>;

interface DeleteCashInHandRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteCashInHandVariables): MutationRef<DeleteCashInHandData, DeleteCashInHandVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteCashInHandVariables): MutationRef<DeleteCashInHandData, DeleteCashInHandVariables>;
  operationName: string;
}
export const deleteCashInHandRef: DeleteCashInHandRef;

export function deleteCashInHand(vars: DeleteCashInHandVariables): MutationPromise<DeleteCashInHandData, DeleteCashInHandVariables>;
export function deleteCashInHand(dc: DataConnect, vars: DeleteCashInHandVariables): MutationPromise<DeleteCashInHandData, DeleteCashInHandVariables>;

interface GetBankTransfersRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetBankTransfersData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetBankTransfersData, undefined>;
  operationName: string;
}
export const getBankTransfersRef: GetBankTransfersRef;

export function getBankTransfers(): QueryPromise<GetBankTransfersData, undefined>;
export function getBankTransfers(dc: DataConnect): QueryPromise<GetBankTransfersData, undefined>;

interface GetBankTransfersByBankRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetBankTransfersByBankVariables): QueryRef<GetBankTransfersByBankData, GetBankTransfersByBankVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetBankTransfersByBankVariables): QueryRef<GetBankTransfersByBankData, GetBankTransfersByBankVariables>;
  operationName: string;
}
export const getBankTransfersByBankRef: GetBankTransfersByBankRef;

export function getBankTransfersByBank(vars: GetBankTransfersByBankVariables): QueryPromise<GetBankTransfersByBankData, GetBankTransfersByBankVariables>;
export function getBankTransfersByBank(dc: DataConnect, vars: GetBankTransfersByBankVariables): QueryPromise<GetBankTransfersByBankData, GetBankTransfersByBankVariables>;

interface CreateBankTransferRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateBankTransferVariables): MutationRef<CreateBankTransferData, CreateBankTransferVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateBankTransferVariables): MutationRef<CreateBankTransferData, CreateBankTransferVariables>;
  operationName: string;
}
export const createBankTransferRef: CreateBankTransferRef;

export function createBankTransfer(vars: CreateBankTransferVariables): MutationPromise<CreateBankTransferData, CreateBankTransferVariables>;
export function createBankTransfer(dc: DataConnect, vars: CreateBankTransferVariables): MutationPromise<CreateBankTransferData, CreateBankTransferVariables>;

interface DeleteBankTransferRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteBankTransferVariables): MutationRef<DeleteBankTransferData, DeleteBankTransferVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteBankTransferVariables): MutationRef<DeleteBankTransferData, DeleteBankTransferVariables>;
  operationName: string;
}
export const deleteBankTransferRef: DeleteBankTransferRef;

export function deleteBankTransfer(vars: DeleteBankTransferVariables): MutationPromise<DeleteBankTransferData, DeleteBankTransferVariables>;
export function deleteBankTransfer(dc: DataConnect, vars: DeleteBankTransferVariables): MutationPromise<DeleteBankTransferData, DeleteBankTransferVariables>;

