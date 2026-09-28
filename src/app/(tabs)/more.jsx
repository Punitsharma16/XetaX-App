import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Linking, Platform, StyleSheet, Text, View } from 'react-native';

import { PANEL_URL } from '@/lib/config';
import { useAuth } from '@/state/auth';
import { Avatar, Caption, Card, ListRow, Muted, Screen, SectionTitle } from '@/ui';
import { colors, space } from '@/ui/theme';

export default function MoreScreen() {
  const router = useRouter();
  const { user, logout, server } = useAuth();

  const confirmLogout = () => {
    if (Platform.OS === 'web') {logout();return;}
    Alert.alert('Sign out', 'Sign out of XetaX on this device?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Sign out', style: 'destructive', onPress: () => logout() }]
    );
  };

  return (
    <Screen>
      <Card onPress={() => router.push('/profile')} style={styles.me}>
        <Avatar name={user?.name} size={52} />
        <View style={{ flex: 1, marginLeft: space.md }}>
          <Text style={styles.name}>{user?.name || user?.email}</Text>
          <Muted numberOfLines={1}>{user?.email}</Muted>
          {user?.company ? <Caption>{user.company}</Caption> : null}
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.text3} />
      </Card>

      <SectionTitle title="Work" />
      <Card style={{ padding: 0 }}>
        <ListRow leading={<Ionicons name="sparkles-outline" size={20} color={colors.brand} />} title="AI Assistant" subtitle="Ask about your CRM or get things done" onPress={() => router.push('/ai')} />
        <ListRow leading={<Ionicons name="people-outline" size={20} color={colors.brand} />} title="Contacts" onPress={() => router.push('/contacts')} />
        <ListRow leading={<Ionicons name="receipt-outline" size={20} color={colors.brand} />} title="Invoices" onPress={() => router.push('/invoices')} />
        <ListRow leading={<Ionicons name="albums-outline" size={20} color={colors.brand} />} title="WhatsApp Flows" subtitle="Send a form your customer fills inside the chat" onPress={() => router.push('/flows')} />
        <ListRow leading={<Ionicons name="document-text-outline" size={20} color={colors.brand} />} title="Message Templates" subtitle="What is approved to send outside the 24-hour window" onPress={() => router.push('/templates')} />
        <ListRow leading={<Ionicons name="calculator-outline" size={20} color={colors.brand} />} title="Message Costs" subtitle="This month's WhatsApp spend, beside WhatsApp's own figures" onPress={() => router.push('/message-costs')} />
        <ListRow leading={<Ionicons name="mail-outline" size={20} color={colors.brand} />} title="Email Campaigns" subtitle="Bulk email from your own address" onPress={() => router.push('/email-campaigns')} />
        <ListRow leading={<Ionicons name="notifications-outline" size={20} color={colors.brand} />} title="Notifications" onPress={() => router.push('/notifications')} />
        <ListRow leading={<Ionicons name="person-add-outline" size={20} color={colors.brand} />} title="Team" onPress={() => router.push('/team')} />
      </Card>

      <SectionTitle title="Account" />
      <Card style={{ padding: 0 }}>
        <ListRow leading={<Ionicons name="person-circle-outline" size={20} color={colors.text2} />} title="My profile" onPress={() => router.push('/profile')} />
        <ListRow leading={<Ionicons name="globe-outline" size={20} color={colors.text2} />} title="Open web panel" subtitle="Forms, automations, WhatsApp setup, billing" onPress={() => Linking.openURL(PANEL_URL)} />
        <ListRow leading={<Ionicons name="log-out-outline" size={20} color={colors.danger} />} title="Sign out" chevron={false} onPress={confirmLogout} />
      </Card>

      <Caption style={{ textAlign: 'center', marginTop: space.xl }}>XetaX CRM · {server.replace(/^https?:\/\//, '').replace(/\/$/, '')}</Caption>
    </Screen>);

}

const styles = StyleSheet.create({
  me: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 17, fontWeight: '700', color: colors.text }
});
