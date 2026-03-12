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

export interface BrandDeleteData {
  brand_delete?: Brand_Key | null;
}

export interface BrandDeleteVariables {
  id: string;
}

export interface BrandInsertData {
  brand_insert: Brand_Key;
}

export interface BrandInsertVariables {
  id: string;
  name: string;
  category?: string | null;
  description?: string | null;
}

export interface BrandUpdateData {
  brand_update?: Brand_Key | null;
}

export interface BrandUpdateVariables {
  id: string;
  name: string;
  category?: string | null;
  description?: string | null;
}

export interface Brand_Key {
  id: string;
  __typename?: 'Brand_Key';
}

export interface Budget_Key {
  id: string;
  __typename?: 'Budget_Key';
}

export interface CashInHand_Key {
  id: string;
  __typename?: 'CashInHand_Key';
}

export interface CostingDeleteData {
  costing_delete?: Costing_Key | null;
}

export interface CostingDeleteVariables {
  id: string;
}

export interface CostingInsertData {
  costing_insert: Costing_Key;
}

export interface CostingInsertVariables {
  id: string;
  brandName: string;
  usdRate: number;
  totalCustomsValue: number;
  totalFreightValue: number;
  totalUnitCostUSD: number;
  shipmentTotalUSD: number;
  consignmentValue: number;
  totalValueOfBrand: number;
  modelsJson: string;
  status: string;
}

export interface CostingUpdateData {
  costing_update?: Costing_Key | null;
}

export interface CostingUpdateVariables {
  id: string;
  brandName: string;
  usdRate: number;
  totalCustomsValue: number;
  totalFreightValue: number;
  totalUnitCostUSD: number;
  shipmentTotalUSD: number;
  consignmentValue: number;
  totalValueOfBrand: number;
  modelsJson: string;
  status: string;
}

export interface Costing_Key {
  id: string;
  __typename?: 'Costing_Key';
}

export interface Employee_Key {
  id: string;
  __typename?: 'Employee_Key';
}

export interface GetBrandByIdData {
  brand?: {
    id: string;
    name: string;
    category?: string | null;
    description?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  } & Brand_Key;
}

export interface GetBrandByIdVariables {
  id: string;
}

export interface GetModelByIdData {
  model?: {
    id: string;
    brandId: string;
    name: string;
    category?: string | null;
    description?: string | null;
    costPrice?: number | null;
    sellPrice?: number | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  } & Model_Key;
}

export interface GetModelByIdVariables {
  id: string;
}

export interface GetProductByIdData {
  product?: {
    id: string;
    brandName: string;
    modelName: string;
    category: string;
    costPrice: number;
    sellPrice: number;
    buyType: string;
    warrantyYears: number;
    stock: number;
    description?: string | null;
    status: string;
    isDamaged?: boolean | null;
    serialNumbers?: string | null;
    serialCities?: string | null;
    serialStatus?: string | null;
    brandId?: string | null;
    modelId?: string | null;
    costingId?: string | null;
    costingOption?: string | null;
    costingUnits?: number | null;
    costingUnitCostUSD?: number | null;
    costingTotalCostUSD?: number | null;
    costingPercentage?: number | null;
    costingCustomPerModel?: number | null;
    costingCustomPerUnit?: number | null;
    costingFreightPerModel?: number | null;
    costingFreightPerUnit?: number | null;
    costingUnitCostPKR?: number | null;
    costingTotalUnitCost?: number | null;
    costingTotalShipmentValuePKR?: number | null;
    costingUsdRate?: number | null;
    costingTotalCustomsValue?: number | null;
    costingTotalFreightValue?: number | null;
    costingShipmentTotalUSD?: number | null;
    costingConsignmentValue?: number | null;
    costingTotalValueOfBrand?: number | null;
    costingModelsJson?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  } & Product_Key;
}

export interface GetProductByIdVariables {
  id: string;
}

export interface ListBrandsData {
  brands: ({
    id: string;
    name: string;
    category?: string | null;
    description?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  } & Brand_Key)[];
}

export interface ListBrandsVariables {
  limit?: number | null;
  offset?: number | null;
}

export interface ListModelsData {
  models: ({
    id: string;
    brandId: string;
    name: string;
    category?: string | null;
    description?: string | null;
    costPrice?: number | null;
    sellPrice?: number | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  } & Model_Key)[];
}

export interface ListModelsVariables {
  limit?: number | null;
  offset?: number | null;
}

