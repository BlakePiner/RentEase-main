import { useMemo, useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Search, MapPin, BedDouble, Maximize, Filter, ChevronLeft, ChevronRight, Eye, Star, Loader2 } from "lucide-react";
import Chatbot from "@/components/Chatbot";
import { browseApprovedPropertiesRequest, type BrowseProperty, type BrowsePropertiesResponse } from "@/api/tenantApi";
import { toast } from "sonner";

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

const BrowseProperties = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State for search and filters - initialize from URL params
  const [query, setQuery] = useState(searchParams.get("search") || "");
  const [location, setLocation] = useState<string>(searchParams.get("location") || "ALL");
  const [locationQuery, setLocationQuery] = useState("");
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<Set<string>>(
    new Set(searchParams.get("amenities")?.split(",").filter(Boolean) || [])
  );
  const [amenityQuery, setAmenityQuery] = useState("");
  const [showAmenitySuggestions, setShowAmenitySuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [isScrolled, setIsScrolled] = useState(false);
  const [propertyType, setPropertyType] = useState<string>(searchParams.get("propertyType") || "ALL");
  const [minPrice, setMinPrice] = useState<string>(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState<string>(searchParams.get("maxPrice") || "");
  const [sortBy, setSortBy] = useState<string>(searchParams.get("sortBy") || "newest");

  // API data state
  const [data, setData] = useState<BrowsePropertiesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Applied filters for server requests
  const [appliedQuery, setAppliedQuery] = useState("");
  const [appliedLocation, setAppliedLocation] = useState<string>("ALL");
  const [appliedAmenities, setAppliedAmenities] = useState<Set<string>>(new Set());
  const [appliedPropertyType, setAppliedPropertyType] = useState<string>("ALL");
  const [appliedMinPrice, setAppliedMinPrice] = useState<string>("");
  const [appliedMaxPrice, setAppliedMaxPrice] = useState<string>("");
  const [appliedSortBy, setAppliedSortBy] = useState<string>("newest");

  const pageSize = 12;

  // Update URL params when filters change
  const updateURLParams = (newFilters: {
    search?: string;
    location?: string;
    amenities?: string[];
    propertyType?: string;
    minPrice?: string;
    maxPrice?: string;
    sortBy?: string;
    page?: number;
  }) => {
    const params = new URLSearchParams();
    
    if (newFilters.search) params.set("search", newFilters.search);
    if (newFilters.location && newFilters.location !== "ALL") params.set("location", newFilters.location);
    if (newFilters.amenities && newFilters.amenities.length > 0) params.set("amenities", newFilters.amenities.join(","));
    if (newFilters.propertyType && newFilters.propertyType !== "ALL") params.set("propertyType", newFilters.propertyType);
    if (newFilters.minPrice) params.set("minPrice", newFilters.minPrice);
    if (newFilters.maxPrice) params.set("maxPrice", newFilters.maxPrice);
    if (newFilters.sortBy && newFilters.sortBy !== "newest") params.set("sortBy", newFilters.sortBy);
    if (newFilters.page && newFilters.page > 1) params.set("page", newFilters.page.toString());
    
    setSearchParams(params);
  };

  // Fetch properties from API
  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await browseApprovedPropertiesRequest({
        page,
        limit: pageSize,
        search: appliedQuery || undefined,
        location: appliedLocation !== "ALL" ? appliedLocation : undefined,
        amenities: appliedAmenities.size > 0 ? Array.from(appliedAmenities) : undefined,
        propertyType: appliedPropertyType !== "ALL" ? appliedPropertyType : undefined,
        minPrice: appliedMinPrice ? parseFloat(appliedMinPrice) : undefined,
        maxPrice: appliedMaxPrice ? parseFloat(appliedMaxPrice) : undefined,
        sortBy: appliedSortBy
      });
      
      setData(response.data);
    } catch (err: any) {
      console.error("Error fetching properties:", err);
      setError("Failed to load properties. Please try again.");
      toast.error("Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  // Initialize applied filters from URL params on mount
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    const urlLocation = searchParams.get("location") || "ALL";
    const urlAmenities = new Set(searchParams.get("amenities")?.split(",").filter(Boolean) || []);
    const urlPropertyType = searchParams.get("propertyType") || "ALL";
    const urlMinPrice = searchParams.get("minPrice") || "";
    const urlMaxPrice = searchParams.get("maxPrice") || "";
    const urlSortBy = searchParams.get("sortBy") || "newest";
    const urlPage = parseInt(searchParams.get("page") || "1");

    setAppliedQuery(urlSearch);
    setAppliedLocation(urlLocation);
    setAppliedAmenities(urlAmenities);
    setAppliedPropertyType(urlPropertyType);
    setAppliedMinPrice(urlMinPrice);
    setAppliedMaxPrice(urlMaxPrice);
    setAppliedSortBy(urlSortBy);
    setPage(urlPage);
  }, []); // Only run on mount

  // Initial load and when filters change
  useEffect(() => {
    fetchProperties();
  }, [page, appliedQuery, appliedLocation, appliedAmenities, appliedPropertyType, appliedMinPrice, appliedMaxPrice, appliedSortBy]);

  // Execute search with current filters
  const executeSearch = () => {
    setAppliedQuery(query);
    setAppliedLocation(location);
    setAppliedAmenities(new Set(selectedAmenities));
    setAppliedPropertyType(propertyType);
    setAppliedMinPrice(minPrice);
    setAppliedMaxPrice(maxPrice);
    setAppliedSortBy(sortBy);
    setPage(1);
    
    // Update URL params
    updateURLParams({
      search: query,
      location: location,
      amenities: Array.from(selectedAmenities),
      propertyType: propertyType,
      minPrice: minPrice,
      maxPrice: maxPrice,
      sortBy: sortBy,
      page: 1
    });
  };

  // Handle chatbot filter application
  const handleChatbotFilters = (filters: {
    search?: string;
    location?: string;
    amenities?: string[];
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
  }) => {
    console.log('Applying chatbot filters:', filters);
    // Update the filter states
    if (filters.search) setQuery(filters.search);
    if (filters.location) setLocation(filters.location);
    if (filters.amenities) setSelectedAmenities(new Set(filters.amenities));
    if (filters.propertyType) setPropertyType(filters.propertyType);
    if (filters.minPrice) setMinPrice(filters.minPrice.toString());
    if (filters.maxPrice) setMaxPrice(filters.maxPrice.toString());

    // Apply the filters immediately
    const newSearch = filters.search || query;
    const newLocation = filters.location || location;
    const newAmenities = filters.amenities ? new Set(filters.amenities) : selectedAmenities;
    const newPropertyType = filters.propertyType || propertyType;
    const newMinPrice = filters.minPrice ? filters.minPrice.toString() : minPrice;
    const newMaxPrice = filters.maxPrice ? filters.maxPrice.toString() : maxPrice;

    setAppliedQuery(newSearch);
    setAppliedLocation(newLocation);
    setAppliedAmenities(newAmenities);
    setAppliedPropertyType(newPropertyType);
    setAppliedMinPrice(newMinPrice);
    setAppliedMaxPrice(newMaxPrice);
    setPage(1);

    // Update URL params
    updateURLParams({
      search: newSearch,
      location: newLocation,
      amenities: Array.from(newAmenities),
      propertyType: newPropertyType,
      minPrice: newMinPrice,
      maxPrice: newMaxPrice,
      page: 1
    });

    // Show success message with details
    const filterDetails = [];
    if (newSearch) filterDetails.push(`Search: "${newSearch}"`);
    if (newLocation !== "ALL") filterDetails.push(`Location: ${newLocation}`);
    if (newPropertyType !== "ALL") filterDetails.push(`Type: ${newPropertyType}`);
    if (newAmenities.size > 0) filterDetails.push(`Amenities: ${Array.from(newAmenities).join(', ')}`);
    if (newMinPrice) filterDetails.push(`Min Price: ₱${parseInt(newMinPrice).toLocaleString()}`);
    if (newMaxPrice) filterDetails.push(`Max Price: ₱${parseInt(newMaxPrice).toLocaleString()}`);
    
    toast.success(`🔍 Filters applied from chatbot: ${filterDetails.join(', ')}`);
  };

  // Toggle amenity selection
  const toggleAmenity = (name: string) => {
    setSelectedAmenities((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); 
      else next.add(name);
      return next;
    });
  };

  // Get unique locations from data for suggestions
  const uniqueLocations = useMemo(() => {
    if (!data?.properties) return [];
    const names = data.properties
      .map((p) => p.location)
      .filter(Boolean) as string[];
    return Array.from(new Set(names));
  }, [data]);

  // Get unique amenities from data for suggestions
  const uniqueAmenities = useMemo(() => {
    if (!data?.properties) return [];
    const amenities = data.properties
      .flatMap((p) => p.amenities.map(a => a.name))
      .filter(Boolean);
    return Array.from(new Set(amenities));
  }, [data]);

  const filteredLocations = useMemo(() => {
    if (!locationQuery.trim()) return [];
    return uniqueLocations
      .filter((loc) => loc.toLowerCase().includes(locationQuery.toLowerCase()))
      .slice(0, 5);
  }, [uniqueLocations, locationQuery]);

  const filteredAmenities = useMemo(() => {
    if (!amenityQuery.trim()) return [];
    return uniqueAmenities
      .filter((amenity) => amenity.toLowerCase().includes(amenityQuery.toLowerCase()))
      .slice(0, 5);
  }, [uniqueAmenities, amenityQuery]);

  // Handle scroll for header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format address
  const formatAddress = (property: BrowseProperty): string => {
    return `${property.street}, ${property.barangay}, ${property.location}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className={`sticky top-0 z-40 transition-all duration-200 ${
        isScrolled ? "bg-white/95 backdrop-blur-sm shadow-sm" : "bg-white"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/tenant" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <Home className="h-5 w-5" />
                <span className="font-medium">Back to Dashboard</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">Browse Properties</h1>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <div className={`${showFilters ? "block" : "hidden"} lg:block w-full lg:w-80 space-y-6`}>
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Search & Filters</h3>
              
              {/* Search */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search properties..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && executeSearch()}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="ALL">All Locations</option>
                    {uniqueLocations.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                {/* Property Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="ALL">All Types</option>
                    <option value="APARTMENT">Apartment</option>
                    <option value="CONDOMINIUM">Condominium</option>
                    <option value="BOARDING_HOUSE">Boarding House</option>
                    <option value="SINGLE_HOUSE">Single House</option>
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="most_viewed">Most Viewed</option>
                  </select>
                </div>

                {/* Amenities */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {uniqueAmenities.map((amenity) => (
                      <label key={amenity} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedAmenities.has(amenity)}
                          onChange={() => toggleAmenity(amenity)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button onClick={executeSearch} className="w-full">
                  <Search className="h-4 w-4 mr-2" />
                  Apply Filters
                </Button>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {loading ? "Loading..." : `${data?.pagination.totalCount || 0} Properties Found`}
                </h2>
                {data && (
                  <p className="text-sm text-gray-600">
                    Showing {((data.pagination.currentPage - 1) * pageSize) + 1} to {Math.min(data.pagination.currentPage * pageSize, data.pagination.totalCount)} of {data.pagination.totalCount} results
                  </p>
                )}
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading properties...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <Card className="p-8 text-center">
                <div className="text-red-600 mb-4">
                  <Home className="h-12 w-12 mx-auto mb-2" />
                  <h3 className="text-lg font-medium">Error Loading Properties</h3>
                  <p className="text-sm text-gray-600 mt-1">{error}</p>
                </div>
                <Button onClick={fetchProperties} variant="outline">
                  Try Again
                </Button>
              </Card>
            )}

            {/* Properties Grid */}
            {!loading && !error && data && (
              <>
                {data.properties.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {data.properties.map((property) => (
                      <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        {/* Property Image */}
                        <div className="relative h-48 bg-gray-200">
                          {property.mainImageUrl ? (
                            <img
                              src={property.mainImageUrl}
                              alt={property.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Home className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                          <div className="absolute top-3 left-3">
                            <span className="bg-green-600 text-white text-xs font-medium px-2 py-1 rounded">
                              {property.availableUnitsCount} Units Available
                            </span>
                          </div>
                          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded flex items-center gap-1">
                            <Eye className="h-3 w-3 text-gray-600" />
                            <span className="text-xs text-gray-600">{property.totalViews}</span>
                          </div>
                        </div>

                        {/* Property Details */}
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-gray-900 line-clamp-1">
                              {property.title}
                            </h3>
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600">
                                {property.priceRange.min === property.priceRange.max 
                                  ? formatCurrency(property.priceRange.min)
                                  : `${formatCurrency(property.priceRange.min)} - ${formatCurrency(property.priceRange.max)}`
                                }
                              </div>
                              <div className="text-xs text-gray-500">per month</div>
                            </div>
                          </div>

                          <div className="flex items-center text-gray-600 text-sm mb-2">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span className="line-clamp-1">{formatAddress(property)}</span>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <Home className="h-4 w-4" />
                              <span>{property.type}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <BedDouble className="h-4 w-4" />
                              <span>{property.availableUnitsCount} units</span>
                            </div>
                          </div>

                          <StarRating rating={property.avgRating} reviewCount={property.reviewCount} />

                          {/* Amenities */}
                          {property.amenities.length > 0 && (
                            <div className="mt-3">
                              <div className="flex flex-wrap gap-1">
                                {property.amenities.slice(0, 3).map((amenity) => (
                                  <span
                                    key={amenity.id}
                                    className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded"
                                  >
                                    {amenity.name}
                                  </span>
                                ))}
                                {property.amenities.length > 3 && (
                                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                                    +{property.amenities.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="mt-4 pt-3 border-t border-gray-100">
                            <Link to={`/tenant/properties/${property.id}`}>
                              <Button className="w-full" size="sm">
                                View Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-12 text-center">
                    <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
                    <p className="text-gray-600 mb-4">
                      Try adjusting your search criteria or filters to find more properties.
                    </p>
                    <Button onClick={() => {
                      setQuery("");
                      setLocation("ALL");
                      setPropertyType("ALL");
                      setMinPrice("");
                      setMaxPrice("");
                      setSelectedAmenities(new Set());
                      setSortBy("newest");
                      
                      // Clear applied filters
                      setAppliedQuery("");
                      setAppliedLocation("ALL");
                      setAppliedPropertyType("ALL");
                      setAppliedMinPrice("");
                      setAppliedMaxPrice("");
                      setAppliedAmenities(new Set());
                      setAppliedSortBy("newest");
                      setPage(1);
                      
                      // Clear URL params
                      setSearchParams({});
                    }} variant="outline">
                      Clear Filters
                    </Button>
                  </Card>
                )}

                {/* Pagination */}
                {data.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-8">
                    <p className="text-sm text-gray-600">
                      Page {data.pagination.currentPage} of {data.pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={!data.pagination.hasPrev}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={!data.pagination.hasNext}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Chatbot */}
      <Chatbot onApplyFilters={handleChatbotFilters} />
    </div>
  );
};

export default BrowseProperties;