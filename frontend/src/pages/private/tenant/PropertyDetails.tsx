import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  ArrowLeft,
  MapPin,
  Users,
  Star,
  Home,
  DollarSign,
  Eye,
  Phone,
  Mail,
  Calendar,
  Maximize,
  Shield,
  FileText,
  Send,
  Loader2
} from "lucide-react";
import { getPropertyDetailsRequest, type PropertyDetails, type PropertyUnit } from "@/api/tenantApi";
import { createOrGetTenantConversationRequest, sendTenantMessageRequest } from "@/api/tenantMessageApi";
import TenantApplicationForm from "@/components/TenantApplicationForm";
import UnitDetailsModal from "@/components/UnitDetailsModal";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const StarRating = ({ rating, reviewCount }: { rating: number; reviewCount: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-1">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      ))}
      {hasHalfStar && <Star className="h-4 w-4 fill-yellow-400/50 text-yellow-400" />}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
      ))}
      {rating > 0 && <span className="text-sm text-gray-600 ml-1">({reviewCount})</span>}
      {rating === 0 && <span className="text-sm text-gray-500 ml-1">No reviews</span>}
    </div>
  );
};

const PropertyDetailsPage = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<PropertyUnit | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [contactingOwner, setContactingOwner] = useState(false);
  
  // Unit details modal state
  const [showUnitDetails, setShowUnitDetails] = useState(false);
  const [selectedUnitForDetails, setSelectedUnitForDetails] = useState<PropertyUnit | null>(null);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!propertyId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await getPropertyDetailsRequest(propertyId);
        setProperty(response.data);
      } catch (err: any) {
        console.error("Error fetching property details:", err);
        setError("Failed to load property details");
        toast.error("Failed to load property details");
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId]);

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
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleApplyForUnit = (unit: PropertyUnit) => {
    setSelectedUnit(unit);
    setShowApplicationModal(true);
  };

  const handleViewUnitDetails = (unit: PropertyUnit) => {
    setSelectedUnitForDetails(unit);
    setShowUnitDetails(true);
  };

  const handleCloseUnitDetails = () => {
    setShowUnitDetails(false);
    setSelectedUnitForDetails(null);
  };

  const handleStartApplication = () => {
    setShowApplicationModal(false);
    setShowApplicationForm(true);
  };

  const handleApplicationSuccess = () => {
    setShowApplicationForm(false);
    setSelectedUnit(null);
    toast.success("Application submitted successfully! The landlord will review your application.");
  };

  const handleApplicationCancel = () => {
    setShowApplicationForm(false);
    setSelectedUnit(null);
  };

  const handleContactOwner = async () => {
    if (!property?.owner) return;

    setContactingOwner(true);
    try {
      // Create or get conversation with the property owner
      const conversationResponse = await createOrGetTenantConversationRequest({
        otherUserId: property.owner.id
      });

      // Send an inquiry message
      const inquiryMessage = `Hi! I'm interested in your property "${property.title}". I'd like to know more about the available units and rental terms. Could you please provide more information?`;
      
      await sendTenantMessageRequest({
        conversationId: conversationResponse.data.conversation.id,
        content: inquiryMessage
      });

      toast.success("Inquiry sent successfully! The property owner will be notified.");
      
      // Navigate to messages page
      navigate("/tenant/messages");
    } catch (error: any) {
      console.error("Error contacting owner:", error);
      toast.error(error.response?.data?.message || "Failed to send inquiry. Please try again.");
    } finally {
      setContactingOwner(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Property Not Found</h3>
          <p className="text-gray-600 mb-4">{error || "The property you're looking for doesn't exist or is no longer available."}</p>
          <Link to="/tenant/browse-properties">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Browse
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Show application form if selected
  if (showApplicationForm && selectedUnit && property) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <TenantApplicationForm
            unit={selectedUnit}
            propertyTitle={property.title}
            onSuccess={handleApplicationSuccess}
            onCancel={handleApplicationCancel}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link to="/tenant/browse-properties" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back to Browse</span>
            </Link>
            <div className="h-6 w-px bg-gray-300" />
            <h1 className="text-xl font-bold text-gray-900">{property.title}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Overview */}
            <Card className="overflow-hidden">
              {/* Property Image */}
              <div className="relative h-64 bg-gray-200">
                {property.mainImageUrl ? (
                  <img
                    src={property.mainImageUrl}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Home className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <Badge className="bg-green-600 text-white">
                    {property.totalAvailableUnits} Units Available
                  </Badge>
                </div>
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg flex items-center gap-2">
                  <Eye className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-600">{property.totalViews} views</span>
                </div>
              </div>

              {/* Property Info */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{property.title}</h2>
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="h-5 w-5 mr-2" />
                      <span>{property.address}, {property.location}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{property.type}</span>
                      <span>Listed {formatDate(property.createdAt)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {property.priceRange.min === property.priceRange.max 
                        ? formatCurrency(property.priceRange.min)
                        : `${formatCurrency(property.priceRange.min)} - ${formatCurrency(property.priceRange.max)}`
                      }
                    </div>
                    <div className="text-sm text-gray-500">per month</div>
                  </div>
                </div>

                <StarRating rating={property.avgRating} reviewCount={property.totalReviews} />

                {/* Amenities */}
                {property.allAmenities.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Available Amenities</h4>
                    <div className="flex flex-wrap gap-2">
                      {property.allAmenities.map((amenity) => (
                        <span
                          key={amenity.id}
                          className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full"
                        >
                          {amenity.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Near Institutions */}
                {property.nearInstitutions && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Nearby Places</h4>
                    <div className="text-sm text-gray-600">
                      {/* You can format this based on your nearInstitutions structure */}
                      <p>Close to schools, malls, and transportation</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Available Units */}
            <Card className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Available Units ({property.totalAvailableUnits})</h3>
              <div className="grid gap-4">
                {property.availableUnits.map((unit) => (
                  <Card key={unit.id} className="p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4 flex-1">
                        {/* Unit Image */}
                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {unit.mainImageUrl ? (
                            <img 
                              src={unit.mainImageUrl} 
                              alt={unit.label}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Home className="h-8 w-8 text-gray-400" />
                          )}
                        </div>

                        {/* Unit Details */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{unit.label}</h4>
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600">
                                {formatCurrency(unit.targetPrice)}
                              </div>
                              <div className="text-xs text-gray-500">per month</div>
                            </div>
                          </div>

                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{unit.description}</p>

                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>Max {unit.maxOccupancy}</span>
                            </div>
                            {unit.floorNumber && (
                              <div className="flex items-center gap-1">
                                <Maximize className="h-4 w-4" />
                                <span>Floor {unit.floorNumber}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              <span>{unit.viewCount} views</span>
                            </div>
                            {unit.requiresScreening && (
                              <div className="flex items-center gap-1">
                                <Shield className="h-4 w-4 text-blue-600" />
                                <span className="text-blue-600">Screening Required</span>
                              </div>
                            )}
                          </div>

                          <StarRating rating={unit.avgRating} reviewCount={unit.reviewCount} />

                          {/* Unit Amenities */}
                          {unit.amenities.length > 0 && (
                            <div className="mt-2">
                              <div className="flex flex-wrap gap-1">
                                {unit.amenities.slice(0, 3).map((amenity) => (
                                  <span
                                    key={amenity.id}
                                    className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded"
                                  >
                                    {amenity.name}
                                  </span>
                                ))}
                                {unit.amenities.length > 3 && (
                                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                                    +{unit.amenities.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="ml-4 flex flex-col gap-2">
                        <Button 
                          onClick={() => handleViewUnitDetails(unit)}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button 
                          onClick={() => handleApplyForUnit(unit)}
                          className="bg-blue-600 hover:bg-blue-700"
                          size="sm"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Apply
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>

            {/* Reviews */}
            {property.allReviews.length > 0 && (
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Reviews ({property.totalReviews})</h3>
                <div className="space-y-4">
                  {property.allReviews.slice(0, 5).map((review) => (
                    <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{review.tenantName}</span>
                            <span className="text-sm text-gray-500">• {review.unitLabel}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <StarRating rating={review.rating} reviewCount={0} />
                            <span className="text-sm text-gray-500">{formatDate(review.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-gray-700 text-sm">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Owner Information */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Property Owner</h3>
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={property.owner.avatarUrl || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                    {property.owner.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900">{property.owner.name}</p>
                  <p className="text-sm text-gray-500">Property Owner</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{property.owner.email}</span>
                </div>
                {property.owner.phoneNumber && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{property.owner.phoneNumber}</span>
                  </div>
                )}
              </div>

              <Button 
                className="w-full mt-4" 
                variant="outline"
                onClick={handleContactOwner}
                disabled={contactingOwner}
              >
                {contactingOwner ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending Inquiry...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Owner
                  </>
                )}
              </Button>
            </Card>

            {/* Property Stats */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Property Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Units</span>
                  <span className="font-medium">{property.totalAvailableUnits}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Views</span>
                  <span className="font-medium">{property.totalViews}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Rating</span>
                  <span className="font-medium">{property.avgRating > 0 ? property.avgRating.toFixed(1) : 'No ratings'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Reviews</span>
                  <span className="font-medium">{property.totalReviews}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      <Dialog open={showApplicationModal} onOpenChange={setShowApplicationModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Apply for {selectedUnit?.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Application Process</h4>
              <p className="text-sm text-blue-800">
                To apply for this unit, you'll need to submit your credentials and documents for tenant screening. 
                This helps landlords verify your reliability as a tenant.
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">You'll need to provide:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Valid government ID</li>
                <li>• Proof of income</li>
                <li>• Employment verification</li>
                <li>• Character references</li>
                <li>• Previous rental history (if any)</li>
              </ul>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={() => setShowApplicationModal(false)}
                variant="outline" 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleStartApplication}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4 mr-2" />
                Start Application
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unit Details Modal */}
      {selectedUnitForDetails && (
        <UnitDetailsModal
          unit={selectedUnitForDetails}
          property={property}
          isOpen={showUnitDetails}
          onClose={handleCloseUnitDetails}
          onApply={handleApplyForUnit}
        />
      )}
    </div>
  );
};

export default PropertyDetailsPage;
