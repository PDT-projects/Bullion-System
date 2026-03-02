import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'inventory',
  service: 'erp-system-service',
  location: 'asia-south1'
};

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

export const listProductsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'listProducts');
}
listProductsRef.operationName = 'listProducts';

export function listProducts(dc) {
  return executeQuery(listProductsRef(dc));
}

export const getProductByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'getProductById', inputVars);
}
getProductByIdRef.operationName = 'getProductById';

export function getProductById(dcOrVars, vars) {
  return executeQuery(getProductByIdRef(dcOrVars, vars));
}

export const listProductTransfersRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'listProductTransfers');
}
listProductTransfersRef.operationName = 'listProductTransfers';

export function listProductTransfers(dc) {
  return executeQuery(listProductTransfersRef(dc));
}

export const getProductTransferByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'getProductTransferById', inputVars);
}
getProductTransferByIdRef.operationName = 'getProductTransferById';

export function getProductTransferById(dcOrVars, vars) {
  return executeQuery(getProductTransferByIdRef(dcOrVars, vars));
}

