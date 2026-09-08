import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAsync } from '@/lib/use-async';
import { invoices } from '@/services';
import { Caption, Card, Empty, ErrorState, Loading, Muted, Pill, Screen, StatTile } from '@/ui';
import { colors, formatDate, formatMoney, space } from '@/ui/theme';

export const toneFor = (s) => s === 'PAID' ? 'success' : s === 'PARTIAL' ? 'warning' : s === 'CANCELLED' ? 'muted' : s === 'SENT' ? 'info' : 'brand';

export default function InvoicesScreen() {
  const router = useRouter();
  const [tick, setTick] = useState(0);
  const list = useAsync(() => invoices.list(0, 50), [tick]);
  const rows = list.data?.content || [];
  const received = rows.reduce((s, i) => s + (i.amountPaid || 0), 0);
  const pending = rows.filter((i) => i.status !== 'CANCELLED').reduce((s, i) => s + Math.max(0, (i.total || 0) - (i.amountPaid || 0)), 0);

  return (
    <Screen refreshing={list.loading && !!list.data} onRefresh={() => setTick((t) => t + 1)}>
      {list.loading && !list.data ? <Loading /> : null}
      {list.error && !list.data ? <ErrorState message={list.error} onRetry={() => setTick((t) => t + 1)} /> : null}
      {list.data ?
      <View style={{ flexDirection: 'row', gap: space.md, marginBottom: space.md }}>
          <StatTile label="Received" value={formatMoney(received)} icon="checkmark-circle-outline" tone="success" />
          <StatTile label="Pending" value={formatMoney(pending)} icon="time-outline" tone="warning" />
        </View> :
      null}
      {list.data && rows.length === 0 ? <Empty icon="receipt-outline" title="No invoices yet" text="Invoices are raised from the web panel; they show here to track and share." /> : null}
      {rows.map((inv) => {
        const overdue = inv.dueDate && !['PAID', 'CANCELLED'].includes(inv.status) && new Date(inv.dueDate) < new Date();
        return (
          <Card key={inv.id} onPress={() => router.push({ pathname: '/invoice/[id]', params: { id: String(inv.id) } })} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.num}>{inv.number}</Text>
              <Muted numberOfLines={1}>{inv.customerName}</Muted>
              <Caption>Issued {formatDate(inv.issueDate)}{inv.dueDate ? ` · Due ${formatDate(inv.dueDate)}` : ''}</Caption>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Text style={styles.amt}>{formatMoney(inv.total)}</Text>
              <Pill text={overdue ? 'OVERDUE' : inv.status} tone={overdue ? 'danger' : toneFor(inv.status)} small />
            </View>
          </Card>);

      })}
    </Screen>);

}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  num: { fontSize: 15, fontWeight: '700', color: colors.text },
  amt: { fontSize: 15, fontWeight: '800', color: colors.text }
});
