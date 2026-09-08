import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAsync } from '@/lib/use-async';
import { team } from '@/services';
import { useToast } from '@/state/toast';
import { Avatar, Button, Card, Chip, Empty, ErrorState, Input, Label, Loading, Muted, Pill, Screen, SectionTitle } from '@/ui';
import { colors, space } from '@/ui/theme';

export default function TeamScreen() {
  const toast = useToast();
  const [tick, setTick] = useState(0);
  const me = useAsync(() => team.me().catch(() => ({ isOwner: false, permissions: [] })), []);
  const members = useAsync(() => team.members(), [tick]);
  const roles = useAsync(() => team.roles(), [tick]);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [roleId, setRoleId] = useState(null);
  const [busy, setBusy] = useState(false);
  const canManage = me.data?.isOwner || (me.data?.permissions || []).includes('team.manage');
  const pick = roleId ?? (roles.data || []).find((r) => !r.system)?.id ?? (roles.data || [])[0]?.id ?? null;

  const add = async () => {
    if (!form.name.trim() || !form.email.trim() || form.password.length < 6 || !pick) {toast.error('Name, email, a 6+ char password and a role are required');return;}
    setBusy(true);
    try {await team.createMember(form.name.trim(), form.email.trim().toLowerCase(), form.password, pick);toast.success('Member added — share the password with them');setForm({ name: '', email: '', password: '' });setTick((t) => t + 1);}
    catch (e) {toast.error(e?.message || 'Could not add member');} finally
    {setBusy(false);}
  };

  return (
    <Screen refreshing={members.loading && !!members.data} onRefresh={() => setTick((t) => t + 1)}>
      {members.loading && !members.data ? <Loading /> : null}
      {members.error && !members.data ? <ErrorState message={members.error} onRetry={() => setTick((t) => t + 1)} /> : null}
      {members.data && members.data.length === 0 ? <Empty icon="people-outline" title="No team members yet" /> : null}
      {(members.data || []).map((m) =>
      <Card key={m.userId} style={styles.row}>
          <Avatar name={m.name} size={42} />
          <View style={{ flex: 1, marginLeft: space.md }}><Text style={styles.name}>{m.name}</Text><Muted numberOfLines={1}>{m.email}</Muted></View>
          <Pill text={m.roleName || 'Member'} small />
        </Card>
      )}
      {canManage ?
      <>
          <SectionTitle title="Add a member" />
          <Card>
            <Input label="Name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholder="Priya Sharma" />
            <Input label="Email (login)" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} keyboardType="email-address" autoCapitalize="none" />
            <Input label="Temporary password" value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} secureTextEntry placeholder="At least 6 characters" hint="Share it with the member — they can change it after first login." />
            <Label>Role</Label>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6, marginBottom: space.md }}>
              {(roles.data || []).map((r) => <Chip key={r.id} text={r.name} active={pick === r.id} onPress={() => setRoleId(r.id)} />)}
            </View>
            <Button title="Add member" icon="person-add-outline" onPress={add} loading={busy} />
          </Card>
        </> :
      null}
    </Screen>);

}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: colors.text }
});
