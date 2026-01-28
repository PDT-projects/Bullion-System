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

interface Employee {
  id: number;
  name: string;
  position: string;
  department: string;
  salary: number;
  joinDate: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive';
}

const initialEmployees: Employee[] = [
  {
    id: 1,
    name: 'Ahmed Khan',
    position: 'Sales Manager',
    department: 'Sales',
    salary: 85000,
    joinDate: '2024-01-15',
    email: 'ahmed.khan@pdt.com',
    phone: '+92 300 1234567',
    status: 'Active'
  },
  {
    id: 2,
    name: 'Fatima Ali',
    position: 'Marketing Executive',
    department: 'Marketing',
    salary: 65000,
    joinDate: '2024-03-20',
    email: 'fatima.ali@pdt.com',
    phone: '+92 321 2345678',
    status: 'Active'
  },
  {
    id: 3,
    name: 'Hassan Raza',
    position: 'Technical Support',
    department: 'Technical',
    salary: 55000,
    joinDate: '2024-02-10',
    email: 'hassan.raza@pdt.com',
    phone: '+92 333 3456789',
    status: 'Active'
  },
  {
    id: 4,
    name: 'Ayesha Mahmood',
    position: 'Accountant',
    department: 'Finance',
    salary: 70000,
    joinDate: '2023-11-05',
    email: 'ayesha.mahmood@pdt.com',
    phone: '+92 345 4567890',
    status: 'Active'
  },
  {
    id: 5,
    name: 'Usman Tariq',
    position: 'Product Manager',
    department: 'Operations',
    salary: 95000,
    joinDate: '2023-09-12',
    email: 'usman.tariq@pdt.com',
    phone: '+92 311 5678901',
    status: 'Active'
  },
];

export function Employees() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    department: '',
    salary: '',
    joinDate: '',
    email: '',
    phone: '',
    status: 'Active' as 'Active' | 'Inactive'
  });

  const handleAddEmployee = () => {
    const newEmployee: Employee = {
      id: employees.length + 1,
      name: formData.name,
      position: formData.position,
      department: formData.department,
      salary: parseFloat(formData.salary),
      joinDate: formData.joinDate,
      email: formData.email,
      phone: formData.phone,
      status: formData.status
    };
    setEmployees([...employees, newEmployee]);
    setIsAddModalOpen(false);
    setFormData({
      name: '',
      position: '',
      department: '',
      salary: '',
      joinDate: '',
      email: '',
      phone: '',
      status: 'Active'
    });
    toast.success('Employee added successfully');
  };

  const handleEditEmployee = () => {
    if (editEmployee) {
      setEmployees(employees.map(emp => 
        emp.id === editEmployee.id 
          ? { ...editEmployee, ...formData, salary: parseFloat(formData.salary) }
          : emp
      ));
      setEditEmployee(null);
      setFormData({
        name: '',
        position: '',
        department: '',
        salary: '',
        joinDate: '',
        email: '',
        phone: '',
        status: 'Active'
      });
      toast.success('Employee updated successfully');
    }
  };

  const handleDeleteEmployee = (id: number) => {
    setEmployees(employees.filter(emp => emp.id !== id));
    toast.success('Employee deleted successfully');
  };

  const openEditModal = (employee: Employee) => {
    setEditEmployee(employee);
    setFormData({
      name: employee.name,
      position: employee.position,
      department: employee.department,
      salary: employee.salary.toString(),
      joinDate: employee.joinDate,
      email: employee.email,
      phone: employee.phone,
      status: employee.status
    });
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500 mt-1">Manage your employee records</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#4f46e5] hover:bg-[#4338ca]">
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Enter position"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="HR">Human Resources</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary">Salary (PKR)</Label>
                <Input
                  id="salary"
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  placeholder="Enter salary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="joinDate">Join Date</Label>
                <Input
                  id="joinDate"
                  type="date"
                  value={formData.joinDate}
                  onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+92 300 1234567"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="employee@pdt.com"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
              <Button className="bg-[#4f46e5] hover:bg-[#4338ca]" onClick={handleAddEmployee}>
                Add Employee
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search employees by name, position, or department..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Employees ({filteredEmployees.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{employee.department}</Badge>
                  </TableCell>
                  <TableCell>PKR {employee.salary.toLocaleString()}</TableCell>
                  <TableCell>{employee.joinDate}</TableCell>
                  <TableCell>
                    <Badge variant={employee.status === 'Active' ? 'default' : 'secondary'}>
                      {employee.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setViewEmployee(employee)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Employee Details</DialogTitle>
                          </DialogHeader>
                          {viewEmployee && (
                            <div className="space-y-4 py-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-gray-500">Name</p>
                                  <p className="font-medium">{viewEmployee.name}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Position</p>
                                  <p className="font-medium">{viewEmployee.position}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Department</p>
                                  <p className="font-medium">{viewEmployee.department}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Salary</p>
                                  <p className="font-medium">PKR {viewEmployee.salary.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Email</p>
                                  <p className="font-medium">{viewEmployee.email}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Phone</p>
                                  <p className="font-medium">{viewEmployee.phone}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Join Date</p>
                                  <p className="font-medium">{viewEmployee.joinDate}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Status</p>
                                  <Badge variant={viewEmployee.status === 'Active' ? 'default' : 'secondary'}>
                                    {viewEmployee.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Dialog open={editEmployee?.id === employee.id} onOpenChange={(open) => !open && setEditEmployee(null)}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEditModal(employee)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Edit Employee</DialogTitle>
                          </DialogHeader>
                          <div className="grid grid-cols-2 gap-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-name">Full Name</Label>
                              <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-position">Position</Label>
                              <Input
                                id="edit-position"
                                value={formData.position}
                                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-department">Department</Label>
                              <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Sales">Sales</SelectItem>
                                  <SelectItem value="Marketing">Marketing</SelectItem>
                                  <SelectItem value="Technical">Technical</SelectItem>
                                  <SelectItem value="Finance">Finance</SelectItem>
                                  <SelectItem value="Operations">Operations</SelectItem>
                                  <SelectItem value="HR">Human Resources</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-salary">Salary (PKR)</Label>
                              <Input
                                id="edit-salary"
                                type="number"
                                value={formData.salary}
                                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-joinDate">Join Date</Label>
                              <Input
                                id="edit-joinDate"
                                type="date"
                                value={formData.joinDate}
                                onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-phone">Phone</Label>
                              <Input
                                id="edit-phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2 col-span-2">
                              <Label htmlFor="edit-email">Email</Label>
                              <Input
                                id="edit-email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setEditEmployee(null)}>Cancel</Button>
                            <Button className="bg-[#4f46e5] hover:bg-[#4338ca]" onClick={handleEditEmployee}>
                              Save Changes
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteEmployee(employee.id)}
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
