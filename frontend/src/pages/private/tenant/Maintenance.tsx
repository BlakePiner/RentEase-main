import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Wrench,
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  Home,
  MapPin,
  Filter,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getTenantMaintenanceRequests } from "@/api/tenantApi";
import MaintenanceRequestForm from "@/components/MaintenanceRequestForm";
import { toast } from "sonner";

const Maintenance = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await getTenantMaintenanceRequests();
      setRequests(response.data);
    } catch (err: any) {
      console.error("Error fetching maintenance requests:", err);
      toast.error("Failed to fetch maintenance requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSubmitSuccess = () => {
    fetchRequests(); // Refresh the requests list
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status?: string) => {
    if (!status) return "bg-gray-100 text-gray-800 border-gray-200";
    
    switch (status.toLowerCase()) {
      case "completed":
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending":
      case "open":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority?: string) => {
    if (!priority) return "bg-gray-100 text-gray-800 border-gray-200";
    
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status?: string) => {
    if (!status) return <Clock className="h-4 w-4" />;
    
    switch (status.toLowerCase()) {
      case "completed":
      case "resolved":
        return <CheckCircle className="h-4 w-4" />;
      case "in_progress":
        return <Clock className="h-4 w-4" />;
      case "pending":
      case "open":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/tenant">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/tenant">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Maintenance Requests</h1>
            <p className="text-gray-600 mt-1">Submit and track maintenance requests</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setShowSubmitForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Submit Request
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Wrench className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {requests.filter(r => r.status === "COMPLETED" || r.status === "RESOLVED").length}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">
                  {requests.filter(r => r.status === "IN_PROGRESS").length}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {requests.filter(r => r.status === "PENDING" || r.status === "OPEN").length}
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Request List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Maintenance Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length > 0 ? (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">Maintenance Request</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {request.description}
                      </p>
                      {request.photoUrl && (
                        <div className="mt-2">
                          <img 
                            src={`http://localhost:5000${request.photoUrl}`} 
                            alt="Maintenance issue" 
                            className="w-20 h-20 object-cover rounded border"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Badge
                        variant="outline"
                        className={`text-xs ${getStatusColor(request.status)}`}
                      >
                        {getStatusIcon(request.status)}
                        <span className="ml-1">{request.status || 'OPEN'}</span>
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Home className="h-4 w-4" />
                        <span>{request.unit?.label || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{request.property?.title || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(request.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Maintenance Requests</h3>
              <p className="text-gray-600 mb-4">
                Submit a maintenance request if you need any repairs or assistance.
              </p>
              <Button onClick={() => setShowSubmitForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Submit Request
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Maintenance Request Form Modal */}
      <MaintenanceRequestForm
        isOpen={showSubmitForm}
        onClose={() => setShowSubmitForm(false)}
        onSuccess={handleSubmitSuccess}
      />
    </div>
  );
};

export default Maintenance;
