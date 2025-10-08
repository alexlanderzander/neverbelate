
import type { JourneysResponse, Location } from '../types/ApiTypes';

const API_BASE_URL = 'https://v6.db.transport.rest';

/**
 * Searches for locations (stations) based on a query string.
 * @param query The station name to search for.
 * @returns A promise that resolves to an array of matching locations.
 */
export const searchStations = async (query: string): Promise<Location[]> => {
  if (!query) {
    return [];
  }

  const url = new URL(`${API_BASE_URL}/locations`);
  url.searchParams.append('query', query);
  url.searchParams.append('results', '5'); // Limit results to 5 for performance

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    const data: Location[] = await response.json();
    // The API can return various types, so we filter for actual station locations
    return data.filter(item => item.type === 'stop' || item.type === 'station');
  } catch (error) {
    console.error('[DbApiService] Failed to search stations:', error);
    // Re-throw the error to be handled by the caller (e.g., UI)
    throw new Error('Failed to fetch station data. The API might be offline.');
  }
};

/**
 * Finds journeys between two stations.
 * @param fromId The ID of the departure station.
 * @param toId The ID of the arrival station.
 * @returns A promise that resolves to the journeys response.
 */
export const findJourney = async (
  fromId: string,
  toId: string,
  departure: string, // Add departure time parameter
): Promise<JourneysResponse> => {
  const url = new URL(`${API_BASE_URL}/journeys`);
  url.searchParams.append('from', fromId);
  url.searchParams.append('to', toId);
  url.searchParams.append('results', '1');
  url.searchParams.append('departure', departure); // Use the provided departure time

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    const data: JourneysResponse = await response.json();
    return data;
  } catch (error) {
    console.error('[DbApiService] Failed to find journey:', error);
    throw new Error('Failed to fetch journey data. The API might be offline.');
  }
};
