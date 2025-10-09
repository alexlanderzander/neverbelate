
import React, { useState, useCallback, useEffect } from 'react';
import { ScrollView, View, TouchableOpacity, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { subMinutes, parseISO, formatISO } from 'date-fns';

import { theme, colors } from '../styles/styles';
import { AlarmDisplay } from '../components/AlarmDisplay';
import { StatusCard } from '../components/StatusCard';
import { AdjustmentHistory } from '../components/AdjustmentHistory';

import { findJourney } from '../api/DbApiService';
import { getNextArrivalDateTime, getNextUpcomingAlarm } from '../utils/timeHelper';
import { notificationService } from '../services/NotificationService';
import type { Journey } from '../types/ApiTypes';
import type { UserSettings } from '../types/UserSettings';
import type { Alarm } from '../types/Alarm';
import type { AlarmAdjustment } from '../types/AlarmAdjustment';

const ALARM_TIME_KEY = '@BahnAlarm:alarmTime';
const ADJUSTMENT_HISTORY_KEY = '@BahnAlarm:adjustmentHistory';
const USER_SETTINGS_KEY = '@BahnAlarm:userSettings';

export const DashboardScreen = ({ navigation }) => {
  const [alarmTime, setAlarmTime] = useState<string | null>(null);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [history, setHistory] = useState<AlarmAdjustment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const settingsString = await AsyncStorage.getItem(USER_SETTINGS_KEY);
      const historyString = await AsyncStorage.getItem(ADJUSTMENT_HISTORY_KEY);

      setHistory(historyString ? JSON.parse(historyString) : []);

      if (settingsString) {
        const settings: UserSettings = JSON.parse(settingsString);
        const nextAlarm = getNextUpcomingAlarm(settings.alarms);

        if (nextAlarm) {
          const nextArrivalDateTime = getNextArrivalDateTime(nextAlarm.arrivalTime);
          const journeyData = await findJourney(settings.startStation.id, settings.destinationStation.id, nextArrivalDateTime, false);
          const leg = journeyData.journeys[0]?.legs[0];

          if (leg) {
            const plannedDeparture = parseISO(leg.plannedDeparture);
            const delaySeconds = leg.departureDelay ?? 0;
            const actualDeparture = new Date(plannedDeparture.getTime() + delaySeconds * 1000);
            const newAlarmTime = subMinutes(actualDeparture, nextAlarm.preparationTime);

            await AsyncStorage.setItem(ALARM_TIME_KEY, formatISO(newAlarmTime));
            setAlarmTime(formatISO(newAlarmTime));
            notificationService.scheduleNotification(newAlarmTime, "It's time to go!");
          }

          setJourney(journeyData.journeys[0] ?? null);
        } else {
          setJourney(null);
        }
      } else {
        setJourney(null);
      }
    } catch (error) {
      console.error('[DashboardScreen] Error loading data:', error);
      setJourney(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    PushNotificationIOS.requestPermissions();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  return (
    <SafeAreaView style={theme.container}>
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContentContainer} // <-- This style adds the centering
      >
        <AlarmDisplay alarmTime={alarmTime} />
        <View style={{ height: 20 }} />
        <StatusCard journey={journey} isLoading={isLoading} onRefresh={loadData} />
        <AdjustmentHistory history={history} />
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')} 
        >
          <Text style={styles.settingsButtonText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  // This new style will grow to fill the space and center the content inside the ScrollView
  scrollContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  footer: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  settingsButton: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 50,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  settingsButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
