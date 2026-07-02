import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React from 'react';
import { Colors } from '../../constants/colors';
import { Strings } from '../../constants/strings';
import ChickenRaceScreen from '../screens/ChickenRaceScreen';
import SeasonEventScreen from '../screens/SeasonEventScreen';
import type { ChickenRaceTopTabParamList } from './types';

const Tab = createMaterialTopTabNavigator<ChickenRaceTopTabParamList>();

// P-06 チキンレース（上部タブ: ランキング / シーズンイベント）
export default function ChickenRaceTopTab() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.topTabActive,
        tabBarInactiveTintColor: Colors.topTabInactive,
        tabBarIndicatorStyle: { backgroundColor: Colors.topTabIndicator },
        tabBarStyle: { backgroundColor: Colors.white, paddingTop: 44 },
        tabBarLabelStyle: { fontWeight: '600', fontSize: 13 },
      }}
    >
      <Tab.Screen name="Ranking" component={ChickenRaceScreen} options={{ title: Strings.nav.ranking }} />
      <Tab.Screen name="SeasonEvent" component={SeasonEventScreen} options={{ title: Strings.nav.seasonEvent }} />
    </Tab.Navigator>
  );
}
