import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'erp-system-uk-service',
  location: 'asia-south1'
};

export const getEmployeesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetEmployees');
}
getEmployeesRef.operationName = 'GetEmployees';

export function getEmployees(dc) {
  return executeQuery(getEmployeesRef(dc));
}

export const getEmployeeByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetEmployeeById', inputVars);
}
getEmployeeByIdRef.operationName = 'GetEmployeeById';

export function getEmployeeById(dcOrVars, vars) {
  return executeQuery(getEmployeeByIdRef(dcOrVars, vars));
}

export const createEmployeeRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateEmployee', inputVars);
}
createEmployeeRef.operationName = 'CreateEmployee';

export function createEmployee(dcOrVars, vars) {
  return executeMutation(createEmployeeRef(dcOrVars, vars));
}

export const updateEmployeeRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateEmployee', inputVars);
}
updateEmployeeRef.operationName = 'UpdateEmployee';

export function updateEmployee(dcOrVars, vars) {
  return executeMutation(updateEmployeeRef(dcOrVars, vars));
}

export const deleteEmployeeRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteEmployee', inputVars);
}
deleteEmployeeRef.operationName = 'DeleteEmployee';

export function deleteEmployee(dcOrVars, vars) {
  return executeMutation(deleteEmployeeRef(dcOrVars, vars));
}

export const getBanksRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetBanks');
}
getBanksRef.operationName = 'GetBanks';

export function getBanks(dc) {
  return executeQuery(getBanksRef(dc));
}

export const getBankByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetBankById', inputVars);
}
getBankByIdRef.operationName = 'GetBankById';

export function getBankById(dcOrVars, vars) {
  return executeQuery(getBankByIdRef(dcOrVars, vars));
}

export const createBankRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateBank', inputVars);
}
createBankRef.operationName = 'CreateBank';

export function createBank(dcOrVars, vars) {
  return executeMutation(createBankRef(dcOrVars, vars));
}

export const updateBankRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateBank', inputVars);
}
updateBankRef.operationName = 'UpdateBank';

export function updateBank(dcOrVars, vars) {
  return executeMutation(updateBankRef(dcOrVars, vars));
}

export const deleteBankRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteBank', inputVars);
}
deleteBankRef.operationName = 'DeleteBank';

export function deleteBank(dcOrVars, vars) {
  return executeMutation(deleteBankRef(dcOrVars, vars));
}

export const getCashInHandRecordsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetCashInHandRecords');
}
getCashInHandRecordsRef.operationName = 'GetCashInHandRecords';

export function getCashInHandRecords(dc) {
  return executeQuery(getCashInHandRecordsRef(dc));
}

export const getCashInHandByLocationRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetCashInHandByLocation', inputVars);
}
getCashInHandByLocationRef.operationName = 'GetCashInHandByLocation';

export function getCashInHandByLocation(dcOrVars, vars) {
  return executeQuery(getCashInHandByLocationRef(dcOrVars, vars));
}

export const getCashInHandByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetCashInHandById', inputVars);
}
getCashInHandByIdRef.operationName = 'GetCashInHandById';

export function getCashInHandById(dcOrVars, vars) {
  return executeQuery(getCashInHandByIdRef(dcOrVars, vars));
}

export const createCashInHandRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateCashInHand', inputVars);
}
createCashInHandRef.operationName = 'CreateCashInHand';

export function createCashInHand(dcOrVars, vars) {
  return executeMutation(createCashInHandRef(dcOrVars, vars));
}

export const updateCashInHandRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateCashInHand', inputVars);
}
updateCashInHandRef.operationName = 'UpdateCashInHand';

export function updateCashInHand(dcOrVars, vars) {
  return executeMutation(updateCashInHandRef(dcOrVars, vars));
}

export const deleteCashInHandRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteCashInHand', inputVars);
}
deleteCashInHandRef.operationName = 'DeleteCashInHand';

export function deleteCashInHand(dcOrVars, vars) {
  return executeMutation(deleteCashInHandRef(dcOrVars, vars));
}

export const getBankTransfersRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetBankTransfers');
}
getBankTransfersRef.operationName = 'GetBankTransfers';

export function getBankTransfers(dc) {
  return executeQuery(getBankTransfersRef(dc));
}

export const getBankTransfersByBankRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetBankTransfersByBank', inputVars);
}
getBankTransfersByBankRef.operationName = 'GetBankTransfersByBank';

export function getBankTransfersByBank(dcOrVars, vars) {
  return executeQuery(getBankTransfersByBankRef(dcOrVars, vars));
}

export const createBankTransferRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateBankTransfer', inputVars);
}
createBankTransferRef.operationName = 'CreateBankTransfer';

export function createBankTransfer(dcOrVars, vars) {
  return executeMutation(createBankTransferRef(dcOrVars, vars));
}

export const deleteBankTransferRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteBankTransfer', inputVars);
}
deleteBankTransferRef.operationName = 'DeleteBankTransfer';

export function deleteBankTransfer(dcOrVars, vars) {
  return executeMutation(deleteBankTransferRef(dcOrVars, vars));
}

