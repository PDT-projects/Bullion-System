# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `loans`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`loans/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
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

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `loans`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@erp-system/loans` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@erp-system/loans';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@erp-system/loans';

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

Below are examples of how to use the `loans` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## listLoans
You can execute the `listLoans` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [loans/index.d.ts](./index.d.ts):
```typescript
listLoans(vars?: ListLoansVariables): QueryPromise<ListLoansData, ListLoansVariables>;

interface ListLoansRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListLoansVariables): QueryRef<ListLoansData, ListLoansVariables>;
}
export const listLoansRef: ListLoansRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listLoans(dc: DataConnect, vars?: ListLoansVariables): QueryPromise<ListLoansData, ListLoansVariables>;

interface ListLoansRef {
  ...
  (dc: DataConnect, vars?: ListLoansVariables): QueryRef<ListLoansData, ListLoansVariables>;
}
export const listLoansRef: ListLoansRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listLoansRef:
```typescript
const name = listLoansRef.operationName;
console.log(name);
```

### Variables
The `listLoans` query has an optional argument of type `ListLoansVariables`, which is defined in [loans/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListLoansVariables {
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that executing the `listLoans` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListLoansData`, which is defined in [loans/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `listLoans`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listLoans, ListLoansVariables } from '@erp-system/loans';

// The `listLoans` query has an optional argument of type `ListLoansVariables`:
const listLoansVars: ListLoansVariables = {
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listLoans()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listLoans(listLoansVars);
// Variables can be defined inline as well.
const { data } = await listLoans({ limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `ListLoansVariables` argument.
const { data } = await listLoans();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listLoans(dataConnect, listLoansVars);

console.log(data.loans);

// Or, you can use the `Promise` API.
listLoans(listLoansVars).then((response) => {
  const data = response.data;
  console.log(data.loans);
});
```

### Using `listLoans`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listLoansRef, ListLoansVariables } from '@erp-system/loans';

// The `listLoans` query has an optional argument of type `ListLoansVariables`:
const listLoansVars: ListLoansVariables = {
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listLoansRef()` function to get a reference to the query.
const ref = listLoansRef(listLoansVars);
// Variables can be defined inline as well.
const ref = listLoansRef({ limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `ListLoansVariables` argument.
const ref = listLoansRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listLoansRef(dataConnect, listLoansVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.loans);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.loans);
});
```

## getLoanById
You can execute the `getLoanById` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [loans/index.d.ts](./index.d.ts):
```typescript
getLoanById(vars: GetLoanByIdVariables): QueryPromise<GetLoanByIdData, GetLoanByIdVariables>;

interface GetLoanByIdRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetLoanByIdVariables): QueryRef<GetLoanByIdData, GetLoanByIdVariables>;
}
export const getLoanByIdRef: GetLoanByIdRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getLoanById(dc: DataConnect, vars: GetLoanByIdVariables): QueryPromise<GetLoanByIdData, GetLoanByIdVariables>;

interface GetLoanByIdRef {
  ...
  (dc: DataConnect, vars: GetLoanByIdVariables): QueryRef<GetLoanByIdData, GetLoanByIdVariables>;
}
export const getLoanByIdRef: GetLoanByIdRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getLoanByIdRef:
```typescript
const name = getLoanByIdRef.operationName;
console.log(name);
```

### Variables
The `getLoanById` query requires an argument of type `GetLoanByIdVariables`, which is defined in [loans/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetLoanByIdVariables {
  id: string;
}
```
### Return Type
Recall that executing the `getLoanById` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetLoanByIdData`, which is defined in [loans/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `getLoanById`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getLoanById, GetLoanByIdVariables } from '@erp-system/loans';

// The `getLoanById` query requires an argument of type `GetLoanByIdVariables`:
const getLoanByIdVars: GetLoanByIdVariables = {
  id: ..., 
};

// Call the `getLoanById()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getLoanById(getLoanByIdVars);
// Variables can be defined inline as well.
const { data } = await getLoanById({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getLoanById(dataConnect, getLoanByIdVars);

console.log(data.loan);

// Or, you can use the `Promise` API.
getLoanById(getLoanByIdVars).then((response) => {
  const data = response.data;
  console.log(data.loan);
});
```

### Using `getLoanById`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getLoanByIdRef, GetLoanByIdVariables } from '@erp-system/loans';

// The `getLoanById` query requires an argument of type `GetLoanByIdVariables`:
const getLoanByIdVars: GetLoanByIdVariables = {
  id: ..., 
};

// Call the `getLoanByIdRef()` function to get a reference to the query.
const ref = getLoanByIdRef(getLoanByIdVars);
// Variables can be defined inline as well.
const ref = getLoanByIdRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getLoanByIdRef(dataConnect, getLoanByIdVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.loan);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.loan);
});
```

## listLoanPayments
You can execute the `listLoanPayments` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [loans/index.d.ts](./index.d.ts):
```typescript
listLoanPayments(vars?: ListLoanPaymentsVariables): QueryPromise<ListLoanPaymentsData, ListLoanPaymentsVariables>;

interface ListLoanPaymentsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListLoanPaymentsVariables): QueryRef<ListLoanPaymentsData, ListLoanPaymentsVariables>;
}
export const listLoanPaymentsRef: ListLoanPaymentsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listLoanPayments(dc: DataConnect, vars?: ListLoanPaymentsVariables): QueryPromise<ListLoanPaymentsData, ListLoanPaymentsVariables>;

interface ListLoanPaymentsRef {
  ...
  (dc: DataConnect, vars?: ListLoanPaymentsVariables): QueryRef<ListLoanPaymentsData, ListLoanPaymentsVariables>;
}
export const listLoanPaymentsRef: ListLoanPaymentsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listLoanPaymentsRef:
```typescript
const name = listLoanPaymentsRef.operationName;
console.log(name);
```

### Variables
The `listLoanPayments` query has an optional argument of type `ListLoanPaymentsVariables`, which is defined in [loans/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListLoanPaymentsVariables {
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that executing the `listLoanPayments` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListLoanPaymentsData`, which is defined in [loans/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `listLoanPayments`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listLoanPayments, ListLoanPaymentsVariables } from '@erp-system/loans';

// The `listLoanPayments` query has an optional argument of type `ListLoanPaymentsVariables`:
const listLoanPaymentsVars: ListLoanPaymentsVariables = {
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listLoanPayments()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listLoanPayments(listLoanPaymentsVars);
// Variables can be defined inline as well.
const { data } = await listLoanPayments({ limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `ListLoanPaymentsVariables` argument.
const { data } = await listLoanPayments();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listLoanPayments(dataConnect, listLoanPaymentsVars);

console.log(data.loanPayments);

// Or, you can use the `Promise` API.
listLoanPayments(listLoanPaymentsVars).then((response) => {
  const data = response.data;
  console.log(data.loanPayments);
});
```

### Using `listLoanPayments`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listLoanPaymentsRef, ListLoanPaymentsVariables } from '@erp-system/loans';

// The `listLoanPayments` query has an optional argument of type `ListLoanPaymentsVariables`:
const listLoanPaymentsVars: ListLoanPaymentsVariables = {
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listLoanPaymentsRef()` function to get a reference to the query.
const ref = listLoanPaymentsRef(listLoanPaymentsVars);
// Variables can be defined inline as well.
const ref = listLoanPaymentsRef({ limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `ListLoanPaymentsVariables` argument.
const ref = listLoanPaymentsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listLoanPaymentsRef(dataConnect, listLoanPaymentsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.loanPayments);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.loanPayments);
});
```

## getLoanPaymentById
You can execute the `getLoanPaymentById` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [loans/index.d.ts](./index.d.ts):
```typescript
getLoanPaymentById(vars: GetLoanPaymentByIdVariables): QueryPromise<GetLoanPaymentByIdData, GetLoanPaymentByIdVariables>;

interface GetLoanPaymentByIdRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetLoanPaymentByIdVariables): QueryRef<GetLoanPaymentByIdData, GetLoanPaymentByIdVariables>;
}
export const getLoanPaymentByIdRef: GetLoanPaymentByIdRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getLoanPaymentById(dc: DataConnect, vars: GetLoanPaymentByIdVariables): QueryPromise<GetLoanPaymentByIdData, GetLoanPaymentByIdVariables>;

interface GetLoanPaymentByIdRef {
  ...
  (dc: DataConnect, vars: GetLoanPaymentByIdVariables): QueryRef<GetLoanPaymentByIdData, GetLoanPaymentByIdVariables>;
}
export const getLoanPaymentByIdRef: GetLoanPaymentByIdRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getLoanPaymentByIdRef:
```typescript
const name = getLoanPaymentByIdRef.operationName;
console.log(name);
```

### Variables
The `getLoanPaymentById` query requires an argument of type `GetLoanPaymentByIdVariables`, which is defined in [loans/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetLoanPaymentByIdVariables {
  id: string;
}
```
### Return Type
Recall that executing the `getLoanPaymentById` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetLoanPaymentByIdData`, which is defined in [loans/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `getLoanPaymentById`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getLoanPaymentById, GetLoanPaymentByIdVariables } from '@erp-system/loans';

// The `getLoanPaymentById` query requires an argument of type `GetLoanPaymentByIdVariables`:
const getLoanPaymentByIdVars: GetLoanPaymentByIdVariables = {
  id: ..., 
};

// Call the `getLoanPaymentById()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getLoanPaymentById(getLoanPaymentByIdVars);
// Variables can be defined inline as well.
const { data } = await getLoanPaymentById({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getLoanPaymentById(dataConnect, getLoanPaymentByIdVars);

console.log(data.loanPayment);

// Or, you can use the `Promise` API.
getLoanPaymentById(getLoanPaymentByIdVars).then((response) => {
  const data = response.data;
  console.log(data.loanPayment);
});
```

### Using `getLoanPaymentById`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getLoanPaymentByIdRef, GetLoanPaymentByIdVariables } from '@erp-system/loans';

// The `getLoanPaymentById` query requires an argument of type `GetLoanPaymentByIdVariables`:
const getLoanPaymentByIdVars: GetLoanPaymentByIdVariables = {
  id: ..., 
};

// Call the `getLoanPaymentByIdRef()` function to get a reference to the query.
const ref = getLoanPaymentByIdRef(getLoanPaymentByIdVars);
// Variables can be defined inline as well.
const ref = getLoanPaymentByIdRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getLoanPaymentByIdRef(dataConnect, getLoanPaymentByIdVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.loanPayment);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.loanPayment);
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

Below are examples of how to use the `loans` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## createLoan
You can execute the `createLoan` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [loans/index.d.ts](./index.d.ts):
```typescript
createLoan(vars: CreateLoanVariables): MutationPromise<CreateLoanData, CreateLoanVariables>;

interface CreateLoanRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateLoanVariables): MutationRef<CreateLoanData, CreateLoanVariables>;
}
export const createLoanRef: CreateLoanRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createLoan(dc: DataConnect, vars: CreateLoanVariables): MutationPromise<CreateLoanData, CreateLoanVariables>;

interface CreateLoanRef {
  ...
  (dc: DataConnect, vars: CreateLoanVariables): MutationRef<CreateLoanData, CreateLoanVariables>;
}
export const createLoanRef: CreateLoanRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createLoanRef:
```typescript
const name = createLoanRef.operationName;
console.log(name);
```

### Variables
The `createLoan` mutation requires an argument of type `CreateLoanVariables`, which is defined in [loans/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `createLoan` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateLoanData`, which is defined in [loans/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateLoanData {
  loan_insert: Loan_Key;
}
```
### Using `createLoan`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createLoan, CreateLoanVariables } from '@erp-system/loans';

// The `createLoan` mutation requires an argument of type `CreateLoanVariables`:
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

// Call the `createLoan()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createLoan(createLoanVars);
// Variables can be defined inline as well.
const { data } = await createLoan({ id: ..., lenderName: ..., borrowerName: ..., totalAmount: ..., paid: ..., remaining: ..., loanDate: ..., dueDate: ..., type: ..., category: ..., status: ..., notes: ..., bankId: ..., bankName: ..., employeeId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createLoan(dataConnect, createLoanVars);

console.log(data.loan_insert);

// Or, you can use the `Promise` API.
createLoan(createLoanVars).then((response) => {
  const data = response.data;
  console.log(data.loan_insert);
});
```

### Using `createLoan`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createLoanRef, CreateLoanVariables } from '@erp-system/loans';

// The `createLoan` mutation requires an argument of type `CreateLoanVariables`:
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

// Call the `createLoanRef()` function to get a reference to the mutation.
const ref = createLoanRef(createLoanVars);
// Variables can be defined inline as well.
const ref = createLoanRef({ id: ..., lenderName: ..., borrowerName: ..., totalAmount: ..., paid: ..., remaining: ..., loanDate: ..., dueDate: ..., type: ..., category: ..., status: ..., notes: ..., bankId: ..., bankName: ..., employeeId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createLoanRef(dataConnect, createLoanVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.loan_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.loan_insert);
});
```

## createLoanPayment
You can execute the `createLoanPayment` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [loans/index.d.ts](./index.d.ts):
```typescript
createLoanPayment(vars: CreateLoanPaymentVariables): MutationPromise<CreateLoanPaymentData, CreateLoanPaymentVariables>;

interface CreateLoanPaymentRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateLoanPaymentVariables): MutationRef<CreateLoanPaymentData, CreateLoanPaymentVariables>;
}
export const createLoanPaymentRef: CreateLoanPaymentRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createLoanPayment(dc: DataConnect, vars: CreateLoanPaymentVariables): MutationPromise<CreateLoanPaymentData, CreateLoanPaymentVariables>;

interface CreateLoanPaymentRef {
  ...
  (dc: DataConnect, vars: CreateLoanPaymentVariables): MutationRef<CreateLoanPaymentData, CreateLoanPaymentVariables>;
}
export const createLoanPaymentRef: CreateLoanPaymentRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createLoanPaymentRef:
```typescript
const name = createLoanPaymentRef.operationName;
console.log(name);
```

### Variables
The `createLoanPayment` mutation requires an argument of type `CreateLoanPaymentVariables`, which is defined in [loans/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `createLoanPayment` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateLoanPaymentData`, which is defined in [loans/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateLoanPaymentData {
  loanPayment_insert: LoanPayment_Key;
}
```
### Using `createLoanPayment`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createLoanPayment, CreateLoanPaymentVariables } from '@erp-system/loans';

// The `createLoanPayment` mutation requires an argument of type `CreateLoanPaymentVariables`:
const createLoanPaymentVars: CreateLoanPaymentVariables = {
  id: ..., 
  loanId: ..., 
  amount: ..., 
  mode: ..., 
  date: ..., 
  bankId: ..., // optional
  bankName: ..., // optional
};

// Call the `createLoanPayment()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createLoanPayment(createLoanPaymentVars);
// Variables can be defined inline as well.
const { data } = await createLoanPayment({ id: ..., loanId: ..., amount: ..., mode: ..., date: ..., bankId: ..., bankName: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createLoanPayment(dataConnect, createLoanPaymentVars);

console.log(data.loanPayment_insert);

// Or, you can use the `Promise` API.
createLoanPayment(createLoanPaymentVars).then((response) => {
  const data = response.data;
  console.log(data.loanPayment_insert);
});
```

### Using `createLoanPayment`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createLoanPaymentRef, CreateLoanPaymentVariables } from '@erp-system/loans';

// The `createLoanPayment` mutation requires an argument of type `CreateLoanPaymentVariables`:
const createLoanPaymentVars: CreateLoanPaymentVariables = {
  id: ..., 
  loanId: ..., 
  amount: ..., 
  mode: ..., 
  date: ..., 
  bankId: ..., // optional
  bankName: ..., // optional
};

// Call the `createLoanPaymentRef()` function to get a reference to the mutation.
const ref = createLoanPaymentRef(createLoanPaymentVars);
// Variables can be defined inline as well.
const ref = createLoanPaymentRef({ id: ..., loanId: ..., amount: ..., mode: ..., date: ..., bankId: ..., bankName: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createLoanPaymentRef(dataConnect, createLoanPaymentVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.loanPayment_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.loanPayment_insert);
});
```

