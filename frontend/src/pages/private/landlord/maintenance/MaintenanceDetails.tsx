import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Wrench,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MapPin,
  Home,
  User,
  Phone,
  Mail,
  Camera,
  Settings,
  MoreHorizontal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  getMaintenanceRequestDetailsRequest, 
  updateMaintenanceRequestStatusRequest,
  deleteMaintenanceRequestRequest,
  type MaintenanceRequestDetails 
} from "@/api/landlordMaintenanceApi";
import { toast } from "sonner";

const MaintenanceDetails = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<MaintenanceRequestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");

  useEffect(() => {
    if (!requestId) return;

    const controller = new AbortController();
    const fetchRequestDetails = async () => {
      setLoading(true);
      try {
        const response = await getMaintenanceRequestDetailsRequest(requestId, { signal: controller.signal });
        setRequest(response.data);
        setNewStatus(response.data.status);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Error fetching maintenance request details:", err);
          toast.error("Failed to fetch maintenance request details");
          navigate("/landlord/maintenance");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRequestDetails();
    return () => controller.abort();
  }, [requestId, navigate]);

  const handleStatusUpdate = async () => {
    if (!request || !requestId || newStatus === request.status) return;

    setUpdating(true);
    try {
      await updateMaintenanceRequestStatusRequest(requestId, { status: newStatus as any });
      toast.success("Maintenance request status updated successfully");
      // Refresh the request data
      const response = await getMaintenanceRequestDetailsRequest(requestId);
      setRequest(response.data);
    } catch (err: any) {
      console.error("Error updating maintenance request status:", err);
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!request || !requestId) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete this maintenance request? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteMaintenanceRequestRequest(requestId);
      toast.success("Maintenance request deleted successfully");
      navigate("/landlord/maintenance");
    } catch (err: any) {
      console.error("Error deleting maintenance request:", err);
      toast.error(err.response?.data?.message || "Failed to delete maintenance request");
    } finally {
      setDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-red-100 text-red-800 border-red-200";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "RESOLVED":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OPEN":
        return <AlertTriangle className="h-4 w-4" />;
      case "IN_PROGRESS":
        return <Clock className="h-4 w-4" />;
      case "RESOLVED":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800 border-red-200";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "LOW":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/landlord/maintenance">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Maintenance
            </Link>
          </Button>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/landlord/maintenance">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Maintenance
            </Link>
          </Button>
        </div>
        <Card className="p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
            <XCircle className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="text-base font-medium text-gray-900 mb-2">Request Not Found</h3>
          <p className="text-gray-600 text-sm mb-4">
            The maintenance request you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button asChild>
            <Link to="/landlord/maintenance">Back to Maintenance</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/landlord/maintenance">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Maintenance
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Maintenance Request</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={`text-xs ${getStatusColor(request.status)}`}>
                {getStatusIcon(request.status)}
                <span className="ml-1">{request.status.replace('_', ' ')}</span>
              </Badge>
              <Badge variant="outline" className={`text-xs ${getPriorityColor(request.priority)}`}>
                {request.priority} Priority
              </Badge>
              {request.daysOpen >= 7 && request.status === "OPEN" && (
                <Badge variant="outline" className="text-xs bg-red-100 text-red-800 border-red-200">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Urgent
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDelete}
            disabled={deleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Request Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Description</label>
                <p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">{request.description}</p>
              </div>
              
              {request.photoUrl && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Photo</label>
                  <div className="mt-2">
                    <img
                      src={`http://localhost:5000${request.photoUrl}`}
                      alt="Maintenance request photo"
                      className="w-full max-w-md h-64 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Property & Unit Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Property & Unit Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{request.property.title}</p>
                    <p className="text-sm text-gray-600">{request.property.address}</p>
                  </div>
                </div>
                {request.unit && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Unit:</span>
                    <span className="font-medium text-gray-900">{request.unit.label}</span>
                    <Badge variant="outline" className="text-xs ml-2">
                      {request.unit.status}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Reporter Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Reporter Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center text-white font-medium">
                  {request.reporter.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{request.reporter.fullName}</h3>
                  <div className="space-y-1 mt-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span>{request.reporter.email}</span>
                    </div>
                    {request.reporter.phoneNumber && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{request.reporter.phoneNumber}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>Role:</span>
                      <Badge variant="outline" className="text-xs">
                        {request.reporter.role}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Status Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Current Status</label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-xs ${getStatusColor(request.status)}`}>
                    {getStatusIcon(request.status)}
                    <span className="ml-1">{request.status.replace('_', ' ')}</span>
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Update Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newStatus !== request.status && (
                <Button 
                  onClick={handleStatusUpdate}
                  disabled={updating}
                  className="w-full bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600"
                >
                  {updating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Update Status
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Timeline Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Submitted</span>
                  <span className="text-sm text-gray-900">{request.timeInfo.timeAgo}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Days Open</span>
                  <span className={`text-sm font-medium ${
                    request.daysOpen >= 7 ? 'text-red-600' : 
                    request.daysOpen >= 3 ? 'text-yellow-600' : 
                    'text-gray-900'
                  }`}>
                    {request.daysOpen} days
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Hours Open</span>
                  <span className="text-sm text-gray-900">{request.timeInfo.hoursOpen} hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="text-sm text-gray-900">
                    {new Date(request.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Priority Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Priority Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Priority Level</span>
                <Badge variant="outline" className={`text-xs ${getPriorityColor(request.priority)}`}>
                  {request.priority}
                </Badge>
              </div>
              <div className="text-xs text-gray-500">
                Priority is automatically calculated based on:
                <ul className="mt-1 space-y-1">
                  <li>• Status (Open requests get higher priority)</li>
                  <li>• Age (Older requests get higher priority)</li>
                  <li>• Duration (Long-running requests get higher priority)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceDetails;
