# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
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

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

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

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetEmployees
You can execute the `GetEmployees` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getEmployees(): QueryPromise<GetEmployeesData, undefined>;

interface GetEmployeesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetEmployeesData, undefined>;
}
export const getEmployeesRef: GetEmployeesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getEmployees(dc: DataConnect): QueryPromise<GetEmployeesData, undefined>;

interface GetEmployeesRef {
  ...
  (dc: DataConnect): QueryRef<GetEmployeesData, undefined>;
}
export const getEmployeesRef: GetEmployeesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getEmployeesRef:
```typescript
const name = getEmployeesRef.operationName;
console.log(name);
```

### Variables
The `GetEmployees` query has no variables.
### Return Type
Recall that executing the `GetEmployees` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetEmployeesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetEmployees`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getEmployees } from '@dataconnect/generated';


// Call the `getEmployees()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getEmployees();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getEmployees(dataConnect);

console.log(data.employees);

// Or, you can use the `Promise` API.
getEmployees().then((response) => {
  const data = response.data;
  console.log(data.employees);
});
```

### Using `GetEmployees`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getEmployeesRef } from '@dataconnect/generated';


// Call the `getEmployeesRef()` function to get a reference to the query.
const ref = getEmployeesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getEmployeesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.employees);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.employees);
});
```

## GetEmployeeById
You can execute the `GetEmployeeById` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getEmployeeById(vars: GetEmployeeByIdVariables): QueryPromise<GetEmployeeByIdData, GetEmployeeByIdVariables>;

interface GetEmployeeByIdRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetEmployeeByIdVariables): QueryRef<GetEmployeeByIdData, GetEmployeeByIdVariables>;
}
export const getEmployeeByIdRef: GetEmployeeByIdRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getEmployeeById(dc: DataConnect, vars: GetEmployeeByIdVariables): QueryPromise<GetEmployeeByIdData, GetEmployeeByIdVariables>;

interface GetEmployeeByIdRef {
  ...
  (dc: DataConnect, vars: GetEmployeeByIdVariables): QueryRef<GetEmployeeByIdData, GetEmployeeByIdVariables>;
}
export const getEmployeeByIdRef: GetEmployeeByIdRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getEmployeeByIdRef:
```typescript
const name = getEmployeeByIdRef.operationName;
console.log(name);
```

### Variables
The `GetEmployeeById` query requires an argument of type `GetEmployeeByIdVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetEmployeeByIdVariables {
  id: string;
}
```
### Return Type
Recall that executing the `GetEmployeeById` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetEmployeeByIdData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetEmployeeById`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getEmployeeById, GetEmployeeByIdVariables } from '@dataconnect/generated';

// The `GetEmployeeById` query requires an argument of type `GetEmployeeByIdVariables`:
const getEmployeeByIdVars: GetEmployeeByIdVariables = {
  id: ..., 
};

// Call the `getEmployeeById()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getEmployeeById(getEmployeeByIdVars);
// Variables can be defined inline as well.
const { data } = await getEmployeeById({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getEmployeeById(dataConnect, getEmployeeByIdVars);

console.log(data.employee);

// Or, you can use the `Promise` API.
getEmployeeById(getEmployeeByIdVars).then((response) => {
  const data = response.data;
  console.log(data.employee);
});
```

### Using `GetEmployeeById`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getEmployeeByIdRef, GetEmployeeByIdVariables } from '@dataconnect/generated';

// The `GetEmployeeById` query requires an argument of type `GetEmployeeByIdVariables`:
const getEmployeeByIdVars: GetEmployeeByIdVariables = {
  id: ..., 
};

// Call the `getEmployeeByIdRef()` function to get a reference to the query.
const ref = getEmployeeByIdRef(getEmployeeByIdVars);
// Variables can be defined inline as well.
const ref = getEmployeeByIdRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getEmployeeByIdRef(dataConnect, getEmployeeByIdVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.employee);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.employee);
});
```

## GetBanks
You can execute the `GetBanks` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getBanks(): QueryPromise<GetBanksData, undefined>;

interface GetBanksRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetBanksData, undefined>;
}
export const getBanksRef: GetBanksRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getBanks(dc: DataConnect): QueryPromise<GetBanksData, undefined>;

interface GetBanksRef {
  ...
  (dc: DataConnect): QueryRef<GetBanksData, undefined>;
}
export const getBanksRef: GetBanksRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getBanksRef:
```typescript
const name = getBanksRef.operationName;
console.log(name);
```

### Variables
The `GetBanks` query has no variables.
### Return Type
Recall that executing the `GetBanks` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetBanksData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetBanks`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getBanks } from '@dataconnect/generated';


// Call the `getBanks()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getBanks();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getBanks(dataConnect);

console.log(data.banks);

// Or, you can use the `Promise` API.
getBanks().then((response) => {
  const data = response.data;
  console.log(data.banks);
});
```

### Using `GetBanks`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getBanksRef } from '@dataconnect/generated';


// Call the `getBanksRef()` function to get a reference to the query.
const ref = getBanksRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getBanksRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.banks);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.banks);
});
```

## GetBankById
You can execute the `GetBankById` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getBankById(vars: GetBankByIdVariables): QueryPromise<GetBankByIdData, GetBankByIdVariables>;

interface GetBankByIdRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetBankByIdVariables): QueryRef<GetBankByIdData, GetBankByIdVariables>;
}
export const getBankByIdRef: GetBankByIdRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getBankById(dc: DataConnect, vars: GetBankByIdVariables): QueryPromise<GetBankByIdData, GetBankByIdVariables>;

interface GetBankByIdRef {
  ...
  (dc: DataConnect, vars: GetBankByIdVariables): QueryRef<GetBankByIdData, GetBankByIdVariables>;
}
export const getBankByIdRef: GetBankByIdRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getBankByIdRef:
```typescript
const name = getBankByIdRef.operationName;
console.log(name);
```

