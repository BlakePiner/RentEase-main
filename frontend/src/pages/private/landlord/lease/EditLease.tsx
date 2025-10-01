import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  FileText,
  Calendar,
  DollarSign,
  Users,
  Home,
  User,
  AlertCircle,
  Upload,
  X,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  getLeaseDetailsRequest,
  updateLeaseRequest,
  type LeaseDetails,
  type UpdateLeaseData 
} from "@/api/landlordLeaseApi";
import { getLandlordPropertiesRequest } from "@/api/landlordPropertyApi";
import { getTenantsRequest } from "@/api/tenantApi";
import { toast } from "sonner";

interface Property {
  id: string;
  title: string;
  unitsSummary: {
    total: number;
    available: number;
    occupied: number;
  };
}

interface Unit {
  id: string;
  label: string;
  status: string;
  targetPrice: number;
}

interface Tenant {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phoneNumber: string | null;
}

const EditLease = () => {
  const { leaseId } = useParams<{ leaseId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lease, setLease] = useState<LeaseDetails | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState<UpdateLeaseData>({
    leaseNickname: "",
    leaseType: "",
    startDate: "",
    endDate: "",
    rentAmount: 0,
    interval: "MONTHLY",
    status: "DRAFT",
    hasFormalDocument: false,
    landlordName: "",
    tenantName: "",
    notes: "",
  });

  // Load initial data
  useEffect(() => {
    if (!leaseId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [leaseRes, propertiesRes] = await Promise.all([
          getLeaseDetailsRequest(leaseId),
          getLandlordPropertiesRequest(),
        ]);
        
        setLease(leaseRes.data);
        setProperties(propertiesRes.data);
        
        // Pre-fill form with lease data
        const leaseData = leaseRes.data;
        setFormData({
          leaseNickname: leaseData.leaseNickname,
          leaseType: leaseData.leaseType,
          startDate: leaseData.startDate.split('T')[0], // Convert to date input format
          endDate: leaseData.endDate ? leaseData.endDate.split('T')[0] : "",
          rentAmount: leaseData.rentAmount,
          interval: leaseData.interval,
          status: leaseData.status,
          hasFormalDocument: leaseData.hasFormalDocument,
          landlordName: leaseData.landlordName || "",
          tenantName: leaseData.tenantName || "",
          notes: leaseData.notes || "",
        });

        // Load units for the current property
        const mockUnits: Unit[] = [
          { id: leaseData.unit.id, label: leaseData.unit.label, status: leaseData.unit.status, targetPrice: leaseData.unit.targetPrice },
        ];
        setUnits(mockUnits);

        // Load tenants
        const tenantsRes = await getTenantsRequest();
        setTenants(tenantsRes.data);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        toast.error("Failed to load lease data");
        navigate("/landlord/leases");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [leaseId, navigate]);

  const handleInputChange = (field: keyof UpdateLeaseData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB
        toast.error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, hasFormalDocument: true }));
    }
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    setFilePreview(null);
    setFormData(prev => ({ ...prev, hasFormalDocument: false }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!leaseId) return;

    setSaving(true);
    try {
      // Create FormData for file upload
      const submitData = new FormData();
      
      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          submitData.append(key, value.toString());
        }
      });
      
      // Add unitId and tenantId from the current lease
      if (lease?.unitId) {
        submitData.append('unitId', lease.unitId);
      }
      if (lease?.tenantId) {
        submitData.append('tenantId', lease.tenantId);
      }
      
      // Add file if selected
      if (selectedFile) {
        submitData.append('leaseDocument', selectedFile);
      }
      
      // Debug: Log FormData contents
      console.log("=== FORM DATA DEBUG ===");
      for (let [key, value] of submitData.entries()) {
        console.log(`${key}:`, value);
      }
      console.log("======================");
      
      await updateLeaseRequest(leaseId, submitData);
      toast.success("Lease updated successfully");
      navigate(`/landlord/leases/${leaseId}`);
    } catch (err: any) {
      console.error("Error updating lease:", err);
      toast.error(err.response?.data?.message || "Failed to update lease");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <button onClick={() => navigate("/landlord/leases")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Leases
            </button>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Lease</h1>
            <p className="text-gray-600 mt-1">Update lease information</p>
          </div>
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

  if (!lease) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <button onClick={() => navigate("/landlord/leases")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Leases
            </button>
          </Button>
        </div>
        <Card className="p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="text-base font-medium text-gray-900 mb-2">Lease Not Found</h3>
          <p className="text-gray-600 text-sm mb-4">
            The lease you're trying to edit doesn't exist or you don't have permission to edit it.
          </p>
          <Button asChild>
            <button onClick={() => navigate("/landlord/leases")}>Back to Leases</button>
          </Button>
        </Card>
      </div>
    );
  }

  const selectedProperty = properties.find(p => p.id === lease.unit.property.id);
  const selectedUnit = units.find(u => u.id === lease.unit.id);
  const selectedTenant = tenants.find(t => t.id === lease.tenant.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <button onClick={() => navigate(`/landlord/leases/${leaseId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Lease Details
          </button>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Lease</h1>
          <p className="text-gray-600 mt-1">Update lease information for {lease.leaseNickname}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="leaseNickname">Lease Nickname *</Label>
                    <Input
                      id="leaseNickname"
                      value={formData.leaseNickname}
                      onChange={(e) => handleInputChange("leaseNickname", e.target.value)}
                      placeholder="e.g., John's Apartment Lease"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leaseType">Lease Type *</Label>
                    <Select value={formData.leaseType} onValueChange={(value) => handleInputChange("leaseType", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select lease type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STANDARD">Standard Lease</SelectItem>
                        <SelectItem value="MONTH_TO_MONTH">Month-to-Month</SelectItem>
                        <SelectItem value="SHORT_TERM">Short Term</SelectItem>
                        <SelectItem value="LONG_TERM">Long Term</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange("startDate", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange("endDate", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Additional notes about the lease..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Property & Unit Information (Read-only) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Property & Unit Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{lease.unit.property.title}</p>
                        <p className="text-sm text-gray-600">{lease.unit.property.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Unit:</span>
                      <span className="font-medium text-gray-900">{lease.unit.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Unit Status:</span>
                      <span className="text-sm font-medium text-gray-900">{lease.unit.status}</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Property and unit information cannot be changed after lease creation.
                </p>
              </CardContent>
            </Card>

            {/* Tenant Information (Read-only) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Tenant Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center text-white font-medium">
                      {lease.tenant.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{lease.tenant.fullName}</h3>
                      <div className="space-y-1 mt-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>{lease.tenant.email}</span>
                        </div>
                        {lease.tenant.phoneNumber && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>{lease.tenant.phoneNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Tenant information cannot be changed after lease creation.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rentAmount">Rent Amount *</Label>
                  <Input
                    id="rentAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.rentAmount}
                    onChange={(e) => handleInputChange("rentAmount", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interval">Payment Interval *</Label>
                  <Select value={formData.interval} onValueChange={(value: "DAILY" | "WEEKLY" | "MONTHLY") => handleInputChange("interval", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Daily</SelectItem>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Lease Status *</Label>
                  <Select value={formData.status} onValueChange={(value: "DRAFT" | "ACTIVE" | "EXPIRED" | "TERMINATED") => handleInputChange("status", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="EXPIRED">Expired</SelectItem>
                      <SelectItem value="TERMINATED">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Document Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Document Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="hasFormalDocument">Has Formal Document</Label>
                  <Switch
                    id="hasFormalDocument"
                    checked={formData.hasFormalDocument}
                    onCheckedChange={(checked) => handleInputChange("hasFormalDocument", checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="landlordName">Landlord Name</Label>
                  <Input
                    id="landlordName"
                    value={formData.landlordName}
                    onChange={(e) => handleInputChange("landlordName", e.target.value)}
                    placeholder="Your name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tenantName">Tenant Name</Label>
                  <Input
                    id="tenantName"
                    value={formData.tenantName}
                    onChange={(e) => handleInputChange("tenantName", e.target.value)}
                    placeholder="Tenant's full name"
                  />
                </div>

                {/* File Upload Section */}
                {formData.hasFormalDocument && (
                  <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <Label htmlFor="leaseDocument">Lease Document (PDF)</Label>
                    
                    {/* Show existing document if available */}
                    {lease?.leaseDocumentUrl && !selectedFile && (
                      <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-red-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Current Document</p>
                            <p className="text-xs text-gray-500">PDF file uploaded</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(lease.leaseDocumentUrl, '_blank')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {!selectedFile ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-400 transition-colors">
                        <input
                          type="file"
                          id="leaseDocument"
                          accept=".pdf"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <label htmlFor="leaseDocument" className="cursor-pointer">
                          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-1">
                            {lease?.leaseDocumentUrl ? 'Replace current document' : 'Click to upload lease document'}
                          </p>
                          <p className="text-xs text-gray-500">
                            PDF files only, max 10MB
                          </p>
                        </label>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-red-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                            <p className="text-xs text-gray-500">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(filePreview, '_blank')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleFileRemove}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Lease Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Property:</span>
                  <p className="font-medium text-gray-900">{lease.unit.property.title}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Unit:</span>
                  <p className="font-medium text-gray-900">{lease.unit.label}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Tenant:</span>
                  <p className="font-medium text-gray-900">{lease.tenant.fullName}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Rent:</span>
                  <p className="font-medium text-gray-900">
                    ${formData.rentAmount} {formData.interval.toLowerCase()}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Status:</span>
                  <p className="font-medium text-gray-900">{formData.status}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/landlord/leases/${leaseId}`)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditLease;
