import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { contacts } from '@/services';
import { useToast } from '@/state/toast';
import { Avatar, Button, Card, Empty, ErrorState, Input, Loading, Muted, SearchBar } from '@/ui';
import { colors, radius, space } from '@/ui/theme';

export default function ContactsScreen() {
  const router = useRouter();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', company: '' });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);setError(null);
    try {const p = await contacts.list(query.trim());setItems(p.content);}
    catch (e) {setError(e?.message || 'Could not load contacts');} finally
    {setLoading(false);}
  };
  useEffect(() => {const t = setTimeout(load, 250);return () => clearTimeout(t); /* eslint-disable-next-line react-hooks/exhaustive-deps */}, [query]);

  const save = async () => {
    if (!form.name.trim()) {toast.error('Name is required');return;}
    setBusy(true);
    try {
      await contacts.create({ name: form.name.trim(), phone: form.phone.trim() || null, email: form.email.trim() || null, company: form.company.trim() || null });
      toast.success('Contact added');setAdding(false);setForm({ name: '', phone: '', email: '', company: '' });load();
    } catch (e) {toast.error(e?.message || 'Could not add');} finally
    {setBusy(false);}
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ headerRight: () => <Pressable onPress={() => setAdding((a) => !a)} hitSlop={8} style={{ paddingHorizontal: 6 }}><Ionicons name={adding ? 'close-circle' : 'add-circle'} size={26} color={colors.brand} /></Pressable> }} />
      <View style={{ padding: space.lg, paddingBottom: 0 }}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search name, phone, company…" />
        {adding ?
        <Card style={{ marginTop: space.md }}>
            <Input label="Name *" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} autoFocus />
            <Input label="Phone" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" />
            <Input label="Email" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} keyboardType="email-address" autoCapitalize="none" />
            <Input label="Company" value={form.company} onChangeText={(v) => setForm({ ...form, company: v })} />
            <Button title="Save contact" icon="checkmark" onPress={save} loading={busy} />
          </Card> :
        null}
      </View>
      {loading && items.length === 0 ? <Loading /> : null}
      {error && items.length === 0 ? <ErrorState message={error} onRetry={load} /> : null}
      <FlatList data={items} keyExtractor={(c) => String(c.id)} contentContainerStyle={{ padding: space.lg, gap: space.sm }} refreshing={loading && items.length > 0} onRefresh={load}
      ListEmptyComponent={!loading && !error ? <Empty icon="people-outline" title="No contacts" text={query ? 'Nothing matches.' : 'Add your first contact with +'} /> : null}
      renderItem={({ item: c }) =>
      <View style={styles.row}>
            <Avatar name={c.name} size={44} />
            <View style={{ flex: 1, marginLeft: space.md }}>
              <Text style={styles.name}>{c.name}</Text>
              <Muted numberOfLines={1}>{[c.company, c.phone, c.email].filter(Boolean).join(' · ') || '—'}</Muted>
            </View>
            {c.phone ? <Pressable onPress={() => Linking.openURL(`tel:${c.phone}`)} hitSlop={8} style={styles.act}><Ionicons name="call-outline" size={18} color={colors.brand} /></Pressable> : null}
            {c.phone ? <Pressable onPress={() => Linking.openURL(`https://wa.me/${c.phone.replace(/\D/g, '')}`)} hitSlop={8} style={styles.act}><Ionicons name="logo-whatsapp" size={18} color={colors.whatsapp} /></Pressable> : null}
            <Pressable onPress={() => router.push({ pathname: '/task/new', params: { contactId: String(c.id), linkedName: c.name } })} hitSlop={8} style={styles.act}><Ionicons name="alarm-outline" size={18} color={colors.warning} /></Pressable>
          </View>
      } />
    </View>);

}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: space.md },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  act: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginLeft: 6 }
});
