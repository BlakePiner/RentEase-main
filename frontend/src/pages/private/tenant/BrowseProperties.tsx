import { useMemo, useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Search, MapPin, BedDouble, Maximize, Filter, ChevronLeft, ChevronRight, MessageCircle, Eye, Star } from "lucide-react";

type Amenity = { id: string; name: string };
type City = { id: string; name: string };
type Municipality = { id: string; name: string };

type UnitReview = {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
};

type Unit = {
  id: string;
  label: string;
  description: string;
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
  mainImageUrl?: string | null;
  viewCount: number;
  targetPrice: number;
  securityDeposit?: number;
  maxOccupancy: number;
  floorNumber?: number;
  createdAt: string;
  amenities: Amenity[];
  reviews: UnitReview[];
  property: {
    id: string;
    title: string;
    type: string;
    street: string;
    barangay: string;
    zipCode?: string | null;
    city?: City | null;
    municipality?: Municipality | null;
  };
};

function formatAddress(u: Unit): string {
  const locality = u.property.city?.name || u.property.municipality?.name || "";
  const segments = [u.property.street, u.property.barangay, locality, u.property.zipCode].filter(Boolean);
  return segments.join(", ");
}

const StarRating = ({ rating, size = 3, showNumber = false }: { rating: number; size?: number; showNumber?: boolean }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => {
        if (i < fullStars) {
          return <Star key={i} className={`h-${size} w-${size} fill-yellow-400 text-yellow-400`} />;
        } else if (i === fullStars && hasHalfStar) {
          return <Star key={i} className={`h-${size} w-${size} fill-yellow-400 text-yellow-400`} />;
        } else {
          return <Star key={i} className={`h-${size} w-${size} text-gray-300`} />;
        }
      })}
      {showNumber && <span className="text-xs text-gray-600 ml-1">{rating.toFixed(1)}</span>}
    </div>
  );
};

const mockAmenities: Amenity[] = [
  { id: "a1", name: "Air Conditioning" },
  { id: "a2", name: "Parking Space" },
  { id: "a3", name: "Elevator" },
  { id: "a4", name: "Gym" },
  { id: "a5", name: "Swimming Pool" },
  { id: "a6", name: "WiFi" },
  { id: "a7", name: "Furnished" },
  { id: "a8", name: "Pet Friendly" },
  { id: "a9", name: "Balcony" },
  { id: "a10", name: "Security" },
];

const mockCities: City[] = [
  { id: "c1", name: "Cebu City" },
  { id: "c2", name: "Mandaue" },
  { id: "c3", name: "Lapu-Lapu City" },
  { id: "c4", name: "Talisay City" },
];

const mockMunicipalities: Municipality[] = [
  { id: "m1", name: "Toledo" },
  { id: "m2", name: "Danao" },
  { id: "m3", name: "Consolacion" },
  { id: "m4", name: "Liloan" },
  { id: "m5", name: "Compostela" },
];

const mockUnits: Unit[] = Array.from({ length: 24 }).map((_, i) => {
  const useCity = i % 2 === 0;
  const location = useCity ? mockCities[i % mockCities.length] : mockMunicipalities[i % mockMunicipalities.length];
  const amenities = [mockAmenities[i % mockAmenities.length], mockAmenities[(i + 1) % mockAmenities.length]];
  
  // Mock reviews for rating calculation
  const mockReviews: UnitReview[] = Array.from({ length: Math.floor(Math.random() * 8) + 1 }).map((_, j) => ({
    id: `review-${i}-${j}`,
    rating: Math.floor(Math.random() * 5) + 1, // 1-5 stars
    comment: `Great unit ${j + 1}`,
    createdAt: new Date(Date.now() - j * 86400000).toISOString(),
  }));
  
  return {
    id: `u-${i + 1}`,
    label: `Unit ${i + 1}`,
    description: `Beautiful unit with modern amenities`,
    status: i % 3 === 0 ? "MAINTENANCE" : i % 2 === 0 ? "AVAILABLE" : "OCCUPIED",
    mainImageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=870&auto=format&fit=crop",
    viewCount: 50 + (i * 37) % 500,
    targetPrice: 9000 + (i % 10) * 1000,
    securityDeposit: 5000 + (i % 5) * 1000,
    maxOccupancy: (i % 3) + 1,
    floorNumber: (i % 5) + 1,
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    amenities,
    reviews: mockReviews,
    property: {
      id: `p-${i + 1}`,
      title: `Sample Property ${i + 1}`,
      type: ["APARTMENT", "CONDOMINIUM", "BOARDING_HOUSE", "SINGLE_HOUSE"][i % 4],
      street: "123 Mango Ave",
      barangay: "Barangay Luz",
      zipCode: "6000",
      city: useCity ? (location as City) : null,
      municipality: !useCity ? (location as Municipality) : null,
    },
  } as Unit;
});

