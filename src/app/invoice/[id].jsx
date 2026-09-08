import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { useAsync } from '@/lib/use-async';
import { invoices } from '@/services';
import { Button, Caption, Card, ErrorState, KeyValue, Loading, Muted, Pill, Screen, SectionTitle } from '@/ui';
import { colors, formatDate, formatMoney, space } from '@/ui/theme';

import { toneFor } from '../invoices';

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams();
  const inv = useAsync(() => invoices.get(Number(id)), [id]);
  const d = inv.data;
  const balance = d ? Math.max(0, (d.total || 0) - (d.amountPaid || 0)) : 0;

  return (
    <Screen>
      <Stack.Screen options={{ title: d?.number || 'Invoice' }} />
      {inv.loading && !d ? <Loading /> : null}
      {inv.error && !d ? <ErrorState message={inv.error} /> : null}
      {d ?
      <>
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View><Text style={styles.cust}>{d.customerName}</Text>{d.customerPhone ? <Muted>{d.customerPhone}</Muted> : null}</View>
              <Pill text={d.status} tone={toneFor(d.status)} />
            </View>
            <View style={styles.totals}>
              <View><Caption>Total</Caption><Text style={styles.big}>{formatMoney(d.total)}</Text></View>
              <View><Caption>Paid</Caption><Text style={[styles.big, { color: colors.success }]}>{formatMoney(d.amountPaid)}</Text></View>
              <View><Caption>Balance</Caption><Text style={[styles.big, balance > 0 && { color: colors.warning }]}>{formatMoney(balance)}</Text></View>
            </View>
            <Caption>Issued {formatDate(d.issueDate)}{d.dueDate ? ` · Due ${formatDate(d.dueDate)}` : ''}</Caption>
          </Card>

          <SectionTitle title="Items" />
          <Card>
            {(d.items || []).map((it, i) =>
          <View key={i} style={[styles.item, i > 0 && styles.sep]}>
                <View style={{ flex: 1 }}><Text style={{ color: colors.text, fontWeight: '600' }}>{it.description}</Text><Caption>{it.qty} {it.unit || ''} × {formatMoney(it.rate)}</Caption></View>
                <Text style={{ color: colors.text, fontWeight: '700' }}>{formatMoney(it.amount)}</Text>
              </View>
          )}
            <View style={{ marginTop: space.md }}>
              <KeyValue label="Subtotal" value={formatMoney(d.subtotal)} />
              <KeyValue label={`GST ${d.taxPercent || 0}%`} value={formatMoney(d.taxAmount)} />
              {d.discount ? <KeyValue label="Discount" value={'-' + formatMoney(d.discount)} /> : null}
              <KeyValue label="Total" value={formatMoney(d.total)} last />
            </View>
          </Card>
          {d.notes ? <Card><Caption>NOTES</Caption><Muted>{d.notes}</Muted></Card> : null}

          <Button title="Open PDF" icon="document-outline" variant="secondary" onPress={() => Linking.openURL(invoices.pdfUrl(d.id))} style={{ marginTop: space.md }} />
          {d.customerPhone ? <Button title="Share on WhatsApp" icon="logo-whatsapp" variant="success" onPress={() => Linking.openURL(`https://wa.me/${d.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Invoice ${d.number} — ${formatMoney(d.total)}. Thank you!`)}`)} style={{ marginTop: space.sm }} /> : null}
          <Caption style={{ textAlign: 'center', marginTop: space.md }}>Payments and edits are recorded from the web panel.</Caption>
        </> :
      null}
    </Screen>);

}

const styles = StyleSheet.create({
  cust: { fontSize: 17, fontWeight: '800', color: colors.text },
  totals: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: space.md },
  big: { fontSize: 18, fontWeight: '800', color: colors.text },
  item: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 8 },
  sep: { borderTopWidth: 1, borderTopColor: colors.border }
});
