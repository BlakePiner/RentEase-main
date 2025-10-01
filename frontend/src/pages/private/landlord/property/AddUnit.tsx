import { useState, useRef, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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
  createUnitRequest,
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

// Steps configuration
const steps = [
  { id: 1, title: "Basic Info", icon: Home },
  { id: 2, title: "Amenities", icon: CheckCircle },
  { id: 3, title: "Images", icon: ImageIcon },
  { id: 4, title: "Pricing", icon: DollarSign },
  { id: 5, title: "Lease Rules", icon: Shield },
];

const AddUnit = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const otherImagesInputRef = useRef<HTMLInputElement>(null);

  // State for amenities
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [isLoadingAmenities, setIsLoadingAmenities] = useState(true);
  const [amenitiesError, setAmenitiesError] = useState<string | null>(null);

  // Form state based on your Unit schema
  const [formData, setFormData] = useState({
    // Basic Info
    label: "",
    description: "",
    floorNumber: "",

    // Layout & Features
    maxOccupancy: 1,

    // Amenities
    amenities: [] as string[],

    // Images
    mainImage: null as File | null,
    mainImagePreview: "",
    otherImages: [] as File[],
    otherImagesPreviews: [] as string[],

    // Pricing
    targetPrice: "",
    securityDeposit: "",

    // Lease Rules
    leaseRules: [] as LeaseRule[],
    newLeaseRule: "",
    newLeaseRuleCategory: "general",

    // Screening Settings
    requiresScreening: false,
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Fetch amenities from API
  useEffect(() => {
    const controller = new AbortController();

    const fetchAmenities = async () => {
      try {
        setIsLoadingAmenities(true);
        setAmenitiesError(null);
        const res = await getAmenitiesRequest({ signal: controller.signal });
        setAmenities(res.data); // expect [{ id, name, category }, ...]
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Failed to fetch amenities:", err);
          setAmenitiesError("Failed to load amenities. Please try again.");
          toast.error("Failed to load amenities");
        }
      } finally {
        setIsLoadingAmenities(false);
      }
    };

    fetchAmenities();
    return () => controller.abort();
  }, []);

  // Group amenities by category
  const groupedAmenities = amenities.reduce((acc, amenity) => {
    if (!acc[amenity.category]) {
      acc[amenity.category] = [];
    }
    acc[amenity.category].push(amenity);
    return acc;
  }, {} as Record<string, Amenity[]>);

  // Group lease rules by category
  const groupedLeaseRules = formData.leaseRules.reduce((acc, rule) => {
    if (!acc[rule.category]) {
      acc[rule.category] = [];
    }
    acc[rule.category].push(rule);
    return acc;
  }, {} as Record<string, LeaseRule[]>);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleAmenityChange = (amenityId: string) => {
    setFormData((prev) => {
      const amenities = prev.amenities.includes(amenityId)
        ? prev.amenities.filter((id) => id !== amenityId)
        : [...prev.amenities, amenityId];
      return { ...prev, amenities };
    });
  };

  // Handle main image selection
  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        setFormData((prev) => ({
          ...prev,
          mainImage: file,
          mainImagePreview: URL.createObjectURL(file),
        }));
      } else {
        toast.error("Please select a valid image file");
      }
    }
  };

  // Handle additional images selection
  const handleOtherImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    const totalImages = imageFiles.length + formData.otherImages.length;
    if (totalImages > 6) {
      toast.error("You can only upload exactly 6 additional images");
      return;
    }

    const newImages = [...formData.otherImages, ...imageFiles];
    const newPreviews = [
      ...formData.otherImagesPreviews,
      ...imageFiles.map((file) => URL.createObjectURL(file)),
    ];

    setFormData((prev) => ({
      ...prev,
      otherImages: newImages.slice(0, 6),
      otherImagesPreviews: newPreviews.slice(0, 6),
    }));

    // Reset the file input
    if (otherImagesInputRef.current) {
      otherImagesInputRef.current.value = "";
    }
  };

  const removeOtherImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      otherImages: prev.otherImages.filter((_, i) => i !== index),
      otherImagesPreviews: prev.otherImagesPreviews.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const addLeaseRule = () => {
    if (formData.newLeaseRule.trim() && formData.leaseRules.length < 10) {
      const wordCount = formData.newLeaseRule.trim().split(/\s+/).length;
      if (wordCount <= 7) {
        const newRule: LeaseRule = {
          id: Date.now().toString(),
          text: formData.newLeaseRule.trim(),
          category: formData.newLeaseRuleCategory,
        };
        setFormData((prev) => ({
          ...prev,
          leaseRules: [...prev.leaseRules, newRule],
          newLeaseRule: "",
        }));
      } else {
        toast.error("Lease rule must be 7 words or less");
      }
    }
  };

  const removeLeaseRule = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      leaseRules: prev.leaseRules.filter((rule) => rule.id !== id),
    }));
  };

  const getWordCount = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.label.trim()) {
          toast.error("Please provide a unit label/name");
          return false;
        }
        if (!formData.description.trim()) {
          toast.error("Please provide a description");
          return false;
        }
        if (formData.label.length > 50) {
          toast.error("Unit label must be 50 characters or less");
          return false;
        }
        if (getWordCount(formData.description) > 30) {
          toast.error("Description must be 30 words or less");
          return false;
        }
        return true;
      case 3:
        if (!formData.mainImage) {
          toast.error("Please upload a main image for the unit");
          return false;
        }
        if (formData.otherImages.length !== 6) {
          toast.error("Please upload exactly 6 additional images");
          return false;
        }
        return true;
      case 4:
        const price = parseFloat(formData.targetPrice);
        if (!formData.targetPrice || price <= 0 || price > 100000) {
          toast.error("Monthly rent must be between ₱1 and ₱100,000");
          return false;
        }
        if (formData.securityDeposit) {
          const deposit = parseFloat(formData.securityDeposit);
          if (deposit < 0 || deposit > 100000) {
            toast.error("Security deposit must be between ₱0 and ₱100,000");
            return false;
          }
        }
        return true;
      case 5:
        // Lease rules validation - optional but if present, validate word count
        if (
          formData.leaseRules.some((rule) => rule.text.split(/\s+/).length > 7)
        ) {
          toast.error("All lease rules must be 7 words or less");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

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
          upsert: false
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

  const handleFinalSubmit = async () => {
    if (!validateStep(5)) return;
    if (!propertyId) {
      toast.error("Invalid property ID");
      return;
    }

    setIsSubmitting(true);
    setImageUploading(true);

    try {
      let mainImageUrl = "";
      const otherImageUrls: string[] = [];

      // Upload main image
      if (formData.mainImage) {
        const mainImageUUID = generateUUID();
        mainImageUrl = await uploadImageToSupabase(
          formData.mainImage,
          `units/${propertyId}`,
          `main-${mainImageUUID}`
        );
      }

      // Upload other images
      if (formData.otherImages.length > 0) {
        for (let i = 0; i < formData.otherImages.length; i++) {
          const imageUUID = generateUUID();
          const imageUrl = await uploadImageToSupabase(
            formData.otherImages[i],
            `units/${propertyId}`,
            `other-${imageUUID}-${i}`
          );
          otherImageUrls.push(imageUrl);
        }
      }

      setImageUploading(false);

      // Prepare the final data payload
      const unitData = {
        label: formData.label.trim(),
        description: formData.description.trim(),
        status: "AVAILABLE" as const,
        floorNumber: formData.floorNumber
          ? parseInt(formData.floorNumber)
          : null,
        maxOccupancy: formData.maxOccupancy,
        amenities: formData.amenities,
        mainImageUrl: mainImageUrl,
        otherImages: otherImageUrls.length > 0 ? otherImageUrls : null,
        // Updated to include category with each lease rule
        unitLeaseRules:
          formData.leaseRules.length > 0
            ? formData.leaseRules.map((rule) => ({
                text: rule.text,
                category: rule.category,
              }))
            : null,
        targetPrice: parseFloat(formData.targetPrice),
        securityDeposit: formData.securityDeposit
          ? parseFloat(formData.securityDeposit)
          : null,
        requiresScreening: formData.requiresScreening,
      };

      // Send data to backend API
      const response = await createUnitRequest(propertyId, unitData);

      toast.success(response.data.message || "Unit added successfully!");
      navigate(`/landlord/properties/${propertyId}?tab=units`);
    } catch (error: any) {
      console.error("Error creating unit:", error);
      setImageUploading(false);
      toast.error(
        error.response?.data?.message || error.message || "Failed to add unit. Please try again."
      );
    } finally {
      setIsSubmitting(false);
      setShowConfirmation(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Only show confirmation on the last step after validation
    if (currentStep === steps.length) {
      if (validateStep(currentStep)) {
        setShowConfirmation(true);
      }
    } else {
      // For non-final steps, just proceed to next step
      nextStep();
    }
  };

  // Compact progress bar
  const renderProgressBar = () => (
    <div className="mb-6">
      <div className="flex items-center justify-center space-x-1">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                currentStep > step.id
                  ? "bg-emerald-500 text-white"
                  : currentStep === step.id
                  ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-500"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {currentStep > step.id ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <step.icon className="h-4 w-4" />
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-8 h-0.5 ${
                  currentStep > step.id ? "bg-emerald-500" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-2 space-x-8">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`text-xs ${
              currentStep >= step.id
                ? "text-emerald-700 font-medium"
                : "text-gray-500"
            }`}
          >
            {step.title}
          </div>
        ))}
      </div>
    </div>
  );

  // Confirmation Dialog
  const renderConfirmation = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="p-6 max-w-md w-full">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Confirm Unit Creation
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Are you sure you want to create this unit? This action cannot be
            undone.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => setShowConfirmation(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFinalSubmit}
              disabled={isSubmitting || imageUploading}
              className="bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700"
            >
              {isSubmitting || imageUploading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  {imageUploading ? "Uploading Images..." : "Creating Unit..."}
                </>
              ) : (
                "Yes, Create Unit"
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  // Render amenities step content
  const renderAmenitiesStep = () => {
    if (isLoadingAmenities) {
      return (
        <Card className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader className="h-6 w-6 animate-spin text-emerald-600 mr-2" />
            <span className="text-gray-600">Loading amenities...</span>
          </div>
        </Card>
      );
    }

    if (amenitiesError) {
      return (
        <Card className="p-6">
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-red-600 mb-2">{amenitiesError}</p>
            <p className="text-sm">Please try refreshing the page</p>
          </div>
        </Card>
      );
    }

    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
            <CheckCircle className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Amenities</h2>
        </div>

        <div className="space-y-6">
          <p className="text-sm text-gray-600">
            Select the amenities available in this unit. This helps tenants find
            the perfect match for their needs.
          </p>

          {amenities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No amenities available</p>
              <p className="text-sm">
                Please contact support if this issue persists
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(groupedAmenities).map(
                  ([category, categoryAmenities]) => (
                    <div key={category} className="border rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">
                        {category}
                      </h3>
                      <div className="space-y-2">
                        {categoryAmenities.map((amenity) => (
                          <div
                            key={amenity.id}
                            className="flex items-center gap-3"
                          >
                            <input
                              type="checkbox"
                              id={`amenity-${amenity.id}`}
                              checked={formData.amenities.includes(amenity.id)}
                              onChange={() => handleAmenityChange(amenity.id)}
                              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                            />
                            <label
                              htmlFor={`amenity-${amenity.id}`}
                              className="text-sm text-gray-700 flex-1"
                            >
                              {amenity.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  <strong>Selected amenities:</strong>{" "}
                  {formData.amenities.length} of {amenities.length}
                </p>
              </div>
            </>
          )}
        </div>
      </Card>
    );
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                <Home className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Basic Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label
                  htmlFor="label"
                  className="text-sm font-medium text-gray-700"
                >
                  Unit Label/Name *
                </label>
                <Input
                  id="label"
                  name="label"
                  value={formData.label}
                  onChange={handleInputChange}
                  placeholder="e.g., Unit 3A, Studio B"
                  maxLength={50}
                  required
                />
                <p className="text-xs text-gray-500">
                  {formData.label.length}/50 characters
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="floorNumber"
                  className="text-sm font-medium text-gray-700"
                >
                  Floor Number
                </label>
                <Input
                  id="floorNumber"
                  name="floorNumber"
                  required
                  type="number"
                  min="0"
                  max="200"
                  value={formData.floorNumber}
                  onChange={handleInputChange}
                  placeholder="e.g., 3"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label
                  htmlFor="description"
                  className="text-sm font-medium text-gray-700"
                >
                  Description * (30 words max)
                </label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the unit, its features, and what makes it special..."
                  rows={4}
                  required
                />
                <p className="text-xs text-gray-500">
                  {getWordCount(formData.description)}/30 words
                </p>
              </div>
            </div>
          </Card>
        );
      case 2:
        return renderAmenitiesStep();
      case 3:
        return (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                <ImageIcon className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Unit Images
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Main Image */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Main Image *
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    This will be the primary image displayed for your unit
                    listing.
                  </p>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleMainImageChange}
                    accept="image/*"
                    className="hidden"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Main Image
                  </Button>
                </div>

                {formData.mainImagePreview && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <img
                        src={formData.mainImagePreview}
                        alt="Main preview"
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">
                          Main Image
                        </p>
                        <p className="text-xs text-gray-500">
                          {formData.mainImage?.name}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            mainImage: null,
                            mainImagePreview: "",
                          }))
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Images */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Additional Images (6 required) *
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Show different angles and features of your unit. Exactly 6
                    images are required.
                  </p>

                  <input
                    type="file"
                    ref={otherImagesInputRef}
                    onChange={handleOtherImagesChange}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => otherImagesInputRef.current?.click()}
                    disabled={formData.otherImages.length >= 6}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Add Additional Images ({formData.otherImages.length}/6)
                  </Button>
                </div>

                {formData.otherImagesPreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {formData.otherImagesPreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Additional ${index + 1}`}
                          className="w-full h-20 object-cover rounded"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-1 right-1 h-5 w-5 bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeOtherImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {formData.otherImages.length > 0 &&
                  formData.otherImages.length < 6 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-amber-800 text-sm">
                        <strong>Notice:</strong> You need to upload{" "}
                        {6 - formData.otherImages.length} more image(s) to
                        complete the requirement.
                      </p>
                    </div>
                  )}

                {formData.otherImages.length === 6 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <p className="text-emerald-800 text-sm">
                      <strong>Perfect!</strong> You have uploaded all 6 required
                      additional images.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      case 4:
        return (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                <DollarSign className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Pricing & Occupancy
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label
                    htmlFor="targetPrice"
                    className="text-sm font-medium text-gray-700"
                  >
                    Monthly Rent (₱) *
                  </label>
                  <Input
                    id="targetPrice"
                    name="targetPrice"
                    type="number"
                    min="1"
                    max="100000"
                    step="0.01"
                    value={formData.targetPrice}
                    onChange={handleInputChange}
                    placeholder="e.g., 15000"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Must be between ₱1 and ₱100,000
                  </p>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="securityDeposit"
                    className="text-sm font-medium text-gray-700"
                  >
                    Security Deposit (₱)
                  </label>
                  <Input
                    id="securityDeposit"
                    name="securityDeposit"
                    type="number"
                    min="0"
                    max="100000"
                    step="0.01"
                    value={formData.securityDeposit}
                    onChange={handleInputChange}
                    placeholder="e.g., 10000"
                  />
                  <p className="text-xs text-gray-500">
                    Optional, max ₱100,000
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label
                    htmlFor="maxOccupancy"
                    className="text-sm font-medium text-gray-700"
                  >
                    Maximum Occupancy *
                  </label>
                  <Input
                    id="maxOccupancy"
                    name="maxOccupancy"
                    type="number"
                    min="1"
                    max="20"
                    value={formData.maxOccupancy}
                    onChange={handleInputChange}
                    required
                  />
                  <p className="text-xs text-gray-500">1-20 people</p>
                </div>

                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <input
                    type="checkbox"
                    id="requiresScreening"
                    name="requiresScreening"
                    checked={formData.requiresScreening}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <div>
                    <label
                      htmlFor="requiresScreening"
                      className="text-sm font-medium text-gray-700"
                    >
                      Require tenant screening
                    </label>
                    <p className="text-xs text-gray-500">
                      Tenants must complete screening before applying
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
      case 5:
        return (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                <Shield className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Lease Rules
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Add Rule Form */}
              <div className="lg:col-span-1 space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Category
                    </label>
                    <select
                      value={formData.newLeaseRuleCategory}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          newLeaseRuleCategory: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    >
                      {leaseRuleCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Rule Text (7 words max)
                    </label>
                    <Input
                      value={formData.newLeaseRule}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          newLeaseRule: e.target.value,
                        }))
                      }
                      placeholder="e.g., No smoking inside the unit"
                      onKeyPress={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), addLeaseRule())
                      }
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {
                        formData.newLeaseRule.split(/\s+/).filter((w) => w)
                          .length
                      }
                      /7 words
                    </p>
                  </div>

                  <Button
                    type="button"
                    onClick={addLeaseRule}
                    disabled={
                      formData.leaseRules.length >= 10 ||
                      !formData.newLeaseRule.trim()
                    }
                    className="w-full"
                  >
                    Add Rule ({formData.leaseRules.length}/10)
                  </Button>
                </div>

                {formData.leaseRules.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600 text-center">
                      {formData.leaseRules.length} rule
                      {formData.leaseRules.length !== 1 ? "s" : ""} added
                    </p>
                  </div>
                )}
              </div>

              {/* Rules List */}
              <div className="lg:col-span-2">
                {formData.leaseRules.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Shield className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No lease rules added yet</p>
                    <p className="text-sm">
                      Add rules to specify tenant expectations
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {leaseRuleCategories.map((category) => {
                      const categoryRules =
                        groupedLeaseRules[category.id] || [];
                      if (categoryRules.length === 0) return null;

                      return (
                        <div
                          key={category.id}
                          className="border rounded-lg p-3"
                        >
                          <h4 className="font-medium text-gray-900 text-sm mb-2">
                            {category.name}
                          </h4>
                          <div className="space-y-1">
                            {categoryRules.map((rule) => (
                              <div
                                key={rule.id}
                                className="flex justify-between items-center text-sm bg-gray-50 rounded px-2 py-1"
                              >
                                <span className="text-gray-700 flex-1">
                                  {rule.text}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={() => removeLeaseRule(rule.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={`/landlord/properties/${propertyId}?tab=units`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Add a New Unit
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Step {currentStep} of {steps.length}
          </p>
        </div>
      </div>

      {/* Compact Progress Bar */}
      {renderProgressBar()}

      <form onSubmit={handleSubmit}>
        {renderStepContent()}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {currentStep < steps.length ? (
            <Button
              type="submit"
              className="flex items-center gap-1 bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              className="bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700"
            >
              Review & Create Unit
            </Button>
          )}
        </div>
      </form>

      {/* Confirmation Dialog */}
      {showConfirmation && renderConfirmation()}
    </div>
  );
};

export default AddUnit;