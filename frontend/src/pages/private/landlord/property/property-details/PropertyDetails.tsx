import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Home, Layers, Info } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PropertyUnits from "./PropertyUnits";
import PropertyOverview from "./PropertyOverview";

import {
  getPropertyDetailsRequest,
  deletePropertyRequest,
} from "@/api/landlordPropertyApi";
import type { Property } from "@/types/propertyType";
import UnitListing from "./UnitListing";

// Navigation Component
const PropertyNavigation = ({
  active,
  onChange,
}: {
  active: string;
  onChange: (key: string) => void;
}) => {
  const items = [
    { key: "overview", label: "Property Overview", icon: Info },
    { key: "units", label: "Units", icon: Layers },
    { key: "listing", label: "Listing", icon: Home },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((item) => (
        <Button
          key={item.key}
          variant={active === item.key ? "default" : "outline"}
          className={`gap-2 ${
            active === item.key
              ? "bg-gradient-to-r from-emerald-600 to-sky-600 text-white"
              : ""
          }`}
          onClick={() => onChange(item.key)}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Button>
      ))}
    </div>
  );
};

// Loading Component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
  </div>
);

// Error Component
const ErrorMessage = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) => (
  <Card className="p-8 text-center">
    <div className="text-red-500 mb-4">
      <Home className="h-16 w-16 mx-auto" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      Error Loading Property
    </h3>
    <p className="text-gray-500 mb-4">{message}</p>
    <Button
      onClick={onRetry}
      className="bg-gradient-to-r from-emerald-600 to-sky-600"
    >
      Try Again
    </Button>
  </Card>
);

const PropertyDetails = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState<string>(tabFromUrl);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch property details
  useEffect(() => {
    if (!propertyId) {
      setError("Invalid property ID");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchProperty = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getPropertyDetailsRequest(propertyId, {
          signal: controller.signal,
        });
        setProperty(res.data);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Error fetching property:", err);
          setError(
            err.response?.data?.message || "Failed to load property details"
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
    return () => controller.abort();
  }, [propertyId]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    const next = new URLSearchParams(searchParams);
    next.set("tab", key);
    setSearchParams(next, { replace: true });
  };

  const handleDelete = async () => {
    if (!property?.id) return;
    const confirmed = window.confirm(
      "Are you sure you want to delete this property? This action cannot be undone and will delete all units, reviews, and related data."
    );
    if (!confirmed) return;

    try {
      await deletePropertyRequest(property.id);
      toast.success("Property deleted successfully");
      navigate("/landlord/properties", { replace: true });
    } catch (err: any) {
      console.error("Error deleting property:", err);
      toast.error(err.response?.data?.message || "Failed to delete property");
    }
  };

  const handleEdit = () => {
    if (!propertyId) return;
    navigate(`/landlord/properties/${propertyId}/edit`);
  };

  const handleAddUnit = () => {
    if (!propertyId) return;
    navigate(`/landlord/properties/${propertyId}/units/create`);
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    window.location.reload();
  };

  // Render loading state
  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Home className="h-4 w-4" />
            <span>Landlord</span>
          </div>
          <span className="text-gray-400">*</span>
          <span className="text-gray-900 font-medium">Property Details</span>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  // Render error state
  if (error && !property) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Home className="h-4 w-4" />
            <span>Landlord</span>
          </div>
          <span className="text-gray-400">*</span>
          <span className="text-gray-900 font-medium">Property Details</span>
        </div>
        <ErrorMessage message={error} onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <Home className="h-4 w-4" />
          <span>Landlord</span>
        </div>
        <span className="text-gray-400">*</span>
        <span className="text-gray-900 font-medium">Property Details</span>
      </div>

      {/* Error banner if there was an error but we have property data */}
      {error && property && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-amber-800 text-sm">
              Property loaded with issues: {error}
            </span>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <PropertyNavigation active={activeTab} onChange={handleTabChange} />

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "overview" && property && (
          <PropertyOverview
            property={property}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        {activeTab === "units" && propertyId && (
          <PropertyUnits propertyId={propertyId} onAddUnit={handleAddUnit} />
        )}

        {activeTab === "listing" && (
          <UnitListing />
        )}
      </div>
    </div>
  );
};

export default PropertyDetails;