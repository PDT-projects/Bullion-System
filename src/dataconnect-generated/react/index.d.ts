import { GetEmployeesData, GetEmployeeByIdData, GetEmployeeByIdVariables, CreateEmployeeData, CreateEmployeeVariables, UpdateEmployeeData, UpdateEmployeeVariables, DeleteEmployeeData, DeleteEmployeeVariables, GetBanksData, GetBankByIdData, GetBankByIdVariables, CreateBankData, CreateBankVariables, UpdateBankData, UpdateBankVariables, DeleteBankData, DeleteBankVariables, GetCashInHandRecordsData, GetCashInHandByLocationData, GetCashInHandByLocationVariables, GetCashInHandByIdData, GetCashInHandByIdVariables, CreateCashInHandData, CreateCashInHandVariables, UpdateCashInHandData, UpdateCashInHandVariables, DeleteCashInHandData, DeleteCashInHandVariables, GetBankTransfersData, GetBankTransfersByBankData, GetBankTransfersByBankVariables, CreateBankTransferData, CreateBankTransferVariables, DeleteBankTransferData, DeleteBankTransferVariables } from '../';
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

export function useGetBanks(options?: useDataConnectQueryOptions<GetBanksData>): UseDataConnectQueryResult<GetBanksData, undefined>;
export function useGetBanks(dc: DataConnect, options?: useDataConnectQueryOptions<GetBanksData>): UseDataConnectQueryResult<GetBanksData, undefined>;

export function useGetBankById(vars: GetBankByIdVariables, options?: useDataConnectQueryOptions<GetBankByIdData>): UseDataConnectQueryResult<GetBankByIdData, GetBankByIdVariables>;
export function useGetBankById(dc: DataConnect, vars: GetBankByIdVariables, options?: useDataConnectQueryOptions<GetBankByIdData>): UseDataConnectQueryResult<GetBankByIdData, GetBankByIdVariables>;

export function useCreateBank(options?: useDataConnectMutationOptions<CreateBankData, FirebaseError, CreateBankVariables>): UseDataConnectMutationResult<CreateBankData, CreateBankVariables>;
export function useCreateBank(dc: DataConnect, options?: useDataConnectMutationOptions<CreateBankData, FirebaseError, CreateBankVariables>): UseDataConnectMutationResult<CreateBankData, CreateBankVariables>;

export function useUpdateBank(options?: useDataConnectMutationOptions<UpdateBankData, FirebaseError, UpdateBankVariables>): UseDataConnectMutationResult<UpdateBankData, UpdateBankVariables>;
export function useUpdateBank(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateBankData, FirebaseError, UpdateBankVariables>): UseDataConnectMutationResult<UpdateBankData, UpdateBankVariables>;

export function useDeleteBank(options?: useDataConnectMutationOptions<DeleteBankData, FirebaseError, DeleteBankVariables>): UseDataConnectMutationResult<DeleteBankData, DeleteBankVariables>;
export function useDeleteBank(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteBankData, FirebaseError, DeleteBankVariables>): UseDataConnectMutationResult<DeleteBankData, DeleteBankVariables>;

export function useGetCashInHandRecords(options?: useDataConnectQueryOptions<GetCashInHandRecordsData>): UseDataConnectQueryResult<GetCashInHandRecordsData, undefined>;
export function useGetCashInHandRecords(dc: DataConnect, options?: useDataConnectQueryOptions<GetCashInHandRecordsData>): UseDataConnectQueryResult<GetCashInHandRecordsData, undefined>;

export function useGetCashInHandByLocation(vars: GetCashInHandByLocationVariables, options?: useDataConnectQueryOptions<GetCashInHandByLocationData>): UseDataConnectQueryResult<GetCashInHandByLocationData, GetCashInHandByLocationVariables>;
export function useGetCashInHandByLocation(dc: DataConnect, vars: GetCashInHandByLocationVariables, options?: useDataConnectQueryOptions<GetCashInHandByLocationData>): UseDataConnectQueryResult<GetCashInHandByLocationData, GetCashInHandByLocationVariables>;

