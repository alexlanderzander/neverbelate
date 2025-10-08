import BackgroundFetch from 'react-native-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { subMinutes, parseISO, formatISO } from 'date-fns';
import { findJourney } from '../api/DbApiService';
import { getNextCommuteDateTime } from '../utils/timeHelper'; // <-- IMPORT THE HELPER
import type { UserSettings } from '../types/UserSettings';
import type { AlarmAdjustment } from '../types/AlarmAdjustment';

const ALARM_TIME_KEY = '@BahnAlarm:alarmTime';
const ADJUSTMENT_HISTORY_KEY = '@BahnAlarm:adjustmentHistory';
const USER_SETTINGS_KEY = '@BahnAlarm:userSettings';

const backgroundTask = async (taskId: string) => {
  console.log('[BackgroundUpdateService] Task starting:', taskId);

  try {
    const settingsString = await AsyncStorage.getItem(USER_SETTINGS_KEY);
    if (!settingsString) {
      console.log('[BackgroundUpdateService] No user settings found. Skipping task.');
      BackgroundFetch.finish(taskId);
      return;
    }

    const settings: UserSettings = JSON.parse(settingsString);
    const { startStation, destinationStation, preparationTime, departureTime } = settings;

    // *** FIX: Calculate the correct departure date and time ***
    const nextCommuteDateTime = getNextCommuteDateTime(departureTime);

    // *** FIX: Pass the correct time to the API call ***
    const journeyResponse = await findJourney(startStation.id, destinationStation.id, nextCommuteDateTime);
    const journey = journeyResponse.journeys[0];
    const leg = journey?.legs[0];

    if (!leg) {
      console.log('[BackgroundUpdateService] No upcoming journey found for the specified time.');
      BackgroundFetch.finish(taskId);
      return;
    }

    const plannedDeparture = parseISO(leg.plannedDeparture);
    const delaySeconds = leg.departureDelay ?? 0;
    const actualDeparture = new Date(plannedDeparture.getTime() + delaySeconds * 1000);

    const newAlarmTime = subMinutes(actualDeparture, preparationTime);

    const oldAlarmTimeString = await AsyncStorage.getItem(ALARM_TIME_KEY);

    if (oldAlarmTimeString !== formatISO(newAlarmTime)) {
      console.log(`[BackgroundUpdateService] Alarm time updated. New time: ${formatISO(newAlarmTime)}`);

      const historyString = await AsyncStorage.getItem(ADJUSTMENT_HISTORY_KEY);
      const history: AlarmAdjustment[] = historyString ? JSON.parse(historyString) : [];

      const newAdjustment: AlarmAdjustment = {
        id: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        oldAlarmTime: oldAlarmTimeString ?? formatISO(newAlarmTime),
        newAlarmTime: formatISO(newAlarmTime),
        delayInMinutes: Math.round(delaySeconds / 60),
      };

      const updatedHistory = [newAdjustment, ...history].slice(0, 20);

      await AsyncStorage.setItem(ALARM_TIME_KEY, formatISO(newAlarmTime));
      await AsyncStorage.setItem(ADJUSTMENT_HISTORY_KEY, JSON.stringify(updatedHistory));

    } else {
      console.log('[BackgroundUpdateService] No change in alarm time.');
    }
  } catch (error) {
    console.error('[BackgroundUpdateService] Task error:', error);
  } finally {
    BackgroundFetch.finish(taskId);
  }
};

export const initBackgroundFetch = async () => {
  const status = await BackgroundFetch.configure(
    {
      minimumFetchInterval: 15,
      stopOnTerminate: false,
      startOnBoot: true,
      enableHeadless: true,
    },
    backgroundTask,
    (taskId) => {
      console.error('[BackgroundUpdateService] Task timed out:', taskId);
      BackgroundFetch.finish(taskId);
    }
  );

  console.log('[BackgroundUpdateService] BackgroundFetch configured with status:', status);
};

BackgroundFetch.registerHeadlessTask(backgroundTask);