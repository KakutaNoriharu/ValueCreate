import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useRef } from 'react';
import { useAuthStore } from '../../stores/authStore';
import AuthStack from './AuthStack';
import MainTab from './MainTab';
import type { RootStackParamList } from './types';
import ReminderDetailScreen from '../screens/ReminderDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { Strings } from '../../constants/strings';

const Stack = createNativeStackNavigator<RootStackParamList>();

function MainStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MainTabs" component={MainTab} options={{ headerShown: false }} />
      <Stack.Screen
        name="ReminderDetail"
        component={ReminderDetailScreen}
        options={{ title: Strings.nav.reminderDetail, headerBackTitle: '' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: Strings.nav.settings, headerBackTitle: '' }}
      />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const loadToken = useAuthStore((s) => s.loadToken);
  const loaded = useRef(false);

  useEffect(() => {
    if (!loaded.current) {
      loaded.current = true;
      loadToken();
    }
  }, [loadToken]);

  if (isLoading) return null;

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
