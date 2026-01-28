import { useState } from "react";
import { Plus, Eye, Edit, Trash2, Search, ArrowLeftRight, Building2 } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { toast } from "sonner";

interface Bank {
  id: number;
  name: string;
  accountNumber: string;
  balance: number;
  accountType: 'Current' | 'Savings';
  branch: string;
}

interface Transfer {
  id: number;
  date: string;
  fromBank: string;
  toBank: string;
  amount: number;
  note: string;
}

const initialBanks: Bank[] = [
  {
    id: 1,
    name: 'Habib Bank Limited',
    accountNumber: 'HBL-12345678',
    balance: 650000,
    accountType: 'Current',
    branch: 'Islamabad Main Branch'
  },
  {
    id: 2,
    name: 'MCB Bank',
    accountNumber: 'MCB-87654321',
    balance: 480000,
    accountType: 'Current',
    branch: 'Karachi Branch'
  },
  {
    id: 3,
    name: 'Allied Bank',
    accountNumber: 'ABL-11223344',
    balance: 320000,
    accountType: 'Savings',
    branch: 'Lahore Branch'
  },
  {
    id: 4,
    name: 'United Bank Limited',
    accountNumber: 'UBL-55667788',
    balance: 400000,
    accountType: 'Current',
    branch: 'Islamabad F-7 Branch'
  }
];

const initialTransfers: Transfer[] = [
  {
    id: 1,
    date: '2026-01-18',
    fromBank: 'Habib Bank Limited',
    toBank: 'MCB Bank',
    amount: 50000,
    note: 'Internal fund transfer for operations'
  },
  {
    id: 2,
    date: '2026-01-15',
    fromBank: 'Allied Bank',
    toBank: 'United Bank Limited',
    amount: 75000,
    note: 'Transfer for salary payments'
  }
];

