const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'inventory',
  service: 'erp-system-service',
  location: 'asia-south1'
};
exports.connectorConfig = connectorConfig;

const brandInsertRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'brandInsert', inputVars);
}
brandInsertRef.operationName = 'brandInsert';
exports.brandInsertRef = brandInsertRef;

exports.brandInsert = function brandInsert(dcOrVars, vars) {
  return executeMutation(brandInsertRef(dcOrVars, vars));
};

const brandUpdateRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'brandUpdate', inputVars);
}
brandUpdateRef.operationName = 'brandUpdate';
exports.brandUpdateRef = brandUpdateRef;

exports.brandUpdate = function brandUpdate(dcOrVars, vars) {
  return executeMutation(brandUpdateRef(dcOrVars, vars));
};

const brandDeleteRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'brandDelete', inputVars);
}
brandDeleteRef.operationName = 'brandDelete';
exports.brandDeleteRef = brandDeleteRef;

exports.brandDelete = function brandDelete(dcOrVars, vars) {
  return executeMutation(brandDeleteRef(dcOrVars, vars));
};

const listBrandsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListBrands', inputVars);
}
listBrandsRef.operationName = 'ListBrands';
exports.listBrandsRef = listBrandsRef;

exports.listBrands = function listBrands(dcOrVars, vars) {
  return executeQuery(listBrandsRef(dcOrVars, vars));
};

const getBrandByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetBrandById', inputVars);
}
getBrandByIdRef.operationName = 'GetBrandById';
exports.getBrandByIdRef = getBrandByIdRef;

exports.getBrandById = function getBrandById(dcOrVars, vars) {
  return executeQuery(getBrandByIdRef(dcOrVars, vars));
};

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

const listProductsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListProducts', inputVars);
}
listProductsRef.operationName = 'ListProducts';
exports.listProductsRef = listProductsRef;

exports.listProducts = function listProducts(dcOrVars, vars) {
  return executeQuery(listProductsRef(dcOrVars, vars));
};

const getProductByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetProductById', inputVars);
}
getProductByIdRef.operationName = 'GetProductById';
exports.getProductByIdRef = getProductByIdRef;

exports.getProductById = function getProductById(dcOrVars, vars) {
  return executeQuery(getProductByIdRef(dcOrVars, vars));
};

const listProductTransfersRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListProductTransfers', inputVars);
}
listProductTransfersRef.operationName = 'ListProductTransfers';
exports.listProductTransfersRef = listProductTransfersRef;

exports.listProductTransfers = function listProductTransfers(dcOrVars, vars) {
  return executeQuery(listProductTransfersRef(dcOrVars, vars));
};

const getProductTransferByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetProductTransferById', inputVars);
}
getProductTransferByIdRef.operationName = 'GetProductTransferById';
exports.getProductTransferByIdRef = getProductTransferByIdRef;

exports.getProductTransferById = function getProductTransferById(dcOrVars, vars) {
  return executeQuery(getProductTransferByIdRef(dcOrVars, vars));
};

const modelInsertRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'modelInsert', inputVars);
}
modelInsertRef.operationName = 'modelInsert';
exports.modelInsertRef = modelInsertRef;

exports.modelInsert = function modelInsert(dcOrVars, vars) {
  return executeMutation(modelInsertRef(dcOrVars, vars));
};

const modelUpdateRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'modelUpdate', inputVars);
}
modelUpdateRef.operationName = 'modelUpdate';
exports.modelUpdateRef = modelUpdateRef;

exports.modelUpdate = function modelUpdate(dcOrVars, vars) {
  return executeMutation(modelUpdateRef(dcOrVars, vars));
};

const modelDeleteRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'modelDelete', inputVars);
}
modelDeleteRef.operationName = 'modelDelete';
exports.modelDeleteRef = modelDeleteRef;

exports.modelDelete = function modelDelete(dcOrVars, vars) {
  return executeMutation(modelDeleteRef(dcOrVars, vars));
};

const listModelsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListModels', inputVars);
}
listModelsRef.operationName = 'ListModels';
exports.listModelsRef = listModelsRef;

exports.listModels = function listModels(dcOrVars, vars) {
  return executeQuery(listModelsRef(dcOrVars, vars));
};

const getModelByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetModelById', inputVars);
}
getModelByIdRef.operationName = 'GetModelById';
exports.getModelByIdRef = getModelByIdRef;

exports.getModelById = function getModelById(dcOrVars, vars) {
  return executeQuery(getModelByIdRef(dcOrVars, vars));
};
