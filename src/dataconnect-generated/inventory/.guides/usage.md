# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.




### React
For each operation, there is a wrapper hook that can be used to call the operation.

Here are all of the hooks that get generated:
```ts
import { useBrandInsert, useBrandUpdate, useBrandDelete, useListBrands, useGetBrandById, useCostingInsert, useCostingUpdate, useCostingDelete, useProductInsert, useProductUpdate } from '@erp-system/inventory/react';
// The types of these hooks are available in react/index.d.ts

const { data, isPending, isSuccess, isError, error } = useBrandInsert(brandInsertVars);

const { data, isPending, isSuccess, isError, error } = useBrandUpdate(brandUpdateVars);

const { data, isPending, isSuccess, isError, error } = useBrandDelete(brandDeleteVars);

const { data, isPending, isSuccess, isError, error } = useListBrands(listBrandsVars);

const { data, isPending, isSuccess, isError, error } = useGetBrandById(getBrandByIdVars);

const { data, isPending, isSuccess, isError, error } = useCostingInsert(costingInsertVars);

const { data, isPending, isSuccess, isError, error } = useCostingUpdate(costingUpdateVars);

const { data, isPending, isSuccess, isError, error } = useCostingDelete(costingDeleteVars);

const { data, isPending, isSuccess, isError, error } = useProductInsert(productInsertVars);

const { data, isPending, isSuccess, isError, error } = useProductUpdate(productUpdateVars);

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
import { brandInsert, brandUpdate, brandDelete, listBrands, getBrandById, costingInsert, costingUpdate, costingDelete, productInsert, productUpdate } from '@erp-system/inventory';


// Operation brandInsert:  For variables, look at type BrandInsertVars in ../index.d.ts
const { data } = await BrandInsert(dataConnect, brandInsertVars);

// Operation brandUpdate:  For variables, look at type BrandUpdateVars in ../index.d.ts
const { data } = await BrandUpdate(dataConnect, brandUpdateVars);

// Operation brandDelete:  For variables, look at type BrandDeleteVars in ../index.d.ts
const { data } = await BrandDelete(dataConnect, brandDeleteVars);

// Operation ListBrands:  For variables, look at type ListBrandsVars in ../index.d.ts
const { data } = await ListBrands(dataConnect, listBrandsVars);

// Operation GetBrandById:  For variables, look at type GetBrandByIdVars in ../index.d.ts
const { data } = await GetBrandById(dataConnect, getBrandByIdVars);

// Operation costingInsert:  For variables, look at type CostingInsertVars in ../index.d.ts
const { data } = await CostingInsert(dataConnect, costingInsertVars);

// Operation costingUpdate:  For variables, look at type CostingUpdateVars in ../index.d.ts
const { data } = await CostingUpdate(dataConnect, costingUpdateVars);

// Operation costingDelete:  For variables, look at type CostingDeleteVars in ../index.d.ts
const { data } = await CostingDelete(dataConnect, costingDeleteVars);

// Operation productInsert:  For variables, look at type ProductInsertVars in ../index.d.ts
const { data } = await ProductInsert(dataConnect, productInsertVars);

// Operation productUpdate:  For variables, look at type ProductUpdateVars in ../index.d.ts
const { data } = await ProductUpdate(dataConnect, productUpdateVars);


```