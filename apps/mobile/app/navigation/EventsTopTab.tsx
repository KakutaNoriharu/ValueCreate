import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React from 'react';
import { Colors } from '../../constants/colors';
import { Strings } from '../../constants/strings';
import CalendarScreen from '../screens/CalendarScreen';
import CompanyLinksScreen from '../screens/CompanyLinksScreen';
import type { EventsTopTabParamList } from './types';

const Tab = createMaterialTopTabNavigator<EventsTopTabParamList>();

export default function EventsTopTab() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.topTabActive,
        tabBarInactiveTintColor: Colors.topTabInactive,
        tabBarIndicatorStyle: { backgroundColor: Colors.topTabIndicator },
        tabBarStyle: { backgroundColor: Colors.white },
        tabBarLabelStyle: { fontWeight: '600', fontSize: 13 },
      }}
    >
      <Tab.Screen name="Calendar" component={CalendarScreen} options={{ title: Strings.nav.calendar }} />
      <Tab.Screen name="CompanyLinks" component={CompanyLinksScreen} options={{ title: Strings.nav.companies }} />
    </Tab.Navigator>
  );
}
