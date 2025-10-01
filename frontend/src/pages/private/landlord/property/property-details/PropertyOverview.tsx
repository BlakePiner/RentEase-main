import { Building, Home, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Property } from "@/types/propertyType";

// Helper functions
const parseNearInstitutions = (nearInstitutions: string | null): Array<{name: string; type: string}> => {
  if (!nearInstitutions) return [];
  try {
    return JSON.parse(nearInstitutions);
  } catch (error) {
    console.error("Error parsing nearInstitutions:", error);
    return [];
  }
};

const formatAddress = (property: Property): string => {
  const locality = property.city?.name || property.municipality?.name || "";
  const segments = [property.street, property.barangay, locality, property.zipCode].filter(Boolean);
  return segments.join(", ");
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getPropertyTypeIcon = (type: string) => {
  switch (type) {
    case "APARTMENT":
    case "CONDOMINIUM":
      return <Building className="h-4 w-4" />;
    default:
      return <Home className="h-4 w-4" />;
  }
};

// Google Maps Component
const PropertyMap = ({ latitude, longitude, title }: { latitude?: number | null; longitude?: number | null; title: string }) => {
  if (!latitude || !longitude) {
    return null;
  }

  const mapUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;

  return (
    <div className="h-full bg-gray-100 rounded-lg overflow-hidden">
      <iframe
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
        marginHeight={0}
        marginWidth={0}
        src={mapUrl}
        title={`Location of ${title}`}
        className="border-0"
      />
    </div>
  );
};

// Property Overview Component
const PropertyOverview = ({ 
  property, 
  onEdit, 
  onDelete 
}: { 
  property: Property;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const nearInstitutions = parseNearInstitutions(property.nearInstitutions || null);
  const hasMap = property.latitude && property.longitude;
  
  return (
    <div className="space-y-6">
      <Card className="p-0 overflow-hidden">
        <div className="p-6 md:p-8">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-sky-600 text-white px-3 py-1 rounded-full text-sm font-medium mb-2">
                {getPropertyTypeIcon(property.type)}
                <span>{property.type.replaceAll("_", " ")}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{property.title}</h1>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button 
                onClick={onEdit}
                className="bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700"
              >
                Edit Property
              </Button>
              <Button 
                onClick={onDelete}
                variant="outline" 
                className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
              >
                Delete Property
              </Button>
            </div>
          </div>

          {/* Image and Map Section */}
          <div className={`grid gap-6 mb-8 ${hasMap ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
            <PropertyImage property={property} />
            {hasMap ? (
              <PropertyMapSection property={property} />
            ) : (
              <NoMapSection property={property} />
            )}
          </div>

          {/* Content Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <LeftColumn property={property} nearInstitutions={nearInstitutions} />
            <RightColumn property={property} />
          </div>
        </div>
      </Card>
    </div>
  );
};

// Sub-components for PropertyOverview
const PropertyImage = ({ property }: { property: Property }) => (
  <Card className="overflow-hidden border-0 shadow-sm">
    <div className="h-64 bg-gray-100">
      {property.mainImageUrl ? (
        <img 
          src={property.mainImageUrl} 
          alt={property.title} 
          className="h-full w-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.nextElementSibling?.classList.remove('hidden');
          }}
        />
      ) : null}
      <div className={`h-full w-full bg-gradient-to-br from-emerald-100 to-sky-100 flex items-center justify-center ${property.mainImageUrl ? 'hidden' : ''}`}>
        <Home className="h-12 w-12 text-emerald-400" />
      </div>
    </div>
  </Card>
);

const PropertyMapSection = ({ property }: { property: Property }) => (
  <Card className="border-0 shadow-sm overflow-hidden">
    <div className="h-64">
      <PropertyMap 
        latitude={property.latitude} 
        longitude={property.longitude} 
        title={property.title}
      />
    </div>
  </Card>
);

const NoMapSection = ({ property }: { property: Property }) => (
  <Card className="border-0 shadow-sm p-6 bg-gradient-to-br from-gray-50 to-white">
    <div className="h-64 flex flex-col justify-center items-center text-center">
      <MapPin className="h-12 w-12 text-gray-300 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Location Information</h3>
      <p className="text-gray-600 mb-4">No map coordinates available for this property</p>
      <div className="flex items-center gap-3 text-gray-700">
        <MapPin className="h-5 w-5 text-gray-500" />
        <div className="text-left">
          <p className="font-medium text-gray-900">Address</p>
          <p className="text-sm text-gray-600">{formatAddress(property)}</p>
        </div>
      </div>
    </div>
  </Card>
);

const LeftColumn = ({ property, nearInstitutions }: { property: Property; nearInstitutions: Array<{name: string; type: string}> }) => (
  <div className="space-y-8">
    <BasicInfoSection property={property} />
    {nearInstitutions.length > 0 && <NearbyInstitutionsSection nearInstitutions={nearInstitutions} />}
  </div>
);



const BasicInfoSection = ({ property }: { property: Property }) => (
  <div>
    <h3 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h3>
    <div className="space-y-4">
      <InfoRow label="Property ID" value={property.id} isCode />
      <InfoRow label="Type" value={property.type.replaceAll("_", " ")} />
      <InfoRow label="Created" value={formatDate(property.createdAt)} />
      <InfoRow label="Last Updated" value={formatDate(property.updatedAt)} />
    </div>
  </div>
);

const InfoRow = ({ label, value, isCode = false }: { label: string; value: string; isCode?: boolean }) => (
  <div className="flex justify-between py-3 border-b border-gray-100">
    <span className="text-gray-600 font-medium">{label}</span>
    <span className={`font-medium ${isCode ? 'font-mono text-sm' : ''}`}>{value}</span>
  </div>
);

const NearbyInstitutionsSection = ({ nearInstitutions }: { nearInstitutions: Array<{name: string; type: string}> }) => (
  <div>
    <h3 className="text-xl font-semibold text-gray-900 mb-4">Nearby Institutions</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {nearInstitutions.map((inst, index) => (
        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
          <span className="font-medium text-gray-900">{inst.name}</span>
          <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
            {inst.type}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const RightColumn = ({ property }: { property: Property }) => (
  <div className="space-y-8">
    <UnitsSummarySection property={property} />
    <LocationDetailsSection property={property} />
  </div>
);

const UnitsSummarySection = ({ property }: { property: Property }) => {
  const totalUnits = property.unitsSummary?.total || property.Unit?.length || 0;
  const availableUnits = property.unitsSummary?.available || property.Unit?.filter(u => u.status === "AVAILABLE").length || 0;
  const occupiedUnits = property.unitsSummary?.occupied || property.Unit?.filter(u => u.status === "OCCUPIED").length || 0;
  const maintenanceUnits = property.unitsSummary?.maintenance || property.Unit?.filter(u => u.status === "MAINTENANCE").length || 0;

  return (
    <Card className="p-6 bg-gradient-to-br from-gray-50 to-white border border-gray-100">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Units Summary</h3>
      <div className="space-y-4">
        <SummaryRow label="Total Units" value={totalUnits} />
        <SummaryRow label="Listed Units" value={property.unitsSummary?.listed || 0} />
        <SummaryRow label="Available Units" value={availableUnits} isHighlighted color="emerald" />
        <SummaryRow label="Occupied Units" value={occupiedUnits} color="blue" />
        <SummaryRow label="Under Maintenance" value={maintenanceUnits} color="amber" />
      </div>
    </Card>
  );
};

const SummaryRow = ({ label, value, isHighlighted = false, color = "gray" }: { 
  label: string; 
  value: number; 
  isHighlighted?: boolean;
  color?: "emerald" | "blue" | "amber" | "gray";
}) => {
  const colorClasses = {
    emerald: "text-emerald-600",
    blue: "text-blue-600",
    amber: "text-amber-600",
    gray: "text-gray-900"
  };

  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-gray-700">{label}</span>
      <span className={`font-semibold text-lg ${colorClasses[color]} ${isHighlighted ? 'font-bold' : ''}`}>
        {value}
      </span>
    </div>
  );
};

const LocationDetailsSection = ({ property }: { property: Property }) => (
  <Card className="p-6 bg-gradient-to-br from-gray-50 to-white border border-gray-100">
    <h3 className="text-xl font-semibold text-gray-900 mb-4">Location Details</h3>
    <div className="space-y-3">
      <LocationDetailItem 
        icon={<MapPin className="h-5 w-5 text-gray-500" />}
        title="Full Address"
        content={formatAddress(property)}
      />
      {property.latitude && property.longitude && (
        <LocationDetailItem 
          icon={<MapPin className="h-5 w-5 text-gray-500" />}
          title="Coordinates"
          content={`${property.latitude.toFixed(6)}, ${property.longitude.toFixed(6)}`}
          isCode
        />
      )}
    </div>
  </Card>
);

const LocationDetailItem = ({ icon, title, content, isCode = false }: { 
  icon: React.ReactNode; 
  title: string; 
  content: string;
  isCode?: boolean;
}) => (
  <div className="flex items-start gap-3">
    {icon}
    <div>
      <p className="font-medium text-gray-900 mb-1">{title}</p>
      <p className={`text-gray-600 ${isCode ? 'font-mono text-sm' : ''}`}>{content}</p>
    </div>
  </div>
);

export default PropertyOverview;