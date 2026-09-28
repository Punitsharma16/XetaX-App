import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAsync } from '@/lib/use-async';
import { whatsapp } from '@/services';
import { Caption, Card, ErrorState, KeyValue, Loading, Muted, Screen, SectionTitle, StatTile } from '@/ui';
import { colors, space } from '@/ui/theme';

/** What the panel calls each charge line. */
export const chargeLabel = (category) => ({
  MARKETING: 'Marketing',
  UTILITY: 'Utility',
  AUTHENTICATION: 'Authentication',
  SERVICE: 'Replies (service)'
})[category] || category;

export const rupees = (amount) =>
  '₹' + Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * What this month's WhatsApp messages cost.
 *
 * <p>Read-only, and deliberately says twice over where each number comes from:
 * one column is XetaX's own arithmetic over delivered messages, the other is
 * what WhatsApp itself reported. They are worth seeing together — from
 * 1 October 2026 a reply inside the 24-hour window starts being charged, and a
 * bill that grows for that reason should have something on screen explaining
 * it.
 */
export default function MessageCostsScreen() {
  const [tick, setTick] = useState(0);
  const usage = useAsync(() => whatsapp.usage(), [tick]);

  const data = usage.data || {};
  const estimate = data.estimate || {};
  const counts = data.counts || {};
  const lines = estimate.lines || [];

  return (
    <Screen refreshing={usage.loading && !!usage.data} onRefresh={() => setTick((t) => t + 1)}>

      {usage.loading && !usage.data ? <Loading /> : null}
      {usage.error && !usage.data ? <ErrorState message={usage.error} onRetry={() => setTick((t) => t + 1)} /> : null}

      {usage.data ?
        <>
          <View style={{ flexDirection: 'row', gap: space.md, marginBottom: space.md }}>
            <StatTile label="Estimated" value={rupees(estimate.total)} icon="calculator-outline" tone="brand" />
            <StatTile label="Delivered" value={String(counts.delivered ?? 0)} icon="checkmark-done-outline" tone="success" />
            <StatTile label="Failed" value={String(counts.failed ?? 0)} icon="alert-circle-outline"
              tone={counts.failed ? 'danger' : 'brand'} />
          </View>

          <SectionTitle>This month</SectionTitle>
          <Card>
            {lines.map((line, i) =>
              <KeyValue
                key={line.category}
                label={`${chargeLabel(line.category)} · ${line.messages} ${line.messages === 1 ? 'message' : 'messages'}`}
                value={rupees(line.amount)}
                last={i === lines.length - 1} />
            )}
          </Card>
          <Caption style={styles.note}>
            Delivered messages at WhatsApp&apos;s India rates, counted in {estimate.zone || 'Asia/Kolkata'}. Taxes not included.
          </Caption>

          {/* Free replies read differently on each side of the cutover: before
              it nothing is charged at all, after it only the first thousand. */}
          {estimate.serviceCharging === false && estimate.freeAllowance ?
            <Caption style={styles.note}>
              {estimate.freeAllowance} replies free — WhatsApp starts charging for these on{' '}
              {estimate.serviceChargingFrom}, after which {estimate.freeAllowanceLimit} a month stay free.
            </Caption> :
            null}
          {estimate.serviceCharging && estimate.freeAllowanceLimit ?
            <Caption style={styles.note}>
              {estimate.freeAllowance} of {estimate.freeAllowanceLimit} free replies used this month.
            </Caption> :
            null}

          <SectionTitle>What WhatsApp says</SectionTitle>
          <Card>
            {estimate.metaKnown ?
              <>
                <KeyValue label="Priced so far" value={`${estimate.metaKnown} of ${estimate.metaOutbound}`} />
                <KeyValue label="Billable" value={String(estimate.metaBillable ?? 0)} />
                <KeyValue label="Free" value={String(estimate.metaFree ?? 0)} last />
              </> :
              <Muted>WhatsApp has not priced this month&apos;s messages yet.</Muted>}
          </Card>

          {estimate.otherCountries ?
            <Caption style={styles.note}>
              {estimate.otherCountries} to numbers outside India — not included, only India has rates set.
            </Caption> :
            null}
          {estimate.awaitingDelivery ?
            <Caption style={styles.note}>
              {estimate.awaitingDelivery} sent but not delivered yet — charged once delivered.
            </Caption> :
            null}
          {estimate.unpriced ?
            <Caption style={[styles.note, { color: colors.warning }]}>
              {estimate.unpriced} messages have no rate set — not included.
            </Caption> :
            null}
        </> :
        null}
    </Screen>);

}

const styles = StyleSheet.create({
  note: { marginTop: space.xs, marginBottom: space.sm }
});
