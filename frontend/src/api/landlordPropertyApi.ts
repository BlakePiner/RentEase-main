import { privateApi } from "./axios";

// ---------------------- Dashboard ----------------------

// Get dashboard statistics
export const getDashboardStatsRequest = (options?: { signal?: AbortSignal }) =>
  privateApi.get("/landlord/dashboard/stats", { signal: options?.signal });

// ---------------------- Property ----------------------

// Get all amenities
export const getAmenitiesRequest = (options?: { signal?: AbortSignal }) =>
  privateApi.get("/landlord/property/amenities", { signal: options?.signal });

// Get all cities/municipalities
export const getCitiesAndMunicipalitiesRequest = (options?: { signal?: AbortSignal }) =>
  privateApi.get("/landlord/property/city-municipality", { signal: options?.signal });

// Create new property
export const createPropertyRequest = (data: any, options?: { signal?: AbortSignal }) =>
  privateApi.post("/landlord/property/create", data, { signal: options?.signal });

// Update property
export const updatePropertyRequest = (propertyId: string, data: any, options?: { signal?: AbortSignal }) =>
  privateApi.put(`/landlord/property/${propertyId}`, data, { signal: options?.signal });

// Delete property
export const deletePropertyRequest = (propertyId: string, options?: { signal?: AbortSignal }) =>
  privateApi.delete(`/landlord/property/${propertyId}`, { signal: options?.signal });

// Delete unit
export const deleteUnitRequest = (propertyId: string, unitId: string, options?: { signal?: AbortSignal }) =>
  privateApi.delete(`/landlord/property/${propertyId}/units/${unitId}`, { signal: options?.signal });

// Get all properties owned by landlord
export const getLandlordPropertiesRequest = (options?: { signal?: AbortSignal }) =>
  privateApi.get("/landlord/property/properties", { signal: options?.signal });

// Get specific property details
export const getPropertyDetailsRequest = (propertyId: string, options?: { signal?: AbortSignal }) =>
  privateApi.get(`/landlord/property/${propertyId}`, { signal: options?.signal });

// Get all units under a property
export const getPropertyUnitsRequest = (propertyId: string, options?: { signal?: AbortSignal }) =>
  privateApi.get(`/landlord/property/${propertyId}/units`, { signal: options?.signal });


// ---------------------- Unit ----------------------

// Get specific unit under a property
export const getUnitDetailsRequest = (
  propertyId: string,
  unitId: string,
  options?: { signal?: AbortSignal }
) =>
  privateApi.get(`/landlord/property/${propertyId}/units/${unitId}`, { signal: options?.signal });

// Create a new unit under a property
export const createUnitRequest = (
  propertyId: string,
  data: any,
  options?: { signal?: AbortSignal }
) =>
  privateApi.post(`/landlord/property/${propertyId}/units`, data, { signal: options?.signal });

// Update a unit
export const updateUnitRequest = (
  propertyId: string,
  unitId: string,
  data: any,
  options?: { signal?: AbortSignal }
) =>
  privateApi.put(`/landlord/property/${propertyId}/units/${unitId}`, data, { signal: options?.signal });


  // Request listing for a unit
export const requestListingRequest = (
  propertyId: string,
  unitId: string,
  data: any, // contains optional notes, revisions, etc.
  options?: { signal?: AbortSignal }
) =>
  privateApi.post(
    `/landlord/property/${propertyId}/units/${unitId}/request-listing`,
    data,
    { signal: options?.signal }
  );


  
// ✅ Get categorized listing status for all units in a property
export const getUnitsListingStatusRequest = (
  propertyId: string,
  options?: { signal?: AbortSignal }
) =>
  privateApi.get(`/landlord/property/${propertyId}/units/listing-status`, {
    signal: options?.signal,
  });