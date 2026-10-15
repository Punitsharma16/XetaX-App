import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/state/auth';
import { ToastProvider } from '@/state/toast';
import { colors } from '@/ui/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <ToastProvider>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: colors.surface },
                headerTintColor: colors.text,
                headerTitleStyle: { fontWeight: '700' },
                headerShadowVisible: false,
                contentStyle: { backgroundColor: colors.bg }
              }}>
              
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="records/[slug]" options={{ title: 'Records' }} />
              <Stack.Screen name="record/[id]" options={{ title: 'Record' }} />
              <Stack.Screen name="record/edit" options={{ title: 'Record', presentation: 'modal' }} />
              <Stack.Screen name="task/new" options={{ title: 'New task', presentation: 'modal' }} />
              <Stack.Screen name="chat/[id]" options={{ title: 'Chat' }} />
              <Stack.Screen name="desk/[id]" options={{ title: 'Live chat' }} />
              <Stack.Screen name="menu" options={{ title: 'Online Menu' }} />
              <Stack.Screen name="bookings" options={{ title: 'Bookings' }} />
              <Stack.Screen name="campaigns" options={{ title: 'WhatsApp campaigns' }} />
              <Stack.Screen name="campaign/[id]" options={{ title: 'Campaign' }} />
              <Stack.Screen name="ai" options={{ title: 'AI Assistant' }} />
              <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
              <Stack.Screen name="invoices" options={{ title: 'Invoices' }} />
              <Stack.Screen name="invoice/[id]" options={{ title: 'Invoice' }} />
              <Stack.Screen name="flows" options={{ title: 'WhatsApp Flows' }} />
              <Stack.Screen name="templates" options={{ title: 'Message templates' }} />
              <Stack.Screen name="message-costs" options={{ title: 'Message costs' }} />
              <Stack.Screen name="email-campaigns" options={{ title: 'Email campaigns' }} />
              <Stack.Screen name="email-campaign/[id]" options={{ title: 'Campaign' }} />
              <Stack.Screen name="email-campaign/new" options={{ title: 'New email campaign', presentation: 'modal' }} />
              <Stack.Screen name="contacts" options={{ title: 'Contacts' }} />
              <Stack.Screen name="team" options={{ title: 'Team' }} />
              <Stack.Screen name="profile" options={{ title: 'My profile' }} />
            </Stack>
          </ToastProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>);

}
