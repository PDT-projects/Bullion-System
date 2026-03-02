import { ProductInsertData, ProductInsertVariables, ProductUpdateData, ProductUpdateVariables, ProductDeleteData, ProductDeleteVariables, ProductTransferInsertData, ProductTransferInsertVariables, ProductTransferUpdateData, ProductTransferUpdateVariables, ProductTransferDeleteData, ProductTransferDeleteVariables, ListProductsData, GetProductByIdData, GetProductByIdVariables, ListProductTransfersData, GetProductTransferByIdData, GetProductTransferByIdVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useProductInsert(options?: useDataConnectMutationOptions<ProductInsertData, FirebaseError, ProductInsertVariables>): UseDataConnectMutationResult<ProductInsertData, ProductInsertVariables>;
export function useProductInsert(dc: DataConnect, options?: useDataConnectMutationOptions<ProductInsertData, FirebaseError, ProductInsertVariables>): UseDataConnectMutationResult<ProductInsertData, ProductInsertVariables>;

export function useProductUpdate(options?: useDataConnectMutationOptions<ProductUpdateData, FirebaseError, ProductUpdateVariables>): UseDataConnectMutationResult<ProductUpdateData, ProductUpdateVariables>;
export function useProductUpdate(dc: DataConnect, options?: useDataConnectMutationOptions<ProductUpdateData, FirebaseError, ProductUpdateVariables>): UseDataConnectMutationResult<ProductUpdateData, ProductUpdateVariables>;

export function useProductDelete(options?: useDataConnectMutationOptions<ProductDeleteData, FirebaseError, ProductDeleteVariables>): UseDataConnectMutationResult<ProductDeleteData, ProductDeleteVariables>;
export function useProductDelete(dc: DataConnect, options?: useDataConnectMutationOptions<ProductDeleteData, FirebaseError, ProductDeleteVariables>): UseDataConnectMutationResult<ProductDeleteData, ProductDeleteVariables>;

export function useProductTransferInsert(options?: useDataConnectMutationOptions<ProductTransferInsertData, FirebaseError, ProductTransferInsertVariables>): UseDataConnectMutationResult<ProductTransferInsertData, ProductTransferInsertVariables>;
export function useProductTransferInsert(dc: DataConnect, options?: useDataConnectMutationOptions<ProductTransferInsertData, FirebaseError, ProductTransferInsertVariables>): UseDataConnectMutationResult<ProductTransferInsertData, ProductTransferInsertVariables>;

export function useProductTransferUpdate(options?: useDataConnectMutationOptions<ProductTransferUpdateData, FirebaseError, ProductTransferUpdateVariables>): UseDataConnectMutationResult<ProductTransferUpdateData, ProductTransferUpdateVariables>;
export function useProductTransferUpdate(dc: DataConnect, options?: useDataConnectMutationOptions<ProductTransferUpdateData, FirebaseError, ProductTransferUpdateVariables>): UseDataConnectMutationResult<ProductTransferUpdateData, ProductTransferUpdateVariables>;

export function useProductTransferDelete(options?: useDataConnectMutationOptions<ProductTransferDeleteData, FirebaseError, ProductTransferDeleteVariables>): UseDataConnectMutationResult<ProductTransferDeleteData, ProductTransferDeleteVariables>;
export function useProductTransferDelete(dc: DataConnect, options?: useDataConnectMutationOptions<ProductTransferDeleteData, FirebaseError, ProductTransferDeleteVariables>): UseDataConnectMutationResult<ProductTransferDeleteData, ProductTransferDeleteVariables>;

export function useListProducts(options?: useDataConnectQueryOptions<ListProductsData>): UseDataConnectQueryResult<ListProductsData, undefined>;
export function useListProducts(dc: DataConnect, options?: useDataConnectQueryOptions<ListProductsData>): UseDataConnectQueryResult<ListProductsData, undefined>;

export function useGetProductById(vars: GetProductByIdVariables, options?: useDataConnectQueryOptions<GetProductByIdData>): UseDataConnectQueryResult<GetProductByIdData, GetProductByIdVariables>;
export function useGetProductById(dc: DataConnect, vars: GetProductByIdVariables, options?: useDataConnectQueryOptions<GetProductByIdData>): UseDataConnectQueryResult<GetProductByIdData, GetProductByIdVariables>;

export function useListProductTransfers(options?: useDataConnectQueryOptions<ListProductTransfersData>): UseDataConnectQueryResult<ListProductTransfersData, undefined>;
export function useListProductTransfers(dc: DataConnect, options?: useDataConnectQueryOptions<ListProductTransfersData>): UseDataConnectQueryResult<ListProductTransfersData, undefined>;

export function useGetProductTransferById(vars: GetProductTransferByIdVariables, options?: useDataConnectQueryOptions<GetProductTransferByIdData>): UseDataConnectQueryResult<GetProductTransferByIdData, GetProductTransferByIdVariables>;
export function useGetProductTransferById(dc: DataConnect, vars: GetProductTransferByIdVariables, options?: useDataConnectQueryOptions<GetProductTransferByIdData>): UseDataConnectQueryResult<GetProductTransferByIdData, GetProductTransferByIdVariables>;
