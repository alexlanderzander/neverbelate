import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { initBackgroundFetch } from './src/services/BackgroundUpdateService';

const App = () => {
  useEffect(() => {
    // Initialize the background fetch service when the app starts
    initBackgroundFetch();
  }, []);

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" />
      <AppNavigator />
    </NavigationContainer>
  );
};

export default App;