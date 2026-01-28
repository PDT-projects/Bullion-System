import { useState } from "react";
import { Plus, Eye, Edit, Trash2, Search } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { toast } from "sonner";

interface Loan {
  id: number;
  employeeName: string;
  loanAmount: number;
  paidAmount: number;
  remainingAmount: number;
  payable: number;
  receivable: number;
  loanType: 'Official' | 'Personal';
  date: string;
  status: 'Active' | 'Completed' | 'Pending';
}

const employees = [
  'Ahmed Khan',
  'Fatima Ali',
  'Hassan Raza',
  'Ayesha Mahmood',
  'Usman Tariq'
];

const initialLoans: Loan[] = [
  {
    id: 1,
    employeeName: 'Ahmed Khan',
    loanAmount: 50000,
    paidAmount: 20000,
    remainingAmount: 30000,
    payable: 30000,
    receivable: 0,
    loanType: 'Official',
    date: '2026-01-10',
    status: 'Active'
  },
  {
    id: 2,
    employeeName: 'Fatima Ali',
    loanAmount: 35000,
    paidAmount: 35000,
    remainingAmount: 0,
    payable: 0,
    receivable: 0,
    loanType: 'Personal',
    date: '2025-12-15',
    status: 'Completed'
  },
  {
    id: 3,
    employeeName: 'Hassan Raza',
    loanAmount: 25000,
    paidAmount: 10000,
    remainingAmount: 15000,
    payable: 0,
    receivable: 15000,
    loanType: 'Official',
    date: '2026-01-05',
    status: 'Active'
  },
  {
    id: 4,
    employeeName: 'Ayesha Mahmood',
    loanAmount: 60000,
    paidAmount: 0,
    remainingAmount: 60000,
    payable: 60000,
    receivable: 0,
    loanType: 'Personal',
    date: '2026-01-18',
    status: 'Pending'
  }
];