export interface ListProductsData {
  products: ({
    id: string;
    brandName: string;
    modelName: string;
    category: string;
    costPrice: number;
    sellPrice: number;
    buyType: string;
    warrantyYears: number;
    stock: number;
    description?: string | null;
    status: string;
    isDamaged?: boolean | null;
    serialNumbers?: string | null;
    serialCities?: string | null;
    serialStatus?: string | null;
    brandId?: string | null;
    modelId?: string | null;
    costingId?: string | null;
    costingOption?: string | null;
    costingUnits?: number | null;
    costingUnitCostUSD?: number | null;
    costingTotalCostUSD?: number | null;
    costingPercentage?: number | null;
    costingCustomPerModel?: number | null;
    costingCustomPerUnit?: number | null;
    costingFreightPerModel?: number | null;
    costingFreightPerUnit?: number | null;
    costingUnitCostPKR?: number | null;
    costingTotalUnitCost?: number | null;
    costingTotalShipmentValuePKR?: number | null;
    costingUsdRate?: number | null;
    costingTotalCustomsValue?: number | null;
    costingTotalFreightValue?: number | null;
    costingShipmentTotalUSD?: number | null;
    costingConsignmentValue?: number | null;
    costingTotalValueOfBrand?: number | null;
    costingModelsJson?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  } & Product_Key)[];
}

export interface ListProductsVariables {
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

export interface ModelDeleteData {
  model_delete?: Model_Key | null;
}

export interface ModelDeleteVariables {
  id: string;
}

export interface ModelInsertData {
  model_insert: Model_Key;
}

export interface ModelInsertVariables {
  id: string;
  brandId: string;
  name: string;
  category?: string | null;
  description?: string | null;
  costPrice?: number | null;
  sellPrice?: number | null;
}

export interface ModelUpdateData {
  model_update?: Model_Key | null;
}

export interface ModelUpdateVariables {
  id: string;
  brandId: string;
  name: string;
  category?: string | null;
  description?: string | null;
  costPrice?: number | null;
  sellPrice?: number | null;
}

export interface Model_Key {
  id: string;
  __typename?: 'Model_Key';
}

export interface ProductDeleteData {
  product_delete?: Product_Key | null;
}

export interface ProductDeleteVariables {
  id: string;
}

export interface ProductInsertData {
  product_insert: Product_Key;
}

export interface ProductInsertVariables {
  id: string;
  brandName: string;
  modelName: string;
  category: string;
  costPrice: number;
  sellPrice: number;
  buyType: string;
  warrantyYears: number;
  stock: number;
  description?: string | null;
  status: string;
  isDamaged?: boolean | null;
  serialNumbers?: string | null;
  serialCities?: string | null;
  serialStatus?: string | null;
  brandId?: string | null;
  modelId?: string | null;
  costingId?: string | null;
  costingOption?: string | null;
  costingUnits?: number | null;
  costingUnitCostUSD?: number | null;
  costingTotalCostUSD?: number | null;
  costingPercentage?: number | null;
  costingCustomPerModel?: number | null;
  costingCustomPerUnit?: number | null;
  costingFreightPerModel?: number | null;
  costingFreightPerUnit?: number | null;
  costingUnitCostPKR?: number | null;
  costingTotalUnitCost?: number | null;
  costingTotalShipmentValuePKR?: number | null;
  costingUsdRate?: number | null;
  costingTotalCustomsValue?: number | null;
  costingTotalFreightValue?: number | null;
  costingShipmentTotalUSD?: number | null;
  costingConsignmentValue?: number | null;
  costingTotalValueOfBrand?: number | null;
  costingModelsJson?: string | null;
}

export interface ProductTransferDeleteData {
  productTransfer_delete?: ProductTransfer_Key | null;
}

export interface ProductTransferDeleteVariables {
  id: string;
}

export interface ProductTransferInsertData {
  productTransfer_insert: ProductTransfer_Key;
}

export interface ProductTransferInsertVariables {
  id: string;
  productId: string;
  productName: string;
  brandName?: string | null;
  modelName?: string | null;
  fromLocation: string;
  toLocation: string;
  quantity: number;
  serialNumbers?: string | null;
  date: string;
  transferDate?: string | null;
  status: string;
  transferredBy?: string | null;
  note?: string | null;
  notes?: string | null;
  receiptName?: string | null;
  receiptType?: string | null;
  receiptDataUrl?: string | null;
}

export interface ProductTransferUpdateData {
  productTransfer_update?: ProductTransfer_Key | null;
}

export interface ProductTransferUpdateVariables {
  id: string;
  productId: string;
  productName: string;
  brandName?: string | null;
  modelName?: string | null;
  fromLocation: string;
  toLocation: string;
  quantity: number;
  serialNumbers?: string | null;
  date: string;
  transferDate?: string | null;
  status: string;
  transferredBy?: string | null;
  note?: string | null;
  notes?: string | null;
  receiptName?: string | null;
  receiptType?: string | null;
  receiptDataUrl?: string | null;
}

export interface ProductTransfer_Key {
  id: string;
  __typename?: 'ProductTransfer_Key';
}

export interface ProductUpdateData {
  product_update?: Product_Key | null;
}

export interface ProductUpdateVariables {
  id: string;
  brandName: string;
  modelName: string;
  category: string;
  costPrice: number;
  sellPrice: number;
  buyType: string;
  warrantyYears: number;
  stock: number;
  description?: string | null;
  status: string;
  isDamaged?: boolean | null;
  serialNumbers?: string | null;
  serialCities?: string | null;
  serialStatus?: string | null;
  brandId?: string | null;
  modelId?: string | null;
  costingId?: string | null;
  costingOption?: string | null;
  costingUnits?: number | null;
  costingUnitCostUSD?: number | null;
  costingTotalCostUSD?: number | null;
  costingPercentage?: number | null;
  costingCustomPerModel?: number | null;
  costingCustomPerUnit?: number | null;
  costingFreightPerModel?: number | null;
  costingFreightPerUnit?: number | null;
  costingUnitCostPKR?: number | null;
  costingTotalUnitCost?: number | null;
  costingTotalShipmentValuePKR?: number | null;
  costingUsdRate?: number | null;
  costingTotalCustomsValue?: number | null;
  costingTotalFreightValue?: number | null;
  costingShipmentTotalUSD?: number | null;
  costingConsignmentValue?: number | null;
  costingTotalValueOfBrand?: number | null;
  costingModelsJson?: string | null;
}

export interface Product_Key {
  id: string;
  __typename?: 'Product_Key';
}

interface BrandInsertRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: BrandInsertVariables): MutationRef<BrandInsertData, BrandInsertVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: BrandInsertVariables): MutationRef<BrandInsertData, BrandInsertVariables>;
  operationName: string;
}
export const brandInsertRef: BrandInsertRef;

