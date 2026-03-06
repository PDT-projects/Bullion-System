# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `inventory`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`inventory/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListBrands*](#listbrands)
  - [*GetBrandById*](#getbrandbyid)
  - [*ListProducts*](#listproducts)
  - [*GetProductById*](#getproductbyid)
  - [*ListProductTransfers*](#listproducttransfers)
  - [*GetProductTransferById*](#getproducttransferbyid)
  - [*ListModels*](#listmodels)
  - [*GetModelById*](#getmodelbyid)
- [**Mutations**](#mutations)
  - [*brandInsert*](#brandinsert)
  - [*brandUpdate*](#brandupdate)
  - [*brandDelete*](#branddelete)
  - [*productInsert*](#productinsert)
  - [*productUpdate*](#productupdate)
  - [*productDelete*](#productdelete)
  - [*productTransferInsert*](#producttransferinsert)
  - [*productTransferUpdate*](#producttransferupdate)
  - [*productTransferDelete*](#producttransferdelete)
  - [*modelInsert*](#modelinsert)
  - [*modelUpdate*](#modelupdate)
  - [*modelDelete*](#modeldelete)

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

## ListBrands
You can execute the `ListBrands` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [inventory/index.d.ts](./index.d.ts):
```typescript
listBrands(vars?: ListBrandsVariables): QueryPromise<ListBrandsData, ListBrandsVariables>;

interface ListBrandsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListBrandsVariables): QueryRef<ListBrandsData, ListBrandsVariables>;
}
export const listBrandsRef: ListBrandsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listBrands(dc: DataConnect, vars?: ListBrandsVariables): QueryPromise<ListBrandsData, ListBrandsVariables>;

interface ListBrandsRef {
  ...
  (dc: DataConnect, vars?: ListBrandsVariables): QueryRef<ListBrandsData, ListBrandsVariables>;
}
export const listBrandsRef: ListBrandsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listBrandsRef:
```typescript
const name = listBrandsRef.operationName;
console.log(name);
```

### Variables
The `ListBrands` query has an optional argument of type `ListBrandsVariables`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListBrandsVariables {
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that executing the `ListBrands` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListBrandsData`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListBrands`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listBrands, ListBrandsVariables } from '@erp-system/inventory';

// The `ListBrands` query has an optional argument of type `ListBrandsVariables`:
const listBrandsVars: ListBrandsVariables = {
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listBrands()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listBrands(listBrandsVars);
// Variables can be defined inline as well.
const { data } = await listBrands({ limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `ListBrandsVariables` argument.
const { data } = await listBrands();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listBrands(dataConnect, listBrandsVars);

console.log(data.brands);

// Or, you can use the `Promise` API.
listBrands(listBrandsVars).then((response) => {
  const data = response.data;
  console.log(data.brands);
});
```

### Using `ListBrands`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listBrandsRef, ListBrandsVariables } from '@erp-system/inventory';

// The `ListBrands` query has an optional argument of type `ListBrandsVariables`:
const listBrandsVars: ListBrandsVariables = {
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listBrandsRef()` function to get a reference to the query.
const ref = listBrandsRef(listBrandsVars);
// Variables can be defined inline as well.
const ref = listBrandsRef({ limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `ListBrandsVariables` argument.
const ref = listBrandsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listBrandsRef(dataConnect, listBrandsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.brands);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.brands);
});
```

## GetBrandById
You can execute the `GetBrandById` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [inventory/index.d.ts](./index.d.ts):
```typescript
getBrandById(vars: GetBrandByIdVariables): QueryPromise<GetBrandByIdData, GetBrandByIdVariables>;

interface GetBrandByIdRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetBrandByIdVariables): QueryRef<GetBrandByIdData, GetBrandByIdVariables>;
}
export const getBrandByIdRef: GetBrandByIdRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getBrandById(dc: DataConnect, vars: GetBrandByIdVariables): QueryPromise<GetBrandByIdData, GetBrandByIdVariables>;

interface GetBrandByIdRef {
  ...
  (dc: DataConnect, vars: GetBrandByIdVariables): QueryRef<GetBrandByIdData, GetBrandByIdVariables>;
}
export const getBrandByIdRef: GetBrandByIdRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getBrandByIdRef:
```typescript
const name = getBrandByIdRef.operationName;
console.log(name);
```

### Variables
The `GetBrandById` query requires an argument of type `GetBrandByIdVariables`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetBrandByIdVariables {
  id: string;
}
```
### Return Type
Recall that executing the `GetBrandById` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetBrandByIdData`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetBrandById`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getBrandById, GetBrandByIdVariables } from '@erp-system/inventory';

// The `GetBrandById` query requires an argument of type `GetBrandByIdVariables`:
const getBrandByIdVars: GetBrandByIdVariables = {
  id: ..., 
};

// Call the `getBrandById()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getBrandById(getBrandByIdVars);
// Variables can be defined inline as well.
const { data } = await getBrandById({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getBrandById(dataConnect, getBrandByIdVars);

console.log(data.brand);

// Or, you can use the `Promise` API.
getBrandById(getBrandByIdVars).then((response) => {
  const data = response.data;
  console.log(data.brand);
});
```

### Using `GetBrandById`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getBrandByIdRef, GetBrandByIdVariables } from '@erp-system/inventory';

// The `GetBrandById` query requires an argument of type `GetBrandByIdVariables`:
const getBrandByIdVars: GetBrandByIdVariables = {
  id: ..., 
};

// Call the `getBrandByIdRef()` function to get a reference to the query.
const ref = getBrandByIdRef(getBrandByIdVars);
// Variables can be defined inline as well.
const ref = getBrandByIdRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getBrandByIdRef(dataConnect, getBrandByIdVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.brand);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.brand);
});
```

## ListProducts
You can execute the `ListProducts` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [inventory/index.d.ts](./index.d.ts):
```typescript
listProducts(vars?: ListProductsVariables): QueryPromise<ListProductsData, ListProductsVariables>;

interface ListProductsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListProductsVariables): QueryRef<ListProductsData, ListProductsVariables>;
}
export const listProductsRef: ListProductsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listProducts(dc: DataConnect, vars?: ListProductsVariables): QueryPromise<ListProductsData, ListProductsVariables>;

interface ListProductsRef {
  ...
  (dc: DataConnect, vars?: ListProductsVariables): QueryRef<ListProductsData, ListProductsVariables>;
}
export const listProductsRef: ListProductsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listProductsRef:
```typescript
const name = listProductsRef.operationName;
console.log(name);
```

### Variables
The `ListProducts` query has an optional argument of type `ListProductsVariables`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListProductsVariables {
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that executing the `ListProducts` query returns a `QueryPromise` that resolves to an object with a `data` property.

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
```
### Using `ListProducts`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listProducts, ListProductsVariables } from '@erp-system/inventory';

// The `ListProducts` query has an optional argument of type `ListProductsVariables`:
const listProductsVars: ListProductsVariables = {
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listProducts()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listProducts(listProductsVars);
// Variables can be defined inline as well.
const { data } = await listProducts({ limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `ListProductsVariables` argument.
const { data } = await listProducts();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listProducts(dataConnect, listProductsVars);

console.log(data.products);

// Or, you can use the `Promise` API.
listProducts(listProductsVars).then((response) => {
  const data = response.data;
  console.log(data.products);
});
```

### Using `ListProducts`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listProductsRef, ListProductsVariables } from '@erp-system/inventory';

// The `ListProducts` query has an optional argument of type `ListProductsVariables`:
const listProductsVars: ListProductsVariables = {
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listProductsRef()` function to get a reference to the query.
const ref = listProductsRef(listProductsVars);
// Variables can be defined inline as well.
const ref = listProductsRef({ limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `ListProductsVariables` argument.
const ref = listProductsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listProductsRef(dataConnect, listProductsVars);

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

## GetProductById
You can execute the `GetProductById` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [inventory/index.d.ts](./index.d.ts):
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
The `GetProductById` query requires an argument of type `GetProductByIdVariables`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetProductByIdVariables {
  id: string;
}
```
### Return Type
Recall that executing the `GetProductById` query returns a `QueryPromise` that resolves to an object with a `data` property.

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
```
### Using `GetProductById`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getProductById, GetProductByIdVariables } from '@erp-system/inventory';

// The `GetProductById` query requires an argument of type `GetProductByIdVariables`:
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

### Using `GetProductById`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getProductByIdRef, GetProductByIdVariables } from '@erp-system/inventory';

// The `GetProductById` query requires an argument of type `GetProductByIdVariables`:
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

## ListProductTransfers
You can execute the `ListProductTransfers` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [inventory/index.d.ts](./index.d.ts):
```typescript
listProductTransfers(vars?: ListProductTransfersVariables): QueryPromise<ListProductTransfersData, ListProductTransfersVariables>;

interface ListProductTransfersRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListProductTransfersVariables): QueryRef<ListProductTransfersData, ListProductTransfersVariables>;
}
export const listProductTransfersRef: ListProductTransfersRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listProductTransfers(dc: DataConnect, vars?: ListProductTransfersVariables): QueryPromise<ListProductTransfersData, ListProductTransfersVariables>;

interface ListProductTransfersRef {
  ...
  (dc: DataConnect, vars?: ListProductTransfersVariables): QueryRef<ListProductTransfersData, ListProductTransfersVariables>;
}
export const listProductTransfersRef: ListProductTransfersRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listProductTransfersRef:
```typescript
const name = listProductTransfersRef.operationName;
console.log(name);
```

### Variables
The `ListProductTransfers` query has an optional argument of type `ListProductTransfersVariables`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListProductTransfersVariables {
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that executing the `ListProductTransfers` query returns a `QueryPromise` that resolves to an object with a `data` property.

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
### Using `ListProductTransfers`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listProductTransfers, ListProductTransfersVariables } from '@erp-system/inventory';

// The `ListProductTransfers` query has an optional argument of type `ListProductTransfersVariables`:
const listProductTransfersVars: ListProductTransfersVariables = {
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listProductTransfers()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listProductTransfers(listProductTransfersVars);
// Variables can be defined inline as well.
const { data } = await listProductTransfers({ limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `ListProductTransfersVariables` argument.
const { data } = await listProductTransfers();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listProductTransfers(dataConnect, listProductTransfersVars);

console.log(data.productTransfers);

// Or, you can use the `Promise` API.
listProductTransfers(listProductTransfersVars).then((response) => {
  const data = response.data;
  console.log(data.productTransfers);
});
```

### Using `ListProductTransfers`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listProductTransfersRef, ListProductTransfersVariables } from '@erp-system/inventory';

// The `ListProductTransfers` query has an optional argument of type `ListProductTransfersVariables`:
const listProductTransfersVars: ListProductTransfersVariables = {
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listProductTransfersRef()` function to get a reference to the query.
const ref = listProductTransfersRef(listProductTransfersVars);
// Variables can be defined inline as well.
const ref = listProductTransfersRef({ limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `ListProductTransfersVariables` argument.
const ref = listProductTransfersRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listProductTransfersRef(dataConnect, listProductTransfersVars);

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

## GetProductTransferById
You can execute the `GetProductTransferById` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [inventory/index.d.ts](./index.d.ts):
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
The `GetProductTransferById` query requires an argument of type `GetProductTransferByIdVariables`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetProductTransferByIdVariables {
  id: string;
}
```
### Return Type
Recall that executing the `GetProductTransferById` query returns a `QueryPromise` that resolves to an object with a `data` property.

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
### Using `GetProductTransferById`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getProductTransferById, GetProductTransferByIdVariables } from '@erp-system/inventory';

// The `GetProductTransferById` query requires an argument of type `GetProductTransferByIdVariables`:
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

### Using `GetProductTransferById`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getProductTransferByIdRef, GetProductTransferByIdVariables } from '@erp-system/inventory';

// The `GetProductTransferById` query requires an argument of type `GetProductTransferByIdVariables`:
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

## ListModels
You can execute the `ListModels` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [inventory/index.d.ts](./index.d.ts):
```typescript
listModels(vars?: ListModelsVariables): QueryPromise<ListModelsData, ListModelsVariables>;

interface ListModelsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListModelsVariables): QueryRef<ListModelsData, ListModelsVariables>;
}
export const listModelsRef: ListModelsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listModels(dc: DataConnect, vars?: ListModelsVariables): QueryPromise<ListModelsData, ListModelsVariables>;

interface ListModelsRef {
  ...
  (dc: DataConnect, vars?: ListModelsVariables): QueryRef<ListModelsData, ListModelsVariables>;
}
export const listModelsRef: ListModelsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listModelsRef:
```typescript
const name = listModelsRef.operationName;
console.log(name);
```

### Variables
The `ListModels` query has an optional argument of type `ListModelsVariables`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListModelsVariables {
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that executing the `ListModels` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListModelsData`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListModels`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listModels, ListModelsVariables } from '@erp-system/inventory';

// The `ListModels` query has an optional argument of type `ListModelsVariables`:
const listModelsVars: ListModelsVariables = {
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listModels()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listModels(listModelsVars);
// Variables can be defined inline as well.
const { data } = await listModels({ limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `ListModelsVariables` argument.
const { data } = await listModels();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listModels(dataConnect, listModelsVars);

console.log(data.models);

// Or, you can use the `Promise` API.
listModels(listModelsVars).then((response) => {
  const data = response.data;
  console.log(data.models);
});
```

### Using `ListModels`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listModelsRef, ListModelsVariables } from '@erp-system/inventory';

// The `ListModels` query has an optional argument of type `ListModelsVariables`:
const listModelsVars: ListModelsVariables = {
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listModelsRef()` function to get a reference to the query.
const ref = listModelsRef(listModelsVars);
// Variables can be defined inline as well.
const ref = listModelsRef({ limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `ListModelsVariables` argument.
const ref = listModelsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listModelsRef(dataConnect, listModelsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.models);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.models);
});
```

## GetModelById
You can execute the `GetModelById` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [inventory/index.d.ts](./index.d.ts):
```typescript
getModelById(vars: GetModelByIdVariables): QueryPromise<GetModelByIdData, GetModelByIdVariables>;

interface GetModelByIdRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetModelByIdVariables): QueryRef<GetModelByIdData, GetModelByIdVariables>;
}
export const getModelByIdRef: GetModelByIdRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getModelById(dc: DataConnect, vars: GetModelByIdVariables): QueryPromise<GetModelByIdData, GetModelByIdVariables>;

interface GetModelByIdRef {
  ...
  (dc: DataConnect, vars: GetModelByIdVariables): QueryRef<GetModelByIdData, GetModelByIdVariables>;
}
export const getModelByIdRef: GetModelByIdRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getModelByIdRef:
```typescript
const name = getModelByIdRef.operationName;
console.log(name);
```

### Variables
The `GetModelById` query requires an argument of type `GetModelByIdVariables`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetModelByIdVariables {
  id: string;
}
```
### Return Type
Recall that executing the `GetModelById` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetModelByIdData`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetModelById`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getModelById, GetModelByIdVariables } from '@erp-system/inventory';

// The `GetModelById` query requires an argument of type `GetModelByIdVariables`:
const getModelByIdVars: GetModelByIdVariables = {
  id: ..., 
};

// Call the `getModelById()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getModelById(getModelByIdVars);
// Variables can be defined inline as well.
const { data } = await getModelById({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getModelById(dataConnect, getModelByIdVars);

console.log(data.model);

// Or, you can use the `Promise` API.
getModelById(getModelByIdVars).then((response) => {
  const data = response.data;
  console.log(data.model);
});
```

### Using `GetModelById`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getModelByIdRef, GetModelByIdVariables } from '@erp-system/inventory';

// The `GetModelById` query requires an argument of type `GetModelByIdVariables`:
const getModelByIdVars: GetModelByIdVariables = {
  id: ..., 
};

// Call the `getModelByIdRef()` function to get a reference to the query.
const ref = getModelByIdRef(getModelByIdVars);
// Variables can be defined inline as well.
const ref = getModelByIdRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getModelByIdRef(dataConnect, getModelByIdVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.model);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.model);
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

## brandInsert
You can execute the `brandInsert` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [inventory/index.d.ts](./index.d.ts):
```typescript
brandInsert(vars: BrandInsertVariables): MutationPromise<BrandInsertData, BrandInsertVariables>;

interface BrandInsertRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: BrandInsertVariables): MutationRef<BrandInsertData, BrandInsertVariables>;
}
export const brandInsertRef: BrandInsertRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
brandInsert(dc: DataConnect, vars: BrandInsertVariables): MutationPromise<BrandInsertData, BrandInsertVariables>;

interface BrandInsertRef {
  ...
  (dc: DataConnect, vars: BrandInsertVariables): MutationRef<BrandInsertData, BrandInsertVariables>;
}
export const brandInsertRef: BrandInsertRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the brandInsertRef:
```typescript
const name = brandInsertRef.operationName;
console.log(name);
```

### Variables
The `brandInsert` mutation requires an argument of type `BrandInsertVariables`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface BrandInsertVariables {
  id: string;
  name: string;
  category?: string | null;
  description?: string | null;
}
```
### Return Type
Recall that executing the `brandInsert` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `BrandInsertData`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface BrandInsertData {
  brand_insert: Brand_Key;
}
```
### Using `brandInsert`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, brandInsert, BrandInsertVariables } from '@erp-system/inventory';

// The `brandInsert` mutation requires an argument of type `BrandInsertVariables`:
const brandInsertVars: BrandInsertVariables = {
  id: ..., 
  name: ..., 
  category: ..., // optional
  description: ..., // optional
};

// Call the `brandInsert()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await brandInsert(brandInsertVars);
// Variables can be defined inline as well.
const { data } = await brandInsert({ id: ..., name: ..., category: ..., description: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await brandInsert(dataConnect, brandInsertVars);

console.log(data.brand_insert);

// Or, you can use the `Promise` API.
brandInsert(brandInsertVars).then((response) => {
  const data = response.data;
  console.log(data.brand_insert);
});
```

### Using `brandInsert`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, brandInsertRef, BrandInsertVariables } from '@erp-system/inventory';

// The `brandInsert` mutation requires an argument of type `BrandInsertVariables`:
const brandInsertVars: BrandInsertVariables = {
  id: ..., 
  name: ..., 
  category: ..., // optional
  description: ..., // optional
};

// Call the `brandInsertRef()` function to get a reference to the mutation.
const ref = brandInsertRef(brandInsertVars);
// Variables can be defined inline as well.
const ref = brandInsertRef({ id: ..., name: ..., category: ..., description: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = brandInsertRef(dataConnect, brandInsertVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.brand_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.brand_insert);
});
```

## brandUpdate
You can execute the `brandUpdate` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [inventory/index.d.ts](./index.d.ts):
```typescript
brandUpdate(vars: BrandUpdateVariables): MutationPromise<BrandUpdateData, BrandUpdateVariables>;

interface BrandUpdateRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: BrandUpdateVariables): MutationRef<BrandUpdateData, BrandUpdateVariables>;
}
export const brandUpdateRef: BrandUpdateRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
brandUpdate(dc: DataConnect, vars: BrandUpdateVariables): MutationPromise<BrandUpdateData, BrandUpdateVariables>;

interface BrandUpdateRef {
  ...
  (dc: DataConnect, vars: BrandUpdateVariables): MutationRef<BrandUpdateData, BrandUpdateVariables>;
}
export const brandUpdateRef: BrandUpdateRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the brandUpdateRef:
```typescript
const name = brandUpdateRef.operationName;
console.log(name);
```

### Variables
The `brandUpdate` mutation requires an argument of type `BrandUpdateVariables`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface BrandUpdateVariables {
  id: string;
  name: string;
  category?: string | null;
  description?: string | null;
}
```
### Return Type
Recall that executing the `brandUpdate` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `BrandUpdateData`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface BrandUpdateData {
  brand_update?: Brand_Key | null;
}
```
### Using `brandUpdate`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, brandUpdate, BrandUpdateVariables } from '@erp-system/inventory';

// The `brandUpdate` mutation requires an argument of type `BrandUpdateVariables`:
const brandUpdateVars: BrandUpdateVariables = {
  id: ..., 
  name: ..., 
  category: ..., // optional
  description: ..., // optional
};

// Call the `brandUpdate()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await brandUpdate(brandUpdateVars);
// Variables can be defined inline as well.
const { data } = await brandUpdate({ id: ..., name: ..., category: ..., description: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await brandUpdate(dataConnect, brandUpdateVars);

console.log(data.brand_update);

// Or, you can use the `Promise` API.
brandUpdate(brandUpdateVars).then((response) => {
  const data = response.data;
  console.log(data.brand_update);
});
```

### Using `brandUpdate`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, brandUpdateRef, BrandUpdateVariables } from '@erp-system/inventory';

// The `brandUpdate` mutation requires an argument of type `BrandUpdateVariables`:
const brandUpdateVars: BrandUpdateVariables = {
  id: ..., 
  name: ..., 
  category: ..., // optional
  description: ..., // optional
};

// Call the `brandUpdateRef()` function to get a reference to the mutation.
const ref = brandUpdateRef(brandUpdateVars);
// Variables can be defined inline as well.
const ref = brandUpdateRef({ id: ..., name: ..., category: ..., description: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = brandUpdateRef(dataConnect, brandUpdateVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.brand_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.brand_update);
});
```

## brandDelete
You can execute the `brandDelete` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [inventory/index.d.ts](./index.d.ts):
```typescript
brandDelete(vars: BrandDeleteVariables): MutationPromise<BrandDeleteData, BrandDeleteVariables>;

interface BrandDeleteRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: BrandDeleteVariables): MutationRef<BrandDeleteData, BrandDeleteVariables>;
}
export const brandDeleteRef: BrandDeleteRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
brandDelete(dc: DataConnect, vars: BrandDeleteVariables): MutationPromise<BrandDeleteData, BrandDeleteVariables>;

interface BrandDeleteRef {
  ...
  (dc: DataConnect, vars: BrandDeleteVariables): MutationRef<BrandDeleteData, BrandDeleteVariables>;
}
export const brandDeleteRef: BrandDeleteRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the brandDeleteRef:
```typescript
const name = brandDeleteRef.operationName;
console.log(name);
```

### Variables
The `brandDelete` mutation requires an argument of type `BrandDeleteVariables`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface BrandDeleteVariables {
  id: string;
}
```
### Return Type
Recall that executing the `brandDelete` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `BrandDeleteData`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface BrandDeleteData {
  brand_delete?: Brand_Key | null;
}
```
### Using `brandDelete`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, brandDelete, BrandDeleteVariables } from '@erp-system/inventory';

// The `brandDelete` mutation requires an argument of type `BrandDeleteVariables`:
const brandDeleteVars: BrandDeleteVariables = {
  id: ..., 
};

// Call the `brandDelete()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await brandDelete(brandDeleteVars);
// Variables can be defined inline as well.
const { data } = await brandDelete({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await brandDelete(dataConnect, brandDeleteVars);

console.log(data.brand_delete);

// Or, you can use the `Promise` API.
brandDelete(brandDeleteVars).then((response) => {
  const data = response.data;
  console.log(data.brand_delete);
});
```

### Using `brandDelete`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, brandDeleteRef, BrandDeleteVariables } from '@erp-system/inventory';

// The `brandDelete` mutation requires an argument of type `BrandDeleteVariables`:
const brandDeleteVars: BrandDeleteVariables = {
  id: ..., 
};

// Call the `brandDeleteRef()` function to get a reference to the mutation.
const ref = brandDeleteRef(brandDeleteVars);
// Variables can be defined inline as well.
const ref = brandDeleteRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = brandDeleteRef(dataConnect, brandDeleteVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.brand_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.brand_delete);
});
```

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
  brandId: ..., // optional
  modelId: ..., // optional
  costingId: ..., // optional
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
  costingUsdRate: ..., // optional
  costingTotalCustomsValue: ..., // optional
  costingTotalFreightValue: ..., // optional
  costingShipmentTotalUSD: ..., // optional
  costingConsignmentValue: ..., // optional
  costingTotalValueOfBrand: ..., // optional
  costingModelsJson: ..., // optional
};

// Call the `productInsert()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await productInsert(productInsertVars);
// Variables can be defined inline as well.
const { data } = await productInsert({ id: ..., brandName: ..., modelName: ..., category: ..., costPrice: ..., sellPrice: ..., buyType: ..., warrantyYears: ..., stock: ..., description: ..., status: ..., isDamaged: ..., serialNumbers: ..., serialCities: ..., serialStatus: ..., brandId: ..., modelId: ..., costingId: ..., costingOption: ..., costingUnits: ..., costingUnitCostUSD: ..., costingTotalCostUSD: ..., costingPercentage: ..., costingCustomPerModel: ..., costingCustomPerUnit: ..., costingFreightPerModel: ..., costingFreightPerUnit: ..., costingUnitCostPKR: ..., costingTotalUnitCost: ..., costingTotalShipmentValuePKR: ..., costingUsdRate: ..., costingTotalCustomsValue: ..., costingTotalFreightValue: ..., costingShipmentTotalUSD: ..., costingConsignmentValue: ..., costingTotalValueOfBrand: ..., costingModelsJson: ..., });

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
  brandId: ..., // optional
  modelId: ..., // optional
  costingId: ..., // optional
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
  costingUsdRate: ..., // optional
  costingTotalCustomsValue: ..., // optional
  costingTotalFreightValue: ..., // optional
  costingShipmentTotalUSD: ..., // optional
  costingConsignmentValue: ..., // optional
  costingTotalValueOfBrand: ..., // optional
  costingModelsJson: ..., // optional
};

// Call the `productInsertRef()` function to get a reference to the mutation.
const ref = productInsertRef(productInsertVars);
// Variables can be defined inline as well.
const ref = productInsertRef({ id: ..., brandName: ..., modelName: ..., category: ..., costPrice: ..., sellPrice: ..., buyType: ..., warrantyYears: ..., stock: ..., description: ..., status: ..., isDamaged: ..., serialNumbers: ..., serialCities: ..., serialStatus: ..., brandId: ..., modelId: ..., costingId: ..., costingOption: ..., costingUnits: ..., costingUnitCostUSD: ..., costingTotalCostUSD: ..., costingPercentage: ..., costingCustomPerModel: ..., costingCustomPerUnit: ..., costingFreightPerModel: ..., costingFreightPerUnit: ..., costingUnitCostPKR: ..., costingTotalUnitCost: ..., costingTotalShipmentValuePKR: ..., costingUsdRate: ..., costingTotalCustomsValue: ..., costingTotalFreightValue: ..., costingShipmentTotalUSD: ..., costingConsignmentValue: ..., costingTotalValueOfBrand: ..., costingModelsJson: ..., });

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
  brandId: ..., // optional
  modelId: ..., // optional
  costingId: ..., // optional
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
  costingUsdRate: ..., // optional
  costingTotalCustomsValue: ..., // optional
  costingTotalFreightValue: ..., // optional
  costingShipmentTotalUSD: ..., // optional
  costingConsignmentValue: ..., // optional
  costingTotalValueOfBrand: ..., // optional
  costingModelsJson: ..., // optional
};

// Call the `productUpdate()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await productUpdate(productUpdateVars);
// Variables can be defined inline as well.
const { data } = await productUpdate({ id: ..., brandName: ..., modelName: ..., category: ..., costPrice: ..., sellPrice: ..., buyType: ..., warrantyYears: ..., stock: ..., description: ..., status: ..., isDamaged: ..., serialNumbers: ..., serialCities: ..., serialStatus: ..., brandId: ..., modelId: ..., costingId: ..., costingOption: ..., costingUnits: ..., costingUnitCostUSD: ..., costingTotalCostUSD: ..., costingPercentage: ..., costingCustomPerModel: ..., costingCustomPerUnit: ..., costingFreightPerModel: ..., costingFreightPerUnit: ..., costingUnitCostPKR: ..., costingTotalUnitCost: ..., costingTotalShipmentValuePKR: ..., costingUsdRate: ..., costingTotalCustomsValue: ..., costingTotalFreightValue: ..., costingShipmentTotalUSD: ..., costingConsignmentValue: ..., costingTotalValueOfBrand: ..., costingModelsJson: ..., });

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
  brandId: ..., // optional
  modelId: ..., // optional
  costingId: ..., // optional
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
  costingUsdRate: ..., // optional
  costingTotalCustomsValue: ..., // optional
  costingTotalFreightValue: ..., // optional
  costingShipmentTotalUSD: ..., // optional
  costingConsignmentValue: ..., // optional
  costingTotalValueOfBrand: ..., // optional
  costingModelsJson: ..., // optional
};

// Call the `productUpdateRef()` function to get a reference to the mutation.
const ref = productUpdateRef(productUpdateVars);
// Variables can be defined inline as well.
const ref = productUpdateRef({ id: ..., brandName: ..., modelName: ..., category: ..., costPrice: ..., sellPrice: ..., buyType: ..., warrantyYears: ..., stock: ..., description: ..., status: ..., isDamaged: ..., serialNumbers: ..., serialCities: ..., serialStatus: ..., brandId: ..., modelId: ..., costingId: ..., costingOption: ..., costingUnits: ..., costingUnitCostUSD: ..., costingTotalCostUSD: ..., costingPercentage: ..., costingCustomPerModel: ..., costingCustomPerUnit: ..., costingFreightPerModel: ..., costingFreightPerUnit: ..., costingUnitCostPKR: ..., costingTotalUnitCost: ..., costingTotalShipmentValuePKR: ..., costingUsdRate: ..., costingTotalCustomsValue: ..., costingTotalFreightValue: ..., costingShipmentTotalUSD: ..., costingConsignmentValue: ..., costingTotalValueOfBrand: ..., costingModelsJson: ..., });

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

## modelInsert
You can execute the `modelInsert` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [inventory/index.d.ts](./index.d.ts):
```typescript
modelInsert(vars: ModelInsertVariables): MutationPromise<ModelInsertData, ModelInsertVariables>;

interface ModelInsertRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ModelInsertVariables): MutationRef<ModelInsertData, ModelInsertVariables>;
}
export const modelInsertRef: ModelInsertRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
modelInsert(dc: DataConnect, vars: ModelInsertVariables): MutationPromise<ModelInsertData, ModelInsertVariables>;

interface ModelInsertRef {
  ...
  (dc: DataConnect, vars: ModelInsertVariables): MutationRef<ModelInsertData, ModelInsertVariables>;
}
export const modelInsertRef: ModelInsertRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the modelInsertRef:
```typescript
const name = modelInsertRef.operationName;
console.log(name);
```

### Variables
The `modelInsert` mutation requires an argument of type `ModelInsertVariables`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ModelInsertVariables {
  id: string;
  brandId: string;
  name: string;
  category?: string | null;
  description?: string | null;
  costPrice?: number | null;
  sellPrice?: number | null;
}
```
### Return Type
Recall that executing the `modelInsert` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ModelInsertData`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ModelInsertData {
  model_insert: Model_Key;
}
```
### Using `modelInsert`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, modelInsert, ModelInsertVariables } from '@erp-system/inventory';

// The `modelInsert` mutation requires an argument of type `ModelInsertVariables`:
const modelInsertVars: ModelInsertVariables = {
  id: ..., 
  brandId: ..., 
  name: ..., 
  category: ..., // optional
  description: ..., // optional
  costPrice: ..., // optional
  sellPrice: ..., // optional
};

// Call the `modelInsert()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await modelInsert(modelInsertVars);
// Variables can be defined inline as well.
const { data } = await modelInsert({ id: ..., brandId: ..., name: ..., category: ..., description: ..., costPrice: ..., sellPrice: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await modelInsert(dataConnect, modelInsertVars);

console.log(data.model_insert);

// Or, you can use the `Promise` API.
modelInsert(modelInsertVars).then((response) => {
  const data = response.data;
  console.log(data.model_insert);
});
```

### Using `modelInsert`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, modelInsertRef, ModelInsertVariables } from '@erp-system/inventory';

// The `modelInsert` mutation requires an argument of type `ModelInsertVariables`:
const modelInsertVars: ModelInsertVariables = {
  id: ..., 
  brandId: ..., 
  name: ..., 
  category: ..., // optional
  description: ..., // optional
  costPrice: ..., // optional
  sellPrice: ..., // optional
};

// Call the `modelInsertRef()` function to get a reference to the mutation.
const ref = modelInsertRef(modelInsertVars);
// Variables can be defined inline as well.
const ref = modelInsertRef({ id: ..., brandId: ..., name: ..., category: ..., description: ..., costPrice: ..., sellPrice: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = modelInsertRef(dataConnect, modelInsertVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.model_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.model_insert);
});
```

## modelUpdate
You can execute the `modelUpdate` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [inventory/index.d.ts](./index.d.ts):
```typescript
modelUpdate(vars: ModelUpdateVariables): MutationPromise<ModelUpdateData, ModelUpdateVariables>;

interface ModelUpdateRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ModelUpdateVariables): MutationRef<ModelUpdateData, ModelUpdateVariables>;
}
export const modelUpdateRef: ModelUpdateRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
modelUpdate(dc: DataConnect, vars: ModelUpdateVariables): MutationPromise<ModelUpdateData, ModelUpdateVariables>;

interface ModelUpdateRef {
  ...
  (dc: DataConnect, vars: ModelUpdateVariables): MutationRef<ModelUpdateData, ModelUpdateVariables>;
}
export const modelUpdateRef: ModelUpdateRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the modelUpdateRef:
```typescript
const name = modelUpdateRef.operationName;
console.log(name);
```

### Variables
The `modelUpdate` mutation requires an argument of type `ModelUpdateVariables`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ModelUpdateVariables {
  id: string;
  brandId: string;
  name: string;
  category?: string | null;
  description?: string | null;
  costPrice?: number | null;
  sellPrice?: number | null;
}
```
### Return Type
Recall that executing the `modelUpdate` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ModelUpdateData`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ModelUpdateData {
  model_update?: Model_Key | null;
}
```
### Using `modelUpdate`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, modelUpdate, ModelUpdateVariables } from '@erp-system/inventory';

// The `modelUpdate` mutation requires an argument of type `ModelUpdateVariables`:
const modelUpdateVars: ModelUpdateVariables = {
  id: ..., 
  brandId: ..., 
  name: ..., 
  category: ..., // optional
  description: ..., // optional
  costPrice: ..., // optional
  sellPrice: ..., // optional
};

// Call the `modelUpdate()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await modelUpdate(modelUpdateVars);
// Variables can be defined inline as well.
const { data } = await modelUpdate({ id: ..., brandId: ..., name: ..., category: ..., description: ..., costPrice: ..., sellPrice: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await modelUpdate(dataConnect, modelUpdateVars);

console.log(data.model_update);

// Or, you can use the `Promise` API.
modelUpdate(modelUpdateVars).then((response) => {
  const data = response.data;
  console.log(data.model_update);
});
```

### Using `modelUpdate`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, modelUpdateRef, ModelUpdateVariables } from '@erp-system/inventory';

// The `modelUpdate` mutation requires an argument of type `ModelUpdateVariables`:
const modelUpdateVars: ModelUpdateVariables = {
  id: ..., 
  brandId: ..., 
  name: ..., 
  category: ..., // optional
  description: ..., // optional
  costPrice: ..., // optional
  sellPrice: ..., // optional
};

// Call the `modelUpdateRef()` function to get a reference to the mutation.
const ref = modelUpdateRef(modelUpdateVars);
// Variables can be defined inline as well.
const ref = modelUpdateRef({ id: ..., brandId: ..., name: ..., category: ..., description: ..., costPrice: ..., sellPrice: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = modelUpdateRef(dataConnect, modelUpdateVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.model_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.model_update);
});
```

## modelDelete
You can execute the `modelDelete` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [inventory/index.d.ts](./index.d.ts):
```typescript
modelDelete(vars: ModelDeleteVariables): MutationPromise<ModelDeleteData, ModelDeleteVariables>;

interface ModelDeleteRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ModelDeleteVariables): MutationRef<ModelDeleteData, ModelDeleteVariables>;
}
export const modelDeleteRef: ModelDeleteRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
modelDelete(dc: DataConnect, vars: ModelDeleteVariables): MutationPromise<ModelDeleteData, ModelDeleteVariables>;

interface ModelDeleteRef {
  ...
  (dc: DataConnect, vars: ModelDeleteVariables): MutationRef<ModelDeleteData, ModelDeleteVariables>;
}
export const modelDeleteRef: ModelDeleteRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the modelDeleteRef:
```typescript
const name = modelDeleteRef.operationName;
console.log(name);
```

### Variables
The `modelDelete` mutation requires an argument of type `ModelDeleteVariables`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ModelDeleteVariables {
  id: string;
}
```
### Return Type
Recall that executing the `modelDelete` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ModelDeleteData`, which is defined in [inventory/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ModelDeleteData {
  model_delete?: Model_Key | null;
}
```
### Using `modelDelete`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, modelDelete, ModelDeleteVariables } from '@erp-system/inventory';

// The `modelDelete` mutation requires an argument of type `ModelDeleteVariables`:
const modelDeleteVars: ModelDeleteVariables = {
  id: ..., 
};

// Call the `modelDelete()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await modelDelete(modelDeleteVars);
// Variables can be defined inline as well.
const { data } = await modelDelete({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await modelDelete(dataConnect, modelDeleteVars);

console.log(data.model_delete);

// Or, you can use the `Promise` API.
modelDelete(modelDeleteVars).then((response) => {
  const data = response.data;
  console.log(data.model_delete);
});
```

### Using `modelDelete`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, modelDeleteRef, ModelDeleteVariables } from '@erp-system/inventory';

// The `modelDelete` mutation requires an argument of type `ModelDeleteVariables`:
const modelDeleteVars: ModelDeleteVariables = {
  id: ..., 
};

// Call the `modelDeleteRef()` function to get a reference to the mutation.
const ref = modelDeleteRef(modelDeleteVars);
// Variables can be defined inline as well.
const ref = modelDeleteRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = modelDeleteRef(dataConnect, modelDeleteVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.model_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.model_delete);
});
```

