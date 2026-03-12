const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'banking',
  service: 'erp-system-service',
  location: 'asia-south1'
};
exports.connectorConfig = connectorConfig;

const bankInsertRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'BankInsert', inputVars);
}
bankInsertRef.operationName = 'BankInsert';
exports.bankInsertRef = bankInsertRef;

exports.bankInsert = function bankInsert(dcOrVars, vars) {
  return executeMutation(bankInsertRef(dcOrVars, vars));
};

const bankUpdateRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'BankUpdate', inputVars);
}
bankUpdateRef.operationName = 'BankUpdate';
exports.bankUpdateRef = bankUpdateRef;

exports.bankUpdate = function bankUpdate(dcOrVars, vars) {
  return executeMutation(bankUpdateRef(dcOrVars, vars));
};

const bankDeleteRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'BankDelete', inputVars);
}
bankDeleteRef.operationName = 'BankDelete';
exports.bankDeleteRef = bankDeleteRef;

exports.bankDelete = function bankDelete(dcOrVars, vars) {
  return executeMutation(bankDeleteRef(dcOrVars, vars));
};

const updateBankBalanceRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateBankBalance', inputVars);
}
updateBankBalanceRef.operationName = 'UpdateBankBalance';
exports.updateBankBalanceRef = updateBankBalanceRef;

exports.updateBankBalance = function updateBankBalance(dcOrVars, vars) {
  return executeMutation(updateBankBalanceRef(dcOrVars, vars));
};

const listBanksRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'listBanks', inputVars);
}
listBanksRef.operationName = 'listBanks';
exports.listBanksRef = listBanksRef;

exports.listBanks = function listBanks(dcOrVars, vars) {
  return executeQuery(listBanksRef(dcOrVars, vars));
};

const getBankByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'getBankById', inputVars);
}
getBankByIdRef.operationName = 'getBankById';
exports.getBankByIdRef = getBankByIdRef;

exports.getBankById = function getBankById(dcOrVars, vars) {
  return executeQuery(getBankByIdRef(dcOrVars, vars));
};

const cashInHandInsertRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CashInHandInsert', inputVars);
}
cashInHandInsertRef.operationName = 'CashInHandInsert';
exports.cashInHandInsertRef = cashInHandInsertRef;

exports.cashInHandInsert = function cashInHandInsert(dcOrVars, vars) {
  return executeMutation(cashInHandInsertRef(dcOrVars, vars));
};

const cashInHandDeleteRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CashInHandDelete', inputVars);
}
cashInHandDeleteRef.operationName = 'CashInHandDelete';
exports.cashInHandDeleteRef = cashInHandDeleteRef;

exports.cashInHandDelete = function cashInHandDelete(dcOrVars, vars) {
  return executeMutation(cashInHandDeleteRef(dcOrVars, vars));
};

const listCashInHandRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'listCashInHand', inputVars);
}
listCashInHandRef.operationName = 'listCashInHand';
exports.listCashInHandRef = listCashInHandRef;

exports.listCashInHand = function listCashInHand(dcOrVars, vars) {
  return executeQuery(listCashInHandRef(dcOrVars, vars));
};

const getCashInHandByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'getCashInHandById', inputVars);
}
getCashInHandByIdRef.operationName = 'getCashInHandById';
exports.getCashInHandByIdRef = getCashInHandByIdRef;

exports.getCashInHandById = function getCashInHandById(dcOrVars, vars) {
  return executeQuery(getCashInHandByIdRef(dcOrVars, vars));
};

const transferInsertRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'TransferInsert', inputVars);
}
transferInsertRef.operationName = 'TransferInsert';
exports.transferInsertRef = transferInsertRef;

exports.transferInsert = function transferInsert(dcOrVars, vars) {
  return executeMutation(transferInsertRef(dcOrVars, vars));
};

const transferDeleteRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'TransferDelete', inputVars);
}
transferDeleteRef.operationName = 'TransferDelete';
exports.transferDeleteRef = transferDeleteRef;

exports.transferDelete = function transferDelete(dcOrVars, vars) {
  return executeMutation(transferDeleteRef(dcOrVars, vars));
};

const listTransfersRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'listTransfers', inputVars);
}
listTransfersRef.operationName = 'listTransfers';
exports.listTransfersRef = listTransfersRef;

exports.listTransfers = function listTransfers(dcOrVars, vars) {
  return executeQuery(listTransfersRef(dcOrVars, vars));
};

const getTransferByIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'getTransferById', inputVars);
}
getTransferByIdRef.operationName = 'getTransferById';
exports.getTransferByIdRef = getTransferByIdRef;

exports.getTransferById = function getTransferById(dcOrVars, vars) {
  return executeQuery(getTransferByIdRef(dcOrVars, vars));
};
