import { BudgetInsertData, BudgetInsertVariables, BudgetUpdateData, BudgetUpdateVariables, BudgetDeleteData, BudgetDeleteVariables, BudgetUpdateSpentData, BudgetUpdateSpentVariables, ListBudgetsData, ListBudgetsVariables, GetBudgetByIdData, GetBudgetByIdVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useBudgetInsert(options?: useDataConnectMutationOptions<BudgetInsertData, FirebaseError, BudgetInsertVariables>): UseDataConnectMutationResult<BudgetInsertData, BudgetInsertVariables>;
export function useBudgetInsert(dc: DataConnect, options?: useDataConnectMutationOptions<BudgetInsertData, FirebaseError, BudgetInsertVariables>): UseDataConnectMutationResult<BudgetInsertData, BudgetInsertVariables>;

export function useBudgetUpdate(options?: useDataConnectMutationOptions<BudgetUpdateData, FirebaseError, BudgetUpdateVariables>): UseDataConnectMutationResult<BudgetUpdateData, BudgetUpdateVariables>;
export function useBudgetUpdate(dc: DataConnect, options?: useDataConnectMutationOptions<BudgetUpdateData, FirebaseError, BudgetUpdateVariables>): UseDataConnectMutationResult<BudgetUpdateData, BudgetUpdateVariables>;

export function useBudgetDelete(options?: useDataConnectMutationOptions<BudgetDeleteData, FirebaseError, BudgetDeleteVariables>): UseDataConnectMutationResult<BudgetDeleteData, BudgetDeleteVariables>;
export function useBudgetDelete(dc: DataConnect, options?: useDataConnectMutationOptions<BudgetDeleteData, FirebaseError, BudgetDeleteVariables>): UseDataConnectMutationResult<BudgetDeleteData, BudgetDeleteVariables>;

export function useBudgetUpdateSpent(options?: useDataConnectMutationOptions<BudgetUpdateSpentData, FirebaseError, BudgetUpdateSpentVariables>): UseDataConnectMutationResult<BudgetUpdateSpentData, BudgetUpdateSpentVariables>;
export function useBudgetUpdateSpent(dc: DataConnect, options?: useDataConnectMutationOptions<BudgetUpdateSpentData, FirebaseError, BudgetUpdateSpentVariables>): UseDataConnectMutationResult<BudgetUpdateSpentData, BudgetUpdateSpentVariables>;

export function useListBudgets(vars?: ListBudgetsVariables, options?: useDataConnectQueryOptions<ListBudgetsData>): UseDataConnectQueryResult<ListBudgetsData, ListBudgetsVariables>;
export function useListBudgets(dc: DataConnect, vars?: ListBudgetsVariables, options?: useDataConnectQueryOptions<ListBudgetsData>): UseDataConnectQueryResult<ListBudgetsData, ListBudgetsVariables>;

export function useGetBudgetById(vars: GetBudgetByIdVariables, options?: useDataConnectQueryOptions<GetBudgetByIdData>): UseDataConnectQueryResult<GetBudgetByIdData, GetBudgetByIdVariables>;
export function useGetBudgetById(dc: DataConnect, vars: GetBudgetByIdVariables, options?: useDataConnectQueryOptions<GetBudgetByIdData>): UseDataConnectQueryResult<GetBudgetByIdData, GetBudgetByIdVariables>;
