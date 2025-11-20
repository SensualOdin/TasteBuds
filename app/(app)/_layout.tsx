import { useAppTheme } from '@theme';
import { Icon } from '@ui';
import { Tabs } from 'expo-router';

export default function AppTabsLayout() {
  const { theme } = useAppTheme();
  const { colors } = theme;

  return (
    <Tabs
      initialRouteName="groups/index"
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen
        name="groups/index"
        options={{
          title: 'Groups',
          tabBarIcon: ({ color }) => <Icon name="group" tone="default" color={color} />,
        }}
      />
      <Tabs.Screen
        name="swipe/index"
        options={{
          title: 'Swipe',
          tabBarIcon: ({ color }) => <Icon name="style" tone="default" color={color} />,
        }}
      />
      <Tabs.Screen
        name="matches/index"
        options={{
          title: 'Matches',
          tabBarIcon: ({ color }) => <Icon name="favorite" tone="default" color={color} />,
        }}
      />
      <Tabs.Screen
        name="activity/index"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color }) => <Icon name="notifications" tone="default" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Icon name="person" tone="default" color={color} />,
        }}
      />
      <Tabs.Screen name="restaurants/[restaurantId]" options={{ href: null }} />
      <Tabs.Screen name="groups/[groupId]" options={{ href: null }} />
    </Tabs>
  );
}