export function brandInsert(vars: BrandInsertVariables): MutationPromise<BrandInsertData, BrandInsertVariables>;
export function brandInsert(dc: DataConnect, vars: BrandInsertVariables): MutationPromise<BrandInsertData, BrandInsertVariables>;

interface BrandUpdateRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: BrandUpdateVariables): MutationRef<BrandUpdateData, BrandUpdateVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: BrandUpdateVariables): MutationRef<BrandUpdateData, BrandUpdateVariables>;
  operationName: string;
}
export const brandUpdateRef: BrandUpdateRef;

export function brandUpdate(vars: BrandUpdateVariables): MutationPromise<BrandUpdateData, BrandUpdateVariables>;
export function brandUpdate(dc: DataConnect, vars: BrandUpdateVariables): MutationPromise<BrandUpdateData, BrandUpdateVariables>;

interface BrandDeleteRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: BrandDeleteVariables): MutationRef<BrandDeleteData, BrandDeleteVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: BrandDeleteVariables): MutationRef<BrandDeleteData, BrandDeleteVariables>;
  operationName: string;
}
export const brandDeleteRef: BrandDeleteRef;

export function brandDelete(vars: BrandDeleteVariables): MutationPromise<BrandDeleteData, BrandDeleteVariables>;
export function brandDelete(dc: DataConnect, vars: BrandDeleteVariables): MutationPromise<BrandDeleteData, BrandDeleteVariables>;

interface ListBrandsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListBrandsVariables): QueryRef<ListBrandsData, ListBrandsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: ListBrandsVariables): QueryRef<ListBrandsData, ListBrandsVariables>;
  operationName: string;
}
export const listBrandsRef: ListBrandsRef;

export function listBrands(vars?: ListBrandsVariables): QueryPromise<ListBrandsData, ListBrandsVariables>;
export function listBrands(dc: DataConnect, vars?: ListBrandsVariables): QueryPromise<ListBrandsData, ListBrandsVariables>;

interface GetBrandByIdRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetBrandByIdVariables): QueryRef<GetBrandByIdData, GetBrandByIdVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetBrandByIdVariables): QueryRef<GetBrandByIdData, GetBrandByIdVariables>;
  operationName: string;
}
export const getBrandByIdRef: GetBrandByIdRef;

export function getBrandById(vars: GetBrandByIdVariables): QueryPromise<GetBrandByIdData, GetBrandByIdVariables>;
export function getBrandById(dc: DataConnect, vars: GetBrandByIdVariables): QueryPromise<GetBrandByIdData, GetBrandByIdVariables>;

