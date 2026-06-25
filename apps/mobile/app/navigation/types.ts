import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { MaterialTopTabScreenProps } from '@react-navigation/material-top-tabs';

export type AuthStackParamList = {
  Top: undefined;
  Login: undefined;
  SignUp: undefined;
  EmailVerifyPending: { email: string };
};

export type MainTabParamList = {
  Home: undefined;
  ChickenRace: undefined;
  Post: undefined;
  Events: undefined;
  Profile: undefined;
};

export type EventsTopTabParamList = {
  Calendar: undefined;
  CompanyLinks: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  ReminderDetail: { eventId: string };
  Settings: undefined;
  EditProfile: undefined;
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  BottomTabScreenProps<MainTabParamList, T>;

export type EventsTopTabScreenProps<T extends keyof EventsTopTabParamList> =
  MaterialTopTabScreenProps<EventsTopTabParamList, T>;

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
