import { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  UserCheck, 
  UserX, 
  Mail, 
  Calendar,
  Home,
  DollarSign,
  FileText,
  Eye,
  Shield,
  AlertTriangle,
  Building2,
  CreditCard,
  User as UserIcon,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  getAllUsersRequest, 
  toggleUserStatusRequest, 
  type User, 
  type UsersResponse 
} from "@/api/adminApi";
import AdminViewLeaseModal from "@/components/AdminViewLeaseModal";

const AdminTenants = () => {
  const [tenants, setTenants] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false,
  });
  
  // Filters
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    page: 1,
    limit: 10,
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedTenantForLease, setSelectedTenantForLease] = useState<User | null>(null);
  const [isViewLeaseModalOpen, setIsViewLeaseModalOpen] = useState(false);

  // Fetch tenants
  const fetchTenants = async () => {
    setLoading(true);
    try {
      const response = await getAllUsersRequest({
        page: filters.page,
        limit: filters.limit,
        role: "TENANT", // Only fetch tenants
        status: filters.status || undefined,
        search: filters.search || undefined,
      });
      
      setTenants(response.data.users);
      setPagination(response.data.pagination);
    } catch (error: any) {
      console.error("Error fetching tenants:", error);
      toast.error("Failed to fetch tenants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, [filters]);

  // Handle search
  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }));
  };

  // Handle status filter
  const handleStatusFilter = (value: string) => {
    setFilters(prev => ({ ...prev, status: value === "all" ? "" : value, page: 1 }));
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // Handle view profile
  const handleViewProfile = (user: User) => {
    setSelectedUser(user);
    setIsProfileModalOpen(true);
  };

  // Handle view lease
  const handleViewLease = (tenant: User) => {
    setSelectedTenantForLease(tenant);
    setIsViewLeaseModalOpen(true);
  };

  // Handle toggle tenant status
  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await toggleUserStatusRequest(userId);
      toast.success(`Tenant ${currentStatus ? 'disabled' : 'enabled'} successfully`);
      fetchTenants(); // Refresh the list
    } catch (error: any) {
      console.error("Error toggling tenant status:", error);
      toast.error("Failed to update tenant status");
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (isDisabled: boolean) => {
    return isDisabled ? 'destructive' : 'default';
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate stats
  const activeTenants = tenants.filter(tenant => !tenant.isDisabled).length;
  const totalLeases = tenants.reduce((sum, tenant) => sum + tenant.leasesCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-gray-600">Manage tenant accounts and their lease information</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Shield className="h-4 w-4 mr-2" />
            Bulk Actions
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tenants</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.totalCount}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Tenants</p>
                <p className="text-2xl font-bold text-green-600">{activeTenants}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Leases</p>
                <p className="text-2xl font-bold text-purple-600">{totalLeases}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Disabled Tenants</p>
                <p className="text-2xl font-bold text-red-600">
                  {tenants.filter(tenant => tenant.isDisabled).length}
                </p>
              </div>
              <UserX className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tenants by name, email..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filters.status || "all"} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Tenants ({pagination.totalCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading tenants...</p>
              </div>
            </div>
          ) : tenants.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tenants found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={tenant.name} alt={tenant.name} />
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-500 text-white">
                        {tenant.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {tenant.name}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          TENANT
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(tenant.isDisabled)} className="text-xs">
                          {tenant.isDisabled ? 'Disabled' : 'Active'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{tenant.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Joined {formatDate(tenant.createdAt)}</span>
                        </div>
                        {tenant.lastLogin && (
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>Last login {formatDate(tenant.lastLogin)}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-6 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Home className="h-3 w-3" />
                          <span>Current residence</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          <span>{tenant.leasesCount} lease(s)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          <span>Payment history</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewProfile(user)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewLease(tenant)}>
                          <Home className="h-4 w-4 mr-2" />
                          View Lease
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Payment History
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(tenant.id, tenant.isDisabled)}
                          className={tenant.isDisabled ? "text-green-600" : "text-red-600"}
                        >
                          {tenant.isDisabled ? (
                            <>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Enable Tenant
                            </>
                          ) : (
                            <>
                              <UserX className="h-4 w-4 mr-2" />
                              Disable Tenant
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Showing {((pagination.currentPage - 1) * filters.limit) + 1} to{' '}
                {Math.min(pagination.currentPage * filters.limit, pagination.totalCount)} of{' '}
                {pagination.totalCount} results
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev}
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={page === pagination.currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Profile Modal */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              User Profile
            </DialogTitle>
            <DialogDescription>
              View detailed information about this user.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-lg">
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 blur-2xl opacity-70" />
                  <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 blur-3xl opacity-70" />
                </div>

                <div className="relative p-6 flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24 ring-4 ring-white shadow-lg">
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-xl font-semibold">
                        {selectedUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                      {selectedUser.name}
                    </h1>
                    <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Mail size={14} />
                        <span>{selectedUser.email}</span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                      <div className="text-sm text-gray-600 capitalize">
                        {selectedUser.role.toLowerCase()}
                      </div>
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                      <Badge
                        variant={selectedUser.isDisabled ? "destructive" : "default"}
                        className="text-xs"
                      >
                        {selectedUser.isDisabled ? "Disabled" : "Active"}
                      </Badge>
                      <Badge
                        variant={selectedUser.isVerified ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {selectedUser.isVerified ? "Verified" : "Unverified"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
                {/* Account Information Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6 space-y-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-50">
                      <Shield className="h-5 w-5 text-purple-600" />
                    </div>
                    <h2 className="font-semibold text-gray-900 text-lg">
                      Account Information
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">
                        Email
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900 flex items-center justify-between">
                        {selectedUser.email}
                        {selectedUser.isVerified ? (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                            Verified
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium">
                            Unverified
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">
                        Role
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900 capitalize">
                        {selectedUser.role.toLowerCase()}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">
                        Account Status
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900 flex items-center gap-2">
                        {selectedUser.isDisabled ? (
                          <>
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span className="text-red-600">Disabled</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-green-600">Active</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity Information Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6 space-y-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <h2 className="font-semibold text-gray-900 text-lg">
                      Activity Information
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                        <Calendar size={14} />
                        Joined
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                        {new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                        <Clock size={14} />
                        Last Login
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                        {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }) : '—'}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                        <Building2 size={14} />
                        Properties
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                        {selectedUser.propertiesCount} {selectedUser.propertiesCount === 1 ? 'property' : 'properties'}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                        <CreditCard size={14} />
                        Leases
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                        {selectedUser.leasesCount} {selectedUser.leasesCount === 1 ? 'lease' : 'leases'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Lease Modal */}
      {selectedTenantForLease && (
        <AdminViewLeaseModal
          isOpen={isViewLeaseModalOpen}
          onClose={() => {
            setIsViewLeaseModalOpen(false);
            setSelectedTenantForLease(null);
          }}
          tenantId={selectedTenantForLease.id}
          tenantName={`${selectedTenantForLease.firstName} ${selectedTenantForLease.lastName}`}
        />
      )}
    </div>
  );
};

export default AdminTenants;
