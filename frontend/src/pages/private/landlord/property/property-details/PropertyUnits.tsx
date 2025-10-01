import { useEffect, useMemo, useState } from "react";
import { Building, ChevronLeft, ChevronRight, Home, Plus, Search, Star, Clock, Shield, Eye, RefreshCw, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPropertyUnitsRequest } from "@/api/landlordPropertyApi";
import { useNavigate } from "react-router-dom"; 
import { useParams } from "react-router-dom";

// Updated type based on backend responseS
type Unit = {
  id: string;
  label: string;
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
  floorNumber: number;
  createdAt: string;
  updatedAt: string;
  targetPrice: number;
  securityDeposit: number;
  requiresScreening: boolean;
  isListed: boolean;
  mainImageUrl?: string;
  viewCount: number;
  reviewsSummary: {
    total: number; // num of reviews
    average: number; // star review by each reviewers, 1-5 stars, this is float
  };
};

// Helper functions
const getStatusColor = (status: string) => {
  switch (status) {
    case "AVAILABLE":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "OCCUPIED":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "MAINTENANCE":
      return "bg-amber-100 text-amber-800 border-amber-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getUnitBadgeType = (createdAt: string, updatedAt: string) => {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  const created = new Date(createdAt);
  const updated = new Date(updatedAt);
  
  // If created within 3 days, it's "New"
  if (created > threeDaysAgo) {
    return "NEW";
  }
  // If updated within 3 days (but not created recently), it's "Updated"
  else if (updated > threeDaysAgo) {
    return "UPDATED";
  }
  
  return null;
};

const StarRating = ({ rating, showText = true }: { rating: number; showText?: boolean }) => {
  const normalizedRating = Math.max(0, Math.min(5, rating)); // Ensure rating is between 0-5
  const fullStars = Math.floor(normalizedRating);
  const hasHalfStar = normalizedRating % 1 >= 0.5;
  
  return (
    <div className="flex items-center gap-0.5">
      <div className="flex">
        {[...Array(5)].map((_, i) => {
          if (i < fullStars) {
            return <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />;
          } else if (i === fullStars && hasHalfStar) {
            return <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />;
          } else {
            return <Star key={i} className="h-3 w-3 text-gray-300" />;
          }
        })}
      </div>
      {showText && (
        <span className="text-xs text-gray-600 ml-1">{normalizedRating.toFixed(1)}</span>
      )}
    </div>
  );
};

// Loading Component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
  </div>
);

// Units Subnavigation Component
const UnitsSubnav = ({
  unitQuery,
  setUnitQuery,
  unitStatus,
  setUnitStatus,
  filteredUnitsCount,
  onAddUnit,
}: {
  unitQuery: string;
  setUnitQuery: (query: string) => void;
  unitStatus: string;
  setUnitStatus: (status: string) => void;
  filteredUnitsCount: number;
  onAddUnit: () => void;
}) => {
  return (
    <Card className="p-4">
      <div className="flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center">
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              value={unitQuery}
              onChange={(e) => setUnitQuery(e.target.value)}
              placeholder="Search units by label, floor, price..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>
          <select
            value={unitStatus}
            onChange={(e) => setUnitStatus(e.target.value)}
            className="w-full sm:w-40 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="OCCUPIED">Occupied</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
        </div>
        <Button
          onClick={onAddUnit}
          className="bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700 gap-2 mt-3 lg:mt-0 text-sm"
        >
          <Plus className="h-4 w-4" />
          Add Unit
        </Button>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        {filteredUnitsCount} units found
      </div>
    </Card>
  );
};

