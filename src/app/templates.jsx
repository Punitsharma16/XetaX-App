import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAsync } from '@/lib/use-async';
import { whatsapp } from '@/services';
import { Caption, Card, Empty, ErrorState, Loading, Muted, Pill, Screen, SearchBar } from '@/ui';
import { colors, space } from '@/ui/theme';

/** The same colours the panel gives these states. */
export const templateTone = (status) => {
  const s = String(status || '').toUpperCase();
  if (s === 'APPROVED') return 'success';
  if (s === 'REJECTED') return 'danger';
  if (s === 'PAUSED') return 'warning';
  if (s === 'PENDING') return 'info';
  return 'muted';
};

/** What the panel calls it, in words rather than WhatsApp's shouting. */
export const templateStatusLabel = (status) => {
  const s = String(status || '').toUpperCase();
  if (s === 'APPROVED') return 'Approved';
  if (s === 'REJECTED') return 'Rejected';
  if (s === 'PAUSED') return 'Paused';
  if (s === 'PENDING') return 'In review';
  return status || 'Unknown';
};

/** The message body, read out of the components WhatsApp stores. */
export const templateBody = (template) => {
  try {
    const components = JSON.parse(template?.componentsJson || '[]');
    const body = (Array.isArray(components) ? components : [])
      .find((c) => String(c?.type || '').toUpperCase() === 'BODY');
    return body?.text || '';
  } catch {
    return '';
  }
};

/**
 * WhatsApp message templates — the only thing that reaches a customer outside
 * the 24-hour window, so knowing which are approved is worth a phone screen.
 *
 * <p>Read-only on purpose: writing one means a header, a body with variables,
 * example values and buttons, and a rejection costs a review cycle. That is
 * a desk job, so the app shows the state and the panel does the authoring.
 */
export default function TemplatesScreen() {
  const [tick, setTick] = useState(0);
  const [query, setQuery] = useState('');
  const list = useAsync(() => whatsapp.templates(), [tick]);

  const rows = useMemo(() => {
    const all = list.data || [];
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((t) =>
      String(t.name || '').toLowerCase().includes(q) ||
      templateBody(t).toLowerCase().includes(q));
  }, [list.data, query]);

  const approved = (list.data || []).filter((t) => String(t.status).toUpperCase() === 'APPROVED').length;

  return (
    <Screen refreshing={list.loading && !!list.data} onRefresh={() => setTick((t) => t + 1)}>

      {list.loading && !list.data ? <Loading /> : null}
      {list.error && !list.data ? <ErrorState message={list.error} onRetry={() => setTick((t) => t + 1)} /> : null}

      {list.data ?
        <Caption style={{ marginBottom: space.sm }}>
          {approved} of {list.data.length} approved · new templates and edits are made on the web panel
        </Caption> :
        null}

      {list.data && list.data.length > 0 ?
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search templates" /> :
        null}

      {list.data && list.data.length === 0 ?
        <Empty
          icon="document-text-outline"
          title="No templates yet"
          text="Templates are what let you message a customer after 24 hours. Create one on the web panel and it appears here once WhatsApp reviews it." /> :
        null}

      {list.data && list.data.length > 0 && rows.length === 0 ?
        <Empty icon="search-outline" title="Nothing matches" text="No template has that name or wording." /> :
        null}

      {rows.map((t) =>
        <Card key={t.id} style={styles.row}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.name} numberOfLines={1}>{t.name}</Text>
            {templateBody(t) ? <Muted numberOfLines={2}>{templateBody(t)}</Muted> : null}
            <Caption numberOfLines={1}>{t.language} · {t.category || 'Uncategorised'}</Caption>
            {String(t.status).toUpperCase() === 'REJECTED' && t.rejectionReason ?
              <Caption style={{ color: colors.danger }} numberOfLines={2}>{t.rejectionReason}</Caption> :
              null}
          </View>
          <Pill text={templateStatusLabel(t.status)} tone={templateTone(t.status)} small />
        </Card>
      )}
    </Screen>);

}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  name: { fontSize: 15, fontWeight: '700', color: colors.text }
});
