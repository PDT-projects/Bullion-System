# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.




### React
For each operation, there is a wrapper hook that can be used to call the operation.

Here are all of the hooks that get generated:
```ts
import { useGetEmployees, useGetEmployeeById, useCreateEmployee, useUpdateEmployee, useDeleteEmployee, useGetBanks, useGetBankById, useCreateBank, useUpdateBank, useDeleteBank } from '@dataconnect/generated/react';
// The types of these hooks are available in react/index.d.ts

const { data, isPending, isSuccess, isError, error } = useGetEmployees();

const { data, isPending, isSuccess, isError, error } = useGetEmployeeById(getEmployeeByIdVars);

const { data, isPending, isSuccess, isError, error } = useCreateEmployee(createEmployeeVars);

const { data, isPending, isSuccess, isError, error } = useUpdateEmployee(updateEmployeeVars);

const { data, isPending, isSuccess, isError, error } = useDeleteEmployee(deleteEmployeeVars);

const { data, isPending, isSuccess, isError, error } = useGetBanks();

const { data, isPending, isSuccess, isError, error } = useGetBankById(getBankByIdVars);

const { data, isPending, isSuccess, isError, error } = useCreateBank(createBankVars);

const { data, isPending, isSuccess, isError, error } = useUpdateBank(updateBankVars);

const { data, isPending, isSuccess, isError, error } = useDeleteBank(deleteBankVars);

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
import { getEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee, getBanks, getBankById, createBank, updateBank, deleteBank } from '@dataconnect/generated';


// Operation GetEmployees: 
const { data } = await GetEmployees(dataConnect);

// Operation GetEmployeeById:  For variables, look at type GetEmployeeByIdVars in ../index.d.ts
const { data } = await GetEmployeeById(dataConnect, getEmployeeByIdVars);

// Operation CreateEmployee:  For variables, look at type CreateEmployeeVars in ../index.d.ts
const { data } = await CreateEmployee(dataConnect, createEmployeeVars);

// Operation UpdateEmployee:  For variables, look at type UpdateEmployeeVars in ../index.d.ts
const { data } = await UpdateEmployee(dataConnect, updateEmployeeVars);

// Operation DeleteEmployee:  For variables, look at type DeleteEmployeeVars in ../index.d.ts
const { data } = await DeleteEmployee(dataConnect, deleteEmployeeVars);

// Operation GetBanks: 
const { data } = await GetBanks(dataConnect);

// Operation GetBankById:  For variables, look at type GetBankByIdVars in ../index.d.ts
const { data } = await GetBankById(dataConnect, getBankByIdVars);

// Operation CreateBank:  For variables, look at type CreateBankVars in ../index.d.ts
const { data } = await CreateBank(dataConnect, createBankVars);

// Operation UpdateBank:  For variables, look at type UpdateBankVars in ../index.d.ts
const { data } = await UpdateBank(dataConnect, updateBankVars);

// Operation DeleteBank:  For variables, look at type DeleteBankVars in ../index.d.ts
const { data } = await DeleteBank(dataConnect, deleteBankVars);


```