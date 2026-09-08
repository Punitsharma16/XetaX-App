import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAsync } from '@/lib/use-async';
import { dashboard, desk, notifications, tasks } from '@/services';
import { useAuth } from '@/state/auth';
import { Avatar, Caption, Card, ErrorState, H2, Loading, Muted, Pill, Screen, SectionTitle, StatTile } from '@/ui';
import { colors, formatDate, hueFor, radius, space } from '@/ui/theme';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tick, setTick] = useState(0);
  const summary = useAsync(() => dashboard.summary(), [tick]);
  const openTasks = useAsync(() => tasks.mine('OPEN'), [tick]);
  const badge = useAsync(() => desk.badge().catch(() => ({ open: 0, mine: 0, enabled: false })), [tick]);
  const feed = useAsync(() => notifications.feed().catch(() => ({ unread: 0, items: [] })), [tick]);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const s = summary.data;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dueToday = (openTasks.data || []).filter((t) => t.dueAt && new Date(t.dueAt).toDateString() === new Date().toDateString());

  return (
    <Screen padded={false} refreshing={summary.loading && !!s} onRefresh={refresh}>
      <View style={[styles.header, { paddingTop: insets.top + space.md }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Avatar name={user?.name} size={44} color="rgba(255,255,255,0.22)" />
          <View style={{ flex: 1, marginLeft: space.md }}>
            <Text style={styles.greet}>{greeting},</Text>
            <Text style={styles.name} numberOfLines={1}>{user?.name?.split(' ')[0] || 'there'} 👋</Text>
          </View>
          <Pressable onPress={() => router.push('/notifications')} style={styles.bell} hitSlop={8}>
            <Ionicons name="notifications-outline" size={22} color="#fff" />
            {(feed.data?.unread || 0) > 0 ? <View style={styles.dot}><Text style={styles.dotText}>{Math.min(feed.data.unread, 99)}</Text></View> : null}
          </Pressable>
        </View>
        {user?.company ? <Caption style={{ color: 'rgba(255,255,255,0.75)', marginTop: space.sm }}>{user.company}</Caption> : null}
      </View>

      <View style={styles.body}>
        {summary.error && !s ? <ErrorState message={summary.error} onRetry={refresh} /> : null}
        {summary.loading && !s ? <Loading /> : null}

        {s ?
        <>
            <View style={styles.grid}>
              <StatTile label="Records" value={s.records} icon="albums-outline" onPress={() => router.push('/(tabs)/records')} />
              <StatTile label="This week" value={s.recordsThisWeek} icon="trending-up-outline" tone="success" />
              <StatTile label="Contacts" value={s.contacts} icon="people-outline" tone="info" onPress={() => router.push('/contacts')} />
              <StatTile label="Open tasks" value={openTasks.data?.length ?? '…'} icon="checkbox-outline" tone="warning" onPress={() => router.push('/(tabs)/tasks')} />
            </View>

            {badge.data?.enabled && (badge.data.open > 0 || badge.data.mine > 0) ?
          <Card onPress={() => router.push('/(tabs)/inbox')} style={styles.alert}>
                <Ionicons name="headset-outline" size={22} color={colors.warning} />
                <View style={{ flex: 1, marginLeft: space.md }}>
                  <Text style={styles.alertTitle}>{badge.data.open > 0 ? `${badge.data.open} customer${badge.data.open > 1 ? 's' : ''} waiting for a person` : `${badge.data.mine} chat${badge.data.mine > 1 ? 's' : ''} with you`}</Text>
                  <Muted>Open the inbox to reply</Muted>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.text3} />
              </Card> :
          null}

            {dueToday.length ?
          <>
                <SectionTitle title="Due today" action="All tasks" onAction={() => router.push('/(tabs)/tasks')} />
                <Card style={{ padding: 0 }}>
                  {dueToday.slice(0, 4).map((t, i) =>
              <Pressable key={t.id} onPress={() => router.push('/(tabs)/tasks')} style={[styles.taskRow, i > 0 && styles.sep]}>
                      <Ionicons name="ellipse-outline" size={18} color={colors.warning} />
                      <Text style={styles.taskTitle} numberOfLines={1}>{t.title}</Text>
                      {t.linkedName ? <Caption>{t.linkedName}</Caption> : null}
                    </Pressable>
              )}
                </Card>
              </> :
          null}

            <SectionTitle title="Pipelines" action="Records" onAction={() => router.push('/(tabs)/records')} />
            {s.pipelines.length === 0 ?
          <Card><Muted>No forms yet — create your first form in the web panel to start capturing records.</Muted></Card> :
          s.pipelines.map((p) => {
            const max = Math.max(1, ...p.stages.map((x) => x.count));
            return (
              <Card key={p.formId} onPress={() => router.push({ pathname: '/records/[slug]', params: { slug: String(p.formId), name: p.formName, formId: String(p.formId) } })}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: space.sm }}>
                    <View style={[styles.formDot, { backgroundColor: p.color || colors.brand }]} />
                    <H2 style={{ fontSize: 16, flex: 1 }}>{p.formName}</H2>
                    <Pill text={`${p.records} records`} tone="muted" small />
                  </View>
                  {p.stages.map((st) =>
                <View key={st.name} style={styles.stageRow}>
                      <Caption style={{ width: 96 }}>{st.name}</Caption>
                      <View style={styles.bar}><View style={[styles.barFill, { width: `${Math.round(st.count / max * 100)}%`, backgroundColor: st.color || hueFor(st.name).fg }]} /></View>
                      <Caption style={{ width: 28, textAlign: 'right' }}>{st.count}</Caption>
                    </View>
                )}
                </Card>);

          })}

            {s.recent.length ?
          <>
                <SectionTitle title="Recent records" />
                <Card style={{ padding: 0 }}>
                  {s.recent.slice(0, 6).map((r, i) =>
              <Pressable key={r.recordId} onPress={() => router.push({ pathname: '/record/[id]', params: { id: r.recordId, formId: String(r.formId) } })} style={[styles.taskRow, i > 0 && styles.sep]}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.taskTitle} numberOfLines={1}>{r.title || 'Untitled'}</Text>
                        <Caption>{r.formName} · {formatDate(r.createdAt)}</Caption>
                      </View>
                      {r.stageName ? <Pill text={r.stageName} small /> : null}
                    </Pressable>
              )}
                </Card>
              </> :
          null}

            <View style={styles.quick}>
              <QuickAction icon="sparkles-outline" label="Ask AI" onPress={() => router.push('/ai')} />
              <QuickAction icon="add-circle-outline" label="New task" onPress={() => router.push('/task/new')} />
              <QuickAction icon="chatbubbles-outline" label="Inbox" onPress={() => router.push('/(tabs)/inbox')} />
            </View>
          </> :
        null}
      </View>
    </Screen>);

}

function QuickAction({ icon, label, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.quickBtn}>
      <Ionicons name={icon} size={22} color={colors.brand} />
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>);

}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.brand, paddingHorizontal: space.lg, paddingBottom: space.xl + 12, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  greet: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  name: { color: '#fff', fontSize: 22, fontWeight: '800' },
  bell: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', top: -2, right: -2, backgroundColor: colors.danger, borderRadius: 9, minWidth: 18, height: 18, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  dotText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  body: { paddingHorizontal: space.lg, marginTop: -space.xl, paddingBottom: space.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginBottom: space.md },
  alert: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.warningSoft, borderColor: '#F5D9A8' },
  alertTitle: { fontWeight: '700', color: colors.text },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: space.lg, paddingVertical: 12 },
  sep: { borderTopWidth: 1, borderTopColor: colors.border },
  taskTitle: { flex: 1, color: colors.text, fontSize: 14.5, fontWeight: '600' },
  formDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  bar: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  quick: { flexDirection: 'row', gap: space.md, marginTop: space.lg },
  quickBtn: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingVertical: space.md, alignItems: 'center', gap: 6 },
  quickLabel: { fontSize: 12.5, fontWeight: '600', color: colors.text2 }
});