export function Banks() {
  const [banks, setBanks] = useState<Bank[]>(initialBanks);
  const [transfers, setTransfers] = useState<Transfer[]>(initialTransfers);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddBankModalOpen, setIsAddBankModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [viewBank, setViewBank] = useState<Bank | null>(null);
  const [editBank, setEditBank] = useState<Bank | null>(null);
  const [bankFormData, setBankFormData] = useState({
    name: '',
    accountNumber: '',
    balance: '',
    accountType: 'Current' as 'Current' | 'Savings',
    branch: ''
  });
  const [transferFormData, setTransferFormData] = useState({
    fromBank: '',
    toBank: '',
    amount: '',
    note: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleAddBank = () => {
    const newBank: Bank = {
      id: banks.length + 1,
      name: bankFormData.name,
      accountNumber: bankFormData.accountNumber,
      balance: parseFloat(bankFormData.balance),
      accountType: bankFormData.accountType,
      branch: bankFormData.branch
    };
    setBanks([...banks, newBank]);
    setIsAddBankModalOpen(false);
    resetBankForm();
    toast.success('Bank added successfully');
  };

  const handleEditBank = () => {
    if (editBank) {
      setBanks(banks.map(bank => 
        bank.id === editBank.id 
          ? { 
              ...editBank,
              name: bankFormData.name,
              accountNumber: bankFormData.accountNumber,
              balance: parseFloat(bankFormData.balance),
              accountType: bankFormData.accountType,
              branch: bankFormData.branch
            }
          : bank
      ));
      setEditBank(null);
      resetBankForm();
      toast.success('Bank updated successfully');
    }
  };

  const handleDeleteBank = (id: number) => {
    setBanks(banks.filter(bank => bank.id !== id));
    toast.success('Bank deleted successfully');
  };

  const handleTransfer = () => {
    const amount = parseFloat(transferFormData.amount);
    
    // Update bank balances
    setBanks(banks.map(bank => {
      if (bank.name === transferFormData.fromBank) {
        return { ...bank, balance: bank.balance - amount };
      }
      if (bank.name === transferFormData.toBank) {
        return { ...bank, balance: bank.balance + amount };
      }
      return bank;
    }));

    // Add transfer record
    const newTransfer: Transfer = {
      id: transfers.length + 1,
      date: transferFormData.date,
      fromBank: transferFormData.fromBank,
      toBank: transferFormData.toBank,
      amount: amount,
      note: transferFormData.note
    };
    setTransfers([newTransfer, ...transfers]);
    
    setIsTransferModalOpen(false);
    resetTransferForm();
    toast.success('Transfer completed successfully');
  };

  const openEditModal = (bank: Bank) => {
    setEditBank(bank);
    setBankFormData({
      name: bank.name,
      accountNumber: bank.accountNumber,
      balance: bank.balance.toString(),
      accountType: bank.accountType,
      branch: bank.branch
    });
  };

  const resetBankForm = () => {
    setBankFormData({
      name: '',
      accountNumber: '',
      balance: '',
      accountType: 'Current',
      branch: ''
    });
  };

  const resetTransferForm = () => {
    setTransferFormData({
      fromBank: '',
      toBank: '',
      amount: '',
      note: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const filteredBanks = banks.filter(bank =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bank.accountNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bank.branch.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalBalance = banks.reduce((sum, bank) => sum + bank.balance, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banks</h1>
          <p className="text-gray-500 mt-1">Manage bank accounts and transfers</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <ArrowLeftRight className="w-4 h-4 mr-2" />
                Transfer Between Banks
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Transfer Between Banks</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={transferFormData.date}
                    onChange={(e) => setTransferFormData({ ...transferFormData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromBank">From Bank</Label>
                  <Select value={transferFormData.fromBank} onValueChange={(value) => setTransferFormData({ ...transferFormData, fromBank: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map((bank) => (
                        <SelectItem key={bank.id} value={bank.name}>
                          {bank.name} (PKR {bank.balance.toLocaleString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toBank">To Bank</Label>
                  <Select 
                    value={transferFormData.toBank} 
                    onValueChange={(value) => setTransferFormData({ ...transferFormData, toBank: value })}
                    disabled={!transferFormData.fromBank}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.filter(b => b.name !== transferFormData.fromBank).map((bank) => (
                        <SelectItem key={bank.id} value={bank.name}>
                          {bank.name} (PKR {bank.balance.toLocaleString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transferAmount">Amount (PKR)</Label>
                  <Input
                    id="transferAmount"
                    type="number"
                    value={transferFormData.amount}
                    onChange={(e) => setTransferFormData({ ...transferFormData, amount: e.target.value })}
                    placeholder="Enter amount to transfer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transferNote">Note</Label>
                  <Input
                    id="transferNote"
                    value={transferFormData.note}
                    onChange={(e) => setTransferFormData({ ...transferFormData, note: e.target.value })}
                    placeholder="Enter transfer note"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsTransferModalOpen(false); resetTransferForm(); }}>Cancel</Button>
                <Button className="bg-[#4f46e5] hover:bg-[#4338ca]" onClick={handleTransfer}>
                  Complete Transfer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddBankModalOpen} onOpenChange={setIsAddBankModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#4f46e5] hover:bg-[#4338ca]">
                <Plus className="w-4 h-4 mr-2" />
                Add Bank
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Bank Account</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={bankFormData.name}
                    onChange={(e) => setBankFormData({ ...bankFormData, name: e.target.value })}
                    placeholder="Enter bank name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={bankFormData.accountNumber}
                    onChange={(e) => setBankFormData({ ...bankFormData, accountNumber: e.target.value })}
                    placeholder="Enter account number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountType">Account Type</Label>
                  <Select value={bankFormData.accountType} onValueChange={(value: any) => setBankFormData({ ...bankFormData, accountType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Current">Current Account</SelectItem>
                      <SelectItem value="Savings">Savings Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="balance">Initial Balance (PKR)</Label>
                  <Input
                    id="balance"
                    type="number"
                    value={bankFormData.balance}
                    onChange={(e) => setBankFormData({ ...bankFormData, balance: e.target.value })}
                    placeholder="Enter initial balance"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Input
                    id="branch"
                    value={bankFormData.branch}
                    onChange={(e) => setBankFormData({ ...bankFormData, branch: e.target.value })}
                    placeholder="Enter branch name"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsAddBankModalOpen(false); resetBankForm(); }}>Cancel</Button>
                <Button className="bg-[#4f46e5] hover:bg-[#4338ca]" onClick={handleAddBank}>
                  Add Bank
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Total Balance Card */}
      <Card className="bg-gradient-to-r from-[#4f46e5] to-[#6366f1]">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-white">
            <div>
              <p className="text-sm opacity-90">Total Bank Balance</p>
              <h2 className="text-4xl font-bold mt-2">PKR {totalBalance.toLocaleString()}</h2>
              <p className="text-sm opacity-90 mt-1">Across {banks.length} bank accounts</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <Building2 className="w-8 h-8" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search banks by name, account number, or branch..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Banks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bank Accounts ({filteredBanks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bank Name</TableHead>
                <TableHead>Account Number</TableHead>
                <TableHead>Account Type</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBanks.map((bank) => (
                <TableRow key={bank.id}>
                  <TableCell className="font-medium">{bank.name}</TableCell>
                  <TableCell className="text-gray-600">{bank.accountNumber}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{bank.accountType}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{bank.branch}</TableCell>
                  <TableCell className="font-bold text-[#4f46e5]">PKR {bank.balance.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setViewBank(bank)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Bank Account Details</DialogTitle>
                          </DialogHeader>
                          {viewBank && (
                            <div className="space-y-4 py-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                  <p className="text-sm text-gray-500">Bank Name</p>
                                  <p className="font-medium text-lg">{viewBank.name}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Account Number</p>
                                  <p className="font-medium">{viewBank.accountNumber}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Account Type</p>
                                  <Badge variant="outline">{viewBank.accountType}</Badge>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-sm text-gray-500">Branch</p>
                                  <p className="font-medium">{viewBank.branch}</p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-sm text-gray-500">Current Balance</p>
                                  <p className="font-bold text-2xl text-[#4f46e5]">PKR {viewBank.balance.toLocaleString()}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Dialog open={editBank?.id === bank.id} onOpenChange={(open) => !open && setEditBank(null)}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEditModal(bank)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Bank Account</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-bankName">Bank Name</Label>
                              <Input
                                id="edit-bankName"
                                value={bankFormData.name}
                                onChange={(e) => setBankFormData({ ...bankFormData, name: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-accountNumber">Account Number</Label>
                              <Input
                                id="edit-accountNumber"
                                value={bankFormData.accountNumber}
                                onChange={(e) => setBankFormData({ ...bankFormData, accountNumber: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-accountType">Account Type</Label>
                              <Select value={bankFormData.accountType} onValueChange={(value: any) => setBankFormData({ ...bankFormData, accountType: value })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Current">Current Account</SelectItem>
                                  <SelectItem value="Savings">Savings Account</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-balance">Balance (PKR)</Label>
                              <Input
                                id="edit-balance"
                                type="number"
                                value={bankFormData.balance}
                                onChange={(e) => setBankFormData({ ...bankFormData, balance: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-branch">Branch</Label>
                              <Input
                                id="edit-branch"
                                value={bankFormData.branch}
                                onChange={(e) => setBankFormData({ ...bankFormData, branch: e.target.value })}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => { setEditBank(null); resetBankForm(); }}>Cancel</Button>
                            <Button className="bg-[#4f46e5] hover:bg-[#4338ca]" onClick={handleEditBank}>
                              Save Changes
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteBank(bank.id)}
                      >
                        <Trash2 className="w-4 h-4 text-[#ef4444]" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Transfer History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transfers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>From Bank</TableHead>
                <TableHead>To Bank</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.map((transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell className="font-medium">{transfer.date}</TableCell>
                  <TableCell>{transfer.fromBank}</TableCell>
                  <TableCell>{transfer.toBank}</TableCell>
                  <TableCell className="font-bold text-[#4f46e5]">PKR {transfer.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-sm text-gray-600">{transfer.note}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
