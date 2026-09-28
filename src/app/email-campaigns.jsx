import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAsync } from '@/lib/use-async';
import { emailCampaigns } from '@/services';
import { Button, Caption, Card, Empty, ErrorState, Loading, Muted, Pill, Screen, StatTile } from '@/ui';
import { colors, formatDate, space } from '@/ui/theme';

/** Same colours the web panel uses for these statuses. */
export const toneFor = (s) =>
s === 'COMPLETED' ? 'success' :
s === 'RUNNING' ? 'brand' :
s === 'PARTIAL' || s === 'PAUSED' ? 'warning' :
s === 'FAILED' ? 'danger' :
s === 'CANCELLED' ? 'muted' :
s === 'SCHEDULED' || s === 'QUEUED' ? 'info' : 'muted';

export const progressOf = (c) => c?.totalCount ? Math.round((c.sentCount + c.failedCount) / c.totalCount * 100) : 0;

/**
 * Bulk email campaigns — sent from the workspace's own SMTP (Profile → Email
 * on the web panel). Mirrors /app/email-campaigns in the panel: the sender
 * notice, the list, and a shortcut to the wizard.
 */
export default function EmailCampaignsScreen() {
  const router = useRouter();
  const [tick, setTick] = useState(0);
  const list = useAsync(() => emailCampaigns.list(0, 50), [tick]);
  const sender = useAsync(() => emailCampaigns.status(), [tick]);
  const rows = list.data?.content || [];
  const sent = rows.reduce((s, c) => s + (c.sentCount || 0), 0);
  const failed = rows.reduce((s, c) => s + (c.failedCount || 0), 0);
  const running = rows.filter((c) => c.status === 'RUNNING' || c.status === 'SCHEDULED').length;

  return (
    <Screen
      refreshing={list.loading && !!list.data}
      onRefresh={() => setTick((t) => t + 1)}
      footer={<Button title="New campaign" icon="add" onPress={() => router.push('/email-campaign/new')} />}>

      {sender.data && !sender.data.configured ?
      <Card style={styles.notice}>
          <Ionicons name="warning-outline" size={20} color={colors.warning} />
          <View style={{ flex: 1 }}>
            <Text style={styles.noticeTitle}>No sender email yet</Text>
            <Muted>Campaigns go out from your own email account. Add it on the web panel under Profile → Email (SMTP) first.</Muted>
          </View>
        </Card> :
      sender.data?.fromEmail ?
      <Caption style={{ marginBottom: space.sm }}>
          <Ionicons name="mail-outline" size={12} color={colors.text3} /> Sending as {sender.data.fromEmail} · up to {sender.data.maxRecipients} per campaign
        </Caption> :
      null}

      {list.loading && !list.data ? <Loading /> : null}
      {list.error && !list.data ? <ErrorState message={list.error} onRetry={() => setTick((t) => t + 1)} /> : null}

      {list.data && rows.length > 0 ?
      <View style={{ flexDirection: 'row', gap: space.md, marginBottom: space.md }}>
          <StatTile label="Sent" value={String(sent)} icon="paper-plane-outline" tone="success" />
          <StatTile label="Failed" value={String(failed)} icon="alert-circle-outline" tone={failed ? 'danger' : 'brand'} />
          <StatTile label="Active" value={String(running)} icon="time-outline" tone="info" />
        </View> :
      null}

      {list.data && rows.length === 0 ?
      <Empty icon="mail-outline" title="No email campaigns yet" text="Email your records or all your contacts in one go — from your own address." /> :
      null}

      {rows.map((c) =>
      <Card key={c.id} onPress={() => router.push({ pathname: '/email-campaign/[id]', params: { id: String(c.id) } })} style={styles.row}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.name} numberOfLines={1}>{c.name}</Text>
            <Muted numberOfLines={1}>{c.subject}</Muted>
            <Caption numberOfLines={1}>{c.targetDescription || c.sourceType} · {formatDate(c.createdAt)}</Caption>
            <View style={styles.bar}><View style={[styles.fill, { width: `${progressOf(c)}%` }]} /></View>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Pill text={c.status} tone={toneFor(c.status)} small />
            <Caption>{c.sentCount + c.failedCount}/{c.totalCount}</Caption>
          </View>
        </Card>
      )}
    </Screen>);

}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  bar: { height: 4, borderRadius: 2, backgroundColor: colors.surfaceAlt, marginTop: 6, overflow: 'hidden' },
  fill: { height: 4, backgroundColor: colors.brand },
  notice: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start', backgroundColor: colors.warningSoft, borderColor: colors.warningSoft },
  noticeTitle: { fontWeight: '700', color: colors.text, marginBottom: 2 }
});
