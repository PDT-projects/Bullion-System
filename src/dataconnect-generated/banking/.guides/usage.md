# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.




### React
For each operation, there is a wrapper hook that can be used to call the operation.

Here are all of the hooks that get generated:
```ts
import { useCashInHandInsert, useCashInHandDelete, useListCashInHand, useGetCashInHandById, useTransferInsert, useTransferDelete, useListTransfers, useGetTransferById, useBankInsert, useBankUpdate } from '@erp-system/banking/react';
// The types of these hooks are available in react/index.d.ts

const { data, isPending, isSuccess, isError, error } = useCashInHandInsert(cashInHandInsertVars);

const { data, isPending, isSuccess, isError, error } = useCashInHandDelete(cashInHandDeleteVars);

const { data, isPending, isSuccess, isError, error } = useListCashInHand(listCashInHandVars);

const { data, isPending, isSuccess, isError, error } = useGetCashInHandById(getCashInHandByIdVars);

const { data, isPending, isSuccess, isError, error } = useTransferInsert(transferInsertVars);

const { data, isPending, isSuccess, isError, error } = useTransferDelete(transferDeleteVars);

const { data, isPending, isSuccess, isError, error } = useListTransfers(listTransfersVars);

const { data, isPending, isSuccess, isError, error } = useGetTransferById(getTransferByIdVars);

const { data, isPending, isSuccess, isError, error } = useBankInsert(bankInsertVars);

const { data, isPending, isSuccess, isError, error } = useBankUpdate(bankUpdateVars);

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
import { cashInHandInsert, cashInHandDelete, listCashInHand, getCashInHandById, transferInsert, transferDelete, listTransfers, getTransferById, bankInsert, bankUpdate } from '@erp-system/banking';


// Operation cashInHandInsert:  For variables, look at type CashInHandInsertVars in ../index.d.ts
const { data } = await CashInHandInsert(dataConnect, cashInHandInsertVars);

// Operation cashInHandDelete:  For variables, look at type CashInHandDeleteVars in ../index.d.ts
const { data } = await CashInHandDelete(dataConnect, cashInHandDeleteVars);

// Operation listCashInHand:  For variables, look at type ListCashInHandVars in ../index.d.ts
const { data } = await ListCashInHand(dataConnect, listCashInHandVars);

// Operation getCashInHandById:  For variables, look at type GetCashInHandByIdVars in ../index.d.ts
const { data } = await GetCashInHandById(dataConnect, getCashInHandByIdVars);

// Operation transferInsert:  For variables, look at type TransferInsertVars in ../index.d.ts
const { data } = await TransferInsert(dataConnect, transferInsertVars);

// Operation transferDelete:  For variables, look at type TransferDeleteVars in ../index.d.ts
const { data } = await TransferDelete(dataConnect, transferDeleteVars);

// Operation listTransfers:  For variables, look at type ListTransfersVars in ../index.d.ts
const { data } = await ListTransfers(dataConnect, listTransfersVars);

// Operation getTransferById:  For variables, look at type GetTransferByIdVars in ../index.d.ts
const { data } = await GetTransferById(dataConnect, getTransferByIdVars);

// Operation bankInsert:  For variables, look at type BankInsertVars in ../index.d.ts
const { data } = await BankInsert(dataConnect, bankInsertVars);

// Operation bankUpdate:  For variables, look at type BankUpdateVars in ../index.d.ts
const { data } = await BankUpdate(dataConnect, bankUpdateVars);


```