### Variables
The `GetBankById` query requires an argument of type `GetBankByIdVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetBankByIdVariables {
  id: string;
}
```
### Return Type
Recall that executing the `GetBankById` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetBankByIdData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetBankById`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getBankById, GetBankByIdVariables } from '@dataconnect/generated';

// The `GetBankById` query requires an argument of type `GetBankByIdVariables`:
const getBankByIdVars: GetBankByIdVariables = {
  id: ..., 
};

// Call the `getBankById()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getBankById(getBankByIdVars);
// Variables can be defined inline as well.
const { data } = await getBankById({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getBankById(dataConnect, getBankByIdVars);

console.log(data.bank);

// Or, you can use the `Promise` API.
getBankById(getBankByIdVars).then((response) => {
  const data = response.data;
  console.log(data.bank);
});
```

### Using `GetBankById`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getBankByIdRef, GetBankByIdVariables } from '@dataconnect/generated';

// The `GetBankById` query requires an argument of type `GetBankByIdVariables`:
const getBankByIdVars: GetBankByIdVariables = {
  id: ..., 
};

// Call the `getBankByIdRef()` function to get a reference to the query.
const ref = getBankByIdRef(getBankByIdVars);
// Variables can be defined inline as well.
const ref = getBankByIdRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getBankByIdRef(dataConnect, getBankByIdVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.bank);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.bank);
});
```

## GetCashInHandRecords
You can execute the `GetCashInHandRecords` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getCashInHandRecords(): QueryPromise<GetCashInHandRecordsData, undefined>;

interface GetCashInHandRecordsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetCashInHandRecordsData, undefined>;
}
export const getCashInHandRecordsRef: GetCashInHandRecordsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getCashInHandRecords(dc: DataConnect): QueryPromise<GetCashInHandRecordsData, undefined>;

interface GetCashInHandRecordsRef {
  ...
  (dc: DataConnect): QueryRef<GetCashInHandRecordsData, undefined>;
}
export const getCashInHandRecordsRef: GetCashInHandRecordsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getCashInHandRecordsRef:
```typescript
const name = getCashInHandRecordsRef.operationName;
console.log(name);
```

### Variables
The `GetCashInHandRecords` query has no variables.
### Return Type
Recall that executing the `GetCashInHandRecords` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetCashInHandRecordsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetCashInHandRecords`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getCashInHandRecords } from '@dataconnect/generated';


// Call the `getCashInHandRecords()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getCashInHandRecords();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getCashInHandRecords(dataConnect);

console.log(data.cashInHands);

// Or, you can use the `Promise` API.
getCashInHandRecords().then((response) => {
  const data = response.data;
  console.log(data.cashInHands);
});
```

### Using `GetCashInHandRecords`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getCashInHandRecordsRef } from '@dataconnect/generated';


// Call the `getCashInHandRecordsRef()` function to get a reference to the query.
const ref = getCashInHandRecordsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getCashInHandRecordsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.cashInHands);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.cashInHands);
});
```

## GetCashInHandByLocation
You can execute the `GetCashInHandByLocation` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getCashInHandByLocation(vars: GetCashInHandByLocationVariables): QueryPromise<GetCashInHandByLocationData, GetCashInHandByLocationVariables>;

interface GetCashInHandByLocationRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetCashInHandByLocationVariables): QueryRef<GetCashInHandByLocationData, GetCashInHandByLocationVariables>;
}
export const getCashInHandByLocationRef: GetCashInHandByLocationRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getCashInHandByLocation(dc: DataConnect, vars: GetCashInHandByLocationVariables): QueryPromise<GetCashInHandByLocationData, GetCashInHandByLocationVariables>;

interface GetCashInHandByLocationRef {
  ...
  (dc: DataConnect, vars: GetCashInHandByLocationVariables): QueryRef<GetCashInHandByLocationData, GetCashInHandByLocationVariables>;
}
export const getCashInHandByLocationRef: GetCashInHandByLocationRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getCashInHandByLocationRef:
```typescript
const name = getCashInHandByLocationRef.operationName;
console.log(name);
```

### Variables
The `GetCashInHandByLocation` query requires an argument of type `GetCashInHandByLocationVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetCashInHandByLocationVariables {
  location: string;
}
```
### Return Type
Recall that executing the `GetCashInHandByLocation` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetCashInHandByLocationData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetCashInHandByLocation`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getCashInHandByLocation, GetCashInHandByLocationVariables } from '@dataconnect/generated';

// The `GetCashInHandByLocation` query requires an argument of type `GetCashInHandByLocationVariables`:
const getCashInHandByLocationVars: GetCashInHandByLocationVariables = {
  location: ..., 
};

// Call the `getCashInHandByLocation()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getCashInHandByLocation(getCashInHandByLocationVars);
// Variables can be defined inline as well.
const { data } = await getCashInHandByLocation({ location: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getCashInHandByLocation(dataConnect, getCashInHandByLocationVars);

console.log(data.cashInHands);

// Or, you can use the `Promise` API.
getCashInHandByLocation(getCashInHandByLocationVars).then((response) => {
  const data = response.data;
  console.log(data.cashInHands);
});
```

### Using `GetCashInHandByLocation`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getCashInHandByLocationRef, GetCashInHandByLocationVariables } from '@dataconnect/generated';

// The `GetCashInHandByLocation` query requires an argument of type `GetCashInHandByLocationVariables`:
const getCashInHandByLocationVars: GetCashInHandByLocationVariables = {
  location: ..., 
};

// Call the `getCashInHandByLocationRef()` function to get a reference to the query.
const ref = getCashInHandByLocationRef(getCashInHandByLocationVars);
// Variables can be defined inline as well.
const ref = getCashInHandByLocationRef({ location: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getCashInHandByLocationRef(dataConnect, getCashInHandByLocationVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.cashInHands);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.cashInHands);
});
```

## GetCashInHandById
You can execute the `GetCashInHandById` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getCashInHandById(vars: GetCashInHandByIdVariables): QueryPromise<GetCashInHandByIdData, GetCashInHandByIdVariables>;

interface GetCashInHandByIdRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetCashInHandByIdVariables): QueryRef<GetCashInHandByIdData, GetCashInHandByIdVariables>;
}
export const getCashInHandByIdRef: GetCashInHandByIdRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getCashInHandById(dc: DataConnect, vars: GetCashInHandByIdVariables): QueryPromise<GetCashInHandByIdData, GetCashInHandByIdVariables>;

