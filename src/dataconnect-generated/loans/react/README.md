# Generated React README
This README will guide you through the process of using the generated React SDK package for the connector `loans`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `JavaScript README`, you can find it at [`loans/README.md`](../README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

You can use this generated SDK by importing from the package `@erp-system/loans/react` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#react).

# Table of Contents
- [**Overview**](#generated-react-readme)
- [**TanStack Query Firebase & TanStack React Query**](#tanstack-query-firebase-tanstack-react-query)
  - [*Package Installation*](#installing-tanstack-query-firebase-and-tanstack-react-query-packages)
  - [*Configuring TanStack Query*](#configuring-tanstack-query)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*listLoans*](#listloans)
  - [*getLoanById*](#getloanbyid)
  - [*listLoanPayments*](#listloanpayments)
  - [*getLoanPaymentById*](#getloanpaymentbyid)
- [**Mutations**](#mutations)
  - [*createLoan*](#createloan)
  - [*createLoanPayment*](#createloanpayment)

# TanStack Query Firebase & TanStack React Query
This SDK provides [React](https://react.dev/) hooks generated specific to your application, for the operations found in the connector `loans`. These hooks are generated using [TanStack Query Firebase](https://react-query-firebase.invertase.dev/) by our partners at Invertase, a library built on top of [TanStack React Query v5](https://tanstack.com/query/v5/docs/framework/react/overview).

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
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `loans`.

You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@erp-system/loans';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#emulator-react-angular).

```javascript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@erp-system/loans';

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

Below are examples of how to use the `loans` connector's generated Query hook functions to execute each Query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#operations-react-angular).

## listLoans
You can execute the `listLoans` Query using the following Query hook function, which is defined in [loans/react/index.d.ts](./index.d.ts):

```javascript
useListLoans(dc: DataConnect, vars?: ListLoansVariables, options?: useDataConnectQueryOptions<ListLoansData>): UseDataConnectQueryResult<ListLoansData, ListLoansVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListLoans(vars?: ListLoansVariables, options?: useDataConnectQueryOptions<ListLoansData>): UseDataConnectQueryResult<ListLoansData, ListLoansVariables>;
```

### Variables
The `listLoans` Query has an optional argument of type `ListLoansVariables`, which is defined in [loans/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListLoansVariables {
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that calling the `listLoans` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `listLoans` Query is of type `ListLoansData`, which is defined in [loans/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListLoansData {
  loans: ({
    id: string;
    lenderName?: string | null;
    borrowerName?: string | null;
    totalAmount: number;
    paid: number;
    remaining: number;
    loanDate: string;
    dueDate?: string | null;
    type: string;
    category: string;
    status: string;
    notes?: string | null;
    bankId?: string | null;
    bankName?: string | null;
    employeeId?: string | null;
    employeeName?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  } & Loan_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `listLoans`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListLoansVariables } from '@erp-system/loans';
import { useListLoans } from '@erp-system/loans/react'

export default function ListLoansComponent() {
  // The `useListLoans` Query hook has an optional argument of type `ListLoansVariables`:
  const listLoansVars: ListLoansVariables = {
    limit: ..., // optional
    offset: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListLoans(listLoansVars);
  // Variables can be defined inline as well.
  const query = useListLoans({ limit: ..., offset: ..., });
  // Since all variables are optional for this Query, you can omit the `ListLoansVariables` argument.
  // (as long as you don't want to provide any `options`!)
  const query = useListLoans();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListLoans(dataConnect, listLoansVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListLoans(listLoansVars, options);
  // If you'd like to provide options without providing any variables, you must
  // pass `undefined` where you would normally pass the variables.
  const query = useListLoans(undefined, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListLoans(dataConnect, listLoansVars /** or undefined */, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.loans);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## getLoanById
You can execute the `getLoanById` Query using the following Query hook function, which is defined in [loans/react/index.d.ts](./index.d.ts):

```javascript
useGetLoanById(dc: DataConnect, vars: GetLoanByIdVariables, options?: useDataConnectQueryOptions<GetLoanByIdData>): UseDataConnectQueryResult<GetLoanByIdData, GetLoanByIdVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetLoanById(vars: GetLoanByIdVariables, options?: useDataConnectQueryOptions<GetLoanByIdData>): UseDataConnectQueryResult<GetLoanByIdData, GetLoanByIdVariables>;
```

### Variables
The `getLoanById` Query requires an argument of type `GetLoanByIdVariables`, which is defined in [loans/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetLoanByIdVariables {
  id: string;
}
```
### Return Type
Recall that calling the `getLoanById` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `getLoanById` Query is of type `GetLoanByIdData`, which is defined in [loans/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetLoanByIdData {
  loan?: {
    id: string;
    lenderName?: string | null;
    borrowerName?: string | null;
    totalAmount: number;
    paid: number;
    remaining: number;
    loanDate: string;
    dueDate?: string | null;
    type: string;
    category: string;
    status: string;
    notes?: string | null;
    bankId?: string | null;
    bankName?: string | null;
    employeeId?: string | null;
    employeeName?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  } & Loan_Key;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `getLoanById`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetLoanByIdVariables } from '@erp-system/loans';
import { useGetLoanById } from '@erp-system/loans/react'

export default function GetLoanByIdComponent() {
  // The `useGetLoanById` Query hook requires an argument of type `GetLoanByIdVariables`:
  const getLoanByIdVars: GetLoanByIdVariables = {
    id: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetLoanById(getLoanByIdVars);
  // Variables can be defined inline as well.
  const query = useGetLoanById({ id: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetLoanById(dataConnect, getLoanByIdVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetLoanById(getLoanByIdVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetLoanById(dataConnect, getLoanByIdVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.loan);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## listLoanPayments
You can execute the `listLoanPayments` Query using the following Query hook function, which is defined in [loans/react/index.d.ts](./index.d.ts):

```javascript
useListLoanPayments(dc: DataConnect, vars?: ListLoanPaymentsVariables, options?: useDataConnectQueryOptions<ListLoanPaymentsData>): UseDataConnectQueryResult<ListLoanPaymentsData, ListLoanPaymentsVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListLoanPayments(vars?: ListLoanPaymentsVariables, options?: useDataConnectQueryOptions<ListLoanPaymentsData>): UseDataConnectQueryResult<ListLoanPaymentsData, ListLoanPaymentsVariables>;
```

### Variables
The `listLoanPayments` Query has an optional argument of type `ListLoanPaymentsVariables`, which is defined in [loans/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListLoanPaymentsVariables {
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that calling the `listLoanPayments` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `listLoanPayments` Query is of type `ListLoanPaymentsData`, which is defined in [loans/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListLoanPaymentsData {
  loanPayments: ({
    id: string;
    loanId: string;
    amount: number;
    mode: string;
    date: string;
    bankId?: string | null;
    bankName?: string | null;
    notes?: string | null;
    createdAt?: string | null;
  } & LoanPayment_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `listLoanPayments`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListLoanPaymentsVariables } from '@erp-system/loans';
import { useListLoanPayments } from '@erp-system/loans/react'

export default function ListLoanPaymentsComponent() {
  // The `useListLoanPayments` Query hook has an optional argument of type `ListLoanPaymentsVariables`:
  const listLoanPaymentsVars: ListLoanPaymentsVariables = {
    limit: ..., // optional
    offset: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListLoanPayments(listLoanPaymentsVars);
  // Variables can be defined inline as well.
  const query = useListLoanPayments({ limit: ..., offset: ..., });
  // Since all variables are optional for this Query, you can omit the `ListLoanPaymentsVariables` argument.
  // (as long as you don't want to provide any `options`!)
  const query = useListLoanPayments();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListLoanPayments(dataConnect, listLoanPaymentsVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListLoanPayments(listLoanPaymentsVars, options);
  // If you'd like to provide options without providing any variables, you must
  // pass `undefined` where you would normally pass the variables.
  const query = useListLoanPayments(undefined, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListLoanPayments(dataConnect, listLoanPaymentsVars /** or undefined */, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.loanPayments);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## getLoanPaymentById
You can execute the `getLoanPaymentById` Query using the following Query hook function, which is defined in [loans/react/index.d.ts](./index.d.ts):

```javascript
useGetLoanPaymentById(dc: DataConnect, vars: GetLoanPaymentByIdVariables, options?: useDataConnectQueryOptions<GetLoanPaymentByIdData>): UseDataConnectQueryResult<GetLoanPaymentByIdData, GetLoanPaymentByIdVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetLoanPaymentById(vars: GetLoanPaymentByIdVariables, options?: useDataConnectQueryOptions<GetLoanPaymentByIdData>): UseDataConnectQueryResult<GetLoanPaymentByIdData, GetLoanPaymentByIdVariables>;
```

### Variables
The `getLoanPaymentById` Query requires an argument of type `GetLoanPaymentByIdVariables`, which is defined in [loans/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetLoanPaymentByIdVariables {
  id: string;
}
```
### Return Type
Recall that calling the `getLoanPaymentById` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `getLoanPaymentById` Query is of type `GetLoanPaymentByIdData`, which is defined in [loans/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetLoanPaymentByIdData {
  loanPayment?: {
    id: string;
    loanId: string;
    amount: number;
    mode: string;
    date: string;
    bankId?: string | null;
    bankName?: string | null;
    notes?: string | null;
    createdAt?: string | null;
  } & LoanPayment_Key;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `getLoanPaymentById`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetLoanPaymentByIdVariables } from '@erp-system/loans';
import { useGetLoanPaymentById } from '@erp-system/loans/react'

export default function GetLoanPaymentByIdComponent() {
  // The `useGetLoanPaymentById` Query hook requires an argument of type `GetLoanPaymentByIdVariables`:
  const getLoanPaymentByIdVars: GetLoanPaymentByIdVariables = {
    id: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetLoanPaymentById(getLoanPaymentByIdVars);
  // Variables can be defined inline as well.
  const query = useGetLoanPaymentById({ id: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetLoanPaymentById(dataConnect, getLoanPaymentByIdVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetLoanPaymentById(getLoanPaymentByIdVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetLoanPaymentById(dataConnect, getLoanPaymentByIdVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.loanPayment);
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

Below are examples of how to use the `loans` connector's generated Mutation hook functions to execute each Mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#operations-react-angular).

## createLoan
You can execute the `createLoan` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [loans/react/index.d.ts](./index.d.ts)):
```javascript
useCreateLoan(options?: useDataConnectMutationOptions<CreateLoanData, FirebaseError, CreateLoanVariables>): UseDataConnectMutationResult<CreateLoanData, CreateLoanVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useCreateLoan(dc: DataConnect, options?: useDataConnectMutationOptions<CreateLoanData, FirebaseError, CreateLoanVariables>): UseDataConnectMutationResult<CreateLoanData, CreateLoanVariables>;
```

### Variables
The `createLoan` Mutation requires an argument of type `CreateLoanVariables`, which is defined in [loans/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface CreateLoanVariables {
  id: string;
  lenderName?: string | null;
  borrowerName?: string | null;
  totalAmount: number;
  paid: number;
  remaining: number;
  loanDate: string;
  dueDate?: string | null;
  type: string;
  category: string;
  status: string;
  notes?: string | null;
  bankId?: string | null;
  bankName?: string | null;
  employeeId?: string | null;
}
```
### Return Type
Recall that calling the `createLoan` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `createLoan` Mutation is of type `CreateLoanData`, which is defined in [loans/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface CreateLoanData {
  loan_insert: Loan_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `createLoan`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, CreateLoanVariables } from '@erp-system/loans';
import { useCreateLoan } from '@erp-system/loans/react'

export default function CreateLoanComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useCreateLoan();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useCreateLoan(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateLoan(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateLoan(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useCreateLoan` Mutation requires an argument of type `CreateLoanVariables`:
  const createLoanVars: CreateLoanVariables = {
    id: ..., 
    lenderName: ..., // optional
    borrowerName: ..., // optional
    totalAmount: ..., 
    paid: ..., 
    remaining: ..., 
    loanDate: ..., 
    dueDate: ..., // optional
    type: ..., 
    category: ..., 
    status: ..., 
    notes: ..., // optional
    bankId: ..., // optional
    bankName: ..., // optional
    employeeId: ..., // optional
  };
  mutation.mutate(createLoanVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., lenderName: ..., borrowerName: ..., totalAmount: ..., paid: ..., remaining: ..., loanDate: ..., dueDate: ..., type: ..., category: ..., status: ..., notes: ..., bankId: ..., bankName: ..., employeeId: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(createLoanVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.loan_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## createLoanPayment
You can execute the `createLoanPayment` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [loans/react/index.d.ts](./index.d.ts)):
```javascript
useCreateLoanPayment(options?: useDataConnectMutationOptions<CreateLoanPaymentData, FirebaseError, CreateLoanPaymentVariables>): UseDataConnectMutationResult<CreateLoanPaymentData, CreateLoanPaymentVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useCreateLoanPayment(dc: DataConnect, options?: useDataConnectMutationOptions<CreateLoanPaymentData, FirebaseError, CreateLoanPaymentVariables>): UseDataConnectMutationResult<CreateLoanPaymentData, CreateLoanPaymentVariables>;
```

### Variables
The `createLoanPayment` Mutation requires an argument of type `CreateLoanPaymentVariables`, which is defined in [loans/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface CreateLoanPaymentVariables {
  id: string;
  loanId: string;
  amount: number;
  mode: string;
  date: string;
  bankId?: string | null;
  bankName?: string | null;
}
```
### Return Type
Recall that calling the `createLoanPayment` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `createLoanPayment` Mutation is of type `CreateLoanPaymentData`, which is defined in [loans/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface CreateLoanPaymentData {
  loanPayment_insert: LoanPayment_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `createLoanPayment`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, CreateLoanPaymentVariables } from '@erp-system/loans';
import { useCreateLoanPayment } from '@erp-system/loans/react'

export default function CreateLoanPaymentComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useCreateLoanPayment();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useCreateLoanPayment(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateLoanPayment(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateLoanPayment(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useCreateLoanPayment` Mutation requires an argument of type `CreateLoanPaymentVariables`:
  const createLoanPaymentVars: CreateLoanPaymentVariables = {
    id: ..., 
    loanId: ..., 
    amount: ..., 
    mode: ..., 
    date: ..., 
    bankId: ..., // optional
    bankName: ..., // optional
  };
  mutation.mutate(createLoanPaymentVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., loanId: ..., amount: ..., mode: ..., date: ..., bankId: ..., bankName: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(createLoanPaymentVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.loanPayment_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

