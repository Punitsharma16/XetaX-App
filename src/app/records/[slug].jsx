import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAsync } from '@/lib/use-async';
import { forms, records, recordTitle } from '@/services';
import { Chip, Empty, ErrorState, Loading, Muted, Pill, SearchBar } from '@/ui';
import { colors, formatDate, radius, space } from '@/ui/theme';

/** Records of one form: search, stage filter, infinite list. */
export default function RecordsListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const slug = String(params.slug);
  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState(null);
  const [page, setPage] = useState(0);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formId, setFormId] = useState(params.formId ? Number(params.formId) : null);

  // The list route may receive a numeric id (from the dashboard) — resolve slug/id from the forms list.
  const formList = useAsync(() => forms.list(), []);
  const form = useMemo(() => (formList.data || []).find((f) => f.slug === slug || String(f.id) === slug), [formList.data, slug]);
  const realSlug = form?.slug || slug;
  useEffect(() => {if (form) setFormId(form.id);}, [form]);

  const fields = useAsync(() => formId ? forms.fields(formId) : Promise.resolve([]), [formId]);
  const stages = useAsync(() => formId ? forms.stages(formId) : Promise.resolve([]), [formId]);
  const stageById = useMemo(() => Object.fromEntries((stages.data || []).map((s) => [s.id, s])), [stages.data]);

  const load = async (p, replace) => {
    if (!form && formList.loading) return;
    setLoading(true);setError(null);
    try {
      const res = query.trim() ? await records.search(realSlug, query.trim(), p) : await records.list(realSlug, p);
      setItems((prev) => replace ? res.content : [...prev, ...res.content]);
      setTotal(res.totalElements);setPage(p);
    } catch (e) {setError(e?.message || 'Could not load records');} finally
    {setLoading(false);}
  };
  useEffect(() => {load(0, true); /* eslint-disable-next-line react-hooks/exhaustive-deps */}, [realSlug, query, form?.id]);

  const visibleFields = (fields.data || []).filter((f) => !f.hidden).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  const shown = stageFilter ? items.filter((r) => r.stageId === stageFilter) : items;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: form?.name || params.name || 'Records', headerRight: () =>
        <Pressable onPress={() => router.push({ pathname: '/record/edit', params: { slug: realSlug, formId: String(formId || '') } })} hitSlop={8} style={{ paddingHorizontal: 6 }}>
          <Ionicons name="add-circle" size={26} color={colors.brand} />
        </Pressable>
      }} />
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.md }}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search records…" />
        {(stages.data || []).length ?
        <FlatList horizontal showsHorizontalScrollIndicator={false} data={[{ id: 0, name: 'All' }, ...(stages.data || [])]} keyExtractor={(s) => String(s.id)}
        contentContainerStyle={{ gap: 8, paddingVertical: space.sm }}
        renderItem={({ item }) => <Chip text={item.id === 0 ? `All (${total})` : item.name} active={(stageFilter ?? 0) === item.id} onPress={() => setStageFilter(item.id === 0 ? null : item.id)} />} /> :
        null}
      </View>

      {loading && items.length === 0 ? <Loading /> : null}
      {error && items.length === 0 ? <ErrorState message={error} onRetry={() => load(0, true)} /> : null}
      <FlatList
        data={shown}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: space.lg, paddingTop: space.sm, gap: space.sm }}
        onEndReached={() => {if (!loading && items.length < total && !query.trim()) load(page + 1, false);}}
        onEndReachedThreshold={0.4}
        refreshing={loading && items.length > 0}
        onRefresh={() => load(0, true)}
        ListEmptyComponent={!loading && !error ? <Empty icon="document-text-outline" title="No records" text={query ? 'Nothing matches that search.' : 'Add the first record with the + button.'} /> : null}
        renderItem={({ item }) => {
          const st = item.stageId ? stageById[item.stageId] : null;
          const sub = visibleFields.slice(1, 3).map((f) => item.data?.[f.fieldKey]).filter((v) => v !== undefined && v !== null && v !== '').map(String).join(' · ');
          return (
            <Pressable onPress={() => router.push({ pathname: '/record/[id]', params: { id: item.id, formId: String(formId || ''), slug: realSlug } })} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>{recordTitle(item, visibleFields)}</Text>
                {sub ? <Muted numberOfLines={1}>{sub}</Muted> : null}
                <Muted style={{ fontSize: 12, marginTop: 2 }}>{formatDate(item.createdAt)}</Muted>
              </View>
              {st ? <Pill text={st.name} small style={st.color ? { backgroundColor: st.color + '22' } : undefined} /> : null}
            </Pressable>);

        }} />
      
    </View>);

}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: space.md, gap: space.sm },
  title: { fontSize: 15.5, fontWeight: '700', color: colors.text }
});
