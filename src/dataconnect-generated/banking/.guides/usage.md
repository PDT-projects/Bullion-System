# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.




### React
For each operation, there is a wrapper hook that can be used to call the operation.

Here are all of the hooks that get generated:
```ts
import { useBankInsert, useBankUpdate, useBankDelete, useUpdateBankBalance, useListBanks, useGetBankById, useCashInHandInsert, useCashInHandDelete, useListCashInHand, useGetCashInHandById } from '@erp-system/banking/react';
// The types of these hooks are available in react/index.d.ts

const { data, isPending, isSuccess, isError, error } = useBankInsert(bankInsertVars);

const { data, isPending, isSuccess, isError, error } = useBankUpdate(bankUpdateVars);

const { data, isPending, isSuccess, isError, error } = useBankDelete(bankDeleteVars);

const { data, isPending, isSuccess, isError, error } = useUpdateBankBalance(updateBankBalanceVars);

const { data, isPending, isSuccess, isError, error } = useListBanks(listBanksVars);

const { data, isPending, isSuccess, isError, error } = useGetBankById(getBankByIdVars);

const { data, isPending, isSuccess, isError, error } = useCashInHandInsert(cashInHandInsertVars);

const { data, isPending, isSuccess, isError, error } = useCashInHandDelete(cashInHandDeleteVars);

const { data, isPending, isSuccess, isError, error } = useListCashInHand(listCashInHandVars);

const { data, isPending, isSuccess, isError, error } = useGetCashInHandById(getCashInHandByIdVars);

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
import { bankInsert, bankUpdate, bankDelete, updateBankBalance, listBanks, getBankById, cashInHandInsert, cashInHandDelete, listCashInHand, getCashInHandById } from '@erp-system/banking';


// Operation BankInsert:  For variables, look at type BankInsertVars in ../index.d.ts
const { data } = await BankInsert(dataConnect, bankInsertVars);

// Operation BankUpdate:  For variables, look at type BankUpdateVars in ../index.d.ts
const { data } = await BankUpdate(dataConnect, bankUpdateVars);

// Operation BankDelete:  For variables, look at type BankDeleteVars in ../index.d.ts
const { data } = await BankDelete(dataConnect, bankDeleteVars);

// Operation UpdateBankBalance:  For variables, look at type UpdateBankBalanceVars in ../index.d.ts
const { data } = await UpdateBankBalance(dataConnect, updateBankBalanceVars);

// Operation listBanks:  For variables, look at type ListBanksVars in ../index.d.ts
const { data } = await ListBanks(dataConnect, listBanksVars);

// Operation getBankById:  For variables, look at type GetBankByIdVars in ../index.d.ts
const { data } = await GetBankById(dataConnect, getBankByIdVars);

// Operation CashInHandInsert:  For variables, look at type CashInHandInsertVars in ../index.d.ts
const { data } = await CashInHandInsert(dataConnect, cashInHandInsertVars);

// Operation CashInHandDelete:  For variables, look at type CashInHandDeleteVars in ../index.d.ts
const { data } = await CashInHandDelete(dataConnect, cashInHandDeleteVars);

// Operation listCashInHand:  For variables, look at type ListCashInHandVars in ../index.d.ts
const { data } = await ListCashInHand(dataConnect, listCashInHandVars);

// Operation getCashInHandById:  For variables, look at type GetCashInHandByIdVars in ../index.d.ts
const { data } = await GetCashInHandById(dataConnect, getCashInHandByIdVars);


```