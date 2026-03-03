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

export interface BudgetDeleteData {
  budget_delete?: Budget_Key | null;
}

export interface BudgetDeleteVariables {
  id: string;
}

export interface BudgetInsertData {
  budget_insert: Budget_Key;
}

export interface BudgetInsertVariables {
  id: string;
  category: string;
  subCategory: string;
  period: string;
  budgetLimit: number;
  spent: number;
}

export interface BudgetUpdateData {
  budget_update?: Budget_Key | null;
}

export interface BudgetUpdateSpentData {
  budget_update?: Budget_Key | null;
}

export interface BudgetUpdateSpentVariables {
  id: string;
  spent: number;
}

export interface BudgetUpdateVariables {
  id: string;
  category: string;
  subCategory: string;
  period: string;
  budgetLimit: number;
  spent: number;
}

export interface Budget_Key {
  id: string;
  __typename?: 'Budget_Key';
}

export interface CashInHand_Key {
  id: string;
  __typename?: 'CashInHand_Key';
}

export interface Employee_Key {
  id: string;
  __typename?: 'Employee_Key';
}

export interface GetBudgetByIdData {
  budget?: {
    id: string;
    category: string;
    subCategory: string;
    period: string;
    budgetLimit: number;
    spent: number;
    createdAt?: string | null;
    updatedAt?: string | null;
  } & Budget_Key;
}

export interface GetBudgetByIdVariables {
  id: string;
}

export interface ListBudgetsData {
  budgets: ({
    id: string;
    category: string;
    subCategory: string;
    period: string;
    budgetLimit: number;
    spent: number;
    createdAt?: string | null;
    updatedAt?: string | null;
  } & Budget_Key)[];
}

export interface ListBudgetsVariables {
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

export interface ProductTransfer_Key {
  id: string;
  __typename?: 'ProductTransfer_Key';
}

export interface Product_Key {
  id: string;
  __typename?: 'Product_Key';
}

interface BudgetInsertRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: BudgetInsertVariables): MutationRef<BudgetInsertData, BudgetInsertVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: BudgetInsertVariables): MutationRef<BudgetInsertData, BudgetInsertVariables>;
  operationName: string;
}
export const budgetInsertRef: BudgetInsertRef;

export function budgetInsert(vars: BudgetInsertVariables): MutationPromise<BudgetInsertData, BudgetInsertVariables>;
export function budgetInsert(dc: DataConnect, vars: BudgetInsertVariables): MutationPromise<BudgetInsertData, BudgetInsertVariables>;

interface BudgetUpdateRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: BudgetUpdateVariables): MutationRef<BudgetUpdateData, BudgetUpdateVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: BudgetUpdateVariables): MutationRef<BudgetUpdateData, BudgetUpdateVariables>;
  operationName: string;
}
export const budgetUpdateRef: BudgetUpdateRef;

export function budgetUpdate(vars: BudgetUpdateVariables): MutationPromise<BudgetUpdateData, BudgetUpdateVariables>;
export function budgetUpdate(dc: DataConnect, vars: BudgetUpdateVariables): MutationPromise<BudgetUpdateData, BudgetUpdateVariables>;

interface BudgetDeleteRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: BudgetDeleteVariables): MutationRef<BudgetDeleteData, BudgetDeleteVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: BudgetDeleteVariables): MutationRef<BudgetDeleteData, BudgetDeleteVariables>;
  operationName: string;
}
export const budgetDeleteRef: BudgetDeleteRef;

export function budgetDelete(vars: BudgetDeleteVariables): MutationPromise<BudgetDeleteData, BudgetDeleteVariables>;
export function budgetDelete(dc: DataConnect, vars: BudgetDeleteVariables): MutationPromise<BudgetDeleteData, BudgetDeleteVariables>;

interface BudgetUpdateSpentRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: BudgetUpdateSpentVariables): MutationRef<BudgetUpdateSpentData, BudgetUpdateSpentVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: BudgetUpdateSpentVariables): MutationRef<BudgetUpdateSpentData, BudgetUpdateSpentVariables>;
  operationName: string;
}
export const budgetUpdateSpentRef: BudgetUpdateSpentRef;

export function budgetUpdateSpent(vars: BudgetUpdateSpentVariables): MutationPromise<BudgetUpdateSpentData, BudgetUpdateSpentVariables>;
export function budgetUpdateSpent(dc: DataConnect, vars: BudgetUpdateSpentVariables): MutationPromise<BudgetUpdateSpentData, BudgetUpdateSpentVariables>;

interface ListBudgetsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListBudgetsVariables): QueryRef<ListBudgetsData, ListBudgetsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: ListBudgetsVariables): QueryRef<ListBudgetsData, ListBudgetsVariables>;
  operationName: string;
}
export const listBudgetsRef: ListBudgetsRef;

export function listBudgets(vars?: ListBudgetsVariables): QueryPromise<ListBudgetsData, ListBudgetsVariables>;
export function listBudgets(dc: DataConnect, vars?: ListBudgetsVariables): QueryPromise<ListBudgetsData, ListBudgetsVariables>;

interface GetBudgetByIdRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetBudgetByIdVariables): QueryRef<GetBudgetByIdData, GetBudgetByIdVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetBudgetByIdVariables): QueryRef<GetBudgetByIdData, GetBudgetByIdVariables>;
  operationName: string;
}
export const getBudgetByIdRef: GetBudgetByIdRef;

export function getBudgetById(vars: GetBudgetByIdVariables): QueryPromise<GetBudgetByIdData, GetBudgetByIdVariables>;
export function getBudgetById(dc: DataConnect, vars: GetBudgetByIdVariables): QueryPromise<GetBudgetByIdData, GetBudgetByIdVariables>;

