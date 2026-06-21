import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import TopScreen from '../screens/TopScreen';
import SignUpScreen from '../screens/SignUpScreen';
import LoginScreen from '../screens/LoginScreen';
import EmailVerifyPendingScreen from '../screens/EmailVerifyPendingScreen';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Top" component={TopScreen} />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: true, title: 'クラブに入る', headerBackTitle: '' }}
      />
      <Stack.Screen
        name="SignUp"
        component={SignUpScreen}
        options={{ headerShown: true, title: '入会手続き', headerBackTitle: '' }}
      />
      <Stack.Screen
        name="EmailVerifyPending"
        component={EmailVerifyPendingScreen}
        options={{ headerShown: true, title: 'メール確認', headerBackVisible: false }}
      />
    </Stack.Navigator>
  );
}
