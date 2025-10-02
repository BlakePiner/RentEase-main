import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  User,
  Briefcase,
  Home as HomeIcon,
  Heart,
  Camera,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  X
} from "lucide-react";
import { submitTenantApplicationRequest, type ApplicationFormData, type PropertyUnit } from "@/api/tenantApi";
import { toast } from "sonner";

interface TenantApplicationFormProps {
  unit: PropertyUnit;
  propertyTitle: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const TenantApplicationForm = ({ unit, propertyTitle, onSuccess, onCancel }: TenantApplicationFormProps) => {
  const [activeTab, setActiveTab] = useState<'form' | 'upload'>('form');
  const [loading, setLoading] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState<ApplicationFormData>({
    fullName: '',
    birthdate: '',
    governmentIdNumber: '',
    employmentStatus: 'EMPLOYED',
    employerName: '',
    monthlyIncome: 0,
    previousLandlordName: '',
    previousLandlordContact: '',
    rentalHistoryNotes: '',
    characterReferences: [],
    isSmoker: false,
    hasPets: false,
    petTypes: '',
    otherLifestyle: {},
    // Document URLs
    idImageUrl: '',
    selfieUrl: '',
    nbiClearanceUrl: '',
    biodataUrl: '',
    proofOfIncomeUrl: ''
  });

  // File upload states
  const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: File | null}>({
    idImage: null,
    selfie: null,
    nbiClearance: null,
    biodata: null,
    proofOfIncome: null
  });

  const [references, setReferences] = useState([
    { name: '', relation: '', contact: '' }
  ]);

