import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { Strings } from '../../constants/strings';
import HomeScreen from '../screens/HomeScreen';
import ChickenRaceTopTab from './ChickenRaceTopTab';
import PostScreen from '../screens/PostScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ToolsTopTab from './ToolsTopTab';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ icon, color }: { icon: string; color: string }) {
  return <Text style={{ fontSize: 20, color }}>{icon}</Text>;
}

function FabButton({ onPress }: { onPress?: ((...args: unknown[]) => void) }) {
  return (
    <TouchableOpacity onPress={() => onPress?.()} style={styles.fabWrapper}>
      <View style={styles.fab}>
        <Text style={styles.fabIcon}>＋</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function MainTab() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: Strings.nav.home,
          tabBarIcon: ({ color }) => <TabIcon icon="🏠" color={color} />,
        }}
      />
      <Tab.Screen
        name="ChickenRace"
        component={ChickenRaceTopTab}
        options={{
          tabBarLabel: Strings.nav.race,
          tabBarIcon: ({ color }) => <TabIcon icon="🏆" color={color} />,
        }}
      />
      <Tab.Screen
        name="Post"
        component={PostScreen}
        options={{
          tabBarLabel: Strings.nav.post,
          tabBarButton: (props) => (
            <FabButton onPress={props.onPress as ((...args: unknown[]) => void) | undefined} />
          ),
        }}
      />
      <Tab.Screen
        name="Tools"
        component={ToolsTopTab}
        options={{
          tabBarLabel: Strings.nav.tools,
          tabBarIcon: ({ color }) => <TabIcon icon="🛠️" color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: Strings.nav.profile,
          tabBarIcon: ({ color }) => <TabIcon icon="📓" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  fabWrapper: {
    top: -16,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  fabIcon: {
    color: Colors.white,
    fontSize: 28,
    lineHeight: 32,
    marginTop: -2,
  },
});
