import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface BankDeleteData {
  bank_delete?: Bank_Key | null;
}

export interface BankDeleteVariables {
  id: string;
}

export interface BankInsertData {
  bank_insert: Bank_Key;
}

export interface BankInsertVariables {
  id: string;
  name: string;
  accountNumber: string;
  balance: number;
}

export interface BankTransfer_Key {
  id: string;
  __typename?: 'BankTransfer_Key';
}

export interface BankUpdateData {
  bank_update?: Bank_Key | null;
}

export interface BankUpdateVariables {
  id: string;
  name: string;
  accountNumber: string;
  balance: number;
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

export interface CashInHandDeleteData {
  cashInHand_delete?: CashInHand_Key | null;
}

export interface CashInHandDeleteVariables {
  id: string;
}

export interface CashInHandInsertData {
  cashInHand_insert: CashInHand_Key;
}

export interface CashInHandInsertVariables {
  id: string;
  date: string;
  company: string;
  mainCategory: string;
  subCategory: string;
  amount: number;
  mode: string;
  note?: string | null;
}

export interface CashInHand_Key {
  id: string;
  __typename?: 'CashInHand_Key';
}

export interface Costing_Key {
  id: string;
  __typename?: 'Costing_Key';
}

export interface Employee_Key {
  id: string;
  __typename?: 'Employee_Key';
}

export interface GetBankByIdData {
  bank?: {
    id: string;
    name: string;
    accountNumber: string;
    balance: number;
    createdAt?: string | null;
    updatedAt?: string | null;
  } & Bank_Key;
}

export interface GetBankByIdVariables {
  id: string;
}

export interface GetCashInHandByIdData {
  cashInHand?: {
    id: string;
    date: string;
    company: string;
    mainCategory: string;
    subCategory: string;
    amount: number;
    mode: string;
    note?: string | null;
    createdAt?: string | null;
  } & CashInHand_Key;
}

export interface GetCashInHandByIdVariables {
  id: string;
}

export interface GetTransferByIdData {
  bankTransfer?: {
    id: string;
    date: string;
    fromBankId: string;
    fromBankName: string;
    toBankId: string;
    toBankName: string;
    amount: number;
    note?: string | null;
    createdAt?: string | null;
  } & BankTransfer_Key;
}

export interface GetTransferByIdVariables {
  id: string;
}

export interface ListBanksData {
  banks: ({
    id: string;
    name: string;
    accountNumber: string;
    balance: number;
    createdAt?: string | null;
    updatedAt?: string | null;
  } & Bank_Key)[];
}

export interface ListBanksVariables {
  limit?: number | null;
  offset?: number | null;
}

export interface ListCashInHandData {
  cashInHands: ({
    id: string;
    date: string;
    company: string;
    mainCategory: string;
    subCategory: string;
    amount: number;
    mode: string;
    note?: string | null;
    createdAt?: string | null;
  } & CashInHand_Key)[];
}

export interface ListCashInHandVariables {
  limit?: number | null;
  offset?: number | null;
}

export interface ListTransfersData {
  bankTransfers: ({
    id: string;
    date: string;
    fromBankId: string;
    fromBankName: string;
    toBankId: string;
    toBankName: string;
    amount: number;
    note?: string | null;
    createdAt?: string | null;
  } & BankTransfer_Key)[];
}

export interface ListTransfersVariables {
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

export interface TransferDeleteData {
  bankTransfer_delete?: BankTransfer_Key | null;
}

export interface TransferDeleteVariables {
  id: string;
}

export interface TransferInsertData {
  bankTransfer_insert: BankTransfer_Key;
}

export interface TransferInsertVariables {
  id: string;
  date: string;
  fromBankId: string;
  fromBankName: string;
  toBankId: string;
  toBankName: string;
  amount: number;
  note?: string | null;
}

export interface UpdateBankBalanceData {
  bank_update?: Bank_Key | null;
}

export interface UpdateBankBalanceVariables {
  id: string;
  newBalance: number;
}

interface BankInsertRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: BankInsertVariables): MutationRef<BankInsertData, BankInsertVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: BankInsertVariables): MutationRef<BankInsertData, BankInsertVariables>;
  operationName: string;
}
export const bankInsertRef: BankInsertRef;

export function bankInsert(vars: BankInsertVariables): MutationPromise<BankInsertData, BankInsertVariables>;
export function bankInsert(dc: DataConnect, vars: BankInsertVariables): MutationPromise<BankInsertData, BankInsertVariables>;

interface BankUpdateRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: BankUpdateVariables): MutationRef<BankUpdateData, BankUpdateVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: BankUpdateVariables): MutationRef<BankUpdateData, BankUpdateVariables>;
  operationName: string;
}
export const bankUpdateRef: BankUpdateRef;

export function bankUpdate(vars: BankUpdateVariables): MutationPromise<BankUpdateData, BankUpdateVariables>;
export function bankUpdate(dc: DataConnect, vars: BankUpdateVariables): MutationPromise<BankUpdateData, BankUpdateVariables>;

interface BankDeleteRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: BankDeleteVariables): MutationRef<BankDeleteData, BankDeleteVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: BankDeleteVariables): MutationRef<BankDeleteData, BankDeleteVariables>;
  operationName: string;
}
export const bankDeleteRef: BankDeleteRef;

export function bankDelete(vars: BankDeleteVariables): MutationPromise<BankDeleteData, BankDeleteVariables>;
export function bankDelete(dc: DataConnect, vars: BankDeleteVariables): MutationPromise<BankDeleteData, BankDeleteVariables>;

