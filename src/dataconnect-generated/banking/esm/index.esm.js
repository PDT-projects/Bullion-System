import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'banking',
  service: 'erp-system-service',
  location: 'asia-south1'
};

export const transferInsertRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'TransferInsert', inputVars);
}
transferInsertRef.operationName = 'TransferInsert';

export function transferInsert(dcOrVars, vars) {
  return executeMutation(transferInsertRef(dcOrVars, vars));
}

export const transferDeleteRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'TransferDelete', inputVars);
}
transferDeleteRef.operationName = 'TransferDelete';

export function transferDelete(dcOrVars, vars) {
  return executeMutation(transferDeleteRef(dcOrVars, vars));
}

export const listTransfersRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'listTransfers', inputVars);
}
listTransfersRef.operationName = 'listTransfers';

export function listTransfers(dcOrVars, vars) {
  return executeQuery(listTransfersRef(dcOrVars, vars));
}

export const getTransferByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'getTransferById', inputVars);
}
getTransferByIdRef.operationName = 'getTransferById';

export function getTransferById(dcOrVars, vars) {
  return executeQuery(getTransferByIdRef(dcOrVars, vars));
}

export const bankInsertRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'BankInsert', inputVars);
}
bankInsertRef.operationName = 'BankInsert';

export function bankInsert(dcOrVars, vars) {
  return executeMutation(bankInsertRef(dcOrVars, vars));
}

export const bankUpdateRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'BankUpdate', inputVars);
}
bankUpdateRef.operationName = 'BankUpdate';

export function bankUpdate(dcOrVars, vars) {
  return executeMutation(bankUpdateRef(dcOrVars, vars));
}

export const bankDeleteRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'BankDelete', inputVars);
}
bankDeleteRef.operationName = 'BankDelete';

export function bankDelete(dcOrVars, vars) {
  return executeMutation(bankDeleteRef(dcOrVars, vars));
}

export const updateBankBalanceRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateBankBalance', inputVars);
}
updateBankBalanceRef.operationName = 'UpdateBankBalance';

export function updateBankBalance(dcOrVars, vars) {
  return executeMutation(updateBankBalanceRef(dcOrVars, vars));
}

export const listBanksRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'listBanks', inputVars);
}
listBanksRef.operationName = 'listBanks';

export function listBanks(dcOrVars, vars) {
  return executeQuery(listBanksRef(dcOrVars, vars));
}

export const getBankByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'getBankById', inputVars);
}
getBankByIdRef.operationName = 'getBankById';

export function getBankById(dcOrVars, vars) {
  return executeQuery(getBankByIdRef(dcOrVars, vars));
}

export const cashInHandInsertRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CashInHandInsert', inputVars);
}
cashInHandInsertRef.operationName = 'CashInHandInsert';

export function cashInHandInsert(dcOrVars, vars) {
  return executeMutation(cashInHandInsertRef(dcOrVars, vars));
}

export const cashInHandDeleteRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CashInHandDelete', inputVars);
}
cashInHandDeleteRef.operationName = 'CashInHandDelete';

export function cashInHandDelete(dcOrVars, vars) {
  return executeMutation(cashInHandDeleteRef(dcOrVars, vars));
}

export const listCashInHandRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'listCashInHand', inputVars);
}
listCashInHandRef.operationName = 'listCashInHand';

export function listCashInHand(dcOrVars, vars) {
  return executeQuery(listCashInHandRef(dcOrVars, vars));
}

export const getCashInHandByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'getCashInHandById', inputVars);
}
getCashInHandByIdRef.operationName = 'getCashInHandById';

export function getCashInHandById(dcOrVars, vars) {
  return executeQuery(getCashInHandByIdRef(dcOrVars, vars));
}