// Main PropertyUnits Component
const PropertyUnits = ({ 
  propertyId,
  onAddUnit
}: { 
  propertyId: string;
  onAddUnit: () => void;
}) => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate(); // Added navigate hook
  
  // Units filters and pagination
  const [unitQuery, setUnitQuery] = useState("");
  const [unitStatus, setUnitStatus] = useState<string>("ALL");
  const [unitPage, setUnitPage] = useState(1);
  const unitPageSize = 8; // 4 cards per row × 2 rows = 8 total

    
  // Fetch units when component mounts
  useEffect(() => {
    if (!propertyId) return;

    const controller = new AbortController();

    const fetchUnits = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getPropertyUnitsRequest(propertyId, {
          signal: controller.signal,
        });
        setUnits(res.data || []);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Error fetching units:", err);
          setError(err.response?.data?.message || "Failed to load units");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUnits();
    return () => controller.abort();
  }, [propertyId]);

  const filteredUnits = useMemo(() => {
    const q = unitQuery.trim().toLowerCase();

    return units.filter((unit) => {
      if (unitStatus !== "ALL" && unit.status !== unitStatus) return false;
      if (!q) return true;
      return (
        unit.label.toLowerCase().includes(q) ||
        String(unit.floorNumber).includes(q) ||
        String(unit.targetPrice).includes(q) ||
        String(unit.securityDeposit).includes(q)
      );
    });
  }, [units, unitQuery, unitStatus]);

  const totalUnitPages = Math.max(
    1,
    Math.ceil(filteredUnits.length / unitPageSize)
  );

  const goToUnitPage = (next: number) => {
    const clamped = Math.min(Math.max(1, next), totalUnitPages);
    setUnitPage(clamped);
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    window.location.reload();
  };

  const currentUnits = filteredUnits.slice((unitPage - 1) * unitPageSize, unitPage * unitPageSize);

  return (
    <div className="space-y-4">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="text-red-800 text-sm">
              Error loading units: {error}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="text-red-800 border-red-300 hover:bg-red-100 h-8"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Units Subnavigation */}
      <UnitsSubnav
        unitQuery={unitQuery}
        setUnitQuery={(query) => {
          setUnitQuery(query);
          setUnitPage(1);
        }}
        unitStatus={unitStatus}
        setUnitStatus={(status) => {
          setUnitStatus(status);
          setUnitPage(1);
        }}
        filteredUnitsCount={filteredUnits.length}
        onAddUnit={onAddUnit}
      />

      {/* Loading State */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        /* Units List */
        <UnitsList
          units={currentUnits}
          unitPage={unitPage}
          totalUnitPages={totalUnitPages}
          onPageChange={goToUnitPage}
          navigate={navigate} // Pass navigate function
        />
      )}
    </div>
  );
};

