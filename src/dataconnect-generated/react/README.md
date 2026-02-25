# Generated React README
This README will guide you through the process of using the generated React SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `JavaScript README`, you can find it at [`dataconnect-generated/README.md`](../README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

You can use this generated SDK by importing from the package `@dataconnect/generated/react` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#react).

# Table of Contents
- [**Overview**](#generated-react-readme)
- [**TanStack Query Firebase & TanStack React Query**](#tanstack-query-firebase-tanstack-react-query)
  - [*Package Installation*](#installing-tanstack-query-firebase-and-tanstack-react-query-packages)
  - [*Configuring TanStack Query*](#configuring-tanstack-query)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetEmployees*](#getemployees)
  - [*GetEmployeeById*](#getemployeebyid)
  - [*GetBanks*](#getbanks)
  - [*GetBankById*](#getbankbyid)
  - [*GetCashInHandRecords*](#getcashinhandrecords)
  - [*GetCashInHandByLocation*](#getcashinhandbylocation)
  - [*GetCashInHandById*](#getcashinhandbyid)
  - [*GetBankTransfers*](#getbanktransfers)
  - [*GetBankTransfersByBank*](#getbanktransfersbybank)
- [**Mutations**](#mutations)
  - [*CreateEmployee*](#createemployee)
  - [*UpdateEmployee*](#updateemployee)
  - [*DeleteEmployee*](#deleteemployee)
  - [*CreateBank*](#createbank)
  - [*UpdateBank*](#updatebank)
  - [*DeleteBank*](#deletebank)
  - [*CreateCashInHand*](#createcashinhand)
  - [*UpdateCashInHand*](#updatecashinhand)
  - [*DeleteCashInHand*](#deletecashinhand)
  - [*CreateBankTransfer*](#createbanktransfer)
  - [*DeleteBankTransfer*](#deletebanktransfer)

# TanStack Query Firebase & TanStack React Query
This SDK provides [React](https://react.dev/) hooks generated specific to your application, for the operations found in the connector `example`. These hooks are generated using [TanStack Query Firebase](https://react-query-firebase.invertase.dev/) by our partners at Invertase, a library built on top of [TanStack React Query v5](https://tanstack.com/query/v5/docs/framework/react/overview).

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
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`.

You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#emulator-react-angular).

```javascript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

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

Below are examples of how to use the `example` connector's generated Query hook functions to execute each Query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#operations-react-angular).

## GetEmployees
You can execute the `GetEmployees` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetEmployees(dc: DataConnect, options?: useDataConnectQueryOptions<GetEmployeesData>): UseDataConnectQueryResult<GetEmployeesData, undefined>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetEmployees(options?: useDataConnectQueryOptions<GetEmployeesData>): UseDataConnectQueryResult<GetEmployeesData, undefined>;
```

### Variables
The `GetEmployees` Query has no variables.
### Return Type
Recall that calling the `GetEmployees` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetEmployees` Query is of type `GetEmployeesData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetEmployeesData {
  employees: ({
    id: string;
    name?: string | null;
    position?: string | null;
    salary?: number | null;
    phone?: string | null;
    email?: string | null;
    joinDate?: string | null;
    status?: string | null;
    location?: string | null;
    accountNumber?: string | null;
    bankName?: string | null;
    accountTitle?: string | null;
  } & Employee_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetEmployees`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';
import { useGetEmployees } from '@dataconnect/generated/react'

export default function GetEmployeesComponent() {
  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetEmployees();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetEmployees(dataConnect);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetEmployees(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetEmployees(dataConnect, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.employees);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetEmployeeById
You can execute the `GetEmployeeById` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetEmployeeById(dc: DataConnect, vars: GetEmployeeByIdVariables, options?: useDataConnectQueryOptions<GetEmployeeByIdData>): UseDataConnectQueryResult<GetEmployeeByIdData, GetEmployeeByIdVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetEmployeeById(vars: GetEmployeeByIdVariables, options?: useDataConnectQueryOptions<GetEmployeeByIdData>): UseDataConnectQueryResult<GetEmployeeByIdData, GetEmployeeByIdVariables>;
```

### Variables
The `GetEmployeeById` Query requires an argument of type `GetEmployeeByIdVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetEmployeeByIdVariables {
  id: string;
}
```
### Return Type
Recall that calling the `GetEmployeeById` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetEmployeeById` Query is of type `GetEmployeeByIdData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetEmployeeByIdData {
  employee?: {
    id: string;
    name?: string | null;
    position?: string | null;
    salary?: number | null;
    phone?: string | null;
    email?: string | null;
    joinDate?: string | null;
    status?: string | null;
    location?: string | null;
    accountNumber?: string | null;
    bankName?: string | null;
    accountTitle?: string | null;
  } & Employee_Key;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetEmployeeById`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetEmployeeByIdVariables } from '@dataconnect/generated';
import { useGetEmployeeById } from '@dataconnect/generated/react'

export default function GetEmployeeByIdComponent() {
  // The `useGetEmployeeById` Query hook requires an argument of type `GetEmployeeByIdVariables`:
  const getEmployeeByIdVars: GetEmployeeByIdVariables = {
    id: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetEmployeeById(getEmployeeByIdVars);
  // Variables can be defined inline as well.
  const query = useGetEmployeeById({ id: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetEmployeeById(dataConnect, getEmployeeByIdVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetEmployeeById(getEmployeeByIdVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetEmployeeById(dataConnect, getEmployeeByIdVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.employee);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetBanks
You can execute the `GetBanks` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetBanks(dc: DataConnect, options?: useDataConnectQueryOptions<GetBanksData>): UseDataConnectQueryResult<GetBanksData, undefined>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetBanks(options?: useDataConnectQueryOptions<GetBanksData>): UseDataConnectQueryResult<GetBanksData, undefined>;
```

### Variables
The `GetBanks` Query has no variables.
### Return Type
Recall that calling the `GetBanks` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetBanks` Query is of type `GetBanksData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetBanksData {
  banks: ({
    id: string;
    name?: string | null;
    accountNumber?: string | null;
    balance?: number | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  } & Bank_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetBanks`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';
import { useGetBanks } from '@dataconnect/generated/react'

export default function GetBanksComponent() {
  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetBanks();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetBanks(dataConnect);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetBanks(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetBanks(dataConnect, options);

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

## GetBankById
You can execute the `GetBankById` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetBankById(dc: DataConnect, vars: GetBankByIdVariables, options?: useDataConnectQueryOptions<GetBankByIdData>): UseDataConnectQueryResult<GetBankByIdData, GetBankByIdVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetBankById(vars: GetBankByIdVariables, options?: useDataConnectQueryOptions<GetBankByIdData>): UseDataConnectQueryResult<GetBankByIdData, GetBankByIdVariables>;
```

### Variables
The `GetBankById` Query requires an argument of type `GetBankByIdVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetBankByIdVariables {
  id: string;
}
```
### Return Type
Recall that calling the `GetBankById` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetBankById` Query is of type `GetBankByIdData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetBankByIdData {
  bank?: {
    id: string;
    name?: string | null;
    accountNumber?: string | null;
    balance?: number | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  } & Bank_Key;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetBankById`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetBankByIdVariables } from '@dataconnect/generated';
import { useGetBankById } from '@dataconnect/generated/react'

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

## GetCashInHandRecords
You can execute the `GetCashInHandRecords` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetCashInHandRecords(dc: DataConnect, options?: useDataConnectQueryOptions<GetCashInHandRecordsData>): UseDataConnectQueryResult<GetCashInHandRecordsData, undefined>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetCashInHandRecords(options?: useDataConnectQueryOptions<GetCashInHandRecordsData>): UseDataConnectQueryResult<GetCashInHandRecordsData, undefined>;
```

### Variables
The `GetCashInHandRecords` Query has no variables.
### Return Type
Recall that calling the `GetCashInHandRecords` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetCashInHandRecords` Query is of type `GetCashInHandRecordsData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetCashInHandRecordsData {
  cashInHands: ({
    id: string;
    location?: string | null;
    balance?: number | null;
    lastUpdated?: string | null;
    updatedBy?: string | null;
  } & CashInHand_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetCashInHandRecords`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';
import { useGetCashInHandRecords } from '@dataconnect/generated/react'

export default function GetCashInHandRecordsComponent() {
  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetCashInHandRecords();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetCashInHandRecords(dataConnect);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetCashInHandRecords(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetCashInHandRecords(dataConnect, options);

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

## GetCashInHandByLocation
You can execute the `GetCashInHandByLocation` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetCashInHandByLocation(dc: DataConnect, vars: GetCashInHandByLocationVariables, options?: useDataConnectQueryOptions<GetCashInHandByLocationData>): UseDataConnectQueryResult<GetCashInHandByLocationData, GetCashInHandByLocationVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetCashInHandByLocation(vars: GetCashInHandByLocationVariables, options?: useDataConnectQueryOptions<GetCashInHandByLocationData>): UseDataConnectQueryResult<GetCashInHandByLocationData, GetCashInHandByLocationVariables>;
```

### Variables
The `GetCashInHandByLocation` Query requires an argument of type `GetCashInHandByLocationVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetCashInHandByLocationVariables {
  location: string;
}
```
### Return Type
Recall that calling the `GetCashInHandByLocation` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetCashInHandByLocation` Query is of type `GetCashInHandByLocationData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetCashInHandByLocationData {
  cashInHands: ({
    id: string;
    location?: string | null;
    balance?: number | null;
    lastUpdated?: string | null;
    updatedBy?: string | null;
  } & CashInHand_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetCashInHandByLocation`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetCashInHandByLocationVariables } from '@dataconnect/generated';
import { useGetCashInHandByLocation } from '@dataconnect/generated/react'

export default function GetCashInHandByLocationComponent() {
  // The `useGetCashInHandByLocation` Query hook requires an argument of type `GetCashInHandByLocationVariables`:
  const getCashInHandByLocationVars: GetCashInHandByLocationVariables = {
    location: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetCashInHandByLocation(getCashInHandByLocationVars);
  // Variables can be defined inline as well.
  const query = useGetCashInHandByLocation({ location: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetCashInHandByLocation(dataConnect, getCashInHandByLocationVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetCashInHandByLocation(getCashInHandByLocationVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetCashInHandByLocation(dataConnect, getCashInHandByLocationVars, options);

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

## GetCashInHandById
You can execute the `GetCashInHandById` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetCashInHandById(dc: DataConnect, vars: GetCashInHandByIdVariables, options?: useDataConnectQueryOptions<GetCashInHandByIdData>): UseDataConnectQueryResult<GetCashInHandByIdData, GetCashInHandByIdVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetCashInHandById(vars: GetCashInHandByIdVariables, options?: useDataConnectQueryOptions<GetCashInHandByIdData>): UseDataConnectQueryResult<GetCashInHandByIdData, GetCashInHandByIdVariables>;
```

### Variables
The `GetCashInHandById` Query requires an argument of type `GetCashInHandByIdVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetCashInHandByIdVariables {
  id: string;
}
```
### Return Type
Recall that calling the `GetCashInHandById` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetCashInHandById` Query is of type `GetCashInHandByIdData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetCashInHandByIdData {
  cashInHand?: {
    id: string;
    location?: string | null;
    balance?: number | null;
    lastUpdated?: string | null;
    updatedBy?: string | null;
  } & CashInHand_Key;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetCashInHandById`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetCashInHandByIdVariables } from '@dataconnect/generated';
import { useGetCashInHandById } from '@dataconnect/generated/react'

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

## GetBankTransfers
You can execute the `GetBankTransfers` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetBankTransfers(dc: DataConnect, options?: useDataConnectQueryOptions<GetBankTransfersData>): UseDataConnectQueryResult<GetBankTransfersData, undefined>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetBankTransfers(options?: useDataConnectQueryOptions<GetBankTransfersData>): UseDataConnectQueryResult<GetBankTransfersData, undefined>;
```

### Variables
The `GetBankTransfers` Query has no variables.
### Return Type
Recall that calling the `GetBankTransfers` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetBankTransfers` Query is of type `GetBankTransfersData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetBankTransfersData {
  bankTransfers: ({
    id: string;
    date?: string | null;
    fromBankId?: string | null;
    fromBankName?: string | null;
    toBankId?: string | null;
    toBankName?: string | null;
    amount?: number | null;
    note?: string | null;
    createdAt?: string | null;
  } & BankTransfer_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetBankTransfers`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';
import { useGetBankTransfers } from '@dataconnect/generated/react'

export default function GetBankTransfersComponent() {
  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetBankTransfers();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetBankTransfers(dataConnect);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetBankTransfers(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetBankTransfers(dataConnect, options);

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

## GetBankTransfersByBank
You can execute the `GetBankTransfersByBank` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetBankTransfersByBank(dc: DataConnect, vars: GetBankTransfersByBankVariables, options?: useDataConnectQueryOptions<GetBankTransfersByBankData>): UseDataConnectQueryResult<GetBankTransfersByBankData, GetBankTransfersByBankVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetBankTransfersByBank(vars: GetBankTransfersByBankVariables, options?: useDataConnectQueryOptions<GetBankTransfersByBankData>): UseDataConnectQueryResult<GetBankTransfersByBankData, GetBankTransfersByBankVariables>;
```

### Variables
The `GetBankTransfersByBank` Query requires an argument of type `GetBankTransfersByBankVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetBankTransfersByBankVariables {
  bankId: string;
}
```
### Return Type
Recall that calling the `GetBankTransfersByBank` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetBankTransfersByBank` Query is of type `GetBankTransfersByBankData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetBankTransfersByBankData {
  bankTransfers: ({
    id: string;
    date?: string | null;
    fromBankId?: string | null;
    fromBankName?: string | null;
    toBankId?: string | null;
    toBankName?: string | null;
    amount?: number | null;
    note?: string | null;
    createdAt?: string | null;
  } & BankTransfer_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetBankTransfersByBank`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetBankTransfersByBankVariables } from '@dataconnect/generated';
import { useGetBankTransfersByBank } from '@dataconnect/generated/react'

export default function GetBankTransfersByBankComponent() {
  // The `useGetBankTransfersByBank` Query hook requires an argument of type `GetBankTransfersByBankVariables`:
  const getBankTransfersByBankVars: GetBankTransfersByBankVariables = {
    bankId: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetBankTransfersByBank(getBankTransfersByBankVars);
  // Variables can be defined inline as well.
  const query = useGetBankTransfersByBank({ bankId: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetBankTransfersByBank(dataConnect, getBankTransfersByBankVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetBankTransfersByBank(getBankTransfersByBankVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetBankTransfersByBank(dataConnect, getBankTransfersByBankVars, options);

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

Below are examples of how to use the `example` connector's generated Mutation hook functions to execute each Mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#operations-react-angular).

## CreateEmployee
You can execute the `CreateEmployee` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useCreateEmployee(options?: useDataConnectMutationOptions<CreateEmployeeData, FirebaseError, CreateEmployeeVariables>): UseDataConnectMutationResult<CreateEmployeeData, CreateEmployeeVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useCreateEmployee(dc: DataConnect, options?: useDataConnectMutationOptions<CreateEmployeeData, FirebaseError, CreateEmployeeVariables>): UseDataConnectMutationResult<CreateEmployeeData, CreateEmployeeVariables>;
```

### Variables
The `CreateEmployee` Mutation requires an argument of type `CreateEmployeeVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface CreateEmployeeVariables {
  id: string;
  name?: string | null;
  position?: string | null;
  salary?: number | null;
  phone?: string | null;
  email?: string | null;
  joinDate?: string | null;
  status?: string | null;
  location?: string | null;
  accountNumber?: string | null;
  bankName?: string | null;
  accountTitle?: string | null;
}
```
### Return Type
Recall that calling the `CreateEmployee` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `CreateEmployee` Mutation is of type `CreateEmployeeData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface CreateEmployeeData {
  employee_insert: Employee_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `CreateEmployee`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, CreateEmployeeVariables } from '@dataconnect/generated';
import { useCreateEmployee } from '@dataconnect/generated/react'

export default function CreateEmployeeComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useCreateEmployee();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useCreateEmployee(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateEmployee(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateEmployee(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useCreateEmployee` Mutation requires an argument of type `CreateEmployeeVariables`:
  const createEmployeeVars: CreateEmployeeVariables = {
    id: ..., 
    name: ..., // optional
    position: ..., // optional
    salary: ..., // optional
    phone: ..., // optional
    email: ..., // optional
    joinDate: ..., // optional
    status: ..., // optional
    location: ..., // optional
    accountNumber: ..., // optional
    bankName: ..., // optional
    accountTitle: ..., // optional
  };
  mutation.mutate(createEmployeeVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., name: ..., position: ..., salary: ..., phone: ..., email: ..., joinDate: ..., status: ..., location: ..., accountNumber: ..., bankName: ..., accountTitle: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(createEmployeeVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.employee_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpdateEmployee
You can execute the `UpdateEmployee` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useUpdateEmployee(options?: useDataConnectMutationOptions<UpdateEmployeeData, FirebaseError, UpdateEmployeeVariables>): UseDataConnectMutationResult<UpdateEmployeeData, UpdateEmployeeVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpdateEmployee(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateEmployeeData, FirebaseError, UpdateEmployeeVariables>): UseDataConnectMutationResult<UpdateEmployeeData, UpdateEmployeeVariables>;
```

### Variables
The `UpdateEmployee` Mutation requires an argument of type `UpdateEmployeeVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpdateEmployeeVariables {
  id: string;
  name?: string | null;
  position?: string | null;
  salary?: number | null;
  phone?: string | null;
  email?: string | null;
  joinDate?: string | null;
  status?: string | null;
  location?: string | null;
  accountNumber?: string | null;
  bankName?: string | null;
  accountTitle?: string | null;
}
```
### Return Type
Recall that calling the `UpdateEmployee` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpdateEmployee` Mutation is of type `UpdateEmployeeData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpdateEmployeeData {
  employee_update?: Employee_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpdateEmployee`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpdateEmployeeVariables } from '@dataconnect/generated';
import { useUpdateEmployee } from '@dataconnect/generated/react'

export default function UpdateEmployeeComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpdateEmployee();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpdateEmployee(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateEmployee(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateEmployee(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpdateEmployee` Mutation requires an argument of type `UpdateEmployeeVariables`:
  const updateEmployeeVars: UpdateEmployeeVariables = {
    id: ..., 
    name: ..., // optional
    position: ..., // optional
    salary: ..., // optional
    phone: ..., // optional
    email: ..., // optional
    joinDate: ..., // optional
    status: ..., // optional
    location: ..., // optional
    accountNumber: ..., // optional
    bankName: ..., // optional
    accountTitle: ..., // optional
  };
  mutation.mutate(updateEmployeeVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., name: ..., position: ..., salary: ..., phone: ..., email: ..., joinDate: ..., status: ..., location: ..., accountNumber: ..., bankName: ..., accountTitle: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(updateEmployeeVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.employee_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## DeleteEmployee
You can execute the `DeleteEmployee` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useDeleteEmployee(options?: useDataConnectMutationOptions<DeleteEmployeeData, FirebaseError, DeleteEmployeeVariables>): UseDataConnectMutationResult<DeleteEmployeeData, DeleteEmployeeVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useDeleteEmployee(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteEmployeeData, FirebaseError, DeleteEmployeeVariables>): UseDataConnectMutationResult<DeleteEmployeeData, DeleteEmployeeVariables>;
```

### Variables
The `DeleteEmployee` Mutation requires an argument of type `DeleteEmployeeVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface DeleteEmployeeVariables {
  id: string;
}
```
### Return Type
Recall that calling the `DeleteEmployee` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `DeleteEmployee` Mutation is of type `DeleteEmployeeData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface DeleteEmployeeData {
  employee_delete?: Employee_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `DeleteEmployee`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, DeleteEmployeeVariables } from '@dataconnect/generated';
import { useDeleteEmployee } from '@dataconnect/generated/react'

export default function DeleteEmployeeComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useDeleteEmployee();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useDeleteEmployee(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useDeleteEmployee(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useDeleteEmployee(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useDeleteEmployee` Mutation requires an argument of type `DeleteEmployeeVariables`:
  const deleteEmployeeVars: DeleteEmployeeVariables = {
    id: ..., 
  };
  mutation.mutate(deleteEmployeeVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(deleteEmployeeVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.employee_delete);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## CreateBank
You can execute the `CreateBank` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useCreateBank(options?: useDataConnectMutationOptions<CreateBankData, FirebaseError, CreateBankVariables>): UseDataConnectMutationResult<CreateBankData, CreateBankVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useCreateBank(dc: DataConnect, options?: useDataConnectMutationOptions<CreateBankData, FirebaseError, CreateBankVariables>): UseDataConnectMutationResult<CreateBankData, CreateBankVariables>;
```

### Variables
The `CreateBank` Mutation requires an argument of type `CreateBankVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface CreateBankVariables {
  id: string;
  name?: string | null;
  accountNumber?: string | null;
  balance?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}
```
### Return Type
Recall that calling the `CreateBank` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `CreateBank` Mutation is of type `CreateBankData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface CreateBankData {
  bank_insert: Bank_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `CreateBank`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, CreateBankVariables } from '@dataconnect/generated';
import { useCreateBank } from '@dataconnect/generated/react'

export default function CreateBankComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useCreateBank();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useCreateBank(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateBank(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateBank(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useCreateBank` Mutation requires an argument of type `CreateBankVariables`:
  const createBankVars: CreateBankVariables = {
    id: ..., 
    name: ..., // optional
    accountNumber: ..., // optional
    balance: ..., // optional
    createdAt: ..., // optional
    updatedAt: ..., // optional
  };
  mutation.mutate(createBankVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., name: ..., accountNumber: ..., balance: ..., createdAt: ..., updatedAt: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(createBankVars, options);

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

## UpdateBank
You can execute the `UpdateBank` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useUpdateBank(options?: useDataConnectMutationOptions<UpdateBankData, FirebaseError, UpdateBankVariables>): UseDataConnectMutationResult<UpdateBankData, UpdateBankVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpdateBank(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateBankData, FirebaseError, UpdateBankVariables>): UseDataConnectMutationResult<UpdateBankData, UpdateBankVariables>;
```

### Variables
The `UpdateBank` Mutation requires an argument of type `UpdateBankVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpdateBankVariables {
  id: string;
  name?: string | null;
  accountNumber?: string | null;
  balance?: number | null;
  updatedAt?: string | null;
}
```
### Return Type
Recall that calling the `UpdateBank` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpdateBank` Mutation is of type `UpdateBankData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpdateBankData {
  bank_update?: Bank_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpdateBank`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpdateBankVariables } from '@dataconnect/generated';
import { useUpdateBank } from '@dataconnect/generated/react'

export default function UpdateBankComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpdateBank();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpdateBank(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateBank(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateBank(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpdateBank` Mutation requires an argument of type `UpdateBankVariables`:
  const updateBankVars: UpdateBankVariables = {
    id: ..., 
    name: ..., // optional
    accountNumber: ..., // optional
    balance: ..., // optional
    updatedAt: ..., // optional
  };
  mutation.mutate(updateBankVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., name: ..., accountNumber: ..., balance: ..., updatedAt: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(updateBankVars, options);

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

## DeleteBank
You can execute the `DeleteBank` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useDeleteBank(options?: useDataConnectMutationOptions<DeleteBankData, FirebaseError, DeleteBankVariables>): UseDataConnectMutationResult<DeleteBankData, DeleteBankVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useDeleteBank(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteBankData, FirebaseError, DeleteBankVariables>): UseDataConnectMutationResult<DeleteBankData, DeleteBankVariables>;
```

### Variables
The `DeleteBank` Mutation requires an argument of type `DeleteBankVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface DeleteBankVariables {
  id: string;
}
```
### Return Type
Recall that calling the `DeleteBank` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `DeleteBank` Mutation is of type `DeleteBankData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface DeleteBankData {
  bank_delete?: Bank_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `DeleteBank`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, DeleteBankVariables } from '@dataconnect/generated';
import { useDeleteBank } from '@dataconnect/generated/react'

export default function DeleteBankComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useDeleteBank();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useDeleteBank(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useDeleteBank(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useDeleteBank(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useDeleteBank` Mutation requires an argument of type `DeleteBankVariables`:
  const deleteBankVars: DeleteBankVariables = {
    id: ..., 
  };
  mutation.mutate(deleteBankVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(deleteBankVars, options);

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

## CreateCashInHand
You can execute the `CreateCashInHand` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useCreateCashInHand(options?: useDataConnectMutationOptions<CreateCashInHandData, FirebaseError, CreateCashInHandVariables>): UseDataConnectMutationResult<CreateCashInHandData, CreateCashInHandVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useCreateCashInHand(dc: DataConnect, options?: useDataConnectMutationOptions<CreateCashInHandData, FirebaseError, CreateCashInHandVariables>): UseDataConnectMutationResult<CreateCashInHandData, CreateCashInHandVariables>;
```

### Variables
The `CreateCashInHand` Mutation requires an argument of type `CreateCashInHandVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface CreateCashInHandVariables {
  id: string;
  location?: string | null;
  balance?: number | null;
  lastUpdated?: string | null;
  updatedBy?: string | null;
}
```
### Return Type
Recall that calling the `CreateCashInHand` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `CreateCashInHand` Mutation is of type `CreateCashInHandData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface CreateCashInHandData {
  cashInHand_insert: CashInHand_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `CreateCashInHand`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, CreateCashInHandVariables } from '@dataconnect/generated';
import { useCreateCashInHand } from '@dataconnect/generated/react'

export default function CreateCashInHandComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useCreateCashInHand();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useCreateCashInHand(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateCashInHand(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateCashInHand(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useCreateCashInHand` Mutation requires an argument of type `CreateCashInHandVariables`:
  const createCashInHandVars: CreateCashInHandVariables = {
    id: ..., 
    location: ..., // optional
    balance: ..., // optional
    lastUpdated: ..., // optional
    updatedBy: ..., // optional
  };
  mutation.mutate(createCashInHandVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., location: ..., balance: ..., lastUpdated: ..., updatedBy: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(createCashInHandVars, options);

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

## UpdateCashInHand
You can execute the `UpdateCashInHand` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useUpdateCashInHand(options?: useDataConnectMutationOptions<UpdateCashInHandData, FirebaseError, UpdateCashInHandVariables>): UseDataConnectMutationResult<UpdateCashInHandData, UpdateCashInHandVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpdateCashInHand(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateCashInHandData, FirebaseError, UpdateCashInHandVariables>): UseDataConnectMutationResult<UpdateCashInHandData, UpdateCashInHandVariables>;
```

### Variables
The `UpdateCashInHand` Mutation requires an argument of type `UpdateCashInHandVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpdateCashInHandVariables {
  id: string;
  balance?: number | null;
  lastUpdated?: string | null;
  updatedBy?: string | null;
}
```
### Return Type
Recall that calling the `UpdateCashInHand` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpdateCashInHand` Mutation is of type `UpdateCashInHandData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpdateCashInHandData {
  cashInHand_update?: CashInHand_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpdateCashInHand`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpdateCashInHandVariables } from '@dataconnect/generated';
import { useUpdateCashInHand } from '@dataconnect/generated/react'

export default function UpdateCashInHandComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpdateCashInHand();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpdateCashInHand(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateCashInHand(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateCashInHand(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpdateCashInHand` Mutation requires an argument of type `UpdateCashInHandVariables`:
  const updateCashInHandVars: UpdateCashInHandVariables = {
    id: ..., 
    balance: ..., // optional
    lastUpdated: ..., // optional
    updatedBy: ..., // optional
  };
  mutation.mutate(updateCashInHandVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., balance: ..., lastUpdated: ..., updatedBy: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(updateCashInHandVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.cashInHand_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## DeleteCashInHand
You can execute the `DeleteCashInHand` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useDeleteCashInHand(options?: useDataConnectMutationOptions<DeleteCashInHandData, FirebaseError, DeleteCashInHandVariables>): UseDataConnectMutationResult<DeleteCashInHandData, DeleteCashInHandVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useDeleteCashInHand(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteCashInHandData, FirebaseError, DeleteCashInHandVariables>): UseDataConnectMutationResult<DeleteCashInHandData, DeleteCashInHandVariables>;
```

### Variables
The `DeleteCashInHand` Mutation requires an argument of type `DeleteCashInHandVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface DeleteCashInHandVariables {
  id: string;
}
```
### Return Type
Recall that calling the `DeleteCashInHand` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `DeleteCashInHand` Mutation is of type `DeleteCashInHandData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface DeleteCashInHandData {
  cashInHand_delete?: CashInHand_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `DeleteCashInHand`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, DeleteCashInHandVariables } from '@dataconnect/generated';
import { useDeleteCashInHand } from '@dataconnect/generated/react'

export default function DeleteCashInHandComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useDeleteCashInHand();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useDeleteCashInHand(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useDeleteCashInHand(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useDeleteCashInHand(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useDeleteCashInHand` Mutation requires an argument of type `DeleteCashInHandVariables`:
  const deleteCashInHandVars: DeleteCashInHandVariables = {
    id: ..., 
  };
  mutation.mutate(deleteCashInHandVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(deleteCashInHandVars, options);

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

## CreateBankTransfer
You can execute the `CreateBankTransfer` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useCreateBankTransfer(options?: useDataConnectMutationOptions<CreateBankTransferData, FirebaseError, CreateBankTransferVariables>): UseDataConnectMutationResult<CreateBankTransferData, CreateBankTransferVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useCreateBankTransfer(dc: DataConnect, options?: useDataConnectMutationOptions<CreateBankTransferData, FirebaseError, CreateBankTransferVariables>): UseDataConnectMutationResult<CreateBankTransferData, CreateBankTransferVariables>;
```

### Variables
The `CreateBankTransfer` Mutation requires an argument of type `CreateBankTransferVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface CreateBankTransferVariables {
  id: string;
  date?: string | null;
  fromBankId?: string | null;
  fromBankName?: string | null;
  toBankId?: string | null;
  toBankName?: string | null;
  amount?: number | null;
  note?: string | null;
  createdAt?: string | null;
}
```
### Return Type
Recall that calling the `CreateBankTransfer` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `CreateBankTransfer` Mutation is of type `CreateBankTransferData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface CreateBankTransferData {
  bankTransfer_insert: BankTransfer_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `CreateBankTransfer`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, CreateBankTransferVariables } from '@dataconnect/generated';
import { useCreateBankTransfer } from '@dataconnect/generated/react'

export default function CreateBankTransferComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useCreateBankTransfer();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useCreateBankTransfer(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateBankTransfer(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateBankTransfer(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useCreateBankTransfer` Mutation requires an argument of type `CreateBankTransferVariables`:
  const createBankTransferVars: CreateBankTransferVariables = {
    id: ..., 
    date: ..., // optional
    fromBankId: ..., // optional
    fromBankName: ..., // optional
    toBankId: ..., // optional
    toBankName: ..., // optional
    amount: ..., // optional
    note: ..., // optional
    createdAt: ..., // optional
  };
  mutation.mutate(createBankTransferVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., date: ..., fromBankId: ..., fromBankName: ..., toBankId: ..., toBankName: ..., amount: ..., note: ..., createdAt: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(createBankTransferVars, options);

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

## DeleteBankTransfer
You can execute the `DeleteBankTransfer` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useDeleteBankTransfer(options?: useDataConnectMutationOptions<DeleteBankTransferData, FirebaseError, DeleteBankTransferVariables>): UseDataConnectMutationResult<DeleteBankTransferData, DeleteBankTransferVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useDeleteBankTransfer(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteBankTransferData, FirebaseError, DeleteBankTransferVariables>): UseDataConnectMutationResult<DeleteBankTransferData, DeleteBankTransferVariables>;
```

### Variables
The `DeleteBankTransfer` Mutation requires an argument of type `DeleteBankTransferVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface DeleteBankTransferVariables {
  id: string;
}
```
### Return Type
Recall that calling the `DeleteBankTransfer` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `DeleteBankTransfer` Mutation is of type `DeleteBankTransferData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface DeleteBankTransferData {
  bankTransfer_delete?: BankTransfer_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `DeleteBankTransfer`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, DeleteBankTransferVariables } from '@dataconnect/generated';
import { useDeleteBankTransfer } from '@dataconnect/generated/react'

export default function DeleteBankTransferComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useDeleteBankTransfer();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useDeleteBankTransfer(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useDeleteBankTransfer(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useDeleteBankTransfer(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useDeleteBankTransfer` Mutation requires an argument of type `DeleteBankTransferVariables`:
  const deleteBankTransferVars: DeleteBankTransferVariables = {
    id: ..., 
  };
  mutation.mutate(deleteBankTransferVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(deleteBankTransferVars, options);

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