interface GetCashInHandByIdRef {
  ...
  (dc: DataConnect, vars: GetCashInHandByIdVariables): QueryRef<GetCashInHandByIdData, GetCashInHandByIdVariables>;
}
export const getCashInHandByIdRef: GetCashInHandByIdRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getCashInHandByIdRef:
```typescript
const name = getCashInHandByIdRef.operationName;
console.log(name);
```

### Variables
The `GetCashInHandById` query requires an argument of type `GetCashInHandByIdVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetCashInHandByIdVariables {
  id: string;
}
```
### Return Type
Recall that executing the `GetCashInHandById` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetCashInHandByIdData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetCashInHandById`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getCashInHandById, GetCashInHandByIdVariables } from '@dataconnect/generated';

// The `GetCashInHandById` query requires an argument of type `GetCashInHandByIdVariables`:
const getCashInHandByIdVars: GetCashInHandByIdVariables = {
  id: ..., 
};

// Call the `getCashInHandById()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getCashInHandById(getCashInHandByIdVars);
// Variables can be defined inline as well.
const { data } = await getCashInHandById({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getCashInHandById(dataConnect, getCashInHandByIdVars);

console.log(data.cashInHand);

// Or, you can use the `Promise` API.
getCashInHandById(getCashInHandByIdVars).then((response) => {
  const data = response.data;
  console.log(data.cashInHand);
});
```

### Using `GetCashInHandById`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getCashInHandByIdRef, GetCashInHandByIdVariables } from '@dataconnect/generated';

// The `GetCashInHandById` query requires an argument of type `GetCashInHandByIdVariables`:
const getCashInHandByIdVars: GetCashInHandByIdVariables = {
  id: ..., 
};

// Call the `getCashInHandByIdRef()` function to get a reference to the query.
const ref = getCashInHandByIdRef(getCashInHandByIdVars);
// Variables can be defined inline as well.
const ref = getCashInHandByIdRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getCashInHandByIdRef(dataConnect, getCashInHandByIdVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.cashInHand);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.cashInHand);
});
```

## GetBankTransfers
You can execute the `GetBankTransfers` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getBankTransfers(): QueryPromise<GetBankTransfersData, undefined>;

interface GetBankTransfersRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetBankTransfersData, undefined>;
}
export const getBankTransfersRef: GetBankTransfersRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getBankTransfers(dc: DataConnect): QueryPromise<GetBankTransfersData, undefined>;

interface GetBankTransfersRef {
  ...
  (dc: DataConnect): QueryRef<GetBankTransfersData, undefined>;
}
export const getBankTransfersRef: GetBankTransfersRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getBankTransfersRef:
```typescript
const name = getBankTransfersRef.operationName;
console.log(name);
```

### Variables
The `GetBankTransfers` query has no variables.
### Return Type
Recall that executing the `GetBankTransfers` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetBankTransfersData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetBankTransfers`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getBankTransfers } from '@dataconnect/generated';


// Call the `getBankTransfers()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getBankTransfers();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getBankTransfers(dataConnect);

console.log(data.bankTransfers);

// Or, you can use the `Promise` API.
getBankTransfers().then((response) => {
  const data = response.data;
  console.log(data.bankTransfers);
});
```

### Using `GetBankTransfers`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getBankTransfersRef } from '@dataconnect/generated';


// Call the `getBankTransfersRef()` function to get a reference to the query.
const ref = getBankTransfersRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getBankTransfersRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.bankTransfers);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.bankTransfers);
});
```

## GetBankTransfersByBank
You can execute the `GetBankTransfersByBank` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getBankTransfersByBank(vars: GetBankTransfersByBankVariables): QueryPromise<GetBankTransfersByBankData, GetBankTransfersByBankVariables>;

interface GetBankTransfersByBankRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetBankTransfersByBankVariables): QueryRef<GetBankTransfersByBankData, GetBankTransfersByBankVariables>;
}
export const getBankTransfersByBankRef: GetBankTransfersByBankRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getBankTransfersByBank(dc: DataConnect, vars: GetBankTransfersByBankVariables): QueryPromise<GetBankTransfersByBankData, GetBankTransfersByBankVariables>;

interface GetBankTransfersByBankRef {
  ...
  (dc: DataConnect, vars: GetBankTransfersByBankVariables): QueryRef<GetBankTransfersByBankData, GetBankTransfersByBankVariables>;
}
export const getBankTransfersByBankRef: GetBankTransfersByBankRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getBankTransfersByBankRef:
```typescript
const name = getBankTransfersByBankRef.operationName;
console.log(name);
```

