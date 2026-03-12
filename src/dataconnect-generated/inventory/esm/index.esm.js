import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'inventory',
  service: 'erp-system-service',
  location: 'asia-south1'
};

export const brandInsertRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'brandInsert', inputVars);
}
brandInsertRef.operationName = 'brandInsert';

export function brandInsert(dcOrVars, vars) {
  return executeMutation(brandInsertRef(dcOrVars, vars));
}

export const brandUpdateRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'brandUpdate', inputVars);
}
brandUpdateRef.operationName = 'brandUpdate';

export function brandUpdate(dcOrVars, vars) {
  return executeMutation(brandUpdateRef(dcOrVars, vars));
}

export const brandDeleteRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'brandDelete', inputVars);
}
brandDeleteRef.operationName = 'brandDelete';

export function brandDelete(dcOrVars, vars) {
  return executeMutation(brandDeleteRef(dcOrVars, vars));
}

export const listBrandsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListBrands', inputVars);
}
listBrandsRef.operationName = 'ListBrands';

export function listBrands(dcOrVars, vars) {
  return executeQuery(listBrandsRef(dcOrVars, vars));
}

export const getBrandByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetBrandById', inputVars);
}
getBrandByIdRef.operationName = 'GetBrandById';

export function getBrandById(dcOrVars, vars) {
  return executeQuery(getBrandByIdRef(dcOrVars, vars));
}

export const costingInsertRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'costingInsert', inputVars);
}
costingInsertRef.operationName = 'costingInsert';

export function costingInsert(dcOrVars, vars) {
  return executeMutation(costingInsertRef(dcOrVars, vars));
}

export const costingUpdateRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'costingUpdate', inputVars);
}
costingUpdateRef.operationName = 'costingUpdate';

export function costingUpdate(dcOrVars, vars) {
  return executeMutation(costingUpdateRef(dcOrVars, vars));
}

export const costingDeleteRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'costingDelete', inputVars);
}
costingDeleteRef.operationName = 'costingDelete';

export function costingDelete(dcOrVars, vars) {
  return executeMutation(costingDeleteRef(dcOrVars, vars));
}

export const productInsertRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'productInsert', inputVars);
}
productInsertRef.operationName = 'productInsert';

export function productInsert(dcOrVars, vars) {
  return executeMutation(productInsertRef(dcOrVars, vars));
}

export const productUpdateRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'productUpdate', inputVars);
}
productUpdateRef.operationName = 'productUpdate';

export function productUpdate(dcOrVars, vars) {
  return executeMutation(productUpdateRef(dcOrVars, vars));
}

export const productDeleteRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'productDelete', inputVars);
}
productDeleteRef.operationName = 'productDelete';

export function productDelete(dcOrVars, vars) {
  return executeMutation(productDeleteRef(dcOrVars, vars));
}

export const productTransferInsertRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'productTransferInsert', inputVars);
}
productTransferInsertRef.operationName = 'productTransferInsert';

export function productTransferInsert(dcOrVars, vars) {
  return executeMutation(productTransferInsertRef(dcOrVars, vars));
}

export const productTransferUpdateRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'productTransferUpdate', inputVars);
}
productTransferUpdateRef.operationName = 'productTransferUpdate';

export function productTransferUpdate(dcOrVars, vars) {
  return executeMutation(productTransferUpdateRef(dcOrVars, vars));
}

export const productTransferDeleteRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'productTransferDelete', inputVars);
}
productTransferDeleteRef.operationName = 'productTransferDelete';

export function productTransferDelete(dcOrVars, vars) {
  return executeMutation(productTransferDeleteRef(dcOrVars, vars));
}

export const listProductsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListProducts', inputVars);
}
listProductsRef.operationName = 'ListProducts';

export function listProducts(dcOrVars, vars) {
  return executeQuery(listProductsRef(dcOrVars, vars));
}

export const getProductByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetProductById', inputVars);
}
getProductByIdRef.operationName = 'GetProductById';

export function getProductById(dcOrVars, vars) {
  return executeQuery(getProductByIdRef(dcOrVars, vars));
}

export const modelInsertRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'modelInsert', inputVars);
}
modelInsertRef.operationName = 'modelInsert';

export function modelInsert(dcOrVars, vars) {
  return executeMutation(modelInsertRef(dcOrVars, vars));
}

export const modelUpdateRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'modelUpdate', inputVars);
}
modelUpdateRef.operationName = 'modelUpdate';

export function modelUpdate(dcOrVars, vars) {
  return executeMutation(modelUpdateRef(dcOrVars, vars));
}

export const modelDeleteRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'modelDelete', inputVars);
}
modelDeleteRef.operationName = 'modelDelete';

export function modelDelete(dcOrVars, vars) {
  return executeMutation(modelDeleteRef(dcOrVars, vars));
}

export const listModelsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListModels', inputVars);
}
listModelsRef.operationName = 'ListModels';

export function listModels(dcOrVars, vars) {
  return executeQuery(listModelsRef(dcOrVars, vars));
}

export const getModelByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetModelById', inputVars);
}
getModelByIdRef.operationName = 'GetModelById';

export function getModelById(dcOrVars, vars) {
  return executeQuery(getModelByIdRef(dcOrVars, vars));
}

