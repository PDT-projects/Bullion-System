# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `budgets`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`budgets/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
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

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `budgets`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@erp-system/budgets` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@erp-system/budgets';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@erp-system/budgets';

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

Below are examples of how to use the `budgets` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## listBudgets
You can execute the `listBudgets` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [budgets/index.d.ts](./index.d.ts):
```typescript
listBudgets(vars?: ListBudgetsVariables): QueryPromise<ListBudgetsData, ListBudgetsVariables>;

interface ListBudgetsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListBudgetsVariables): QueryRef<ListBudgetsData, ListBudgetsVariables>;
}
export const listBudgetsRef: ListBudgetsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listBudgets(dc: DataConnect, vars?: ListBudgetsVariables): QueryPromise<ListBudgetsData, ListBudgetsVariables>;

interface ListBudgetsRef {
  ...
  (dc: DataConnect, vars?: ListBudgetsVariables): QueryRef<ListBudgetsData, ListBudgetsVariables>;
}
export const listBudgetsRef: ListBudgetsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listBudgetsRef:
```typescript
const name = listBudgetsRef.operationName;
console.log(name);
```

### Variables
The `listBudgets` query has an optional argument of type `ListBudgetsVariables`, which is defined in [budgets/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListBudgetsVariables {
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that executing the `listBudgets` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListBudgetsData`, which is defined in [budgets/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `listBudgets`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listBudgets, ListBudgetsVariables } from '@erp-system/budgets';

// The `listBudgets` query has an optional argument of type `ListBudgetsVariables`:
const listBudgetsVars: ListBudgetsVariables = {
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listBudgets()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listBudgets(listBudgetsVars);
// Variables can be defined inline as well.
const { data } = await listBudgets({ limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `ListBudgetsVariables` argument.
const { data } = await listBudgets();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listBudgets(dataConnect, listBudgetsVars);

console.log(data.budgets);

// Or, you can use the `Promise` API.
listBudgets(listBudgetsVars).then((response) => {
  const data = response.data;
  console.log(data.budgets);
});
```

### Using `listBudgets`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listBudgetsRef, ListBudgetsVariables } from '@erp-system/budgets';

// The `listBudgets` query has an optional argument of type `ListBudgetsVariables`:
const listBudgetsVars: ListBudgetsVariables = {
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listBudgetsRef()` function to get a reference to the query.
const ref = listBudgetsRef(listBudgetsVars);
// Variables can be defined inline as well.
const ref = listBudgetsRef({ limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `ListBudgetsVariables` argument.
const ref = listBudgetsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listBudgetsRef(dataConnect, listBudgetsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.budgets);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.budgets);
});
```

## getBudgetById
You can execute the `getBudgetById` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [budgets/index.d.ts](./index.d.ts):
```typescript
getBudgetById(vars: GetBudgetByIdVariables): QueryPromise<GetBudgetByIdData, GetBudgetByIdVariables>;

interface GetBudgetByIdRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetBudgetByIdVariables): QueryRef<GetBudgetByIdData, GetBudgetByIdVariables>;
}
export const getBudgetByIdRef: GetBudgetByIdRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getBudgetById(dc: DataConnect, vars: GetBudgetByIdVariables): QueryPromise<GetBudgetByIdData, GetBudgetByIdVariables>;

interface GetBudgetByIdRef {
  ...
  (dc: DataConnect, vars: GetBudgetByIdVariables): QueryRef<GetBudgetByIdData, GetBudgetByIdVariables>;
}
export const getBudgetByIdRef: GetBudgetByIdRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getBudgetByIdRef:
```typescript
const name = getBudgetByIdRef.operationName;
console.log(name);
```

### Variables
The `getBudgetById` query requires an argument of type `GetBudgetByIdVariables`, which is defined in [budgets/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetBudgetByIdVariables {
  id: string;
}
```
### Return Type
Recall that executing the `getBudgetById` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetBudgetByIdData`, which is defined in [budgets/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `getBudgetById`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getBudgetById, GetBudgetByIdVariables } from '@erp-system/budgets';

// The `getBudgetById` query requires an argument of type `GetBudgetByIdVariables`:
const getBudgetByIdVars: GetBudgetByIdVariables = {
  id: ..., 
};

// Call the `getBudgetById()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getBudgetById(getBudgetByIdVars);
// Variables can be defined inline as well.
const { data } = await getBudgetById({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getBudgetById(dataConnect, getBudgetByIdVars);

console.log(data.budget);

// Or, you can use the `Promise` API.
getBudgetById(getBudgetByIdVars).then((response) => {
  const data = response.data;
  console.log(data.budget);
});
```

### Using `getBudgetById`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getBudgetByIdRef, GetBudgetByIdVariables } from '@erp-system/budgets';

// The `getBudgetById` query requires an argument of type `GetBudgetByIdVariables`:
const getBudgetByIdVars: GetBudgetByIdVariables = {
  id: ..., 
};

// Call the `getBudgetByIdRef()` function to get a reference to the query.
const ref = getBudgetByIdRef(getBudgetByIdVars);
// Variables can be defined inline as well.
const ref = getBudgetByIdRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getBudgetByIdRef(dataConnect, getBudgetByIdVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.budget);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.budget);
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

Below are examples of how to use the `budgets` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## budgetInsert
You can execute the `budgetInsert` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [budgets/index.d.ts](./index.d.ts):
```typescript
budgetInsert(vars: BudgetInsertVariables): MutationPromise<BudgetInsertData, BudgetInsertVariables>;

interface BudgetInsertRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: BudgetInsertVariables): MutationRef<BudgetInsertData, BudgetInsertVariables>;
}
export const budgetInsertRef: BudgetInsertRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
budgetInsert(dc: DataConnect, vars: BudgetInsertVariables): MutationPromise<BudgetInsertData, BudgetInsertVariables>;

interface BudgetInsertRef {
  ...
  (dc: DataConnect, vars: BudgetInsertVariables): MutationRef<BudgetInsertData, BudgetInsertVariables>;
}
export const budgetInsertRef: BudgetInsertRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the budgetInsertRef:
```typescript
const name = budgetInsertRef.operationName;
console.log(name);
```

### Variables
The `budgetInsert` mutation requires an argument of type `BudgetInsertVariables`, which is defined in [budgets/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `budgetInsert` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `BudgetInsertData`, which is defined in [budgets/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface BudgetInsertData {
  budget_insert: Budget_Key;
}
```
### Using `budgetInsert`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, budgetInsert, BudgetInsertVariables } from '@erp-system/budgets';

// The `budgetInsert` mutation requires an argument of type `BudgetInsertVariables`:
const budgetInsertVars: BudgetInsertVariables = {
  id: ..., 
  category: ..., 
  subCategory: ..., 
  period: ..., 
  budgetLimit: ..., 
  spent: ..., 
};

// Call the `budgetInsert()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await budgetInsert(budgetInsertVars);
// Variables can be defined inline as well.
const { data } = await budgetInsert({ id: ..., category: ..., subCategory: ..., period: ..., budgetLimit: ..., spent: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await budgetInsert(dataConnect, budgetInsertVars);

console.log(data.budget_insert);

// Or, you can use the `Promise` API.
budgetInsert(budgetInsertVars).then((response) => {
  const data = response.data;
  console.log(data.budget_insert);
});
```

### Using `budgetInsert`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, budgetInsertRef, BudgetInsertVariables } from '@erp-system/budgets';

// The `budgetInsert` mutation requires an argument of type `BudgetInsertVariables`:
const budgetInsertVars: BudgetInsertVariables = {
  id: ..., 
  category: ..., 
  subCategory: ..., 
  period: ..., 
  budgetLimit: ..., 
  spent: ..., 
};

// Call the `budgetInsertRef()` function to get a reference to the mutation.
const ref = budgetInsertRef(budgetInsertVars);
// Variables can be defined inline as well.
const ref = budgetInsertRef({ id: ..., category: ..., subCategory: ..., period: ..., budgetLimit: ..., spent: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = budgetInsertRef(dataConnect, budgetInsertVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.budget_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.budget_insert);
});
```

## budgetUpdate
You can execute the `budgetUpdate` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [budgets/index.d.ts](./index.d.ts):
```typescript
budgetUpdate(vars: BudgetUpdateVariables): MutationPromise<BudgetUpdateData, BudgetUpdateVariables>;

interface BudgetUpdateRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: BudgetUpdateVariables): MutationRef<BudgetUpdateData, BudgetUpdateVariables>;
}
export const budgetUpdateRef: BudgetUpdateRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
budgetUpdate(dc: DataConnect, vars: BudgetUpdateVariables): MutationPromise<BudgetUpdateData, BudgetUpdateVariables>;

interface BudgetUpdateRef {
  ...
  (dc: DataConnect, vars: BudgetUpdateVariables): MutationRef<BudgetUpdateData, BudgetUpdateVariables>;
}
export const budgetUpdateRef: BudgetUpdateRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the budgetUpdateRef:
```typescript
const name = budgetUpdateRef.operationName;
console.log(name);
```

### Variables
The `budgetUpdate` mutation requires an argument of type `BudgetUpdateVariables`, which is defined in [budgets/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `budgetUpdate` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `BudgetUpdateData`, which is defined in [budgets/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface BudgetUpdateData {
  budget_update?: Budget_Key | null;
}
```
### Using `budgetUpdate`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, budgetUpdate, BudgetUpdateVariables } from '@erp-system/budgets';

// The `budgetUpdate` mutation requires an argument of type `BudgetUpdateVariables`:
const budgetUpdateVars: BudgetUpdateVariables = {
  id: ..., 
  category: ..., 
  subCategory: ..., 
  period: ..., 
  budgetLimit: ..., 
  spent: ..., 
};

// Call the `budgetUpdate()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await budgetUpdate(budgetUpdateVars);
// Variables can be defined inline as well.
const { data } = await budgetUpdate({ id: ..., category: ..., subCategory: ..., period: ..., budgetLimit: ..., spent: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await budgetUpdate(dataConnect, budgetUpdateVars);

console.log(data.budget_update);

// Or, you can use the `Promise` API.
budgetUpdate(budgetUpdateVars).then((response) => {
  const data = response.data;
  console.log(data.budget_update);
});
```

### Using `budgetUpdate`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, budgetUpdateRef, BudgetUpdateVariables } from '@erp-system/budgets';

// The `budgetUpdate` mutation requires an argument of type `BudgetUpdateVariables`:
const budgetUpdateVars: BudgetUpdateVariables = {
  id: ..., 
  category: ..., 
  subCategory: ..., 
  period: ..., 
  budgetLimit: ..., 
  spent: ..., 
};

// Call the `budgetUpdateRef()` function to get a reference to the mutation.
const ref = budgetUpdateRef(budgetUpdateVars);
// Variables can be defined inline as well.
const ref = budgetUpdateRef({ id: ..., category: ..., subCategory: ..., period: ..., budgetLimit: ..., spent: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = budgetUpdateRef(dataConnect, budgetUpdateVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.budget_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.budget_update);
});
```

## budgetDelete
You can execute the `budgetDelete` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [budgets/index.d.ts](./index.d.ts):
```typescript
budgetDelete(vars: BudgetDeleteVariables): MutationPromise<BudgetDeleteData, BudgetDeleteVariables>;

interface BudgetDeleteRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: BudgetDeleteVariables): MutationRef<BudgetDeleteData, BudgetDeleteVariables>;
}
export const budgetDeleteRef: BudgetDeleteRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
budgetDelete(dc: DataConnect, vars: BudgetDeleteVariables): MutationPromise<BudgetDeleteData, BudgetDeleteVariables>;

interface BudgetDeleteRef {
  ...
  (dc: DataConnect, vars: BudgetDeleteVariables): MutationRef<BudgetDeleteData, BudgetDeleteVariables>;
}
export const budgetDeleteRef: BudgetDeleteRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the budgetDeleteRef:
```typescript
const name = budgetDeleteRef.operationName;
console.log(name);
```

### Variables
The `budgetDelete` mutation requires an argument of type `BudgetDeleteVariables`, which is defined in [budgets/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface BudgetDeleteVariables {
  id: string;
}
```
### Return Type
Recall that executing the `budgetDelete` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `BudgetDeleteData`, which is defined in [budgets/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface BudgetDeleteData {
  budget_delete?: Budget_Key | null;
}
```
### Using `budgetDelete`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, budgetDelete, BudgetDeleteVariables } from '@erp-system/budgets';

// The `budgetDelete` mutation requires an argument of type `BudgetDeleteVariables`:
const budgetDeleteVars: BudgetDeleteVariables = {
  id: ..., 
};

// Call the `budgetDelete()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await budgetDelete(budgetDeleteVars);
// Variables can be defined inline as well.
const { data } = await budgetDelete({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await budgetDelete(dataConnect, budgetDeleteVars);

console.log(data.budget_delete);

// Or, you can use the `Promise` API.
budgetDelete(budgetDeleteVars).then((response) => {
  const data = response.data;
  console.log(data.budget_delete);
});
```

### Using `budgetDelete`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, budgetDeleteRef, BudgetDeleteVariables } from '@erp-system/budgets';

// The `budgetDelete` mutation requires an argument of type `BudgetDeleteVariables`:
const budgetDeleteVars: BudgetDeleteVariables = {
  id: ..., 
};

// Call the `budgetDeleteRef()` function to get a reference to the mutation.
const ref = budgetDeleteRef(budgetDeleteVars);
// Variables can be defined inline as well.
const ref = budgetDeleteRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = budgetDeleteRef(dataConnect, budgetDeleteVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.budget_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.budget_delete);
});
```

## budgetUpdateSpent
You can execute the `budgetUpdateSpent` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [budgets/index.d.ts](./index.d.ts):
```typescript
budgetUpdateSpent(vars: BudgetUpdateSpentVariables): MutationPromise<BudgetUpdateSpentData, BudgetUpdateSpentVariables>;

interface BudgetUpdateSpentRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: BudgetUpdateSpentVariables): MutationRef<BudgetUpdateSpentData, BudgetUpdateSpentVariables>;
}
export const budgetUpdateSpentRef: BudgetUpdateSpentRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
budgetUpdateSpent(dc: DataConnect, vars: BudgetUpdateSpentVariables): MutationPromise<BudgetUpdateSpentData, BudgetUpdateSpentVariables>;

interface BudgetUpdateSpentRef {
  ...
  (dc: DataConnect, vars: BudgetUpdateSpentVariables): MutationRef<BudgetUpdateSpentData, BudgetUpdateSpentVariables>;
}
export const budgetUpdateSpentRef: BudgetUpdateSpentRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the budgetUpdateSpentRef:
```typescript
const name = budgetUpdateSpentRef.operationName;
console.log(name);
```

### Variables
The `budgetUpdateSpent` mutation requires an argument of type `BudgetUpdateSpentVariables`, which is defined in [budgets/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface BudgetUpdateSpentVariables {
  id: string;
  spent: number;
}
```
### Return Type
Recall that executing the `budgetUpdateSpent` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `BudgetUpdateSpentData`, which is defined in [budgets/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface BudgetUpdateSpentData {
  budget_update?: Budget_Key | null;
}
```
### Using `budgetUpdateSpent`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, budgetUpdateSpent, BudgetUpdateSpentVariables } from '@erp-system/budgets';

// The `budgetUpdateSpent` mutation requires an argument of type `BudgetUpdateSpentVariables`:
const budgetUpdateSpentVars: BudgetUpdateSpentVariables = {
  id: ..., 
  spent: ..., 
};

// Call the `budgetUpdateSpent()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await budgetUpdateSpent(budgetUpdateSpentVars);
// Variables can be defined inline as well.
const { data } = await budgetUpdateSpent({ id: ..., spent: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await budgetUpdateSpent(dataConnect, budgetUpdateSpentVars);

console.log(data.budget_update);

// Or, you can use the `Promise` API.
budgetUpdateSpent(budgetUpdateSpentVars).then((response) => {
  const data = response.data;
  console.log(data.budget_update);
});
```

### Using `budgetUpdateSpent`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, budgetUpdateSpentRef, BudgetUpdateSpentVariables } from '@erp-system/budgets';

// The `budgetUpdateSpent` mutation requires an argument of type `BudgetUpdateSpentVariables`:
const budgetUpdateSpentVars: BudgetUpdateSpentVariables = {
  id: ..., 
  spent: ..., 
};

// Call the `budgetUpdateSpentRef()` function to get a reference to the mutation.
const ref = budgetUpdateSpentRef(budgetUpdateSpentVars);
// Variables can be defined inline as well.
const ref = budgetUpdateSpentRef({ id: ..., spent: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = budgetUpdateSpentRef(dataConnect, budgetUpdateSpentVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.budget_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.budget_update);
});
```

