# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.




### React
For each operation, there is a wrapper hook that can be used to call the operation.

Here are all of the hooks that get generated:
```ts
import { useProductInsert, useProductUpdate, useProductDelete, useProductTransferInsert, useProductTransferUpdate, useProductTransferDelete, useListProducts, useGetProductById, useListProductTransfers, useGetProductTransferById } from '@erp-system/inventory/react';
// The types of these hooks are available in react/index.d.ts

const { data, isPending, isSuccess, isError, error } = useProductInsert(productInsertVars);

const { data, isPending, isSuccess, isError, error } = useProductUpdate(productUpdateVars);

const { data, isPending, isSuccess, isError, error } = useProductDelete(productDeleteVars);

const { data, isPending, isSuccess, isError, error } = useProductTransferInsert(productTransferInsertVars);

const { data, isPending, isSuccess, isError, error } = useProductTransferUpdate(productTransferUpdateVars);

const { data, isPending, isSuccess, isError, error } = useProductTransferDelete(productTransferDeleteVars);

const { data, isPending, isSuccess, isError, error } = useListProducts();

const { data, isPending, isSuccess, isError, error } = useGetProductById(getProductByIdVars);

const { data, isPending, isSuccess, isError, error } = useListProductTransfers();

const { data, isPending, isSuccess, isError, error } = useGetProductTransferById(getProductTransferByIdVars);

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
import { productInsert, productUpdate, productDelete, productTransferInsert, productTransferUpdate, productTransferDelete, listProducts, getProductById, listProductTransfers, getProductTransferById } from '@erp-system/inventory';


// Operation productInsert:  For variables, look at type ProductInsertVars in ../index.d.ts
const { data } = await ProductInsert(dataConnect, productInsertVars);

// Operation productUpdate:  For variables, look at type ProductUpdateVars in ../index.d.ts
const { data } = await ProductUpdate(dataConnect, productUpdateVars);

// Operation productDelete:  For variables, look at type ProductDeleteVars in ../index.d.ts
const { data } = await ProductDelete(dataConnect, productDeleteVars);

// Operation productTransferInsert:  For variables, look at type ProductTransferInsertVars in ../index.d.ts
const { data } = await ProductTransferInsert(dataConnect, productTransferInsertVars);

// Operation productTransferUpdate:  For variables, look at type ProductTransferUpdateVars in ../index.d.ts
const { data } = await ProductTransferUpdate(dataConnect, productTransferUpdateVars);

// Operation productTransferDelete:  For variables, look at type ProductTransferDeleteVars in ../index.d.ts
const { data } = await ProductTransferDelete(dataConnect, productTransferDeleteVars);

// Operation listProducts: 
const { data } = await ListProducts(dataConnect);

// Operation getProductById:  For variables, look at type GetProductByIdVars in ../index.d.ts
const { data } = await GetProductById(dataConnect, getProductByIdVars);

// Operation listProductTransfers: 
const { data } = await ListProductTransfers(dataConnect);

// Operation getProductTransferById:  For variables, look at type GetProductTransferByIdVars in ../index.d.ts
const { data } = await GetProductTransferById(dataConnect, getProductTransferByIdVars);


```