### Variables
The `GetBankTransfersByBank` query requires an argument of type `GetBankTransfersByBankVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetBankTransfersByBankVariables {
  bankId: string;
}
```
### Return Type
Recall that executing the `GetBankTransfersByBank` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetBankTransfersByBankData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetBankTransfersByBank`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getBankTransfersByBank, GetBankTransfersByBankVariables } from '@dataconnect/generated';

// The `GetBankTransfersByBank` query requires an argument of type `GetBankTransfersByBankVariables`:
const getBankTransfersByBankVars: GetBankTransfersByBankVariables = {
  bankId: ..., 
};

// Call the `getBankTransfersByBank()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getBankTransfersByBank(getBankTransfersByBankVars);
// Variables can be defined inline as well.
const { data } = await getBankTransfersByBank({ bankId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getBankTransfersByBank(dataConnect, getBankTransfersByBankVars);

console.log(data.bankTransfers);

// Or, you can use the `Promise` API.
getBankTransfersByBank(getBankTransfersByBankVars).then((response) => {
  const data = response.data;
  console.log(data.bankTransfers);
});
```

### Using `GetBankTransfersByBank`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getBankTransfersByBankRef, GetBankTransfersByBankVariables } from '@dataconnect/generated';

// The `GetBankTransfersByBank` query requires an argument of type `GetBankTransfersByBankVariables`:
const getBankTransfersByBankVars: GetBankTransfersByBankVariables = {
  bankId: ..., 
};

// Call the `getBankTransfersByBankRef()` function to get a reference to the query.
const ref = getBankTransfersByBankRef(getBankTransfersByBankVars);
// Variables can be defined inline as well.
const ref = getBankTransfersByBankRef({ bankId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getBankTransfersByBankRef(dataConnect, getBankTransfersByBankVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.bankTransfers);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.bankTransfers);
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

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateEmployee
You can execute the `CreateEmployee` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createEmployee(vars: CreateEmployeeVariables): MutationPromise<CreateEmployeeData, CreateEmployeeVariables>;

interface CreateEmployeeRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateEmployeeVariables): MutationRef<CreateEmployeeData, CreateEmployeeVariables>;
}
export const createEmployeeRef: CreateEmployeeRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createEmployee(dc: DataConnect, vars: CreateEmployeeVariables): MutationPromise<CreateEmployeeData, CreateEmployeeVariables>;

interface CreateEmployeeRef {
  ...
  (dc: DataConnect, vars: CreateEmployeeVariables): MutationRef<CreateEmployeeData, CreateEmployeeVariables>;
}
export const createEmployeeRef: CreateEmployeeRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createEmployeeRef:
```typescript
const name = createEmployeeRef.operationName;
console.log(name);
```

### Variables
The `CreateEmployee` mutation requires an argument of type `CreateEmployeeVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `CreateEmployee` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateEmployeeData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateEmployeeData {
  employee_insert: Employee_Key;
}
```
### Using `CreateEmployee`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createEmployee, CreateEmployeeVariables } from '@dataconnect/generated';

// The `CreateEmployee` mutation requires an argument of type `CreateEmployeeVariables`:
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

// Call the `createEmployee()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createEmployee(createEmployeeVars);
// Variables can be defined inline as well.
const { data } = await createEmployee({ id: ..., name: ..., position: ..., salary: ..., phone: ..., email: ..., joinDate: ..., status: ..., location: ..., accountNumber: ..., bankName: ..., accountTitle: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createEmployee(dataConnect, createEmployeeVars);

console.log(data.employee_insert);

// Or, you can use the `Promise` API.
createEmployee(createEmployeeVars).then((response) => {
  const data = response.data;
  console.log(data.employee_insert);
});
```

### Using `CreateEmployee`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createEmployeeRef, CreateEmployeeVariables } from '@dataconnect/generated';

// The `CreateEmployee` mutation requires an argument of type `CreateEmployeeVariables`:
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

// Call the `createEmployeeRef()` function to get a reference to the mutation.
const ref = createEmployeeRef(createEmployeeVars);
// Variables can be defined inline as well.
const ref = createEmployeeRef({ id: ..., name: ..., position: ..., salary: ..., phone: ..., email: ..., joinDate: ..., status: ..., location: ..., accountNumber: ..., bankName: ..., accountTitle: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createEmployeeRef(dataConnect, createEmployeeVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.employee_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.employee_insert);
});
```

## UpdateEmployee
You can execute the `UpdateEmployee` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateEmployee(vars: UpdateEmployeeVariables): MutationPromise<UpdateEmployeeData, UpdateEmployeeVariables>;

interface UpdateEmployeeRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateEmployeeVariables): MutationRef<UpdateEmployeeData, UpdateEmployeeVariables>;
}
export const updateEmployeeRef: UpdateEmployeeRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateEmployee(dc: DataConnect, vars: UpdateEmployeeVariables): MutationPromise<UpdateEmployeeData, UpdateEmployeeVariables>;

interface UpdateEmployeeRef {
  ...
  (dc: DataConnect, vars: UpdateEmployeeVariables): MutationRef<UpdateEmployeeData, UpdateEmployeeVariables>;
}
export const updateEmployeeRef: UpdateEmployeeRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateEmployeeRef:
```typescript
const name = updateEmployeeRef.operationName;
console.log(name);
```

### Variables
The `UpdateEmployee` mutation requires an argument of type `UpdateEmployeeVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `UpdateEmployee` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateEmployeeData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateEmployeeData {
  employee_update?: Employee_Key | null;
}
```
### Using `UpdateEmployee`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateEmployee, UpdateEmployeeVariables } from '@dataconnect/generated';

// The `UpdateEmployee` mutation requires an argument of type `UpdateEmployeeVariables`:
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

// Call the `updateEmployee()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateEmployee(updateEmployeeVars);
// Variables can be defined inline as well.
const { data } = await updateEmployee({ id: ..., name: ..., position: ..., salary: ..., phone: ..., email: ..., joinDate: ..., status: ..., location: ..., accountNumber: ..., bankName: ..., accountTitle: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateEmployee(dataConnect, updateEmployeeVars);

console.log(data.employee_update);

// Or, you can use the `Promise` API.
updateEmployee(updateEmployeeVars).then((response) => {
  const data = response.data;
  console.log(data.employee_update);
});
```

### Using `UpdateEmployee`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateEmployeeRef, UpdateEmployeeVariables } from '@dataconnect/generated';

// The `UpdateEmployee` mutation requires an argument of type `UpdateEmployeeVariables`:
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

// Call the `updateEmployeeRef()` function to get a reference to the mutation.
const ref = updateEmployeeRef(updateEmployeeVars);
// Variables can be defined inline as well.
const ref = updateEmployeeRef({ id: ..., name: ..., position: ..., salary: ..., phone: ..., email: ..., joinDate: ..., status: ..., location: ..., accountNumber: ..., bankName: ..., accountTitle: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateEmployeeRef(dataConnect, updateEmployeeVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.employee_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.employee_update);
});
```

## DeleteEmployee
You can execute the `DeleteEmployee` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteEmployee(vars: DeleteEmployeeVariables): MutationPromise<DeleteEmployeeData, DeleteEmployeeVariables>;

interface DeleteEmployeeRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteEmployeeVariables): MutationRef<DeleteEmployeeData, DeleteEmployeeVariables>;
}
export const deleteEmployeeRef: DeleteEmployeeRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteEmployee(dc: DataConnect, vars: DeleteEmployeeVariables): MutationPromise<DeleteEmployeeData, DeleteEmployeeVariables>;

interface DeleteEmployeeRef {
  ...
  (dc: DataConnect, vars: DeleteEmployeeVariables): MutationRef<DeleteEmployeeData, DeleteEmployeeVariables>;
}
export const deleteEmployeeRef: DeleteEmployeeRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteEmployeeRef:
```typescript
const name = deleteEmployeeRef.operationName;
console.log(name);
```

### Variables
The `DeleteEmployee` mutation requires an argument of type `DeleteEmployeeVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteEmployeeVariables {
  id: string;
}
```
### Return Type
Recall that executing the `DeleteEmployee` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteEmployeeData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteEmployeeData {
  employee_delete?: Employee_Key | null;
}
```
### Using `DeleteEmployee`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteEmployee, DeleteEmployeeVariables } from '@dataconnect/generated';

// The `DeleteEmployee` mutation requires an argument of type `DeleteEmployeeVariables`:
const deleteEmployeeVars: DeleteEmployeeVariables = {
  id: ..., 
};

// Call the `deleteEmployee()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteEmployee(deleteEmployeeVars);
// Variables can be defined inline as well.
const { data } = await deleteEmployee({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteEmployee(dataConnect, deleteEmployeeVars);

console.log(data.employee_delete);

// Or, you can use the `Promise` API.
deleteEmployee(deleteEmployeeVars).then((response) => {
  const data = response.data;
  console.log(data.employee_delete);
});
```

### Using `DeleteEmployee`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteEmployeeRef, DeleteEmployeeVariables } from '@dataconnect/generated';

// The `DeleteEmployee` mutation requires an argument of type `DeleteEmployeeVariables`:
const deleteEmployeeVars: DeleteEmployeeVariables = {
  id: ..., 
};

// Call the `deleteEmployeeRef()` function to get a reference to the mutation.
const ref = deleteEmployeeRef(deleteEmployeeVars);
// Variables can be defined inline as well.
const ref = deleteEmployeeRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteEmployeeRef(dataConnect, deleteEmployeeVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.employee_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.employee_delete);
});
```

## CreateBank
You can execute the `CreateBank` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createBank(vars: CreateBankVariables): MutationPromise<CreateBankData, CreateBankVariables>;

interface CreateBankRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateBankVariables): MutationRef<CreateBankData, CreateBankVariables>;
}
export const createBankRef: CreateBankRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createBank(dc: DataConnect, vars: CreateBankVariables): MutationPromise<CreateBankData, CreateBankVariables>;

interface CreateBankRef {
  ...
  (dc: DataConnect, vars: CreateBankVariables): MutationRef<CreateBankData, CreateBankVariables>;
}
export const createBankRef: CreateBankRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createBankRef:
```typescript
const name = createBankRef.operationName;
console.log(name);
```

### Variables
The `CreateBank` mutation requires an argument of type `CreateBankVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `CreateBank` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateBankData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateBankData {
  bank_insert: Bank_Key;
}
```
### Using `CreateBank`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createBank, CreateBankVariables } from '@dataconnect/generated';

// The `CreateBank` mutation requires an argument of type `CreateBankVariables`:
const createBankVars: CreateBankVariables = {
  id: ..., 
  name: ..., // optional
  accountNumber: ..., // optional
  balance: ..., // optional
  createdAt: ..., // optional
  updatedAt: ..., // optional
};

// Call the `createBank()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createBank(createBankVars);
// Variables can be defined inline as well.
const { data } = await createBank({ id: ..., name: ..., accountNumber: ..., balance: ..., createdAt: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createBank(dataConnect, createBankVars);

console.log(data.bank_insert);

// Or, you can use the `Promise` API.
createBank(createBankVars).then((response) => {
  const data = response.data;
  console.log(data.bank_insert);
});
```

### Using `CreateBank`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createBankRef, CreateBankVariables } from '@dataconnect/generated';

// The `CreateBank` mutation requires an argument of type `CreateBankVariables`:
const createBankVars: CreateBankVariables = {
  id: ..., 
  name: ..., // optional
  accountNumber: ..., // optional
  balance: ..., // optional
  createdAt: ..., // optional
  updatedAt: ..., // optional
};

// Call the `createBankRef()` function to get a reference to the mutation.
const ref = createBankRef(createBankVars);
// Variables can be defined inline as well.
const ref = createBankRef({ id: ..., name: ..., accountNumber: ..., balance: ..., createdAt: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createBankRef(dataConnect, createBankVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.bank_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.bank_insert);
});
```

## UpdateBank
You can execute the `UpdateBank` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateBank(vars: UpdateBankVariables): MutationPromise<UpdateBankData, UpdateBankVariables>;

interface UpdateBankRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateBankVariables): MutationRef<UpdateBankData, UpdateBankVariables>;
}
export const updateBankRef: UpdateBankRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateBank(dc: DataConnect, vars: UpdateBankVariables): MutationPromise<UpdateBankData, UpdateBankVariables>;

interface UpdateBankRef {
  ...
  (dc: DataConnect, vars: UpdateBankVariables): MutationRef<UpdateBankData, UpdateBankVariables>;
}
export const updateBankRef: UpdateBankRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateBankRef:
```typescript
const name = updateBankRef.operationName;
console.log(name);
```

### Variables
The `UpdateBank` mutation requires an argument of type `UpdateBankVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateBankVariables {
  id: string;
  name?: string | null;
  accountNumber?: string | null;
  balance?: number | null;
  updatedAt?: string | null;
}
```
### Return Type
Recall that executing the `UpdateBank` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateBankData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateBankData {
  bank_update?: Bank_Key | null;
}
```
### Using `UpdateBank`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateBank, UpdateBankVariables } from '@dataconnect/generated';

// The `UpdateBank` mutation requires an argument of type `UpdateBankVariables`:
const updateBankVars: UpdateBankVariables = {
  id: ..., 
  name: ..., // optional
  accountNumber: ..., // optional
  balance: ..., // optional
  updatedAt: ..., // optional
};

// Call the `updateBank()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateBank(updateBankVars);
// Variables can be defined inline as well.
const { data } = await updateBank({ id: ..., name: ..., accountNumber: ..., balance: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateBank(dataConnect, updateBankVars);

console.log(data.bank_update);

// Or, you can use the `Promise` API.
updateBank(updateBankVars).then((response) => {
  const data = response.data;
  console.log(data.bank_update);
});
```

### Using `UpdateBank`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateBankRef, UpdateBankVariables } from '@dataconnect/generated';

// The `UpdateBank` mutation requires an argument of type `UpdateBankVariables`:
const updateBankVars: UpdateBankVariables = {
  id: ..., 
  name: ..., // optional
  accountNumber: ..., // optional
  balance: ..., // optional
  updatedAt: ..., // optional
};

// Call the `updateBankRef()` function to get a reference to the mutation.
const ref = updateBankRef(updateBankVars);
// Variables can be defined inline as well.
const ref = updateBankRef({ id: ..., name: ..., accountNumber: ..., balance: ..., updatedAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateBankRef(dataConnect, updateBankVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.bank_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.bank_update);
});
```

## DeleteBank
You can execute the `DeleteBank` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteBank(vars: DeleteBankVariables): MutationPromise<DeleteBankData, DeleteBankVariables>;

interface DeleteBankRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteBankVariables): MutationRef<DeleteBankData, DeleteBankVariables>;
}
export const deleteBankRef: DeleteBankRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteBank(dc: DataConnect, vars: DeleteBankVariables): MutationPromise<DeleteBankData, DeleteBankVariables>;

interface DeleteBankRef {
  ...
  (dc: DataConnect, vars: DeleteBankVariables): MutationRef<DeleteBankData, DeleteBankVariables>;
}
export const deleteBankRef: DeleteBankRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteBankRef:
```typescript
const name = deleteBankRef.operationName;
console.log(name);
```

### Variables
The `DeleteBank` mutation requires an argument of type `DeleteBankVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteBankVariables {
  id: string;
}
```
### Return Type
Recall that executing the `DeleteBank` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteBankData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteBankData {
  bank_delete?: Bank_Key | null;
}
```
### Using `DeleteBank`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteBank, DeleteBankVariables } from '@dataconnect/generated';

// The `DeleteBank` mutation requires an argument of type `DeleteBankVariables`:
const deleteBankVars: DeleteBankVariables = {
  id: ..., 
};

// Call the `deleteBank()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteBank(deleteBankVars);
// Variables can be defined inline as well.
const { data } = await deleteBank({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteBank(dataConnect, deleteBankVars);

console.log(data.bank_delete);

// Or, you can use the `Promise` API.
deleteBank(deleteBankVars).then((response) => {
  const data = response.data;
  console.log(data.bank_delete);
});
```

### Using `DeleteBank`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteBankRef, DeleteBankVariables } from '@dataconnect/generated';

// The `DeleteBank` mutation requires an argument of type `DeleteBankVariables`:
const deleteBankVars: DeleteBankVariables = {
  id: ..., 
};

// Call the `deleteBankRef()` function to get a reference to the mutation.
const ref = deleteBankRef(deleteBankVars);
// Variables can be defined inline as well.
const ref = deleteBankRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteBankRef(dataConnect, deleteBankVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.bank_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.bank_delete);
});
```

## CreateCashInHand
You can execute the `CreateCashInHand` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createCashInHand(vars: CreateCashInHandVariables): MutationPromise<CreateCashInHandData, CreateCashInHandVariables>;

interface CreateCashInHandRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateCashInHandVariables): MutationRef<CreateCashInHandData, CreateCashInHandVariables>;
}
export const createCashInHandRef: CreateCashInHandRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createCashInHand(dc: DataConnect, vars: CreateCashInHandVariables): MutationPromise<CreateCashInHandData, CreateCashInHandVariables>;

interface CreateCashInHandRef {
  ...
  (dc: DataConnect, vars: CreateCashInHandVariables): MutationRef<CreateCashInHandData, CreateCashInHandVariables>;
}
export const createCashInHandRef: CreateCashInHandRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createCashInHandRef:
```typescript
const name = createCashInHandRef.operationName;
console.log(name);
```

### Variables
The `CreateCashInHand` mutation requires an argument of type `CreateCashInHandVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateCashInHandVariables {
  id: string;
  location?: string | null;
  balance?: number | null;
  lastUpdated?: string | null;
  updatedBy?: string | null;
}
```
### Return Type
Recall that executing the `CreateCashInHand` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateCashInHandData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateCashInHandData {
  cashInHand_insert: CashInHand_Key;
}
```
### Using `CreateCashInHand`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createCashInHand, CreateCashInHandVariables } from '@dataconnect/generated';

// The `CreateCashInHand` mutation requires an argument of type `CreateCashInHandVariables`:
const createCashInHandVars: CreateCashInHandVariables = {
  id: ..., 
  location: ..., // optional
  balance: ..., // optional
  lastUpdated: ..., // optional
  updatedBy: ..., // optional
};

// Call the `createCashInHand()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createCashInHand(createCashInHandVars);
// Variables can be defined inline as well.
const { data } = await createCashInHand({ id: ..., location: ..., balance: ..., lastUpdated: ..., updatedBy: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createCashInHand(dataConnect, createCashInHandVars);

console.log(data.cashInHand_insert);

// Or, you can use the `Promise` API.
createCashInHand(createCashInHandVars).then((response) => {
  const data = response.data;
  console.log(data.cashInHand_insert);
});
```

### Using `CreateCashInHand`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createCashInHandRef, CreateCashInHandVariables } from '@dataconnect/generated';

// The `CreateCashInHand` mutation requires an argument of type `CreateCashInHandVariables`:
const createCashInHandVars: CreateCashInHandVariables = {
  id: ..., 
  location: ..., // optional
  balance: ..., // optional
  lastUpdated: ..., // optional
  updatedBy: ..., // optional
};

// Call the `createCashInHandRef()` function to get a reference to the mutation.
const ref = createCashInHandRef(createCashInHandVars);
// Variables can be defined inline as well.
const ref = createCashInHandRef({ id: ..., location: ..., balance: ..., lastUpdated: ..., updatedBy: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createCashInHandRef(dataConnect, createCashInHandVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.cashInHand_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.cashInHand_insert);
});
```

## UpdateCashInHand
You can execute the `UpdateCashInHand` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateCashInHand(vars: UpdateCashInHandVariables): MutationPromise<UpdateCashInHandData, UpdateCashInHandVariables>;

interface UpdateCashInHandRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateCashInHandVariables): MutationRef<UpdateCashInHandData, UpdateCashInHandVariables>;
}
export const updateCashInHandRef: UpdateCashInHandRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateCashInHand(dc: DataConnect, vars: UpdateCashInHandVariables): MutationPromise<UpdateCashInHandData, UpdateCashInHandVariables>;

interface UpdateCashInHandRef {
  ...
  (dc: DataConnect, vars: UpdateCashInHandVariables): MutationRef<UpdateCashInHandData, UpdateCashInHandVariables>;
}
export const updateCashInHandRef: UpdateCashInHandRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateCashInHandRef:
```typescript
const name = updateCashInHandRef.operationName;
console.log(name);
```

### Variables
The `UpdateCashInHand` mutation requires an argument of type `UpdateCashInHandVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateCashInHandVariables {
  id: string;
  balance?: number | null;
  lastUpdated?: string | null;
  updatedBy?: string | null;
}
```
### Return Type
Recall that executing the `UpdateCashInHand` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateCashInHandData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateCashInHandData {
  cashInHand_update?: CashInHand_Key | null;
}
```
### Using `UpdateCashInHand`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateCashInHand, UpdateCashInHandVariables } from '@dataconnect/generated';

// The `UpdateCashInHand` mutation requires an argument of type `UpdateCashInHandVariables`:
const updateCashInHandVars: UpdateCashInHandVariables = {
  id: ..., 
  balance: ..., // optional
  lastUpdated: ..., // optional
  updatedBy: ..., // optional
};

// Call the `updateCashInHand()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateCashInHand(updateCashInHandVars);
// Variables can be defined inline as well.
const { data } = await updateCashInHand({ id: ..., balance: ..., lastUpdated: ..., updatedBy: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateCashInHand(dataConnect, updateCashInHandVars);

console.log(data.cashInHand_update);

// Or, you can use the `Promise` API.
updateCashInHand(updateCashInHandVars).then((response) => {
  const data = response.data;
  console.log(data.cashInHand_update);
});
```

### Using `UpdateCashInHand`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateCashInHandRef, UpdateCashInHandVariables } from '@dataconnect/generated';

// The `UpdateCashInHand` mutation requires an argument of type `UpdateCashInHandVariables`:
const updateCashInHandVars: UpdateCashInHandVariables = {
  id: ..., 
  balance: ..., // optional
  lastUpdated: ..., // optional
  updatedBy: ..., // optional
};

// Call the `updateCashInHandRef()` function to get a reference to the mutation.
const ref = updateCashInHandRef(updateCashInHandVars);
// Variables can be defined inline as well.
const ref = updateCashInHandRef({ id: ..., balance: ..., lastUpdated: ..., updatedBy: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateCashInHandRef(dataConnect, updateCashInHandVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.cashInHand_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.cashInHand_update);
});
```

## DeleteCashInHand
You can execute the `DeleteCashInHand` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteCashInHand(vars: DeleteCashInHandVariables): MutationPromise<DeleteCashInHandData, DeleteCashInHandVariables>;

interface DeleteCashInHandRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteCashInHandVariables): MutationRef<DeleteCashInHandData, DeleteCashInHandVariables>;
}
export const deleteCashInHandRef: DeleteCashInHandRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteCashInHand(dc: DataConnect, vars: DeleteCashInHandVariables): MutationPromise<DeleteCashInHandData, DeleteCashInHandVariables>;

interface DeleteCashInHandRef {
  ...
  (dc: DataConnect, vars: DeleteCashInHandVariables): MutationRef<DeleteCashInHandData, DeleteCashInHandVariables>;
}
export const deleteCashInHandRef: DeleteCashInHandRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteCashInHandRef:
```typescript
const name = deleteCashInHandRef.operationName;
console.log(name);
```

### Variables
The `DeleteCashInHand` mutation requires an argument of type `DeleteCashInHandVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteCashInHandVariables {
  id: string;
}
```
### Return Type
Recall that executing the `DeleteCashInHand` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteCashInHandData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteCashInHandData {
  cashInHand_delete?: CashInHand_Key | null;
}
```
### Using `DeleteCashInHand`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteCashInHand, DeleteCashInHandVariables } from '@dataconnect/generated';

// The `DeleteCashInHand` mutation requires an argument of type `DeleteCashInHandVariables`:
const deleteCashInHandVars: DeleteCashInHandVariables = {
  id: ..., 
};

// Call the `deleteCashInHand()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteCashInHand(deleteCashInHandVars);
// Variables can be defined inline as well.
const { data } = await deleteCashInHand({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteCashInHand(dataConnect, deleteCashInHandVars);

console.log(data.cashInHand_delete);

// Or, you can use the `Promise` API.
deleteCashInHand(deleteCashInHandVars).then((response) => {
  const data = response.data;
  console.log(data.cashInHand_delete);
});
```

### Using `DeleteCashInHand`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteCashInHandRef, DeleteCashInHandVariables } from '@dataconnect/generated';

// The `DeleteCashInHand` mutation requires an argument of type `DeleteCashInHandVariables`:
const deleteCashInHandVars: DeleteCashInHandVariables = {
  id: ..., 
};

// Call the `deleteCashInHandRef()` function to get a reference to the mutation.
const ref = deleteCashInHandRef(deleteCashInHandVars);
// Variables can be defined inline as well.
const ref = deleteCashInHandRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteCashInHandRef(dataConnect, deleteCashInHandVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.cashInHand_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.cashInHand_delete);
});
```

## CreateBankTransfer
You can execute the `CreateBankTransfer` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createBankTransfer(vars: CreateBankTransferVariables): MutationPromise<CreateBankTransferData, CreateBankTransferVariables>;

interface CreateBankTransferRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateBankTransferVariables): MutationRef<CreateBankTransferData, CreateBankTransferVariables>;
}
export const createBankTransferRef: CreateBankTransferRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createBankTransfer(dc: DataConnect, vars: CreateBankTransferVariables): MutationPromise<CreateBankTransferData, CreateBankTransferVariables>;

interface CreateBankTransferRef {
  ...
  (dc: DataConnect, vars: CreateBankTransferVariables): MutationRef<CreateBankTransferData, CreateBankTransferVariables>;
}
export const createBankTransferRef: CreateBankTransferRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createBankTransferRef:
```typescript
const name = createBankTransferRef.operationName;
console.log(name);
```

### Variables
The `CreateBankTransfer` mutation requires an argument of type `CreateBankTransferVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `CreateBankTransfer` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateBankTransferData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateBankTransferData {
  bankTransfer_insert: BankTransfer_Key;
}
```
### Using `CreateBankTransfer`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createBankTransfer, CreateBankTransferVariables } from '@dataconnect/generated';

// The `CreateBankTransfer` mutation requires an argument of type `CreateBankTransferVariables`:
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

// Call the `createBankTransfer()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createBankTransfer(createBankTransferVars);
// Variables can be defined inline as well.
const { data } = await createBankTransfer({ id: ..., date: ..., fromBankId: ..., fromBankName: ..., toBankId: ..., toBankName: ..., amount: ..., note: ..., createdAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createBankTransfer(dataConnect, createBankTransferVars);

console.log(data.bankTransfer_insert);

// Or, you can use the `Promise` API.
createBankTransfer(createBankTransferVars).then((response) => {
  const data = response.data;
  console.log(data.bankTransfer_insert);
});
```

### Using `CreateBankTransfer`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createBankTransferRef, CreateBankTransferVariables } from '@dataconnect/generated';

// The `CreateBankTransfer` mutation requires an argument of type `CreateBankTransferVariables`:
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

// Call the `createBankTransferRef()` function to get a reference to the mutation.
const ref = createBankTransferRef(createBankTransferVars);
// Variables can be defined inline as well.
const ref = createBankTransferRef({ id: ..., date: ..., fromBankId: ..., fromBankName: ..., toBankId: ..., toBankName: ..., amount: ..., note: ..., createdAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createBankTransferRef(dataConnect, createBankTransferVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.bankTransfer_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.bankTransfer_insert);
});
```

## DeleteBankTransfer
You can execute the `DeleteBankTransfer` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteBankTransfer(vars: DeleteBankTransferVariables): MutationPromise<DeleteBankTransferData, DeleteBankTransferVariables>;

interface DeleteBankTransferRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteBankTransferVariables): MutationRef<DeleteBankTransferData, DeleteBankTransferVariables>;
}
export const deleteBankTransferRef: DeleteBankTransferRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteBankTransfer(dc: DataConnect, vars: DeleteBankTransferVariables): MutationPromise<DeleteBankTransferData, DeleteBankTransferVariables>;

interface DeleteBankTransferRef {
  ...
  (dc: DataConnect, vars: DeleteBankTransferVariables): MutationRef<DeleteBankTransferData, DeleteBankTransferVariables>;
}
export const deleteBankTransferRef: DeleteBankTransferRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteBankTransferRef:
```typescript
const name = deleteBankTransferRef.operationName;
console.log(name);
```

### Variables
The `DeleteBankTransfer` mutation requires an argument of type `DeleteBankTransferVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteBankTransferVariables {
  id: string;
}
```
### Return Type
Recall that executing the `DeleteBankTransfer` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteBankTransferData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteBankTransferData {
  bankTransfer_delete?: BankTransfer_Key | null;
}
```
### Using `DeleteBankTransfer`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteBankTransfer, DeleteBankTransferVariables } from '@dataconnect/generated';

// The `DeleteBankTransfer` mutation requires an argument of type `DeleteBankTransferVariables`:
const deleteBankTransferVars: DeleteBankTransferVariables = {
  id: ..., 
};

// Call the `deleteBankTransfer()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteBankTransfer(deleteBankTransferVars);
// Variables can be defined inline as well.
const { data } = await deleteBankTransfer({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteBankTransfer(dataConnect, deleteBankTransferVars);

console.log(data.bankTransfer_delete);

// Or, you can use the `Promise` API.
deleteBankTransfer(deleteBankTransferVars).then((response) => {
  const data = response.data;
  console.log(data.bankTransfer_delete);
});
```

### Using `DeleteBankTransfer`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteBankTransferRef, DeleteBankTransferVariables } from '@dataconnect/generated';

// The `DeleteBankTransfer` mutation requires an argument of type `DeleteBankTransferVariables`:
const deleteBankTransferVars: DeleteBankTransferVariables = {
  id: ..., 
};

// Call the `deleteBankTransferRef()` function to get a reference to the mutation.
const ref = deleteBankTransferRef(deleteBankTransferVars);
// Variables can be defined inline as well.
const ref = deleteBankTransferRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteBankTransferRef(dataConnect, deleteBankTransferVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.bankTransfer_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.bankTransfer_delete);
});
```