interface CostingInsertRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CostingInsertVariables): MutationRef<CostingInsertData, CostingInsertVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CostingInsertVariables): MutationRef<CostingInsertData, CostingInsertVariables>;
  operationName: string;
}
export const costingInsertRef: CostingInsertRef;

export function costingInsert(vars: CostingInsertVariables): MutationPromise<CostingInsertData, CostingInsertVariables>;
export function costingInsert(dc: DataConnect, vars: CostingInsertVariables): MutationPromise<CostingInsertData, CostingInsertVariables>;

interface CostingUpdateRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CostingUpdateVariables): MutationRef<CostingUpdateData, CostingUpdateVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CostingUpdateVariables): MutationRef<CostingUpdateData, CostingUpdateVariables>;
  operationName: string;
}
export const costingUpdateRef: CostingUpdateRef;

export function costingUpdate(vars: CostingUpdateVariables): MutationPromise<CostingUpdateData, CostingUpdateVariables>;
export function costingUpdate(dc: DataConnect, vars: CostingUpdateVariables): MutationPromise<CostingUpdateData, CostingUpdateVariables>;

interface CostingDeleteRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CostingDeleteVariables): MutationRef<CostingDeleteData, CostingDeleteVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CostingDeleteVariables): MutationRef<CostingDeleteData, CostingDeleteVariables>;
  operationName: string;
}
export const costingDeleteRef: CostingDeleteRef;

export function costingDelete(vars: CostingDeleteVariables): MutationPromise<CostingDeleteData, CostingDeleteVariables>;
export function costingDelete(dc: DataConnect, vars: CostingDeleteVariables): MutationPromise<CostingDeleteData, CostingDeleteVariables>;

interface ProductInsertRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ProductInsertVariables): MutationRef<ProductInsertData, ProductInsertVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ProductInsertVariables): MutationRef<ProductInsertData, ProductInsertVariables>;
  operationName: string;
}
export const productInsertRef: ProductInsertRef;

export function productInsert(vars: ProductInsertVariables): MutationPromise<ProductInsertData, ProductInsertVariables>;
export function productInsert(dc: DataConnect, vars: ProductInsertVariables): MutationPromise<ProductInsertData, ProductInsertVariables>;

interface ProductUpdateRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ProductUpdateVariables): MutationRef<ProductUpdateData, ProductUpdateVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ProductUpdateVariables): MutationRef<ProductUpdateData, ProductUpdateVariables>;
  operationName: string;
}
export const productUpdateRef: ProductUpdateRef;

export function productUpdate(vars: ProductUpdateVariables): MutationPromise<ProductUpdateData, ProductUpdateVariables>;
export function productUpdate(dc: DataConnect, vars: ProductUpdateVariables): MutationPromise<ProductUpdateData, ProductUpdateVariables>;

interface ProductDeleteRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ProductDeleteVariables): MutationRef<ProductDeleteData, ProductDeleteVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ProductDeleteVariables): MutationRef<ProductDeleteData, ProductDeleteVariables>;
  operationName: string;
}
export const productDeleteRef: ProductDeleteRef;

export function productDelete(vars: ProductDeleteVariables): MutationPromise<ProductDeleteData, ProductDeleteVariables>;
export function productDelete(dc: DataConnect, vars: ProductDeleteVariables): MutationPromise<ProductDeleteData, ProductDeleteVariables>;

interface ProductTransferInsertRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ProductTransferInsertVariables): MutationRef<ProductTransferInsertData, ProductTransferInsertVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ProductTransferInsertVariables): MutationRef<ProductTransferInsertData, ProductTransferInsertVariables>;
  operationName: string;
}
export const productTransferInsertRef: ProductTransferInsertRef;

export function productTransferInsert(vars: ProductTransferInsertVariables): MutationPromise<ProductTransferInsertData, ProductTransferInsertVariables>;
export function productTransferInsert(dc: DataConnect, vars: ProductTransferInsertVariables): MutationPromise<ProductTransferInsertData, ProductTransferInsertVariables>;

interface ProductTransferUpdateRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ProductTransferUpdateVariables): MutationRef<ProductTransferUpdateData, ProductTransferUpdateVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ProductTransferUpdateVariables): MutationRef<ProductTransferUpdateData, ProductTransferUpdateVariables>;
  operationName: string;
}
export const productTransferUpdateRef: ProductTransferUpdateRef;

export function productTransferUpdate(vars: ProductTransferUpdateVariables): MutationPromise<ProductTransferUpdateData, ProductTransferUpdateVariables>;
export function productTransferUpdate(dc: DataConnect, vars: ProductTransferUpdateVariables): MutationPromise<ProductTransferUpdateData, ProductTransferUpdateVariables>;

