import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { PANEL_URL } from '@/lib/config';
import { useAsync } from '@/lib/use-async';
import { flows } from '@/services';
import { useToast } from '@/state/toast';
import {
  Button, Caption, Card, Chip, Empty, ErrorState, Input, Loading, Muted, Pill, Screen, SectionTitle } from
'@/ui';
import { colors, formatDate, space } from '@/ui/theme';

const toneFor = (status) =>
status === 'PUBLISHED' ? 'success' :
status === 'DRAFT' ? 'muted' :
status === 'DEPRECATED' ? 'muted' : 'warning';

/**
 * WhatsApp Flows — the little forms a customer fills without leaving the chat.
 *
 * Building a Flow means picking a form, mapping fields and sometimes editing
 * raw JSON, which is a job for a keyboard. The app does the part you actually
 * need on the move: send a published Flow to someone, and read what came back.
 */
export default function FlowsScreen() {
  const toast = useToast();
  const [tick, setTick] = useState(0);
  const [tab, setTab] = useState('flows');
  const [sending, setSending] = useState(null);
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);

  const list = useAsync(() => flows.list(), [tick]);
  const answers = useAsync(() => flows.responses(null, 0, 30), [tick]);

  const rows = list.data || [];
  const published = rows.filter((f) => f.status === 'PUBLISHED');
  const submissions = answers.data?.content || [];

  const send = async () => {
    if (!phone.trim()) {toast.error('Enter the customer’s WhatsApp number');return;}
    setBusy(true);
    try {
      await flows.send({
        flowId: sending.id,
        phone: phone.trim(),
        bodyText: 'Please fill this in so we can help you faster.',
        ctaText: 'Open form'
      });
      toast.success('Flow sent', sending.name);
      setSending(null);
      setPhone('');
      setTick((t) => t + 1);
    } catch (e) {
      toast.error(e?.message || 'Could not send the Flow');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      refreshing={list.loading && !!list.data}
      onRefresh={() => setTick((t) => t + 1)}>

      <View style={styles.tabs}>
        <Chip text={`Flows${rows.length ? ` (${rows.length})` : ''}`} active={tab === 'flows'} onPress={() => setTab('flows')} />
        <Chip text={`Submissions${submissions.length ? ` (${submissions.length})` : ''}`} active={tab === 'answers'} onPress={() => setTab('answers')} />
      </View>

      {/* ------------------------------------------------------- send sheet */}
      {sending ?
      <Card style={styles.sendBox}>
          <Text style={styles.sendTitle}>Send “{sending.name}”</Text>
          <Muted>The customer taps a button and fills the form inside WhatsApp.</Muted>
          <Input
          label="Customer's WhatsApp number"
          value={phone}
          onChangeText={setPhone}
          placeholder="919876543210"
          keyboardType="phone-pad" />

          <Caption style={{ marginBottom: space.sm }}>
            Works only if they messaged you in the last 24 hours. Outside that
            window, send a template with a Flow button from the web panel.
          </Caption>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Button title="Cancel" variant="secondary" onPress={() => setSending(null)} style={{ flex: 1 }} />
            <Button title="Send" icon="paper-plane-outline" onPress={send} loading={busy} style={{ flex: 1.3 }} />
          </View>
        </Card> :
      null}

      {/* ------------------------------------------------------------ flows */}
      {tab === 'flows' ?
      <>
          {list.loading && !list.data ? <Loading /> : null}
          {list.error && !list.data ? <ErrorState message={list.error} onRetry={() => setTick((t) => t + 1)} /> : null}

          {list.data && rows.length === 0 ?
        <Empty
          icon="albums-outline"
          title="No Flows yet"
          text="A Flow asks your questions inside WhatsApp — name, budget, a date — and writes the answers straight into a record. Build one on the web panel." /> :

        null}

          {rows.map((flow) =>
        <Card key={flow.id} style={styles.row}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.name} numberOfLines={1}>{flow.name}</Text>
                <Caption numberOfLines={1}>
                  {(flow.category || '').replace('_', ' ').toLowerCase()}
                  {flow.publishedAt ? ` · published ${formatDate(flow.publishedAt)}` : ''}
                </Caption>
                {flow.lastError ?
            <Caption numberOfLines={2} style={{ color: colors.danger }}>{flow.lastError}</Caption> :
            null}
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Pill text={flow.status} tone={toneFor(flow.status)} small />
                {flow.status === 'PUBLISHED' ?
            <Pressable onPress={() => setSending(flow)} hitSlop={6}>
                    <Text style={styles.sendLink}>Send</Text>
                  </Pressable> :
            null}
              </View>
            </Card>
        )}

          {rows.length && !published.length ?
        <Caption style={{ textAlign: 'center', marginTop: space.sm }}>
              Publish a Flow on the web panel before you can send it.
            </Caption> :
        null}
        </> :
      null}

      {/* ------------------------------------------------------ submissions */}
      {tab === 'answers' ?
      <>
          {answers.loading && !answers.data ? <Loading /> : null}
          {answers.data && submissions.length === 0 ?
        <Empty
          icon="document-text-outline"
          title="Nothing submitted yet"
          text="Answers appear here the moment a customer taps Submit in WhatsApp." /> :

        null}

          {submissions.map((row) =>
        <Card key={row.id}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.sm }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.name} numberOfLines={1}>{row.customerPhone || 'Unknown number'}</Text>
                  <Caption numberOfLines={1}>{row.flowName || 'Flow'} · {formatDate(row.submittedAt, true)}</Caption>
                </View>
                {row.recordId ?
            <Pill text="Record created" tone="success" small /> :
            <Pill text="Kept" tone="muted" small />}
              </View>

              <View style={{ marginTop: space.sm, gap: 2 }}>
                {Object.entries(row.answers || {}).map(([key, value]) =>
            <Text key={key} style={styles.answer}>
                    <Text style={styles.answerKey}>{key}: </Text>{String(value)}
                  </Text>
            )}
                {!Object.keys(row.answers || {}).length ?
            <Muted>Waiting for the customer to submit.</Muted> :
            null}
              </View>

              {row.note && !row.recordId ? <Caption style={{ marginTop: 6 }}>{row.note}</Caption> : null}
            </Card>
        )}
        </> :
      null}

      <SectionTitle title="Building a Flow" />
      <Card>
        <Muted>
          Flows are built from a form you already have, so the questions and the
          fields they land in stay in step. That part lives on the web panel.
        </Muted>
        <Pressable onPress={() => Linking.openURL(`${PANEL_URL}/app/whatsapp/flows`)} hitSlop={6}>
          <Text style={styles.link}>
            <Ionicons name="open-outline" size={13} /> Open Flows on the web panel
          </Text>
        </Pressable>
      </Card>
    </Screen>);

}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 8, marginBottom: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  sendBox: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  sendTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 2 },
  sendLink: { color: colors.brand, fontWeight: '700', fontSize: 13 },
  answer: { fontSize: 13.5, color: colors.text, lineHeight: 19 },
  answerKey: { color: colors.text3 },
  link: { color: colors.brand, fontWeight: '600', marginTop: 8 }
});
