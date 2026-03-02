# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `inventory`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`inventory/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*listProducts*](#listproducts)
  - [*getProductById*](#getproductbyid)
  - [*listProductTransfers*](#listproducttransfers)
  - [*getProductTransferById*](#getproducttransferbyid)
- [**Mutations**](#mutations)
  - [*productInsert*](#productinsert)
  - [*productUpdate*](#productupdate)
  - [*productDelete*](#productdelete)
  - [*productTransferInsert*](#producttransferinsert)
  - [*productTransferUpdate*](#producttransferupdate)
  - [*productTransferDelete*](#producttransferdelete)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `inventory`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@erp-system/inventory` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@erp-system/inventory';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@erp-system/inventory';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `inventory` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## listProducts
You can execute the `listProducts` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [inventory/index.d.ts](./index.d.ts):
```typescript
listProducts(): QueryPromise<ListProductsData, undefined>;

interface ListProductsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListProductsData, undefined>;
}
export const listProductsRef: ListProductsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listProducts(dc: DataConnect): QueryPromise<ListProductsData, undefined>;

interface ListProductsRef {
  ...
  (dc: DataConnect): QueryRef<ListProductsData, undefined>;
}
export const listProductsRef: ListProductsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listProductsRef:
```typescript
const name = listProductsRef.operationName;
console.log(name);
```

### Variables
The `listProducts` query has no variables.
### Return Type
Recall that executing the `listProducts` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListProductsData`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
    createdAt?: string | null;
    updatedAt?: string | null;
  } & Product_Key)[];
}
```
### Using `listProducts`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listProducts } from '@erp-system/inventory';


// Call the `listProducts()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listProducts();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listProducts(dataConnect);

console.log(data.products);

// Or, you can use the `Promise` API.
listProducts().then((response) => {
  const data = response.data;
  console.log(data.products);
});
```

### Using `listProducts`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listProductsRef } from '@erp-system/inventory';


// Call the `listProductsRef()` function to get a reference to the query.
const ref = listProductsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listProductsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.products);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.products);
});
```

## getProductById
You can execute the `getProductById` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [inventory/index.d.ts](./index.d.ts):
```typescript
getProductById(vars: GetProductByIdVariables): QueryPromise<GetProductByIdData, GetProductByIdVariables>;

interface GetProductByIdRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetProductByIdVariables): QueryRef<GetProductByIdData, GetProductByIdVariables>;
}
export const getProductByIdRef: GetProductByIdRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getProductById(dc: DataConnect, vars: GetProductByIdVariables): QueryPromise<GetProductByIdData, GetProductByIdVariables>;

interface GetProductByIdRef {
  ...
  (dc: DataConnect, vars: GetProductByIdVariables): QueryRef<GetProductByIdData, GetProductByIdVariables>;
}
export const getProductByIdRef: GetProductByIdRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getProductByIdRef:
```typescript
const name = getProductByIdRef.operationName;
console.log(name);
```

### Variables
The `getProductById` query requires an argument of type `GetProductByIdVariables`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetProductByIdVariables {
  id: string;
}
```
### Return Type
Recall that executing the `getProductById` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetProductByIdData`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
    createdAt?: string | null;
    updatedAt?: string | null;
  } & Product_Key;
}
```
### Using `getProductById`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getProductById, GetProductByIdVariables } from '@erp-system/inventory';

// The `getProductById` query requires an argument of type `GetProductByIdVariables`:
const getProductByIdVars: GetProductByIdVariables = {
  id: ..., 
};

// Call the `getProductById()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getProductById(getProductByIdVars);
// Variables can be defined inline as well.
const { data } = await getProductById({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getProductById(dataConnect, getProductByIdVars);

console.log(data.product);

// Or, you can use the `Promise` API.
getProductById(getProductByIdVars).then((response) => {
  const data = response.data;
  console.log(data.product);
});
```

### Using `getProductById`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getProductByIdRef, GetProductByIdVariables } from '@erp-system/inventory';

// The `getProductById` query requires an argument of type `GetProductByIdVariables`:
const getProductByIdVars: GetProductByIdVariables = {
  id: ..., 
};

// Call the `getProductByIdRef()` function to get a reference to the query.
const ref = getProductByIdRef(getProductByIdVars);
// Variables can be defined inline as well.
const ref = getProductByIdRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getProductByIdRef(dataConnect, getProductByIdVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.product);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.product);
});
```

## listProductTransfers
You can execute the `listProductTransfers` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [inventory/index.d.ts](./index.d.ts):
```typescript
listProductTransfers(): QueryPromise<ListProductTransfersData, undefined>;

interface ListProductTransfersRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListProductTransfersData, undefined>;
}
export const listProductTransfersRef: ListProductTransfersRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listProductTransfers(dc: DataConnect): QueryPromise<ListProductTransfersData, undefined>;

interface ListProductTransfersRef {
  ...
  (dc: DataConnect): QueryRef<ListProductTransfersData, undefined>;
}
export const listProductTransfersRef: ListProductTransfersRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listProductTransfersRef:
```typescript
const name = listProductTransfersRef.operationName;
console.log(name);
```

### Variables
The `listProductTransfers` query has no variables.
### Return Type
Recall that executing the `listProductTransfers` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListProductTransfersData`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `listProductTransfers`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listProductTransfers } from '@erp-system/inventory';


// Call the `listProductTransfers()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listProductTransfers();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listProductTransfers(dataConnect);

console.log(data.productTransfers);

// Or, you can use the `Promise` API.
listProductTransfers().then((response) => {
  const data = response.data;
  console.log(data.productTransfers);
});
```

### Using `listProductTransfers`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listProductTransfersRef } from '@erp-system/inventory';


// Call the `listProductTransfersRef()` function to get a reference to the query.
const ref = listProductTransfersRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listProductTransfersRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.productTransfers);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.productTransfers);
});
```

## getProductTransferById
You can execute the `getProductTransferById` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [inventory/index.d.ts](./index.d.ts):
```typescript
getProductTransferById(vars: GetProductTransferByIdVariables): QueryPromise<GetProductTransferByIdData, GetProductTransferByIdVariables>;

interface GetProductTransferByIdRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetProductTransferByIdVariables): QueryRef<GetProductTransferByIdData, GetProductTransferByIdVariables>;
}
export const getProductTransferByIdRef: GetProductTransferByIdRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getProductTransferById(dc: DataConnect, vars: GetProductTransferByIdVariables): QueryPromise<GetProductTransferByIdData, GetProductTransferByIdVariables>;

interface GetProductTransferByIdRef {
  ...
  (dc: DataConnect, vars: GetProductTransferByIdVariables): QueryRef<GetProductTransferByIdData, GetProductTransferByIdVariables>;
}
export const getProductTransferByIdRef: GetProductTransferByIdRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getProductTransferByIdRef:
```typescript
const name = getProductTransferByIdRef.operationName;
console.log(name);
```

### Variables
The `getProductTransferById` query requires an argument of type `GetProductTransferByIdVariables`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetProductTransferByIdVariables {
  id: string;
}
```
### Return Type
Recall that executing the `getProductTransferById` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetProductTransferByIdData`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `getProductTransferById`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getProductTransferById, GetProductTransferByIdVariables } from '@erp-system/inventory';

// The `getProductTransferById` query requires an argument of type `GetProductTransferByIdVariables`:
const getProductTransferByIdVars: GetProductTransferByIdVariables = {
  id: ..., 
};

// Call the `getProductTransferById()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getProductTransferById(getProductTransferByIdVars);
// Variables can be defined inline as well.
const { data } = await getProductTransferById({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getProductTransferById(dataConnect, getProductTransferByIdVars);

console.log(data.productTransfer);

// Or, you can use the `Promise` API.
getProductTransferById(getProductTransferByIdVars).then((response) => {
  const data = response.data;
  console.log(data.productTransfer);
});
```

### Using `getProductTransferById`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getProductTransferByIdRef, GetProductTransferByIdVariables } from '@erp-system/inventory';

// The `getProductTransferById` query requires an argument of type `GetProductTransferByIdVariables`:
const getProductTransferByIdVars: GetProductTransferByIdVariables = {
  id: ..., 
};

// Call the `getProductTransferByIdRef()` function to get a reference to the query.
const ref = getProductTransferByIdRef(getProductTransferByIdVars);
// Variables can be defined inline as well.
const ref = getProductTransferByIdRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getProductTransferByIdRef(dataConnect, getProductTransferByIdVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.productTransfer);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.productTransfer);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `inventory` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## productInsert
You can execute the `productInsert` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [inventory/index.d.ts](./index.d.ts):
```typescript
productInsert(vars: ProductInsertVariables): MutationPromise<ProductInsertData, ProductInsertVariables>;

interface ProductInsertRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ProductInsertVariables): MutationRef<ProductInsertData, ProductInsertVariables>;
}
export const productInsertRef: ProductInsertRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
productInsert(dc: DataConnect, vars: ProductInsertVariables): MutationPromise<ProductInsertData, ProductInsertVariables>;

interface ProductInsertRef {
  ...
  (dc: DataConnect, vars: ProductInsertVariables): MutationRef<ProductInsertData, ProductInsertVariables>;
}
export const productInsertRef: ProductInsertRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the productInsertRef:
```typescript
const name = productInsertRef.operationName;
console.log(name);
```

### Variables
The `productInsert` mutation requires an argument of type `ProductInsertVariables`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
}
```
### Return Type
Recall that executing the `productInsert` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ProductInsertData`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ProductInsertData {
  product_insert: Product_Key;
}
```
### Using `productInsert`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, productInsert, ProductInsertVariables } from '@erp-system/inventory';

// The `productInsert` mutation requires an argument of type `ProductInsertVariables`:
const productInsertVars: ProductInsertVariables = {
  id: ..., 
  brandName: ..., 
  modelName: ..., 
  category: ..., 
  costPrice: ..., 
  sellPrice: ..., 
  buyType: ..., 
  warrantyYears: ..., 
  stock: ..., 
  description: ..., // optional
  status: ..., 
  isDamaged: ..., // optional
  serialNumbers: ..., // optional
  serialCities: ..., // optional
  serialStatus: ..., // optional
  costingOption: ..., // optional
  costingUnits: ..., // optional
  costingUnitCostUSD: ..., // optional
  costingTotalCostUSD: ..., // optional
  costingPercentage: ..., // optional
  costingCustomPerModel: ..., // optional
  costingCustomPerUnit: ..., // optional
  costingFreightPerModel: ..., // optional
  costingFreightPerUnit: ..., // optional
  costingUnitCostPKR: ..., // optional
  costingTotalUnitCost: ..., // optional
  costingTotalShipmentValuePKR: ..., // optional
};

// Call the `productInsert()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await productInsert(productInsertVars);
// Variables can be defined inline as well.
const { data } = await productInsert({ id: ..., brandName: ..., modelName: ..., category: ..., costPrice: ..., sellPrice: ..., buyType: ..., warrantyYears: ..., stock: ..., description: ..., status: ..., isDamaged: ..., serialNumbers: ..., serialCities: ..., serialStatus: ..., costingOption: ..., costingUnits: ..., costingUnitCostUSD: ..., costingTotalCostUSD: ..., costingPercentage: ..., costingCustomPerModel: ..., costingCustomPerUnit: ..., costingFreightPerModel: ..., costingFreightPerUnit: ..., costingUnitCostPKR: ..., costingTotalUnitCost: ..., costingTotalShipmentValuePKR: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await productInsert(dataConnect, productInsertVars);

console.log(data.product_insert);

// Or, you can use the `Promise` API.
productInsert(productInsertVars).then((response) => {
  const data = response.data;
  console.log(data.product_insert);
});
```

### Using `productInsert`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, productInsertRef, ProductInsertVariables } from '@erp-system/inventory';

// The `productInsert` mutation requires an argument of type `ProductInsertVariables`:
const productInsertVars: ProductInsertVariables = {
  id: ..., 
  brandName: ..., 
  modelName: ..., 
  category: ..., 
  costPrice: ..., 
  sellPrice: ..., 
  buyType: ..., 
  warrantyYears: ..., 
  stock: ..., 
  description: ..., // optional
  status: ..., 
  isDamaged: ..., // optional
  serialNumbers: ..., // optional
  serialCities: ..., // optional
  serialStatus: ..., // optional
  costingOption: ..., // optional
  costingUnits: ..., // optional
  costingUnitCostUSD: ..., // optional
  costingTotalCostUSD: ..., // optional
  costingPercentage: ..., // optional
  costingCustomPerModel: ..., // optional
  costingCustomPerUnit: ..., // optional
  costingFreightPerModel: ..., // optional
  costingFreightPerUnit: ..., // optional
  costingUnitCostPKR: ..., // optional
  costingTotalUnitCost: ..., // optional
  costingTotalShipmentValuePKR: ..., // optional
};

// Call the `productInsertRef()` function to get a reference to the mutation.
const ref = productInsertRef(productInsertVars);
// Variables can be defined inline as well.
const ref = productInsertRef({ id: ..., brandName: ..., modelName: ..., category: ..., costPrice: ..., sellPrice: ..., buyType: ..., warrantyYears: ..., stock: ..., description: ..., status: ..., isDamaged: ..., serialNumbers: ..., serialCities: ..., serialStatus: ..., costingOption: ..., costingUnits: ..., costingUnitCostUSD: ..., costingTotalCostUSD: ..., costingPercentage: ..., costingCustomPerModel: ..., costingCustomPerUnit: ..., costingFreightPerModel: ..., costingFreightPerUnit: ..., costingUnitCostPKR: ..., costingTotalUnitCost: ..., costingTotalShipmentValuePKR: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = productInsertRef(dataConnect, productInsertVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.product_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.product_insert);
});
```

## productUpdate
You can execute the `productUpdate` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [inventory/index.d.ts](./index.d.ts):
```typescript
productUpdate(vars: ProductUpdateVariables): MutationPromise<ProductUpdateData, ProductUpdateVariables>;

interface ProductUpdateRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ProductUpdateVariables): MutationRef<ProductUpdateData, ProductUpdateVariables>;
}
export const productUpdateRef: ProductUpdateRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
productUpdate(dc: DataConnect, vars: ProductUpdateVariables): MutationPromise<ProductUpdateData, ProductUpdateVariables>;

interface ProductUpdateRef {
  ...
  (dc: DataConnect, vars: ProductUpdateVariables): MutationRef<ProductUpdateData, ProductUpdateVariables>;
}
export const productUpdateRef: ProductUpdateRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the productUpdateRef:
```typescript
const name = productUpdateRef.operationName;
console.log(name);
```

### Variables
The `productUpdate` mutation requires an argument of type `ProductUpdateVariables`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
}
```
### Return Type
Recall that executing the `productUpdate` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ProductUpdateData`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ProductUpdateData {
  product_update?: Product_Key | null;
}
```
### Using `productUpdate`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, productUpdate, ProductUpdateVariables } from '@erp-system/inventory';

// The `productUpdate` mutation requires an argument of type `ProductUpdateVariables`:
const productUpdateVars: ProductUpdateVariables = {
  id: ..., 
  brandName: ..., 
  modelName: ..., 
  category: ..., 
  costPrice: ..., 
  sellPrice: ..., 
  buyType: ..., 
  warrantyYears: ..., 
  stock: ..., 
  description: ..., // optional
  status: ..., 
  isDamaged: ..., // optional
  serialNumbers: ..., // optional
  serialCities: ..., // optional
  serialStatus: ..., // optional
  costingOption: ..., // optional
  costingUnits: ..., // optional
  costingUnitCostUSD: ..., // optional
  costingTotalCostUSD: ..., // optional
  costingPercentage: ..., // optional
  costingCustomPerModel: ..., // optional
  costingCustomPerUnit: ..., // optional
  costingFreightPerModel: ..., // optional
  costingFreightPerUnit: ..., // optional
  costingUnitCostPKR: ..., // optional
  costingTotalUnitCost: ..., // optional
  costingTotalShipmentValuePKR: ..., // optional
};

// Call the `productUpdate()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await productUpdate(productUpdateVars);
// Variables can be defined inline as well.
const { data } = await productUpdate({ id: ..., brandName: ..., modelName: ..., category: ..., costPrice: ..., sellPrice: ..., buyType: ..., warrantyYears: ..., stock: ..., description: ..., status: ..., isDamaged: ..., serialNumbers: ..., serialCities: ..., serialStatus: ..., costingOption: ..., costingUnits: ..., costingUnitCostUSD: ..., costingTotalCostUSD: ..., costingPercentage: ..., costingCustomPerModel: ..., costingCustomPerUnit: ..., costingFreightPerModel: ..., costingFreightPerUnit: ..., costingUnitCostPKR: ..., costingTotalUnitCost: ..., costingTotalShipmentValuePKR: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await productUpdate(dataConnect, productUpdateVars);

console.log(data.product_update);

// Or, you can use the `Promise` API.
productUpdate(productUpdateVars).then((response) => {
  const data = response.data;
  console.log(data.product_update);
});
```

### Using `productUpdate`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, productUpdateRef, ProductUpdateVariables } from '@erp-system/inventory';

// The `productUpdate` mutation requires an argument of type `ProductUpdateVariables`:
const productUpdateVars: ProductUpdateVariables = {
  id: ..., 
  brandName: ..., 
  modelName: ..., 
  category: ..., 
  costPrice: ..., 
  sellPrice: ..., 
  buyType: ..., 
  warrantyYears: ..., 
  stock: ..., 
  description: ..., // optional
  status: ..., 
  isDamaged: ..., // optional
  serialNumbers: ..., // optional
  serialCities: ..., // optional
  serialStatus: ..., // optional
  costingOption: ..., // optional
  costingUnits: ..., // optional
  costingUnitCostUSD: ..., // optional
  costingTotalCostUSD: ..., // optional
  costingPercentage: ..., // optional
  costingCustomPerModel: ..., // optional
  costingCustomPerUnit: ..., // optional
  costingFreightPerModel: ..., // optional
  costingFreightPerUnit: ..., // optional
  costingUnitCostPKR: ..., // optional
  costingTotalUnitCost: ..., // optional
  costingTotalShipmentValuePKR: ..., // optional
};

// Call the `productUpdateRef()` function to get a reference to the mutation.
const ref = productUpdateRef(productUpdateVars);
// Variables can be defined inline as well.
const ref = productUpdateRef({ id: ..., brandName: ..., modelName: ..., category: ..., costPrice: ..., sellPrice: ..., buyType: ..., warrantyYears: ..., stock: ..., description: ..., status: ..., isDamaged: ..., serialNumbers: ..., serialCities: ..., serialStatus: ..., costingOption: ..., costingUnits: ..., costingUnitCostUSD: ..., costingTotalCostUSD: ..., costingPercentage: ..., costingCustomPerModel: ..., costingCustomPerUnit: ..., costingFreightPerModel: ..., costingFreightPerUnit: ..., costingUnitCostPKR: ..., costingTotalUnitCost: ..., costingTotalShipmentValuePKR: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = productUpdateRef(dataConnect, productUpdateVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.product_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.product_update);
});
```

## productDelete
You can execute the `productDelete` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [inventory/index.d.ts](./index.d.ts):
```typescript
productDelete(vars: ProductDeleteVariables): MutationPromise<ProductDeleteData, ProductDeleteVariables>;

interface ProductDeleteRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ProductDeleteVariables): MutationRef<ProductDeleteData, ProductDeleteVariables>;
}
export const productDeleteRef: ProductDeleteRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
productDelete(dc: DataConnect, vars: ProductDeleteVariables): MutationPromise<ProductDeleteData, ProductDeleteVariables>;

interface ProductDeleteRef {
  ...
  (dc: DataConnect, vars: ProductDeleteVariables): MutationRef<ProductDeleteData, ProductDeleteVariables>;
}
export const productDeleteRef: ProductDeleteRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the productDeleteRef:
```typescript
const name = productDeleteRef.operationName;
console.log(name);
```

### Variables
The `productDelete` mutation requires an argument of type `ProductDeleteVariables`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ProductDeleteVariables {
  id: string;
}
```
### Return Type
Recall that executing the `productDelete` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ProductDeleteData`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ProductDeleteData {
  product_delete?: Product_Key | null;
}
```
### Using `productDelete`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, productDelete, ProductDeleteVariables } from '@erp-system/inventory';

// The `productDelete` mutation requires an argument of type `ProductDeleteVariables`:
const productDeleteVars: ProductDeleteVariables = {
  id: ..., 
};

// Call the `productDelete()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await productDelete(productDeleteVars);
// Variables can be defined inline as well.
const { data } = await productDelete({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await productDelete(dataConnect, productDeleteVars);

console.log(data.product_delete);

// Or, you can use the `Promise` API.
productDelete(productDeleteVars).then((response) => {
  const data = response.data;
  console.log(data.product_delete);
});
```

### Using `productDelete`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, productDeleteRef, ProductDeleteVariables } from '@erp-system/inventory';

// The `productDelete` mutation requires an argument of type `ProductDeleteVariables`:
const productDeleteVars: ProductDeleteVariables = {
  id: ..., 
};

// Call the `productDeleteRef()` function to get a reference to the mutation.
const ref = productDeleteRef(productDeleteVars);
// Variables can be defined inline as well.
const ref = productDeleteRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = productDeleteRef(dataConnect, productDeleteVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.product_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.product_delete);
});
```

## productTransferInsert
You can execute the `productTransferInsert` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [inventory/index.d.ts](./index.d.ts):
```typescript
productTransferInsert(vars: ProductTransferInsertVariables): MutationPromise<ProductTransferInsertData, ProductTransferInsertVariables>;

interface ProductTransferInsertRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ProductTransferInsertVariables): MutationRef<ProductTransferInsertData, ProductTransferInsertVariables>;
}
export const productTransferInsertRef: ProductTransferInsertRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
productTransferInsert(dc: DataConnect, vars: ProductTransferInsertVariables): MutationPromise<ProductTransferInsertData, ProductTransferInsertVariables>;

interface ProductTransferInsertRef {
  ...
  (dc: DataConnect, vars: ProductTransferInsertVariables): MutationRef<ProductTransferInsertData, ProductTransferInsertVariables>;
}
export const productTransferInsertRef: ProductTransferInsertRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the productTransferInsertRef:
```typescript
const name = productTransferInsertRef.operationName;
console.log(name);
```

### Variables
The `productTransferInsert` mutation requires an argument of type `ProductTransferInsertVariables`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `productTransferInsert` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ProductTransferInsertData`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ProductTransferInsertData {
  productTransfer_insert: ProductTransfer_Key;
}
```
### Using `productTransferInsert`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, productTransferInsert, ProductTransferInsertVariables } from '@erp-system/inventory';

// The `productTransferInsert` mutation requires an argument of type `ProductTransferInsertVariables`:
const productTransferInsertVars: ProductTransferInsertVariables = {
  id: ..., 
  productId: ..., 
  productName: ..., 
  brandName: ..., // optional
  modelName: ..., // optional
  fromLocation: ..., 
  toLocation: ..., 
  quantity: ..., 
  serialNumbers: ..., // optional
  date: ..., 
  transferDate: ..., // optional
  status: ..., 
  transferredBy: ..., // optional
  note: ..., // optional
  notes: ..., // optional
  receiptName: ..., // optional
  receiptType: ..., // optional
  receiptDataUrl: ..., // optional
};

// Call the `productTransferInsert()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await productTransferInsert(productTransferInsertVars);
// Variables can be defined inline as well.
const { data } = await productTransferInsert({ id: ..., productId: ..., productName: ..., brandName: ..., modelName: ..., fromLocation: ..., toLocation: ..., quantity: ..., serialNumbers: ..., date: ..., transferDate: ..., status: ..., transferredBy: ..., note: ..., notes: ..., receiptName: ..., receiptType: ..., receiptDataUrl: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await productTransferInsert(dataConnect, productTransferInsertVars);

console.log(data.productTransfer_insert);

// Or, you can use the `Promise` API.
productTransferInsert(productTransferInsertVars).then((response) => {
  const data = response.data;
  console.log(data.productTransfer_insert);
});
```

### Using `productTransferInsert`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, productTransferInsertRef, ProductTransferInsertVariables } from '@erp-system/inventory';

// The `productTransferInsert` mutation requires an argument of type `ProductTransferInsertVariables`:
const productTransferInsertVars: ProductTransferInsertVariables = {
  id: ..., 
  productId: ..., 
  productName: ..., 
  brandName: ..., // optional
  modelName: ..., // optional
  fromLocation: ..., 
  toLocation: ..., 
  quantity: ..., 
  serialNumbers: ..., // optional
  date: ..., 
  transferDate: ..., // optional
  status: ..., 
  transferredBy: ..., // optional
  note: ..., // optional
  notes: ..., // optional
  receiptName: ..., // optional
  receiptType: ..., // optional
  receiptDataUrl: ..., // optional
};

// Call the `productTransferInsertRef()` function to get a reference to the mutation.
const ref = productTransferInsertRef(productTransferInsertVars);
// Variables can be defined inline as well.
const ref = productTransferInsertRef({ id: ..., productId: ..., productName: ..., brandName: ..., modelName: ..., fromLocation: ..., toLocation: ..., quantity: ..., serialNumbers: ..., date: ..., transferDate: ..., status: ..., transferredBy: ..., note: ..., notes: ..., receiptName: ..., receiptType: ..., receiptDataUrl: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = productTransferInsertRef(dataConnect, productTransferInsertVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.productTransfer_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.productTransfer_insert);
});
```

## productTransferUpdate
You can execute the `productTransferUpdate` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [inventory/index.d.ts](./index.d.ts):
```typescript
productTransferUpdate(vars: ProductTransferUpdateVariables): MutationPromise<ProductTransferUpdateData, ProductTransferUpdateVariables>;

interface ProductTransferUpdateRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ProductTransferUpdateVariables): MutationRef<ProductTransferUpdateData, ProductTransferUpdateVariables>;
}
export const productTransferUpdateRef: ProductTransferUpdateRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
productTransferUpdate(dc: DataConnect, vars: ProductTransferUpdateVariables): MutationPromise<ProductTransferUpdateData, ProductTransferUpdateVariables>;

interface ProductTransferUpdateRef {
  ...
  (dc: DataConnect, vars: ProductTransferUpdateVariables): MutationRef<ProductTransferUpdateData, ProductTransferUpdateVariables>;
}
export const productTransferUpdateRef: ProductTransferUpdateRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the productTransferUpdateRef:
```typescript
const name = productTransferUpdateRef.operationName;
console.log(name);
```

### Variables
The `productTransferUpdate` mutation requires an argument of type `ProductTransferUpdateVariables`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `productTransferUpdate` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ProductTransferUpdateData`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ProductTransferUpdateData {
  productTransfer_update?: ProductTransfer_Key | null;
}
```
### Using `productTransferUpdate`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, productTransferUpdate, ProductTransferUpdateVariables } from '@erp-system/inventory';

// The `productTransferUpdate` mutation requires an argument of type `ProductTransferUpdateVariables`:
const productTransferUpdateVars: ProductTransferUpdateVariables = {
  id: ..., 
  productId: ..., 
  productName: ..., 
  brandName: ..., // optional
  modelName: ..., // optional
  fromLocation: ..., 
  toLocation: ..., 
  quantity: ..., 
  serialNumbers: ..., // optional
  date: ..., 
  transferDate: ..., // optional
  status: ..., 
  transferredBy: ..., // optional
  note: ..., // optional
  notes: ..., // optional
  receiptName: ..., // optional
  receiptType: ..., // optional
  receiptDataUrl: ..., // optional
};

// Call the `productTransferUpdate()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await productTransferUpdate(productTransferUpdateVars);
// Variables can be defined inline as well.
const { data } = await productTransferUpdate({ id: ..., productId: ..., productName: ..., brandName: ..., modelName: ..., fromLocation: ..., toLocation: ..., quantity: ..., serialNumbers: ..., date: ..., transferDate: ..., status: ..., transferredBy: ..., note: ..., notes: ..., receiptName: ..., receiptType: ..., receiptDataUrl: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await productTransferUpdate(dataConnect, productTransferUpdateVars);

console.log(data.productTransfer_update);

// Or, you can use the `Promise` API.
productTransferUpdate(productTransferUpdateVars).then((response) => {
  const data = response.data;
  console.log(data.productTransfer_update);
});
```

### Using `productTransferUpdate`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, productTransferUpdateRef, ProductTransferUpdateVariables } from '@erp-system/inventory';

// The `productTransferUpdate` mutation requires an argument of type `ProductTransferUpdateVariables`:
const productTransferUpdateVars: ProductTransferUpdateVariables = {
  id: ..., 
  productId: ..., 
  productName: ..., 
  brandName: ..., // optional
  modelName: ..., // optional
  fromLocation: ..., 
  toLocation: ..., 
  quantity: ..., 
  serialNumbers: ..., // optional
  date: ..., 
  transferDate: ..., // optional
  status: ..., 
  transferredBy: ..., // optional
  note: ..., // optional
  notes: ..., // optional
  receiptName: ..., // optional
  receiptType: ..., // optional
  receiptDataUrl: ..., // optional
};

// Call the `productTransferUpdateRef()` function to get a reference to the mutation.
const ref = productTransferUpdateRef(productTransferUpdateVars);
// Variables can be defined inline as well.
const ref = productTransferUpdateRef({ id: ..., productId: ..., productName: ..., brandName: ..., modelName: ..., fromLocation: ..., toLocation: ..., quantity: ..., serialNumbers: ..., date: ..., transferDate: ..., status: ..., transferredBy: ..., note: ..., notes: ..., receiptName: ..., receiptType: ..., receiptDataUrl: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = productTransferUpdateRef(dataConnect, productTransferUpdateVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.productTransfer_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.productTransfer_update);
});
```

## productTransferDelete
You can execute the `productTransferDelete` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [inventory/index.d.ts](./index.d.ts):
```typescript
productTransferDelete(vars: ProductTransferDeleteVariables): MutationPromise<ProductTransferDeleteData, ProductTransferDeleteVariables>;

interface ProductTransferDeleteRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ProductTransferDeleteVariables): MutationRef<ProductTransferDeleteData, ProductTransferDeleteVariables>;
}
export const productTransferDeleteRef: ProductTransferDeleteRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
productTransferDelete(dc: DataConnect, vars: ProductTransferDeleteVariables): MutationPromise<ProductTransferDeleteData, ProductTransferDeleteVariables>;

interface ProductTransferDeleteRef {
  ...
  (dc: DataConnect, vars: ProductTransferDeleteVariables): MutationRef<ProductTransferDeleteData, ProductTransferDeleteVariables>;
}
export const productTransferDeleteRef: ProductTransferDeleteRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the productTransferDeleteRef:
```typescript
const name = productTransferDeleteRef.operationName;
console.log(name);
```

### Variables
The `productTransferDelete` mutation requires an argument of type `ProductTransferDeleteVariables`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ProductTransferDeleteVariables {
  id: string;
}
```
### Return Type
Recall that executing the `productTransferDelete` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ProductTransferDeleteData`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ProductTransferDeleteData {
  productTransfer_delete?: ProductTransfer_Key | null;
}
```
### Using `productTransferDelete`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, productTransferDelete, ProductTransferDeleteVariables } from '@erp-system/inventory';

// The `productTransferDelete` mutation requires an argument of type `ProductTransferDeleteVariables`:
const productTransferDeleteVars: ProductTransferDeleteVariables = {
  id: ..., 
};

// Call the `productTransferDelete()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await productTransferDelete(productTransferDeleteVars);
// Variables can be defined inline as well.
const { data } = await productTransferDelete({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await productTransferDelete(dataConnect, productTransferDeleteVars);

console.log(data.productTransfer_delete);

// Or, you can use the `Promise` API.
productTransferDelete(productTransferDeleteVars).then((response) => {
  const data = response.data;
  console.log(data.productTransfer_delete);
});
```

### Using `productTransferDelete`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, productTransferDeleteRef, ProductTransferDeleteVariables } from '@erp-system/inventory';

// The `productTransferDelete` mutation requires an argument of type `ProductTransferDeleteVariables`:
const productTransferDeleteVars: ProductTransferDeleteVariables = {
  id: ..., 
};

// Call the `productTransferDeleteRef()` function to get a reference to the mutation.
const ref = productTransferDeleteRef(productTransferDeleteVars);
// Variables can be defined inline as well.
const ref = productTransferDeleteRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = productTransferDeleteRef(dataConnect, productTransferDeleteVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.productTransfer_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.productTransfer_delete);
});
```