export function Loans() {
  const [loans, setLoans] = useState<Loan[]>(initialLoans);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewLoan, setViewLoan] = useState<Loan | null>(null);
  const [editLoan, setEditLoan] = useState<Loan | null>(null);
  const [formData, setFormData] = useState({
    employeeName: '',
    loanAmount: '',
    paidAmount: '',
    loanType: 'Official' as 'Official' | 'Personal',
    date: new Date().toISOString().split('T')[0],
    payableReceivable: 'payable' as 'payable' | 'receivable'
  });

  const calculateLoanDetails = (loanAmount: number, paidAmount: number, type: 'payable' | 'receivable') => {
    const remaining = loanAmount - paidAmount;
    return {
      remainingAmount: remaining,
      payable: type === 'payable' ? remaining : 0,
      receivable: type === 'receivable' ? remaining : 0
    };
  };

  const handleAddLoan = () => {
    const loanAmount = parseFloat(formData.loanAmount);
    const paidAmount = parseFloat(formData.paidAmount);
    const details = calculateLoanDetails(loanAmount, paidAmount, formData.payableReceivable);

    const newLoan: Loan = {
      id: loans.length + 1,
      employeeName: formData.employeeName,
      loanAmount: loanAmount,
      paidAmount: paidAmount,
      remainingAmount: details.remainingAmount,
      payable: details.payable,
      receivable: details.receivable,
      loanType: formData.loanType,
      date: formData.date,
      status: paidAmount === 0 ? 'Pending' : (details.remainingAmount === 0 ? 'Completed' : 'Active')
    };
    setLoans([...loans, newLoan]);
    setIsAddModalOpen(false);
    resetForm();
    toast.success('Loan added successfully');
  };

  const handleEditLoan = () => {
    if (editLoan) {
      const loanAmount = parseFloat(formData.loanAmount);
      const paidAmount = parseFloat(formData.paidAmount);
      const details = calculateLoanDetails(loanAmount, paidAmount, formData.payableReceivable);

      setLoans(loans.map(loan => 
        loan.id === editLoan.id 
          ? { 
              ...editLoan,
              employeeName: formData.employeeName,
              loanAmount: loanAmount,
              paidAmount: paidAmount,
              remainingAmount: details.remainingAmount,
              payable: details.payable,
              receivable: details.receivable,
              loanType: formData.loanType,
              date: formData.date,
              status: paidAmount === 0 ? 'Pending' : (details.remainingAmount === 0 ? 'Completed' : 'Active')
            }
          : loan
      ));
      setEditLoan(null);
      resetForm();
      toast.success('Loan updated successfully');
    }
  };

  const handleDeleteLoan = (id: number) => {
    setLoans(loans.filter(loan => loan.id !== id));
    toast.success('Loan deleted successfully');
  };

  const openEditModal = (loan: Loan) => {
    setEditLoan(loan);
    setFormData({
      employeeName: loan.employeeName,
      loanAmount: loan.loanAmount.toString(),
      paidAmount: loan.paidAmount.toString(),
      loanType: loan.loanType,
      date: loan.date,
      payableReceivable: loan.payable > 0 ? 'payable' : 'receivable'
    });
  };

  const resetForm = () => {
    setFormData({
      employeeName: '',
      loanAmount: '',
      paidAmount: '',
      loanType: 'Official',
      date: new Date().toISOString().split('T')[0],
      payableReceivable: 'payable'
    });
  };

  const filteredLoans = loans.filter(loan =>
    loan.employeeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Active':
        return 'default';
      case 'Completed':
        return 'secondary';
      case 'Pending':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loans & Advances</h1>
          <p className="text-gray-500 mt-1">Track employee loans and advances</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#4f46e5] hover:bg-[#4338ca]">
              <Plus className="w-4 h-4 mr-2" />
              Add Loan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Loan</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="employee">Select Employee</Label>
                <Select value={formData.employeeName} onValueChange={(value) => setFormData({ ...formData, employeeName: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp} value={emp}>{emp}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="loanType">Loan Type</Label>
                <Select value={formData.loanType} onValueChange={(value: any) => setFormData({ ...formData, loanType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Official">Official Loan</SelectItem>
                    <SelectItem value="Personal">Personal Loan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="loanAmount">Loan Amount (PKR)</Label>
                <Input
                  id="loanAmount"
                  type="number"
                  value={formData.loanAmount}
                  onChange={(e) => setFormData({ ...formData, loanAmount: e.target.value })}
                  placeholder="Enter loan amount"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paidAmount">Paid Amount (PKR)</Label>
                <Input
                  id="paidAmount"
                  type="number"
                  value={formData.paidAmount}
                  onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                  placeholder="Enter paid amount"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payableReceivable">Type</Label>
                <Select value={formData.payableReceivable} onValueChange={(value: any) => setFormData({ ...formData, payableReceivable: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="payable">Payable (Loan Given)</SelectItem>
                    <SelectItem value="receivable">Receivable (Loan Taken)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsAddModalOpen(false); resetForm(); }}>Cancel</Button>
              <Button className="bg-[#4f46e5] hover:bg-[#4338ca]" onClick={handleAddLoan}>
                Add Loan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Total Loans</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {loans.length}
              </h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Total Payable</p>
              <h3 className="text-2xl font-bold text-[#ef4444]">
                PKR {loans.reduce((sum, loan) => sum + loan.payable, 0).toLocaleString()}
              </h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Total Receivable</p>
              <h3 className="text-2xl font-bold text-[#10b981]">
                PKR {loans.reduce((sum, loan) => sum + loan.receivable, 0).toLocaleString()}
              </h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Active Loans</p>
              <h3 className="text-2xl font-bold text-[#4f46e5]">
                {loans.filter(l => l.status === 'Active').length}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search loans by employee name..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Loans Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Loans ({filteredLoans.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Loan Type</TableHead>
                <TableHead>Loan Amount</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Payable</TableHead>
                <TableHead>Receivable</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLoans.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell className="font-medium">{loan.employeeName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{loan.loanType}</Badge>
                  </TableCell>
                  <TableCell className="font-semibold">PKR {loan.loanAmount.toLocaleString()}</TableCell>
                  <TableCell className="text-[#10b981]">PKR {loan.paidAmount.toLocaleString()}</TableCell>
                  <TableCell className="text-orange-600 font-medium">PKR {loan.remainingAmount.toLocaleString()}</TableCell>
                  <TableCell className="text-[#ef4444] font-medium">
                    {loan.payable > 0 ? `PKR ${loan.payable.toLocaleString()}` : '-'}
                  </TableCell>
                  <TableCell className="text-[#10b981] font-medium">
                    {loan.receivable > 0 ? `PKR ${loan.receivable.toLocaleString()}` : '-'}
                  </TableCell>
                  <TableCell>{loan.date}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(loan.status)}>
                      {loan.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setViewLoan(loan)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Loan Details</DialogTitle>
                          </DialogHeader>
                          {viewLoan && (
                            <div className="space-y-4 py-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-gray-500">Employee</p>
                                  <p className="font-medium">{viewLoan.employeeName}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Loan Type</p>
                                  <Badge variant="outline">{viewLoan.loanType}</Badge>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Loan Amount</p>
                                  <p className="font-bold text-lg">PKR {viewLoan.loanAmount.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Paid Amount</p>
                                  <p className="font-bold text-lg text-[#10b981]">PKR {viewLoan.paidAmount.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Remaining Amount</p>
                                  <p className="font-bold text-lg text-orange-600">PKR {viewLoan.remainingAmount.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Date</p>
                                  <p className="font-medium">{viewLoan.date}</p>
                                </div>
                                {viewLoan.payable > 0 && (
                                  <div>
                                    <p className="text-sm text-gray-500">Payable</p>
                                    <p className="font-bold text-lg text-[#ef4444]">PKR {viewLoan.payable.toLocaleString()}</p>
                                  </div>
                                )}
                                {viewLoan.receivable > 0 && (
                                  <div>
                                    <p className="text-sm text-gray-500">Receivable</p>
                                    <p className="font-bold text-lg text-[#10b981]">PKR {viewLoan.receivable.toLocaleString()}</p>
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm text-gray-500">Status</p>
                                  <Badge variant={getStatusVariant(viewLoan.status)}>
                                    {viewLoan.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Dialog open={editLoan?.id === loan.id} onOpenChange={(open) => !open && setEditLoan(null)}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEditModal(loan)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Edit Loan</DialogTitle>
                          </DialogHeader>
                          <div className="grid grid-cols-2 gap-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-employee">Select Employee</Label>
                              <Select value={formData.employeeName} onValueChange={(value) => setFormData({ ...formData, employeeName: value })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {employees.map((emp) => (
                                    <SelectItem key={emp} value={emp}>{emp}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-loanType">Loan Type</Label>
                              <Select value={formData.loanType} onValueChange={(value: any) => setFormData({ ...formData, loanType: value })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Official">Official Loan</SelectItem>
                                  <SelectItem value="Personal">Personal Loan</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-loanAmount">Loan Amount (PKR)</Label>
                              <Input
                                id="edit-loanAmount"
                                type="number"
                                value={formData.loanAmount}
                                onChange={(e) => setFormData({ ...formData, loanAmount: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-paidAmount">Paid Amount (PKR)</Label>
                              <Input
                                id="edit-paidAmount"
                                type="number"
                                value={formData.paidAmount}
                                onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-date">Date</Label>
                              <Input
                                id="edit-date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-payableReceivable">Type</Label>
                              <Select value={formData.payableReceivable} onValueChange={(value: any) => setFormData({ ...formData, payableReceivable: value })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="payable">Payable (Loan Given)</SelectItem>
                                  <SelectItem value="receivable">Receivable (Loan Taken)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => { setEditLoan(null); resetForm(); }}>Cancel</Button>
                            <Button className="bg-[#4f46e5] hover:bg-[#4338ca]" onClick={handleEditLoan}>
                              Save Changes
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteLoan(loan.id)}
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
    </div>
  );
}
