
import type { Alarm } from './Alarm';

export interface UserSettings {
  startStation: { id: string; name: string };
  destinationStation: { id: string; name: string };
  alarms: Alarm[];
}
