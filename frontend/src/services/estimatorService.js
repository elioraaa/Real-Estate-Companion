import { apiFetch } from "./apiClient";

const estimateCache = new Map();
const pendingRequests = new Map();

function getCacheKey(payload) {
  return JSON.stringify({
    id: payload.id,
    price: payload.price,
    size: payload.size,
    rooms: payload.rooms,
    bathrooms: payload.bathrooms,
    floor: payload.floor,
    location: payload.location,
    lat: payload.lat,
    lng: payload.lng,
    hasElevator: payload.hasElevator,
    hasParking: payload.hasParking,
    hasGarage: payload.hasGarage,
    hasTerrace: payload.hasTerrace,
  });
}

function mockEstimate(payload) {
  // TEMP fallback until backend + ML estimation endpoint is live/stable.
  const basePrice = Number(payload.price) || 0;
  const sizeFactor = (Number(payload.size) || 0) * 1.2;
  const roomsFactor = (Number(payload.rooms) || 0) * 35;
  const locationFactor = (payload.location || "").length * 2;

  const estimatedPrice = Math.round(basePrice + sizeFactor + roomsFactor + locationFactor);

  return {
    estimatedPrice,
    low: 0,
    high: 0,
    confidence: 0.58,
    explanation: "MOCK fallback estimate (frontend temporary).",
    source: "mock",
  };
}

const GOOD_DEAL_THRESHOLD = 0.05; // listing must be at least 5% below estimate

export function evaluateDeal(listingPrice, estimatedPrice) {
  const listPrice = Number(listingPrice);
  const estimate = Number(estimatedPrice);

  if (!Number.isFinite(listPrice) || !Number.isFinite(estimate) || estimate <= 0) {
    return {
      isGoodDeal: false,
      diffValue: 0,
      diffPercent: 0,
      savingsPercent: 0,
    };
  }

  const diffValue = listPrice - estimate;
  const diffPercent = (diffValue / estimate) * 100;
  const savingsPercent = Math.abs(diffPercent);

  return {
    isGoodDeal: listPrice <= estimate * (1 - GOOD_DEAL_THRESHOLD),
    diffValue,
    diffPercent,
    savingsPercent,
  };
}

export async function getEstimate(payload) {
  const normalizedPayload = {
    id: payload.id,
    price: payload.price,
    size: payload.size ?? payload.meters ?? 0,
    rooms: payload.rooms ?? 0,
    bathrooms: payload.bathrooms ?? undefined,
    floor: payload.floor ?? undefined,
    location: payload.location ?? "",
    lat: payload.lat ?? undefined,
    lng: payload.lng ?? undefined,
    hasElevator: payload.hasElevator ?? undefined,
    hasParking: payload.hasParking ?? undefined,
    hasGarage: payload.hasGarage ?? undefined,
    hasTerrace: payload.hasTerrace ?? undefined,
  };

  const cacheKey = getCacheKey(normalizedPayload);
  if (estimateCache.has(cacheKey)) return estimateCache.get(cacheKey);
  if (pendingRequests.has(cacheKey)) return pendingRequests.get(cacheKey);

  const request = (async () => {
    try {
      // Backend contract:
      // POST /estimate
      // Request: { size, rooms, location, price, id }
      // Response: { estimatedPrice, confidence, explanation }
      const result = await apiFetch("/estimate", {
        method: "POST",
        body: normalizedPayload,
      });

      const finalResult = {
        estimatedPrice: Number(result?.estimatedPrice) || 0,
        low: Number(result?.low) || 0,
        high: Number(result?.high) || 0,
        confidence: typeof result?.confidence === "number" ? result.confidence : null,
        explanation: result?.explanation || "",
        source: "api",
      };

      estimateCache.set(cacheKey, finalResult);
      return finalResult;
    } catch (error) {
      const fallback = {
        ...mockEstimate(normalizedPayload),
        apiError: error?.message || "Estimator API unavailable",
      };
      estimateCache.set(cacheKey, fallback);
      return fallback;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  })();

  pendingRequests.set(cacheKey, request);
  return request;
}
