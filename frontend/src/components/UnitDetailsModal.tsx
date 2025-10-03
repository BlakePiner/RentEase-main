import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Home,
  Users,
  Maximize,
  Eye,
  Star,
  MapPin,
  Shield,
  Wifi,
  Car,
  Utensils,
  Dumbbell,
  Waves,
  TreePine,
  Camera,
  FileText,
  X,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface UnitDetailsModalProps {
  unit: any;
  property: any;
  isOpen: boolean;
  onClose: () => void;
  onApply: (unit: any) => void;
}

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

const AmenityIcon = ({ amenityName }: { amenityName: string }) => {
  const iconMap: { [key: string]: any } = {
    'wifi': Wifi,
    'parking': Car,
    'kitchen': Utensils,
    'gym': Dumbbell,
    'pool': Waves,
    'garden': TreePine,
    'security': Shield,
    'camera': Camera,
  };

  const IconComponent = iconMap[amenityName.toLowerCase()] || Home;
  return <IconComponent className="h-4 w-4" />;
};

const UnitDetailsModal = ({ unit, property, isOpen, onClose, onApply }: UnitDetailsModalProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Create array of images (main image + any other images)
  const images = [
    unit.mainImageUrl,
    ...(unit.otherImages || [])
  ].filter(Boolean);

  // Debug: Log unit data to see what images are available
  console.log('Unit data:', unit);
  console.log('Available images:', images);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[100vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {unit.label} - {property.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image Gallery */}
          {images.length > 0 ? (
            <div className="space-y-4">
              <div className="relative">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
                  <img
                    src={images[selectedImageIndex]}
                    alt={unit.label}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Navigation arrows for multiple images */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImageIndex(selectedImageIndex > 0 ? selectedImageIndex - 1 : images.length - 1)}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setSelectedImageIndex(selectedImageIndex < images.length - 1 ? selectedImageIndex + 1 : 0)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  
                  {/* Image counter */}
                  {images.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                      {selectedImageIndex + 1} / {images.length}
                    </div>
                  )}
                </div>
                
                {/* Thumbnail navigation */}
                {images.length > 1 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImageIndex === index
                            ? "border-blue-500 ring-2 ring-blue-200"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${unit.label} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Camera className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No images available</p>
              </div>
            </div>
          )}

          {/* Unit Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Details */}
            <div className="md:col-span-2 space-y-6">
              {/* Basic Info */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Unit Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-gray-500" />
                      <div>
                        <div className="text-sm text-gray-500">Max Occupancy</div>
                        <div className="font-medium">{unit.maxOccupancy} people</div>
                      </div>
                    </div>
                    {unit.floorNumber && (
                      <div className="flex items-center gap-2">
                        <Maximize className="h-5 w-5 text-gray-500" />
                        <div>
                          <div className="text-sm text-gray-500">Floor</div>
                          <div className="font-medium">Floor {unit.floorNumber}</div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-gray-500" />
                      <div>
                        <div className="text-sm text-gray-500">Views</div>
                        <div className="font-medium">{unit.viewCount}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-gray-500" />
                      <div>
                        <div className="text-sm text-gray-500">Available Since</div>
                        <div className="font-medium">{formatDate(unit.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
                  <p className="text-gray-700 leading-relaxed">{unit.description}</p>
                </CardContent>
              </Card>

              {/* Amenities */}
              {unit.amenities.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {unit.amenities.map((amenity: any) => (
                        <div key={amenity.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                          <AmenityIcon amenityName={amenity.name} />
                          <span className="text-sm font-medium">{amenity.name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reviews */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Reviews</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <StarRating rating={unit.avgRating} reviewCount={unit.reviewCount} />
                  </div>
                  {unit.reviews && unit.reviews.length > 0 ? (
                    <div className="space-y-4">
                      {unit.reviews.slice(0, 3).map((review: any) => (
                        <div key={review.id} className="border-l-4 border-blue-500 pl-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">
                              {formatDate(review.createdAt)}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No reviews yet. Be the first to review this unit!</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Pricing */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {formatCurrency(unit.targetPrice)}
                    </div>
                    <div className="text-gray-500 mb-4">per month</div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Base Rent:</span>
                        <span>{formatCurrency(unit.targetPrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Security Deposit:</span>
                        <span>{formatCurrency(unit.targetPrice * 2)}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-medium">
                        <span>Total Move-in:</span>
                        <span>{formatCurrency(unit.targetPrice * 3)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Property Info */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{property.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{property.type}</span>
                    </div>
                    {unit.requiresScreening && (
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-600">Background Check Required</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={() => onApply(unit)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  <FileText className="h-5 w-5 mr-2" />
                  Apply for This Unit
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="w-full"
                  size="lg"
                >
                  Close
                </Button>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Available
                </Badge>
                {unit.requiresScreening && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <Shield className="h-3 w-3 mr-1" />
                    Screening Required
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UnitDetailsModal;
