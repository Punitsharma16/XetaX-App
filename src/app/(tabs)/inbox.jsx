import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { PANEL_URL } from '@/lib/config';
import { useAsync } from '@/lib/use-async';
import { desk, whatsapp } from '@/services';
import { useToast } from '@/state/toast';
import { Avatar, Button, Caption, Card, Chip, Empty, ErrorState, Loading, Muted, Pill, Screen } from '@/ui';
import { colors, formatDate, space } from '@/ui/theme';

/** WhatsApp inbox + Live Chat Desk (hand-off requests, chats you accepted). */
export default function InboxTab() {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState('whatsapp');
  const [tick, setTick] = useState(0);
  const cfg = useAsync(() => whatsapp.config().catch(() => null), [tick]);
  const connected = cfg.data?.status === 'CONNECTED';
  const convs = useAsync(() => connected ? whatsapp.conversations() : Promise.resolve(null), [connected, tick]);
  const state = useAsync(() => desk.state().catch(() => null), [tick]);

  // Desk requests change quickly — poll while the tab is open.
  useEffect(() => {const id = setInterval(() => setTick((t) => t + 1), 20000);return () => clearInterval(id);}, []);

  const requests = state.data?.requests || [];
  const mine = state.data?.mine || [];

  return (
    <Screen refreshing={(convs.loading || state.loading) && !!(convs.data || state.data)} onRefresh={() => setTick((t) => t + 1)}>
      <View style={styles.chips}>
        <Chip text="WhatsApp" active={tab === 'whatsapp'} onPress={() => setTab('whatsapp')} />
        <Chip text={`Requests${requests.length ? ` (${requests.length})` : ''}`} active={tab === 'requests'} onPress={() => setTab('requests')} />
        <Chip text={`My chats${mine.length ? ` (${mine.length})` : ''}`} active={tab === 'mine'} onPress={() => setTab('mine')} />
      </View>

      {tab === 'whatsapp' ?
      <>
          {cfg.loading && !cfg.data ? <Loading /> : null}
          {cfg.data && !connected ?
        <Empty icon="logo-whatsapp" title="WhatsApp not connected" text="Connect your WhatsApp Business number from the web panel (WhatsApp → Setup). Replies will show here."
        action={<Button title="Open web panel" variant="secondary" onPress={() => Linking.openURL(PANEL_URL + '/app/whatsapp')} />} /> :
        null}
          {connected && convs.error ? <ErrorState message={convs.error} onRetry={() => setTick((t) => t + 1)} /> : null}
          {connected && convs.data && convs.data.content.length === 0 ? <Empty icon="chatbubble-ellipses-outline" title="No conversations yet" text="Incoming replies and your sent messages appear here." /> : null}
          {(convs.data?.content || []).map((c) =>
        <Card key={c.id} onPress={() => router.push({ pathname: '/chat/[id]', params: { id: String(c.id), name: c.customerName || c.customerPhone, phone: c.customerPhone, window: c.windowOpen ? '1' : '0' } })} style={styles.row}>
              <Avatar name={c.customerName || c.customerPhone} size={44} />
              <View style={{ flex: 1, marginLeft: space.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.name} numberOfLines={1}>{c.customerName || c.customerPhone}</Text>
                  <Caption>{formatDate(c.lastMessageAt)}</Caption>
                </View>
                <Muted numberOfLines={1}>{c.lastMessage || '—'}</Muted>
              </View>
              {c.unreadCount > 0 ? <View style={styles.unread}><Text style={styles.unreadText}>{c.unreadCount}</Text></View> : null}
            </Card>
        )}
        </> :
      null}

      {tab === 'requests' ?
      <>
          {state.loading && !state.data ? <Loading /> : null}
          {state.data && !state.data.enabled ? <Empty icon="headset-outline" title="Live chat desk is off" text="It switches on when an AI agent or WhatsApp is live." /> : null}
          {state.data?.enabled && requests.length === 0 ? <Empty icon="headset-outline" title="No one is waiting" text="Requests appear here when a customer asks for a person." /> : null}
          {requests.map((r) =>
        <Card key={r.id} style={r.escalated ? { borderColor: '#F5B7B1' } : undefined}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name={r.channel === 'WHATSAPP' ? 'logo-whatsapp' : 'globe-outline'} size={16} color={r.channel === 'WHATSAPP' ? colors.whatsapp : colors.brand} />
                <Text style={styles.name}>{r.customer}</Text>
                <Caption style={{ marginLeft: 'auto' }}>{formatDate(r.createdAt, true)}</Caption>
              </View>
              {r.lastMessage ? <Muted style={{ marginTop: 6 }} numberOfLines={2}>“{r.lastMessage}”</Muted> : null}
              {r.reason ? <Caption style={{ marginTop: 4 }}>{r.reason}</Caption> : null}
              {r.aiSummary ? <Caption style={{ marginTop: 4 }} numberOfLines={2}>✦ {r.aiSummary}</Caption> : null}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: space.md }}>
                <Button title="Accept" small icon="checkmark" onPress={async () => {try {const s = await desk.accept(r.id);toast.success("You're in the chat");router.push({ pathname: '/desk/[id]', params: { id: String(s.id) } });} catch (e) {toast.error(e?.message);}}} />
                <Button title="Back to AI" small variant="secondary" onPress={async () => {try {await desk.decline(r.id);setTick((t) => t + 1);} catch (e) {toast.error(e?.message);}}} />
              </View>
            </Card>
        )}
        </> :
      null}

      {tab === 'mine' ?
      <>
          {mine.length === 0 && !state.loading ? <Empty icon="chatbubbles-outline" title="No chats with you" text="Chats you accept show up here." /> : null}
          {mine.map((s) =>
        <Card key={s.id} onPress={() => router.push({ pathname: '/desk/[id]', params: { id: String(s.id) } })} style={styles.row}>
              <Avatar name={s.customer} size={44} />
              <View style={{ flex: 1, marginLeft: space.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.name} numberOfLines={1}>{s.customer}</Text>
                  <Caption>{formatDate(s.lastMessageAt)}</Caption>
                </View>
                <Muted numberOfLines={1}>{s.lastMessage}</Muted>
              </View>
              {s.lastRole === 'CUSTOMER' ? <View style={styles.dot} /> : null}
            </Card>
        )}
          {(state.data?.others || []).length ?
        <>
              <Caption style={{ marginTop: space.md, marginBottom: space.sm }}>HANDLED BY TEAMMATES</Caption>
              {state.data.others.map((s) =>
          <Card key={s.id} onPress={() => router.push({ pathname: '/desk/[id]', params: { id: String(s.id) } })} style={styles.row}>
                  <Avatar name={s.customer} size={40} />
                  <View style={{ flex: 1, marginLeft: space.md }}>
                    <Text style={styles.name}>{s.customer}</Text>
                    <Caption>with {s.acceptedByName || 'a teammate'}</Caption>
                  </View>
                  <Pill text={s.status} small tone="muted" />
                </Card>
          )}
            </> :
        null}
        </> :
      null}
    </Screen>);

}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', gap: 8, marginBottom: space.md },
  row: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: colors.text, flexShrink: 1 },
  unread: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colors.whatsapp, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, marginLeft: 8 },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brand, marginLeft: 8 }
});
