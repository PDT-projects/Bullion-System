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

export interface GetProductTransferByIdData {
  productTransfer?: {
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
    createdAt?: string | null;
    receivedAt?: string | null;
  } & ProductTransfer_Key;
}

export interface GetProductTransferByIdVariables {
  id: string;
}

export interface ListProductTransfersData {
  productTransfers: ({
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
    createdAt?: string | null;
    receivedAt?: string | null;
  } & ProductTransfer_Key)[];
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

export interface LoanPayment_Key {
  id: string;
  __typename?: 'LoanPayment_Key';
}

export interface Loan_Key {
  id: string;
  __typename?: 'Loan_Key';
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
  (): QueryRef<ListProductsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListProductsData, undefined>;
  operationName: string;
}
export const listProductsRef: ListProductsRef;

export function listProducts(): QueryPromise<ListProductsData, undefined>;
export function listProducts(dc: DataConnect): QueryPromise<ListProductsData, undefined>;

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

interface ListProductTransfersRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListProductTransfersData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListProductTransfersData, undefined>;
  operationName: string;
}
export const listProductTransfersRef: ListProductTransfersRef;

export function listProductTransfers(): QueryPromise<ListProductTransfersData, undefined>;
export function listProductTransfers(dc: DataConnect): QueryPromise<ListProductTransfersData, undefined>;

interface GetProductTransferByIdRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetProductTransferByIdVariables): QueryRef<GetProductTransferByIdData, GetProductTransferByIdVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetProductTransferByIdVariables): QueryRef<GetProductTransferByIdData, GetProductTransferByIdVariables>;
  operationName: string;
}
export const getProductTransferByIdRef: GetProductTransferByIdRef;

export function getProductTransferById(vars: GetProductTransferByIdVariables): QueryPromise<GetProductTransferByIdData, GetProductTransferByIdVariables>;
export function getProductTransferById(dc: DataConnect, vars: GetProductTransferByIdVariables): QueryPromise<GetProductTransferByIdData, GetProductTransferByIdVariables>;

