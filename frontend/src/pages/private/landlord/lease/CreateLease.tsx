import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  createLeaseRequest,
  type CreateLeaseData 
} from "@/api/landlordLeaseApi";
import { getLandlordPropertiesRequest, getPropertyUnitsRequest } from "@/api/landlordPropertyApi";
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

const CreateLease = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState<CreateLeaseData>({
    unitId: "",
    tenantId: "",
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
    const fetchInitialData = async () => {
      try {
        const [propertiesRes, tenantsRes] = await Promise.all([
          getLandlordPropertiesRequest(),
          getTenantsRequest(),
        ]);
        setProperties(propertiesRes.data);
        setTenants(tenantsRes.data);
      } catch (err) {
        console.error("Error fetching initial data:", err);
        toast.error("Failed to load initial data");
      }
    };

    fetchInitialData();
  }, []);

  // Load units when property is selected
  useEffect(() => {
    if (!selectedPropertyId) {
      setUnits([]);
      setSelectedUnitId("");
      return;
    }

    const fetchUnits = async () => {
      try {
        const response = await getPropertyUnitsRequest(selectedPropertyId);
        const availableUnits = response.data.filter((unit: any) => unit.status === "AVAILABLE");
        setUnits(availableUnits);
      } catch (err) {
        console.error("Error fetching units:", err);
        toast.error("Failed to load units");
        setUnits([]);
      }
    };

    fetchUnits();
  }, [selectedPropertyId]);


  const handleInputChange = (field: keyof CreateLeaseData, value: any) => {
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
    
    if (!selectedUnitId || !selectedTenantId || !formData.leaseNickname || !formData.leaseType || !formData.startDate || !formData.rentAmount) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      // Create FormData for file upload
      const submitData = new FormData();
      
      // Add all form fields with proper data types
      submitData.append('unitId', selectedUnitId);
      submitData.append('tenantId', selectedTenantId);
      submitData.append('leaseNickname', formData.leaseNickname);
      submitData.append('leaseType', formData.leaseType);
      submitData.append('startDate', formData.startDate);
      if (formData.endDate) {
        submitData.append('endDate', formData.endDate);
      }
      submitData.append('rentAmount', formData.rentAmount.toString());
      submitData.append('interval', formData.interval);
      submitData.append('status', formData.status);
      submitData.append('hasFormalDocument', formData.hasFormalDocument.toString());
      
      if (formData.landlordName) {
        submitData.append('landlordName', formData.landlordName);
      }
      if (formData.tenantName) {
        submitData.append('tenantName', formData.tenantName);
      }
      if (formData.notes) {
        submitData.append('notes', formData.notes);
      }
      
      // Add file if selected
      if (selectedFile) {
        submitData.append('leaseDocument', selectedFile);
      }
      
      await createLeaseRequest(submitData);
      toast.success("Lease created successfully");
      navigate("/landlord/leases");
    } catch (err: any) {
      console.error("Error creating lease:", err);
      toast.error(err.response?.data?.message || "Failed to create lease");
    } finally {
      setLoading(false);
    }
  };

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);
  const selectedUnit = units.find(u => u.id === selectedUnitId);
  const selectedTenant = tenants.find(t => t.id === selectedTenantId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <button onClick={() => navigate("/landlord/leases")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leases
          </button>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Lease</h1>
          <p className="text-gray-600 mt-1">Set up a new rental agreement</p>
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

            {/* Property & Unit Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Property & Unit Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="property">Property *</Label>
                  <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a property" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.title} ({property.unitsSummary.available} available units)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPropertyId && (
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit *</Label>
                    <Select value={selectedUnitId} onValueChange={(value) => {
                      setSelectedUnitId(value);
                      handleInputChange("unitId", value);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.label} - {unit.status} - ${unit.targetPrice}/month
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedPropertyId && units.length === 0 && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800">
                      No available units found for this property.
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tenant Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Tenant Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tenant">Tenant *</Label>
                  <Select value={selectedTenantId} onValueChange={(value) => {
                    setSelectedTenantId(value);
                    handleInputChange("tenantId", value);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.firstName} {tenant.lastName} ({tenant.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTenant && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center text-white font-medium">
                        {selectedTenant.firstName?.charAt(0)}{selectedTenant.lastName?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {selectedTenant.firstName} {selectedTenant.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{selectedTenant.email}</p>
                        {selectedTenant.phoneNumber && (
                          <p className="text-sm text-gray-600">{selectedTenant.phoneNumber}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
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
                            Click to upload lease document
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
            {(selectedProperty || selectedUnit || selectedTenant) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Lease Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedProperty && (
                    <div>
                      <span className="text-sm text-gray-600">Property:</span>
                      <p className="font-medium text-gray-900">{selectedProperty.title}</p>
                    </div>
                  )}
                  {selectedUnit && (
                    <div>
                      <span className="text-sm text-gray-600">Unit:</span>
                      <p className="font-medium text-gray-900">{selectedUnit.label}</p>
                    </div>
                  )}
                  {selectedTenant && (
                    <div>
                      <span className="text-sm text-gray-600">Tenant:</span>
                      <p className="font-medium text-gray-900">
                        {selectedTenant.firstName} {selectedTenant.lastName}
                      </p>
                    </div>
                  )}
                  {formData.rentAmount > 0 && (
                    <div>
                      <span className="text-sm text-gray-600">Rent:</span>
                      <p className="font-medium text-gray-900">
                        ${formData.rentAmount} {formData.interval.toLowerCase()}
                      </p>
                    </div>
                  )}
                  {formData.startDate && (
                    <div>
                      <span className="text-sm text-gray-600">Start Date:</span>
                      <p className="font-medium text-gray-900">
                        {new Date(formData.startDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/landlord/leases")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Lease
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateLease;
