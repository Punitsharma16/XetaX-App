import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Linking, Platform, StyleSheet, Text, View } from 'react-native';

import { PANEL_URL } from '@/lib/config';
import { useAuth } from '@/state/auth';
import { Avatar, Caption, Card, IconTile, ListRow, Muted, Screen, SectionTitle } from '@/ui';
import { colors, space } from '@/ui/theme';

/**
 * Everything the tab bar has no room for.
 *
 * <p>Grouped by what the user is trying to do rather than by which part of the
 * backend it comes from: take money in, talk to customers, run the place. One
 * long undivided list made the phone feel like a worse copy of the web panel.
 */
const GROUPS = [
{
  title: 'Storefront',
  caption: 'What your customers see',
  rows: [
  { icon: 'restaurant-outline', tone: 'brand', title: 'Online Menu', subtitle: 'Take a dish off the menu when it runs out', to: '/menu' },
  { icon: 'calendar-outline', tone: 'brand', title: 'Bookings', subtitle: 'Who is coming, and when', to: '/bookings' }]

},
{
  title: 'Engage',
  caption: 'Reaching the people on your list',
  rows: [
  { icon: 'megaphone-outline', tone: 'info', title: 'WhatsApp Campaigns', subtitle: 'Watch a send go out, pause it if needed', to: '/campaigns' },
  { icon: 'mail-outline', tone: 'info', title: 'Email Campaigns', subtitle: 'Bulk email from your own address', to: '/email-campaigns' },
  { icon: 'document-text-outline', tone: 'info', title: 'Message Templates', subtitle: 'Approved to send outside the 24-hour window', to: '/templates' },
  { icon: 'git-branch-outline', tone: 'info', title: 'WhatsApp Flows', subtitle: 'A form your customer fills inside the chat', to: '/flows' }]

},
{
  title: 'Business',
  caption: 'Money, people and the day',
  rows: [
  { icon: 'receipt-outline', tone: 'success', title: 'Invoices', subtitle: 'Raised, paid and still pending', to: '/invoices' },
  { icon: 'calculator-outline', tone: 'success', title: 'Message Costs', subtitle: "This month's WhatsApp spend", to: '/message-costs' },
  { icon: 'people-outline', tone: 'brand', title: 'Contacts', to: '/contacts' },
  { icon: 'person-add-outline', tone: 'brand', title: 'Team', to: '/team' }]

},
{
  title: 'Assistant',
  rows: [
  { icon: 'sparkles-outline', tone: 'warning', title: 'AI Assistant', subtitle: 'Ask about your CRM, or tell it what to do', to: '/ai' },
  { icon: 'notifications-outline', tone: 'warning', title: 'Notifications', to: '/notifications' }]

}];


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

      {GROUPS.map((group) =>
      <View key={group.title}>
          <SectionTitle title={group.title} />
          {group.caption ? <Caption style={styles.groupCaption}>{group.caption}</Caption> : null}
          <Card style={{ padding: 0 }}>
            {group.rows.map((row, i) =>
          <ListRow
            key={row.to}
            leading={<IconTile icon={row.icon} tone={row.tone} />}
            title={row.title}
            subtitle={row.subtitle}
            onPress={() => router.push(row.to)}
            style={i === group.rows.length - 1 ? styles.lastRow : undefined} />

          )}
          </Card>
        </View>
      )}

      <SectionTitle title="Account" />
      <Card style={{ padding: 0 }}>
        <ListRow leading={<IconTile icon="person-circle-outline" tone="muted" />} title="My profile" onPress={() => router.push('/profile')} />
        <ListRow leading={<IconTile icon="globe-outline" tone="muted" />} title="Open web panel" subtitle="Forms, automations, WhatsApp setup, billing" onPress={() => Linking.openURL(PANEL_URL)} />
        <ListRow leading={<IconTile icon="log-out-outline" tone="danger" />} title="Sign out" chevron={false} onPress={confirmLogout} style={styles.lastRow} />
      </Card>

      <Caption style={styles.footer}>XetaX CRM · {server.replace(/^https?:\/\//, '').replace(/\/$/, '')}</Caption>
    </Screen>);

}

const styles = StyleSheet.create({
  me: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 17, fontWeight: '700', color: colors.text },
  groupCaption: { marginTop: -space.sm, marginBottom: space.sm },
  // The card already draws the outer edge; a divider under the last row makes
  // it look like the list was cut off.
  lastRow: { borderBottomWidth: 0 },
  footer: { textAlign: 'center', marginTop: space.xl }
});
