import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAsync } from '@/lib/use-async';
import { notifications } from '@/services';
import { Caption, Card, Empty, ErrorState, Loading, Muted, Screen } from '@/ui';
import { colors, formatDate, space } from '@/ui/theme';

function iconFor(type) {
  if (type === 'WHATSAPP_INBOUND') return { name: 'logo-whatsapp', color: colors.whatsapp };
  if (type === 'RECORD_CREATED') return { name: 'albums-outline', color: colors.brand };
  if (type === 'TASK_DUE') return { name: 'alarm-outline', color: colors.warning };
  if (type === 'DIGEST') return { name: 'sunny-outline', color: colors.info };
  if (type.includes('DESK') || type.includes('HANDOFF')) return { name: 'headset-outline', color: colors.danger };
  return { name: 'information-circle-outline', color: colors.text3 };
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [tick, setTick] = useState(0);
  const feed = useAsync(() => notifications.feed(), [tick]);

  const open = async (n) => {
    if (!n.readAt) {try {await notifications.markRead(n.id);} catch {/* ignore */}}
    setTick((t) => t + 1);
    const link = n.link || '';
    const rec = link.match(/records\/[^/]+\/([a-f0-9]{24})/i);
    if (rec) router.push({ pathname: '/record/[id]', params: { id: rec[1] } });else
    if (link.includes('desk')) router.push('/(tabs)/inbox');else
    if (link.includes('tasks')) router.push('/(tabs)/tasks');else
    if (link.includes('whatsapp')) router.push('/(tabs)/inbox');
  };

  return (
    <Screen refreshing={feed.loading && !!feed.data} onRefresh={() => setTick((t) => t + 1)}>
      {feed.loading && !feed.data ? <Loading /> : null}
      {feed.error && !feed.data ? <ErrorState message={feed.error} onRetry={() => setTick((t) => t + 1)} /> : null}
      {feed.data && feed.data.items.length === 0 ? <Empty icon="notifications-off-outline" title="No notifications yet" /> : null}
      {(feed.data?.items || []).map((n) => {
        const ic = iconFor(n.type);
        return (
          <Card key={n.id} onPress={() => open(n)} style={[styles.row, !n.readAt && styles.unread]}>
            <View style={[styles.icon, { backgroundColor: ic.color + '1A' }]}><Ionicons name={ic.name} size={18} color={ic.color} /></View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, !n.readAt && { fontWeight: '700' }]} numberOfLines={2}>{n.title}</Text>
              {n.body ? <Muted numberOfLines={2}>{n.body}</Muted> : null}
              <Caption style={{ marginTop: 2 }}>{formatDate(n.createdAt, true)}</Caption>
            </View>
            {!n.readAt ? <View style={styles.dot} /> : null}
          </Card>);

      })}
    </Screen>);

}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  unread: { borderColor: colors.brand + '55', backgroundColor: '#FBFBFF' },
  icon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 14.5 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand, marginTop: 6 }
});
