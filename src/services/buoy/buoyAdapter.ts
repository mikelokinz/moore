import type { BuoyLocation } from './buoyTypes';

// Locations come only from the backend's authoritative INCOIS station catalog.
export async function fetchBuoyLocations(signal: AbortSignal): Promise<BuoyLocation[]> {
  const response = await fetch('/api/buoys', { signal });
  if (!response.ok) throw new Error('Station metadata unavailable');
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('Invalid catalog response');
  return data.map((b) => ({
    id: b.id,
    name: b.name,
    type: b.type,
    latitude: b.latitude,
    longitude: b.longitude,
    status: b.status,
    coordinateKind: b.coordinateKind,
    metadataSource: b.metadataSource,
    metadataRetrievedAt: b.metadataRetrievedAt,
    observationTimestamp: b.observationTimestamp,
    receivedAt: b.receivedAt,
    freshness: b.freshness,
  }));
}
