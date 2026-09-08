import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAsync } from '@/lib/use-async';
import { tasks } from '@/services';
import { useToast } from '@/state/toast';
import { Button, Caption, Card, Chip, Empty, ErrorState, Loading, Screen } from '@/ui';
import { colors, formatDate, space } from '@/ui/theme';

export default function TasksTab() {
  const router = useRouter();
  const toast = useToast();
  const [filter, setFilter] = useState('open');
  const [tick, setTick] = useState(0);
  const list = useAsync(() => tasks.mine(filter === 'done' ? 'DONE' : 'OPEN'), [filter === 'done', tick]);

  const items = useMemo(() => {
    const all = list.data || [];
    if (filter === 'today') {
      const today = new Date().toDateString();
      return all.filter((t) => t.dueAt && new Date(t.dueAt).toDateString() === today);
    }
    return [...all].sort((a, b) => (a.dueAt || '9').localeCompare(b.dueAt || '9'));
  }, [list.data, filter]);

  const toggle = async (t) => {
    try {await tasks.setDone(t.id, t.status !== 'DONE');setTick((x) => x + 1);}
    catch (e) {toast.error(e?.message || 'Could not update');}
  };
  const remove = (t) => {
    const go = async () => {try {await tasks.remove(t.id);setTick((x) => x + 1);} catch (e) {toast.error(e?.message);}};
    if (Platform.OS === 'web') {go();return;}
    Alert.alert('Delete task', t.title, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: go }]);
  };

  const overdue = (t) => t.status === 'OPEN' && t.dueAt && new Date(t.dueAt) < new Date();

  return (
    <Screen refreshing={list.loading && !!list.data} onRefresh={() => setTick((x) => x + 1)}
    footer={<Button title="New task" icon="add" onPress={() => router.push('/task/new')} />}>
      <View style={styles.chips}>
        <Chip text="Today" active={filter === 'today'} onPress={() => setFilter('today')} />
        <Chip text="Open" active={filter === 'open'} onPress={() => setFilter('open')} />
        <Chip text="Done" active={filter === 'done'} onPress={() => setFilter('done')} />
      </View>
      {list.loading && !list.data ? <Loading /> : null}
      {list.error && !list.data ? <ErrorState message={list.error} onRetry={() => setTick((x) => x + 1)} /> : null}
      {list.data && items.length === 0 ? <Empty icon="checkmark-done-outline" title={filter === 'done' ? 'Nothing done yet' : 'All clear'} text={filter === 'today' ? 'No tasks due today.' : 'Add a task to remind yourself of a follow-up.'} /> : null}
      {items.map((t) =>
      <Card key={t.id} style={styles.row}>
          <Pressable onPress={() => toggle(t)} hitSlop={8}>
            <Ionicons name={t.status === 'DONE' ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={t.status === 'DONE' ? colors.success : overdue(t) ? colors.danger : colors.text3} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, t.status === 'DONE' && styles.done]}>{t.title}</Text>
            {t.notes ? <Caption numberOfLines={2}>{t.notes}</Caption> : null}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
              {t.dueAt ? <Caption style={overdue(t) ? { color: colors.danger, fontWeight: '600' } : undefined}>{overdue(t) ? 'Overdue · ' : 'Due '}{formatDate(t.dueAt, true)}</Caption> : null}
              {t.linkedName ? <Caption>· {t.linkedName}</Caption> : null}
              {t.remindWhatsApp ? <Ionicons name="logo-whatsapp" size={12} color={colors.whatsapp} /> : null}
              {t.remindEmail ? <Ionicons name="mail-outline" size={12} color={colors.text3} /> : null}
            </View>
          </View>
          <Pressable onPress={() => remove(t)} hitSlop={8}><Ionicons name="trash-outline" size={18} color={colors.text3} /></Pressable>
        </Card>
      )}
    </Screen>);

}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', gap: 8, marginBottom: space.md },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  title: { fontSize: 15, fontWeight: '600', color: colors.text },
  done: { textDecorationLine: 'line-through', color: colors.text3 }
});