const BrowseProperties = () => {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState<string>("ALL");
  const [locationQuery, setLocationQuery] = useState("");
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<Set<string>>(new Set());
  const [amenityQuery, setAmenityQuery] = useState("");
  const [showAmenitySuggestions, setShowAmenitySuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [isScrolled, setIsScrolled] = useState(false);

  // Server-triggered search: applied snapshot
  const [appliedQuery, setAppliedQuery] = useState("");
  const [appliedLocation, setAppliedLocation] = useState<string>("ALL");
  const [appliedAmenities, setAppliedAmenities] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<"MOST_VIEWED" | "TOP_RATED" | "NEWLY_LISTED">("NEWLY_LISTED");

  const executeSearch = () => {
    setAppliedQuery(query);
    setAppliedLocation(location);
    setAppliedAmenities(new Set(selectedAmenities));
    setPage(1);
  };

  const toggleAmenity = (name: string) => {
    setPage(1);
    setSelectedAmenities((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const uniqueLocations = useMemo(() => {
    const names = mockUnits
      .map((u) => u.property.city?.name || u.property.municipality?.name)
      .filter(Boolean) as string[];
    return Array.from(new Set(names));
  }, []);

  const filteredLocations = useMemo(() => {
    if (!locationQuery.trim()) return [];
    return uniqueLocations
      .filter((loc) => loc.toLowerCase().includes(locationQuery.toLowerCase()))
      .slice(0, 5); // Limit to 5 suggestions
  }, [uniqueLocations, locationQuery]);

  const filteredAmenities = useMemo(() => {
    if (!amenityQuery.trim()) return [];
    return mockAmenities
      .filter((a) => a.name.toLowerCase().includes(amenityQuery.toLowerCase()))
      .slice(0, 5); // Limit to 5 suggestions
  }, [amenityQuery]);

  // Handle scroll for sticky search
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredUnits = useMemo(() => {
    const q = appliedQuery.trim().toLowerCase();
    const filtered = mockUnits.filter((u) => {
      if (appliedLocation !== "ALL") {
        const loc = (u.property.city?.name || u.property.municipality?.name || "").toLowerCase();
        if (loc !== appliedLocation.toLowerCase()) return false;
      }
      if (appliedAmenities.size > 0) {
        const names = new Set(u.amenities.map((a) => a.name.toLowerCase()));
        for (const a of appliedAmenities) {
          if (!names.has(a.toLowerCase())) return false;
        }
      }
      if (!q) return true;
      return (
        u.label.toLowerCase().includes(q) ||
        u.property.title.toLowerCase().includes(q) ||
        formatAddress(u).toLowerCase().includes(q)
      );
    });

    const sorted = [...filtered];
    if (activeCategory === "MOST_VIEWED") {
      sorted.sort((a, b) => b.viewCount - a.viewCount);
    } else if (activeCategory === "TOP_RATED") {
      sorted.sort((a, b) => {
        const aRating = a.reviews.length > 0 ? a.reviews.reduce((sum, r) => sum + r.rating, 0) / a.reviews.length : 0;
        const bRating = b.reviews.length > 0 ? b.reviews.reduce((sum, r) => sum + r.rating, 0) / b.reviews.length : 0;
        return bRating - aRating;
      });
    } else {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return sorted;
  }, [appliedQuery, appliedLocation, appliedAmenities, activeCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredUnits.length / pageSize));
  const current = filteredUnits.slice((page - 1) * pageSize, page * pageSize);

  function goToPage(next: number) {
    const clamped = Math.min(Math.max(1, next), totalPages);
    setPage(clamped);
  }

  // Simple AI Chatbot widget (mock)
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    { role: "assistant", content: "Hi! I can help you find a property. Try '2BR in Cebu with wifi'" },
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, chatOpen]);

  const sendChat = () => {
    const text = chatInput.trim();
    if (!text) return;
    setMessages((m) => [...m, { role: "user", content: text }]);
    setChatInput("");
    // very naive mock parsing
    setTimeout(() => {
      const lower = text.toLowerCase();
      const suggested: string[] = [];
      if (lower.includes("2br") || lower.includes("2 br") || lower.includes("2 bedrooms")) suggested.push("Bedrooms: 2");
      if (lower.includes("wifi")) suggested.push("Amenity: wifi");
      if (lower.includes("cebu")) suggested.push("City: Cebu City");
      const reply = suggested.length > 0
        ? `Try filtering: ${suggested.join(", ")}`
        : "Try keywords like '1BR', 'wifi', 'Cebu City', 'parking'";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    }, 500);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-100 to-sky-100 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-medium">
            <span>Tenant • Browse</span>
          </div>
          <h1 className="mt-3 text-2xl md:text-3xl font-bold text-gray-900">Browse Properties</h1>
          <p className="text-sm text-gray-600 mt-1">Find available units across the city</p>
        </div>

        <Link to="/tenant">
          <Button variant="outline" className="gap-2">
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Sticky Search and Filters */}
      <div className={`sticky top-0 z-40 transition-all duration-300 ${isScrolled ? 'py-1' : 'py-0'}`}>
        <Card className={`bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-sm transition-all duration-300 ${isScrolled ? 'p-2 md:p-3' : 'p-3 md:p-4'}`}>
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 items-stretch">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
              <input
                value={query}
                onChange={(e) => { setPage(1); setQuery(e.target.value); }}
                placeholder="Search by unit, property, or address..."
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
            <Button onClick={executeSearch} className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700 text-sm">
              Search
            </Button>
            <Button 
              variant="outline" 
              className="md:hidden px-3 py-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className={`flex-col md:grid md:grid-cols-2 gap-2 ${showFilters ? 'flex' : 'hidden md:grid'}`}>
            <div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
                <input
                  value={locationQuery}
                  onChange={(e) => {
                    setLocationQuery(e.target.value);
                    setShowLocationSuggestions(e.target.value.trim().length > 0);
                  }}
                  onFocus={() => setShowLocationSuggestions(locationQuery.trim().length > 0)}
                  onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                  placeholder="Search locations (e.g., Cebu City, Mandaue)"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
                {showLocationSuggestions && filteredLocations.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
                    {filteredLocations.map((loc) => (
                      <button
                        key={loc}
                        onClick={() => {
                          setLocationQuery(loc);
                          setLocation(loc);
                          setShowLocationSuggestions(false);
                          setPage(1);
                        }}
                        className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {location !== "ALL" && (
                <div className="mt-1.5">
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                    {location}
                    <button
                      onClick={() => {
                        setLocation("ALL");
                        setLocationQuery("");
                      }}
                      className="ml-1 hover:text-emerald-900"
                    >
                      ×
                    </button>
                  </span>
                </div>
              )}
            </div>

            <div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
                <input
                  value={amenityQuery}
                  onChange={(e) => {
                    setAmenityQuery(e.target.value);
                    setShowAmenitySuggestions(e.target.value.trim().length > 0);
                  }}
                  onFocus={() => setShowAmenitySuggestions(amenityQuery.trim().length > 0)}
                  onBlur={() => setTimeout(() => setShowAmenitySuggestions(false), 200)}
                  placeholder="Search amenities (e.g., Air Conditioning, Parking)"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
                {showAmenitySuggestions && filteredAmenities.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
                    {filteredAmenities.map((amenity) => (
                      <button
                        key={amenity.id}
                        onClick={() => {
                          setAmenityQuery("");
                          toggleAmenity(amenity.name);
                          setShowAmenitySuggestions(false);
                        }}
                        className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        {amenity.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedAmenities.size > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {Array.from(selectedAmenities).map((amenity) => (
                    <span key={amenity} className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                      {amenity}
                      <button
                        onClick={() => toggleAmenity(amenity)}
                        className="ml-1 hover:text-emerald-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <Button 
              variant="outline" 
              onClick={() => { setQuery(""); setLocation("ALL"); setLocationQuery(""); setSelectedAmenities(new Set()); setAmenityQuery(""); setPage(1); setAppliedQuery(""); setAppliedLocation("ALL"); setAppliedAmenities(new Set()); }}
              className="gap-1 text-xs px-3 py-1.5"
            >
              Reset Filters
            </Button>
            {/* Category Tabs */}
            <div className="flex items-center gap-1.5">
              {[
                { key: "NEWLY_LISTED", label: "Newly Listed" },
                { key: "MOST_VIEWED", label: "Most Viewed" },
                { key: "TOP_RATED", label: "Top Rated" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => { setActiveCategory(tab.key as any); setPage(1); }}
                  className={`px-2.5 py-1 rounded-full text-xs border transition ${activeCategory === tab.key ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>
      </div>

      {/* Results header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-sm text-gray-600">
          Showing <span className="font-medium">{current.length}</span> of <span className="font-medium">{filteredUnits.length}</span> units
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Page</span>
          <span className="font-medium">{page}</span>
          <span>of</span>
          <span className="font-medium">{totalPages}</span>
        </div>
      </div>

      {/* Units grid */}
      {current.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {current.map((unit) => {
              const averageRating = unit.reviews.length > 0 
                ? unit.reviews.reduce((sum, r) => sum + r.rating, 0) / unit.reviews.length 
                : 0;
              
              return (
                <Card key={unit.id} className="overflow-hidden border border-gray-200 transition-all duration-300 hover:shadow-md">
                  <div className="relative aspect-square bg-gray-100">
                    {unit.mainImageUrl ? (
                      <img src={unit.mainImageUrl} alt={unit.label} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-emerald-100 to-sky-100 flex items-center justify-center">
                      <Home className="h-8 w-8 text-emerald-400" />
                    </div>
                  )}
                    {/* View count badge */}
                    <div className="absolute top-2 left-2 bg-black/70 text-white px-1.5 py-0.5 rounded-md text-xs flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {unit.viewCount}
                    </div>
                    {/* Status badge */}
                    <div className={`absolute top-2 right-2 text-xs px-1.5 py-0.5 rounded-md font-medium ${
                      unit.status === "AVAILABLE" ? "bg-emerald-100 text-emerald-800" :
                      unit.status === "OCCUPIED" ? "bg-blue-100 text-blue-800" :
                      "bg-amber-100 text-amber-800"
                    }`}>
                      {unit.status}
                    </div>
                </div>
                  <div className="p-3">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{unit.label}</h3>
                      <span className="text-emerald-700 font-semibold text-sm">₱{unit.targetPrice.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="line-clamp-1">{unit.property.city?.name || unit.property.municipality?.name}</span>
                    </div>

                    {averageRating > 0 && (
                      <div className="flex items-center gap-1 mb-2">
                        <StarRating rating={averageRating} size={3} showNumber={true} />
                        <span className="text-xs text-gray-500">({unit.reviews.length})</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-1 text-xs text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <BedDouble className="h-3 w-3" />
                        <span>{unit.maxOccupancy} max</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Maximize className="h-3 w-3" />
                        <span>{unit.property.type.replace('_', ' ')}</span>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {unit.amenities.slice(0, 2).map((a) => (
                        <span key={a.id} className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-50 border border-gray-200 text-gray-700">
                          {a.name}
                        </span>
                      ))}
                      {unit.amenities.length > 2 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-50 border border-gray-200 text-gray-700">
                          +{unit.amenities.length - 2}
                        </span>
                      )}
                    </div>

                    <Button variant="outline" size="sm" className="w-full mt-2 text-xs">View Details</Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredUnits.length)} of {filteredUnits.length} units
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => goToPage(page - 1)} disabled={page === 1} className="gap-1">
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (page <= 3) pageNum = i + 1;
                    else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = page - 2 + i;
                    return (
                      <Button key={pageNum} variant={page === pageNum ? "default" : "outline"} size="sm" className={`h-9 w-9 p-0 ${page === pageNum ? 'bg-gradient-to-r from-emerald-600 to-sky-600' : ''}`} onClick={() => goToPage(pageNum)}>
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button variant="outline" size="sm" onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="gap-1">
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <Card className="p-10 text-center border border-dashed border-gray-300 bg-gradient-to-br from-emerald-50/50 to-sky-50/50">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-emerald-100 to-sky-100 flex items-center justify-center mb-4">
            <Home className="h-8 w-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No units found</h3>
          <p className="text-gray-600 mt-1 max-w-md mx-auto">
            Try adjusting your search or filters.
          </p>
        </Card>
      )}

      {/* AI Chatbot widget */}
      <div className="fixed bottom-4 right-4 z-50">
        {chatOpen ? (
          <Card className="w-80 max-w-[calc(100vw-2rem)] shadow-2xl rounded-xl overflow-hidden">
            <div className="p-3 bg-gradient-to-r from-emerald-600 to-sky-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold">
                <MessageCircle className="h-4 w-4" /> Ask AI • Helper
              </div>
              <button className="text-white/90 hover:text-white text-sm" onClick={() => setChatOpen(false)}>Close</button>
            </div>
            <div className="p-3 border-b border-gray-200">
              <div className="flex flex-wrap gap-2">
                {['Studios under 10k', '2BR with wifi', 'Near Cebu City', 'Parking + AC'].map((s) => (
                  <button key={s} onClick={() => { setChatInput(s); setTimeout(() => sendChat(), 0); }} className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100">
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-3 h-72 overflow-y-auto space-y-2 bg-white">
              {messages.map((m, idx) => (
                <div key={idx} className={`${m.role === 'assistant' ? 'bg-gray-50' : 'bg-emerald-50'} p-2 rounded-md text-sm text-gray-800`}>
                  {m.content}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 border-t border-gray-200 flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') sendChat(); }}
                placeholder="Ask for wifi 2BR in Cebu..."
                className="flex-1 px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
              <Button size="sm" onClick={sendChat}>Send</Button>
            </div>
          </Card>
        ) : (
          <Button onClick={() => setChatOpen(true)} className="gap-2 bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700 shadow-lg">
            <MessageCircle className="h-4 w-4" />
            Ask AI
          </Button>
        )}
      </div>
    </div>
  );
};

export default BrowseProperties;