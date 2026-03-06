# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `banking`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`banking/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*listTransfers*](#listtransfers)
  - [*getTransferById*](#gettransferbyid)
  - [*listBanks*](#listbanks)
  - [*getBankById*](#getbankbyid)
  - [*listCashInHand*](#listcashinhand)
  - [*getCashInHandById*](#getcashinhandbyid)
- [**Mutations**](#mutations)
  - [*TransferInsert*](#transferinsert)
  - [*TransferDelete*](#transferdelete)
  - [*BankInsert*](#bankinsert)
  - [*BankUpdate*](#bankupdate)
  - [*BankDelete*](#bankdelete)
  - [*UpdateBankBalance*](#updatebankbalance)
  - [*CashInHandInsert*](#cashinhandinsert)
  - [*CashInHandDelete*](#cashinhanddelete)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `banking`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@erp-system/banking` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@erp-system/banking';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@erp-system/banking';

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

Below are examples of how to use the `banking` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## listTransfers
You can execute the `listTransfers` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [banking/index.d.ts](./index.d.ts):
```typescript
listTransfers(vars?: ListTransfersVariables): QueryPromise<ListTransfersData, ListTransfersVariables>;

interface ListTransfersRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListTransfersVariables): QueryRef<ListTransfersData, ListTransfersVariables>;
}
export const listTransfersRef: ListTransfersRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listTransfers(dc: DataConnect, vars?: ListTransfersVariables): QueryPromise<ListTransfersData, ListTransfersVariables>;

interface ListTransfersRef {
  ...
  (dc: DataConnect, vars?: ListTransfersVariables): QueryRef<ListTransfersData, ListTransfersVariables>;
}
export const listTransfersRef: ListTransfersRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listTransfersRef:
```typescript
const name = listTransfersRef.operationName;
console.log(name);
```

### Variables
The `listTransfers` query has an optional argument of type `ListTransfersVariables`, which is defined in [banking/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListTransfersVariables {
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that executing the `listTransfers` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListTransfersData`, which is defined in [banking/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `listTransfers`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listTransfers, ListTransfersVariables } from '@erp-system/banking';

// The `listTransfers` query has an optional argument of type `ListTransfersVariables`:
const listTransfersVars: ListTransfersVariables = {
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listTransfers()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listTransfers(listTransfersVars);
// Variables can be defined inline as well.
const { data } = await listTransfers({ limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `ListTransfersVariables` argument.
const { data } = await listTransfers();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listTransfers(dataConnect, listTransfersVars);

console.log(data.bankTransfers);

// Or, you can use the `Promise` API.
listTransfers(listTransfersVars).then((response) => {
  const data = response.data;
  console.log(data.bankTransfers);
});
```

### Using `listTransfers`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listTransfersRef, ListTransfersVariables } from '@erp-system/banking';

// The `listTransfers` query has an optional argument of type `ListTransfersVariables`:
const listTransfersVars: ListTransfersVariables = {
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listTransfersRef()` function to get a reference to the query.
const ref = listTransfersRef(listTransfersVars);
// Variables can be defined inline as well.
const ref = listTransfersRef({ limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `ListTransfersVariables` argument.
const ref = listTransfersRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listTransfersRef(dataConnect, listTransfersVars);

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

## getTransferById
You can execute the `getTransferById` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [banking/index.d.ts](./index.d.ts):
```typescript
getTransferById(vars: GetTransferByIdVariables): QueryPromise<GetTransferByIdData, GetTransferByIdVariables>;

interface GetTransferByIdRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetTransferByIdVariables): QueryRef<GetTransferByIdData, GetTransferByIdVariables>;
}
export const getTransferByIdRef: GetTransferByIdRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getTransferById(dc: DataConnect, vars: GetTransferByIdVariables): QueryPromise<GetTransferByIdData, GetTransferByIdVariables>;

interface GetTransferByIdRef {
  ...
  (dc: DataConnect, vars: GetTransferByIdVariables): QueryRef<GetTransferByIdData, GetTransferByIdVariables>;
}
export const getTransferByIdRef: GetTransferByIdRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getTransferByIdRef:
```typescript
const name = getTransferByIdRef.operationName;
console.log(name);
```

### Variables
The `getTransferById` query requires an argument of type `GetTransferByIdVariables`, which is defined in [banking/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetTransferByIdVariables {
  id: string;
}
```
### Return Type
Recall that executing the `getTransferById` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetTransferByIdData`, which is defined in [banking/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `getTransferById`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getTransferById, GetTransferByIdVariables } from '@erp-system/banking';

// The `getTransferById` query requires an argument of type `GetTransferByIdVariables`:
const getTransferByIdVars: GetTransferByIdVariables = {
  id: ..., 
};

// Call the `getTransferById()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getTransferById(getTransferByIdVars);
// Variables can be defined inline as well.
const { data } = await getTransferById({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getTransferById(dataConnect, getTransferByIdVars);

console.log(data.bankTransfer);

// Or, you can use the `Promise` API.
getTransferById(getTransferByIdVars).then((response) => {
  const data = response.data;
  console.log(data.bankTransfer);
});
```

### Using `getTransferById`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getTransferByIdRef, GetTransferByIdVariables } from '@erp-system/banking';

// The `getTransferById` query requires an argument of type `GetTransferByIdVariables`:
const getTransferByIdVars: GetTransferByIdVariables = {
  id: ..., 
};

// Call the `getTransferByIdRef()` function to get a reference to the query.
const ref = getTransferByIdRef(getTransferByIdVars);
// Variables can be defined inline as well.
const ref = getTransferByIdRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getTransferByIdRef(dataConnect, getTransferByIdVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.bankTransfer);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.bankTransfer);
});
```

## listBanks
You can execute the `listBanks` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [banking/index.d.ts](./index.d.ts):
```typescript
listBanks(vars?: ListBanksVariables): QueryPromise<ListBanksData, ListBanksVariables>;

interface ListBanksRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListBanksVariables): QueryRef<ListBanksData, ListBanksVariables>;
}
export const listBanksRef: ListBanksRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listBanks(dc: DataConnect, vars?: ListBanksVariables): QueryPromise<ListBanksData, ListBanksVariables>;

interface ListBanksRef {
  ...
  (dc: DataConnect, vars?: ListBanksVariables): QueryRef<ListBanksData, ListBanksVariables>;
}
export const listBanksRef: ListBanksRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listBanksRef:
```typescript
const name = listBanksRef.operationName;
console.log(name);
```

### Variables
The `listBanks` query has an optional argument of type `ListBanksVariables`, which is defined in [banking/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListBanksVariables {
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that executing the `listBanks` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListBanksData`, which is defined in [banking/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `listBanks`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listBanks, ListBanksVariables } from '@erp-system/banking';

// The `listBanks` query has an optional argument of type `ListBanksVariables`:
const listBanksVars: ListBanksVariables = {
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listBanks()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listBanks(listBanksVars);
// Variables can be defined inline as well.
const { data } = await listBanks({ limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `ListBanksVariables` argument.
const { data } = await listBanks();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listBanks(dataConnect, listBanksVars);

console.log(data.banks);

// Or, you can use the `Promise` API.
listBanks(listBanksVars).then((response) => {
  const data = response.data;
  console.log(data.banks);
});
```

### Using `listBanks`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listBanksRef, ListBanksVariables } from '@erp-system/banking';

// The `listBanks` query has an optional argument of type `ListBanksVariables`:
const listBanksVars: ListBanksVariables = {
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listBanksRef()` function to get a reference to the query.
const ref = listBanksRef(listBanksVars);
// Variables can be defined inline as well.
const ref = listBanksRef({ limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `ListBanksVariables` argument.
const ref = listBanksRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listBanksRef(dataConnect, listBanksVars);

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

## getBankById
You can execute the `getBankById` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [banking/index.d.ts](./index.d.ts):
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
The `getBankById` query requires an argument of type `GetBankByIdVariables`, which is defined in [banking/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetBankByIdVariables {
  id: string;
}
```
### Return Type
Recall that executing the `getBankById` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetBankByIdData`, which is defined in [banking/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `getBankById`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getBankById, GetBankByIdVariables } from '@erp-system/banking';

// The `getBankById` query requires an argument of type `GetBankByIdVariables`:
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

### Using `getBankById`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getBankByIdRef, GetBankByIdVariables } from '@erp-system/banking';

// The `getBankById` query requires an argument of type `GetBankByIdVariables`:
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

## listCashInHand
You can execute the `listCashInHand` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [banking/index.d.ts](./index.d.ts):
```typescript
listCashInHand(vars?: ListCashInHandVariables): QueryPromise<ListCashInHandData, ListCashInHandVariables>;

interface ListCashInHandRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListCashInHandVariables): QueryRef<ListCashInHandData, ListCashInHandVariables>;
}
export const listCashInHandRef: ListCashInHandRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listCashInHand(dc: DataConnect, vars?: ListCashInHandVariables): QueryPromise<ListCashInHandData, ListCashInHandVariables>;

interface ListCashInHandRef {
  ...
  (dc: DataConnect, vars?: ListCashInHandVariables): QueryRef<ListCashInHandData, ListCashInHandVariables>;
}
export const listCashInHandRef: ListCashInHandRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listCashInHandRef:
```typescript
const name = listCashInHandRef.operationName;
console.log(name);
```

### Variables
The `listCashInHand` query has an optional argument of type `ListCashInHandVariables`, which is defined in [banking/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListCashInHandVariables {
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that executing the `listCashInHand` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListCashInHandData`, which is defined in [banking/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `listCashInHand`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listCashInHand, ListCashInHandVariables } from '@erp-system/banking';

// The `listCashInHand` query has an optional argument of type `ListCashInHandVariables`:
const listCashInHandVars: ListCashInHandVariables = {
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listCashInHand()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listCashInHand(listCashInHandVars);
// Variables can be defined inline as well.
const { data } = await listCashInHand({ limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `ListCashInHandVariables` argument.
const { data } = await listCashInHand();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listCashInHand(dataConnect, listCashInHandVars);

console.log(data.cashInHands);

// Or, you can use the `Promise` API.
listCashInHand(listCashInHandVars).then((response) => {
  const data = response.data;
  console.log(data.cashInHands);
});
```

### Using `listCashInHand`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listCashInHandRef, ListCashInHandVariables } from '@erp-system/banking';

// The `listCashInHand` query has an optional argument of type `ListCashInHandVariables`:
const listCashInHandVars: ListCashInHandVariables = {
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listCashInHandRef()` function to get a reference to the query.
const ref = listCashInHandRef(listCashInHandVars);
// Variables can be defined inline as well.
const ref = listCashInHandRef({ limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `ListCashInHandVariables` argument.
const ref = listCashInHandRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listCashInHandRef(dataConnect, listCashInHandVars);

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

## getCashInHandById
You can execute the `getCashInHandById` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [banking/index.d.ts](./index.d.ts):
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
The `getCashInHandById` query requires an argument of type `GetCashInHandByIdVariables`, which is defined in [banking/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetCashInHandByIdVariables {
  id: string;
}
```
### Return Type
Recall that executing the `getCashInHandById` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetCashInHandByIdData`, which is defined in [banking/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `getCashInHandById`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getCashInHandById, GetCashInHandByIdVariables } from '@erp-system/banking';

// The `getCashInHandById` query requires an argument of type `GetCashInHandByIdVariables`:
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

### Using `getCashInHandById`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getCashInHandByIdRef, GetCashInHandByIdVariables } from '@erp-system/banking';

// The `getCashInHandById` query requires an argument of type `GetCashInHandByIdVariables`:
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

Below are examples of how to use the `banking` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## TransferInsert
You can execute the `TransferInsert` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [banking/index.d.ts](./index.d.ts):
```typescript
transferInsert(vars: TransferInsertVariables): MutationPromise<TransferInsertData, TransferInsertVariables>;

interface TransferInsertRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: TransferInsertVariables): MutationRef<TransferInsertData, TransferInsertVariables>;
}
export const transferInsertRef: TransferInsertRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
transferInsert(dc: DataConnect, vars: TransferInsertVariables): MutationPromise<TransferInsertData, TransferInsertVariables>;

interface TransferInsertRef {
  ...
  (dc: DataConnect, vars: TransferInsertVariables): MutationRef<TransferInsertData, TransferInsertVariables>;
}
export const transferInsertRef: TransferInsertRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the transferInsertRef:
```typescript
const name = transferInsertRef.operationName;
console.log(name);
```

### Variables
The `TransferInsert` mutation requires an argument of type `TransferInsertVariables`, which is defined in [banking/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface TransferInsertVariables {
  id: string;
  date: string;
  fromBankId: string;
  fromBankName: string;
  toBankId: string;
  toBankName: string;
  amount: number;
  note?: string | null;
}
```
### Return Type
Recall that executing the `TransferInsert` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `TransferInsertData`, which is defined in [banking/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface TransferInsertData {
  bankTransfer_insert: BankTransfer_Key;
}
```
### Using `TransferInsert`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, transferInsert, TransferInsertVariables } from '@erp-system/banking';

// The `TransferInsert` mutation requires an argument of type `TransferInsertVariables`:
const transferInsertVars: TransferInsertVariables = {
  id: ..., 
  date: ..., 
  fromBankId: ..., 
  fromBankName: ..., 
  toBankId: ..., 
  toBankName: ..., 
  amount: ..., 
  note: ..., // optional
};

// Call the `transferInsert()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await transferInsert(transferInsertVars);
// Variables can be defined inline as well.
const { data } = await transferInsert({ id: ..., date: ..., fromBankId: ..., fromBankName: ..., toBankId: ..., toBankName: ..., amount: ..., note: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await transferInsert(dataConnect, transferInsertVars);

console.log(data.bankTransfer_insert);

// Or, you can use the `Promise` API.
transferInsert(transferInsertVars).then((response) => {
  const data = response.data;
  console.log(data.bankTransfer_insert);
});
```

### Using `TransferInsert`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, transferInsertRef, TransferInsertVariables } from '@erp-system/banking';

// The `TransferInsert` mutation requires an argument of type `TransferInsertVariables`:
const transferInsertVars: TransferInsertVariables = {
  id: ..., 
  date: ..., 
  fromBankId: ..., 
  fromBankName: ..., 
  toBankId: ..., 
  toBankName: ..., 
  amount: ..., 
  note: ..., // optional
};

// Call the `transferInsertRef()` function to get a reference to the mutation.
const ref = transferInsertRef(transferInsertVars);
// Variables can be defined inline as well.
const ref = transferInsertRef({ id: ..., date: ..., fromBankId: ..., fromBankName: ..., toBankId: ..., toBankName: ..., amount: ..., note: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = transferInsertRef(dataConnect, transferInsertVars);

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

## TransferDelete
You can execute the `TransferDelete` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [banking/index.d.ts](./index.d.ts):
```typescript
transferDelete(vars: TransferDeleteVariables): MutationPromise<TransferDeleteData, TransferDeleteVariables>;

interface TransferDeleteRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: TransferDeleteVariables): MutationRef<TransferDeleteData, TransferDeleteVariables>;
}
export const transferDeleteRef: TransferDeleteRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
transferDelete(dc: DataConnect, vars: TransferDeleteVariables): MutationPromise<TransferDeleteData, TransferDeleteVariables>;

interface TransferDeleteRef {
  ...
  (dc: DataConnect, vars: TransferDeleteVariables): MutationRef<TransferDeleteData, TransferDeleteVariables>;
}
export const transferDeleteRef: TransferDeleteRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the transferDeleteRef:
```typescript
const name = transferDeleteRef.operationName;
console.log(name);
```

### Variables
The `TransferDelete` mutation requires an argument of type `TransferDeleteVariables`, which is defined in [banking/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface TransferDeleteVariables {
  id: string;
}
```
### Return Type
Recall that executing the `TransferDelete` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `TransferDeleteData`, which is defined in [banking/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface TransferDeleteData {
  bankTransfer_delete?: BankTransfer_Key | null;
}
```
### Using `TransferDelete`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, transferDelete, TransferDeleteVariables } from '@erp-system/banking';

// The `TransferDelete` mutation requires an argument of type `TransferDeleteVariables`:
const transferDeleteVars: TransferDeleteVariables = {
  id: ..., 
};

// Call the `transferDelete()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await transferDelete(transferDeleteVars);
// Variables can be defined inline as well.
const { data } = await transferDelete({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await transferDelete(dataConnect, transferDeleteVars);

console.log(data.bankTransfer_delete);

// Or, you can use the `Promise` API.
transferDelete(transferDeleteVars).then((response) => {
  const data = response.data;
  console.log(data.bankTransfer_delete);
});
```

### Using `TransferDelete`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, transferDeleteRef, TransferDeleteVariables } from '@erp-system/banking';

// The `TransferDelete` mutation requires an argument of type `TransferDeleteVariables`:
const transferDeleteVars: TransferDeleteVariables = {
  id: ..., 
};

// Call the `transferDeleteRef()` function to get a reference to the mutation.
const ref = transferDeleteRef(transferDeleteVars);
// Variables can be defined inline as well.
const ref = transferDeleteRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = transferDeleteRef(dataConnect, transferDeleteVars);

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

## BankInsert
You can execute the `BankInsert` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [banking/index.d.ts](./index.d.ts):
```typescript
bankInsert(vars: BankInsertVariables): MutationPromise<BankInsertData, BankInsertVariables>;

interface BankInsertRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: BankInsertVariables): MutationRef<BankInsertData, BankInsertVariables>;
}
export const bankInsertRef: BankInsertRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
bankInsert(dc: DataConnect, vars: BankInsertVariables): MutationPromise<BankInsertData, BankInsertVariables>;

interface BankInsertRef {
  ...
  (dc: DataConnect, vars: BankInsertVariables): MutationRef<BankInsertData, BankInsertVariables>;
}
export const bankInsertRef: BankInsertRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the bankInsertRef:
```typescript
const name = bankInsertRef.operationName;
console.log(name);
```

### Variables
The `BankInsert` mutation requires an argument of type `BankInsertVariables`, which is defined in [banking/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface BankInsertVariables {
  id: string;
  name: string;
  accountNumber: string;
  balance: number;
}
```
### Return Type
Recall that executing the `BankInsert` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `BankInsertData`, which is defined in [banking/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface BankInsertData {
  bank_insert: Bank_Key;
}
```
### Using `BankInsert`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, bankInsert, BankInsertVariables } from '@erp-system/banking';

// The `BankInsert` mutation requires an argument of type `BankInsertVariables`:
const bankInsertVars: BankInsertVariables = {
  id: ..., 
  name: ..., 
  accountNumber: ..., 
  balance: ..., 
};

// Call the `bankInsert()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await bankInsert(bankInsertVars);
// Variables can be defined inline as well.
const { data } = await bankInsert({ id: ..., name: ..., accountNumber: ..., balance: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await bankInsert(dataConnect, bankInsertVars);

console.log(data.bank_insert);

// Or, you can use the `Promise` API.
bankInsert(bankInsertVars).then((response) => {
  const data = response.data;
  console.log(data.bank_insert);
});
```

### Using `BankInsert`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, bankInsertRef, BankInsertVariables } from '@erp-system/banking';

// The `BankInsert` mutation requires an argument of type `BankInsertVariables`:
const bankInsertVars: BankInsertVariables = {
  id: ..., 
  name: ..., 
  accountNumber: ..., 
  balance: ..., 
};

// Call the `bankInsertRef()` function to get a reference to the mutation.
const ref = bankInsertRef(bankInsertVars);
// Variables can be defined inline as well.
const ref = bankInsertRef({ id: ..., name: ..., accountNumber: ..., balance: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = bankInsertRef(dataConnect, bankInsertVars);

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

## BankUpdate
You can execute the `BankUpdate` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [banking/index.d.ts](./index.d.ts):
```typescript
bankUpdate(vars: BankUpdateVariables): MutationPromise<BankUpdateData, BankUpdateVariables>;

interface BankUpdateRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: BankUpdateVariables): MutationRef<BankUpdateData, BankUpdateVariables>;
}
export const bankUpdateRef: BankUpdateRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
bankUpdate(dc: DataConnect, vars: BankUpdateVariables): MutationPromise<BankUpdateData, BankUpdateVariables>;

interface BankUpdateRef {
  ...
  (dc: DataConnect, vars: BankUpdateVariables): MutationRef<BankUpdateData, BankUpdateVariables>;
}
export const bankUpdateRef: BankUpdateRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the bankUpdateRef:
```typescript
const name = bankUpdateRef.operationName;
console.log(name);
```

### Variables
The `BankUpdate` mutation requires an argument of type `BankUpdateVariables`, which is defined in [banking/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface BankUpdateVariables {
  id: string;
  name: string;
  accountNumber: string;
  balance: number;
}
```
### Return Type
Recall that executing the `BankUpdate` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `BankUpdateData`, which is defined in [banking/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface BankUpdateData {
  bank_update?: Bank_Key | null;
}
```
### Using `BankUpdate`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, bankUpdate, BankUpdateVariables } from '@erp-system/banking';

// The `BankUpdate` mutation requires an argument of type `BankUpdateVariables`:
const bankUpdateVars: BankUpdateVariables = {
  id: ..., 
  name: ..., 
  accountNumber: ..., 
  balance: ..., 
};

// Call the `bankUpdate()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await bankUpdate(bankUpdateVars);
// Variables can be defined inline as well.
const { data } = await bankUpdate({ id: ..., name: ..., accountNumber: ..., balance: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await bankUpdate(dataConnect, bankUpdateVars);

console.log(data.bank_update);

// Or, you can use the `Promise` API.
bankUpdate(bankUpdateVars).then((response) => {
  const data = response.data;
  console.log(data.bank_update);
});
```

### Using `BankUpdate`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, bankUpdateRef, BankUpdateVariables } from '@erp-system/banking';

// The `BankUpdate` mutation requires an argument of type `BankUpdateVariables`:
const bankUpdateVars: BankUpdateVariables = {
  id: ..., 
  name: ..., 
  accountNumber: ..., 
  balance: ..., 
};

// Call the `bankUpdateRef()` function to get a reference to the mutation.
const ref = bankUpdateRef(bankUpdateVars);
// Variables can be defined inline as well.
const ref = bankUpdateRef({ id: ..., name: ..., accountNumber: ..., balance: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = bankUpdateRef(dataConnect, bankUpdateVars);

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

## BankDelete
You can execute the `BankDelete` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [banking/index.d.ts](./index.d.ts):
```typescript
bankDelete(vars: BankDeleteVariables): MutationPromise<BankDeleteData, BankDeleteVariables>;

interface BankDeleteRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: BankDeleteVariables): MutationRef<BankDeleteData, BankDeleteVariables>;
}
export const bankDeleteRef: BankDeleteRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
bankDelete(dc: DataConnect, vars: BankDeleteVariables): MutationPromise<BankDeleteData, BankDeleteVariables>;

interface BankDeleteRef {
  ...
  (dc: DataConnect, vars: BankDeleteVariables): MutationRef<BankDeleteData, BankDeleteVariables>;
}
export const bankDeleteRef: BankDeleteRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the bankDeleteRef:
```typescript
const name = bankDeleteRef.operationName;
console.log(name);
```

### Variables
The `BankDelete` mutation requires an argument of type `BankDeleteVariables`, which is defined in [banking/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface BankDeleteVariables {
  id: string;
}
```
### Return Type
Recall that executing the `BankDelete` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `BankDeleteData`, which is defined in [banking/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface BankDeleteData {
  bank_delete?: Bank_Key | null;
}
```
### Using `BankDelete`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, bankDelete, BankDeleteVariables } from '@erp-system/banking';

// The `BankDelete` mutation requires an argument of type `BankDeleteVariables`:
const bankDeleteVars: BankDeleteVariables = {
  id: ..., 
};

// Call the `bankDelete()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await bankDelete(bankDeleteVars);
// Variables can be defined inline as well.
const { data } = await bankDelete({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await bankDelete(dataConnect, bankDeleteVars);

console.log(data.bank_delete);

// Or, you can use the `Promise` API.
bankDelete(bankDeleteVars).then((response) => {
  const data = response.data;
  console.log(data.bank_delete);
});
```

### Using `BankDelete`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, bankDeleteRef, BankDeleteVariables } from '@erp-system/banking';

// The `BankDelete` mutation requires an argument of type `BankDeleteVariables`:
const bankDeleteVars: BankDeleteVariables = {
  id: ..., 
};

// Call the `bankDeleteRef()` function to get a reference to the mutation.
const ref = bankDeleteRef(bankDeleteVars);
// Variables can be defined inline as well.
const ref = bankDeleteRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = bankDeleteRef(dataConnect, bankDeleteVars);

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

## UpdateBankBalance
You can execute the `UpdateBankBalance` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [banking/index.d.ts](./index.d.ts):
```typescript
updateBankBalance(vars: UpdateBankBalanceVariables): MutationPromise<UpdateBankBalanceData, UpdateBankBalanceVariables>;

interface UpdateBankBalanceRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateBankBalanceVariables): MutationRef<UpdateBankBalanceData, UpdateBankBalanceVariables>;
}
export const updateBankBalanceRef: UpdateBankBalanceRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateBankBalance(dc: DataConnect, vars: UpdateBankBalanceVariables): MutationPromise<UpdateBankBalanceData, UpdateBankBalanceVariables>;

interface UpdateBankBalanceRef {
  ...
  (dc: DataConnect, vars: UpdateBankBalanceVariables): MutationRef<UpdateBankBalanceData, UpdateBankBalanceVariables>;
}
export const updateBankBalanceRef: UpdateBankBalanceRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateBankBalanceRef:
```typescript
const name = updateBankBalanceRef.operationName;
console.log(name);
```

### Variables
The `UpdateBankBalance` mutation requires an argument of type `UpdateBankBalanceVariables`, which is defined in [banking/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateBankBalanceVariables {
  id: string;
  newBalance: number;
}
```
### Return Type
Recall that executing the `UpdateBankBalance` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateBankBalanceData`, which is defined in [banking/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateBankBalanceData {
  bank_update?: Bank_Key | null;
}
```
### Using `UpdateBankBalance`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateBankBalance, UpdateBankBalanceVariables } from '@erp-system/banking';

// The `UpdateBankBalance` mutation requires an argument of type `UpdateBankBalanceVariables`:
const updateBankBalanceVars: UpdateBankBalanceVariables = {
  id: ..., 
  newBalance: ..., 
};

// Call the `updateBankBalance()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateBankBalance(updateBankBalanceVars);
// Variables can be defined inline as well.
const { data } = await updateBankBalance({ id: ..., newBalance: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateBankBalance(dataConnect, updateBankBalanceVars);

console.log(data.bank_update);

// Or, you can use the `Promise` API.
updateBankBalance(updateBankBalanceVars).then((response) => {
  const data = response.data;
  console.log(data.bank_update);
});
```

### Using `UpdateBankBalance`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateBankBalanceRef, UpdateBankBalanceVariables } from '@erp-system/banking';

// The `UpdateBankBalance` mutation requires an argument of type `UpdateBankBalanceVariables`:
const updateBankBalanceVars: UpdateBankBalanceVariables = {
  id: ..., 
  newBalance: ..., 
};

// Call the `updateBankBalanceRef()` function to get a reference to the mutation.
const ref = updateBankBalanceRef(updateBankBalanceVars);
// Variables can be defined inline as well.
const ref = updateBankBalanceRef({ id: ..., newBalance: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateBankBalanceRef(dataConnect, updateBankBalanceVars);

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

## CashInHandInsert
You can execute the `CashInHandInsert` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [banking/index.d.ts](./index.d.ts):
```typescript
cashInHandInsert(vars: CashInHandInsertVariables): MutationPromise<CashInHandInsertData, CashInHandInsertVariables>;

interface CashInHandInsertRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CashInHandInsertVariables): MutationRef<CashInHandInsertData, CashInHandInsertVariables>;
}
export const cashInHandInsertRef: CashInHandInsertRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
cashInHandInsert(dc: DataConnect, vars: CashInHandInsertVariables): MutationPromise<CashInHandInsertData, CashInHandInsertVariables>;

interface CashInHandInsertRef {
  ...
  (dc: DataConnect, vars: CashInHandInsertVariables): MutationRef<CashInHandInsertData, CashInHandInsertVariables>;
}
export const cashInHandInsertRef: CashInHandInsertRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the cashInHandInsertRef:
```typescript
const name = cashInHandInsertRef.operationName;
console.log(name);
```

### Variables
The `CashInHandInsert` mutation requires an argument of type `CashInHandInsertVariables`, which is defined in [banking/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CashInHandInsertVariables {
  id: string;
  date: string;
  company: string;
  mainCategory: string;
  subCategory: string;
  amount: number;
  mode: string;
  note?: string | null;
}
```
### Return Type
Recall that executing the `CashInHandInsert` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CashInHandInsertData`, which is defined in [banking/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CashInHandInsertData {
  cashInHand_insert: CashInHand_Key;
}
```
### Using `CashInHandInsert`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, cashInHandInsert, CashInHandInsertVariables } from '@erp-system/banking';

// The `CashInHandInsert` mutation requires an argument of type `CashInHandInsertVariables`:
const cashInHandInsertVars: CashInHandInsertVariables = {
  id: ..., 
  date: ..., 
  company: ..., 
  mainCategory: ..., 
  subCategory: ..., 
  amount: ..., 
  mode: ..., 
  note: ..., // optional
};

// Call the `cashInHandInsert()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await cashInHandInsert(cashInHandInsertVars);
// Variables can be defined inline as well.
const { data } = await cashInHandInsert({ id: ..., date: ..., company: ..., mainCategory: ..., subCategory: ..., amount: ..., mode: ..., note: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await cashInHandInsert(dataConnect, cashInHandInsertVars);

console.log(data.cashInHand_insert);

// Or, you can use the `Promise` API.
cashInHandInsert(cashInHandInsertVars).then((response) => {
  const data = response.data;
  console.log(data.cashInHand_insert);
});
```

### Using `CashInHandInsert`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, cashInHandInsertRef, CashInHandInsertVariables } from '@erp-system/banking';

// The `CashInHandInsert` mutation requires an argument of type `CashInHandInsertVariables`:
const cashInHandInsertVars: CashInHandInsertVariables = {
  id: ..., 
  date: ..., 
  company: ..., 
  mainCategory: ..., 
  subCategory: ..., 
  amount: ..., 
  mode: ..., 
  note: ..., // optional
};

// Call the `cashInHandInsertRef()` function to get a reference to the mutation.
const ref = cashInHandInsertRef(cashInHandInsertVars);
// Variables can be defined inline as well.
const ref = cashInHandInsertRef({ id: ..., date: ..., company: ..., mainCategory: ..., subCategory: ..., amount: ..., mode: ..., note: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = cashInHandInsertRef(dataConnect, cashInHandInsertVars);

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

## CashInHandDelete
You can execute the `CashInHandDelete` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [banking/index.d.ts](./index.d.ts):
```typescript
cashInHandDelete(vars: CashInHandDeleteVariables): MutationPromise<CashInHandDeleteData, CashInHandDeleteVariables>;

interface CashInHandDeleteRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CashInHandDeleteVariables): MutationRef<CashInHandDeleteData, CashInHandDeleteVariables>;
}
export const cashInHandDeleteRef: CashInHandDeleteRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
cashInHandDelete(dc: DataConnect, vars: CashInHandDeleteVariables): MutationPromise<CashInHandDeleteData, CashInHandDeleteVariables>;

interface CashInHandDeleteRef {
  ...
  (dc: DataConnect, vars: CashInHandDeleteVariables): MutationRef<CashInHandDeleteData, CashInHandDeleteVariables>;
}
export const cashInHandDeleteRef: CashInHandDeleteRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the cashInHandDeleteRef:
```typescript
const name = cashInHandDeleteRef.operationName;
console.log(name);
```

### Variables
The `CashInHandDelete` mutation requires an argument of type `CashInHandDeleteVariables`, which is defined in [banking/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CashInHandDeleteVariables {
  id: string;
}
```
### Return Type
Recall that executing the `CashInHandDelete` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CashInHandDeleteData`, which is defined in [banking/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CashInHandDeleteData {
  cashInHand_delete?: CashInHand_Key | null;
}
```
### Using `CashInHandDelete`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, cashInHandDelete, CashInHandDeleteVariables } from '@erp-system/banking';

// The `CashInHandDelete` mutation requires an argument of type `CashInHandDeleteVariables`:
const cashInHandDeleteVars: CashInHandDeleteVariables = {
  id: ..., 
};

// Call the `cashInHandDelete()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await cashInHandDelete(cashInHandDeleteVars);
// Variables can be defined inline as well.
const { data } = await cashInHandDelete({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await cashInHandDelete(dataConnect, cashInHandDeleteVars);

console.log(data.cashInHand_delete);

// Or, you can use the `Promise` API.
cashInHandDelete(cashInHandDeleteVars).then((response) => {
  const data = response.data;
  console.log(data.cashInHand_delete);
});
```

### Using `CashInHandDelete`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, cashInHandDeleteRef, CashInHandDeleteVariables } from '@erp-system/banking';

// The `CashInHandDelete` mutation requires an argument of type `CashInHandDeleteVariables`:
const cashInHandDeleteVars: CashInHandDeleteVariables = {
  id: ..., 
};

// Call the `cashInHandDeleteRef()` function to get a reference to the mutation.
const ref = cashInHandDeleteRef(cashInHandDeleteVars);
// Variables can be defined inline as well.
const ref = cashInHandDeleteRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = cashInHandDeleteRef(dataConnect, cashInHandDeleteVars);

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

