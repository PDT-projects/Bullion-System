import { ListEmployeesData, ListEmployeesVariables, GetEmployeeByIdData, GetEmployeeByIdVariables, EmployeeInsertData, EmployeeInsertVariables, EmployeeUpdateData, EmployeeUpdateVariables, EmployeeDeleteData, EmployeeDeleteVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useListEmployees(vars?: ListEmployeesVariables, options?: useDataConnectQueryOptions<ListEmployeesData>): UseDataConnectQueryResult<ListEmployeesData, ListEmployeesVariables>;
export function useListEmployees(dc: DataConnect, vars?: ListEmployeesVariables, options?: useDataConnectQueryOptions<ListEmployeesData>): UseDataConnectQueryResult<ListEmployeesData, ListEmployeesVariables>;

export function useGetEmployeeById(vars: GetEmployeeByIdVariables, options?: useDataConnectQueryOptions<GetEmployeeByIdData>): UseDataConnectQueryResult<GetEmployeeByIdData, GetEmployeeByIdVariables>;
export function useGetEmployeeById(dc: DataConnect, vars: GetEmployeeByIdVariables, options?: useDataConnectQueryOptions<GetEmployeeByIdData>): UseDataConnectQueryResult<GetEmployeeByIdData, GetEmployeeByIdVariables>;

export function useEmployeeInsert(options?: useDataConnectMutationOptions<EmployeeInsertData, FirebaseError, EmployeeInsertVariables | void>): UseDataConnectMutationResult<EmployeeInsertData, EmployeeInsertVariables>;
export function useEmployeeInsert(dc: DataConnect, options?: useDataConnectMutationOptions<EmployeeInsertData, FirebaseError, EmployeeInsertVariables | void>): UseDataConnectMutationResult<EmployeeInsertData, EmployeeInsertVariables>;

export function useEmployeeUpdate(options?: useDataConnectMutationOptions<EmployeeUpdateData, FirebaseError, EmployeeUpdateVariables | void>): UseDataConnectMutationResult<EmployeeUpdateData, EmployeeUpdateVariables>;
export function useEmployeeUpdate(dc: DataConnect, options?: useDataConnectMutationOptions<EmployeeUpdateData, FirebaseError, EmployeeUpdateVariables | void>): UseDataConnectMutationResult<EmployeeUpdateData, EmployeeUpdateVariables>;

export function useEmployeeDelete(options?: useDataConnectMutationOptions<EmployeeDeleteData, FirebaseError, EmployeeDeleteVariables | void>): UseDataConnectMutationResult<EmployeeDeleteData, EmployeeDeleteVariables>;
export function useEmployeeDelete(dc: DataConnect, options?: useDataConnectMutationOptions<EmployeeDeleteData, FirebaseError, EmployeeDeleteVariables | void>): UseDataConnectMutationResult<EmployeeDeleteData, EmployeeDeleteVariables>;
