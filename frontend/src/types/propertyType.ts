import type { Unit } from "./unitType";

export type Property = {
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
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  nearInstitutions?: string | null;
  unitsSummary?: {
    total: number;
    listed: number;
    available: number;
    occupied: number;
    maintenance: number;
  };
  Unit?: Unit[];
};