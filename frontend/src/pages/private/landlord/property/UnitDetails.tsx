import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  MapPin,
  Users,
  Star,
  Shield,
  CheckCircle,
  Home,
  DollarSign,
  Image as ImageIcon,
  Edit,
  Trash2,
  MoreVertical,
  Eye,
  MessageCircle,
  Clock,
  Globe,
  Zap,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getUnitDetailsRequest, deleteUnitRequest } from "@/api/landlordPropertyApi";
import { toast } from "sonner";

// Types based on your backend response
type Amenity = {
  id: string;
  name: string;
  category: string;
};

type UnitLeaseRule = {
  text: string;
  category: string;
};

type ReviewSummary = {
  total: number;
  average: number;
  stars: number;
};

type UnitReview = {
  id: string;
  tenantId: string;
  unitId: string;
  leaseId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  tenant: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
};

type UnitDetails = {
  id: string;
  propertyId: string;
  label: string;
  description: string;
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
  floorNumber: number | null;
  createdAt: string;
  updatedAt: string;
  maxOccupancy: number;
  mainImageUrl: string;
  otherImages: string[];
  unitLeaseRules: UnitLeaseRule[];
  viewCount: number;
  targetPrice: number;
  securityDeposit: number | null;
  requiresScreening: boolean;
  listedAt: string | null;
  amenities: Amenity[];
  reviews: UnitReview[];
  reviewsSummary: ReviewSummary;
  property: {
    id: string;
    title: string;
    address: string;
  };
  isListed: boolean;
};

// Lease rule categories for grouping
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

