
import { set, isPast, addDays, formatISO, getDay } from 'date-fns';
import type { Alarm } from '../types/Alarm';

/**
 * Calculates the next occurrence of a given arrival time.
 * If the time is in the future today, it returns today's date with that time.
 * If the time is in the past today, it returns tomorrow's date with that time.
 * @param arrivalTimeString A string representing the time, e.g., "08:00"
 * @returns An ISO 8601 string of the next arrival date and time.
 */
export const getNextArrivalDateTime = (arrivalTimeString: string): string => {
  const now = new Date();
  const [hours, minutes] = arrivalTimeString.split(':').map(Number);

  let nextArrivalDate = set(now, { hours, minutes, seconds: 0, milliseconds: 0 });

  // If the calculated time for today is already in the past, set it for tomorrow
  if (isPast(nextArrivalDate)) {
    nextArrivalDate = addDays(nextArrivalDate, 1);
  }

  return formatISO(nextArrivalDate);
};

/**
 * Gets the next upcoming alarm from a list of alarms.
 * @param alarms An array of alarms.
 * @returns The next upcoming alarm, or null if there are no alarms.
 */
export const getNextUpcomingAlarm = (alarms: Alarm[]): Alarm | null => {
  if (!alarms || alarms.length === 0) {
    return null;
  }

  let nextUpcomingAlarm: Alarm | null = null;
  let nextUpcomingAlarmTime: Date | null = null;

  for (const alarm of alarms) {
    const now = new Date();
    const [hours, minutes] = alarm.arrivalTime.split(':').map(Number);

    for (let i = 0; i < 7; i++) {
      const nextDate = addDays(now, i);
      const dayOfWeek = getDay(nextDate);

      if (alarm.days.includes(dayOfWeek)) {
        let nextAlarmTime = set(nextDate, { hours, minutes, seconds: 0, milliseconds: 0 });

        if (isPast(nextAlarmTime)) {
          continue;
        }

        if (!nextUpcomingAlarmTime || nextAlarmTime < nextUpcomingAlarmTime) {
          nextUpcomingAlarm = alarm;
          nextUpcomingAlarmTime = nextAlarmTime;
        }
        break;
      }
    }
  }

  return nextUpcomingAlarm;
};
