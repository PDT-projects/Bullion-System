import { CashInHandInsertData, CashInHandInsertVariables, CashInHandDeleteData, CashInHandDeleteVariables, ListCashInHandData, ListCashInHandVariables, GetCashInHandByIdData, GetCashInHandByIdVariables, TransferInsertData, TransferInsertVariables, TransferDeleteData, TransferDeleteVariables, ListTransfersData, ListTransfersVariables, GetTransferByIdData, GetTransferByIdVariables, BankInsertData, BankInsertVariables, BankUpdateData, BankUpdateVariables, BankDeleteData, BankDeleteVariables, UpdateBankBalanceData, UpdateBankBalanceVariables, ListBanksData, ListBanksVariables, GetBankByIdData, GetBankByIdVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCashInHandInsert(options?: useDataConnectMutationOptions<CashInHandInsertData, FirebaseError, CashInHandInsertVariables | void>): UseDataConnectMutationResult<CashInHandInsertData, CashInHandInsertVariables>;
export function useCashInHandInsert(dc: DataConnect, options?: useDataConnectMutationOptions<CashInHandInsertData, FirebaseError, CashInHandInsertVariables | void>): UseDataConnectMutationResult<CashInHandInsertData, CashInHandInsertVariables>;

export function useCashInHandDelete(options?: useDataConnectMutationOptions<CashInHandDeleteData, FirebaseError, CashInHandDeleteVariables | void>): UseDataConnectMutationResult<CashInHandDeleteData, CashInHandDeleteVariables>;
export function useCashInHandDelete(dc: DataConnect, options?: useDataConnectMutationOptions<CashInHandDeleteData, FirebaseError, CashInHandDeleteVariables | void>): UseDataConnectMutationResult<CashInHandDeleteData, CashInHandDeleteVariables>;

export function useListCashInHand(vars?: ListCashInHandVariables, options?: useDataConnectQueryOptions<ListCashInHandData>): UseDataConnectQueryResult<ListCashInHandData, ListCashInHandVariables>;
export function useListCashInHand(dc: DataConnect, vars?: ListCashInHandVariables, options?: useDataConnectQueryOptions<ListCashInHandData>): UseDataConnectQueryResult<ListCashInHandData, ListCashInHandVariables>;

export function useGetCashInHandById(vars: GetCashInHandByIdVariables, options?: useDataConnectQueryOptions<GetCashInHandByIdData>): UseDataConnectQueryResult<GetCashInHandByIdData, GetCashInHandByIdVariables>;
export function useGetCashInHandById(dc: DataConnect, vars: GetCashInHandByIdVariables, options?: useDataConnectQueryOptions<GetCashInHandByIdData>): UseDataConnectQueryResult<GetCashInHandByIdData, GetCashInHandByIdVariables>;

export function useTransferInsert(options?: useDataConnectMutationOptions<TransferInsertData, FirebaseError, TransferInsertVariables | void>): UseDataConnectMutationResult<TransferInsertData, TransferInsertVariables>;
export function useTransferInsert(dc: DataConnect, options?: useDataConnectMutationOptions<TransferInsertData, FirebaseError, TransferInsertVariables | void>): UseDataConnectMutationResult<TransferInsertData, TransferInsertVariables>;

export function useTransferDelete(options?: useDataConnectMutationOptions<TransferDeleteData, FirebaseError, TransferDeleteVariables | void>): UseDataConnectMutationResult<TransferDeleteData, TransferDeleteVariables>;
export function useTransferDelete(dc: DataConnect, options?: useDataConnectMutationOptions<TransferDeleteData, FirebaseError, TransferDeleteVariables | void>): UseDataConnectMutationResult<TransferDeleteData, TransferDeleteVariables>;

export function useListTransfers(vars?: ListTransfersVariables, options?: useDataConnectQueryOptions<ListTransfersData>): UseDataConnectQueryResult<ListTransfersData, ListTransfersVariables>;
export function useListTransfers(dc: DataConnect, vars?: ListTransfersVariables, options?: useDataConnectQueryOptions<ListTransfersData>): UseDataConnectQueryResult<ListTransfersData, ListTransfersVariables>;

export function useGetTransferById(vars: GetTransferByIdVariables, options?: useDataConnectQueryOptions<GetTransferByIdData>): UseDataConnectQueryResult<GetTransferByIdData, GetTransferByIdVariables>;
export function useGetTransferById(dc: DataConnect, vars: GetTransferByIdVariables, options?: useDataConnectQueryOptions<GetTransferByIdData>): UseDataConnectQueryResult<GetTransferByIdData, GetTransferByIdVariables>;

export function useBankInsert(options?: useDataConnectMutationOptions<BankInsertData, FirebaseError, BankInsertVariables | void>): UseDataConnectMutationResult<BankInsertData, BankInsertVariables>;
export function useBankInsert(dc: DataConnect, options?: useDataConnectMutationOptions<BankInsertData, FirebaseError, BankInsertVariables | void>): UseDataConnectMutationResult<BankInsertData, BankInsertVariables>;

export function useBankUpdate(options?: useDataConnectMutationOptions<BankUpdateData, FirebaseError, BankUpdateVariables | void>): UseDataConnectMutationResult<BankUpdateData, BankUpdateVariables>;
export function useBankUpdate(dc: DataConnect, options?: useDataConnectMutationOptions<BankUpdateData, FirebaseError, BankUpdateVariables | void>): UseDataConnectMutationResult<BankUpdateData, BankUpdateVariables>;

export function useBankDelete(options?: useDataConnectMutationOptions<BankDeleteData, FirebaseError, BankDeleteVariables | void>): UseDataConnectMutationResult<BankDeleteData, BankDeleteVariables>;
export function useBankDelete(dc: DataConnect, options?: useDataConnectMutationOptions<BankDeleteData, FirebaseError, BankDeleteVariables | void>): UseDataConnectMutationResult<BankDeleteData, BankDeleteVariables>;

export function useUpdateBankBalance(options?: useDataConnectMutationOptions<UpdateBankBalanceData, FirebaseError, UpdateBankBalanceVariables | void>): UseDataConnectMutationResult<UpdateBankBalanceData, UpdateBankBalanceVariables>;
export function useUpdateBankBalance(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateBankBalanceData, FirebaseError, UpdateBankBalanceVariables | void>): UseDataConnectMutationResult<UpdateBankBalanceData, UpdateBankBalanceVariables>;

export function useListBanks(vars?: ListBanksVariables, options?: useDataConnectQueryOptions<ListBanksData>): UseDataConnectQueryResult<ListBanksData, ListBanksVariables>;
export function useListBanks(dc: DataConnect, vars?: ListBanksVariables, options?: useDataConnectQueryOptions<ListBanksData>): UseDataConnectQueryResult<ListBanksData, ListBanksVariables>;

export function useGetBankById(vars: GetBankByIdVariables, options?: useDataConnectQueryOptions<GetBankByIdData>): UseDataConnectQueryResult<GetBankByIdData, GetBankByIdVariables>;
export function useGetBankById(dc: DataConnect, vars: GetBankByIdVariables, options?: useDataConnectQueryOptions<GetBankByIdData>): UseDataConnectQueryResult<GetBankByIdData, GetBankByIdVariables>;
