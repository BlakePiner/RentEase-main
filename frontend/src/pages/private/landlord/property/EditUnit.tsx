import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Home,
  Upload,
  DollarSign,
  Shield,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  X,
  Image as ImageIcon,
  Loader,
} from "lucide-react";
import { toast } from "sonner";
import {
  getUnitDetailsRequest,
  updateUnitRequest,
  getAmenitiesRequest,
} from "@/api/landlordPropertyApi";
import { supabase } from "@/lib/supabaseClient";

// Lease rule categories as specified
const leaseRuleCategories = [
  { id: "general", name: "General Policies" },
  { id: "visitor", name: "Visitor Policies" },
  { id: "payment", name: "Payment Policies" },
  { id: "maintenance", name: "Maintenance Policies" },
  { id: "safety", name: "Safety Policies" },
  { id: "noise", name: "Noise Policies" },
  { id: "pet", name: "Pet Policies" },
  { id: "cleaning", name: "Cleaning Policies" },
  { id: "parking", name: "Parking Policies" },
  { id: "other", name: "Other Policies" },
];

// Lease rule type
type LeaseRule = {
  id: string;
  text: string;
  category: string;
};

type Amenity = {
  id: string;
  name: string;
  category: string;
};

type Unit = {
  id: string;
  label: string;
  description: string;
  status: string;
  floorNumber: number | null;
  maxOccupancy: number;
  targetPrice: number;
  securityDeposit: number | null;
  requiresScreening: boolean;
  mainImageUrl: string | null;
  otherImages: string[] | null;
  unitLeaseRules: LeaseRule[] | null;
  amenities: Amenity[];
  createdAt: string;
  updatedAt: string;
};

// Steps configuration
const steps = [
  { id: 1, title: "Basic Info", icon: Home },
  { id: 2, title: "Amenities", icon: CheckCircle },
  { id: 3, title: "Images", icon: ImageIcon },
  { id: 4, title: "Pricing", icon: DollarSign },
  { id: 5, title: "Lease Rules", icon: Shield },
];

