import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Linking, Platform, StyleSheet, Text, View } from 'react-native';

import { useAsync } from '@/lib/use-async';
import { booking } from '@/services';
import { useToast } from '@/state/toast';
import { Caption, Card, Empty, ErrorState, Loading, Muted, Pill, Screen, SectionTitle } from '@/ui';
import { colors, formatDate, radius, space } from '@/ui/theme';

const toneFor = (status) =>
status === 'BOOKED' ? 'success' : status === 'BLOCKED' ? 'warning' : status === 'CANCELLED' ? 'danger' : 'muted';

/** Day heading: "Today", "Tomorrow", else the date. */
function dayLabel(iso) {
  const today = new Date();
  const d = new Date(iso + 'T00:00:00');
  const diff = Math.round((d - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return formatDate(iso);
}

/**
 * Who is coming, and when.
 *
 * <p>Setting up staff and opening hours is desk work and stays on the web
 * panel. On a phone the useful thing is the next few days at a glance, and the
 * ability to free a slot when someone calls to cancel.
 */
export default function BookingsScreen() {
  const toast = useToast();
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(null);

  const overview = useAsync(() => booking.overview(), [tick]);
  const page = overview.data?.page;
  const slots = overview.data?.slots || [];

  const booked = slots.filter((s) => s.status === 'BOOKED');

  // Only the days that actually have something on them, in order.
  const days = [...new Set(slots.map((s) => s.date))].sort();

  const cancel = (slot) => {
    const run = async () => {
      setBusy(slot.id);
      try {
        await booking.cancel(slot.id);
        // The CRM record the booking created stays; only the slot is freed.
        toast.success('Booking cancelled, the slot is free again');
        setTick((t) => t + 1);
      } catch (e) {
        toast.error(String(e?.message || 'Could not cancel the booking'));
      } finally {
        setBusy(null);
      }
    };
    if (Platform.OS === 'web') {run();return;}
    Alert.alert('Cancel this booking?',
    `${slot.customerName || 'This appointment'} · ${dayLabel(slot.date)} ${slot.time}`,
    [{ text: 'Keep it', style: 'cancel' }, { text: 'Cancel booking', style: 'destructive', onPress: run }]);
  };

  const share = () => {
    if (!page?.publicUrl) return;
    if (Platform.OS === 'web') {Linking.openURL(page.publicUrl);return;}
    Alert.alert('Your booking link', page.publicUrl, [
    { text: 'Close', style: 'cancel' },
    { text: 'Open', onPress: () => Linking.openURL(page.publicUrl) }]
    );
  };

  return (
    <Screen refreshing={overview.loading && !!overview.data} onRefresh={() => setTick((t) => t + 1)}>
      {overview.loading && !overview.data ? <Loading text="Loading the diary…" /> : null}
      {overview.error && !overview.data ? <ErrorState message={overview.error} onRetry={() => setTick((t) => t + 1)} /> : null}

      {page ?
      <Card onPress={share} style={styles.page}>
          <View style={styles.qr}><Ionicons name="calendar-outline" size={22} color={colors.brand} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{page.title || 'Bookings'}</Text>
            <Muted numberOfLines={1}>{page.publicUrl || 'Not published yet'}</Muted>
          </View>
          <Pill text={page.enabled ? 'LIVE' : 'OFF'} tone={page.enabled ? 'success' : 'muted'} small />
        </Card> :
      null}

      {overview.data ?
      <Card style={styles.summary}>
          <View style={{ flex: 1 }}>
            <Text style={styles.big}>{booked.length}</Text>
            <Caption>Booked, next 14 days</Caption>
          </View>
          <View style={styles.sep} />
          <View style={{ flex: 1 }}>
            <Text style={styles.big}>{slots.length - booked.length}</Text>
            <Caption>Still open</Caption>
          </View>
        </Card> :
      null}

      {overview.data && slots.length === 0 ?
      <Empty icon="calendar-outline" title="Nothing booked yet" text="Open slots are created on the web panel. Once your page is live, bookings land here." /> :
      null}

      {days.map((day) =>
      <View key={day}>
          <SectionTitle title={dayLabel(day)} />
          {slots.filter((s) => s.date === day).map((slot) =>
        <Card key={slot.id} style={styles.slot}>
              <View style={styles.time}>
                <Text style={styles.timeText}>{slot.time}</Text>
                <Caption>{slot.durationMinutes}m</Caption>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{slot.customerName || 'Open slot'}</Text>
                <Caption numberOfLines={1}>
                  {[slot.service, slot.staffName, slot.customerPhone].filter(Boolean).join(' · ') || 'Nobody booked yet'}
                </Caption>
              </View>
              <View style={{ alignItems: 'flex-end', gap: space.sm }}>
                <Pill text={slot.status} tone={toneFor(slot.status)} small />
                {slot.status === 'BOOKED' ?
            <Text
              suppressHighlighting
              onPress={() => busy !== slot.id && cancel(slot)}
              style={[styles.cancel, busy === slot.id && { opacity: 0.4 }]}>
                    Cancel
                  </Text> :
            null}
              </View>
            </Card>
        )}
        </View>
      )}
    </Screen>);

}

const styles = StyleSheet.create({
  page: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  qr: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brandSoft },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  summary: { flexDirection: 'row', alignItems: 'center' },
  sep: { width: 1, alignSelf: 'stretch', backgroundColor: colors.border, marginHorizontal: space.md },
  big: { fontSize: 24, fontWeight: '800', color: colors.text },
  slot: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  time: { width: 62 },
  timeText: { fontSize: 15, fontWeight: '700', color: colors.text },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  cancel: { fontSize: 12, fontWeight: '700', color: colors.danger }
});
