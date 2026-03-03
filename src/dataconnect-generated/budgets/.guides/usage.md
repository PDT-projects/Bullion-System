# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.




### React
For each operation, there is a wrapper hook that can be used to call the operation.

Here are all of the hooks that get generated:
```ts
import { useBudgetInsert, useBudgetUpdate, useBudgetDelete, useBudgetUpdateSpent, useListBudgets, useGetBudgetById } from '@erp-system/budgets/react';
// The types of these hooks are available in react/index.d.ts

const { data, isPending, isSuccess, isError, error } = useBudgetInsert(budgetInsertVars);

const { data, isPending, isSuccess, isError, error } = useBudgetUpdate(budgetUpdateVars);

const { data, isPending, isSuccess, isError, error } = useBudgetDelete(budgetDeleteVars);

const { data, isPending, isSuccess, isError, error } = useBudgetUpdateSpent(budgetUpdateSpentVars);

const { data, isPending, isSuccess, isError, error } = useListBudgets(listBudgetsVars);

const { data, isPending, isSuccess, isError, error } = useGetBudgetById(getBudgetByIdVars);

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
import { budgetInsert, budgetUpdate, budgetDelete, budgetUpdateSpent, listBudgets, getBudgetById } from '@erp-system/budgets';


// Operation budgetInsert:  For variables, look at type BudgetInsertVars in ../index.d.ts
const { data } = await BudgetInsert(dataConnect, budgetInsertVars);

// Operation budgetUpdate:  For variables, look at type BudgetUpdateVars in ../index.d.ts
const { data } = await BudgetUpdate(dataConnect, budgetUpdateVars);

// Operation budgetDelete:  For variables, look at type BudgetDeleteVars in ../index.d.ts
const { data } = await BudgetDelete(dataConnect, budgetDeleteVars);

// Operation budgetUpdateSpent:  For variables, look at type BudgetUpdateSpentVars in ../index.d.ts
const { data } = await BudgetUpdateSpent(dataConnect, budgetUpdateSpentVars);

// Operation listBudgets:  For variables, look at type ListBudgetsVars in ../index.d.ts
const { data } = await ListBudgets(dataConnect, listBudgetsVars);

// Operation getBudgetById:  For variables, look at type GetBudgetByIdVars in ../index.d.ts
const { data } = await GetBudgetById(dataConnect, getBudgetByIdVars);


```