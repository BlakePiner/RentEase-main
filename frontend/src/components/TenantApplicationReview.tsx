import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  User,
  Briefcase,
  Home as HomeIcon,
  Heart,
  FileText,
  Shield,
  Check,
  X,
  Star,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  Building,
  Loader2,
  Eye,
  Download
} from "lucide-react";
import { updateTenantApplicationStatusRequest, type TenantApplication } from "@/api/landlordTenantApi";
import { toast } from "sonner";

interface TenantApplicationReviewProps {
  application: TenantApplication;
  onApplicationUpdate: () => void;
  onClose: () => void;
}

const TenantApplicationReview = ({ application, onApplicationUpdate, onClose }: TenantApplicationReviewProps) => {
  const [loading, setLoading] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{title: string, url: string} | null>(null);

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
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      await updateTenantApplicationStatusRequest(application.id, {
        status: 'APPROVED',
        notes: reviewNotes
      });
      
      toast.success("Application approved! Draft lease has been created.");
      onApplicationUpdate();
      onClose();
    } catch (error: any) {
      console.error("Error approving application:", error);
      toast.error(error.response?.data?.message || "Failed to approve application");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await updateTenantApplicationStatusRequest(application.id, {
        status: 'REJECTED',
        notes: reviewNotes
      });
      
      toast.success("Application rejected.");
      onApplicationUpdate();
      onClose();
    } catch (error: any) {
      console.error("Error rejecting application:", error);
      toast.error(error.response?.data?.message || "Failed to reject application");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (title: string, url: string) => {
    setSelectedDocument({ title, url });
    setShowDocumentModal(true);
  };

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const documents = [
    { title: "Government ID", url: application.applicationData.idImageUrl, icon: Shield },
    { title: "Selfie with ID", url: application.applicationData.selfieUrl, icon: User },
    { title: "NBI Clearance", url: application.applicationData.nbiClearanceUrl, icon: Shield },
    { title: "Proof of Income", url: application.applicationData.proofOfIncomeUrl, icon: Briefcase },
    { title: "Biodata/Resume", url: application.applicationData.biodataUrl, icon: FileText }
  ].filter(doc => doc.url);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={application.tenant.avatarUrl || undefined} />
            <AvatarFallback className="text-lg">
              {application.tenant.firstName?.[0]}{application.tenant.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {application.tenant.firstName} {application.tenant.lastName}
            </h1>
            <p className="text-gray-600">{application.tenant.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Application Review
              </Badge>
              <Badge className={getRiskBadgeColor(application.riskAssessment.riskLevel)}>
                {application.riskAssessment.riskLevel} Risk ({application.riskAssessment.aiRiskScore}%)
              </Badge>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Applied on</p>
          <p className="font-medium">{formatDate(application.submittedAt)}</p>
        </div>
      </div>

      {/* Property Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-blue-600" />
            Property Application
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">{application.unit.property.title}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{application.unit.property.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-400" />
                  <span>Unit {application.unit.label}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">{formatCurrency(application.unit.targetPrice)}</p>
              <p className="text-sm text-gray-600">per month</p>
              <p className="text-sm text-gray-500 mt-1">{application.unit.property.location}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-purple-600" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Full Name</Label>
              <p className="font-medium">{application.applicationData.fullName}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Date of Birth</Label>
              <p className="font-medium">
                {application.applicationData.birthdate 
                  ? formatDate(application.applicationData.birthdate) 
                  : 'Not provided'
                }
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Government ID</Label>
              <p className="font-medium">{application.applicationData.governmentIdNumber || 'Not provided'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Contact</Label>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{application.tenant.email}</span>
                </div>
                {application.tenant.phoneNumber && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{application.tenant.phoneNumber}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employment & Financial */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-green-600" />
              Employment & Financial
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Employment Status</Label>
              <p className="font-medium">{application.applicationData.employmentStatus || 'Not provided'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Employer</Label>
              <p className="font-medium">{application.applicationData.employerName || 'Not provided'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Monthly Income</Label>
              <p className="font-medium text-green-600">
                {application.applicationData.monthlyIncome 
                  ? formatCurrency(application.applicationData.monthlyIncome) 
                  : 'Not provided'
                }
              </p>
            </div>
            {application.applicationData.monthlyIncome && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Income to Rent Ratio:</strong> {' '}
                  {((application.applicationData.monthlyIncome / application.unit.targetPrice) * 100).toFixed(0)}%
                  {application.applicationData.monthlyIncome >= application.unit.targetPrice * 3 ? (
                    <span className="text-green-600 ml-2">✓ Meets 3x requirement</span>
                  ) : (
                    <span className="text-red-600 ml-2">⚠ Below 3x requirement</span>
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rental History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HomeIcon className="h-5 w-5 text-orange-600" />
              Rental History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Previous Landlord</Label>
              <p className="font-medium">{application.applicationData.previousLandlordName || 'Not provided'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Contact Information</Label>
              <p className="font-medium">{application.applicationData.previousLandlordContact || 'Not provided'}</p>
            </div>
            {application.applicationData.rentalHistoryNotes && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Notes</Label>
                <p className="text-sm bg-gray-50 p-3 rounded">{application.applicationData.rentalHistoryNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lifestyle & Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-600" />
              Lifestyle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Smoking</Label>
                <p className={`font-medium ${application.applicationData.isSmoker ? 'text-red-600' : 'text-green-600'}`}>
                  {application.applicationData.isSmoker ? 'Yes' : 'No'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Pets</Label>
                <p className={`font-medium ${application.applicationData.hasPets ? 'text-orange-600' : 'text-green-600'}`}>
                  {application.applicationData.hasPets ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
            {application.applicationData.hasPets && application.applicationData.petTypes && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Pet Types</Label>
                <p className="font-medium">{application.applicationData.petTypes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Character References */}
      {application.applicationData.characterReferences && Array.isArray(application.applicationData.characterReferences) && application.applicationData.characterReferences.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              Character References
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {application.applicationData.characterReferences.map((ref: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <h4 className="font-medium">{ref.name}</h4>
                  <p className="text-sm text-gray-600">{ref.relation}</p>
                  <p className="text-sm text-blue-600">{ref.contact}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Submitted Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {documents.map((doc, index) => {
                const IconComponent = doc.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors">
                      <IconComponent className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-900">{doc.title}</p>
                      <div className="flex gap-1 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDocument(doc.title, doc.url)}
                          className="flex-1"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            AI Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">Risk Level</p>
              <Badge className={getRiskBadgeColor(application.riskAssessment.riskLevel)}>
                {application.riskAssessment.riskLevel}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Risk Score</p>
              <p className="text-2xl font-bold">{application.riskAssessment.aiRiskScore}%</p>
            </div>
          </div>
          {application.riskAssessment.aiScreeningSummary && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm">{application.riskAssessment.aiScreeningSummary}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Review Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="reviewNotes" className="text-sm font-medium">
            Add notes about your decision (optional)
          </Label>
          <Textarea
            id="reviewNotes"
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder="Add any notes about this application review..."
            rows={3}
            className="mt-2"
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-6 border-t">
        <Button
          onClick={onClose}
          variant="outline"
          className="flex-1"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleReject}
          variant="outline"
          className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <X className="h-4 w-4 mr-2" />
          )}
          Reject Application
        </Button>
        <Button
          onClick={handleApprove}
          className="flex-1 bg-green-600 hover:bg-green-700"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Approve & Create Draft Lease
        </Button>
      </div>

      {/* Document Viewer Modal */}
      <Dialog open={showDocumentModal} onOpenChange={setShowDocumentModal}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {selectedDocument?.url && (
              <div className="text-center p-8">
                <img 
                  src={selectedDocument.url} 
                  alt={selectedDocument.title}
                  className="max-w-full max-h-[60vh] mx-auto rounded-lg shadow-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling!.style.display = 'block';
                  }}
                />
                <div style={{ display: 'none' }} className="text-gray-500">
                  <FileText className="h-16 w-16 mx-auto mb-4" />
                  <p>Document preview not available</p>
                  <Button 
                    onClick={() => window.open(selectedDocument.url, '_blank')}
                    className="mt-4"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Document
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TenantApplicationReview;

