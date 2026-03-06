import { BrandInsertData, BrandInsertVariables, BrandUpdateData, BrandUpdateVariables, BrandDeleteData, BrandDeleteVariables, ListBrandsData, ListBrandsVariables, GetBrandByIdData, GetBrandByIdVariables, ProductInsertData, ProductInsertVariables, ProductUpdateData, ProductUpdateVariables, ProductDeleteData, ProductDeleteVariables, ProductTransferInsertData, ProductTransferInsertVariables, ProductTransferUpdateData, ProductTransferUpdateVariables, ProductTransferDeleteData, ProductTransferDeleteVariables, ListProductsData, ListProductsVariables, GetProductByIdData, GetProductByIdVariables, ListProductTransfersData, ListProductTransfersVariables, GetProductTransferByIdData, GetProductTransferByIdVariables, ModelInsertData, ModelInsertVariables, ModelUpdateData, ModelUpdateVariables, ModelDeleteData, ModelDeleteVariables, ListModelsData, ListModelsVariables, GetModelByIdData, GetModelByIdVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useBrandInsert(options?: useDataConnectMutationOptions<BrandInsertData, FirebaseError, BrandInsertVariables>): UseDataConnectMutationResult<BrandInsertData, BrandInsertVariables>;
export function useBrandInsert(dc: DataConnect, options?: useDataConnectMutationOptions<BrandInsertData, FirebaseError, BrandInsertVariables>): UseDataConnectMutationResult<BrandInsertData, BrandInsertVariables>;

export function useBrandUpdate(options?: useDataConnectMutationOptions<BrandUpdateData, FirebaseError, BrandUpdateVariables>): UseDataConnectMutationResult<BrandUpdateData, BrandUpdateVariables>;
export function useBrandUpdate(dc: DataConnect, options?: useDataConnectMutationOptions<BrandUpdateData, FirebaseError, BrandUpdateVariables>): UseDataConnectMutationResult<BrandUpdateData, BrandUpdateVariables>;

export function useBrandDelete(options?: useDataConnectMutationOptions<BrandDeleteData, FirebaseError, BrandDeleteVariables>): UseDataConnectMutationResult<BrandDeleteData, BrandDeleteVariables>;
export function useBrandDelete(dc: DataConnect, options?: useDataConnectMutationOptions<BrandDeleteData, FirebaseError, BrandDeleteVariables>): UseDataConnectMutationResult<BrandDeleteData, BrandDeleteVariables>;

export function useListBrands(vars?: ListBrandsVariables, options?: useDataConnectQueryOptions<ListBrandsData>): UseDataConnectQueryResult<ListBrandsData, ListBrandsVariables>;
export function useListBrands(dc: DataConnect, vars?: ListBrandsVariables, options?: useDataConnectQueryOptions<ListBrandsData>): UseDataConnectQueryResult<ListBrandsData, ListBrandsVariables>;

export function useGetBrandById(vars: GetBrandByIdVariables, options?: useDataConnectQueryOptions<GetBrandByIdData>): UseDataConnectQueryResult<GetBrandByIdData, GetBrandByIdVariables>;
export function useGetBrandById(dc: DataConnect, vars: GetBrandByIdVariables, options?: useDataConnectQueryOptions<GetBrandByIdData>): UseDataConnectQueryResult<GetBrandByIdData, GetBrandByIdVariables>;

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

export function useListProducts(vars?: ListProductsVariables, options?: useDataConnectQueryOptions<ListProductsData>): UseDataConnectQueryResult<ListProductsData, ListProductsVariables>;
export function useListProducts(dc: DataConnect, vars?: ListProductsVariables, options?: useDataConnectQueryOptions<ListProductsData>): UseDataConnectQueryResult<ListProductsData, ListProductsVariables>;

export function useGetProductById(vars: GetProductByIdVariables, options?: useDataConnectQueryOptions<GetProductByIdData>): UseDataConnectQueryResult<GetProductByIdData, GetProductByIdVariables>;
export function useGetProductById(dc: DataConnect, vars: GetProductByIdVariables, options?: useDataConnectQueryOptions<GetProductByIdData>): UseDataConnectQueryResult<GetProductByIdData, GetProductByIdVariables>;

export function useListProductTransfers(vars?: ListProductTransfersVariables, options?: useDataConnectQueryOptions<ListProductTransfersData>): UseDataConnectQueryResult<ListProductTransfersData, ListProductTransfersVariables>;
export function useListProductTransfers(dc: DataConnect, vars?: ListProductTransfersVariables, options?: useDataConnectQueryOptions<ListProductTransfersData>): UseDataConnectQueryResult<ListProductTransfersData, ListProductTransfersVariables>;

export function useGetProductTransferById(vars: GetProductTransferByIdVariables, options?: useDataConnectQueryOptions<GetProductTransferByIdData>): UseDataConnectQueryResult<GetProductTransferByIdData, GetProductTransferByIdVariables>;
export function useGetProductTransferById(dc: DataConnect, vars: GetProductTransferByIdVariables, options?: useDataConnectQueryOptions<GetProductTransferByIdData>): UseDataConnectQueryResult<GetProductTransferByIdData, GetProductTransferByIdVariables>;

export function useModelInsert(options?: useDataConnectMutationOptions<ModelInsertData, FirebaseError, ModelInsertVariables>): UseDataConnectMutationResult<ModelInsertData, ModelInsertVariables>;
export function useModelInsert(dc: DataConnect, options?: useDataConnectMutationOptions<ModelInsertData, FirebaseError, ModelInsertVariables>): UseDataConnectMutationResult<ModelInsertData, ModelInsertVariables>;

export function useModelUpdate(options?: useDataConnectMutationOptions<ModelUpdateData, FirebaseError, ModelUpdateVariables>): UseDataConnectMutationResult<ModelUpdateData, ModelUpdateVariables>;
export function useModelUpdate(dc: DataConnect, options?: useDataConnectMutationOptions<ModelUpdateData, FirebaseError, ModelUpdateVariables>): UseDataConnectMutationResult<ModelUpdateData, ModelUpdateVariables>;

export function useModelDelete(options?: useDataConnectMutationOptions<ModelDeleteData, FirebaseError, ModelDeleteVariables>): UseDataConnectMutationResult<ModelDeleteData, ModelDeleteVariables>;
export function useModelDelete(dc: DataConnect, options?: useDataConnectMutationOptions<ModelDeleteData, FirebaseError, ModelDeleteVariables>): UseDataConnectMutationResult<ModelDeleteData, ModelDeleteVariables>;

export function useListModels(vars?: ListModelsVariables, options?: useDataConnectQueryOptions<ListModelsData>): UseDataConnectQueryResult<ListModelsData, ListModelsVariables>;
export function useListModels(dc: DataConnect, vars?: ListModelsVariables, options?: useDataConnectQueryOptions<ListModelsData>): UseDataConnectQueryResult<ListModelsData, ListModelsVariables>;

export function useGetModelById(vars: GetModelByIdVariables, options?: useDataConnectQueryOptions<GetModelByIdData>): UseDataConnectQueryResult<GetModelByIdData, GetModelByIdVariables>;
export function useGetModelById(dc: DataConnect, vars: GetModelByIdVariables, options?: useDataConnectQueryOptions<GetModelByIdData>): UseDataConnectQueryResult<GetModelByIdData, GetModelByIdVariables>;
