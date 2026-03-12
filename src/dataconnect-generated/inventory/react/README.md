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
  - [*ListBrands*](#listbrands)
  - [*GetBrandById*](#getbrandbyid)
  - [*ListProducts*](#listproducts)
  - [*GetProductById*](#getproductbyid)
  - [*ListModels*](#listmodels)
  - [*GetModelById*](#getmodelbyid)
- [**Mutations**](#mutations)
  - [*brandInsert*](#brandinsert)
  - [*brandUpdate*](#brandupdate)
  - [*brandDelete*](#branddelete)
  - [*costingInsert*](#costinginsert)
  - [*costingUpdate*](#costingupdate)
  - [*costingDelete*](#costingdelete)
  - [*productInsert*](#productinsert)
  - [*productUpdate*](#productupdate)
  - [*productDelete*](#productdelete)
  - [*productTransferInsert*](#producttransferinsert)
  - [*productTransferUpdate*](#producttransferupdate)
  - [*productTransferDelete*](#producttransferdelete)
  - [*modelInsert*](#modelinsert)
  - [*modelUpdate*](#modelupdate)
  - [*modelDelete*](#modeldelete)

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

## ListBrands
You can execute the `ListBrands` Query using the following Query hook function, which is defined in [inventory/react/index.d.ts](./index.d.ts):

```javascript
useListBrands(dc: DataConnect, vars?: ListBrandsVariables, options?: useDataConnectQueryOptions<ListBrandsData>): UseDataConnectQueryResult<ListBrandsData, ListBrandsVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListBrands(vars?: ListBrandsVariables, options?: useDataConnectQueryOptions<ListBrandsData>): UseDataConnectQueryResult<ListBrandsData, ListBrandsVariables>;
```

### Variables
The `ListBrands` Query has an optional argument of type `ListBrandsVariables`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListBrandsVariables {
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that calling the `ListBrands` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListBrands` Query is of type `ListBrandsData`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:
```javascript
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

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListBrands`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListBrandsVariables } from '@erp-system/inventory';
import { useListBrands } from '@erp-system/inventory/react'

export default function ListBrandsComponent() {
  // The `useListBrands` Query hook has an optional argument of type `ListBrandsVariables`:
  const listBrandsVars: ListBrandsVariables = {
    limit: ..., // optional
    offset: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListBrands(listBrandsVars);
  // Variables can be defined inline as well.
  const query = useListBrands({ limit: ..., offset: ..., });
  // Since all variables are optional for this Query, you can omit the `ListBrandsVariables` argument.
  // (as long as you don't want to provide any `options`!)
  const query = useListBrands();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListBrands(dataConnect, listBrandsVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListBrands(listBrandsVars, options);
  // If you'd like to provide options without providing any variables, you must
  // pass `undefined` where you would normally pass the variables.
  const query = useListBrands(undefined, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListBrands(dataConnect, listBrandsVars /** or undefined */, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.brands);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetBrandById
You can execute the `GetBrandById` Query using the following Query hook function, which is defined in [inventory/react/index.d.ts](./index.d.ts):

```javascript
useGetBrandById(dc: DataConnect, vars: GetBrandByIdVariables, options?: useDataConnectQueryOptions<GetBrandByIdData>): UseDataConnectQueryResult<GetBrandByIdData, GetBrandByIdVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetBrandById(vars: GetBrandByIdVariables, options?: useDataConnectQueryOptions<GetBrandByIdData>): UseDataConnectQueryResult<GetBrandByIdData, GetBrandByIdVariables>;
```

### Variables
The `GetBrandById` Query requires an argument of type `GetBrandByIdVariables`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetBrandByIdVariables {
  id: string;
}
```
### Return Type
Recall that calling the `GetBrandById` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetBrandById` Query is of type `GetBrandByIdData`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:
```javascript
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

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetBrandById`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetBrandByIdVariables } from '@erp-system/inventory';
import { useGetBrandById } from '@erp-system/inventory/react'

export default function GetBrandByIdComponent() {
  // The `useGetBrandById` Query hook requires an argument of type `GetBrandByIdVariables`:
  const getBrandByIdVars: GetBrandByIdVariables = {
    id: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetBrandById(getBrandByIdVars);
  // Variables can be defined inline as well.
  const query = useGetBrandById({ id: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetBrandById(dataConnect, getBrandByIdVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetBrandById(getBrandByIdVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetBrandById(dataConnect, getBrandByIdVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.brand);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListProducts
You can execute the `ListProducts` Query using the following Query hook function, which is defined in [inventory/react/index.d.ts](./index.d.ts):

```javascript
useListProducts(dc: DataConnect, vars?: ListProductsVariables, options?: useDataConnectQueryOptions<ListProductsData>): UseDataConnectQueryResult<ListProductsData, ListProductsVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListProducts(vars?: ListProductsVariables, options?: useDataConnectQueryOptions<ListProductsData>): UseDataConnectQueryResult<ListProductsData, ListProductsVariables>;
```

### Variables
The `ListProducts` Query has an optional argument of type `ListProductsVariables`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListProductsVariables {
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that calling the `ListProducts` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListProducts` Query is of type `ListProductsData`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:
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

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListProducts`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListProductsVariables } from '@erp-system/inventory';
import { useListProducts } from '@erp-system/inventory/react'

export default function ListProductsComponent() {
  // The `useListProducts` Query hook has an optional argument of type `ListProductsVariables`:
  const listProductsVars: ListProductsVariables = {
    limit: ..., // optional
    offset: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListProducts(listProductsVars);
  // Variables can be defined inline as well.
  const query = useListProducts({ limit: ..., offset: ..., });
  // Since all variables are optional for this Query, you can omit the `ListProductsVariables` argument.
  // (as long as you don't want to provide any `options`!)
  const query = useListProducts();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListProducts(dataConnect, listProductsVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListProducts(listProductsVars, options);
  // If you'd like to provide options without providing any variables, you must
  // pass `undefined` where you would normally pass the variables.
  const query = useListProducts(undefined, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListProducts(dataConnect, listProductsVars /** or undefined */, options);

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

## GetProductById
You can execute the `GetProductById` Query using the following Query hook function, which is defined in [inventory/react/index.d.ts](./index.d.ts):

```javascript
useGetProductById(dc: DataConnect, vars: GetProductByIdVariables, options?: useDataConnectQueryOptions<GetProductByIdData>): UseDataConnectQueryResult<GetProductByIdData, GetProductByIdVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetProductById(vars: GetProductByIdVariables, options?: useDataConnectQueryOptions<GetProductByIdData>): UseDataConnectQueryResult<GetProductByIdData, GetProductByIdVariables>;
```

### Variables
The `GetProductById` Query requires an argument of type `GetProductByIdVariables`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetProductByIdVariables {
  id: string;
}
```
### Return Type
Recall that calling the `GetProductById` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetProductById` Query is of type `GetProductByIdData`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:
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

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetProductById`'s Query hook function

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

## ListModels
You can execute the `ListModels` Query using the following Query hook function, which is defined in [inventory/react/index.d.ts](./index.d.ts):

```javascript
useListModels(dc: DataConnect, vars?: ListModelsVariables, options?: useDataConnectQueryOptions<ListModelsData>): UseDataConnectQueryResult<ListModelsData, ListModelsVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListModels(vars?: ListModelsVariables, options?: useDataConnectQueryOptions<ListModelsData>): UseDataConnectQueryResult<ListModelsData, ListModelsVariables>;
```

### Variables
The `ListModels` Query has an optional argument of type `ListModelsVariables`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListModelsVariables {
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that calling the `ListModels` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListModels` Query is of type `ListModelsData`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:
```javascript
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

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListModels`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListModelsVariables } from '@erp-system/inventory';
import { useListModels } from '@erp-system/inventory/react'

export default function ListModelsComponent() {
  // The `useListModels` Query hook has an optional argument of type `ListModelsVariables`:
  const listModelsVars: ListModelsVariables = {
    limit: ..., // optional
    offset: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListModels(listModelsVars);
  // Variables can be defined inline as well.
  const query = useListModels({ limit: ..., offset: ..., });
  // Since all variables are optional for this Query, you can omit the `ListModelsVariables` argument.
  // (as long as you don't want to provide any `options`!)
  const query = useListModels();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListModels(dataConnect, listModelsVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListModels(listModelsVars, options);
  // If you'd like to provide options without providing any variables, you must
  // pass `undefined` where you would normally pass the variables.
  const query = useListModels(undefined, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListModels(dataConnect, listModelsVars /** or undefined */, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.models);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetModelById
You can execute the `GetModelById` Query using the following Query hook function, which is defined in [inventory/react/index.d.ts](./index.d.ts):

```javascript
useGetModelById(dc: DataConnect, vars: GetModelByIdVariables, options?: useDataConnectQueryOptions<GetModelByIdData>): UseDataConnectQueryResult<GetModelByIdData, GetModelByIdVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetModelById(vars: GetModelByIdVariables, options?: useDataConnectQueryOptions<GetModelByIdData>): UseDataConnectQueryResult<GetModelByIdData, GetModelByIdVariables>;
```

### Variables
The `GetModelById` Query requires an argument of type `GetModelByIdVariables`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetModelByIdVariables {
  id: string;
}
```
### Return Type
Recall that calling the `GetModelById` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetModelById` Query is of type `GetModelByIdData`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:
```javascript
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

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetModelById`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetModelByIdVariables } from '@erp-system/inventory';
import { useGetModelById } from '@erp-system/inventory/react'

export default function GetModelByIdComponent() {
  // The `useGetModelById` Query hook requires an argument of type `GetModelByIdVariables`:
  const getModelByIdVars: GetModelByIdVariables = {
    id: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetModelById(getModelByIdVars);
  // Variables can be defined inline as well.
  const query = useGetModelById({ id: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetModelById(dataConnect, getModelByIdVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetModelById(getModelByIdVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetModelById(dataConnect, getModelByIdVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.model);
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

## brandInsert
You can execute the `brandInsert` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [inventory/react/index.d.ts](./index.d.ts)):
```javascript
useBrandInsert(options?: useDataConnectMutationOptions<BrandInsertData, FirebaseError, BrandInsertVariables>): UseDataConnectMutationResult<BrandInsertData, BrandInsertVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useBrandInsert(dc: DataConnect, options?: useDataConnectMutationOptions<BrandInsertData, FirebaseError, BrandInsertVariables>): UseDataConnectMutationResult<BrandInsertData, BrandInsertVariables>;
```

### Variables
The `brandInsert` Mutation requires an argument of type `BrandInsertVariables`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface BrandInsertVariables {
  id: string;
  name: string;
  category?: string | null;
  description?: string | null;
}
```
### Return Type
Recall that calling the `brandInsert` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `brandInsert` Mutation is of type `BrandInsertData`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface BrandInsertData {
  brand_insert: Brand_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `brandInsert`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, BrandInsertVariables } from '@erp-system/inventory';
import { useBrandInsert } from '@erp-system/inventory/react'

export default function BrandInsertComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useBrandInsert();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useBrandInsert(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useBrandInsert(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useBrandInsert(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useBrandInsert` Mutation requires an argument of type `BrandInsertVariables`:
  const brandInsertVars: BrandInsertVariables = {
    id: ..., 
    name: ..., 
    category: ..., // optional
    description: ..., // optional
  };
  mutation.mutate(brandInsertVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., name: ..., category: ..., description: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(brandInsertVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.brand_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## brandUpdate
You can execute the `brandUpdate` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [inventory/react/index.d.ts](./index.d.ts)):
```javascript
useBrandUpdate(options?: useDataConnectMutationOptions<BrandUpdateData, FirebaseError, BrandUpdateVariables>): UseDataConnectMutationResult<BrandUpdateData, BrandUpdateVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useBrandUpdate(dc: DataConnect, options?: useDataConnectMutationOptions<BrandUpdateData, FirebaseError, BrandUpdateVariables>): UseDataConnectMutationResult<BrandUpdateData, BrandUpdateVariables>;
```

### Variables
The `brandUpdate` Mutation requires an argument of type `BrandUpdateVariables`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface BrandUpdateVariables {
  id: string;
  name: string;
  category?: string | null;
  description?: string | null;
}
```
### Return Type
Recall that calling the `brandUpdate` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `brandUpdate` Mutation is of type `BrandUpdateData`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface BrandUpdateData {
  brand_update?: Brand_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `brandUpdate`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, BrandUpdateVariables } from '@erp-system/inventory';
import { useBrandUpdate } from '@erp-system/inventory/react'

export default function BrandUpdateComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useBrandUpdate();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useBrandUpdate(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useBrandUpdate(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useBrandUpdate(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useBrandUpdate` Mutation requires an argument of type `BrandUpdateVariables`:
  const brandUpdateVars: BrandUpdateVariables = {
    id: ..., 
    name: ..., 
    category: ..., // optional
    description: ..., // optional
  };
  mutation.mutate(brandUpdateVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., name: ..., category: ..., description: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(brandUpdateVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.brand_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## brandDelete
You can execute the `brandDelete` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [inventory/react/index.d.ts](./index.d.ts)):
```javascript
useBrandDelete(options?: useDataConnectMutationOptions<BrandDeleteData, FirebaseError, BrandDeleteVariables>): UseDataConnectMutationResult<BrandDeleteData, BrandDeleteVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useBrandDelete(dc: DataConnect, options?: useDataConnectMutationOptions<BrandDeleteData, FirebaseError, BrandDeleteVariables>): UseDataConnectMutationResult<BrandDeleteData, BrandDeleteVariables>;
```

### Variables
The `brandDelete` Mutation requires an argument of type `BrandDeleteVariables`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface BrandDeleteVariables {
  id: string;
}
```
### Return Type
Recall that calling the `brandDelete` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `brandDelete` Mutation is of type `BrandDeleteData`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface BrandDeleteData {
  brand_delete?: Brand_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `brandDelete`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, BrandDeleteVariables } from '@erp-system/inventory';
import { useBrandDelete } from '@erp-system/inventory/react'

export default function BrandDeleteComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useBrandDelete();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useBrandDelete(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useBrandDelete(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useBrandDelete(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useBrandDelete` Mutation requires an argument of type `BrandDeleteVariables`:
  const brandDeleteVars: BrandDeleteVariables = {
    id: ..., 
  };
  mutation.mutate(brandDeleteVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(brandDeleteVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.brand_delete);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## costingInsert
You can execute the `costingInsert` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [inventory/react/index.d.ts](./index.d.ts)):
```javascript
useCostingInsert(options?: useDataConnectMutationOptions<CostingInsertData, FirebaseError, CostingInsertVariables>): UseDataConnectMutationResult<CostingInsertData, CostingInsertVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useCostingInsert(dc: DataConnect, options?: useDataConnectMutationOptions<CostingInsertData, FirebaseError, CostingInsertVariables>): UseDataConnectMutationResult<CostingInsertData, CostingInsertVariables>;
```

### Variables
The `costingInsert` Mutation requires an argument of type `CostingInsertVariables`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:

```javascript
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
```
### Return Type
Recall that calling the `costingInsert` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `costingInsert` Mutation is of type `CostingInsertData`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface CostingInsertData {
  costing_insert: Costing_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `costingInsert`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, CostingInsertVariables } from '@erp-system/inventory';
import { useCostingInsert } from '@erp-system/inventory/react'

export default function CostingInsertComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useCostingInsert();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useCostingInsert(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCostingInsert(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCostingInsert(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useCostingInsert` Mutation requires an argument of type `CostingInsertVariables`:
  const costingInsertVars: CostingInsertVariables = {
    id: ..., 
    brandName: ..., 
    usdRate: ..., 
    totalCustomsValue: ..., 
    totalFreightValue: ..., 
    totalUnitCostUSD: ..., 
    shipmentTotalUSD: ..., 
    consignmentValue: ..., 
    totalValueOfBrand: ..., 
    modelsJson: ..., 
    status: ..., 
  };
  mutation.mutate(costingInsertVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., brandName: ..., usdRate: ..., totalCustomsValue: ..., totalFreightValue: ..., totalUnitCostUSD: ..., shipmentTotalUSD: ..., consignmentValue: ..., totalValueOfBrand: ..., modelsJson: ..., status: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(costingInsertVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.costing_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## costingUpdate
You can execute the `costingUpdate` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [inventory/react/index.d.ts](./index.d.ts)):
```javascript
useCostingUpdate(options?: useDataConnectMutationOptions<CostingUpdateData, FirebaseError, CostingUpdateVariables>): UseDataConnectMutationResult<CostingUpdateData, CostingUpdateVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useCostingUpdate(dc: DataConnect, options?: useDataConnectMutationOptions<CostingUpdateData, FirebaseError, CostingUpdateVariables>): UseDataConnectMutationResult<CostingUpdateData, CostingUpdateVariables>;
```

### Variables
The `costingUpdate` Mutation requires an argument of type `CostingUpdateVariables`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:

```javascript
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
```
### Return Type
Recall that calling the `costingUpdate` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `costingUpdate` Mutation is of type `CostingUpdateData`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface CostingUpdateData {
  costing_update?: Costing_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `costingUpdate`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, CostingUpdateVariables } from '@erp-system/inventory';
import { useCostingUpdate } from '@erp-system/inventory/react'

export default function CostingUpdateComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useCostingUpdate();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useCostingUpdate(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCostingUpdate(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCostingUpdate(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useCostingUpdate` Mutation requires an argument of type `CostingUpdateVariables`:
  const costingUpdateVars: CostingUpdateVariables = {
    id: ..., 
    brandName: ..., 
    usdRate: ..., 
    totalCustomsValue: ..., 
    totalFreightValue: ..., 
    totalUnitCostUSD: ..., 
    shipmentTotalUSD: ..., 
    consignmentValue: ..., 
    totalValueOfBrand: ..., 
    modelsJson: ..., 
    status: ..., 
  };
  mutation.mutate(costingUpdateVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., brandName: ..., usdRate: ..., totalCustomsValue: ..., totalFreightValue: ..., totalUnitCostUSD: ..., shipmentTotalUSD: ..., consignmentValue: ..., totalValueOfBrand: ..., modelsJson: ..., status: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(costingUpdateVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.costing_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## costingDelete
You can execute the `costingDelete` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [inventory/react/index.d.ts](./index.d.ts)):
```javascript
useCostingDelete(options?: useDataConnectMutationOptions<CostingDeleteData, FirebaseError, CostingDeleteVariables>): UseDataConnectMutationResult<CostingDeleteData, CostingDeleteVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useCostingDelete(dc: DataConnect, options?: useDataConnectMutationOptions<CostingDeleteData, FirebaseError, CostingDeleteVariables>): UseDataConnectMutationResult<CostingDeleteData, CostingDeleteVariables>;
```

### Variables
The `costingDelete` Mutation requires an argument of type `CostingDeleteVariables`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface CostingDeleteVariables {
  id: string;
}
```
### Return Type
Recall that calling the `costingDelete` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `costingDelete` Mutation is of type `CostingDeleteData`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface CostingDeleteData {
  costing_delete?: Costing_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `costingDelete`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, CostingDeleteVariables } from '@erp-system/inventory';
import { useCostingDelete } from '@erp-system/inventory/react'

export default function CostingDeleteComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useCostingDelete();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useCostingDelete(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCostingDelete(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCostingDelete(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useCostingDelete` Mutation requires an argument of type `CostingDeleteVariables`:
  const costingDeleteVars: CostingDeleteVariables = {
    id: ..., 
  };
  mutation.mutate(costingDeleteVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(costingDeleteVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.costing_delete);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

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
  mutation.mutate(productInsertVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., brandName: ..., modelName: ..., category: ..., costPrice: ..., sellPrice: ..., buyType: ..., warrantyYears: ..., stock: ..., description: ..., status: ..., isDamaged: ..., serialNumbers: ..., serialCities: ..., serialStatus: ..., brandId: ..., modelId: ..., costingId: ..., costingOption: ..., costingUnits: ..., costingUnitCostUSD: ..., costingTotalCostUSD: ..., costingPercentage: ..., costingCustomPerModel: ..., costingCustomPerUnit: ..., costingFreightPerModel: ..., costingFreightPerUnit: ..., costingUnitCostPKR: ..., costingTotalUnitCost: ..., costingTotalShipmentValuePKR: ..., costingUsdRate: ..., costingTotalCustomsValue: ..., costingTotalFreightValue: ..., costingShipmentTotalUSD: ..., costingConsignmentValue: ..., costingTotalValueOfBrand: ..., costingModelsJson: ..., });

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
  mutation.mutate(productUpdateVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., brandName: ..., modelName: ..., category: ..., costPrice: ..., sellPrice: ..., buyType: ..., warrantyYears: ..., stock: ..., description: ..., status: ..., isDamaged: ..., serialNumbers: ..., serialCities: ..., serialStatus: ..., brandId: ..., modelId: ..., costingId: ..., costingOption: ..., costingUnits: ..., costingUnitCostUSD: ..., costingTotalCostUSD: ..., costingPercentage: ..., costingCustomPerModel: ..., costingCustomPerUnit: ..., costingFreightPerModel: ..., costingFreightPerUnit: ..., costingUnitCostPKR: ..., costingTotalUnitCost: ..., costingTotalShipmentValuePKR: ..., costingUsdRate: ..., costingTotalCustomsValue: ..., costingTotalFreightValue: ..., costingShipmentTotalUSD: ..., costingConsignmentValue: ..., costingTotalValueOfBrand: ..., costingModelsJson: ..., });

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

## modelInsert
You can execute the `modelInsert` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [inventory/react/index.d.ts](./index.d.ts)):
```javascript
useModelInsert(options?: useDataConnectMutationOptions<ModelInsertData, FirebaseError, ModelInsertVariables>): UseDataConnectMutationResult<ModelInsertData, ModelInsertVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useModelInsert(dc: DataConnect, options?: useDataConnectMutationOptions<ModelInsertData, FirebaseError, ModelInsertVariables>): UseDataConnectMutationResult<ModelInsertData, ModelInsertVariables>;
```

### Variables
The `modelInsert` Mutation requires an argument of type `ModelInsertVariables`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:

```javascript
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
Recall that calling the `modelInsert` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `modelInsert` Mutation is of type `ModelInsertData`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ModelInsertData {
  model_insert: Model_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `modelInsert`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ModelInsertVariables } from '@erp-system/inventory';
import { useModelInsert } from '@erp-system/inventory/react'

export default function ModelInsertComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useModelInsert();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useModelInsert(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useModelInsert(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useModelInsert(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useModelInsert` Mutation requires an argument of type `ModelInsertVariables`:
  const modelInsertVars: ModelInsertVariables = {
    id: ..., 
    brandId: ..., 
    name: ..., 
    category: ..., // optional
    description: ..., // optional
    costPrice: ..., // optional
    sellPrice: ..., // optional
  };
  mutation.mutate(modelInsertVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., brandId: ..., name: ..., category: ..., description: ..., costPrice: ..., sellPrice: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(modelInsertVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.model_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## modelUpdate
You can execute the `modelUpdate` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [inventory/react/index.d.ts](./index.d.ts)):
```javascript
useModelUpdate(options?: useDataConnectMutationOptions<ModelUpdateData, FirebaseError, ModelUpdateVariables>): UseDataConnectMutationResult<ModelUpdateData, ModelUpdateVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useModelUpdate(dc: DataConnect, options?: useDataConnectMutationOptions<ModelUpdateData, FirebaseError, ModelUpdateVariables>): UseDataConnectMutationResult<ModelUpdateData, ModelUpdateVariables>;
```

### Variables
The `modelUpdate` Mutation requires an argument of type `ModelUpdateVariables`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:

```javascript
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
Recall that calling the `modelUpdate` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `modelUpdate` Mutation is of type `ModelUpdateData`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ModelUpdateData {
  model_update?: Model_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `modelUpdate`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ModelUpdateVariables } from '@erp-system/inventory';
import { useModelUpdate } from '@erp-system/inventory/react'

export default function ModelUpdateComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useModelUpdate();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useModelUpdate(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useModelUpdate(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useModelUpdate(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useModelUpdate` Mutation requires an argument of type `ModelUpdateVariables`:
  const modelUpdateVars: ModelUpdateVariables = {
    id: ..., 
    brandId: ..., 
    name: ..., 
    category: ..., // optional
    description: ..., // optional
    costPrice: ..., // optional
    sellPrice: ..., // optional
  };
  mutation.mutate(modelUpdateVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., brandId: ..., name: ..., category: ..., description: ..., costPrice: ..., sellPrice: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(modelUpdateVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.model_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## modelDelete
You can execute the `modelDelete` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [inventory/react/index.d.ts](./index.d.ts)):
```javascript
useModelDelete(options?: useDataConnectMutationOptions<ModelDeleteData, FirebaseError, ModelDeleteVariables>): UseDataConnectMutationResult<ModelDeleteData, ModelDeleteVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useModelDelete(dc: DataConnect, options?: useDataConnectMutationOptions<ModelDeleteData, FirebaseError, ModelDeleteVariables>): UseDataConnectMutationResult<ModelDeleteData, ModelDeleteVariables>;
```

### Variables
The `modelDelete` Mutation requires an argument of type `ModelDeleteVariables`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ModelDeleteVariables {
  id: string;
}
```
### Return Type
Recall that calling the `modelDelete` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `modelDelete` Mutation is of type `ModelDeleteData`, which is defined in [inventory/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ModelDeleteData {
  model_delete?: Model_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `modelDelete`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ModelDeleteVariables } from '@erp-system/inventory';
import { useModelDelete } from '@erp-system/inventory/react'

export default function ModelDeleteComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useModelDelete();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useModelDelete(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useModelDelete(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useModelDelete(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useModelDelete` Mutation requires an argument of type `ModelDeleteVariables`:
  const modelDeleteVars: ModelDeleteVariables = {
    id: ..., 
  };
  mutation.mutate(modelDeleteVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(modelDeleteVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.model_delete);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

