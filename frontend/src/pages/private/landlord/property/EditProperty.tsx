import React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  MapPin,
  Image as ImageIcon,
  Home,
  Building,
  Upload,
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getPropertyDetailsRequest,
  getCitiesAndMunicipalitiesRequest,
  updatePropertyRequest,
} from "@/api/landlordPropertyApi";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

// Types
type Option = { id: string; name: string };
type Institution = { name: string; type: string };

const PROPERTY_TYPES = [
  { value: "APARTMENT", label: "Apartment" },
  { value: "CONDOMINIUM", label: "Condominium" },
  { value: "BOARDING_HOUSE", label: "Boarding House" },
  { value: "SINGLE_HOUSE", label: "Single House" },
];

// SearchSelect Component
function SearchSelect({
  label,
  placeholder,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  placeholder: string;
  value: Option | null;
  onChange: (option: Option | null) => void;
  options: Option[];
  disabled?: boolean;
}) {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return !q
      ? options
      : options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, query]);

  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  // Handle click outside to close dropdown
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [open]);

  // Handle escape key to close dropdown
  React.useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [open]);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground/80">{label}</label>
      <div className="relative" ref={containerRef}>
        <button
          type="button"
          disabled={disabled}
          className="w-full h-10 px-3 rounded-md border text-left text-sm bg-background focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none disabled:opacity-60"
          onClick={() => setOpen((p) => !p)}
        >
          {value ? (
            value.name
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </button>
        {open && !disabled && (
          <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
            <div className="p-2 border-b">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="w-full h-9 px-2 text-sm rounded-md bg-background outline-none border"
              />
            </div>
            <ul className="max-h-56 overflow-auto py-1">
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-sm text-muted-foreground">
                  {options.length === 0 ? "No data available" : "No results found"}
                </li>
              )}
              {filtered.map((opt) => (
                <li key={opt.id}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                    onClick={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                  >
                    {opt.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {value && !disabled && (
        <button
          type="button"
          className="self-start text-xs text-muted-foreground hover:underline"
          onClick={() => onChange(null)}
        >
          Clear
        </button>
      )}
    </div>
  );
}

// InstitutionForm Component
function InstitutionForm({
  institution,
  onChange,
  onRemove,
  index,
}: {
  institution: Institution;
  onChange: (inst: Institution) => void;
  onRemove: () => void;
  index: number;
}) {
  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1">
        <label className="text-sm font-medium text-gray-700 block mb-2">
          Institution Name
        </label>
        <input
          type="text"
          placeholder="e.g., University of the Philippines"
          value={institution.name}
          onChange={(e) =>
            onChange({ ...institution, name: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>
      <div className="flex-1">
        <label className="text-sm font-medium text-gray-700 block mb-2">
          Type
        </label>
        <select
          value={institution.type}
          onChange={(e) =>
            onChange({ ...institution, type: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          <option value="">Select type</option>
          <option value="University">University</option>
          <option value="School">School</option>
          <option value="Hospital">Hospital</option>
          <option value="Mall">Mall</option>
          <option value="Office">Office</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRemove}
        className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
      >
        Remove
      </Button>
    </div>
  );
}

export default function EditProperty() {
  const { propertyId } = useParams();
  const STEPS = [
    "Basics",
    "Address",
    "Nearby Institutions",
    "Location",
    "Media",
  ] as const;
  const [step, setStep] = React.useState<number>(0);
  const navigate = useNavigate();

  // Form state
  const [title, setTitle] = React.useState("");
  const [type, setType] = React.useState(PROPERTY_TYPES[0].value);
  const [street, setStreet] = React.useState("");
  const [barangay, setBarangay] = React.useState("");
  const [zipCode, setZipCode] = React.useState("");
  const [city, setCity] = React.useState<Option | null>(null);
  const [municipality, setMunicipality] = React.useState<Option | null>(null);
  const [localityMode, setLocalityMode] = React.useState<
    "city" | "municipality" | null
  >(null);
  const [latitude, setLatitude] = React.useState<string>("");
  const [longitude, setLongitude] = React.useState<string>("");
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imageError, setImageError] = React.useState<string>("");
  const [imagePreview, setImagePreview] = React.useState<string>("");
  const [nearInstitutions, setNearInstitutions] = React.useState<Institution[]>(
    []
  );

  // API data state
  const [cities, setCities] = React.useState<Option[]>([]);
  const [municipalities, setMunicipalities] = React.useState<Option[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [shouldSubmit, setShouldSubmit] = React.useState(false);

  const maxBytes = 5 * 1024 * 1024; // 5MB

  // Fetch cities and municipalities
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getCitiesAndMunicipalitiesRequest();
        setCities(res.data.cities);
        setMunicipalities(res.data.municipalities);
      } catch (err: any) {
        console.error("Error fetching cities/municipalities:", err);
        setError("Failed to load cities and municipalities");
      }
    };

    fetchData();
  }, []);

  // Fetch property details
  React.useEffect(() => {
    if (!propertyId) {
      setError("Invalid property ID");
      setLoading(false);
      return;
    }

    const fetchProperty = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getPropertyDetailsRequest(propertyId);
        const property = res.data;
        
        // Populate form with existing data
        setTitle(property.title);
        setType(property.type);
        setStreet(property.street);
        setBarangay(property.barangay);
        setZipCode(property.zipCode || "");
        setLatitude(property.latitude?.toString() || "");
        setLongitude(property.longitude?.toString() || "");
        
        // Set city or municipality
        if (property.city) {
          setCity(property.city);
          setLocalityMode("city");
        } else if (property.municipality) {
          setMunicipality(property.municipality);
          setLocalityMode("municipality");
        }
        
        // Set existing image
        if (property.mainImageUrl) {
          setImagePreview(property.mainImageUrl);
        }
        
        // Parse near institutions
        if (property.nearInstitutions) {
          try {
            const institutions = JSON.parse(property.nearInstitutions);
            setNearInstitutions(Array.isArray(institutions) ? institutions : []);
          } catch (e) {
            setNearInstitutions([]);
          }
        }
        
      } catch (err: any) {
        console.error("Error fetching property:", err);
        setError(err.response?.data?.message || "Failed to load property details");
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId]);

  const handleImageChange = (file: File | null) => {
    if (!file) {
      setImageFile(null);
      setImagePreview("");
      setImageError("");
      return;
    }

    if (file.size > maxBytes) {
      setImageError("File size must be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setImageError("Please select an image file");
      return;
    }

    setImageFile(file);
    setImageError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const addInstitution = () => {
    setNearInstitutions([...nearInstitutions, { name: "", type: "" }]);
  };

  const updateInstitution = (index: number, institution: Institution) => {
    const updated = [...nearInstitutions];
    updated[index] = institution;
    setNearInstitutions(updated);
  };

  const removeInstitution = (index: number) => {
    setNearInstitutions(nearInstitutions.filter((_, i) => i !== index));
  };

  const nextStep = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const validInstitutions = nearInstitutions.filter(
    (inst) => inst.name.trim() && inst.type.trim()
  );

  const uploadMainImage = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const randomName = crypto.randomUUID();
    const path = `property_main_images/${randomName}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("rentease-images")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadError) throw new Error(uploadError.message);

    const { data } = supabase.storage
      .from("rentease-images")
      .getPublicUrl(path);
    return data.publicUrl;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Only submit on the last step and when explicitly called
    if (step !== STEPS.length - 1) {
      console.log("Form submission prevented - not on last step");
      return;
    }

    // Only submit when explicitly intended
    if (!shouldSubmit) {
      console.log("Form submission prevented - not explicitly triggered");
      return;
    }

    // Prevent double submission
    if (isSubmitting) {
      console.log("Form submission prevented - already submitting");
      return;
    }

    setIsSubmitting(true);

    try {
      let mainImageUrl = imagePreview; // Use existing image URL if no new file

      // Upload new image if one was selected
      if (imageFile) {
        mainImageUrl = await uploadMainImage(imageFile);
      }

      // Build payload
      const payload = {
        title: title.trim(),
        type: type as
          | "APARTMENT"
          | "CONDOMINIUM"
          | "BOARDING_HOUSE"
          | "SINGLE_HOUSE",
        street: street.trim(),
        barangay: barangay.trim(),
        zipCode: zipCode.trim() || undefined,
        cityId: city?.id ?? undefined,
        municipalityId: municipality?.id ?? undefined,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        mainImageUrl,
        nearInstitutions:
          validInstitutions.length > 0 ? validInstitutions : undefined,
      };

      // Call update API
      const res = await updatePropertyRequest(propertyId!, payload);
      const { message } = res.data;

      toast.success(message);

      // Navigate back to property page
      navigate(`/landlord/properties/${propertyId}?tab=overview`);
    } catch (err: any) {
      console.error("Submit failed:", err);
      toast.error(err.response?.data?.message || "Failed to update property");
    } finally {
      setIsSubmitting(false);
      setShouldSubmit(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
          >
            ← Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Edit Property</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading property details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
          >
            ← Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Edit Property</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
        >
          ← Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Property</h1>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {STEPS.map((stepName, index) => (
          <div key={stepName} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index <= step
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {index < step ? "✓" : index + 1}
            </div>
            <span
              className={`ml-2 text-sm font-medium ${
                index <= step ? "text-emerald-600" : "text-gray-500"
              }`}
            >
              {stepName}
            </span>
            {index < STEPS.length - 1 && (
              <div
                className={`w-12 h-0.5 mx-4 ${
                  index < step ? "bg-emerald-600" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {step === 0 && <FileText className="h-5 w-5" />}
              {step === 1 && <MapPin className="h-5 w-5" />}
              {step === 2 && <Building className="h-5 w-5" />}
              {step === 3 && <MapPin className="h-5 w-5" />}
              {step === 4 && <ImageIcon className="h-5 w-5" />}
              {STEPS[step]}
            </CardTitle>
            <CardDescription>
              {step === 0 && "Basic information about your property"}
              {step === 1 && "Property address and location details"}
              {step === 2 && "Nearby institutions and landmarks"}
              {step === 3 && "Map coordinates for precise location"}
              {step === 4 && "Upload property images"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basics */}
              {step === 0 && (
                <>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Property Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Modern Apartment Complex"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Property Type *
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      required
                    >
                      {PROPERTY_TYPES.map((pt) => (
                        <option key={pt.value} value={pt.value}>
                          {pt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Address */}
              {step === 1 && (
                <>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 123 Main Street"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Barangay *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Barangay Name"
                      value={barangay}
                      onChange={(e) => setBarangay(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 1000"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex gap-4 mb-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="locality"
                          checked={localityMode === "city"}
                          onChange={() => {
                            setLocalityMode("city");
                            setMunicipality(null);
                          }}
                          className="mr-2"
                        />
                        City
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="locality"
                          checked={localityMode === "municipality"}
                          onChange={() => {
                            setLocalityMode("municipality");
                            setCity(null);
                          }}
                          className="mr-2"
                        />
                        Municipality
                      </label>
                    </div>
                    {localityMode === "city" && (
                      <SearchSelect
                        label="City *"
                        placeholder="Search for a city"
                        value={city}
                        onChange={setCity}
                        options={cities}
                      />
                    )}
                    {localityMode === "municipality" && (
                      <SearchSelect
                        label="Municipality *"
                        placeholder="Search for a municipality"
                        value={municipality}
                        onChange={setMunicipality}
                        options={municipalities}
                      />
                    )}
                  </div>
                </>
              )}

              {/* Nearby Institutions */}
              {step === 2 && (
                <>
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Nearby Institutions
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addInstitution}
                      >
                        Add Institution
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {nearInstitutions.map((institution, index) => (
                        <InstitutionForm
                          key={index}
                          institution={institution}
                          onChange={(inst) => updateInstitution(index, inst)}
                          onRemove={() => removeInstitution(index)}
                          index={index}
                        />
                      ))}
                      {nearInstitutions.length === 0 && (
                        <p className="text-gray-500 text-center py-8">
                          No institutions added yet. Click "Add Institution" to get started.
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Location */}
              {step === 3 && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g., 14.5995"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g., 120.9842"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">
                      You can find coordinates using Google Maps. Right-click on a location and select "What's here?" to get the coordinates.
                    </p>
                  </div>
                </>
              )}

              {/* Media */}
              {step === 4 && (
                <>
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-700">
                        Main Image (≤ 5MB, optional)
                      </label>
                      <p className="text-xs text-gray-500 mb-3">
                        This will be the primary image displayed for your property listing.
                      </p>
                      
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleImageChange(e.target.files?.[0] ?? null)
                        }
                        className="hidden"
                        id="property-main-image"
                      />
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('property-main-image')?.click()}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose Main Image
                      </Button>
                      
                      {imageError && (
                        <p className="text-xs text-destructive">
                          {imageError}
                        </p>
                      )}
                      {imagePreview && (
                        <div className="mt-3">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="h-40 w-full rounded-md border object-cover"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview("");
                              setImageError("");
                              const input = document.getElementById('property-main-image') as HTMLInputElement;
                              if (input) input.value = '';
                            }}
                            className="mt-2 w-full"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Remove Image
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="text-sm text-gray-600">
                        Upload a featured image for your property listing.
                        This will be stored as a URL in the database.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-3 pt-6 md:pt-8">
              <Button
                type="button"
                variant="outline"
                onClick={
                  step === 0
                    ? () => navigate(-1)
                    : prevStep
                }
              >
                {step === 0 ? "Cancel" : "Previous"}
              </Button>
              {step < STEPS.length - 1 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => {
                    setShouldSubmit(true);
                    // Trigger form submission
                    const form = document.querySelector('form');
                    if (form) {
                      form.requestSubmit();
                    }
                  }}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Updating..." : "Update Property"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
