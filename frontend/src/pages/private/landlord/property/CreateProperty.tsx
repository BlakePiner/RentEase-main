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
import { useNavigate } from "react-router-dom";
import {
  createPropertyRequest,
  getCitiesAndMunicipalitiesRequest,
} from "@/api/landlordPropertyApi";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

type Option = { id: string; name: string };
type Institution = { name: string; type: string };

const PROPERTY_TYPES = [
  { value: "APARTMENT", label: "Apartment" },
  { value: "CONDOMINIUM", label: "Condominium" },
  { value: "BOARDING_HOUSE", label: "Boarding House" },
  { value: "SINGLE_HOUSE", label: "Single House" },
];

const INSTITUTION_TYPES = [
  "Education",
  "Healthcare",
  "Commerce",
  "Government",
  "Finance",
  "Transport",
  "Leisure",
  "Religion",
];

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
  onChange: (opt: Option | null) => void;
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
  const [nameError, setNameError] = React.useState("");

  const handleNameChange = (value: string) => {
    const words = value.trim().split(/\s+/);
    if (words.length > 3) {
      setNameError("Maximum 3 words allowed");
    } else {
      setNameError("");
    }
    onChange({ ...institution, name: value });
  };

  return (
    <div className="flex flex-col md:flex-row gap-3 items-start p-4 border rounded-lg bg-gray-50">
      <div className="flex-1 w-full">
        <label className="text-sm font-medium text-gray-700">
          Institution {index + 1}
        </label>
        <input
          value={institution.name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="e.g., Ayala Mall Cebu"
          className="h-10 w-full px-3 rounded-lg border border-gray-200 bg-white outline-none text-sm mt-1"
        />
        {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
        <p className="text-xs text-gray-500 mt-1">
          Max 3 words (e.g., 'University of Cebu')
        </p>
      </div>
      <div className="flex-1 w-full">
        <label className="text-sm font-medium text-gray-700">Type</label>
        <select
          value={institution.type}
          onChange={(e) => onChange({ ...institution, type: e.target.value })}
          className="h-10 w-full px-3 rounded-lg border border-gray-200 bg-white outline-none text-sm mt-1"
        >
          <option value="">Select type</option>
          {INSTITUTION_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={onRemove}
        className="h-10 mt-6 md:mt-7 w-full md:w-auto"
      >
        Remove
      </Button>
    </div>
  );
}

export default function CreateProperty() {
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

  const maxBytes = 5 * 1024 * 1024; // 5MB

  // Fetch cities and municipalities
  React.useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        const response = await getCitiesAndMunicipalitiesRequest();
        // Assuming the API returns { cities: Option[], municipalities: Option[] }
        setCities(response.data.cities || []);
        setMunicipalities(response.data.municipalities || []);
      } catch (err) {
        setError("Failed to load locations");
        console.error("Error fetching locations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  function handleImageChange(file: File | null) {
    setImageError("");
    setImagePreview("");
    setImageFile(null);
    if (!file) return;
    if (file.size > maxBytes) {
      setImageError("File exceeds 5MB limit");
      return;
    }
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  }

  function addInstitution() {
    if (nearInstitutions.length >= 10) return;
    setNearInstitutions([...nearInstitutions, { name: "", type: "" }]);
  }

  function updateInstitution(index: number, institution: Institution) {
    const updated = [...nearInstitutions];
    updated[index] = institution;
    setNearInstitutions(updated);
  }

  function removeInstitution(index: number) {
    const updated = nearInstitutions.filter((_, i) => i !== index);
    setNearInstitutions(updated);
  }

  // Filter valid institutions (non-empty name and type)
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

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      if (uploadError.message.includes("Bucket not found")) {
        throw new Error("Storage bucket 'rentease-images' not found. Please contact administrator to set up image storage.");
      }
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage
      .from("rentease-images")
      .getPublicUrl(path);
    return data.publicUrl;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (step !== STEPS.length - 1) return;

    try {
      let mainImageUrl: string | undefined = undefined;

      // 1️⃣ Upload image if provided
      if (imageFile) {
        try {
          mainImageUrl = await uploadMainImage(imageFile);
        } catch (uploadError: any) {
          console.error("Image upload failed:", uploadError);
          toast.error(uploadError.message || "Failed to upload image. You can still create the property without an image.");
          // Continue with property creation even if image upload fails
        }
      }

      // 2️⃣ Build payload
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

      // 3️⃣ Call backend API
      const res = await createPropertyRequest(payload);
      const { message, id } = res.data;

      // 4️⃣ Show success toast
      toast.success(message);

      // 5️⃣ Navigate to property page
      navigate(`/landlord/properties/${id}?tab=overview`);
    } catch (err: any) {
      console.error("Submit failed:", err);

      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Something went wrong while creating the property.");
      }
    }
  }

  // Prevent Enter key from submitting form on non-final steps
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && step < STEPS.length - 1) {
      e.preventDefault();
      console.log("Prevented Enter key submission on step:", step);
    }
  };

  const latNum = latitude ? Number(latitude) : null;
  const lngNum = longitude ? Number(longitude) : null;
  const mapSrc =
    latNum !== null &&
    !Number.isNaN(latNum) &&
    lngNum !== null &&
    !Number.isNaN(lngNum)
      ? `https://www.google.com/maps?q=${latNum},${lngNum}&z=16&output=embed`
      : "";

  // Step validations
  const isBasicsValid = title.trim().length > 0 && !!type;
  const hasOneLocality =
    (localityMode === "city" && !!city) ||
    (localityMode === "municipality" && !!municipality);
  const isAddressValid =
    street.trim().length > 0 && barangay.trim().length > 0 && hasOneLocality;
  const coordsBothEmpty = latitude.trim() === "" && longitude.trim() === "";
  const coordsBothFilled = latitude.trim() !== "" && longitude.trim() !== "";
  const coordsAreNumbers =
    coordsBothFilled &&
    !Number.isNaN(Number(latitude)) &&
    !Number.isNaN(Number(longitude));
  const isLocationValid =
    coordsBothEmpty || (coordsBothFilled && coordsAreNumbers);
  // Institutions step is always valid since it's optional

  function nextStep() {
    if (step === 0 && !isBasicsValid) return;
    if (step === 1 && !isAddressValid) return;
    if (step === 3 && !isLocationValid) return; // Location is now step 3
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function prevStep() {
    setStep((s) => Math.max(s - 1, 0));
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-50/60 to-sky-50/40" />
      <div className="mx-auto max-w-5xl p-4 md:p-8">
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-medium">
            <Home className="w-4 h-4" />
            <span>Landlord • Create Property</span>
          </div>
        </div>
        <Card className="rounded-2xl border-gray-100 shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl">Create Property</CardTitle>
            <CardDescription>
              Follow the steps. Choose either City or Municipality. Image ≤ 5MB.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Stepper */}
            <ol className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4 mb-6 md:mb-8">
              {STEPS.map((label, idx) => {
                const active = idx === step;
                const completed = idx < step;
                const Icon =
                  idx === 0
                    ? FileText
                    : idx === 1
                    ? MapPin
                    : idx === 2
                    ? Building
                    : idx === 3
                    ? MapPin
                    : ImageIcon;
                return (
                  <li key={label} className="flex items-center gap-2 md:gap-3">
                    <div
                      className={`relative size-6 md:size-8 grid place-items-center rounded-full border text-xs font-semibold transition-all ${
                        completed
                          ? "bg-gradient-to-r from-emerald-600 to-sky-600 text-white border-transparent"
                          : active
                          ? "bg-white text-emerald-700 border-emerald-200 shadow-sm"
                          : "bg-white text-gray-500 border-gray-200"
                      }`}
                    >
                      {completed ? (
                        <span className="text-xs">✓</span>
                      ) : (
                        <Icon
                          className={`w-3 h-3 md:w-4 md:h-4 ${
                            active ? "text-emerald-600" : "text-gray-500"
                          }`}
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-xs md:text-sm ${
                          active
                            ? "font-semibold text-gray-900"
                            : "text-gray-600"
                        }`}
                      >
                        {label}
                      </div>
                      <div className="hidden md:block text-xs text-gray-500">
                        {idx === 0 && "Title & type"}
                        {idx === 1 && "Address & locality"}
                        {idx === 2 && "Nearby places"}
                        {idx === 3 && "Map coordinates"}
                        {idx === 4 && "Featured image"}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>

            {/* REMOVED FORM TAG - Using div instead to prevent any form submission behavior */}
            <div onKeyDown={handleKeyDown}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Basics */}
                {step === 0 && (
                  <>
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-sm font-medium text-gray-700">
                        Title
                      </label>
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Cozy Apartment near IT Park"
                        className="h-11 px-3 rounded-lg border border-gray-200 bg-white outline-none text-sm focus-visible:ring-[3px] focus-visible:ring-emerald-500/30"
                        required
                      />
                      <p className="text-xs text-gray-500">
                        Short, descriptive title for your listing.
                      </p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">
                        Type
                      </label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="h-11 px-3 rounded-lg border border-gray-200 bg-white outline-none text-sm focus-visible:ring-[3px] focus-visible:ring-emerald-500/30"
                      >
                        {PROPERTY_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* Address */}
                {step === 1 && (
                  <>
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-sm font-medium text-gray-700">
                        Street
                      </label>
                      <input
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="House No., Street Name"
                        className="h-11 px-3 rounded-lg border border-gray-200 bg-white outline-none text-sm focus-visible:ring-[3px] focus-visible:ring-emerald-500/30"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">
                        Barangay
                      </label>
                      <input
                        value={barangay}
                        onChange={(e) => setBarangay(e.target.value)}
                        placeholder="Barangay"
                        className="h-11 px-3 rounded-lg border border-gray-200 bg-white outline-none text-sm focus-visible:ring-[3px] focus-visible:ring-emerald-500/30"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">
                        ZIP Code (optional)
                      </label>
                      <input
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="e.g., 6000"
                        className="h-11 px-3 rounded-lg border border-gray-200 bg-white outline-none text-sm focus-visible:ring-[3px] focus-visible:ring-emerald-500/30"
                        inputMode="numeric"
                        pattern="[0-9]*"
                      />
                    </div>
                    {/* Locality mode toggle */}
                    <div className="md:col-span-2">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Locality Type
                      </div>
                      <div className="inline-flex rounded-lg border border-gray-200 bg-white overflow-hidden">
                        <button
                          type="button"
                          onClick={() => {
                            setLocalityMode("city");
                            setMunicipality(null);
                          }}
                          className={`px-3 md:px-4 py-2 text-sm ${
                            localityMode === "city"
                              ? "bg-emerald-50 text-emerald-700"
                              : "text-gray-600"
                          }`}
                        >
                          City
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setLocalityMode("municipality");
                            setCity(null);
                          }}
                          className={`px-3 md:px-4 py-2 text-sm border-l border-gray-200 ${
                            localityMode === "municipality"
                              ? "bg-emerald-50 text-emerald-700"
                              : "text-gray-600"
                          }`}
                        >
                          Municipality
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Choose locality type, then search below.
                      </p>
                    </div>
                    {localityMode === "city" && (
                      <div className="md:col-span-2">
                        <SearchSelect
                          label="City"
                          placeholder={
                            loading ? "Loading cities..." : "Search city"
                          }
                          value={city}
                          onChange={(opt) => setCity(opt)}
                          options={cities}
                          disabled={loading}
                        />
                        {error && (
                          <p className="text-xs text-red-500 mt-1">{error}</p>
                        )}
                      </div>
                    )}
                    {localityMode === "municipality" && (
                      <div className="md:col-span-2">
                        <SearchSelect
                          label="Municipality"
                          placeholder={
                            loading
                              ? "Loading municipalities..."
                              : "Search municipality"
                          }
                          value={municipality}
                          onChange={(opt) => setMunicipality(opt)}
                          options={municipalities}
                          disabled={loading}
                        />
                        {error && (
                          <p className="text-xs text-red-500 mt-1">{error}</p>
                        )}
                      </div>
                    )}
                    <div className="md:col-span-2 text-xs text-gray-500">
                      Select either a City or a Municipality.
                    </div>
                  </>
                )}

                {/* Nearby Institutions */}
                {step === 2 && (
                  <>
                    <div className="md:col-span-2">
                      <div className="flex flex-col gap-4">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            Nearby Institutions (Optional)
                          </h3>
                          <p className="text-sm text-gray-600">
                            Add nearby institutions to attract more tenants.
                            Maximum 10 institutions, 3 words each.
                          </p>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-sm text-gray-500">
                              Added: {validInstitutions.length} / 10
                            </span>
                            {validInstitutions.length > 0 && (
                              <span className="text-sm text-green-600">
                                {validInstitutions.length} valid institution(s)
                              </span>
                            )}
                          </div>
                        </div>

                        {nearInstitutions.length === 0 ? (
                          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                            <Building className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500">
                              No institutions added yet
                            </p>
                            <p className="text-sm text-gray-400">
                              Add nearby schools, hospitals, malls, etc.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {nearInstitutions.map((institution, index) => (
                              <InstitutionForm
                                key={index}
                                institution={institution}
                                onChange={(inst) =>
                                  updateInstitution(index, inst)
                                }
                                onRemove={() => removeInstitution(index)}
                                index={index}
                              />
                            ))}
                          </div>
                        )}

                        <Button
                          type="button"
                          onClick={addInstitution}
                          variant="outline"
                          className="self-start"
                          disabled={nearInstitutions.length >= 10}
                        >
                          + Add Institution ({nearInstitutions.length}/10)
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {/* Location */}
                {step === 3 && (
                  <>
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-sm font-medium text-gray-700">
                        Latitude (optional)
                      </label>
                      <input
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        placeholder="e.g., 10.3157"
                        className="h-11 px-3 rounded-lg border border-gray-200 bg-white outline-none text-sm focus-visible:ring-[3px] focus-visible:ring-emerald-500/30"
                        inputMode="decimal"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-sm font-medium text-gray-700">
                        Longitude (optional)
                      </label>
                      <input
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        placeholder="e.g., 123.8854"
                        className="h-11 px-3 rounded-lg border border-gray-200 bg-white outline-none text-sm focus-visible:ring-[3px] focus-visible:ring-emerald-500/30"
                        inputMode="decimal"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">
                          Map Preview
                        </label>
                        <div className="aspect-video w-full rounded-md border overflow-hidden bg-muted">
                          {mapSrc ? (
                            <iframe
                              title="map"
                              src={mapSrc}
                              className="w-full h-full border-0"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full grid place-items-center text-sm text-muted-foreground">
                              Enter latitude and longitude to preview map
                            </div>
                          )}
                        </div>
                      </div>
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
                          This will be the primary image displayed for your property listing. You can add an image later if needed.
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
                      ? () => navigate("/landlord/properties")
                      : prevStep
                  }
                  className="w-full md:w-auto"
                >
                  {step === 0 ? "Back to Properties" : "Previous"}
                </Button>
                <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.history.back()}
                    className="w-full md:w-auto mb-2 md:mb-0"
                  >
                    Cancel
                  </Button>
                  {step < STEPS.length - 1 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="bg-gradient-to-r from-emerald-600 to-sky-600 text-white hover:from-emerald-600/90 hover:to-sky-600/90 w-full md:w-auto"
                      disabled={
                        (step === 0 && !isBasicsValid) ||
                        (step === 1 && !isAddressValid) ||
                        (step === 3 && !isLocationValid)
                      }
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      type="button" // Changed to button since we removed form
                      onClick={handleSubmit} // Directly call handleSubmit on click
                      className="bg-gradient-to-r from-emerald-600 to-sky-600 text-white hover:from-emerald-600/90 hover:to-sky-600/90 w-full md:w-auto"
                    >
                      Save Property 
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
