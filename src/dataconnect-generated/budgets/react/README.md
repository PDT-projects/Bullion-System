# Generated React README
This README will guide you through the process of using the generated React SDK package for the connector `budgets`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `JavaScript README`, you can find it at [`budgets/README.md`](../README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

You can use this generated SDK by importing from the package `@erp-system/budgets/react` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#react).

# Table of Contents
- [**Overview**](#generated-react-readme)
- [**TanStack Query Firebase & TanStack React Query**](#tanstack-query-firebase-tanstack-react-query)
  - [*Package Installation*](#installing-tanstack-query-firebase-and-tanstack-react-query-packages)
  - [*Configuring TanStack Query*](#configuring-tanstack-query)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*listBudgets*](#listbudgets)
  - [*getBudgetById*](#getbudgetbyid)
- [**Mutations**](#mutations)
  - [*budgetInsert*](#budgetinsert)
  - [*budgetUpdate*](#budgetupdate)
  - [*budgetDelete*](#budgetdelete)
  - [*budgetUpdateSpent*](#budgetupdatespent)

# TanStack Query Firebase & TanStack React Query
This SDK provides [React](https://react.dev/) hooks generated specific to your application, for the operations found in the connector `budgets`. These hooks are generated using [TanStack Query Firebase](https://react-query-firebase.invertase.dev/) by our partners at Invertase, a library built on top of [TanStack React Query v5](https://tanstack.com/query/v5/docs/framework/react/overview).

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
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `budgets`.

You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@erp-system/budgets';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#emulator-react-angular).

```javascript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@erp-system/budgets';

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

Below are examples of how to use the `budgets` connector's generated Query hook functions to execute each Query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#operations-react-angular).

## listBudgets
You can execute the `listBudgets` Query using the following Query hook function, which is defined in [budgets/react/index.d.ts](./index.d.ts):

```javascript
useListBudgets(dc: DataConnect, vars?: ListBudgetsVariables, options?: useDataConnectQueryOptions<ListBudgetsData>): UseDataConnectQueryResult<ListBudgetsData, ListBudgetsVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListBudgets(vars?: ListBudgetsVariables, options?: useDataConnectQueryOptions<ListBudgetsData>): UseDataConnectQueryResult<ListBudgetsData, ListBudgetsVariables>;
```

### Variables
The `listBudgets` Query has an optional argument of type `ListBudgetsVariables`, which is defined in [budgets/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListBudgetsVariables {
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that calling the `listBudgets` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `listBudgets` Query is of type `ListBudgetsData`, which is defined in [budgets/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListBudgetsData {
  budgets: ({
    id: string;
    category: string;
    subCategory: string;
    period: string;
    budgetLimit: number;
    spent: number;
    createdAt?: string | null;
    updatedAt?: string | null;
  } & Budget_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `listBudgets`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListBudgetsVariables } from '@erp-system/budgets';
import { useListBudgets } from '@erp-system/budgets/react'

export default function ListBudgetsComponent() {
  // The `useListBudgets` Query hook has an optional argument of type `ListBudgetsVariables`:
  const listBudgetsVars: ListBudgetsVariables = {
    limit: ..., // optional
    offset: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListBudgets(listBudgetsVars);
  // Variables can be defined inline as well.
  const query = useListBudgets({ limit: ..., offset: ..., });
  // Since all variables are optional for this Query, you can omit the `ListBudgetsVariables` argument.
  // (as long as you don't want to provide any `options`!)
  const query = useListBudgets();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListBudgets(dataConnect, listBudgetsVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListBudgets(listBudgetsVars, options);
  // If you'd like to provide options without providing any variables, you must
  // pass `undefined` where you would normally pass the variables.
  const query = useListBudgets(undefined, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListBudgets(dataConnect, listBudgetsVars /** or undefined */, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.budgets);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## getBudgetById
You can execute the `getBudgetById` Query using the following Query hook function, which is defined in [budgets/react/index.d.ts](./index.d.ts):

```javascript
useGetBudgetById(dc: DataConnect, vars: GetBudgetByIdVariables, options?: useDataConnectQueryOptions<GetBudgetByIdData>): UseDataConnectQueryResult<GetBudgetByIdData, GetBudgetByIdVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetBudgetById(vars: GetBudgetByIdVariables, options?: useDataConnectQueryOptions<GetBudgetByIdData>): UseDataConnectQueryResult<GetBudgetByIdData, GetBudgetByIdVariables>;
```

### Variables
The `getBudgetById` Query requires an argument of type `GetBudgetByIdVariables`, which is defined in [budgets/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetBudgetByIdVariables {
  id: string;
}
```
### Return Type
Recall that calling the `getBudgetById` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `getBudgetById` Query is of type `GetBudgetByIdData`, which is defined in [budgets/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetBudgetByIdData {
  budget?: {
    id: string;
    category: string;
    subCategory: string;
    period: string;
    budgetLimit: number;
    spent: number;
    createdAt?: string | null;
    updatedAt?: string | null;
  } & Budget_Key;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `getBudgetById`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetBudgetByIdVariables } from '@erp-system/budgets';
import { useGetBudgetById } from '@erp-system/budgets/react'

export default function GetBudgetByIdComponent() {
  // The `useGetBudgetById` Query hook requires an argument of type `GetBudgetByIdVariables`:
  const getBudgetByIdVars: GetBudgetByIdVariables = {
    id: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetBudgetById(getBudgetByIdVars);
  // Variables can be defined inline as well.
  const query = useGetBudgetById({ id: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetBudgetById(dataConnect, getBudgetByIdVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetBudgetById(getBudgetByIdVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetBudgetById(dataConnect, getBudgetByIdVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.budget);
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

Below are examples of how to use the `budgets` connector's generated Mutation hook functions to execute each Mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#operations-react-angular).

## budgetInsert
You can execute the `budgetInsert` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [budgets/react/index.d.ts](./index.d.ts)):
```javascript
useBudgetInsert(options?: useDataConnectMutationOptions<BudgetInsertData, FirebaseError, BudgetInsertVariables>): UseDataConnectMutationResult<BudgetInsertData, BudgetInsertVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useBudgetInsert(dc: DataConnect, options?: useDataConnectMutationOptions<BudgetInsertData, FirebaseError, BudgetInsertVariables>): UseDataConnectMutationResult<BudgetInsertData, BudgetInsertVariables>;
```

### Variables
The `budgetInsert` Mutation requires an argument of type `BudgetInsertVariables`, which is defined in [budgets/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface BudgetInsertVariables {
  id: string;
  category: string;
  subCategory: string;
  period: string;
  budgetLimit: number;
  spent: number;
}
```
### Return Type
Recall that calling the `budgetInsert` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `budgetInsert` Mutation is of type `BudgetInsertData`, which is defined in [budgets/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface BudgetInsertData {
  budget_insert: Budget_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `budgetInsert`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, BudgetInsertVariables } from '@erp-system/budgets';
import { useBudgetInsert } from '@erp-system/budgets/react'

export default function BudgetInsertComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useBudgetInsert();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useBudgetInsert(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useBudgetInsert(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useBudgetInsert(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useBudgetInsert` Mutation requires an argument of type `BudgetInsertVariables`:
  const budgetInsertVars: BudgetInsertVariables = {
    id: ..., 
    category: ..., 
    subCategory: ..., 
    period: ..., 
    budgetLimit: ..., 
    spent: ..., 
  };
  mutation.mutate(budgetInsertVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., category: ..., subCategory: ..., period: ..., budgetLimit: ..., spent: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(budgetInsertVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.budget_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## budgetUpdate
You can execute the `budgetUpdate` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [budgets/react/index.d.ts](./index.d.ts)):
```javascript
useBudgetUpdate(options?: useDataConnectMutationOptions<BudgetUpdateData, FirebaseError, BudgetUpdateVariables>): UseDataConnectMutationResult<BudgetUpdateData, BudgetUpdateVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useBudgetUpdate(dc: DataConnect, options?: useDataConnectMutationOptions<BudgetUpdateData, FirebaseError, BudgetUpdateVariables>): UseDataConnectMutationResult<BudgetUpdateData, BudgetUpdateVariables>;
```

### Variables
The `budgetUpdate` Mutation requires an argument of type `BudgetUpdateVariables`, which is defined in [budgets/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface BudgetUpdateVariables {
  id: string;
  category: string;
  subCategory: string;
  period: string;
  budgetLimit: number;
  spent: number;
}
```
### Return Type
Recall that calling the `budgetUpdate` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `budgetUpdate` Mutation is of type `BudgetUpdateData`, which is defined in [budgets/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface BudgetUpdateData {
  budget_update?: Budget_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `budgetUpdate`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, BudgetUpdateVariables } from '@erp-system/budgets';
import { useBudgetUpdate } from '@erp-system/budgets/react'

export default function BudgetUpdateComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useBudgetUpdate();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useBudgetUpdate(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useBudgetUpdate(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useBudgetUpdate(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useBudgetUpdate` Mutation requires an argument of type `BudgetUpdateVariables`:
  const budgetUpdateVars: BudgetUpdateVariables = {
    id: ..., 
    category: ..., 
    subCategory: ..., 
    period: ..., 
    budgetLimit: ..., 
    spent: ..., 
  };
  mutation.mutate(budgetUpdateVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., category: ..., subCategory: ..., period: ..., budgetLimit: ..., spent: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(budgetUpdateVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.budget_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## budgetDelete
You can execute the `budgetDelete` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [budgets/react/index.d.ts](./index.d.ts)):
```javascript
useBudgetDelete(options?: useDataConnectMutationOptions<BudgetDeleteData, FirebaseError, BudgetDeleteVariables>): UseDataConnectMutationResult<BudgetDeleteData, BudgetDeleteVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useBudgetDelete(dc: DataConnect, options?: useDataConnectMutationOptions<BudgetDeleteData, FirebaseError, BudgetDeleteVariables>): UseDataConnectMutationResult<BudgetDeleteData, BudgetDeleteVariables>;
```

### Variables
The `budgetDelete` Mutation requires an argument of type `BudgetDeleteVariables`, which is defined in [budgets/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface BudgetDeleteVariables {
  id: string;
}
```
### Return Type
Recall that calling the `budgetDelete` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `budgetDelete` Mutation is of type `BudgetDeleteData`, which is defined in [budgets/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface BudgetDeleteData {
  budget_delete?: Budget_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `budgetDelete`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, BudgetDeleteVariables } from '@erp-system/budgets';
import { useBudgetDelete } from '@erp-system/budgets/react'

export default function BudgetDeleteComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useBudgetDelete();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useBudgetDelete(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useBudgetDelete(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useBudgetDelete(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useBudgetDelete` Mutation requires an argument of type `BudgetDeleteVariables`:
  const budgetDeleteVars: BudgetDeleteVariables = {
    id: ..., 
  };
  mutation.mutate(budgetDeleteVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(budgetDeleteVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.budget_delete);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## budgetUpdateSpent
You can execute the `budgetUpdateSpent` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [budgets/react/index.d.ts](./index.d.ts)):
```javascript
useBudgetUpdateSpent(options?: useDataConnectMutationOptions<BudgetUpdateSpentData, FirebaseError, BudgetUpdateSpentVariables>): UseDataConnectMutationResult<BudgetUpdateSpentData, BudgetUpdateSpentVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useBudgetUpdateSpent(dc: DataConnect, options?: useDataConnectMutationOptions<BudgetUpdateSpentData, FirebaseError, BudgetUpdateSpentVariables>): UseDataConnectMutationResult<BudgetUpdateSpentData, BudgetUpdateSpentVariables>;
```

### Variables
The `budgetUpdateSpent` Mutation requires an argument of type `BudgetUpdateSpentVariables`, which is defined in [budgets/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface BudgetUpdateSpentVariables {
  id: string;
  spent: number;
}
```
### Return Type
Recall that calling the `budgetUpdateSpent` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `budgetUpdateSpent` Mutation is of type `BudgetUpdateSpentData`, which is defined in [budgets/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface BudgetUpdateSpentData {
  budget_update?: Budget_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `budgetUpdateSpent`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, BudgetUpdateSpentVariables } from '@erp-system/budgets';
import { useBudgetUpdateSpent } from '@erp-system/budgets/react'

export default function BudgetUpdateSpentComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useBudgetUpdateSpent();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useBudgetUpdateSpent(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useBudgetUpdateSpent(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useBudgetUpdateSpent(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useBudgetUpdateSpent` Mutation requires an argument of type `BudgetUpdateSpentVariables`:
  const budgetUpdateSpentVars: BudgetUpdateSpentVariables = {
    id: ..., 
    spent: ..., 
  };
  mutation.mutate(budgetUpdateSpentVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., spent: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(budgetUpdateSpentVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.budget_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

