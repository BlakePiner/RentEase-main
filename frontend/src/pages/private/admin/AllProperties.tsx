import { useState, useEffect } from "react";
import { 
  Building2, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  MapPin,
  Calendar,
  User,
  Home,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Wrench
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
  getAllPropertiesRequest, 
  type Property, 
  type PropertiesResponse 
} from "@/api/adminApi";

const AllProperties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
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
    type: "",
    status: "",
    page: 1,
    limit: 10,
  });
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);

  // Fetch properties
  const fetchProperties = async () => {
    setLoading(true);
    try {
      const response = await getAllPropertiesRequest({
        page: filters.page,
        limit: filters.limit,
        search: filters.search || undefined,
        type: filters.type || undefined,
        status: filters.status || undefined,
      });

      const data: PropertiesResponse = response.data;
      setProperties(data.properties);
      setPagination(data.pagination);
    } catch (error: any) {
      console.error("Error fetching properties:", error);
      
      if (error.response?.status === 401) {
        toast.error("Unauthorized. Please log in again.");
      } else if (error.response?.status === 403) {
        toast.error("Access denied. You don't have permission to view properties.");
      } else if (error.response?.status === 500) {
        toast.error("Server error. Please try again later.");
      } else if (error.code === 'ERR_NETWORK') {
        toast.error("Network error. Please check your connection.");
      } else {
        toast.error("Failed to fetch properties. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [filters]);

  // Handle search
  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }));
  };

  // Handle type filter
  const handleTypeFilter = (value: string) => {
    setFilters(prev => ({ ...prev, type: value === "all" ? "" : value, page: 1 }));
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // Handle view property
  const handleViewProperty = (property: Property) => {
    setSelectedProperty(property);
    setIsPropertyModalOpen(true);
  };

  // Get property type badge variant
  const getPropertyTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'APARTMENT':
        return 'default';
      case 'CONDOMINIUM':
        return 'secondary';
      case 'BOARDING_HOUSE':
        return 'outline';
      case 'SINGLE_HOUSE':
        return 'destructive';
      default:
        return 'default';
    }
  };

  // Get unit status badge variant
  const getUnitStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'default';
      case 'OCCUPIED':
        return 'secondary';
      case 'MAINTENANCE':
        return 'destructive';
      case 'UNAVAILABLE':
        return 'outline';
      default:
        return 'default';
    }
  };

  // Calculate statistics
  const totalProperties = pagination.totalCount;
  const totalUnits = properties.reduce((sum, property) => sum + property.unitsCount, 0);
  const availableUnits = properties.reduce((sum, property) => 
    sum + property.units.filter(unit => unit.status === 'AVAILABLE').length, 0
  );
  const occupiedUnits = properties.reduce((sum, property) => 
    sum + property.units.filter(unit => unit.status === 'OCCUPIED').length, 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Properties</h1>
          <p className="text-gray-600 mt-1">
            Manage all properties created by landlords
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-50">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Properties</p>
                <p className="text-2xl font-bold text-gray-900">{totalProperties}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-green-50">
                <Home className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Units</p>
                <p className="text-2xl font-bold text-gray-900">{totalUnits}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-emerald-50">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Units</p>
                <p className="text-2xl font-bold text-gray-900">{availableUnits}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-orange-50">
                <User className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Occupied Units</p>
                <p className="text-2xl font-bold text-gray-900">{occupiedUnits}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search properties by title, address, or owner..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={filters.type || "all"} onValueChange={handleTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="APARTMENT">Apartment</SelectItem>
                  <SelectItem value="CONDOMINIUM">Condominium</SelectItem>
                  <SelectItem value="BOARDING_HOUSE">Boarding House</SelectItem>
                  <SelectItem value="SINGLE_HOUSE">Single House</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Properties List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Properties ({pagination.totalCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
              <p className="text-gray-600">
                {filters.search || filters.type !== ""
                  ? "Try adjusting your search or filter criteria."
                  : "No properties have been created yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Property Image */}
                    <div className="w-full lg:w-48 h-32 lg:h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {property.mainImageUrl ? (
                        <img
                          src={property.mainImageUrl}
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Property Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {property.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={getPropertyTypeBadgeVariant(property.type)}>
                              {property.type.replace('_', ' ')}
                            </Badge>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <MapPin size={14} />
                              <span>{property.address}</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{property.city}</p>
                        </div>
                      </div>

                      {/* Property Stats */}
                      <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Home size={14} />
                          <span>{property.unitsCount} units</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User size={14} />
                          <span>{property.owner.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>Created {new Date(property.createdAt).toLocaleDateString()}</span>
                        </div>
                        {property.maintenanceRequestsCount > 0 && (
                          <div className="flex items-center gap-1 text-orange-600">
                            <Wrench size={14} />
                            <span>{property.maintenanceRequestsCount} maintenance</span>
                          </div>
                        )}
                      </div>

                      {/* Units Preview */}
                      {property.units.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">Units:</p>
                          <div className="flex flex-wrap gap-2">
                            {property.units.slice(0, 3).map((unit) => (
                              <Badge
                                key={unit.id}
                                variant={getUnitStatusBadgeVariant(unit.status)}
                                className="text-xs"
                              >
                                {unit.label} - {unit.status}
                              </Badge>
                            ))}
                            {property.units.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{property.units.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewProperty(property)}>
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
                            <Building2 className="h-4 w-4 mr-2" />
                            View Units
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <User className="h-4 w-4 mr-2" />
                            Contact Owner
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Wrench className="h-4 w-4 mr-2" />
                            Maintenance History
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing {((pagination.currentPage - 1) * filters.limit) + 1} to{" "}
                {Math.min(pagination.currentPage * filters.limit, pagination.totalCount)} of{" "}
                {pagination.totalCount} properties
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
                <span className="text-sm text-gray-600">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
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

      {/* Property Details Modal */}
      <Dialog open={isPropertyModalOpen} onOpenChange={setIsPropertyModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Property Details
            </DialogTitle>
            <DialogDescription>
              View detailed information about this property.
            </DialogDescription>
          </DialogHeader>

          {selectedProperty && (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-lg">
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 blur-2xl opacity-70" />
                  <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 blur-3xl opacity-70" />
                </div>

                <div className="relative p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Property Image */}
                    <div className="w-full lg:w-64 h-48 lg:h-40 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {selectedProperty.mainImageUrl ? (
                        <img
                          src={selectedProperty.mainImageUrl}
                          alt={selectedProperty.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                        {selectedProperty.title}
                      </h1>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={getPropertyTypeBadgeVariant(selectedProperty.type)}>
                          {selectedProperty.type.replace('_', ' ')}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin size={14} />
                          <span>{selectedProperty.address}</span>
                        </div>
                      </div>
                      <p className="text-gray-600 mt-1">{selectedProperty.city}</p>
                      {selectedProperty.zipCode && (
                        <p className="text-sm text-gray-500">ZIP: {selectedProperty.zipCode}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Property Information Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <h2 className="font-semibold text-gray-900 text-lg">
                      Property Information
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">
                        Property Type
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                        {selectedProperty.type.replace('_', ' ')}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">
                        Total Units
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                        {selectedProperty.unitsCount} {selectedProperty.unitsCount === 1 ? 'unit' : 'units'}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">
                        Maintenance Requests
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                        {selectedProperty.maintenanceRequestsCount} {selectedProperty.maintenanceRequestsCount === 1 ? 'request' : 'requests'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Owner Information Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-50">
                      <User className="h-5 w-5 text-purple-600" />
                    </div>
                    <h2 className="font-semibold text-gray-900 text-lg">
                      Owner Information
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">
                        Owner Name
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                        {selectedProperty.owner.name}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">
                        Email
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                        {selectedProperty.owner.email}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">
                        Account Status
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900 flex items-center gap-2">
                        {selectedProperty.owner.isDisabled ? (
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
              </div>

              {/* Units Information */}
              {selectedProperty.units.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-50">
                      <Home className="h-5 w-5 text-green-600" />
                    </div>
                    <h2 className="font-semibold text-gray-900 text-lg">
                      Units ({selectedProperty.units.length})
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedProperty.units.map((unit) => (
                      <div key={unit.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900">{unit.label}</h3>
                          <Badge variant={getUnitStatusBadgeVariant(unit.status)}>
                            {unit.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <DollarSign size={14} />
                          <span>₱{unit.targetPrice.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline Information */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-50">
                    <Clock className="h-5 w-5 text-gray-600" />
                  </div>
                  <h2 className="font-semibold text-gray-900 text-lg">
                    Timeline
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Calendar size={14} />
                      Created
                    </label>
                    <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                      {new Date(selectedProperty.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Clock size={14} />
                      Last Updated
                    </label>
                    <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                      {new Date(selectedProperty.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AllProperties;
