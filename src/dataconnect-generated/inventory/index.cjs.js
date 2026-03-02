const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'inventory',
  service: 'erp-system-service',
  location: 'asia-south1'
};
exports.connectorConfig = connectorConfig;

const productInsertRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'productInsert', inputVars);
}
productInsertRef.operationName = 'productInsert';
exports.productInsertRef = productInsertRef;

exports.productInsert = function productInsert(dcOrVars, vars) {
  return executeMutation(productInsertRef(dcOrVars, vars));
};

const productUpdateRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'productUpdate', inputVars);
}
productUpdateRef.operationName = 'productUpdate';
exports.productUpdateRef = productUpdateRef;

exports.productUpdate = function productUpdate(dcOrVars, vars) {
  return executeMutation(productUpdateRef(dcOrVars, vars));
};

const productDeleteRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'productDelete', inputVars);
}
productDeleteRef.operationName = 'productDelete';
exports.productDeleteRef = productDeleteRef;

exports.productDelete = function productDelete(dcOrVars, vars) {
  return executeMutation(productDeleteRef(dcOrVars, vars));
};

const productTransferInsertRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'productTransferInsert', inputVars);
}
productTransferInsertRef.operationName = 'productTransferInsert';
exports.productTransferInsertRef = productTransferInsertRef;

exports.productTransferInsert = function productTransferInsert(dcOrVars, vars) {
  return executeMutation(productTransferInsertRef(dcOrVars, vars));
};

const productTransferUpdateRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'productTransferUpdate', inputVars);
}
productTransferUpdateRef.operationName = 'productTransferUpdate';
exports.productTransferUpdateRef = productTransferUpdateRef;

exports.productTransferUpdate = function productTransferUpdate(dcOrVars, vars) {
  return executeMutation(productTransferUpdateRef(dcOrVars, vars));
};

const productTransferDeleteRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'productTransferDelete', inputVars);
}
productTransferDeleteRef.operationName = 'productTransferDelete';
exports.productTransferDeleteRef = productTransferDeleteRef;

exports.productTransferDelete = function productTransferDelete(dcOrVars, vars) {
  return executeMutation(productTransferDeleteRef(dcOrVars, vars));
};

const listProductsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'listProducts');
}
listProductsRef.operationName = 'listProducts';
exports.listProductsRef = listProductsRef;

exports.listProducts = function listProducts(dc) {
  return executeQuery(listProductsRef(dc));
};

const getProductByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'getProductById', inputVars);
}
getProductByIdRef.operationName = 'getProductById';
exports.getProductByIdRef = getProductByIdRef;

exports.getProductById = function getProductById(dcOrVars, vars) {
  return executeQuery(getProductByIdRef(dcOrVars, vars));
};

const listProductTransfersRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'listProductTransfers');
}
listProductTransfersRef.operationName = 'listProductTransfers';
exports.listProductTransfersRef = listProductTransfersRef;

exports.listProductTransfers = function listProductTransfers(dc) {
  return executeQuery(listProductTransfersRef(dc));
};

const getProductTransferByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'getProductTransferById', inputVars);
}
getProductTransferByIdRef.operationName = 'getProductTransferById';
exports.getProductTransferByIdRef = getProductTransferByIdRef;

exports.getProductTransferById = function getProductTransferById(dcOrVars, vars) {
  return executeQuery(getProductTransferByIdRef(dcOrVars, vars));
};
