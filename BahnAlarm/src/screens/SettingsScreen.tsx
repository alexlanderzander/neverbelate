
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { theme, colors } from '../styles/styles';
import type { UserSettings } from '../types/UserSettings';
import type { Alarm } from '../types/Alarm';

const USER_SETTINGS_KEY = '@BahnAlarm:userSettings';

export const SettingsScreen = ({ navigation }) => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    const settingsString = await AsyncStorage.getItem(USER_SETTINGS_KEY);
    if (settingsString) {
      setSettings(JSON.parse(settingsString));
    }
    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings])
  );

  const renderAlarmItem = ({ item }: { item: Alarm }) => (
    <TouchableOpacity onPress={() => navigation.navigate('AlarmForm', { alarm: item, startStation: settings.startStation, destinationStation: settings.destinationStation })}>
      <View style={styles.alarmItem}>
        <Text style={theme.body}>{item.arrivalTime}</Text>
        <Text style={theme.body}>{item.days.join(', ')}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={theme.container}>
      {!isLoading && (
        <View style={theme.container}>
          <FlatList
            data={settings?.alarms ?? []}
            renderItem={renderAlarmItem}
            keyExtractor={(item) => item.id}
          />
          <TouchableOpacity style={theme.button} onPress={() => navigation.navigate('AlarmForm', { startStation: settings.startStation, destinationStation: settings.destinationStation })}>
            <Text style={theme.buttonText}>Add Alarm</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  alarmItem: {
    backgroundColor: colors.panel,
    padding: 15,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