interface UpdateBankBalanceRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateBankBalanceVariables): MutationRef<UpdateBankBalanceData, UpdateBankBalanceVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateBankBalanceVariables): MutationRef<UpdateBankBalanceData, UpdateBankBalanceVariables>;
  operationName: string;
}
export const updateBankBalanceRef: UpdateBankBalanceRef;

export function updateBankBalance(vars: UpdateBankBalanceVariables): MutationPromise<UpdateBankBalanceData, UpdateBankBalanceVariables>;
export function updateBankBalance(dc: DataConnect, vars: UpdateBankBalanceVariables): MutationPromise<UpdateBankBalanceData, UpdateBankBalanceVariables>;

interface ListBanksRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListBanksVariables): QueryRef<ListBanksData, ListBanksVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: ListBanksVariables): QueryRef<ListBanksData, ListBanksVariables>;
  operationName: string;
}
export const listBanksRef: ListBanksRef;

export function listBanks(vars?: ListBanksVariables): QueryPromise<ListBanksData, ListBanksVariables>;
export function listBanks(dc: DataConnect, vars?: ListBanksVariables): QueryPromise<ListBanksData, ListBanksVariables>;

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

interface CashInHandInsertRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CashInHandInsertVariables): MutationRef<CashInHandInsertData, CashInHandInsertVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CashInHandInsertVariables): MutationRef<CashInHandInsertData, CashInHandInsertVariables>;
  operationName: string;
}
export const cashInHandInsertRef: CashInHandInsertRef;

export function cashInHandInsert(vars: CashInHandInsertVariables): MutationPromise<CashInHandInsertData, CashInHandInsertVariables>;
export function cashInHandInsert(dc: DataConnect, vars: CashInHandInsertVariables): MutationPromise<CashInHandInsertData, CashInHandInsertVariables>;

interface CashInHandDeleteRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CashInHandDeleteVariables): MutationRef<CashInHandDeleteData, CashInHandDeleteVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CashInHandDeleteVariables): MutationRef<CashInHandDeleteData, CashInHandDeleteVariables>;
  operationName: string;
}
export const cashInHandDeleteRef: CashInHandDeleteRef;

export function cashInHandDelete(vars: CashInHandDeleteVariables): MutationPromise<CashInHandDeleteData, CashInHandDeleteVariables>;
export function cashInHandDelete(dc: DataConnect, vars: CashInHandDeleteVariables): MutationPromise<CashInHandDeleteData, CashInHandDeleteVariables>;

interface ListCashInHandRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListCashInHandVariables): QueryRef<ListCashInHandData, ListCashInHandVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: ListCashInHandVariables): QueryRef<ListCashInHandData, ListCashInHandVariables>;
  operationName: string;
}
export const listCashInHandRef: ListCashInHandRef;

export function listCashInHand(vars?: ListCashInHandVariables): QueryPromise<ListCashInHandData, ListCashInHandVariables>;
export function listCashInHand(dc: DataConnect, vars?: ListCashInHandVariables): QueryPromise<ListCashInHandData, ListCashInHandVariables>;

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

interface TransferInsertRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: TransferInsertVariables): MutationRef<TransferInsertData, TransferInsertVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: TransferInsertVariables): MutationRef<TransferInsertData, TransferInsertVariables>;
  operationName: string;
}
export const transferInsertRef: TransferInsertRef;

export function transferInsert(vars: TransferInsertVariables): MutationPromise<TransferInsertData, TransferInsertVariables>;
export function transferInsert(dc: DataConnect, vars: TransferInsertVariables): MutationPromise<TransferInsertData, TransferInsertVariables>;

interface TransferDeleteRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: TransferDeleteVariables): MutationRef<TransferDeleteData, TransferDeleteVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: TransferDeleteVariables): MutationRef<TransferDeleteData, TransferDeleteVariables>;
  operationName: string;
}
export const transferDeleteRef: TransferDeleteRef;

export function transferDelete(vars: TransferDeleteVariables): MutationPromise<TransferDeleteData, TransferDeleteVariables>;
export function transferDelete(dc: DataConnect, vars: TransferDeleteVariables): MutationPromise<TransferDeleteData, TransferDeleteVariables>;

interface ListTransfersRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListTransfersVariables): QueryRef<ListTransfersData, ListTransfersVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: ListTransfersVariables): QueryRef<ListTransfersData, ListTransfersVariables>;
  operationName: string;
}
export const listTransfersRef: ListTransfersRef;

export function listTransfers(vars?: ListTransfersVariables): QueryPromise<ListTransfersData, ListTransfersVariables>;
export function listTransfers(dc: DataConnect, vars?: ListTransfersVariables): QueryPromise<ListTransfersData, ListTransfersVariables>;

interface GetTransferByIdRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetTransferByIdVariables): QueryRef<GetTransferByIdData, GetTransferByIdVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetTransferByIdVariables): QueryRef<GetTransferByIdData, GetTransferByIdVariables>;
  operationName: string;
}
export const getTransferByIdRef: GetTransferByIdRef;

export function getTransferById(vars: GetTransferByIdVariables): QueryPromise<GetTransferByIdData, GetTransferByIdVariables>;
export function getTransferById(dc: DataConnect, vars: GetTransferByIdVariables): QueryPromise<GetTransferByIdData, GetTransferByIdVariables>;

