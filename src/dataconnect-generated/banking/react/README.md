# Generated React README
This README will guide you through the process of using the generated React SDK package for the connector `banking`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `JavaScript README`, you can find it at [`banking/README.md`](../README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

You can use this generated SDK by importing from the package `@erp-system/banking/react` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#react).

# Table of Contents
- [**Overview**](#generated-react-readme)
- [**TanStack Query Firebase & TanStack React Query**](#tanstack-query-firebase-tanstack-react-query)
  - [*Package Installation*](#installing-tanstack-query-firebase-and-tanstack-react-query-packages)
  - [*Configuring TanStack Query*](#configuring-tanstack-query)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*listCashInHand*](#listcashinhand)
  - [*getCashInHandById*](#getcashinhandbyid)
  - [*listTransfers*](#listtransfers)
  - [*getTransferById*](#gettransferbyid)
  - [*listBanks*](#listbanks)
  - [*getBankById*](#getbankbyid)
- [**Mutations**](#mutations)
  - [*cashInHandInsert*](#cashinhandinsert)
  - [*cashInHandDelete*](#cashinhanddelete)
  - [*transferInsert*](#transferinsert)
  - [*transferDelete*](#transferdelete)
  - [*bankInsert*](#bankinsert)
  - [*bankUpdate*](#bankupdate)
  - [*bankDelete*](#bankdelete)
  - [*updateBankBalance*](#updatebankbalance)

# TanStack Query Firebase & TanStack React Query
This SDK provides [React](https://react.dev/) hooks generated specific to your application, for the operations found in the connector `banking`. These hooks are generated using [TanStack Query Firebase](https://react-query-firebase.invertase.dev/) by our partners at Invertase, a library built on top of [TanStack React Query v5](https://tanstack.com/query/v5/docs/framework/react/overview).

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
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `banking`.

You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@erp-system/banking';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#emulator-react-angular).

```javascript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@erp-system/banking';

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

Below are examples of how to use the `banking` connector's generated Query hook functions to execute each Query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#operations-react-angular).

## listCashInHand
You can execute the `listCashInHand` Query using the following Query hook function, which is defined in [banking/react/index.d.ts](./index.d.ts):

```javascript
useListCashInHand(dc: DataConnect, vars?: ListCashInHandVariables, options?: useDataConnectQueryOptions<ListCashInHandData>): UseDataConnectQueryResult<ListCashInHandData, ListCashInHandVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListCashInHand(vars?: ListCashInHandVariables, options?: useDataConnectQueryOptions<ListCashInHandData>): UseDataConnectQueryResult<ListCashInHandData, ListCashInHandVariables>;
```

### Variables
The `listCashInHand` Query has an optional argument of type `ListCashInHandVariables`, which is defined in [banking/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListCashInHandVariables {
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that calling the `listCashInHand` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `listCashInHand` Query is of type `ListCashInHandData`, which is defined in [banking/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListCashInHandData {
  cashInHands: ({
    id: string;
    date: string;
    company: string;
    mainCategory: string;
    subCategory: string;
    amount: number;
    mode: string;
    note?: string | null;
    createdAt?: string | null;
  } & CashInHand_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `listCashInHand`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListCashInHandVariables } from '@erp-system/banking';
import { useListCashInHand } from '@erp-system/banking/react'

export default function ListCashInHandComponent() {
  // The `useListCashInHand` Query hook has an optional argument of type `ListCashInHandVariables`:
  const listCashInHandVars: ListCashInHandVariables = {
    limit: ..., // optional
    offset: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListCashInHand(listCashInHandVars);
  // Variables can be defined inline as well.
  const query = useListCashInHand({ limit: ..., offset: ..., });
  // Since all variables are optional for this Query, you can omit the `ListCashInHandVariables` argument.
  // (as long as you don't want to provide any `options`!)
  const query = useListCashInHand();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListCashInHand(dataConnect, listCashInHandVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListCashInHand(listCashInHandVars, options);
  // If you'd like to provide options without providing any variables, you must
  // pass `undefined` where you would normally pass the variables.
  const query = useListCashInHand(undefined, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListCashInHand(dataConnect, listCashInHandVars /** or undefined */, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.cashInHands);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## getCashInHandById
You can execute the `getCashInHandById` Query using the following Query hook function, which is defined in [banking/react/index.d.ts](./index.d.ts):

```javascript
useGetCashInHandById(dc: DataConnect, vars: GetCashInHandByIdVariables, options?: useDataConnectQueryOptions<GetCashInHandByIdData>): UseDataConnectQueryResult<GetCashInHandByIdData, GetCashInHandByIdVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetCashInHandById(vars: GetCashInHandByIdVariables, options?: useDataConnectQueryOptions<GetCashInHandByIdData>): UseDataConnectQueryResult<GetCashInHandByIdData, GetCashInHandByIdVariables>;
```

### Variables
The `getCashInHandById` Query requires an argument of type `GetCashInHandByIdVariables`, which is defined in [banking/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetCashInHandByIdVariables {
  id: string;
}
```
### Return Type
Recall that calling the `getCashInHandById` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `getCashInHandById` Query is of type `GetCashInHandByIdData`, which is defined in [banking/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetCashInHandByIdData {
  cashInHand?: {
    id: string;
    date: string;
    company: string;
    mainCategory: string;
    subCategory: string;
    amount: number;
    mode: string;
    note?: string | null;
    createdAt?: string | null;
  } & CashInHand_Key;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `getCashInHandById`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetCashInHandByIdVariables } from '@erp-system/banking';
import { useGetCashInHandById } from '@erp-system/banking/react'

export default function GetCashInHandByIdComponent() {
  // The `useGetCashInHandById` Query hook requires an argument of type `GetCashInHandByIdVariables`:
  const getCashInHandByIdVars: GetCashInHandByIdVariables = {
    id: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetCashInHandById(getCashInHandByIdVars);
  // Variables can be defined inline as well.
  const query = useGetCashInHandById({ id: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetCashInHandById(dataConnect, getCashInHandByIdVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetCashInHandById(getCashInHandByIdVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetCashInHandById(dataConnect, getCashInHandByIdVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.cashInHand);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## listTransfers
You can execute the `listTransfers` Query using the following Query hook function, which is defined in [banking/react/index.d.ts](./index.d.ts):

```javascript
useListTransfers(dc: DataConnect, vars?: ListTransfersVariables, options?: useDataConnectQueryOptions<ListTransfersData>): UseDataConnectQueryResult<ListTransfersData, ListTransfersVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListTransfers(vars?: ListTransfersVariables, options?: useDataConnectQueryOptions<ListTransfersData>): UseDataConnectQueryResult<ListTransfersData, ListTransfersVariables>;
```

### Variables
The `listTransfers` Query has an optional argument of type `ListTransfersVariables`, which is defined in [banking/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListTransfersVariables {
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that calling the `listTransfers` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `listTransfers` Query is of type `ListTransfersData`, which is defined in [banking/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListTransfersData {
  bankTransfers: ({
    id: string;
    date: string;
    fromBankId: string;
    fromBankName: string;
    toBankId: string;
    toBankName: string;
    amount: number;
    note?: string | null;
    createdAt?: string | null;
  } & BankTransfer_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `listTransfers`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListTransfersVariables } from '@erp-system/banking';
import { useListTransfers } from '@erp-system/banking/react'

export default function ListTransfersComponent() {
  // The `useListTransfers` Query hook has an optional argument of type `ListTransfersVariables`:
  const listTransfersVars: ListTransfersVariables = {
    limit: ..., // optional
    offset: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListTransfers(listTransfersVars);
  // Variables can be defined inline as well.
  const query = useListTransfers({ limit: ..., offset: ..., });
  // Since all variables are optional for this Query, you can omit the `ListTransfersVariables` argument.
  // (as long as you don't want to provide any `options`!)
  const query = useListTransfers();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListTransfers(dataConnect, listTransfersVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListTransfers(listTransfersVars, options);
  // If you'd like to provide options without providing any variables, you must
  // pass `undefined` where you would normally pass the variables.
  const query = useListTransfers(undefined, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListTransfers(dataConnect, listTransfersVars /** or undefined */, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.bankTransfers);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## getTransferById
You can execute the `getTransferById` Query using the following Query hook function, which is defined in [banking/react/index.d.ts](./index.d.ts):

```javascript
useGetTransferById(dc: DataConnect, vars: GetTransferByIdVariables, options?: useDataConnectQueryOptions<GetTransferByIdData>): UseDataConnectQueryResult<GetTransferByIdData, GetTransferByIdVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetTransferById(vars: GetTransferByIdVariables, options?: useDataConnectQueryOptions<GetTransferByIdData>): UseDataConnectQueryResult<GetTransferByIdData, GetTransferByIdVariables>;
```

### Variables
The `getTransferById` Query requires an argument of type `GetTransferByIdVariables`, which is defined in [banking/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetTransferByIdVariables {
  id: string;
}
```
### Return Type
Recall that calling the `getTransferById` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `getTransferById` Query is of type `GetTransferByIdData`, which is defined in [banking/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetTransferByIdData {
  bankTransfer?: {
    id: string;
    date: string;
    fromBankId: string;
    fromBankName: string;
    toBankId: string;
    toBankName: string;
    amount: number;
    note?: string | null;
    createdAt?: string | null;
  } & BankTransfer_Key;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `getTransferById`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetTransferByIdVariables } from '@erp-system/banking';
import { useGetTransferById } from '@erp-system/banking/react'

export default function GetTransferByIdComponent() {
  // The `useGetTransferById` Query hook requires an argument of type `GetTransferByIdVariables`:
  const getTransferByIdVars: GetTransferByIdVariables = {
    id: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetTransferById(getTransferByIdVars);
  // Variables can be defined inline as well.
  const query = useGetTransferById({ id: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetTransferById(dataConnect, getTransferByIdVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetTransferById(getTransferByIdVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetTransferById(dataConnect, getTransferByIdVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.bankTransfer);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## listBanks
You can execute the `listBanks` Query using the following Query hook function, which is defined in [banking/react/index.d.ts](./index.d.ts):

```javascript
useListBanks(dc: DataConnect, vars?: ListBanksVariables, options?: useDataConnectQueryOptions<ListBanksData>): UseDataConnectQueryResult<ListBanksData, ListBanksVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListBanks(vars?: ListBanksVariables, options?: useDataConnectQueryOptions<ListBanksData>): UseDataConnectQueryResult<ListBanksData, ListBanksVariables>;
```

### Variables
The `listBanks` Query has an optional argument of type `ListBanksVariables`, which is defined in [banking/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListBanksVariables {
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that calling the `listBanks` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `listBanks` Query is of type `ListBanksData`, which is defined in [banking/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListBanksData {
  banks: ({
    id: string;
    name: string;
    accountNumber: string;
    balance: number;
    createdAt?: string | null;
    updatedAt?: string | null;
  } & Bank_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `listBanks`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListBanksVariables } from '@erp-system/banking';
import { useListBanks } from '@erp-system/banking/react'

export default function ListBanksComponent() {
  // The `useListBanks` Query hook has an optional argument of type `ListBanksVariables`:
  const listBanksVars: ListBanksVariables = {
    limit: ..., // optional
    offset: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListBanks(listBanksVars);
  // Variables can be defined inline as well.
  const query = useListBanks({ limit: ..., offset: ..., });
  // Since all variables are optional for this Query, you can omit the `ListBanksVariables` argument.
  // (as long as you don't want to provide any `options`!)
  const query = useListBanks();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListBanks(dataConnect, listBanksVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListBanks(listBanksVars, options);
  // If you'd like to provide options without providing any variables, you must
  // pass `undefined` where you would normally pass the variables.
  const query = useListBanks(undefined, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListBanks(dataConnect, listBanksVars /** or undefined */, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.banks);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## getBankById
You can execute the `getBankById` Query using the following Query hook function, which is defined in [banking/react/index.d.ts](./index.d.ts):

```javascript
useGetBankById(dc: DataConnect, vars: GetBankByIdVariables, options?: useDataConnectQueryOptions<GetBankByIdData>): UseDataConnectQueryResult<GetBankByIdData, GetBankByIdVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetBankById(vars: GetBankByIdVariables, options?: useDataConnectQueryOptions<GetBankByIdData>): UseDataConnectQueryResult<GetBankByIdData, GetBankByIdVariables>;
```

### Variables
The `getBankById` Query requires an argument of type `GetBankByIdVariables`, which is defined in [banking/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetBankByIdVariables {
  id: string;
}
```
### Return Type
Recall that calling the `getBankById` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `getBankById` Query is of type `GetBankByIdData`, which is defined in [banking/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetBankByIdData {
  bank?: {
    id: string;
    name: string;
    accountNumber: string;
    balance: number;
    createdAt?: string | null;
    updatedAt?: string | null;
  } & Bank_Key;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `getBankById`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetBankByIdVariables } from '@erp-system/banking';
import { useGetBankById } from '@erp-system/banking/react'

export default function GetBankByIdComponent() {
  // The `useGetBankById` Query hook requires an argument of type `GetBankByIdVariables`:
  const getBankByIdVars: GetBankByIdVariables = {
    id: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetBankById(getBankByIdVars);
  // Variables can be defined inline as well.
  const query = useGetBankById({ id: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetBankById(dataConnect, getBankByIdVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetBankById(getBankByIdVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetBankById(dataConnect, getBankByIdVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.bank);
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

Below are examples of how to use the `banking` connector's generated Mutation hook functions to execute each Mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#operations-react-angular).

## cashInHandInsert
You can execute the `cashInHandInsert` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [banking/react/index.d.ts](./index.d.ts)):
```javascript
useCashInHandInsert(options?: useDataConnectMutationOptions<CashInHandInsertData, FirebaseError, CashInHandInsertVariables | void>): UseDataConnectMutationResult<CashInHandInsertData, CashInHandInsertVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useCashInHandInsert(dc: DataConnect, options?: useDataConnectMutationOptions<CashInHandInsertData, FirebaseError, CashInHandInsertVariables | void>): UseDataConnectMutationResult<CashInHandInsertData, CashInHandInsertVariables>;
```

### Variables
The `cashInHandInsert` Mutation has an optional argument of type `CashInHandInsertVariables`, which is defined in [banking/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface CashInHandInsertVariables {
  id?: string;
  date?: string;
  company?: string;
  mainCategory?: string;
  subCategory?: string;
  amount?: number;
  mode?: string;
  note?: string | null;
}
```
### Return Type
Recall that calling the `cashInHandInsert` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `cashInHandInsert` Mutation is of type `CashInHandInsertData`, which is defined in [banking/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface CashInHandInsertData {
  cashInHand_insert: CashInHand_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `cashInHandInsert`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, CashInHandInsertVariables } from '@erp-system/banking';
import { useCashInHandInsert } from '@erp-system/banking/react'

export default function CashInHandInsertComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useCashInHandInsert();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useCashInHandInsert(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCashInHandInsert(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCashInHandInsert(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useCashInHandInsert` Mutation has an optional argument of type `CashInHandInsertVariables`:
  const cashInHandInsertVars: CashInHandInsertVariables = {
    id: ..., // optional
    date: ..., // optional
    company: ..., // optional
    mainCategory: ..., // optional
    subCategory: ..., // optional
    amount: ..., // optional
    mode: ..., // optional
    note: ..., // optional
  };
  mutation.mutate(cashInHandInsertVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., date: ..., company: ..., mainCategory: ..., subCategory: ..., amount: ..., mode: ..., note: ..., });
  // Since all variables are optional for this Mutation, you can omit the `CashInHandInsertVariables` argument.
  mutation.mutate();

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  // Since all variables are optional for this Mutation, you can provide options without providing any variables.
  // To do so, you must pass `undefined` where you would normally pass the variables.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(cashInHandInsertVars /** or undefined */, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.cashInHand_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## cashInHandDelete
You can execute the `cashInHandDelete` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [banking/react/index.d.ts](./index.d.ts)):
```javascript
useCashInHandDelete(options?: useDataConnectMutationOptions<CashInHandDeleteData, FirebaseError, CashInHandDeleteVariables | void>): UseDataConnectMutationResult<CashInHandDeleteData, CashInHandDeleteVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useCashInHandDelete(dc: DataConnect, options?: useDataConnectMutationOptions<CashInHandDeleteData, FirebaseError, CashInHandDeleteVariables | void>): UseDataConnectMutationResult<CashInHandDeleteData, CashInHandDeleteVariables>;
```

### Variables
The `cashInHandDelete` Mutation has an optional argument of type `CashInHandDeleteVariables`, which is defined in [banking/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface CashInHandDeleteVariables {
  id?: string;
}
```
### Return Type
Recall that calling the `cashInHandDelete` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `cashInHandDelete` Mutation is of type `CashInHandDeleteData`, which is defined in [banking/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface CashInHandDeleteData {
  cashInHand_delete?: CashInHand_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `cashInHandDelete`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, CashInHandDeleteVariables } from '@erp-system/banking';
import { useCashInHandDelete } from '@erp-system/banking/react'

export default function CashInHandDeleteComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useCashInHandDelete();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useCashInHandDelete(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCashInHandDelete(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCashInHandDelete(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useCashInHandDelete` Mutation has an optional argument of type `CashInHandDeleteVariables`:
  const cashInHandDeleteVars: CashInHandDeleteVariables = {
    id: ..., // optional
  };
  mutation.mutate(cashInHandDeleteVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., });
  // Since all variables are optional for this Mutation, you can omit the `CashInHandDeleteVariables` argument.
  mutation.mutate();

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  // Since all variables are optional for this Mutation, you can provide options without providing any variables.
  // To do so, you must pass `undefined` where you would normally pass the variables.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(cashInHandDeleteVars /** or undefined */, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.cashInHand_delete);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## transferInsert
You can execute the `transferInsert` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [banking/react/index.d.ts](./index.d.ts)):
```javascript
useTransferInsert(options?: useDataConnectMutationOptions<TransferInsertData, FirebaseError, TransferInsertVariables | void>): UseDataConnectMutationResult<TransferInsertData, TransferInsertVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useTransferInsert(dc: DataConnect, options?: useDataConnectMutationOptions<TransferInsertData, FirebaseError, TransferInsertVariables | void>): UseDataConnectMutationResult<TransferInsertData, TransferInsertVariables>;
```

### Variables
The `transferInsert` Mutation has an optional argument of type `TransferInsertVariables`, which is defined in [banking/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface TransferInsertVariables {
  id?: string;
  date?: string;
  fromBankId?: string;
  fromBankName?: string;
  toBankId?: string;
  toBankName?: string;
  amount?: number;
  note?: string | null;
}
```
### Return Type
Recall that calling the `transferInsert` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `transferInsert` Mutation is of type `TransferInsertData`, which is defined in [banking/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface TransferInsertData {
  bankTransfer_insert: BankTransfer_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `transferInsert`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, TransferInsertVariables } from '@erp-system/banking';
import { useTransferInsert } from '@erp-system/banking/react'

export default function TransferInsertComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useTransferInsert();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useTransferInsert(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useTransferInsert(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useTransferInsert(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useTransferInsert` Mutation has an optional argument of type `TransferInsertVariables`:
  const transferInsertVars: TransferInsertVariables = {
    id: ..., // optional
    date: ..., // optional
    fromBankId: ..., // optional
    fromBankName: ..., // optional
    toBankId: ..., // optional
    toBankName: ..., // optional
    amount: ..., // optional
    note: ..., // optional
  };
  mutation.mutate(transferInsertVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., date: ..., fromBankId: ..., fromBankName: ..., toBankId: ..., toBankName: ..., amount: ..., note: ..., });
  // Since all variables are optional for this Mutation, you can omit the `TransferInsertVariables` argument.
  mutation.mutate();

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  // Since all variables are optional for this Mutation, you can provide options without providing any variables.
  // To do so, you must pass `undefined` where you would normally pass the variables.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(transferInsertVars /** or undefined */, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.bankTransfer_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## transferDelete
You can execute the `transferDelete` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [banking/react/index.d.ts](./index.d.ts)):
```javascript
useTransferDelete(options?: useDataConnectMutationOptions<TransferDeleteData, FirebaseError, TransferDeleteVariables | void>): UseDataConnectMutationResult<TransferDeleteData, TransferDeleteVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useTransferDelete(dc: DataConnect, options?: useDataConnectMutationOptions<TransferDeleteData, FirebaseError, TransferDeleteVariables | void>): UseDataConnectMutationResult<TransferDeleteData, TransferDeleteVariables>;
```

### Variables
The `transferDelete` Mutation has an optional argument of type `TransferDeleteVariables`, which is defined in [banking/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface TransferDeleteVariables {
  id?: string;
}
```
### Return Type
Recall that calling the `transferDelete` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `transferDelete` Mutation is of type `TransferDeleteData`, which is defined in [banking/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface TransferDeleteData {
  bankTransfer_delete?: BankTransfer_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `transferDelete`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, TransferDeleteVariables } from '@erp-system/banking';
import { useTransferDelete } from '@erp-system/banking/react'

export default function TransferDeleteComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useTransferDelete();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useTransferDelete(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useTransferDelete(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useTransferDelete(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useTransferDelete` Mutation has an optional argument of type `TransferDeleteVariables`:
  const transferDeleteVars: TransferDeleteVariables = {
    id: ..., // optional
  };
  mutation.mutate(transferDeleteVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., });
  // Since all variables are optional for this Mutation, you can omit the `TransferDeleteVariables` argument.
  mutation.mutate();

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  // Since all variables are optional for this Mutation, you can provide options without providing any variables.
  // To do so, you must pass `undefined` where you would normally pass the variables.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(transferDeleteVars /** or undefined */, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.bankTransfer_delete);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## bankInsert
You can execute the `bankInsert` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [banking/react/index.d.ts](./index.d.ts)):
```javascript
useBankInsert(options?: useDataConnectMutationOptions<BankInsertData, FirebaseError, BankInsertVariables | void>): UseDataConnectMutationResult<BankInsertData, BankInsertVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useBankInsert(dc: DataConnect, options?: useDataConnectMutationOptions<BankInsertData, FirebaseError, BankInsertVariables | void>): UseDataConnectMutationResult<BankInsertData, BankInsertVariables>;
```

### Variables
The `bankInsert` Mutation has an optional argument of type `BankInsertVariables`, which is defined in [banking/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface BankInsertVariables {
  id?: string;
  name?: string;
  accountNumber?: string;
  balance?: number;
}
```
### Return Type
Recall that calling the `bankInsert` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `bankInsert` Mutation is of type `BankInsertData`, which is defined in [banking/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface BankInsertData {
  bank_insert: Bank_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `bankInsert`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, BankInsertVariables } from '@erp-system/banking';
import { useBankInsert } from '@erp-system/banking/react'

export default function BankInsertComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useBankInsert();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useBankInsert(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useBankInsert(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useBankInsert(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useBankInsert` Mutation has an optional argument of type `BankInsertVariables`:
  const bankInsertVars: BankInsertVariables = {
    id: ..., // optional
    name: ..., // optional
    accountNumber: ..., // optional
    balance: ..., // optional
  };
  mutation.mutate(bankInsertVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., name: ..., accountNumber: ..., balance: ..., });
  // Since all variables are optional for this Mutation, you can omit the `BankInsertVariables` argument.
  mutation.mutate();

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  // Since all variables are optional for this Mutation, you can provide options without providing any variables.
  // To do so, you must pass `undefined` where you would normally pass the variables.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(bankInsertVars /** or undefined */, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.bank_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## bankUpdate
You can execute the `bankUpdate` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [banking/react/index.d.ts](./index.d.ts)):
```javascript
useBankUpdate(options?: useDataConnectMutationOptions<BankUpdateData, FirebaseError, BankUpdateVariables | void>): UseDataConnectMutationResult<BankUpdateData, BankUpdateVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useBankUpdate(dc: DataConnect, options?: useDataConnectMutationOptions<BankUpdateData, FirebaseError, BankUpdateVariables | void>): UseDataConnectMutationResult<BankUpdateData, BankUpdateVariables>;
```

### Variables
The `bankUpdate` Mutation has an optional argument of type `BankUpdateVariables`, which is defined in [banking/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface BankUpdateVariables {
  id?: string;
  name?: string;
  accountNumber?: string;
  balance?: number;
}
```
### Return Type
Recall that calling the `bankUpdate` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `bankUpdate` Mutation is of type `BankUpdateData`, which is defined in [banking/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface BankUpdateData {
  bank_update?: Bank_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `bankUpdate`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, BankUpdateVariables } from '@erp-system/banking';
import { useBankUpdate } from '@erp-system/banking/react'

export default function BankUpdateComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useBankUpdate();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useBankUpdate(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useBankUpdate(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useBankUpdate(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useBankUpdate` Mutation has an optional argument of type `BankUpdateVariables`:
  const bankUpdateVars: BankUpdateVariables = {
    id: ..., // optional
    name: ..., // optional
    accountNumber: ..., // optional
    balance: ..., // optional
  };
  mutation.mutate(bankUpdateVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., name: ..., accountNumber: ..., balance: ..., });
  // Since all variables are optional for this Mutation, you can omit the `BankUpdateVariables` argument.
  mutation.mutate();

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  // Since all variables are optional for this Mutation, you can provide options without providing any variables.
  // To do so, you must pass `undefined` where you would normally pass the variables.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(bankUpdateVars /** or undefined */, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.bank_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## bankDelete
You can execute the `bankDelete` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [banking/react/index.d.ts](./index.d.ts)):
```javascript
useBankDelete(options?: useDataConnectMutationOptions<BankDeleteData, FirebaseError, BankDeleteVariables | void>): UseDataConnectMutationResult<BankDeleteData, BankDeleteVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useBankDelete(dc: DataConnect, options?: useDataConnectMutationOptions<BankDeleteData, FirebaseError, BankDeleteVariables | void>): UseDataConnectMutationResult<BankDeleteData, BankDeleteVariables>;
```

### Variables
The `bankDelete` Mutation has an optional argument of type `BankDeleteVariables`, which is defined in [banking/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface BankDeleteVariables {
  id?: string;
}
```
### Return Type
Recall that calling the `bankDelete` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `bankDelete` Mutation is of type `BankDeleteData`, which is defined in [banking/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface BankDeleteData {
  bank_delete?: Bank_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `bankDelete`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, BankDeleteVariables } from '@erp-system/banking';
import { useBankDelete } from '@erp-system/banking/react'

export default function BankDeleteComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useBankDelete();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useBankDelete(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useBankDelete(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useBankDelete(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useBankDelete` Mutation has an optional argument of type `BankDeleteVariables`:
  const bankDeleteVars: BankDeleteVariables = {
    id: ..., // optional
  };
  mutation.mutate(bankDeleteVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., });
  // Since all variables are optional for this Mutation, you can omit the `BankDeleteVariables` argument.
  mutation.mutate();

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  // Since all variables are optional for this Mutation, you can provide options without providing any variables.
  // To do so, you must pass `undefined` where you would normally pass the variables.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(bankDeleteVars /** or undefined */, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.bank_delete);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## updateBankBalance
You can execute the `updateBankBalance` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [banking/react/index.d.ts](./index.d.ts)):
```javascript
useUpdateBankBalance(options?: useDataConnectMutationOptions<UpdateBankBalanceData, FirebaseError, UpdateBankBalanceVariables | void>): UseDataConnectMutationResult<UpdateBankBalanceData, UpdateBankBalanceVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpdateBankBalance(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateBankBalanceData, FirebaseError, UpdateBankBalanceVariables | void>): UseDataConnectMutationResult<UpdateBankBalanceData, UpdateBankBalanceVariables>;
```

### Variables
The `updateBankBalance` Mutation has an optional argument of type `UpdateBankBalanceVariables`, which is defined in [banking/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpdateBankBalanceVariables {
  id?: string;
  newBalance?: number;
}
```
### Return Type
Recall that calling the `updateBankBalance` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `updateBankBalance` Mutation is of type `UpdateBankBalanceData`, which is defined in [banking/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpdateBankBalanceData {
  bank_update?: Bank_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `updateBankBalance`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpdateBankBalanceVariables } from '@erp-system/banking';
import { useUpdateBankBalance } from '@erp-system/banking/react'

export default function UpdateBankBalanceComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpdateBankBalance();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpdateBankBalance(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateBankBalance(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateBankBalance(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpdateBankBalance` Mutation has an optional argument of type `UpdateBankBalanceVariables`:
  const updateBankBalanceVars: UpdateBankBalanceVariables = {
    id: ..., // optional
    newBalance: ..., // optional
  };
  mutation.mutate(updateBankBalanceVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., newBalance: ..., });
  // Since all variables are optional for this Mutation, you can omit the `UpdateBankBalanceVariables` argument.
  mutation.mutate();

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  // Since all variables are optional for this Mutation, you can provide options without providing any variables.
  // To do so, you must pass `undefined` where you would normally pass the variables.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(updateBankBalanceVars /** or undefined */, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.bank_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

