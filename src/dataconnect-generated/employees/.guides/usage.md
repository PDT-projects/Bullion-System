# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.




### React
For each operation, there is a wrapper hook that can be used to call the operation.

Here are all of the hooks that get generated:
```ts
import { useListEmployees, useGetEmployeeById, useEmployeeInsert, useEmployeeUpdate, useEmployeeDelete } from '@erp-system/employees/react';
// The types of these hooks are available in react/index.d.ts

const { data, isPending, isSuccess, isError, error } = useListEmployees(listEmployeesVars);

const { data, isPending, isSuccess, isError, error } = useGetEmployeeById(getEmployeeByIdVars);

const { data, isPending, isSuccess, isError, error } = useEmployeeInsert(employeeInsertVars);

const { data, isPending, isSuccess, isError, error } = useEmployeeUpdate(employeeUpdateVars);

const { data, isPending, isSuccess, isError, error } = useEmployeeDelete(employeeDeleteVars);

```

Here's an example from a different generated SDK:

```ts
import { useListAllMovies } from '@dataconnect/generated/react';

function MyComponent() {
  const { isLoading, data, error } = useListAllMovies();
  if(isLoading) {
    return <div>Loading...</div>
  }
  if(error) {
    return <div> An Error Occurred: {error} </div>
  }
}

// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MyComponent from './my-component';

function App() {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>
    <MyComponent />
  </QueryClientProvider>
}
```



## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { listEmployees, getEmployeeById, employeeInsert, employeeUpdate, employeeDelete } from '@erp-system/employees';


// Operation ListEmployees:  For variables, look at type ListEmployeesVars in ../index.d.ts
const { data } = await ListEmployees(dataConnect, listEmployeesVars);

// Operation GetEmployeeById:  For variables, look at type GetEmployeeByIdVars in ../index.d.ts
const { data } = await GetEmployeeById(dataConnect, getEmployeeByIdVars);

// Operation employeeInsert:  For variables, look at type EmployeeInsertVars in ../index.d.ts
const { data } = await EmployeeInsert(dataConnect, employeeInsertVars);

// Operation employeeUpdate:  For variables, look at type EmployeeUpdateVars in ../index.d.ts
const { data } = await EmployeeUpdate(dataConnect, employeeUpdateVars);

// Operation employeeDelete:  For variables, look at type EmployeeDeleteVars in ../index.d.ts
const { data } = await EmployeeDelete(dataConnect, employeeDeleteVars);


```