import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAsync } from '@/lib/use-async';
import { campaigns } from '@/services';
import { useToast } from '@/state/toast';
import { Button, Caption, Card, Chip, Empty, ErrorState, Loading, Muted, Pill, Screen, SectionTitle, StatTile } from '@/ui';
import { colors, formatDate, space } from '@/ui/theme';
import { campaignTone } from '../campaigns';

const FILTERS = ['ALL', 'SENT', 'DELIVERED', 'READ', 'FAILED'];

const recipientTone = (s) =>
s === 'READ' || s === 'DELIVERED' ? 'success' :
s === 'SENT' ? 'info' :
s === 'FAILED' ? 'danger' :
s === 'QUEUED' ? 'warning' : 'muted';

export default function CampaignDetailScreen() {
  const { id } = useLocalSearchParams();
  const toast = useToast();
  const [tick, setTick] = useState(0);
  const [filter, setFilter] = useState('ALL');
  const [busy, setBusy] = useState(false);

  const detail = useAsync(() => campaigns.get(id), [id, tick]);
  const people = useAsync(() => campaigns.recipients(id, filter === 'ALL' ? null : filter), [id, filter, tick]);

  const c = detail.data;
  const rows = people.data?.content || [];

  const act = async (what, run) => {
    setBusy(true);
    try {
      await run();
      toast.success(what);
      setTick((t) => t + 1);
    } catch (e) {
      toast.error(String(e?.message || 'That did not work'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen refreshing={detail.loading && !!detail.data} onRefresh={() => setTick((t) => t + 1)}>
      <Stack.Screen options={{ title: c?.name || 'Campaign' }} />

      {detail.loading && !detail.data ? <Loading /> : null}
      {detail.error && !detail.data ? <ErrorState message={detail.error} onRetry={() => setTick((t) => t + 1)} /> : null}

      {c ?
      <>
          <Card style={{ gap: space.xs }}>
            <View style={styles.head}>
              <Text style={styles.name}>{c.name}</Text>
              <Pill text={c.status} tone={campaignTone(c.status)} small />
            </View>
            {c.targetDescription ? <Muted>{c.targetDescription}</Muted> : null}
            {c.templateName ? <Caption>Template {c.templateName}{c.templateLanguage ? ` (${c.templateLanguage})` : ''}</Caption> : null}
            <Caption>
              {c.startedAt ? `Started ${formatDate(c.startedAt, true)}` : `Created ${formatDate(c.createdAt)}`}
              {c.completedAt ? ` · Finished ${formatDate(c.completedAt, true)}` : ''}
            </Caption>
          </Card>

          {/* Sent and failed are the two that add up to the audience. Delivered
              and read are stages inside sent, so they are shown on their own
              row rather than beside it. */}
          <View style={styles.tiles}>
            <StatTile label="Audience" value={c.totalCount} icon="people-outline" />
            <StatTile label="Sent" value={c.sentCount} icon="paper-plane-outline" tone="info" />
            <StatTile label="Failed" value={c.failedCount} icon="close-circle-outline" tone={c.failedCount ? 'danger' : 'brand'} />
          </View>
          <View style={styles.tiles}>
            <StatTile label="Delivered" value={c.deliveredCount} icon="checkmark-done-outline" tone="success" />
            <StatTile label="Read" value={c.readCount} icon="eye-outline" tone="success" />
            <StatTile label="In queue" value={c.queuedCount} icon="time-outline" tone="warning" />
          </View>

          {c.status === 'RUNNING' || c.status === 'PAUSED' || c.status === 'SCHEDULED' ?
        <View style={styles.actions}>
              {c.status === 'RUNNING' ?
          <Button title="Pause" variant="secondary" style={{ flex: 1 }} disabled={busy} onPress={() => act('Campaign paused', () => campaigns.pause(c.id))} /> :
          null}
              {c.status === 'PAUSED' ?
          <Button title="Resume" style={{ flex: 1 }} disabled={busy} onPress={() => act('Campaign resumed', () => campaigns.resume(c.id))} /> :
          null}
              <Button title="Cancel" variant="danger" style={{ flex: 1 }} disabled={busy} onPress={() => act('Campaign cancelled', () => campaigns.cancel(c.id))} />
            </View> :
        null}

          <SectionTitle title="Recipients" />
          <View style={styles.filters}>
            {FILTERS.map((f) =>
          <Chip key={f} text={f === 'ALL' ? 'All' : f[0] + f.slice(1).toLowerCase()} active={filter === f} onPress={() => setFilter(f)} />
          )}
          </View>

          {people.loading && !people.data ? <Loading /> : null}
          {people.data && rows.length === 0 ?
        <Empty icon="people-outline" title="Nobody here" text={filter === 'ALL' ? 'This campaign has no recipients yet.' : `No recipient is ${filter.toLowerCase()}.`} /> :
        null}

          {rows.map((r) =>
        <Card key={r.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.phone}>{r.phone}</Text>
                {r.error ? <Caption numberOfLines={2} style={{ color: colors.danger }}>{r.error}</Caption> : null}
                {!r.error && r.attemptCount > 1 ? <Caption>{r.attemptCount} attempts</Caption> : null}
              </View>
              <Pill text={r.status} tone={recipientTone(r.status)} small />
            </Card>
        )}
        </> :
      null}
    </Screen>);

}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  name: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.text },
  tiles: { flexDirection: 'row', gap: space.md, marginTop: space.md },
  actions: { flexDirection: 'row', gap: space.md, marginTop: space.md },
  filters: { flexDirection: 'row', gap: space.sm, marginBottom: space.md, flexWrap: 'wrap' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  phone: { fontSize: 15, fontWeight: '600', color: colors.text }
});