const EditUnit = () => {
  const { propertyId, unitId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const otherImagesInputRef = useRef<HTMLInputElement>(null);

  // State for amenities
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [isLoadingAmenities, setIsLoadingAmenities] = useState(true);
  const [amenitiesError, setAmenitiesError] = useState<string | null>(null);

  // State for unit data
  const [unit, setUnit] = useState<Unit | null>(null);
  const [isLoadingUnit, setIsLoadingUnit] = useState(true);
  const [unitError, setUnitError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    // Basic Info
    label: "",
    description: "",
    floorNumber: "",
    maxOccupancy: 1,
    status: "AVAILABLE" as "AVAILABLE" | "OCCUPIED" | "MAINTENANCE",

    // Amenities
    amenities: [] as string[],

    // Images
    mainImage: null as File | null,
    mainImagePreview: "",
    mainImageUrl: "",
    otherImages: [] as File[],
    otherImagesPreviews: [] as string[],
    otherImagesUrls: [] as string[],

    // Pricing
    targetPrice: "",
    securityDeposit: "",
    requiresScreening: false,

    // Lease Rules
    leaseRules: [] as LeaseRule[],
    newLeaseRule: "",
    newLeaseRuleCategory: "general",
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load unit data
  useEffect(() => {
    const loadUnitData = async () => {
      if (!propertyId || !unitId) return;

      try {
        setIsLoadingUnit(true);
        const response = await getUnitDetailsRequest(propertyId, unitId);
        const unitData = response.data;

        setUnit(unitData);

        // Populate form with existing data
        setFormData({
          label: unitData.label || "",
          description: unitData.description || "",
          floorNumber: unitData.floorNumber?.toString() || "",
          maxOccupancy: unitData.maxOccupancy || 1,
          status: unitData.status || "AVAILABLE",
          amenities: unitData.amenities?.map((a: Amenity) => a.id) || [],
          mainImage: null,
          mainImagePreview: unitData.mainImageUrl || "",
          mainImageUrl: unitData.mainImageUrl || "",
          otherImages: [],
          otherImagesPreviews: unitData.otherImages || [],
          otherImagesUrls: unitData.otherImages || [],
          targetPrice: unitData.targetPrice?.toString() || "",
          securityDeposit: unitData.securityDeposit?.toString() || "",
          requiresScreening: unitData.requiresScreening || false,
          leaseRules: unitData.unitLeaseRules || [],
          newLeaseRule: "",
          newLeaseRuleCategory: "general",
        });
      } catch (error: any) {
        console.error("Error loading unit:", error);
        setUnitError(error.response?.data?.message || "Failed to load unit data");
        toast.error("Failed to load unit data");
      } finally {
        setIsLoadingUnit(false);
      }
    };

    loadUnitData();
  }, [propertyId, unitId]);

  // Load amenities
  useEffect(() => {
    const loadAmenities = async () => {
      try {
        setIsLoadingAmenities(true);
        const response = await getAmenitiesRequest();
        setAmenities(response.data);
      } catch (error: any) {
        console.error("Error loading amenities:", error);
        setAmenitiesError("Failed to load amenities");
        toast.error("Failed to load amenities");
      } finally {
        setIsLoadingAmenities(false);
      }
    };

    loadAmenities();
  }, []);

  // Function to generate UUID
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Function to upload image to Supabase
  const uploadImageToSupabase = async (file: File, folderPath: string, fileName: string): Promise<string> => {
    try {
      // Get file extension
      const fileExt = file.name.split('.').pop();
      const fullFileName = `${fileName}.${fileExt}`;
      const filePath = `${folderPath}/${fullFileName}`;

      // Upload the file
      const { error } = await supabase.storage
        .from('rentease-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Allow overwriting for edits
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('rentease-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image to Supabase:', error);
      throw new Error(`Failed to upload image: ${error}`);
    }
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle main image upload
  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select a valid image file");
      return;
    }

    setFormData(prev => ({
      ...prev,
      mainImage: file,
      mainImagePreview: URL.createObjectURL(file)
    }));
  };

  // Handle other images upload
  const handleOtherImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate files
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Check total count (max 6 images) - count existing URLs + new files
    const existingImageCount = formData.otherImagesUrls.length;
    const newImageCount = formData.otherImages.length;
    const totalImages = existingImageCount + newImageCount + validFiles.length;
    
    if (totalImages > 6) {
      toast.error("Maximum 6 images allowed");
      return;
    }

    const newPreviews = validFiles.map(file => URL.createObjectURL(file));

    setFormData(prev => ({
      ...prev,
      otherImages: [...prev.otherImages, ...validFiles],
      otherImagesPreviews: [...prev.otherImagesPreviews, ...newPreviews]
    }));
  };

  // Remove other image
  const removeOtherImage = (index: number) => {
    setFormData(prev => {
      const existingImageCount = prev.otherImagesUrls.length;
      
      if (index < existingImageCount) {
        // Removing an existing image (from URLs)
        const newUrls = prev.otherImagesUrls.filter((_, i) => i !== index);
        const newPreviews = prev.otherImagesPreviews.filter((_, i) => i !== index);
        
        return {
          ...prev,
          otherImagesUrls: newUrls,
          otherImagesPreviews: newPreviews
        };
      } else {
        // Removing a new image (from files)
        const adjustedIndex = index - existingImageCount;
        const newFiles = prev.otherImages.filter((_, i) => i !== adjustedIndex);
        const newPreviews = prev.otherImagesPreviews.filter((_, i) => i !== index);
        
        return {
          ...prev,
          otherImages: newFiles,
          otherImagesPreviews: newPreviews
        };
      }
    });
  };

  // Add lease rule
  const addLeaseRule = () => {
    if (!formData.newLeaseRule.trim()) return;

    const newRule: LeaseRule = {
      id: generateUUID(),
      text: formData.newLeaseRule.trim(),
      category: formData.newLeaseRuleCategory
    };

    setFormData(prev => ({
      ...prev,
      leaseRules: [...prev.leaseRules, newRule],
      newLeaseRule: "",
      newLeaseRuleCategory: "general"
    }));
  };

  // Remove lease rule
  const removeLeaseRule = (id: string) => {
    setFormData(prev => ({
      ...prev,
      leaseRules: prev.leaseRules.filter(rule => rule.id !== id)
    }));
  };

  // Navigation functions
  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Validation function
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Basic Info
        return formData.label.trim() !== "" && formData.description.trim() !== "";
      case 2: // Amenities
        return true; // Amenities are optional
      case 3: // Images
        return true; // Images are optional
      case 4: // Pricing
        return formData.targetPrice !== "" && parseFloat(formData.targetPrice) > 0;
      case 5: // Lease Rules
        return true; // Lease rules are optional
      default:
        return true;
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!propertyId || !unitId) return;

    try {
      setIsSubmitting(true);

      // Upload main image if changed
      let mainImageUrl = formData.mainImageUrl;
      if (formData.mainImage) {
        const fileName = generateUUID();
        mainImageUrl = await uploadImageToSupabase(
          formData.mainImage,
          'unit_main_images',
          fileName
        );
      }

      // Upload other images if changed
      let otherImagesUrls = formData.otherImagesUrls;
      if (formData.otherImages.length > 0) {
        const uploadPromises = formData.otherImages.map(async (file) => {
          const fileName = generateUUID();
          return await uploadImageToSupabase(
            file,
            'unit_other_images',
            fileName
          );
        });
        const newImageUrls = await Promise.all(uploadPromises);
        otherImagesUrls = [...formData.otherImagesUrls, ...newImageUrls];
      }

      // Prepare data for API
      const updateData = {
        label: formData.label.trim(),
        description: formData.description.trim(),
        status: formData.status,
        floorNumber: formData.floorNumber ? parseInt(formData.floorNumber) : null,
        maxOccupancy: formData.maxOccupancy,
        mainImageUrl,
        otherImages: otherImagesUrls,
        targetPrice: parseFloat(formData.targetPrice),
        securityDeposit: formData.securityDeposit ? parseFloat(formData.securityDeposit) : null,
        requiresScreening: formData.requiresScreening,
        amenities: formData.amenities,
        unitLeaseRules: formData.leaseRules.length > 0 ? formData.leaseRules : null,
      };

      // Call update API
      await updateUnitRequest(propertyId, unitId, updateData);
      
      toast.success("Unit updated successfully");
      navigate(`/landlord/properties/${propertyId}/units/${unitId}`);
    } catch (error: any) {
      console.error("Error updating unit:", error);
      toast.error(error.response?.data?.message || "Failed to update unit");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoadingUnit || isLoadingAmenities) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading unit data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (unitError || amenitiesError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{unitError || amenitiesError}</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Home className="h-4 w-4" />
            <span>Landlord</span>
            <span className="text-gray-400">•</span>
            <span>Edit Unit</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Unit</h1>
          <p className="text-gray-600">Update unit information and settings</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              const Icon = step.icon;

              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      isActive
                        ? "bg-blue-600 border-blue-600 text-white"
                        : isCompleted
                        ? "bg-green-600 border-green-600 text-white"
                        : "bg-white border-gray-300 text-gray-400"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p
                      className={`text-sm font-medium ${
                        isActive ? "text-blue-600" : "text-gray-500"
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <ChevronRight className="h-5 w-5 text-gray-400 mx-4" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <Card className="p-6">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit Label *
                  </label>
                  <Input
                    value={formData.label}
                    onChange={(e) => handleInputChange("label", e.target.value)}
                    placeholder="e.g., Unit 1A, Room 101"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Floor Number
                  </label>
                  <Input
                    type="number"
                    value={formData.floorNumber}
                    onChange={(e) => handleInputChange("floorNumber", e.target.value)}
                    placeholder="e.g., 1, 2, 3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Occupancy *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.maxOccupancy}
                    onChange={(e) => handleInputChange("maxOccupancy", parseInt(e.target.value))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange("status", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="OCCUPIED">Occupied</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe the unit, its features, and what makes it special..."
                  rows={4}
                  required
                />
              </div>
            </div>
          )}

          {/* Step 2: Amenities */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Amenities</h2>
              <p className="text-gray-600">Select amenities available in this unit</p>

              {amenitiesError ? (
                <p className="text-red-600">{amenitiesError}</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {amenities.map((amenity) => (
                    <label
                      key={amenity.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.amenities.includes(amenity.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleInputChange("amenities", [...formData.amenities, amenity.id]);
                          } else {
                            handleInputChange("amenities", formData.amenities.filter(id => id !== amenity.id));
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {amenity.name}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Images */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Images</h2>
              
              {/* Main Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Main Image
                </label>
                <div className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleMainImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {formData.mainImagePreview ? "Change Main Image" : "Upload Main Image"}
                  </Button>
                  
                  {formData.mainImagePreview && (
                    <div className="relative">
                      <img
                        src={formData.mainImagePreview}
                        alt="Main image preview"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            mainImage: null,
                            mainImagePreview: prev.mainImageUrl
                          }));
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Other Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Images (Max 6)
                </label>
                <div className="space-y-4">
                  <input
                    ref={otherImagesInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleOtherImagesUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => otherImagesInputRef.current?.click()}
                    disabled={formData.otherImagesUrls.length + formData.otherImages.length >= 6}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Add Images ({formData.otherImagesUrls.length + formData.otherImages.length}/6)
                  </Button>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.otherImagesPreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1"
                          onClick={() => removeOtherImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Pricing */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Pricing & Requirements</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Rent (₱) *
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.targetPrice}
                    onChange={(e) => handleInputChange("targetPrice", e.target.value)}
                    placeholder="e.g., 15000"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Security Deposit (₱)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.securityDeposit}
                    onChange={(e) => handleInputChange("securityDeposit", e.target.value)}
                    placeholder="e.g., 15000"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="requiresScreening"
                  checked={formData.requiresScreening}
                  onChange={(e) => handleInputChange("requiresScreening", e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="requiresScreening" className="text-sm font-medium text-gray-700">
                  Requires tenant screening
                </label>
              </div>
            </div>
          )}

          {/* Step 5: Lease Rules */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Lease Rules</h2>
              
              {/* Add new rule */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      value={formData.newLeaseRule}
                      onChange={(e) => handleInputChange("newLeaseRule", e.target.value)}
                      placeholder="Enter a lease rule..."
                    />
                  </div>
                  <div>
                    <select
                      value={formData.newLeaseRuleCategory}
                      onChange={(e) => handleInputChange("newLeaseRuleCategory", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {leaseRuleCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <Button type="button" onClick={addLeaseRule} disabled={!formData.newLeaseRule.trim()}>
                  Add Rule
                </Button>
              </div>

              {/* Existing rules */}
              <div className="space-y-4">
                {leaseRuleCategories.map((category) => {
                  const categoryRules = formData.leaseRules.filter(rule => rule.category === category.id);
                  if (categoryRules.length === 0) return null;

                  return (
                    <div key={category.id}>
                      <h3 className="font-medium text-gray-900 mb-2">{category.name}</h3>
                      <div className="space-y-2">
                        {categoryRules.map((rule) => (
                          <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-700">{rule.text}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLeaseRule(rule.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
              
              {currentStep < steps.length ? (
                <Button
                  onClick={nextStep}
                  disabled={!validateStep(currentStep)}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !validateStep(currentStep)}
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Unit"
                  )}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EditUnit;
