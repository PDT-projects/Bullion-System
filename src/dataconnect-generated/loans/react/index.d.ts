import { CreateLoanData, CreateLoanVariables, CreateLoanPaymentData, CreateLoanPaymentVariables, ListLoansData, ListLoansVariables, GetLoanByIdData, GetLoanByIdVariables, ListLoanPaymentsData, ListLoanPaymentsVariables, GetLoanPaymentByIdData, GetLoanPaymentByIdVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateLoan(options?: useDataConnectMutationOptions<CreateLoanData, FirebaseError, CreateLoanVariables>): UseDataConnectMutationResult<CreateLoanData, CreateLoanVariables>;
export function useCreateLoan(dc: DataConnect, options?: useDataConnectMutationOptions<CreateLoanData, FirebaseError, CreateLoanVariables>): UseDataConnectMutationResult<CreateLoanData, CreateLoanVariables>;

export function useCreateLoanPayment(options?: useDataConnectMutationOptions<CreateLoanPaymentData, FirebaseError, CreateLoanPaymentVariables>): UseDataConnectMutationResult<CreateLoanPaymentData, CreateLoanPaymentVariables>;
export function useCreateLoanPayment(dc: DataConnect, options?: useDataConnectMutationOptions<CreateLoanPaymentData, FirebaseError, CreateLoanPaymentVariables>): UseDataConnectMutationResult<CreateLoanPaymentData, CreateLoanPaymentVariables>;

export function useListLoans(vars?: ListLoansVariables, options?: useDataConnectQueryOptions<ListLoansData>): UseDataConnectQueryResult<ListLoansData, ListLoansVariables>;
export function useListLoans(dc: DataConnect, vars?: ListLoansVariables, options?: useDataConnectQueryOptions<ListLoansData>): UseDataConnectQueryResult<ListLoansData, ListLoansVariables>;

export function useGetLoanById(vars: GetLoanByIdVariables, options?: useDataConnectQueryOptions<GetLoanByIdData>): UseDataConnectQueryResult<GetLoanByIdData, GetLoanByIdVariables>;
export function useGetLoanById(dc: DataConnect, vars: GetLoanByIdVariables, options?: useDataConnectQueryOptions<GetLoanByIdData>): UseDataConnectQueryResult<GetLoanByIdData, GetLoanByIdVariables>;

export function useListLoanPayments(vars?: ListLoanPaymentsVariables, options?: useDataConnectQueryOptions<ListLoanPaymentsData>): UseDataConnectQueryResult<ListLoanPaymentsData, ListLoanPaymentsVariables>;
export function useListLoanPayments(dc: DataConnect, vars?: ListLoanPaymentsVariables, options?: useDataConnectQueryOptions<ListLoanPaymentsData>): UseDataConnectQueryResult<ListLoanPaymentsData, ListLoanPaymentsVariables>;

export function useGetLoanPaymentById(vars: GetLoanPaymentByIdVariables, options?: useDataConnectQueryOptions<GetLoanPaymentByIdData>): UseDataConnectQueryResult<GetLoanPaymentByIdData, GetLoanPaymentByIdVariables>;
export function useGetLoanPaymentById(dc: DataConnect, vars: GetLoanPaymentByIdVariables, options?: useDataConnectQueryOptions<GetLoanPaymentByIdData>): UseDataConnectQueryResult<GetLoanPaymentByIdData, GetLoanPaymentByIdVariables>;