export function useGetCashInHandById(vars: GetCashInHandByIdVariables, options?: useDataConnectQueryOptions<GetCashInHandByIdData>): UseDataConnectQueryResult<GetCashInHandByIdData, GetCashInHandByIdVariables>;
export function useGetCashInHandById(dc: DataConnect, vars: GetCashInHandByIdVariables, options?: useDataConnectQueryOptions<GetCashInHandByIdData>): UseDataConnectQueryResult<GetCashInHandByIdData, GetCashInHandByIdVariables>;

export function useCreateCashInHand(options?: useDataConnectMutationOptions<CreateCashInHandData, FirebaseError, CreateCashInHandVariables>): UseDataConnectMutationResult<CreateCashInHandData, CreateCashInHandVariables>;
export function useCreateCashInHand(dc: DataConnect, options?: useDataConnectMutationOptions<CreateCashInHandData, FirebaseError, CreateCashInHandVariables>): UseDataConnectMutationResult<CreateCashInHandData, CreateCashInHandVariables>;

export function useUpdateCashInHand(options?: useDataConnectMutationOptions<UpdateCashInHandData, FirebaseError, UpdateCashInHandVariables>): UseDataConnectMutationResult<UpdateCashInHandData, UpdateCashInHandVariables>;
export function useUpdateCashInHand(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateCashInHandData, FirebaseError, UpdateCashInHandVariables>): UseDataConnectMutationResult<UpdateCashInHandData, UpdateCashInHandVariables>;

export function useDeleteCashInHand(options?: useDataConnectMutationOptions<DeleteCashInHandData, FirebaseError, DeleteCashInHandVariables>): UseDataConnectMutationResult<DeleteCashInHandData, DeleteCashInHandVariables>;
export function useDeleteCashInHand(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteCashInHandData, FirebaseError, DeleteCashInHandVariables>): UseDataConnectMutationResult<DeleteCashInHandData, DeleteCashInHandVariables>;

export function useGetBankTransfers(options?: useDataConnectQueryOptions<GetBankTransfersData>): UseDataConnectQueryResult<GetBankTransfersData, undefined>;
export function useGetBankTransfers(dc: DataConnect, options?: useDataConnectQueryOptions<GetBankTransfersData>): UseDataConnectQueryResult<GetBankTransfersData, undefined>;

export function useGetBankTransfersByBank(vars: GetBankTransfersByBankVariables, options?: useDataConnectQueryOptions<GetBankTransfersByBankData>): UseDataConnectQueryResult<GetBankTransfersByBankData, GetBankTransfersByBankVariables>;
export function useGetBankTransfersByBank(dc: DataConnect, vars: GetBankTransfersByBankVariables, options?: useDataConnectQueryOptions<GetBankTransfersByBankData>): UseDataConnectQueryResult<GetBankTransfersByBankData, GetBankTransfersByBankVariables>;

export function useCreateBankTransfer(options?: useDataConnectMutationOptions<CreateBankTransferData, FirebaseError, CreateBankTransferVariables>): UseDataConnectMutationResult<CreateBankTransferData, CreateBankTransferVariables>;
export function useCreateBankTransfer(dc: DataConnect, options?: useDataConnectMutationOptions<CreateBankTransferData, FirebaseError, CreateBankTransferVariables>): UseDataConnectMutationResult<CreateBankTransferData, CreateBankTransferVariables>;

export function useDeleteBankTransfer(options?: useDataConnectMutationOptions<DeleteBankTransferData, FirebaseError, DeleteBankTransferVariables>): UseDataConnectMutationResult<DeleteBankTransferData, DeleteBankTransferVariables>;
export function useDeleteBankTransfer(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteBankTransferData, FirebaseError, DeleteBankTransferVariables>): UseDataConnectMutationResult<DeleteBankTransferData, DeleteBankTransferVariables>;
