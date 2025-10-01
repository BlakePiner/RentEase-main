export type Unit = {
  id: string;
  name: string;
  bedrooms: number;
  bathrooms: number;
  floorArea: number;
  targetPrice: number;
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
  imageUrl?: string | null;
  averageRating: number;
  reviewCount: number;
  maxOccupancy: number;
  floorNumber?: number;
  description: string;
};

