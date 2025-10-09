import React, { useState, useCallback } from 'react';
import { View, Alert, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { subMinutes, parseISO, format, formatISO } from 'date-fns';

import { theme } from '../styles/styles';
import { TrainConnectionForm } from '../components/TrainConnectionForm';
import { findJourney } from '../api/DbApiService';
import { getNextArrivalDateTime } from '../utils/timeHelper'; // <-- IMPORT THE HELPER
import type { UserSettings } from '../types/UserSettings';

const ALARM_TIME_KEY = '@BahnAlarm:alarmTime';
const ADJUSTMENT_HISTORY_KEY = '@BahnAlarm:adjustmentHistory';
const USER_SETTINGS_KEY = '@BahnAlarm:userSettings';

export const SettingsScreen = ({ navigation }) => {
  const [initialSettings, setInitialSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    const settingsString = await AsyncStorage.getItem(USER_SETTINGS_KEY);
    if (settingsString) {
      setInitialSettings(JSON.parse(settingsString));
    }
    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings])
  );

  const handleSave = async (settings: UserSettings) => {
    try {
      await AsyncStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settings));

      // *** FIX: Calculate and use the correct arrival time ***
      const nextArrivalDateTime = getNextArrivalDateTime(settings.arrivalTime);
      const journeyResponse = await findJourney(settings.startStation.id, settings.destinationStation.id, nextArrivalDateTime, false);
      const leg = journeyResponse.journeys[0]?.legs[0];

      if (!leg) {
        Alert.alert('No Journey Found', 'Could not find an upcoming train for this connection.');
        return;
      }

      const plannedDeparture = parseISO(leg.plannedDeparture);
      const delaySeconds = leg.departureDelay ?? 0;
      const actualDeparture = new Date(plannedDeparture.getTime() + delaySeconds * 1000);
      const initialAlarmTime = subMinutes(actualDeparture, settings.preparationTime);

      await AsyncStorage.setItem(ALARM_TIME_KEY, formatISO(initialAlarmTime));
      await AsyncStorage.setItem(ADJUSTMENT_HISTORY_KEY, JSON.stringify([]));

      Alert.alert('Settings Saved', `Your alarm has been set for ${format(initialAlarmTime, "HH:mm 'on' MMMM do")}.`);
      navigation.goBack();

    } catch (error) {
      console.error('[SettingsScreen] Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings. The API might be offline.');
    }
  };

  return (
    <SafeAreaView style={theme.container}>
      {!isLoading && (
        <TrainConnectionForm onSave={handleSave} initialSettings={initialSettings} />
      )}
    </SafeAreaView>
  );
};