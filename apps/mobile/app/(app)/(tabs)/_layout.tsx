import { Tabs } from 'expo-router';
import { colors } from '@/constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border.light,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.text.inverse,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Groups',
          tabBarIcon: ({ color, size }) => <GroupsIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <ProfileIcon color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

import { Text } from 'react-native';

// Simple icon components (you can replace with actual icons)
function GroupsIcon({ color, size }: { color: string; size: number }) {
  return <Text style={{ fontSize: size, color }}>👥</Text>;
}

function ProfileIcon({ color, size }: { color: string; size: number }) {
  return <Text style={{ fontSize: size, color }}>👤</Text>;
}
