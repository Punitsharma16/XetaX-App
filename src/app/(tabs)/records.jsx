import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAsync } from '@/lib/use-async';
import { forms } from '@/services';
import { Card, Empty, ErrorState, Loading, Muted, Screen } from '@/ui';
import { colors, radius, space } from '@/ui/theme';

/** Records tab = pick a form (each form is its own record type / pipeline). */
export default function RecordsTab() {
  const router = useRouter();
  const [tick, setTick] = useState(0);
  const list = useAsync(() => forms.list(), [tick]);

  return (
    <Screen refreshing={list.loading && !!list.data} onRefresh={() => setTick((t) => t + 1)}>
      {list.loading && !list.data ? <Loading /> : null}
      {list.error && !list.data ? <ErrorState message={list.error} onRetry={() => setTick((t) => t + 1)} /> : null}
      {list.data && list.data.length === 0 ?
      <Empty icon="albums-outline" title="No forms yet" text="Forms (record types) are designed in the web panel. Once created, their records appear here." /> :
      null}
      {(list.data || []).map((f) =>
      <Card key={f.id} onPress={() => router.push({ pathname: '/records/[slug]', params: { slug: f.slug, formId: String(f.id), name: f.name } })} style={styles.row}>
          <View style={[styles.icon, { backgroundColor: f.color ? f.color + '22' : colors.brandSoft }]}>
            <Ionicons name="albums-outline" size={20} color={f.color || colors.brand} />
          </View>
          <View style={{ flex: 1, marginLeft: space.md }}>
            <Text style={styles.title}>{f.name}</Text>
            {f.description ? <Muted numberOfLines={1}>{f.description}</Muted> : <Muted>Tap to open records</Muted>}
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text3} />
        </Card>
      )}
    </Screen>);

}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: colors.text }
});
