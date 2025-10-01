import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Home,
  Building,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
} from "lucide-react";
import { getLandlordPropertiesRequest } from "@/api/landlordPropertyApi";
import { toast } from "sonner";

type Property = {
  id: string;
  title: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  street: string;
  barangay: string;
  zipCode?: string | null;
  city?: { id: string; name: string } | null;
  municipality?: { id: string; name: string } | null;
  mainImageUrl?: string | null;
  unitsSummary: {
    total: number;
    available: number;
    occupied: number;
    maintenance: number;
  };
};

function formatAddress(property: Property): string {
  const locality = property.city?.name || property.municipality?.name || "";
  const segments = [property.street, property.barangay, locality]
    .filter(Boolean); // removes null/undefined/empty
  return segments.join(", ");
}

const getPropertyTypeIcon = (type: string) => {
  switch (type) {
    case "APARTMENT":
    case "CONDOMINIUM":
      return <Building className="h-3 w-3" />;
    case "BOARDING_HOUSE":
    case "SINGLE_HOUSE":
      return <Home className="h-3 w-3" />;
    default:
      return <Home className="h-3 w-3" />;
  }
};

const formatPropertyType = (type: string): string => {
  return type.replaceAll("_", " ").toLowerCase();
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const shouldShowNewBadge = (property: Property): boolean => {
  const created = new Date(property.createdAt);
  const updated = new Date(property.updatedAt);
  const now = new Date();
  
  const diffCreated = Math.ceil((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  const diffUpdated = Math.ceil((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
  
  return diffCreated <= 3 || diffUpdated <= 3;
};

const DisplayProperty = () => {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const res = await getLandlordPropertiesRequest({
          signal: controller.signal,
        });
        setProperties(res.data);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Error fetching properties:", err);
          toast.error("Failed to fetch properties");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
    return () => controller.abort();
  }, []);

  const sortedProperties = useMemo(() => {
    return [...properties].sort((a, b) => {
      // Get the most recent date for each property (either createdAt or updatedAt)
      const aRecentDate = new Date(Math.max(
        new Date(a.createdAt).getTime(),
        new Date(a.updatedAt).getTime()
      ));
      
      const bRecentDate = new Date(Math.max(
        new Date(b.createdAt).getTime(),
        new Date(b.updatedAt).getTime()
      ));
      
      // Sort by the most recent date in descending order
      return bRecentDate.getTime() - aRecentDate.getTime();
    });
  }, [properties]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return sortedProperties;

    return sortedProperties.filter((p) => {
      const address = formatAddress(p).toLowerCase();
      const title = p.title.toLowerCase();
      return title.includes(normalizedQuery) || address.includes(normalizedQuery);
    });
  }, [sortedProperties, query]);

  const propertiesPerPage = 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / propertiesPerPage));
  const currentPageProperties = filtered.slice(
    (page - 1) * propertiesPerPage,
    page * propertiesPerPage
  );

  const goToPage = (newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, page - 1);
      let end = Math.min(totalPages - 1, page + 1);

      if (page <= 3) {
        end = Math.min(totalPages - 1, maxVisiblePages - 1);
      }

      if (page >= totalPages - 2) {
        start = Math.max(2, totalPages - (maxVisiblePages - 2));
      }

      if (start > 2) {
        pages.push(-1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push(-2);
      }

      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const PropertyCard = ({ property }: { property: Property }) => {
    const occupancyRate = property.unitsSummary.total > 0
      ? Math.round((property.unitsSummary.occupied / property.unitsSummary.total) * 100)
      : 0;
    const showNewBadge = shouldShowNewBadge(property);
    const isRecentlyUpdated = new Date(property.updatedAt) > new Date(property.createdAt);

    return (
      <Card className="w-full overflow-hidden border border-gray-200 hover:border-emerald-200 transition-all duration-200 hover:shadow-lg rounded-xl bg-white">
        {/* Image Section */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {property.mainImageUrl ? (
            <img
              src={property.mainImageUrl}
              alt={property.title}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-emerald-100 to-sky-100 flex items-center justify-center">
              <Home className="h-8 w-8 text-emerald-400" />
            </div>
          )}
          
          {/* Top Badges */}
          <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
            <div className="flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-emerald-700">
              {getPropertyTypeIcon(property.type)}
              <span className="capitalize">{formatPropertyType(property.type)}</span>
            </div>
            
            <div className="flex gap-1">
              {showNewBadge && (
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  isRecentlyUpdated ? "bg-blue-500 text-white" : "bg-red-500 text-white"
                }`}>
                  {isRecentlyUpdated ? "UPDATED" : "NEW"}
                </div>
              )}
              {property.unitsSummary.total > 0 && (
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  occupancyRate >= 80 ? "bg-emerald-500 text-white" :
                  occupancyRate >= 50 ? "bg-amber-500 text-white" :
                  "bg-gray-500 text-white"
                }`}>
                  {occupancyRate}% occupied
                </div>
              )}
            </div>
          </div>

          {/* Gradient Overlay */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
        </div>

        {/* Content Section */}
        <div className="p-3 space-y-2">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
            {property.title}
          </h3>

          {/* Location */}
          <div className="flex items-start gap-1.5 text-xs text-gray-600">
            <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span className="leading-tight line-clamp-2 flex-1">
              {formatAddress(property)}
            </span>
          </div>

          {/* Date Information */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            <span>Updated {formatDate(property.updatedAt)}</span>
          </div>

          {/* Units Summary */}
          <div className="grid grid-cols-2 gap-2 p-2 bg-gradient-to-r from-emerald-50 to-sky-50 rounded-lg">
            <div className="text-center">
              <div className="font-semibold text-gray-900 text-sm">{property.unitsSummary.total}</div>
              <div className="text-[10px] text-gray-500">Total Units</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-emerald-600 text-sm">{property.unitsSummary.available}</div>
              <div className="text-[10px] text-gray-500">Available</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-600 text-sm">{property.unitsSummary.occupied}</div>
              <div className="text-[10px] text-gray-500">Occupied</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-amber-600 text-sm">{property.unitsSummary.maintenance}</div>
              <div className="text-[10px] text-gray-500">Maintenance</div>
            </div>
          </div>

          {/* Action Button */}
          <Link to={`/landlord/properties/${property.id}?tab=overview`}>
            <Button className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600 text-white text-xs py-2 h-8">
              View Details
            </Button>
          </Link>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-100 to-sky-100 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-medium">
              <span>Landlord • Properties</span>
            </div>
            <h1 className="mt-3 text-2xl font-bold text-gray-900">
              Your Properties
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage and view all your rental properties
            </p>
          </div>

          <Button
            onClick={() => navigate("/landlord/properties/create")}
            className="bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600 gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Add Property
          </Button>
        </div>

        {/* Search Section */}
        <Card className="p-4 bg-white border-gray-200 shadow-sm rounded-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search properties by title or location..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-200"
            />
          </div>
        </Card>

        {/* Results Count */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-sm text-gray-600">
            Showing <span className="font-medium text-emerald-500">{currentPageProperties.length}</span> of{" "}
            <span className="font-medium">{filtered.length}</span> properties
            {filtered.length > propertiesPerPage && (
              <span> • Page {page} of {totalPages}</span>
            )}
          </p>
          {filtered.length > 0 && (
            <p className="text-xs text-gray-500">
              Sorted by most recent activity (creation or update)
            </p>
          )}
        </div>

        {/* Properties Grid */}
        {currentPageProperties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {currentPageProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center border border-dashed border-gray-300 bg-white rounded-xl">
            <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-r from-emerald-100 to-sky-100 flex items-center justify-center mb-3">
              <Home className="h-6 w-6 text-emerald-500" />
            </div>
            <h3 className="text-base font-medium text-gray-900">
              No properties found
            </h3>
            <p className="text-gray-600 text-sm mt-1 max-w-md mx-auto">
              Try adjusting your search or add a new property to get started.
            </p>
            <Button 
              onClick={() => navigate("/landlord/properties/create")}
              className="mt-4 bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600 gap-2"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              Add Your First Property
            </Button>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Page <span className="font-medium">{page}</span> of{" "}
              <span className="font-medium">{totalPages}</span> •{" "}
              <span className="text-emerald-500">
                {(page - 1) * propertiesPerPage + 1}-{Math.min(page * propertiesPerPage, filtered.length)}
              </span> of {filtered.length} properties
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                className="gap-1 rounded-lg h-8 px-3"
              >
                <ChevronLeft className="h-3 w-3" />
                <span className="hidden sm:inline">Previous</span>
              </Button>

              <div className="flex items-center gap-1">
                {getPageNumbers().map((pageNum, index) => {
                  if (pageNum === -1 || pageNum === -2) {
                    return (
                      <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                        ...
                      </span>
                    );
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      className={`h-8 w-8 p-0 rounded-lg text-xs ${
                        page === pageNum
                          ? "bg-gradient-to-r from-emerald-500 to-sky-500"
                          : ""
                      }`}
                      onClick={() => goToPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(page + 1)}
                disabled={page === totalPages}
                className="gap-1 rounded-lg h-8 px-3"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DisplayProperty;