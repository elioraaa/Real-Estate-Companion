import { BadGatewayException, Injectable } from '@nestjs/common';
import { EstimateRequest, EstimateResponse } from './estimate.types';

type MlPredictResponse = {
  estimate?: number;
  low?: number;
  high?: number;
};

@Injectable()
export class EstimateService {
  private readonly mlBaseUrl = process.env.ML_API_BASE_URL || 'http://127.0.0.1:5001';

  async estimate(input: EstimateRequest): Promise<EstimateResponse> {
    const payloadForMl = {
      main_property_property_square: Number(input.size) || 0,
      main_property_property_composition_bedrooms: Number(input.rooms) || 0,
      main_property_property_composition_bathrooms: Number(input.bathrooms) || 1,
      main_property_property_composition_living_rooms: 1,
      main_property_floor: Number(input.floor) || 2,
      main_property_has_elevator: input.hasElevator ?? true,
      main_property_has_parking_space: input.hasParking ?? false,
      main_property_has_garage: input.hasGarage ?? false,
      main_property_has_terrace: input.hasTerrace ?? false,
      lat: Number(input.lat) || 41.32795,
      lng: Number(input.lng) || 19.81902,
    };

    try {
      const res = await fetch(`${this.mlBaseUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadForMl),
      });

      if (!res.ok) {
        throw new BadGatewayException('ML API returned an error.');
      }

      const data = (await res.json()) as MlPredictResponse;
      const estimatedPrice = Math.round(Number(data.estimate) || 0);
      if (!estimatedPrice) {
        throw new BadGatewayException('ML API response is missing estimate.');
      }

      const low = Number(data.low) || estimatedPrice * 0.9;
      const high = Number(data.high) || estimatedPrice * 1.1;
      const spread = Math.max(0, high - low);
      const confidence = Math.max(0.5, Math.min(0.95, 1 - spread / (estimatedPrice * 2)));

      return {
        estimatedPrice,
        low: Math.round(low),
        high: Math.round(high),
        confidence: Number(confidence.toFixed(2)),
        explanation: `Estimated by ML model using size/rooms and Tirana location features.`,
      };
    } catch {
      const basePrice = Number(input.price) || 0;
      const sizeFactor = (Number(input.size) || 0) * 1.2;
      const roomsFactor = (Number(input.rooms) || 0) * 35;
      const locationFactor = (input.location || '').length * 2;
      const estimatedPrice = Math.round(basePrice + sizeFactor + roomsFactor + locationFactor);
      return {
        estimatedPrice,
        low: Math.round(estimatedPrice * 0.9),
        high: Math.round(estimatedPrice * 1.1),
        confidence: 0.58,
        explanation: 'Fallback estimate used because ML API is unavailable.',
      };
    }
  }
}
