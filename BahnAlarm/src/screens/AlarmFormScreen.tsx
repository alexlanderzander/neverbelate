
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  FlatList,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme, colors } from '../styles/styles';
import { searchStations } from '../api/DbApiService';
import type { Alarm } from '../types/Alarm';
import type { UserSettings } from '../types/UserSettings';
import type { Location } from '../types/ApiTypes';

const USER_SETTINGS_KEY = '@BahnAlarm:userSettings';

interface AlarmFormScreenProps {
  route: { params?: { alarm?: Alarm; startStation?: Location; destinationStation?: Location } };
  navigation: any;
}

export const AlarmFormScreen: React.FC<AlarmFormScreenProps> = ({ route, navigation }) => {
  const [alarm, setAlarm] = useState<Partial<Alarm>>(route.params?.alarm ?? { days: [] });
  const [startStation, setStartStation] = useState<Location | null>(route.params?.startStation ?? null);
  const [destinationStation, setDestinationStation] = useState<Location | null>(route.params?.destinationStation ?? null);

  const [startQuery, setStartQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [startResults, setStartResults] = useState<Location[]>([]);
  const [destResults, setDestResults] = useState<Location[]>([]);
  const [loadingStart, setLoadingStart] = useState(false);
  const [loadingDest, setLoadingDest] = useState(false);
  const [activeInput, setActiveInput] = useState<'start' | 'dest' | null>(null);

  const handleSave = async () => {
    try {
      if (!startStation || !destinationStation) {
        Alert.alert('Error', 'Please select a start and destination station.');
        return;
      }

      const settingsString = await AsyncStorage.getItem(USER_SETTINGS_KEY);
      let settings: UserSettings = settingsString ? JSON.parse(settingsString) : { alarms: [], startStation: null, destinationStation: null };

      if (!settings.alarms) {
        settings.alarms = [];
      }

      settings.startStation = startStation;
      settings.destinationStation = destinationStation;

      if (alarm.id) {
        // Update existing alarm
        const index = settings.alarms.findIndex((a) => a.id === alarm.id);
        if (index !== -1) {
          settings.alarms[index] = alarm as Alarm;
        }
      } else {
        // Add new alarm
        const newAlarm: Alarm = {
          ...alarm,
          id: new Date().toISOString(),
        } as Alarm;
        settings.alarms.push(newAlarm);
      }

      await AsyncStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settings));
      navigation.goBack();
    } catch (error) {
      console.error('[AlarmFormScreen] Error saving alarm:', error);
      Alert.alert('Error', 'Failed to save alarm.');
    }
  };

  const handleDelete = async () => {
    try {
      if (!alarm.id) {
        return;
      }

      Alert.alert('Delete Alarm', 'Are you sure you want to delete this alarm?', [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            const settingsString = await AsyncStorage.getItem(USER_SETTINGS_KEY);
            let settings: UserSettings = settingsString ? JSON.parse(settingsString) : { alarms: [], startStation: null, destinationStation: null };
            settings.alarms = settings.alarms.filter((a) => a.id !== alarm.id);
            await AsyncStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settings));
            navigation.goBack();
          },
          style: 'destructive',
        },
      ]);
    } catch (error) {
      console.error('[AlarmFormScreen] Error deleting alarm:', error);
      Alert.alert('Error', 'Failed to delete alarm.');
    }
  };

  const toggleDay = (day: number) => {
    const days = alarm.days?.includes(day)
      ? alarm.days.filter((d) => d !== day)
      : [...(alarm.days ?? []), day];
    setAlarm({ ...alarm, days });
  };

  const search = async (query: string, setResults: (res: Location[]) => void, setLoading: (l: boolean) => void) => {
    if (query.length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const results = await searchStations(query);
      setResults(results);
    } catch (error) {
      console.error(error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearchStart = useCallback(debounce((q: string) => search(q, setStartResults, setLoadingStart), 300), []);
  const debouncedSearchDest = useCallback(debounce((q: string) => search(q, setDestResults, setLoadingDest), 300), []);

  useEffect(() => { if (activeInput === 'start') debouncedSearchStart(startQuery); }, [startQuery]);
  useEffect(() => { if (activeInput === 'dest') debouncedSearchDest(destQuery); }, [destQuery]);

  const renderStationSelector = (
    query: string,
    setQuery: (q: string) => void,
    setStation: (s: Location) => void,
    selectedStation: { name: string } | null,
    placeholder: string,
    results: Location[],
    setResults: (r: Location[]) => void,
    loading: boolean,
    inputType: 'start' | 'dest'
  ) => (
    <View style={styles.inputGroup}>
      <Text style={theme.label}>{placeholder}</Text>
      <TextInput
        style={theme.input}
        placeholder={`e.g. Berlin Hbf`}
        placeholderTextColor={colors.textMuted}
        value={selectedStation ? selectedStation.name : query}
        onFocus={() => setActiveInput(inputType)}
        onChangeText={(text) => {
          if (selectedStation) setStation(null);
          setQuery(text);
        }}
      />
      {loading && <ActivityIndicator style={styles.loader} color={colors.text} />}
      {results.length > 0 && activeInput === inputType && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => {
                  setStation(item);
                  setQuery('');
                  setResults([]);
                  setActiveInput(null);
                }}>
                <Text style={theme.body}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[theme.container, styles.container]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={theme.panel}>
          <Text style={theme.subtitle}>Edit Alarm</Text>
          {renderStationSelector(startQuery, setStartQuery, setStartStation, startStation, 'Start Station', startResults, setStartResults, loadingStart, 'start')}
          {renderStationSelector(destQuery, setDestQuery, setDestinationStation, destinationStation, 'Destination Station', destResults, setDestResults, loadingDest, 'dest')}
          <View style={styles.inputGroup}>
            <Text style={theme.label}>Arrival Time</Text>
            <TextInput
              style={theme.input}
              value={alarm.arrivalTime}
              onChangeText={(text) => setAlarm({ ...alarm, arrivalTime: text })}
              placeholder="HH:MM (24h)"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={theme.label}>Preparation Time (in minutes)</Text>
            <TextInput
              style={theme.input}
              value={alarm.preparationTime?.toString() ?? ''}
              onChangeText={(text) => setAlarm({ ...alarm, preparationTime: text ? parseInt(text, 10) : 0 })}
              placeholder="e.g. 75"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={theme.label}>Active Days</Text>
            <View style={styles.daysContainer}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.dayButton, alarm.days?.includes(index) && styles.dayButtonActive]}
                  onPress={() => toggleDay(index)}
                >
                  <Text style={styles.dayButtonText}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TouchableOpacity style={theme.button} onPress={handleSave}>
            <Text style={theme.buttonText}>Save</Text>
          </TouchableOpacity>
          {alarm.id && (
            <TouchableOpacity style={[theme.button, styles.deleteButton]} onPress={handleDelete}>
              <Text style={[theme.buttonText, styles.deleteButtonText]}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Debounce utility
const debounce = <F extends (...args: any[]) => any>(func: F, delay: number) => {
  let timeoutId: NodeJS.Timeout | null = null;
  return (...args: Parameters<F>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1,
  },
  dayButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayButtonText: {
    color: colors.text,
  },
  resultsContainer: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 5,
    maxHeight: 150, // prevent list from becoming too long
  },
  resultItem: {
    padding: 15,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  loader: {
    position: 'absolute',
    right: 15,
    top: 45, // Adjust based on label and input height
  },
  deleteButton: {
    backgroundColor: colors.danger,
    marginTop: 10,
  },
  deleteButtonText: {
    color: colors.white,
  },
});
