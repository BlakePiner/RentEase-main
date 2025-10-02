import { useState, useEffect } from "react";
import { 
  Building2, 
  Eye, 
  Check, 
  X, 
  Shield,
  Search,
  Filter,
  MapPin,
  Users,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Ban
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  getPropertyRequestsRequest, 
  updatePropertyRequestStatusRequest,
  type PropertyRequest,
  type PropertyRequestsResponse 
} from "@/api/adminApi";
import { toast } from "sonner";

const PropertyRequests = () => {
  const [data, setData] = useState<PropertyRequestsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<PropertyRequest | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await getPropertyRequestsRequest({
        page,
        limit: 20,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        search: search.trim() || undefined
      });
      setData(response.data);
    } catch (err: any) {
      console.error("Error fetching property requests:", err);
      toast.error("Failed to fetch property requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [page, statusFilter]);

  const handleSearch = () => {
    setPage(1);
    fetchRequests();
  };

  const handleStatusUpdate = async (listingId: string, status: 'APPROVED' | 'REJECTED' | 'BLOCKED') => {
    setActionLoading(listingId);
    try {
      await updatePropertyRequestStatusRequest(listingId, {
        status,
        adminNotes: adminNotes.trim() || undefined
      });
      
      toast.success(`Request ${status.toLowerCase()} successfully`);
      setSelectedRequest(null);
      setAdminNotes("");
      fetchRequests(); // Refresh the list
    } catch (err: any) {
      console.error("Error updating request status:", err);
      toast.error("Failed to update request status");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'ACTIVE': return 'bg-blue-100 text-blue-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'BLOCKED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4" />;
      case 'APPROVED': return <CheckCircle className="h-4 w-4" />;
      case 'ACTIVE': return <CheckCircle className="h-4 w-4" />;
      case 'REJECTED': return <X className="h-4 w-4" />;
      case 'BLOCKED': return <Ban className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW': return 'text-green-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'HIGH': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Property Requests</h1>
          <p className="text-gray-600">Review and approve property listing requests</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
            {data?.pagination.totalCount || 0} Total Requests
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by property, unit, or landlord..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="ACTIVE">Active</option>
              <option value="REJECTED">Rejected</option>
              <option value="BLOCKED">Blocked</option>
            </select>
            <Button onClick={handleSearch}>
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
      </Card>

      {/* Requests List */}
      <div className="grid gap-4">
        {data?.listings.map((request) => (
          <Card key={request.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-4 flex-1">
                {/* Property Image */}
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {request.unit.property.mainImageUrl ? (
                    <img 
                      src={request.unit.property.mainImageUrl} 
                      alt={request.unit.property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="h-8 w-8 text-gray-400" />
                  )}
                </div>

                {/* Request Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {request.unit.property.title} - {request.unit.label}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {request.unit.property.address}, {request.unit.property.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {formatCurrency(request.unit.targetPrice)}/month
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          Max {request.unit.maxOccupancy}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(request.status)}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1">{request.status}</span>
                      </Badge>
                    </div>
                  </div>

                  {/* Landlord Info */}
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={request.landlord.avatarUrl || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-xs">
                        {request.landlord.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{request.landlord.name}</p>
                      <p className="text-xs text-gray-500">{request.landlord.email}</p>
                    </div>
                  </div>

                  {/* Risk Assessment */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Shield className={`h-4 w-4 ${getRiskColor(request.riskLevel)}`} />
                      <span className={getRiskColor(request.riskLevel)}>
                        {request.riskLevel} Risk ({Math.round(request.fraudRiskScore * 100)}%)
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <Calendar className="h-4 w-4" />
                      {formatDate(request.createdAt)}
                    </div>
                    {request.attemptCount > 1 && (
                      <Badge variant="outline" className="text-orange-600">
                        Attempt #{request.attemptCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 ml-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedRequest(request)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Review Property Request</DialogTitle>
                    </DialogHeader>
                    {selectedRequest && (
                      <div className="space-y-4">
                        {/* Property Details */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Property Information</h4>
                            <div className="space-y-2 text-sm">
                              <p><span className="font-medium">Title:</span> {selectedRequest.unit.property.title}</p>
                              <p><span className="font-medium">Type:</span> {selectedRequest.unit.property.type}</p>
                              <p><span className="font-medium">Address:</span> {selectedRequest.unit.property.address}</p>
                              <p><span className="font-medium">Location:</span> {selectedRequest.unit.property.location}</p>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Unit Details</h4>
                            <div className="space-y-2 text-sm">
                              <p><span className="font-medium">Unit:</span> {selectedRequest.unit.label}</p>
                              <p><span className="font-medium">Price:</span> {formatCurrency(selectedRequest.unit.targetPrice)}/month</p>
                              <p><span className="font-medium">Deposit:</span> {formatCurrency(selectedRequest.unit.securityDeposit)}</p>
                              <p><span className="font-medium">Occupancy:</span> Max {selectedRequest.unit.maxOccupancy} people</p>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                          <p className="text-sm text-gray-600">{selectedRequest.unit.description}</p>
                        </div>

                        {/* Amenities */}
                        {selectedRequest.unit.amenities.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Amenities</h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedRequest.unit.amenities.map((amenity) => (
                                <Badge key={amenity.id} variant="outline">
                                  {amenity.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Admin Notes */}
                        {selectedRequest.status === 'PENDING' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Admin Notes (Optional)
                            </label>
                            <Textarea
                              placeholder="Add notes for approval/rejection..."
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                              rows={3}
                            />
                          </div>
                        )}

                        {/* Actions */}
                        {selectedRequest.status === 'PENDING' && (
                          <div className="flex gap-2 pt-4">
                            <Button
                              onClick={() => handleStatusUpdate(selectedRequest.id, 'APPROVED')}
                              disabled={actionLoading === selectedRequest.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleStatusUpdate(selectedRequest.id, 'REJECTED')}
                              disabled={actionLoading === selectedRequest.id}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleStatusUpdate(selectedRequest.id, 'BLOCKED')}
                              disabled={actionLoading === selectedRequest.id}
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Block
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </DialogContent>
                </Dialog>

                {request.status === 'PENDING' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedRequest(request);
                        handleStatusUpdate(request.id, 'APPROVED');
                      }}
                      disabled={actionLoading === request.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelectedRequest(request);
                        handleStatusUpdate(request.id, 'REJECTED');
                      }}
                      disabled={actionLoading === request.id}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {((data.pagination.currentPage - 1) * 20) + 1} to {Math.min(data.pagination.currentPage * 20, data.pagination.totalCount)} of {data.pagination.totalCount} requests
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={!data.pagination.hasPrev}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={!data.pagination.hasNext}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {data?.listings.length === 0 && (
        <Card className="p-12 text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No property requests found</h3>
          <p className="text-gray-600">
            {search || statusFilter !== "ALL" 
              ? "Try adjusting your search or filter criteria."
              : "Property listing requests will appear here when landlords submit them."
            }
          </p>
        </Card>
      )}
    </div>
  );
};

export default PropertyRequests;