// Presentational UnitsList Component
const UnitsList = ({ 
  units, 
  unitPage, 
  totalUnitPages,
  onPageChange,
  navigate // Added navigate prop
}: { 
  units: Unit[];
  unitPage: number;
  totalUnitPages: number;
  onPageChange: (page: number) => void;
  navigate: (path: string) => void; // Added navigate prop type
}) => {
  if (units.length === 0) {
    return (
      <div className="text-center py-8">
        <Building className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-base font-medium text-gray-900 mb-1">No units found</h3>
        <p className="text-gray-500 text-sm">No units match your search criteria.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {units.map((unit) => (
          <UnitCard key={unit.id} unit={unit} navigate={navigate} />
        ))}
      </div>

      {totalUnitPages > 1 && (
        <Pagination 
          currentPage={unitPage}
          totalPages={totalUnitPages}
          onPageChange={onPageChange}
        />
      )}
    </>
  );
};

// Sub-components for UnitsList
const UnitCard = ({ unit, navigate }: { unit: Unit; navigate: (path: string) => void }) => (
  <Card className="overflow-hidden border border-gray-200 transition-all duration-200 hover:shadow-md hover:border-emerald-200 h-full flex flex-col">
    <UnitImage unit={unit} />
    <UnitDetails unit={unit} navigate={navigate} />
  </Card>
);

const UnitImage = ({ unit }: { unit: Unit }) => {
  const badgeType = getUnitBadgeType(unit.createdAt, unit.updatedAt);
  
  return (
    <div className="relative aspect-[4/3] bg-gray-100">
      {unit.mainImageUrl ? (
        <img 
          src={unit.mainImageUrl} 
          alt={unit.label} 
          className="h-full w-full object-cover" 
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-emerald-50 to-sky-50 flex items-center justify-center">
          <Home className="h-8 w-8 text-emerald-400" />
        </div>
      )}
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        <Badge variant="secondary" className={`text-xs font-medium ${getStatusColor(unit.status)}`}>
          {unit.status}
        </Badge>
        {badgeType === "NEW" && (
          <Badge variant="secondary" className="bg-rose-100 text-rose-800 border-rose-200 text-xs">
            <Clock className="h-3 w-3 mr-1" />
            New
          </Badge>
        )}
        {badgeType === "UPDATED" && (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
            <RefreshCw className="h-3 w-3 mr-1" />
            Updated
          </Badge>
        )}
      </div>
    </div>
  );
};
const UnitDetails = ({ unit, navigate }: { unit: Unit; navigate: (path: string) => void }) => {
  const { propertyId } = useParams<{ propertyId: string }>(); 

  return (
    <div className="p-3 flex-1 flex flex-col">
      <UnitHeader unit={unit} />
      <UnitMeta unit={unit} />
      <UnitFeatures unit={unit} />
      <UnitFooter unit={unit} />

      <div className="mt-auto pt-3">
        <Button 
          onClick={() => navigate(`/landlord/properties/${propertyId}/units/${unit.id}`)} 
          className="w-full bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600 text-white text-xs py-2 h-8 gap-1"
          size="sm"
        >
          View Details
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};


const UnitHeader = ({ unit }: { unit: Unit }) => (
  <div className="flex items-center justify-between mb-2">
    <h4 className="font-semibold text-gray-900 text-base">{unit.label}</h4>
    <span className="text-emerald-700 font-bold text-sm">₱{unit.targetPrice.toLocaleString()}/mo</span>
  </div>
);

const UnitMeta = ({ unit }: { unit: Unit }) => (
  <div className="flex items-center justify-between mb-2">
    <div className="text-xs text-gray-600">
      Floor {unit.floorNumber}
    </div>
    <div className="flex items-center gap-1">
      <Eye className="h-3 w-3 text-gray-400" />
      <span className="text-xs text-gray-500">{unit.viewCount}</span>
    </div>
  </div>
);

const UnitFeatures = ({ unit }: { unit: Unit }) => (
  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
    <div className="flex items-center gap-1 p-2 bg-gray-50 rounded">
      <Shield className="h-4 w-4" />
      {unit.securityDeposit != null ? (
        <span>₱{unit.securityDeposit.toLocaleString()}</span>
      ) : (
        <span className="text-gray-400">No Deposit</span>
      )}
    </div>
    <div className="flex items-center justify-center p-2 bg-gray-50 rounded">
      <span className={unit.requiresScreening ? "text-emerald-600" : "text-gray-400"}>
        {unit.requiresScreening ? "Screening" : "No Screening"}
      </span>
    </div>
  </div>
);


const UnitFooter = ({ unit }: { unit: Unit }) => (
  <div className="pt-2 border-t border-gray-100">
    <div className="flex items-center justify-between mb-1">
      <StarRating rating={unit.reviewsSummary.average} showText={false} />
      <Badge variant={unit.isListed ? "default" : "secondary"} className="text-xs">
        {unit.isListed ? "Listed" : "Unlisted"}
      </Badge>
    </div>
    <div className="flex items-center justify-between">
      {unit.reviewsSummary.total > 0 ? (
        <>
          <span className="text-xs text-gray-600">
            {unit.reviewsSummary.average.toFixed(1)} ({unit.reviewsSummary.total} review{unit.reviewsSummary.total !== 1 ? 's' : ''})
          </span>
        </>
      ) : (
        <span className="text-xs text-gray-400">No reviews</span>
      )}
    </div>
  </div>
);

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 5; i++) pages.push(i);
    } else if (currentPage >= totalPages - 2) {
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-200">
      <p className="text-sm text-gray-600">
        Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
      </p>
      <div className="flex items-center gap-1">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onPageChange(currentPage - 1)} 
          disabled={currentPage === 1} 
          className="gap-1 h-8"
        >
          <ChevronLeft className="h-3 w-3" /> Prev
        </Button>
        
        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((pageNum) => (
            <Button 
              key={pageNum} 
              variant={currentPage === pageNum ? "default" : "outline"} 
              size="sm" 
              className={`h-8 w-8 p-0 text-xs ${currentPage === pageNum ? 'bg-gradient-to-r from-emerald-600 to-sky-600' : ''}`} 
              onClick={() => onPageChange(pageNum)}
            >
              {pageNum}
            </Button>
          ))}
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onPageChange(currentPage + 1)} 
          disabled={currentPage === totalPages} 
          className="gap-1 h-8"
        >
          Next <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

export default PropertyUnits;