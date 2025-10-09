
export interface Alarm {
  id: string;
  arrivalTime: string; // ISO 8601 format for time
  preparationTime: number; // in minutes
  days: number[]; // 0 = Sunday, 1 = Monday, etc.
}
