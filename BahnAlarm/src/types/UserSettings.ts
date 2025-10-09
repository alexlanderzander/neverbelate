
export interface UserSettings {
  startStation: { id: string; name: string };
  destinationStation: { id: string; name: string };
  arrivalTime: string; // ISO 8601 format for time
  preparationTime: number; // in minutes
}
