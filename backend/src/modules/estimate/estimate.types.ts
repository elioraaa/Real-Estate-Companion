export type EstimateRequest = {
  id?: string;
  price?: number;
  size: number;
  rooms?: number;
  bathrooms?: number;
  floor?: number;
  location?: string;
  lat?: number;
  lng?: number;
  hasElevator?: boolean;
  hasParking?: boolean;
  hasGarage?: boolean;
  hasTerrace?: boolean;
};

export type EstimateResponse = {
  estimatedPrice: number;
  low: number;
  high: number;
  confidence: number;
  explanation: string;
};