const UnitDetails = () => {
  const { unitId, propertyId } = useParams<{ unitId: string; propertyId: string }>();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [unit, setUnit] = useState<UnitDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch unit details
  useEffect(() => {
    const fetchUnitDetails = async () => {
      if (!propertyId || !unitId) {
        setError("Property ID or Unit ID is missing");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await getUnitDetailsRequest(propertyId, unitId);
        setUnit(response.data);
      } catch (err) {
        console.error('Error fetching unit details:', err);
        setError('Failed to load unit details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUnitDetails();
  }, [propertyId, unitId]);

  // Group amenities by category
  const groupedAmenities = unit?.amenities?.reduce((acc, amenity) => {
    if (!acc[amenity.category]) {
      acc[amenity.category] = [];
    }
    acc[amenity.category].push(amenity);
    return acc;
  }, {} as Record<string, Amenity[]>) || {};

  // Group lease rules by category
  const groupedLeaseRules = unit?.unitLeaseRules?.reduce((acc, rule) => {
    if (!acc[rule.category]) {
      acc[rule.category] = [];
    }
    acc[rule.category].push(rule);
    return acc;
  }, {} as Record<string, UnitLeaseRule[]>) || {};

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format date with time
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle edit unit
  const handleEdit = () => {
    navigate(`/landlord/properties/${propertyId}/units/${unitId}/edit`);
  };

  // Handle delete unit
  const handleDelete = async () => {
    if (!unitId || !propertyId) return;

    try {
      await deleteUnitRequest(propertyId, unitId);
      toast.success("Unit deleted successfully");
      // Navigate back to property units
      navigate(`/landlord/properties/${propertyId}?tab=units`);
    } catch (err: any) {
      console.error("Error deleting unit:", err);
      toast.error(err.response?.data?.message || "Failed to delete unit");
    } finally {
      setShowDeleteDialog(false);
    }
  };

  // Change unit status
  const changeStatus = (newStatus: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE") => {
    if (unit) {
      setUnit(prev => prev ? {
        ...prev,
        status: newStatus
      } : null);
      // In real app, this would call an API
    }
  };

  // Handle messages/inquiry
  const handleMessages = () => {
    // Navigate to messages page for this unit
    navigate(`/landlord/units/${unitId}/messages`);
  };

  // Toggle listing status
  const toggleListing = () => {
    if (unit) {
      const newListedAt = unit.listedAt ? null : new Date().toISOString();
      setUnit(prev => prev ? {
        ...prev,
        listedAt: newListedAt,
        isListed: !prev.isListed
      } : null);
      // In real app, this would call an API
    }
  };

  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  // Get all images including main and others (total 7 images)
  const allImages = unit ? [unit.mainImageUrl, ...(unit.otherImages || [])] : [];

  // Loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-600" />
          <p className="mt-2 text-gray-600">Loading unit details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !unit) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link to={`/landlord/properties/${propertyId}?tab=units`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Unit Details</h1>
        </div>
        <Card className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {error || "Unit not found"}
            </h2>
            <p className="text-gray-600 mb-6">
              {error 
                ? "There was an error loading the unit details. Please try again." 
                : "The unit you're looking for doesn't exist or has been removed."
              }
            </p>
            <Button onClick={() => navigate(`/landlord/properties/${propertyId}?tab=units`)}>
              Back to Property Units
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/landlord/properties/${unit.propertyId}?tab=units`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {unit.label}
              </h1>
              <Badge
                className={
                  unit.status === "AVAILABLE"
                    ? "bg-emerald-100 text-emerald-800"
                    : unit.status === "OCCUPIED"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-amber-100 text-amber-800"
                }
              >
                {unit.status}
              </Badge>
              <Badge 
                className={unit.listedAt ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
              >
                <Globe className="h-3 w-3 mr-1" />
                {unit.listedAt ? "Listed" : "Unlisted"}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-gray-600 mt-1">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">
                {unit.property.title} • {unit.property.address}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleEdit}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Unit
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setShowDeleteDialog(true)}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <Trash2 className="h-4 w-4" />
            Delete Unit
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => changeStatus("AVAILABLE")}>
                Mark as Available
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeStatus("OCCUPIED")}>
                Mark as Occupied
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeStatus("MAINTENANCE")}>
                Mark for Maintenance
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Images and Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <Card className="overflow-hidden">
            {/* Main Image Container - Fixed Height */}
            <div className="h-80 sm:h-96 md:h-[480px] bg-gray-100 relative overflow-hidden">
              <img
                src={allImages[selectedImage]}
                alt={unit.label}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                {selectedImage === 0 ? "Main Image" : `Image ${selectedImage + 1}`}
              </div>
            </div>
            
            {/* Thumbnail Gallery - Fixed Size - Show all 7 images */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <ImageIcon className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  Image Gallery ({allImages?.length || 0} images)
                </span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2">
                {(allImages || []).map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-md overflow-hidden border-2 ${
                      selectedImage === index
                        ? "border-emerald-500"
                        : "border-transparent"
                    } relative group bg-gray-100`}
                  >
                    <img
                      src={image}
                      alt={`${unit.label} ${index === 0 ? "main" : `view ${index}`}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-medium">
                        {index === 0 ? "Main" : index}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Listing Status Card - Only show if unit is not listed */}
          {!unit.isListed && (
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Ready to Find Tenants?
                  </h3>
                  <p className="text-gray-600 mb-4">
                    List your unit now to make it visible to potential tenants and start receiving inquiries. 
                    Your unit has all the details needed to attract great tenants.
                  </p>
                  <Button 
                    onClick={toggleListing}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    List Your Property Now
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Unit Description */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Home className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-900">Description</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">{unit.description}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
              <div className="text-center">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <Users className="h-6 w-6" />
                </div>
                <p className="text-sm text-gray-600">Max Occupancy</p>
                <p className="font-semibold text-gray-900">{unit.maxOccupancy}</p>
              </div>
              
              <div className="text-center">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-600 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <Home className="h-6 w-6" />
                </div>
                <p className="text-sm text-gray-600">Floor</p>
                <p className="font-semibold text-gray-900">
                  {unit.floorNumber ? `Floor ${unit.floorNumber}` : "Ground Floor"}
                </p>
              </div>
              
              <div className="text-center">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-600 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <Eye className="h-6 w-6" />
                </div>
                <p className="text-sm text-gray-600">Views</p>
                <p className="font-semibold text-gray-900">{unit.viewCount}</p>
              </div>
              
              <div className="text-center">
                <div className="p-2 rounded-lg bg-green-100 text-green-600 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <Clock className="h-6 w-6" />
                </div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="font-semibold text-gray-900 text-xs">
                  {formatDate(unit.createdAt)}
                </p>
              </div>
            </div>
          </Card>

          {/* Amenities */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-900">Amenities</h2>
            </div>

            {(unit.amenities?.length || 0) === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No amenities added</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(groupedAmenities).map(([category, categoryAmenities]) => (
                  <div key={category} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">{category}</h3>
                    <div className="space-y-2">
                      {categoryAmenities.map((amenity) => (
                        <div key={amenity.id} className="flex items-center gap-3">
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                          <span className="text-sm text-gray-700">{amenity.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Lease Rules */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">Lease Rules</h2>
            </div>

            {(unit.unitLeaseRules?.length || 0) === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No lease rules specified</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {leaseRuleCategories.map((category) => {
                  const categoryRules = groupedLeaseRules[category.id] || [];
                  if (categoryRules.length === 0) return null;

                  return (
                    <div key={category.id} className="border rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 text-sm mb-3">
                        {category.name}
                      </h3>
                      <div className="space-y-2">
                        {categoryRules.map((rule, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-2 text-sm bg-gray-50 rounded px-3 py-2"
                          >
                            <div className="w-2 h-2 bg-gray-400 rounded-full mt-1.5 flex-shrink-0" />
                            <span className="text-gray-700">{rule.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Reviews */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Star className="h-5 w-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-gray-900">Reviews</h2>
            </div>

            {/* Review Summary */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {unit.reviewsSummary.average.toFixed(1)}
                  </div>
                  <div className="flex items-center justify-center mt-1">
                    {renderStars(Math.round(unit.reviewsSummary.average))}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {unit.reviewsSummary.total} review{unit.reviewsSummary.total !== 1 ? 's' : ''}
                  </div>
                </div>
                
                <div className="flex-1 max-w-xs">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = (unit.reviews || []).filter(r => r.rating === star).length;
                    const percentage = unit.reviewsSummary.total > 0 ? (count / unit.reviewsSummary.total) * 100 : 0;
                    
                    return (
                      <div key={star} className="flex items-center gap-2 text-sm">
                        <span className="w-8 text-gray-600">{star}</span>
                        <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-amber-400 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="w-8 text-gray-600 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-6">
              {(unit.reviews?.length || 0) === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Star className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No reviews yet</p>
                  <p className="text-sm">Reviews will appear here once tenants leave feedback</p>
                </div>
              ) : (
                (unit.reviews || []).map((review) => (
                  <div key={review.id} className="border-b pb-6 last:border-b-0 last:pb-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {review.tenant.firstName} {review.tenant.lastName}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          {renderStars(review.rating)}
                          <span className="text-sm text-gray-500">
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right Column - Management & Actions */}
        <div className="space-y-6">
          {/* Pricing Card */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-900">Pricing</h2>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Monthly Rent</span>
                <span className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(unit.targetPrice)}
                </span>
              </div>

              {unit.securityDeposit && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Security Deposit</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {formatCurrency(unit.securityDeposit)}
                  </span>
                </div>
              )}

              {unit.requiresScreening && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Tenant Screening Required
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 mt-6">
              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={handleMessages}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Messages & Inquiries
              </Button>
              
              {unit.isListed && (
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={toggleListing}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Unlist Property
                </Button>
              )}
            </div>

            <div className="mt-6 pt-6 border-t">
              <div className="text-sm text-gray-600 space-y-2">
                <div className="flex justify-between">
                  <span>Property:</span>
                  <span className="font-medium text-right">{unit.property.title}</span>
                </div>
                <div className="flex justify-between">
                  <span>Unit ID:</span>
                  <span className="font-mono text-xs">{unit.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span className="text-right text-xs">{formatDateTime(unit.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Updated:</span>
                  <span className="text-right text-xs">{formatDateTime(unit.updatedAt)}</span>
                </div>
                {unit.listedAt && (
                  <div className="flex justify-between">
                    <span>Listed Since:</span>
                    <span className="text-right text-xs">{formatDateTime(unit.listedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Unit Overview</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Views</span>
                <span className="font-semibold">{unit.viewCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Reviews</span>
                <span className="font-semibold">{unit.reviewsSummary.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Rating</span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                  <span className="font-semibold">{unit.reviewsSummary.average.toFixed(1)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Amenities</span>
                <span className="font-semibold">{unit.amenities?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Lease Rules</span>
                <span className="font-semibold">{unit.unitLeaseRules?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Images</span>
                <span className="font-semibold">{allImages?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Listing Status</span>
                <Badge 
                  className={unit.listedAt ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                >
                  {unit.listedAt ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 max-w-md w-full">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete Unit
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete "{unit.label}"? This action cannot be undone and all unit data including reviews and images will be permanently removed.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Yes, Delete Unit
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default UnitDetails;