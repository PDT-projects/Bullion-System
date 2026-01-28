import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Progress } from "../ui/progress";
import { 
  UserPlus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Phone, 
  Mail, 
  Calendar,
  TrendingUp,
  Clock,
  DollarSign
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const leads = [
  {
    id: 1,
    name: "Jennifer Adams",
    company: "Tech Solutions Inc",
    email: "j.adams@techsol.com",
    phone: "+1 (555) 123-4567",
    source: "Website",
    status: "new",
    score: 85,
    value: "$25,000",
    assignedTo: "John Smith",
    lastActivity: "2024-08-12",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face"
  },
  {
    id: 2,
    name: "Robert Miller",
    company: "Manufacturing Plus",
    email: "r.miller@manufplus.com",
    phone: "+1 (555) 234-5678",
    source: "Referral",
    status: "qualified",
    score: 92,
    value: "$45,000",
    assignedTo: "Sarah Wilson",
    lastActivity: "2024-08-11",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face"
  },
  {
    id: 3,
    name: "Amanda Foster",
    company: "Digital Marketing Co",
    email: "amanda@digitalmark.com",
    phone: "+1 (555) 345-6789",
    source: "Social Media",
    status: "contacted",
    score: 78,
    value: "$18,500",
    assignedTo: "Mike Johnson",
    lastActivity: "2024-08-10",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face"
  },
  {
    id: 4,
    name: "Carlos Rodriguez",
    company: "Logistics Express",
    email: "c.rodriguez@logexp.com",
    phone: "+1 (555) 456-7890",
    source: "Cold Call",
    status: "proposal",
    score: 88,
    value: "$67,000",
    assignedTo: "Lisa Chen",
    lastActivity: "2024-08-12",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face"
  },
  {
    id: 5,
    name: "Diana Taylor",
    company: "Healthcare Solutions",
    email: "diana.t@healthsol.com",
    phone: "+1 (555) 567-8901",
    source: "Website",
    status: "negotiation",
    score: 95,
    value: "$89,000",
    assignedTo: "John Smith",
    lastActivity: "2024-08-11",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=32&h=32&fit=crop&crop=face"
  }
];

export function Leads() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'proposal': return 'bg-purple-100 text-purple-800';
      case 'negotiation': return 'bg-orange-100 text-orange-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1>Leads Management</h1>
          <p className="text-muted-foreground">Track and manage your sales leads through the pipeline</p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add New Lead
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold">147</p>
              </div>
              <UserPlus className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Qualified</p>
                <p className="text-2xl font-bold">89</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">34</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Closed Won</p>
                <p className="text-2xl font-bold">23</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">$244K</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-input-background border-0"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="proposal">Proposal</SelectItem>
            <SelectItem value="negotiation">Negotiation</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Leads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLeads.map((lead) => (
          <Card key={lead.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={lead.avatar} alt={lead.name} />
                    <AvatarFallback>{lead.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{lead.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{lead.company}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Phone className="mr-2 h-4 w-4" />
                      Call
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Mail className="mr-2 h-4 w-4" />
                      Email
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule Follow-up
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Edit Lead</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <Badge className={getStatusColor(lead.status)}>
                  {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                </Badge>
                <span className="font-semibold text-lg">{lead.value}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Lead Score</span>
                  <span className={getScoreColor(lead.score)}>{lead.score}%</span>
                </div>
                <Progress value={lead.score} className="h-2" />
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{lead.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{lead.phone}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-sm text-muted-foreground border-t pt-3">
                <div>
                  <span>Source: </span>
                  <span className="font-medium">{lead.source}</span>
                </div>
                <div>
                  <span>Assigned: </span>
                  <span className="font-medium">{lead.assignedTo}</span>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                Last activity: {new Date(lead.lastActivity).toLocaleDateString()}
              </div>
              
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Phone className="mr-2 h-3 w-3" />
                  Call
                </Button>
                <Button size="sm" className="flex-1">
                  <Calendar className="mr-2 h-3 w-3" />
                  Follow-up
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}