import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAsync } from '@/lib/use-async';
import { campaigns } from '@/services';
import { Caption, Card, Empty, ErrorState, Loading, Muted, Pill, Screen } from '@/ui';
import { colors, formatDate, space } from '@/ui/theme';

export const campaignTone = (s) =>
s === 'COMPLETED' ? 'success' :
s === 'RUNNING' ? 'info' :
s === 'PARTIAL' ? 'warning' :
s === 'FAILED' || s === 'CANCELLED' ? 'danger' :
s === 'SCHEDULED' ? 'brand' : 'muted';

/** Sent and failed are the two that add up to the audience; the rest are stages. */
export function deliveredPct(c) {
  if (!c?.sentCount) return null;
  return Math.round(c.deliveredCount / c.sentCount * 100);
}

export default function CampaignsScreen() {
  const router = useRouter();
  const [tick, setTick] = useState(0);
  const list = useAsync(() => campaigns.list(0, 30), [tick]);
  const rows = list.data?.content || [];

  return (
    <Screen refreshing={list.loading && !!list.data} onRefresh={() => setTick((t) => t + 1)}>
      {list.loading && !list.data ? <Loading text="Loading campaigns…" /> : null}
      {list.error && !list.data ? <ErrorState message={list.error} onRetry={() => setTick((t) => t + 1)} /> : null}

      {list.data && rows.length === 0 ?
      <Empty icon="megaphone-outline" title="No campaigns yet" text="A campaign is built on the web panel — pick the audience, pick the template, send. It shows here so you can watch it go out." /> :
      null}

      {rows.map((c) =>
      <Card
        key={c.id}
        onPress={() => router.push({ pathname: '/campaign/[id]', params: { id: String(c.id) } })}
        style={styles.card}>

          <View style={styles.head}>
            <Text style={styles.name} numberOfLines={1}>{c.name}</Text>
            <Pill text={c.status} tone={campaignTone(c.status)} small />
          </View>
          {c.targetDescription ? <Caption numberOfLines={2}>{c.targetDescription}</Caption> : null}

          <View style={styles.figures}>
            <Figure label="Audience" value={c.totalCount} />
            <Figure label="Sent" value={c.sentCount} />
            <Figure label="Delivered" value={c.deliveredCount} />
            <Figure label="Failed" value={c.failedCount} tone={c.failedCount ? 'danger' : undefined} />
          </View>

          <Muted style={{ marginTop: space.xs }}>
            {c.startedAt ? `Started ${formatDate(c.startedAt, true)}` : `Created ${formatDate(c.createdAt)}`}
          </Muted>
        </Card>
      )}
    </Screen>);

}

export function Figure({ label, value, tone }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={[styles.figure, tone === 'danger' && { color: colors.danger }]}>{value ?? 0}</Text>
      <Caption>{label}</Caption>
    </View>);

}

const styles = StyleSheet.create({
  card: { gap: space.xs },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  name: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  figures: { flexDirection: 'row', marginTop: space.sm, paddingTop: space.sm, borderTopWidth: 1, borderTopColor: colors.border },
  figure: { fontSize: 17, fontWeight: '800', color: colors.text }
});
