const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'erp-system-uk-service',
  location: 'asia-south1'
};
exports.connectorConfig = connectorConfig;

const getEmployeesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetEmployees');
}
getEmployeesRef.operationName = 'GetEmployees';
exports.getEmployeesRef = getEmployeesRef;

exports.getEmployees = function getEmployees(dc) {
  return executeQuery(getEmployeesRef(dc));
};

const getEmployeeByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetEmployeeById', inputVars);
}
getEmployeeByIdRef.operationName = 'GetEmployeeById';
exports.getEmployeeByIdRef = getEmployeeByIdRef;

exports.getEmployeeById = function getEmployeeById(dcOrVars, vars) {
  return executeQuery(getEmployeeByIdRef(dcOrVars, vars));
};

const createEmployeeRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateEmployee', inputVars);
}
createEmployeeRef.operationName = 'CreateEmployee';
exports.createEmployeeRef = createEmployeeRef;

exports.createEmployee = function createEmployee(dcOrVars, vars) {
  return executeMutation(createEmployeeRef(dcOrVars, vars));
};

const updateEmployeeRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateEmployee', inputVars);
}
updateEmployeeRef.operationName = 'UpdateEmployee';
exports.updateEmployeeRef = updateEmployeeRef;

exports.updateEmployee = function updateEmployee(dcOrVars, vars) {
  return executeMutation(updateEmployeeRef(dcOrVars, vars));
};

const deleteEmployeeRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteEmployee', inputVars);
}
deleteEmployeeRef.operationName = 'DeleteEmployee';
exports.deleteEmployeeRef = deleteEmployeeRef;

exports.deleteEmployee = function deleteEmployee(dcOrVars, vars) {
  return executeMutation(deleteEmployeeRef(dcOrVars, vars));
};

const getBanksRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetBanks');
}
getBanksRef.operationName = 'GetBanks';
exports.getBanksRef = getBanksRef;

exports.getBanks = function getBanks(dc) {
  return executeQuery(getBanksRef(dc));
};

const getBankByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetBankById', inputVars);
}
getBankByIdRef.operationName = 'GetBankById';
exports.getBankByIdRef = getBankByIdRef;

exports.getBankById = function getBankById(dcOrVars, vars) {
  return executeQuery(getBankByIdRef(dcOrVars, vars));
};

const createBankRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateBank', inputVars);
}
createBankRef.operationName = 'CreateBank';
exports.createBankRef = createBankRef;

exports.createBank = function createBank(dcOrVars, vars) {
  return executeMutation(createBankRef(dcOrVars, vars));
};

const updateBankRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateBank', inputVars);
}
updateBankRef.operationName = 'UpdateBank';
exports.updateBankRef = updateBankRef;

exports.updateBank = function updateBank(dcOrVars, vars) {
  return executeMutation(updateBankRef(dcOrVars, vars));
};

const deleteBankRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteBank', inputVars);
}
deleteBankRef.operationName = 'DeleteBank';
exports.deleteBankRef = deleteBankRef;

exports.deleteBank = function deleteBank(dcOrVars, vars) {
  return executeMutation(deleteBankRef(dcOrVars, vars));
};

const getCashInHandRecordsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetCashInHandRecords');
}
getCashInHandRecordsRef.operationName = 'GetCashInHandRecords';
exports.getCashInHandRecordsRef = getCashInHandRecordsRef;

exports.getCashInHandRecords = function getCashInHandRecords(dc) {
  return executeQuery(getCashInHandRecordsRef(dc));
};

const getCashInHandByLocationRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetCashInHandByLocation', inputVars);
}
getCashInHandByLocationRef.operationName = 'GetCashInHandByLocation';
exports.getCashInHandByLocationRef = getCashInHandByLocationRef;

exports.getCashInHandByLocation = function getCashInHandByLocation(dcOrVars, vars) {
  return executeQuery(getCashInHandByLocationRef(dcOrVars, vars));
};

const getCashInHandByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetCashInHandById', inputVars);
}
getCashInHandByIdRef.operationName = 'GetCashInHandById';
exports.getCashInHandByIdRef = getCashInHandByIdRef;

exports.getCashInHandById = function getCashInHandById(dcOrVars, vars) {
  return executeQuery(getCashInHandByIdRef(dcOrVars, vars));
};

const createCashInHandRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateCashInHand', inputVars);
}
createCashInHandRef.operationName = 'CreateCashInHand';
exports.createCashInHandRef = createCashInHandRef;

exports.createCashInHand = function createCashInHand(dcOrVars, vars) {
  return executeMutation(createCashInHandRef(dcOrVars, vars));
};

const updateCashInHandRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateCashInHand', inputVars);
}
updateCashInHandRef.operationName = 'UpdateCashInHand';
exports.updateCashInHandRef = updateCashInHandRef;

exports.updateCashInHand = function updateCashInHand(dcOrVars, vars) {
  return executeMutation(updateCashInHandRef(dcOrVars, vars));
};

const deleteCashInHandRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteCashInHand', inputVars);
}
deleteCashInHandRef.operationName = 'DeleteCashInHand';
exports.deleteCashInHandRef = deleteCashInHandRef;

exports.deleteCashInHand = function deleteCashInHand(dcOrVars, vars) {
  return executeMutation(deleteCashInHandRef(dcOrVars, vars));
};

const getBankTransfersRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetBankTransfers');
}
getBankTransfersRef.operationName = 'GetBankTransfers';
exports.getBankTransfersRef = getBankTransfersRef;

exports.getBankTransfers = function getBankTransfers(dc) {
  return executeQuery(getBankTransfersRef(dc));
};

const getBankTransfersByBankRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetBankTransfersByBank', inputVars);
}
getBankTransfersByBankRef.operationName = 'GetBankTransfersByBank';
exports.getBankTransfersByBankRef = getBankTransfersByBankRef;

exports.getBankTransfersByBank = function getBankTransfersByBank(dcOrVars, vars) {
  return executeQuery(getBankTransfersByBankRef(dcOrVars, vars));
};

const createBankTransferRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateBankTransfer', inputVars);
}
createBankTransferRef.operationName = 'CreateBankTransfer';
exports.createBankTransferRef = createBankTransferRef;

exports.createBankTransfer = function createBankTransfer(dcOrVars, vars) {
  return executeMutation(createBankTransferRef(dcOrVars, vars));
};

const deleteBankTransferRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteBankTransfer', inputVars);
}
deleteBankTransferRef.operationName = 'DeleteBankTransfer';
exports.deleteBankTransferRef = deleteBankTransferRef;

exports.deleteBankTransfer = function deleteBankTransfer(dcOrVars, vars) {
  return executeMutation(deleteBankTransferRef(dcOrVars, vars));
};
