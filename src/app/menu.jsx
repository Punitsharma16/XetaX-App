import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Linking, Platform, StyleSheet, Switch, Text, View } from 'react-native';

import { useAsync } from '@/lib/use-async';
import { menu } from '@/services';
import { useToast } from '@/state/toast';
import { Caption, Card, Chip, Empty, ErrorState, Loading, Muted, Pill, Screen, SectionTitle } from '@/ui';
import { colors, formatMoney, radius, space } from '@/ui/theme';

/**
 * The QR storefront, as much of it as belongs on a phone.
 *
 * <p>Building the menu is desk work and stays on the web panel. What an owner
 * needs standing in their own kitchen is the opposite: one tap to take a dish
 * off the menu when it runs out, and the link to put on a table. Those two are
 * the whole screen.
 */
export default function MenuScreen() {
  const toast = useToast();
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(null);
  const [filter, setFilter] = useState('all');

  const overview = useAsync(() => menu.overview(), [tick]);
  const store = overview.data?.store;
  const categories = overview.data?.categories || [];
  const items = overview.data?.items || [];

  const shown = items.filter((i) =>
  filter === 'all' ? true : filter === 'out' ? !i.available : i.available);

  const outCount = items.filter((i) => !i.available).length;

  const toggle = async (item) => {
    setBusy(item.id);
    try {
      await menu.updateItem(item.id, { available: !item.available });
      // Off the menu is not deleted — the item comes back with one more tap.
      toast.show(item.available ? `${item.name} is off the menu` : `${item.name} is back on`);
      setTick((t) => t + 1);
    } catch (e) {
      toast.error(String(e?.message || 'Could not update the item'));
    } finally {
      setBusy(null);
    }
  };

  const share = () => {
    if (!store?.menuUrl) return;
    if (Platform.OS === 'web') {Linking.openURL(store.menuUrl);return;}
    Alert.alert('Your menu link', store.menuUrl, [
    { text: 'Close', style: 'cancel' },
    { text: 'Open', onPress: () => Linking.openURL(store.menuUrl) }]
    );
  };

  return (
    <Screen refreshing={overview.loading && !!overview.data} onRefresh={() => setTick((t) => t + 1)}>
      {overview.loading && !overview.data ? <Loading text="Loading your menu…" /> : null}
      {overview.error && !overview.data ? <ErrorState message={overview.error} onRetry={() => setTick((t) => t + 1)} /> : null}

      {store ?
      <Card onPress={share} style={styles.store}>
          <View style={styles.qr}><Ionicons name="qr-code-outline" size={22} color={colors.brand} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{store.title || 'Your menu'}</Text>
            <Muted numberOfLines={1}>{store.menuUrl || 'Not published yet'}</Muted>
          </View>
          <Pill text={store.enabled ? 'LIVE' : 'OFF'} tone={store.enabled ? 'success' : 'muted'} small />
        </Card> :
      null}

      {store && !store.enabled ?
      <Card style={styles.note}>
          <Ionicons name="information-circle-outline" size={18} color={colors.warning} />
          <Muted style={{ flex: 1 }}>Your menu is not live yet. Turn it on from the web panel and the QR starts taking orders.</Muted>
        </Card> :
      null}

      {overview.data ?
      <>
          <SectionTitle title={`Dishes · ${items.length}`} />
          <View style={styles.filters}>
            <Chip text="All" active={filter === 'all'} onPress={() => setFilter('all')} />
            <Chip text="On the menu" active={filter === 'on'} onPress={() => setFilter('on')} />
            <Chip text={outCount ? `Sold out · ${outCount}` : 'Sold out'} active={filter === 'out'} onPress={() => setFilter('out')} />
          </View>
        </> :
      null}

      {overview.data && items.length === 0 ?
      <Empty icon="restaurant-outline" title="No dishes yet" text="Add your categories and dishes on the web panel. Once they are in, you can take one off the menu from here in a tap." /> :
      null}

      {overview.data && items.length > 0 && shown.length === 0 ?
      <Empty icon="checkmark-circle-outline" title="Nothing here" text={filter === 'out' ? 'Every dish is on the menu right now.' : 'No dishes match this filter.'} /> :
      null}

      {shown.map((item) => {
        const category = categories.find((c) => c.id === item.categoryId);
        return (
          <Card key={item.id} style={styles.item}>
            <View style={[styles.veg, { borderColor: item.veg ? colors.success : colors.danger }]}>
              <View style={[styles.vegDot, { backgroundColor: item.veg ? colors.success : colors.danger }]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemName, !item.available && styles.gone]}>{item.name}</Text>
              <Caption numberOfLines={1}>{category?.name || 'Uncategorised'}</Caption>
              <View style={styles.priceRow}>
                <Text style={styles.price}>{formatMoney(item.effectivePrice ?? item.price)}</Text>
                {item.offerPrice != null && item.offerPrice !== item.price ?
              <Text style={styles.was}>{formatMoney(item.price)}</Text> :
              null}
                {item.offerLabel ? <Pill text={item.offerLabel} tone="warning" small /> : null}
              </View>
            </View>
            <Switch
            value={!!item.available}
            disabled={busy === item.id}
            onValueChange={() => toggle(item)}
            trackColor={{ true: colors.brand, false: colors.borderStrong }}
            thumbColor={colors.surface} />

          </Card>);

      })}
    </Screen>);

}

const styles = StyleSheet.create({
  store: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  qr: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brandSoft },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  note: { flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: colors.warningSoft, borderColor: colors.warningSoft },
  filters: { flexDirection: 'row', gap: space.sm, marginBottom: space.md, flexWrap: 'wrap' },
  item: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  veg: { width: 16, height: 16, borderWidth: 1.5, borderRadius: 3, alignItems: 'center', justifyContent: 'center' },
  vegDot: { width: 8, height: 8, borderRadius: 4 },
  itemName: { fontSize: 15, fontWeight: '600', color: colors.text },
  gone: { color: colors.text3, textDecorationLine: 'line-through' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 2 },
  price: { fontSize: 14, fontWeight: '700', color: colors.text },
  was: { fontSize: 12, color: colors.text3, textDecorationLine: 'line-through' }
});