  const handleInputChange = (field: keyof ApplicationFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (fileType: string, file: File) => {
    setUploadedFiles(prev => ({
      ...prev,
      [fileType]: file
    }));
    
    // In a real app, you would upload to cloud storage here
    // For now, we'll just simulate the upload
    const fakeUrl = `https://example.com/uploads/${file.name}`;
    
    switch (fileType) {
      case 'idImage':
        handleInputChange('idImageUrl', fakeUrl);
        break;
      case 'selfie':
        handleInputChange('selfieUrl', fakeUrl);
        break;
      case 'nbiClearance':
        handleInputChange('nbiClearanceUrl', fakeUrl);
        break;
      case 'biodata':
        handleInputChange('biodataUrl', fakeUrl);
        break;
      case 'proofOfIncome':
        handleInputChange('proofOfIncomeUrl', fakeUrl);
        break;
    }
    
    toast.success(`${file.name} uploaded successfully`);
  };

  const addReference = () => {
    setReferences(prev => [...prev, { name: '', relation: '', contact: '' }]);
  };

  const updateReference = (index: number, field: string, value: string) => {
    setReferences(prev => prev.map((ref, i) => 
      i === index ? { ...ref, [field]: value } : ref
    ));
  };

  const removeReference = (index: number) => {
    setReferences(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // Prepare character references
      const validReferences = references.filter(ref => 
        ref.name.trim() && ref.relation.trim() && ref.contact.trim()
      );
      
      const applicationData: ApplicationFormData = {
        ...formData,
        characterReferences: validReferences.length > 0 ? validReferences : null,
        monthlyIncome: formData.monthlyIncome || 0
      };

      await submitTenantApplicationRequest(unit.id, applicationData);
      
      toast.success("Application submitted successfully!");
      onSuccess();
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast.error(error.response?.data?.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    if (activeTab === 'upload') {
      // For upload mode, at least ID image is required
      return uploadedFiles.idImage !== null;
    } else {
      // For form mode, basic info is required
      return formData.fullName && formData.employmentStatus;
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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Apply for {unit.label}</h2>
        <p className="text-gray-600">{propertyTitle} • {formatCurrency(unit.targetPrice)}/month</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('form')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'form'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText className="h-4 w-4 inline mr-2" />
          Fill Form
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'upload'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Upload className="h-4 w-4 inline mr-2" />
          Upload Documents
        </button>
      </div>

      {activeTab === 'form' ? (
        /* Form Mode */
        <div className="space-y-6">
          {/* Personal Information */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <Label htmlFor="birthdate">Date of Birth</Label>
                <Input
                  id="birthdate"
                  type="date"
                  value={formData.birthdate}
                  onChange={(e) => handleInputChange('birthdate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="governmentId">Government ID Number</Label>
                <Input
                  id="governmentId"
                  value={formData.governmentIdNumber}
                  onChange={(e) => handleInputChange('governmentIdNumber', e.target.value)}
                  placeholder="Driver's License, SSS, etc."
                />
              </div>
            </div>
          </Card>

          {/* Employment & Financial */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Employment & Financial Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employmentStatus">Employment Status *</Label>
                <select
                  id="employmentStatus"
                  value={formData.employmentStatus}
                  onChange={(e) => handleInputChange('employmentStatus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="EMPLOYED">Employed</option>
                  <option value="SELF_EMPLOYED">Self Employed</option>
                  <option value="STUDENT">Student</option>
                  <option value="UNEMPLOYED">Unemployed</option>
                </select>
              </div>
              <div>
                <Label htmlFor="employerName">Employer/Company Name</Label>
                <Input
                  id="employerName"
                  value={formData.employerName}
                  onChange={(e) => handleInputChange('employerName', e.target.value)}
                  placeholder="Company or school name"
                />
              </div>
              <div>
                <Label htmlFor="monthlyIncome">Monthly Income (₱)</Label>
                <Input
                  id="monthlyIncome"
                  type="number"
                  value={formData.monthlyIncome}
                  onChange={(e) => handleInputChange('monthlyIncome', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </div>
          </Card>

          {/* Rental History */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <HomeIcon className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Rental History</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="previousLandlord">Previous Landlord Name</Label>
                <Input
                  id="previousLandlord"
                  value={formData.previousLandlordName}
                  onChange={(e) => handleInputChange('previousLandlordName', e.target.value)}
                  placeholder="Previous landlord (if any)"
                />
              </div>
              <div>
                <Label htmlFor="landlordContact">Previous Landlord Contact</Label>
                <Input
                  id="landlordContact"
                  value={formData.previousLandlordContact}
                  onChange={(e) => handleInputChange('previousLandlordContact', e.target.value)}
                  placeholder="Phone number or email"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="rentalHistory">Rental History Notes</Label>
                <Textarea
                  id="rentalHistory"
                  value={formData.rentalHistoryNotes}
                  onChange={(e) => handleInputChange('rentalHistoryNotes', e.target.value)}
                  placeholder="Brief description of your rental history"
                  rows={3}
                />
              </div>
            </div>
          </Card>

          {/* Character References */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">Character References</h3>
              </div>
              <Button onClick={addReference} variant="outline" size="sm">
                Add Reference
              </Button>
            </div>
            <div className="space-y-4">
              {references.map((ref, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={ref.name}
                      onChange={(e) => updateReference(index, 'name', e.target.value)}
                      placeholder="Reference name"
                    />
                  </div>
                  <div>
                    <Label>Relation</Label>
                    <Input
                      value={ref.relation}
                      onChange={(e) => updateReference(index, 'relation', e.target.value)}
                      placeholder="Friend, colleague, etc."
                    />
                  </div>
                  <div>
                    <Label>Contact</Label>
                    <Input
                      value={ref.contact}
                      onChange={(e) => updateReference(index, 'contact', e.target.value)}
                      placeholder="Phone or email"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={() => removeReference(index)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Lifestyle */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="h-5 w-5 text-pink-600" />
              <h3 className="text-lg font-semibold text-gray-900">Lifestyle Information</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="smoker">Do you smoke?</Label>
                <Switch
                  id="smoker"
                  checked={formData.isSmoker}
                  onCheckedChange={(checked) => handleInputChange('isSmoker', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="pets">Do you have pets?</Label>
                <Switch
                  id="pets"
                  checked={formData.hasPets}
                  onCheckedChange={(checked) => handleInputChange('hasPets', checked)}
                />
              </div>
              {formData.hasPets && (
                <div>
                  <Label htmlFor="petTypes">What type of pets?</Label>
                  <Input
                    id="petTypes"
                    value={formData.petTypes}
                    onChange={(e) => handleInputChange('petTypes', e.target.value)}
                    placeholder="Dog, cat, etc."
                  />
                </div>
              )}
            </div>
          </Card>
        </div>
      ) : (
        /* Upload Mode */
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Upload className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Upload Your Documents</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Upload your documents directly instead of filling out the form. This is faster if you already have digital copies.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Required Documents */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Required Documents</h4>
                
                {/* Government ID */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                  <div className="text-center">
                    <Shield className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">Government ID *</p>
                    <p className="text-xs text-gray-500 mb-3">Driver's License, Passport, etc.</p>
                    {uploadedFiles.idImage ? (
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">{uploadedFiles.idImage.name}</span>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload('idImage', e.target.files[0])}
                          className="hidden"
                        />
                        <Button variant="outline" size="sm" className="pointer-events-none">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </Button>
                      </label>
                    )}
                  </div>
                </div>

                {/* Selfie with ID */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                  <div className="text-center">
                    <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">Selfie with ID</p>
                    <p className="text-xs text-gray-500 mb-3">Photo of you holding your ID</p>
                    {uploadedFiles.selfie ? (
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">{uploadedFiles.selfie.name}</span>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload('selfie', e.target.files[0])}
                          className="hidden"
                        />
                        <Button variant="outline" size="sm" className="pointer-events-none">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </Button>
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Optional Documents */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Optional Documents</h4>
                
                {/* NBI Clearance */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                  <div className="text-center">
                    <Shield className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">NBI Clearance</p>
                    <p className="text-xs text-gray-500 mb-3">Background check document</p>
                    {uploadedFiles.nbiClearance ? (
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">{uploadedFiles.nbiClearance.name}</span>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload('nbiClearance', e.target.files[0])}
                          className="hidden"
                        />
                        <Button variant="outline" size="sm" className="pointer-events-none">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </Button>
                      </label>
                    )}
                  </div>
                </div>

                {/* Proof of Income */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                  <div className="text-center">
                    <Briefcase className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">Proof of Income</p>
                    <p className="text-xs text-gray-500 mb-3">Payslip, certificate, etc.</p>
                    {uploadedFiles.proofOfIncome ? (
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">{uploadedFiles.proofOfIncome.name}</span>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload('proofOfIncome', e.target.files[0])}
                          className="hidden"
                        />
                        <Button variant="outline" size="sm" className="pointer-events-none">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </Button>
                      </label>
                    )}
                  </div>
                </div>

                {/* Biodata */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                  <div className="text-center">
                    <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">Biodata/Resume</p>
                    <p className="text-xs text-gray-500 mb-3">Personal information summary</p>
                    {uploadedFiles.biodata ? (
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">{uploadedFiles.biodata.name}</span>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*,.pdf,.doc,.docx"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload('biodata', e.target.files[0])}
                          className="hidden"
                        />
                        <Button variant="outline" size="sm" className="pointer-events-none">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </Button>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 pt-6 border-t border-gray-200">
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex-1"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid() || loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Submit Application
            </>
          )}
        </Button>
      </div>

      {/* Requirements Notice */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Application Requirements</h4>
            <p className="text-sm text-blue-800 mt-1">
              {activeTab === 'form' 
                ? "Please fill out all required fields marked with *. Your application will be reviewed by the landlord."
                : "At minimum, please upload your government ID. Additional documents help strengthen your application."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantApplicationForm;