interface ProductTransferDeleteRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ProductTransferDeleteVariables): MutationRef<ProductTransferDeleteData, ProductTransferDeleteVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ProductTransferDeleteVariables): MutationRef<ProductTransferDeleteData, ProductTransferDeleteVariables>;
  operationName: string;
}
export const productTransferDeleteRef: ProductTransferDeleteRef;

export function productTransferDelete(vars: ProductTransferDeleteVariables): MutationPromise<ProductTransferDeleteData, ProductTransferDeleteVariables>;
export function productTransferDelete(dc: DataConnect, vars: ProductTransferDeleteVariables): MutationPromise<ProductTransferDeleteData, ProductTransferDeleteVariables>;

interface ListProductsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListProductsVariables): QueryRef<ListProductsData, ListProductsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: ListProductsVariables): QueryRef<ListProductsData, ListProductsVariables>;
  operationName: string;
}
export const listProductsRef: ListProductsRef;

export function listProducts(vars?: ListProductsVariables): QueryPromise<ListProductsData, ListProductsVariables>;
export function listProducts(dc: DataConnect, vars?: ListProductsVariables): QueryPromise<ListProductsData, ListProductsVariables>;

interface GetProductByIdRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetProductByIdVariables): QueryRef<GetProductByIdData, GetProductByIdVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetProductByIdVariables): QueryRef<GetProductByIdData, GetProductByIdVariables>;
  operationName: string;
}
export const getProductByIdRef: GetProductByIdRef;

export function getProductById(vars: GetProductByIdVariables): QueryPromise<GetProductByIdData, GetProductByIdVariables>;
export function getProductById(dc: DataConnect, vars: GetProductByIdVariables): QueryPromise<GetProductByIdData, GetProductByIdVariables>;

interface ModelInsertRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ModelInsertVariables): MutationRef<ModelInsertData, ModelInsertVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ModelInsertVariables): MutationRef<ModelInsertData, ModelInsertVariables>;
  operationName: string;
}
export const modelInsertRef: ModelInsertRef;

export function modelInsert(vars: ModelInsertVariables): MutationPromise<ModelInsertData, ModelInsertVariables>;
export function modelInsert(dc: DataConnect, vars: ModelInsertVariables): MutationPromise<ModelInsertData, ModelInsertVariables>;

interface ModelUpdateRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ModelUpdateVariables): MutationRef<ModelUpdateData, ModelUpdateVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ModelUpdateVariables): MutationRef<ModelUpdateData, ModelUpdateVariables>;
  operationName: string;
}
export const modelUpdateRef: ModelUpdateRef;

export function modelUpdate(vars: ModelUpdateVariables): MutationPromise<ModelUpdateData, ModelUpdateVariables>;
export function modelUpdate(dc: DataConnect, vars: ModelUpdateVariables): MutationPromise<ModelUpdateData, ModelUpdateVariables>;

interface ModelDeleteRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ModelDeleteVariables): MutationRef<ModelDeleteData, ModelDeleteVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ModelDeleteVariables): MutationRef<ModelDeleteData, ModelDeleteVariables>;
  operationName: string;
}
export const modelDeleteRef: ModelDeleteRef;

export function modelDelete(vars: ModelDeleteVariables): MutationPromise<ModelDeleteData, ModelDeleteVariables>;
export function modelDelete(dc: DataConnect, vars: ModelDeleteVariables): MutationPromise<ModelDeleteData, ModelDeleteVariables>;

interface ListModelsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListModelsVariables): QueryRef<ListModelsData, ListModelsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: ListModelsVariables): QueryRef<ListModelsData, ListModelsVariables>;
  operationName: string;
}
export const listModelsRef: ListModelsRef;

export function listModels(vars?: ListModelsVariables): QueryPromise<ListModelsData, ListModelsVariables>;
export function listModels(dc: DataConnect, vars?: ListModelsVariables): QueryPromise<ListModelsData, ListModelsVariables>;

interface GetModelByIdRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetModelByIdVariables): QueryRef<GetModelByIdData, GetModelByIdVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetModelByIdVariables): QueryRef<GetModelByIdData, GetModelByIdVariables>;
  operationName: string;
}
export const getModelByIdRef: GetModelByIdRef;

export function getModelById(vars: GetModelByIdVariables): QueryPromise<GetModelByIdData, GetModelByIdVariables>;
export function getModelById(dc: DataConnect, vars: GetModelByIdVariables): QueryPromise<GetModelByIdData, GetModelByIdVariables>;

