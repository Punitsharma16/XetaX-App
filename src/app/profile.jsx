import React, { useState } from 'react';
import { View } from 'react-native';

import { api } from '@/lib/api';
import { useAuth } from '@/state/auth';
import { useToast } from '@/state/toast';
import { Avatar, Button, Card, Input, Muted, Screen, SectionTitle } from '@/ui';
import { space } from '@/ui/theme';

/** Same payload the web panel's "Account details" form sends (PUT /auth/api/v1/users/{id}). */
export default function ProfileScreen() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [company, setCompany] = useState(user?.company || '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!user) return;
    if (!name.trim()) {toast.error('A name is required.');return;}
    setBusy(true);
    try {
      const body = {
        name: name.trim(), email: user.email, phone: phone.trim() || null, company: company.trim() || null,
        enable: true, isEnable: true, admin: !!(user.admin ?? user.isAdmin), isAdmin: !!(user.admin ?? user.isAdmin)
      };
      if (password) body.password = password;
      await api.put(`auth/api/v1/users/${user.id}`, body);
      await refreshUser({ name: name.trim(), phone: phone.trim() || null, company: company.trim() || null });
      setPassword('');
      toast.success('Profile saved');
    } catch (e) {
      toast.error(e?.message || 'Could not save');
    } finally {setBusy(false);}
  };

  return (
    <Screen>
      <View style={{ alignItems: 'center', marginVertical: space.lg }}>
        <Avatar name={user?.name} size={72} />
        <Muted style={{ marginTop: space.sm }}>{user?.email}</Muted>
      </View>
      <SectionTitle title="Account details" />
      <Card>
        <Input label="Full name" value={name} onChangeText={setName} />
        <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Input label="Company" value={company} onChangeText={setCompany} />
        <Input label="Email" value={user?.email || ''} editable={false} hint="Your email is your sign-in identity." />
      </Card>
      <SectionTitle title="Change password" />
      <Card>
        <Input label="New password" value={password} onChangeText={setPassword} secureTextEntry placeholder="Leave blank to keep the current one" />
      </Card>
      <Button title="Save changes" icon="save-outline" onPress={save} loading={busy} style={{ marginTop: space.md }} />
    </Screen>);

}
