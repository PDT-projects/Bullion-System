import { GetEmployeesData, GetEmployeeByIdData, GetEmployeeByIdVariables, CreateEmployeeData, CreateEmployeeVariables, UpdateEmployeeData, UpdateEmployeeVariables, DeleteEmployeeData, DeleteEmployeeVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useGetEmployees(options?: useDataConnectQueryOptions<GetEmployeesData>): UseDataConnectQueryResult<GetEmployeesData, undefined>;
export function useGetEmployees(dc: DataConnect, options?: useDataConnectQueryOptions<GetEmployeesData>): UseDataConnectQueryResult<GetEmployeesData, undefined>;

export function useGetEmployeeById(vars: GetEmployeeByIdVariables, options?: useDataConnectQueryOptions<GetEmployeeByIdData>): UseDataConnectQueryResult<GetEmployeeByIdData, GetEmployeeByIdVariables>;
export function useGetEmployeeById(dc: DataConnect, vars: GetEmployeeByIdVariables, options?: useDataConnectQueryOptions<GetEmployeeByIdData>): UseDataConnectQueryResult<GetEmployeeByIdData, GetEmployeeByIdVariables>;

export function useCreateEmployee(options?: useDataConnectMutationOptions<CreateEmployeeData, FirebaseError, CreateEmployeeVariables>): UseDataConnectMutationResult<CreateEmployeeData, CreateEmployeeVariables>;
export function useCreateEmployee(dc: DataConnect, options?: useDataConnectMutationOptions<CreateEmployeeData, FirebaseError, CreateEmployeeVariables>): UseDataConnectMutationResult<CreateEmployeeData, CreateEmployeeVariables>;

export function useUpdateEmployee(options?: useDataConnectMutationOptions<UpdateEmployeeData, FirebaseError, UpdateEmployeeVariables>): UseDataConnectMutationResult<UpdateEmployeeData, UpdateEmployeeVariables>;
export function useUpdateEmployee(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateEmployeeData, FirebaseError, UpdateEmployeeVariables>): UseDataConnectMutationResult<UpdateEmployeeData, UpdateEmployeeVariables>;

export function useDeleteEmployee(options?: useDataConnectMutationOptions<DeleteEmployeeData, FirebaseError, DeleteEmployeeVariables>): UseDataConnectMutationResult<DeleteEmployeeData, DeleteEmployeeVariables>;
export function useDeleteEmployee(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteEmployeeData, FirebaseError, DeleteEmployeeVariables>): UseDataConnectMutationResult<DeleteEmployeeData, DeleteEmployeeVariables>;
