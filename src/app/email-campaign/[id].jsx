import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';

import { useAsync } from '@/lib/use-async';
import { emailCampaigns } from '@/services';
import { useToast } from '@/state/toast';
import { Button, Caption, Card, Chip, ErrorState, Loading, Muted, Pill, Screen, SectionTitle, StatTile } from '@/ui';
import { colors, formatDate, space } from '@/ui/theme';

import { progressOf, toneFor } from '../email-campaigns';

const FILTERS = ['', 'PENDING', 'QUEUED', 'SENT', 'FAILED'];

/** Yes/no prompt that also works on web, where Alert has no buttons. */
function confirm(title, message, okText, onOk, destructive = false) {
  if (Platform.OS === 'web') {if (window.confirm(`${title}\n\n${message}`)) onOk();return;}
  Alert.alert(title, message, [
  { text: 'Cancel', style: 'cancel' },
  { text: okText, style: destructive ? 'destructive' : 'default', onPress: onOk }]
  );
}

/** Live campaign view — counters refresh every 5s while it runs. */
export default function EmailCampaignDetailScreen() {
  const { id } = useLocalSearchParams();
  const toast = useToast();
  const [tick, setTick] = useState(0);
  const [filter, setFilter] = useState('');
  const [busy, setBusy] = useState(false);
  const campaign = useAsync(() => emailCampaigns.get(Number(id)), [id, tick]);
  const recipients = useAsync(() => emailCampaigns.recipients(Number(id), filter), [id, filter, tick]);
  const c = campaign.data;

  useEffect(() => {
    if (c?.status !== 'RUNNING') return undefined;
    const t = setInterval(() => setTick((n) => n + 1), 5000);
    return () => clearInterval(t);
  }, [c?.status]);

  const act = async (fn, okMessage) => {
    setBusy(true);
    try {
      const updated = await fn();
      campaign.setData(updated);
      toast.success(okMessage);
      setTick((n) => n + 1);
    } catch (e) {toast.error(e?.message || 'Could not update the campaign');} finally
    {setBusy(false);}
  };

  const start = () => confirm('Start this campaign?', `${c.totalCount} emails will be queued for sending from your own address.`, 'Start sending', () => act(() => emailCampaigns.start(c.id), 'Campaign started'));
  const cancel = () => confirm('Cancel this campaign?', 'Recipients not yet sent will be skipped.', 'Cancel campaign', () => act(() => emailCampaigns.cancel(c.id), 'Campaign cancelled'), true);

  const canCancel = c && ['RUNNING', 'QUEUED', 'PAUSED', 'SCHEDULED'].includes(c.status);

  return (
    <Screen
      refreshing={campaign.loading && !!c}
      onRefresh={() => setTick((n) => n + 1)}
      footer={c ?
      <View style={{ flexDirection: 'row', gap: space.sm }}>
            {c.status === 'DRAFT' ? <Button title="Start sending" icon="paper-plane-outline" onPress={start} loading={busy} style={{ flex: 1 }} /> : null}
            {c.status === 'RUNNING' ? <Button title="Pause" icon="pause" variant="secondary" onPress={() => act(() => emailCampaigns.pause(c.id), 'Campaign paused')} loading={busy} style={{ flex: 1 }} /> : null}
            {c.status === 'PAUSED' ? <Button title="Resume" icon="play" onPress={() => act(() => emailCampaigns.resume(c.id), 'Campaign resumed')} loading={busy} style={{ flex: 1 }} /> : null}
            {canCancel ? <Button title="Cancel" icon="close" variant="danger" onPress={cancel} disabled={busy} style={{ flex: 1 }} /> : null}
          </View> :
      undefined}>

      <Stack.Screen options={{ title: c?.name || 'Campaign' }} />
      {campaign.loading && !c ? <Loading /> : null}
      {campaign.error && !c ? <ErrorState message={campaign.error} onRetry={() => setTick((n) => n + 1)} /> : null}
      {c ?
      <>
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.name}>{c.name}</Text>
                <Muted numberOfLines={2}>{c.targetDescription || c.sourceType}</Muted>
              </View>
              <Pill text={c.status} tone={toneFor(c.status)} />
            </View>
            {c.status === 'RUNNING' || c.status === 'QUEUED' ?
          <View style={styles.bar}><View style={[styles.fill, { width: `${progressOf(c)}%` }]} /></View> :
          null}
            <Caption style={{ marginTop: space.sm }}>
              {c.status === 'SCHEDULED' && c.scheduledAt ? `Scheduled for ${formatDate(c.scheduledAt, true)}` :
            c.startedAt ? `Started ${formatDate(c.startedAt, true)}${c.completedAt ? ` · finished ${formatDate(c.completedAt, true)}` : ''}` :
            `Created ${formatDate(c.createdAt)}`}
            </Caption>
          </Card>

          <View style={styles.stats}>
            <StatTile label="Recipients" value={String(c.totalCount)} icon="people-outline" />
            <StatTile label="Sent" value={String(c.sentCount)} icon="paper-plane-outline" tone="success" />
            <StatTile label="Failed" value={String(c.failedCount)} icon="alert-circle-outline" tone={c.failedCount ? 'danger' : 'brand'} />
          </View>

          <SectionTitle title="Email" />
          <Card>
            <Caption>SUBJECT</Caption>
            <Text style={styles.subject}>{c.subject}</Text>
            <Caption style={{ marginTop: space.sm }}>MESSAGE</Caption>
            <Text style={styles.body} selectable>{c.body}</Text>
          </Card>

          <SectionTitle title="Recipients" />
          <View style={styles.chips}>
            {FILTERS.map((f) => <Chip key={f || 'all'} text={f || 'All'} active={filter === f} onPress={() => setFilter(f)} />)}
          </View>
          <Card style={{ padding: 0 }}>
            {recipients.loading && !recipients.data ? <Loading text="Loading recipients…" /> : null}
            {(recipients.data?.content || []).map((r, i) =>
          <View key={r.id} style={[styles.rcpt, i > 0 && styles.sep]}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.email} numberOfLines={1}>{r.email}</Text>
                  {r.error ? <Caption numberOfLines={2} style={{ color: colors.danger }}>{r.error}</Caption> : null}
                </View>
                <Pill text={r.status} tone={toneFor(r.status === 'SENT' ? 'COMPLETED' : r.status)} small />
              </View>
          )}
            {recipients.data && (recipients.data.content || []).length === 0 ?
          <Muted style={{ padding: space.md, textAlign: 'center' }}>No recipients in this view.</Muted> :
          null}
          </Card>
          <Caption style={{ textAlign: 'center', marginTop: space.md }}>Emails go out from your own address at 60 per minute; each one is also logged on the customer's contact page.</Caption>
        </> :
      null}
    </Screen>);

}

const styles = StyleSheet.create({
  name: { fontSize: 17, fontWeight: '800', color: colors.text },
  bar: { height: 6, borderRadius: 3, backgroundColor: colors.surfaceAlt, marginTop: space.md, overflow: 'hidden' },
  fill: { height: 6, backgroundColor: colors.brand },
  stats: { flexDirection: 'row', gap: space.md, marginTop: space.md },
  subject: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 2 },
  body: { fontSize: 14, color: colors.text, lineHeight: 20, marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: space.sm },
  rcpt: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.md, paddingVertical: 10 },
  sep: { borderTopWidth: 1, borderTopColor: colors.border },
  email: { fontSize: 14, color: colors.text }
});
