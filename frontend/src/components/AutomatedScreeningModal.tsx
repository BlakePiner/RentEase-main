import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Bot,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  User,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Home,
  Shield,
  Clock,
  RefreshCw,
  Eye,
  Check,
  X,
  Loader2
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateTenantApplicationStatusRequest, getAvailableLeasesForTenantRequest, assignLeaseToTenantRequest } from "@/api/landlordTenantApi";
import { toast } from "sonner";

interface ScreeningResult {
  overallScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendations: string[];
  checks: {
    identity: { passed: boolean; score: number; details: string };
    income: { passed: boolean; score: number; details: string };
    references: { passed: boolean; score: number; details: string };
    credit: { passed: boolean; score: number; details: string };
    background: { passed: boolean; score: number; details: string };
  };
}

interface AutomatedScreeningModalProps {
  application: any;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (application: any) => void;
  onReject: (application: any) => void;
}

const AutomatedScreeningModal = ({ 
  application, 
  isOpen, 
  onClose, 
  onApprove, 
  onReject 
}: AutomatedScreeningModalProps) => {
  const [screeningResult, setScreeningResult] = useState<ScreeningResult | null>(null);
  const [isScreening, setIsScreening] = useState(false);
  const [availableLeases, setAvailableLeases] = useState<any[]>([]);
  const [isLoadingLeases, setIsLoadingLeases] = useState(false);

  // Simulate automated screening process
  const runAutomatedScreening = async () => {
    setIsScreening(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock screening results based on application data
    const mockResult: ScreeningResult = {
      overallScore: Math.floor(Math.random() * 40) + 60, // 60-100
      riskLevel: Math.random() > 0.7 ? 'HIGH' : Math.random() > 0.4 ? 'MEDIUM' : 'LOW',
      recommendations: [
        "Strong income verification provided",
        "No criminal background found",
        "Previous landlord references are positive",
        "Credit score is within acceptable range"
      ],
      checks: {
        identity: {
          passed: true,
          score: 95,
          details: "Government ID verified, photo matches application"
        },
        income: {
          passed: Math.random() > 0.2,
          score: Math.floor(Math.random() * 30) + 70,
          details: "Income documentation provided and verified"
        },
        references: {
          passed: Math.random() > 0.3,
          score: Math.floor(Math.random() * 25) + 75,
          details: "Previous landlord provided positive reference"
        },
        credit: {
          passed: Math.random() > 0.4,
          score: Math.floor(Math.random() * 35) + 65,
          details: "Credit check completed, score within range"
        },
        background: {
          passed: Math.random() > 0.1,
          score: Math.floor(Math.random() * 20) + 80,
          details: "Background check completed, no issues found"
        }
      }
    };
    
    setScreeningResult(mockResult);
    setIsScreening(false);
  };

  // Load available leases for assignment
  const loadAvailableLeases = async () => {
    setIsLoadingLeases(true);
    try {
      console.log("🔍 Fetching leases for tenant:", application.tenant.id, "unit:", application.unit.id);
      const response = await getAvailableLeasesForTenantRequest(
        application.tenant.id, 
        application.unit.id
      );
      console.log("📋 API Response:", response);
      console.log("📋 Available leases:", response.availableLeases);
      setAvailableLeases(response.availableLeases || []);
      console.log("✅ Leases set in state:", response.availableLeases);
    } catch (error: any) {
      console.error("❌ Error fetching available leases:", error);
      console.error("❌ Error response:", error.response?.data);
      // Don't show error toast on initial load, just log it
      console.log("No available leases or error fetching leases");
      setAvailableLeases([]);
    } finally {
      setIsLoadingLeases(false);
    }
  };

  useEffect(() => {
    if (isOpen && application) {
      runAutomatedScreening();
      loadAvailableLeases();
    }
  }, [isOpen, application]);

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleApproveWithLease = async () => {
    try {
      // Check if there's already an existing lease for this tenant and unit
      const existingLeases = await getAvailableLeasesForTenantRequest(application.tenant.id, application.unit.id);
      
      if (existingLeases.availableLeases && existingLeases.availableLeases.length > 0) {
        // Found existing lease(s) - automatically use the first one
        const leaseToAssign = existingLeases.availableLeases[0];
        console.log("Found existing lease for tenant, auto-assigning:", leaseToAssign);
        
        // Update application status to approved
        await updateTenantApplicationStatusRequest(application.id, {
          status: "APPROVED",
          notes: "Approved via automated screening"
        });
        
        // Activate the lease (change status from DRAFT to ACTIVE)
        try {
          const { privateApi } = await import("@/api/axios");
          const response = await privateApi.patch(`/landlord/leases/${leaseToAssign.id}/activate`);
          console.log("✅ Lease activated successfully:", response.data);
        } catch (leaseError) {
          console.error("❌ Error activating lease:", leaseError);
          console.error("❌ Lease error response:", leaseError.response?.data);
          // Continue anyway - the application is approved, but lease activation failed
          toast.error("Application approved, but failed to activate lease. Please activate manually.");
        }
        
        toast.success(`Application approved! Lease "${leaseToAssign.leaseNickname}" has been activated for this tenant.`);
        onApprove({ ...application, selectedLease: leaseToAssign });
      } else {
        // No existing lease found - show error
        toast.error("No lease has been assigned to this tenant. Please create a lease first.");
      }
    } catch (error: any) {
      console.error("Error in approval process:", error);
      toast.error(error.response?.data?.message || "Failed to approve application");
    }
  };

  if (!application) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-green-600" />
            Automated Screening Results
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Application Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Application Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={application.tenant?.avatarUrl} />
                  <AvatarFallback>
                    {application.tenant?.firstName?.[0]}{application.tenant?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">
                    {application.tenant?.firstName} {application.tenant?.lastName}
                  </h3>
                  <p className="text-gray-600">{application.tenant?.email}</p>
                  <p className="text-sm text-gray-500">
                    Applied: {new Date(application.submittedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Screening Results */}
          {isScreening ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
                  <p className="text-gray-600">Running automated screening...</p>
                  <p className="text-sm text-gray-500">This may take a few moments</p>
                </div>
              </CardContent>
            </Card>
          ) : screeningResult ? (
            <>
              {/* Overall Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Screening Results</span>
                    <Badge className={getRiskBadgeColor(screeningResult.riskLevel)}>
                      {screeningResult.riskLevel} Risk
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getScoreColor(screeningResult.overallScore)}`}>
                        {screeningResult.overallScore}%
                      </div>
                      <p className="text-sm text-gray-600">Overall Score</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {Object.values(screeningResult.checks).filter(check => check.passed).length}/5
                      </div>
                      <p className="text-sm text-gray-600">Checks Passed</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {screeningResult.recommendations.length}
                      </div>
                      <p className="text-sm text-gray-600">Recommendations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Checks */}
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Screening Checks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(screeningResult.checks).map(([key, check]) => (
                      <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {check.passed ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          <div>
                            <p className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                            <p className="text-sm text-gray-600">{check.details}</p>
                          </div>
                        </div>
                        <div className={`font-semibold ${getScoreColor(check.score)}`}>
                          {check.score}%
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {screeningResult.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Lease Assignment */}
              <Card>
                <CardHeader>
                  <CardTitle>Lease Assignment</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingLeases ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Loading assigned lease...</span>
                    </div>
                  ) : (() => {
                    // Find the lease that's specifically assigned to this tenant
                    const assignedLease = availableLeases.find(lease => lease.tenantId === application.tenant.id);
                    
                    if (assignedLease) {
                      // Display the assigned lease
                      return (
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-green-700">
                            Assigned lease for this tenant
                          </p>
                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-green-900">{assignedLease.leaseNickname}</h4>
                                <p className="text-sm text-green-700 mt-1">
                                  {assignedLease.leaseType} • ₱{assignedLease.rentAmount?.toLocaleString()}/{assignedLease.interval?.toLowerCase()}
                                </p>
                                <p className="text-sm text-green-600 mt-1">
                                  {new Date(assignedLease.startDate).toLocaleDateString()} - {new Date(assignedLease.endDate).toLocaleDateString()}
                                </p>
                                {assignedLease.notes && (
                                  <p className="text-sm text-gray-600 mt-2 italic">
                                    "{assignedLease.notes}"
                                  </p>
                                )}
                              </div>
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                Assigned
                              </Badge>
                            </div>
                          </div>
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800">
                              ✓ This lease is already assigned to this tenant. Approving the application will activate the lease.
                            </p>
                          </div>
                        </div>
                      );
                    } else {
                      // No assigned lease found - show creation option
                      return (
                        <div className="text-center py-6">
                          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Assigned Lease</h3>
                          <p className="text-gray-600 mb-4">
                            No lease has been assigned to this tenant yet. Create a lease first before approving the application.
                          </p>
                          <div className="space-y-2">
                            <Button
                              onClick={() => {
                                window.open(`/landlord/leases/create?unitId=${application.unit.id}&tenantId=${application.tenant.id}`, '_blank');
                              }}
                              variant="outline"
                              className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Create Lease for This Tenant
                            </Button>
                            <Button 
                              onClick={loadAvailableLeases}
                              variant="ghost"
                              size="sm"
                              className="w-full text-xs"
                              disabled={isLoadingLeases}
                            >
                              {isLoadingLeases ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                "🔄"
                              )}
                              Refresh
                            </Button>
                          </div>
                        </div>
                      );
                    }
                  })()}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  className="border-red-600 text-red-600 hover:bg-red-50"
                  onClick={async () => {
                    try {
                      await updateTenantApplicationStatusRequest(application.id, {
                        status: 'REJECTED',
                        notes: 'Rejected via automated screening'
                      });
                      toast.success("Application rejected.");
                      onReject(application);
                    } catch (error: any) {
                      console.error("Error rejecting application:", error);
                      toast.error(error.response?.data?.message || "Failed to reject application");
                    }
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject Application
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleApproveWithLease}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve Application
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AutomatedScreeningModal;
