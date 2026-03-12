# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `employees`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`employees/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListEmployees*](#listemployees)
  - [*GetEmployeeById*](#getemployeebyid)
- [**Mutations**](#mutations)
  - [*employeeInsert*](#employeeinsert)
  - [*employeeUpdate*](#employeeupdate)
  - [*employeeDelete*](#employeedelete)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `employees`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@erp-system/employees` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@erp-system/employees';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@erp-system/employees';

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

Below are examples of how to use the `employees` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ListEmployees
You can execute the `ListEmployees` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [employees/index.d.ts](./index.d.ts):
```typescript
listEmployees(vars?: ListEmployeesVariables): QueryPromise<ListEmployeesData, ListEmployeesVariables>;

interface ListEmployeesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListEmployeesVariables): QueryRef<ListEmployeesData, ListEmployeesVariables>;
}
export const listEmployeesRef: ListEmployeesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listEmployees(dc: DataConnect, vars?: ListEmployeesVariables): QueryPromise<ListEmployeesData, ListEmployeesVariables>;

interface ListEmployeesRef {
  ...
  (dc: DataConnect, vars?: ListEmployeesVariables): QueryRef<ListEmployeesData, ListEmployeesVariables>;
}
export const listEmployeesRef: ListEmployeesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listEmployeesRef:
```typescript
const name = listEmployeesRef.operationName;
console.log(name);
```

### Variables
The `ListEmployees` query has an optional argument of type `ListEmployeesVariables`, which is defined in [employees/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListEmployeesVariables {
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that executing the `ListEmployees` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListEmployeesData`, which is defined in [employees/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListEmployeesData {
  employees: ({
    id: string;
    name: string;
    position: string;
    salary: number;
    phone: string;
    email: string;
    joinDate: string;
    status: string;
    location: string;
    accountNumber?: string | null;
    bankName?: string | null;
    accountTitle?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  } & Employee_Key)[];
}
```
### Using `ListEmployees`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listEmployees, ListEmployeesVariables } from '@erp-system/employees';

// The `ListEmployees` query has an optional argument of type `ListEmployeesVariables`:
const listEmployeesVars: ListEmployeesVariables = {
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listEmployees()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listEmployees(listEmployeesVars);
// Variables can be defined inline as well.
const { data } = await listEmployees({ limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `ListEmployeesVariables` argument.
const { data } = await listEmployees();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listEmployees(dataConnect, listEmployeesVars);

console.log(data.employees);

// Or, you can use the `Promise` API.
listEmployees(listEmployeesVars).then((response) => {
  const data = response.data;
  console.log(data.employees);
});
```

### Using `ListEmployees`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listEmployeesRef, ListEmployeesVariables } from '@erp-system/employees';

// The `ListEmployees` query has an optional argument of type `ListEmployeesVariables`:
const listEmployeesVars: ListEmployeesVariables = {
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listEmployeesRef()` function to get a reference to the query.
const ref = listEmployeesRef(listEmployeesVars);
// Variables can be defined inline as well.
const ref = listEmployeesRef({ limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `ListEmployeesVariables` argument.
const ref = listEmployeesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listEmployeesRef(dataConnect, listEmployeesVars);

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
You can execute the `GetEmployeeById` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [employees/index.d.ts](./index.d.ts):
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
The `GetEmployeeById` query requires an argument of type `GetEmployeeByIdVariables`, which is defined in [employees/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetEmployeeByIdVariables {
  id: string;
}
```
### Return Type
Recall that executing the `GetEmployeeById` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetEmployeeByIdData`, which is defined in [employees/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetEmployeeByIdData {
  employee?: {
    id: string;
    name: string;
    position: string;
    salary: number;
    phone: string;
    email: string;
    joinDate: string;
    status: string;
    location: string;
    accountNumber?: string | null;
    bankName?: string | null;
    accountTitle?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  } & Employee_Key;
}
```
### Using `GetEmployeeById`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getEmployeeById, GetEmployeeByIdVariables } from '@erp-system/employees';

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
import { connectorConfig, getEmployeeByIdRef, GetEmployeeByIdVariables } from '@erp-system/employees';

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

Below are examples of how to use the `employees` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## employeeInsert
You can execute the `employeeInsert` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [employees/index.d.ts](./index.d.ts):
```typescript
employeeInsert(vars?: EmployeeInsertVariables): MutationPromise<EmployeeInsertData, EmployeeInsertVariables>;

interface EmployeeInsertRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: EmployeeInsertVariables): MutationRef<EmployeeInsertData, EmployeeInsertVariables>;
}
export const employeeInsertRef: EmployeeInsertRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
employeeInsert(dc: DataConnect, vars?: EmployeeInsertVariables): MutationPromise<EmployeeInsertData, EmployeeInsertVariables>;

interface EmployeeInsertRef {
  ...
  (dc: DataConnect, vars?: EmployeeInsertVariables): MutationRef<EmployeeInsertData, EmployeeInsertVariables>;
}
export const employeeInsertRef: EmployeeInsertRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the employeeInsertRef:
```typescript
const name = employeeInsertRef.operationName;
console.log(name);
```

### Variables
The `employeeInsert` mutation has an optional argument of type `EmployeeInsertVariables`, which is defined in [employees/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface EmployeeInsertVariables {
  id?: string;
  name?: string;
  position?: string;
  salary?: number;
  phone?: string;
  email?: string;
  joinDate?: string;
  status?: string;
  location?: string;
  accountNumber?: string | null;
  bankName?: string | null;
  accountTitle?: string | null;
}
```
### Return Type
Recall that executing the `employeeInsert` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `EmployeeInsertData`, which is defined in [employees/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface EmployeeInsertData {
  employee_insert: Employee_Key;
}
```
### Using `employeeInsert`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, employeeInsert, EmployeeInsertVariables } from '@erp-system/employees';

// The `employeeInsert` mutation has an optional argument of type `EmployeeInsertVariables`:
const employeeInsertVars: EmployeeInsertVariables = {
  id: ..., // optional
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

// Call the `employeeInsert()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await employeeInsert(employeeInsertVars);
// Variables can be defined inline as well.
const { data } = await employeeInsert({ id: ..., name: ..., position: ..., salary: ..., phone: ..., email: ..., joinDate: ..., status: ..., location: ..., accountNumber: ..., bankName: ..., accountTitle: ..., });
// Since all variables are optional for this mutation, you can omit the `EmployeeInsertVariables` argument.
const { data } = await employeeInsert();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await employeeInsert(dataConnect, employeeInsertVars);

console.log(data.employee_insert);

// Or, you can use the `Promise` API.
employeeInsert(employeeInsertVars).then((response) => {
  const data = response.data;
  console.log(data.employee_insert);
});
```

### Using `employeeInsert`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, employeeInsertRef, EmployeeInsertVariables } from '@erp-system/employees';

// The `employeeInsert` mutation has an optional argument of type `EmployeeInsertVariables`:
const employeeInsertVars: EmployeeInsertVariables = {
  id: ..., // optional
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

// Call the `employeeInsertRef()` function to get a reference to the mutation.
const ref = employeeInsertRef(employeeInsertVars);
// Variables can be defined inline as well.
const ref = employeeInsertRef({ id: ..., name: ..., position: ..., salary: ..., phone: ..., email: ..., joinDate: ..., status: ..., location: ..., accountNumber: ..., bankName: ..., accountTitle: ..., });
// Since all variables are optional for this mutation, you can omit the `EmployeeInsertVariables` argument.
const ref = employeeInsertRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = employeeInsertRef(dataConnect, employeeInsertVars);

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

## employeeUpdate
You can execute the `employeeUpdate` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [employees/index.d.ts](./index.d.ts):
```typescript
employeeUpdate(vars?: EmployeeUpdateVariables): MutationPromise<EmployeeUpdateData, EmployeeUpdateVariables>;

interface EmployeeUpdateRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: EmployeeUpdateVariables): MutationRef<EmployeeUpdateData, EmployeeUpdateVariables>;
}
export const employeeUpdateRef: EmployeeUpdateRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
employeeUpdate(dc: DataConnect, vars?: EmployeeUpdateVariables): MutationPromise<EmployeeUpdateData, EmployeeUpdateVariables>;

interface EmployeeUpdateRef {
  ...
  (dc: DataConnect, vars?: EmployeeUpdateVariables): MutationRef<EmployeeUpdateData, EmployeeUpdateVariables>;
}
export const employeeUpdateRef: EmployeeUpdateRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the employeeUpdateRef:
```typescript
const name = employeeUpdateRef.operationName;
console.log(name);
```

### Variables
The `employeeUpdate` mutation has an optional argument of type `EmployeeUpdateVariables`, which is defined in [employees/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface EmployeeUpdateVariables {
  id?: string;
  name?: string;
  position?: string;
  salary?: number;
  phone?: string;
  email?: string;
  joinDate?: string;
  status?: string;
  location?: string;
  accountNumber?: string | null;
  bankName?: string | null;
  accountTitle?: string | null;
}
```
### Return Type
Recall that executing the `employeeUpdate` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `EmployeeUpdateData`, which is defined in [employees/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface EmployeeUpdateData {
  employee_update?: Employee_Key | null;
}
```
### Using `employeeUpdate`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, employeeUpdate, EmployeeUpdateVariables } from '@erp-system/employees';

// The `employeeUpdate` mutation has an optional argument of type `EmployeeUpdateVariables`:
const employeeUpdateVars: EmployeeUpdateVariables = {
  id: ..., // optional
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

// Call the `employeeUpdate()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await employeeUpdate(employeeUpdateVars);
// Variables can be defined inline as well.
const { data } = await employeeUpdate({ id: ..., name: ..., position: ..., salary: ..., phone: ..., email: ..., joinDate: ..., status: ..., location: ..., accountNumber: ..., bankName: ..., accountTitle: ..., });
// Since all variables are optional for this mutation, you can omit the `EmployeeUpdateVariables` argument.
const { data } = await employeeUpdate();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await employeeUpdate(dataConnect, employeeUpdateVars);

console.log(data.employee_update);

// Or, you can use the `Promise` API.
employeeUpdate(employeeUpdateVars).then((response) => {
  const data = response.data;
  console.log(data.employee_update);
});
```

### Using `employeeUpdate`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, employeeUpdateRef, EmployeeUpdateVariables } from '@erp-system/employees';

// The `employeeUpdate` mutation has an optional argument of type `EmployeeUpdateVariables`:
const employeeUpdateVars: EmployeeUpdateVariables = {
  id: ..., // optional
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

// Call the `employeeUpdateRef()` function to get a reference to the mutation.
const ref = employeeUpdateRef(employeeUpdateVars);
// Variables can be defined inline as well.
const ref = employeeUpdateRef({ id: ..., name: ..., position: ..., salary: ..., phone: ..., email: ..., joinDate: ..., status: ..., location: ..., accountNumber: ..., bankName: ..., accountTitle: ..., });
// Since all variables are optional for this mutation, you can omit the `EmployeeUpdateVariables` argument.
const ref = employeeUpdateRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = employeeUpdateRef(dataConnect, employeeUpdateVars);

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

## employeeDelete
You can execute the `employeeDelete` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [employees/index.d.ts](./index.d.ts):
```typescript
employeeDelete(vars?: EmployeeDeleteVariables): MutationPromise<EmployeeDeleteData, EmployeeDeleteVariables>;

interface EmployeeDeleteRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: EmployeeDeleteVariables): MutationRef<EmployeeDeleteData, EmployeeDeleteVariables>;
}
export const employeeDeleteRef: EmployeeDeleteRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
employeeDelete(dc: DataConnect, vars?: EmployeeDeleteVariables): MutationPromise<EmployeeDeleteData, EmployeeDeleteVariables>;

interface EmployeeDeleteRef {
  ...
  (dc: DataConnect, vars?: EmployeeDeleteVariables): MutationRef<EmployeeDeleteData, EmployeeDeleteVariables>;
}
export const employeeDeleteRef: EmployeeDeleteRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the employeeDeleteRef:
```typescript
const name = employeeDeleteRef.operationName;
console.log(name);
```

### Variables
The `employeeDelete` mutation has an optional argument of type `EmployeeDeleteVariables`, which is defined in [employees/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface EmployeeDeleteVariables {
  id?: string;
}
```
### Return Type
Recall that executing the `employeeDelete` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `EmployeeDeleteData`, which is defined in [employees/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface EmployeeDeleteData {
  employee_delete?: Employee_Key | null;
}
```
### Using `employeeDelete`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, employeeDelete, EmployeeDeleteVariables } from '@erp-system/employees';

// The `employeeDelete` mutation has an optional argument of type `EmployeeDeleteVariables`:
const employeeDeleteVars: EmployeeDeleteVariables = {
  id: ..., // optional
};

// Call the `employeeDelete()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await employeeDelete(employeeDeleteVars);
// Variables can be defined inline as well.
const { data } = await employeeDelete({ id: ..., });
// Since all variables are optional for this mutation, you can omit the `EmployeeDeleteVariables` argument.
const { data } = await employeeDelete();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await employeeDelete(dataConnect, employeeDeleteVars);

console.log(data.employee_delete);

// Or, you can use the `Promise` API.
employeeDelete(employeeDeleteVars).then((response) => {
  const data = response.data;
  console.log(data.employee_delete);
});
```

### Using `employeeDelete`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, employeeDeleteRef, EmployeeDeleteVariables } from '@erp-system/employees';

// The `employeeDelete` mutation has an optional argument of type `EmployeeDeleteVariables`:
const employeeDeleteVars: EmployeeDeleteVariables = {
  id: ..., // optional
};

// Call the `employeeDeleteRef()` function to get a reference to the mutation.
const ref = employeeDeleteRef(employeeDeleteVars);
// Variables can be defined inline as well.
const ref = employeeDeleteRef({ id: ..., });
// Since all variables are optional for this mutation, you can omit the `EmployeeDeleteVariables` argument.
const ref = employeeDeleteRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = employeeDeleteRef(dataConnect, employeeDeleteVars);

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

