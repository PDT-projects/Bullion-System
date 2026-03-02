# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.




### React
For each operation, there is a wrapper hook that can be used to call the operation.

Here are all of the hooks that get generated:
```ts
import { useCreateLoan, useCreateLoanPayment, useListLoans, useGetLoanById, useListLoanPayments, useGetLoanPaymentById } from '@erp-system/loans/react';
// The types of these hooks are available in react/index.d.ts

const { data, isPending, isSuccess, isError, error } = useCreateLoan(createLoanVars);

const { data, isPending, isSuccess, isError, error } = useCreateLoanPayment(createLoanPaymentVars);

const { data, isPending, isSuccess, isError, error } = useListLoans(listLoansVars);

const { data, isPending, isSuccess, isError, error } = useGetLoanById(getLoanByIdVars);

const { data, isPending, isSuccess, isError, error } = useListLoanPayments(listLoanPaymentsVars);

const { data, isPending, isSuccess, isError, error } = useGetLoanPaymentById(getLoanPaymentByIdVars);

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
import { createLoan, createLoanPayment, listLoans, getLoanById, listLoanPayments, getLoanPaymentById } from '@erp-system/loans';


// Operation createLoan:  For variables, look at type CreateLoanVars in ../index.d.ts
const { data } = await CreateLoan(dataConnect, createLoanVars);

// Operation createLoanPayment:  For variables, look at type CreateLoanPaymentVars in ../index.d.ts
const { data } = await CreateLoanPayment(dataConnect, createLoanPaymentVars);

// Operation listLoans:  For variables, look at type ListLoansVars in ../index.d.ts
const { data } = await ListLoans(dataConnect, listLoansVars);

// Operation getLoanById:  For variables, look at type GetLoanByIdVars in ../index.d.ts
const { data } = await GetLoanById(dataConnect, getLoanByIdVars);

// Operation listLoanPayments:  For variables, look at type ListLoanPaymentsVars in ../index.d.ts
const { data } = await ListLoanPayments(dataConnect, listLoanPaymentsVars);

// Operation getLoanPaymentById:  For variables, look at type GetLoanPaymentByIdVars in ../index.d.ts
const { data } = await GetLoanPaymentById(dataConnect, getLoanPaymentByIdVars);


```