import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/state/auth';
import { Loading } from '@/ui';
import { colors } from '@/ui/theme';

export default function TabsLayout() {
  const { status } = useAuth();
  const insets = useSafeAreaInsets();
  const bottomGap = Math.max(insets.bottom, 10);
  if (status === 'loading') return <Loading text="Signing you in…" />;
  if (status === 'signedOut') return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { fontWeight: '700', color: colors.text },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.text3,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 58 + bottomGap, paddingBottom: bottomGap, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        sceneStyle: { backgroundColor: colors.bg }
      }}>
      
      <Tabs.Screen name="index" options={{ title: 'Home', headerShown: false, tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="records" options={{ title: 'Records', tabBarIcon: ({ color, size }) => <Ionicons name="albums-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="inbox" options={{ title: 'Inbox', tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="tasks" options={{ title: 'Tasks', tabBarIcon: ({ color, size }) => <Ionicons name="checkbox-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: ({ color, size }) => <Ionicons name="menu-outline" size={size} color={color} /> }} />
    </Tabs>);

}
