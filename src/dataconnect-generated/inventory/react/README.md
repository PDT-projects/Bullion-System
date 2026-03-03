# Generated React README
This README will guide you through the process of using the generated React SDK package for the connector `inventory`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `JavaScript README`, you can find it at [`inventory/README.md`](../README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

You can use this generated SDK by importing from the package `@erp-system/inventory/react` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#react).

# Table of Contents
- [**Overview**](#generated-react-readme)
- [**TanStack Query Firebase & TanStack React Query**](#tanstack-query-firebase-tanstack-react-query)
  - [*Package Installation*](#installing-tanstack-query-firebase-and-tanstack-react-query-packages)
  - [*Configuring TanStack Query*](#configuring-tanstack-query)
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

# TanStack Query Firebase & TanStack React Query
This SDK provides [React](https://react.dev/) hooks generated specific to your application, for the operations found in the connector `inventory`. These hooks are generated using [TanStack Query Firebase](https://react-query-firebase.invertase.dev/) by our partners at Invertase, a library built on top of [TanStack React Query v5](https://tanstack.com/query/v5/docs/framework/react/overview).

***You do not need to be familiar with Tanstack Query or Tanstack Query Firebase to use this SDK.*** However, you may find it useful to learn more about them, as they will empower you as a user of this Generated React SDK.

## Installing TanStack Query Firebase and TanStack React Query Packages
In order to use the React generated SDK, you must install the `TanStack React Query` and `TanStack Query Firebase` packages.
```bash
npm i --save @tanstack/react-query @tanstack-query-firebase/react
```
```bash
npm i --save firebase@latest # Note: React has a peer dependency on ^11.3.0
```

You can also follow the installation instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#tanstack-install), or the [TanStack Query Firebase documentation](https://react-query-firebase.invertase.dev/react) and [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/installation).

## Configuring TanStack Query
In order to use the React generated SDK in your application, you must wrap your application's component tree in a `QueryClientProvider` component from TanStack React Query. None of your generated React SDK hooks will work without this provider.

```javascript
import { QueryClientProvider } from '@tanstack/react-query';

// Create a TanStack Query client instance
const queryClient = new QueryClient()

function App() {
  return (
    // Provide the client to your App
    <QueryClientProvider client={queryClient}>
      <MyApplication />
    </QueryClientProvider>
  )
}
```

To learn more about `QueryClientProvider`, see the [TanStack React Query documentation](https://tanstack.com/query/latest/docs/framework/react/quick-start) and the [TanStack Query Firebase documentation](https://invertase.docs.page/tanstack-query-firebase/react#usage).

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `inventory`.

You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@erp-system/inventory';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#emulator-react-angular).

```javascript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@erp-system/inventory';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) using the hooks provided from your generated React SDK.

# Queries

The React generated SDK provides Query hook functions that call and return [`useDataConnectQuery`](https://react-query-firebase.invertase.dev/react/data-connect/querying) hooks from TanStack Query Firebase.

Calling these hook functions will return a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and the most recent data returned by the Query, among other things. To learn more about these hooks and how to use them, see the [TanStack Query Firebase documentation](https://react-query-firebase.invertase.dev/react/data-connect/querying).

TanStack React Query caches the results of your Queries, so using the same Query hook function in multiple places in your application allows the entire application to automatically see updates to that Query's data.

Query hooks execute their Queries automatically when called, and periodically refresh, unless you change the `queryOptions` for the Query. To learn how to stop a Query from automatically executing, including how to make a query "lazy", see the [TanStack React Query documentation](https://tanstack.com/query/latest/docs/framework/react/guides/disabling-queries).

To learn more about TanStack React Query's Queries, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/guides/queries).

## Using Query Hooks
Here's a general overview of how to use the generated Query hooks in your code:

- If the Query has no variables, the Query hook function does not require arguments.
- If the Query has any required variables, the Query hook function will require at least one argument: an object that contains all the required variables for the Query.
- If the Query has some required and some optional variables, only required variables are necessary in the variables argument object, and optional variables may be provided as well.
- If all of the Query's variables are optional, the Query hook function does not require any arguments.
- Query hook functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.
- Query hooks functions can be called with or without passing in an `options` argument of type `useDataConnectQueryOptions`. To learn more about the `options` argument, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/guides/query-options).
  - ***Special case:***  If the Query has all optional variables and you would like to provide an `options` argument to the Query hook function without providing any variables, you must pass `undefined` where you would normally pass the Query's variables, and then may provide the `options` argument.

Below are examples of how to use the `inventory` connector's generated Query hook functions to execute each Query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#operations-react-angular).

## listProducts
You can execute the `listProducts` Query using the following Query hook function, which is defined in [inventory/react/index.d.ts](./index.d.ts):

```javascript
useListProducts(dc: DataConnect, options?: useDataConnectQueryOptions<ListProductsData>): UseDataConnectQueryResult<ListProductsData, undefined>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListProducts(options?: useDataConnectQueryOptions<ListProductsData>): UseDataConnectQueryResult<ListProductsData, undefined>;
```

### Variables
The `listProducts` Query has no variables.
### Return Type
Recall that calling the `listProducts` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `listProducts` Query is of type `ListProductsData`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:
```javascript
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
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `listProducts`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@erp-system/inventory';
import { useListProducts } from '@erp-system/inventory/react'

export default function ListProductsComponent() {
  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListProducts();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListProducts(dataConnect);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListProducts(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListProducts(dataConnect, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.products);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## getProductById
You can execute the `getProductById` Query using the following Query hook function, which is defined in [inventory/react/index.d.ts](./index.d.ts):

```javascript
useGetProductById(dc: DataConnect, vars: GetProductByIdVariables, options?: useDataConnectQueryOptions<GetProductByIdData>): UseDataConnectQueryResult<GetProductByIdData, GetProductByIdVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetProductById(vars: GetProductByIdVariables, options?: useDataConnectQueryOptions<GetProductByIdData>): UseDataConnectQueryResult<GetProductByIdData, GetProductByIdVariables>;
```

### Variables
The `getProductById` Query requires an argument of type `GetProductByIdVariables`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetProductByIdVariables {
  id: string;
}
```
### Return Type
Recall that calling the `getProductById` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `getProductById` Query is of type `GetProductByIdData`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:
```javascript
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
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `getProductById`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetProductByIdVariables } from '@erp-system/inventory';
import { useGetProductById } from '@erp-system/inventory/react'

export default function GetProductByIdComponent() {
  // The `useGetProductById` Query hook requires an argument of type `GetProductByIdVariables`:
  const getProductByIdVars: GetProductByIdVariables = {
    id: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetProductById(getProductByIdVars);
  // Variables can be defined inline as well.
  const query = useGetProductById({ id: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetProductById(dataConnect, getProductByIdVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetProductById(getProductByIdVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetProductById(dataConnect, getProductByIdVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.product);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## listProductTransfers
You can execute the `listProductTransfers` Query using the following Query hook function, which is defined in [inventory/react/index.d.ts](./index.d.ts):

```javascript
useListProductTransfers(dc: DataConnect, options?: useDataConnectQueryOptions<ListProductTransfersData>): UseDataConnectQueryResult<ListProductTransfersData, undefined>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListProductTransfers(options?: useDataConnectQueryOptions<ListProductTransfersData>): UseDataConnectQueryResult<ListProductTransfersData, undefined>;
```

### Variables
The `listProductTransfers` Query has no variables.
### Return Type
Recall that calling the `listProductTransfers` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `listProductTransfers` Query is of type `ListProductTransfersData`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:
```javascript
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

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `listProductTransfers`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@erp-system/inventory';
import { useListProductTransfers } from '@erp-system/inventory/react'

export default function ListProductTransfersComponent() {
  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListProductTransfers();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListProductTransfers(dataConnect);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListProductTransfers(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListProductTransfers(dataConnect, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.productTransfers);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## getProductTransferById
You can execute the `getProductTransferById` Query using the following Query hook function, which is defined in [inventory/react/index.d.ts](./index.d.ts):

```javascript
useGetProductTransferById(dc: DataConnect, vars: GetProductTransferByIdVariables, options?: useDataConnectQueryOptions<GetProductTransferByIdData>): UseDataConnectQueryResult<GetProductTransferByIdData, GetProductTransferByIdVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetProductTransferById(vars: GetProductTransferByIdVariables, options?: useDataConnectQueryOptions<GetProductTransferByIdData>): UseDataConnectQueryResult<GetProductTransferByIdData, GetProductTransferByIdVariables>;
```

### Variables
The `getProductTransferById` Query requires an argument of type `GetProductTransferByIdVariables`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetProductTransferByIdVariables {
  id: string;
}
```
### Return Type
Recall that calling the `getProductTransferById` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `getProductTransferById` Query is of type `GetProductTransferByIdData`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:
```javascript
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

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `getProductTransferById`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetProductTransferByIdVariables } from '@erp-system/inventory';
import { useGetProductTransferById } from '@erp-system/inventory/react'

export default function GetProductTransferByIdComponent() {
  // The `useGetProductTransferById` Query hook requires an argument of type `GetProductTransferByIdVariables`:
  const getProductTransferByIdVars: GetProductTransferByIdVariables = {
    id: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetProductTransferById(getProductTransferByIdVars);
  // Variables can be defined inline as well.
  const query = useGetProductTransferById({ id: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetProductTransferById(dataConnect, getProductTransferByIdVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetProductTransferById(getProductTransferByIdVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetProductTransferById(dataConnect, getProductTransferByIdVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.productTransfer);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

# Mutations

The React generated SDK provides Mutations hook functions that call and return [`useDataConnectMutation`](https://react-query-firebase.invertase.dev/react/data-connect/mutations) hooks from TanStack Query Firebase.

Calling these hook functions will return a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, and the most recent data returned by the Mutation, among other things. To learn more about these hooks and how to use them, see the [TanStack Query Firebase documentation](https://react-query-firebase.invertase.dev/react/data-connect/mutations).

Mutation hooks do not execute their Mutations automatically when called. Rather, after calling the Mutation hook function and getting a `UseMutationResult` object, you must call the `UseMutationResult.mutate()` function to execute the Mutation.

To learn more about TanStack React Query's Mutations, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/guides/mutations).

## Using Mutation Hooks
Here's a general overview of how to use the generated Mutation hooks in your code:

- Mutation hook functions are not called with the arguments to the Mutation. Instead, arguments are passed to `UseMutationResult.mutate()`.
- If the Mutation has no variables, the `mutate()` function does not require arguments.
- If the Mutation has any required variables, the `mutate()` function will require at least one argument: an object that contains all the required variables for the Mutation.
- If the Mutation has some required and some optional variables, only required variables are necessary in the variables argument object, and optional variables may be provided as well.
- If all of the Mutation's variables are optional, the Mutation hook function does not require any arguments.
- Mutation hook functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.
- Mutation hooks also accept an `options` argument of type `useDataConnectMutationOptions`. To learn more about the `options` argument, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/guides/mutations#mutation-side-effects).
  - `UseMutationResult.mutate()` also accepts an `options` argument of type `useDataConnectMutationOptions`.
  - ***Special case:*** If the Mutation has no arguments (or all optional arguments and you wish to provide none), and you want to pass `options` to `UseMutationResult.mutate()`, you must pass `undefined` where you would normally pass the Mutation's arguments, and then may provide the options argument.

Below are examples of how to use the `inventory` connector's generated Mutation hook functions to execute each Mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#operations-react-angular).

## productInsert
You can execute the `productInsert` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [inventory/react/index.d.ts](./index.d.ts)):
```javascript
useProductInsert(options?: useDataConnectMutationOptions<ProductInsertData, FirebaseError, ProductInsertVariables>): UseDataConnectMutationResult<ProductInsertData, ProductInsertVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useProductInsert(dc: DataConnect, options?: useDataConnectMutationOptions<ProductInsertData, FirebaseError, ProductInsertVariables>): UseDataConnectMutationResult<ProductInsertData, ProductInsertVariables>;
```

### Variables
The `productInsert` Mutation requires an argument of type `ProductInsertVariables`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:

```javascript
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
```
### Return Type
Recall that calling the `productInsert` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `productInsert` Mutation is of type `ProductInsertData`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ProductInsertData {
  product_insert: Product_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `productInsert`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ProductInsertVariables } from '@erp-system/inventory';
import { useProductInsert } from '@erp-system/inventory/react'

export default function ProductInsertComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useProductInsert();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useProductInsert(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useProductInsert(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useProductInsert(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useProductInsert` Mutation requires an argument of type `ProductInsertVariables`:
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
    costingUsdRate: ..., // optional
    costingTotalCustomsValue: ..., // optional
    costingTotalFreightValue: ..., // optional
    costingShipmentTotalUSD: ..., // optional
    costingConsignmentValue: ..., // optional
    costingTotalValueOfBrand: ..., // optional
    costingModelsJson: ..., // optional
  };
  mutation.mutate(productInsertVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., brandName: ..., modelName: ..., category: ..., costPrice: ..., sellPrice: ..., buyType: ..., warrantyYears: ..., stock: ..., description: ..., status: ..., isDamaged: ..., serialNumbers: ..., serialCities: ..., serialStatus: ..., costingOption: ..., costingUnits: ..., costingUnitCostUSD: ..., costingTotalCostUSD: ..., costingPercentage: ..., costingCustomPerModel: ..., costingCustomPerUnit: ..., costingFreightPerModel: ..., costingFreightPerUnit: ..., costingUnitCostPKR: ..., costingTotalUnitCost: ..., costingTotalShipmentValuePKR: ..., costingUsdRate: ..., costingTotalCustomsValue: ..., costingTotalFreightValue: ..., costingShipmentTotalUSD: ..., costingConsignmentValue: ..., costingTotalValueOfBrand: ..., costingModelsJson: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(productInsertVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.product_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## productUpdate
You can execute the `productUpdate` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [inventory/react/index.d.ts](./index.d.ts)):
```javascript
useProductUpdate(options?: useDataConnectMutationOptions<ProductUpdateData, FirebaseError, ProductUpdateVariables>): UseDataConnectMutationResult<ProductUpdateData, ProductUpdateVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useProductUpdate(dc: DataConnect, options?: useDataConnectMutationOptions<ProductUpdateData, FirebaseError, ProductUpdateVariables>): UseDataConnectMutationResult<ProductUpdateData, ProductUpdateVariables>;
```

### Variables
The `productUpdate` Mutation requires an argument of type `ProductUpdateVariables`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:

```javascript
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
```
### Return Type
Recall that calling the `productUpdate` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `productUpdate` Mutation is of type `ProductUpdateData`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ProductUpdateData {
  product_update?: Product_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `productUpdate`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ProductUpdateVariables } from '@erp-system/inventory';
import { useProductUpdate } from '@erp-system/inventory/react'

export default function ProductUpdateComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useProductUpdate();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useProductUpdate(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useProductUpdate(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useProductUpdate(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useProductUpdate` Mutation requires an argument of type `ProductUpdateVariables`:
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
    costingUsdRate: ..., // optional
    costingTotalCustomsValue: ..., // optional
    costingTotalFreightValue: ..., // optional
    costingShipmentTotalUSD: ..., // optional
    costingConsignmentValue: ..., // optional
    costingTotalValueOfBrand: ..., // optional
    costingModelsJson: ..., // optional
  };
  mutation.mutate(productUpdateVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., brandName: ..., modelName: ..., category: ..., costPrice: ..., sellPrice: ..., buyType: ..., warrantyYears: ..., stock: ..., description: ..., status: ..., isDamaged: ..., serialNumbers: ..., serialCities: ..., serialStatus: ..., costingOption: ..., costingUnits: ..., costingUnitCostUSD: ..., costingTotalCostUSD: ..., costingPercentage: ..., costingCustomPerModel: ..., costingCustomPerUnit: ..., costingFreightPerModel: ..., costingFreightPerUnit: ..., costingUnitCostPKR: ..., costingTotalUnitCost: ..., costingTotalShipmentValuePKR: ..., costingUsdRate: ..., costingTotalCustomsValue: ..., costingTotalFreightValue: ..., costingShipmentTotalUSD: ..., costingConsignmentValue: ..., costingTotalValueOfBrand: ..., costingModelsJson: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(productUpdateVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.product_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## productDelete
You can execute the `productDelete` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [inventory/react/index.d.ts](./index.d.ts)):
```javascript
useProductDelete(options?: useDataConnectMutationOptions<ProductDeleteData, FirebaseError, ProductDeleteVariables>): UseDataConnectMutationResult<ProductDeleteData, ProductDeleteVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useProductDelete(dc: DataConnect, options?: useDataConnectMutationOptions<ProductDeleteData, FirebaseError, ProductDeleteVariables>): UseDataConnectMutationResult<ProductDeleteData, ProductDeleteVariables>;
```

### Variables
The `productDelete` Mutation requires an argument of type `ProductDeleteVariables`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ProductDeleteVariables {
  id: string;
}
```
### Return Type
Recall that calling the `productDelete` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `productDelete` Mutation is of type `ProductDeleteData`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ProductDeleteData {
  product_delete?: Product_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `productDelete`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ProductDeleteVariables } from '@erp-system/inventory';
import { useProductDelete } from '@erp-system/inventory/react'

export default function ProductDeleteComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useProductDelete();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useProductDelete(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useProductDelete(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useProductDelete(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useProductDelete` Mutation requires an argument of type `ProductDeleteVariables`:
  const productDeleteVars: ProductDeleteVariables = {
    id: ..., 
  };
  mutation.mutate(productDeleteVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(productDeleteVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.product_delete);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## productTransferInsert
You can execute the `productTransferInsert` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [inventory/react/index.d.ts](./index.d.ts)):
```javascript
useProductTransferInsert(options?: useDataConnectMutationOptions<ProductTransferInsertData, FirebaseError, ProductTransferInsertVariables>): UseDataConnectMutationResult<ProductTransferInsertData, ProductTransferInsertVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useProductTransferInsert(dc: DataConnect, options?: useDataConnectMutationOptions<ProductTransferInsertData, FirebaseError, ProductTransferInsertVariables>): UseDataConnectMutationResult<ProductTransferInsertData, ProductTransferInsertVariables>;
```

### Variables
The `productTransferInsert` Mutation requires an argument of type `ProductTransferInsertVariables`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:

```javascript
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
Recall that calling the `productTransferInsert` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `productTransferInsert` Mutation is of type `ProductTransferInsertData`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ProductTransferInsertData {
  productTransfer_insert: ProductTransfer_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `productTransferInsert`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ProductTransferInsertVariables } from '@erp-system/inventory';
import { useProductTransferInsert } from '@erp-system/inventory/react'

export default function ProductTransferInsertComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useProductTransferInsert();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useProductTransferInsert(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useProductTransferInsert(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useProductTransferInsert(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useProductTransferInsert` Mutation requires an argument of type `ProductTransferInsertVariables`:
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
  mutation.mutate(productTransferInsertVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., productId: ..., productName: ..., brandName: ..., modelName: ..., fromLocation: ..., toLocation: ..., quantity: ..., serialNumbers: ..., date: ..., transferDate: ..., status: ..., transferredBy: ..., note: ..., notes: ..., receiptName: ..., receiptType: ..., receiptDataUrl: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(productTransferInsertVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.productTransfer_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## productTransferUpdate
You can execute the `productTransferUpdate` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [inventory/react/index.d.ts](./index.d.ts)):
```javascript
useProductTransferUpdate(options?: useDataConnectMutationOptions<ProductTransferUpdateData, FirebaseError, ProductTransferUpdateVariables>): UseDataConnectMutationResult<ProductTransferUpdateData, ProductTransferUpdateVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useProductTransferUpdate(dc: DataConnect, options?: useDataConnectMutationOptions<ProductTransferUpdateData, FirebaseError, ProductTransferUpdateVariables>): UseDataConnectMutationResult<ProductTransferUpdateData, ProductTransferUpdateVariables>;
```

### Variables
The `productTransferUpdate` Mutation requires an argument of type `ProductTransferUpdateVariables`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:

```javascript
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
Recall that calling the `productTransferUpdate` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `productTransferUpdate` Mutation is of type `ProductTransferUpdateData`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ProductTransferUpdateData {
  productTransfer_update?: ProductTransfer_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `productTransferUpdate`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ProductTransferUpdateVariables } from '@erp-system/inventory';
import { useProductTransferUpdate } from '@erp-system/inventory/react'

export default function ProductTransferUpdateComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useProductTransferUpdate();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useProductTransferUpdate(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useProductTransferUpdate(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useProductTransferUpdate(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useProductTransferUpdate` Mutation requires an argument of type `ProductTransferUpdateVariables`:
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
  mutation.mutate(productTransferUpdateVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., productId: ..., productName: ..., brandName: ..., modelName: ..., fromLocation: ..., toLocation: ..., quantity: ..., serialNumbers: ..., date: ..., transferDate: ..., status: ..., transferredBy: ..., note: ..., notes: ..., receiptName: ..., receiptType: ..., receiptDataUrl: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(productTransferUpdateVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.productTransfer_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## productTransferDelete
You can execute the `productTransferDelete` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [inventory/react/index.d.ts](./index.d.ts)):
```javascript
useProductTransferDelete(options?: useDataConnectMutationOptions<ProductTransferDeleteData, FirebaseError, ProductTransferDeleteVariables>): UseDataConnectMutationResult<ProductTransferDeleteData, ProductTransferDeleteVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useProductTransferDelete(dc: DataConnect, options?: useDataConnectMutationOptions<ProductTransferDeleteData, FirebaseError, ProductTransferDeleteVariables>): UseDataConnectMutationResult<ProductTransferDeleteData, ProductTransferDeleteVariables>;
```

### Variables
The `productTransferDelete` Mutation requires an argument of type `ProductTransferDeleteVariables`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ProductTransferDeleteVariables {
  id: string;
}
```
### Return Type
Recall that calling the `productTransferDelete` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `productTransferDelete` Mutation is of type `ProductTransferDeleteData`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ProductTransferDeleteData {
  productTransfer_delete?: ProductTransfer_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `productTransferDelete`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ProductTransferDeleteVariables } from '@erp-system/inventory';
import { useProductTransferDelete } from '@erp-system/inventory/react'

export default function ProductTransferDeleteComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useProductTransferDelete();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useProductTransferDelete(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useProductTransferDelete(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useProductTransferDelete(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useProductTransferDelete` Mutation requires an argument of type `ProductTransferDeleteVariables`:
  const productTransferDeleteVars: ProductTransferDeleteVariables = {
    id: ..., 
  };
  mutation.mutate(productTransferDeleteVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(productTransferDeleteVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.productTransfer_delete);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

