import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { api } from '@/lib/api';
import { useAuth } from '@/state/auth';
import { Button, Input, Muted, Screen } from '@/ui';
import { colors, radius, space } from '@/ui/theme';

/**
 * Self-service sign-up — same endpoint and payload as the web panel's
 * Register page. With SMTP on the server the account starts unverified and
 * we hand off to the 6-digit code screen; otherwise we sign straight in.
 */
export default function RegisterScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    setError(null);
    if (!name.trim() || !email.trim() || !password) {setError('Name, email and password are required.');return;}
    if (password.length < 6) {setError('Use at least 6 characters for the password.');return;}
    setBusy(true);
    const e = email.trim().toLowerCase();
    try {
      const created = await api.post('auth/api/v1/users/register', {
        name: name.trim(), email: e, password,
        phone: phone.trim() || null, company: company.trim() || null,
        enable: true, isEnable: true, admin: false, isAdmin: false
      });
      if (created?.emailVerified === false) {
        router.replace({ pathname: '/(auth)/verify-email', params: { email: e, sent: '1' } });
        return;
      }
      await login(e, password);
    } catch (err) {
      setError(err?.status === 400 || err?.status === 409 ?
      'An account with this email or phone already exists.' :
      err?.message || 'Could not create your account right now.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen padded={false} style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: space.xl }}>
          <View style={styles.hero}>
            <View style={styles.mark}><Text style={styles.markText}>X</Text></View>
            <Text style={styles.title}>Create your workspace</Text>
            <Text style={styles.tag}>Free 14-day trial · no card needed</Text>
          </View>

          <View style={styles.card}>
            {error ?
            <View style={styles.error}>
                <Ionicons name="alert-circle" size={16} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View> :
            null}

            <Input label="Full name" value={name} onChangeText={setName} placeholder="Your name" returnKeyType="next" />
            <Input label="Company" value={company} onChangeText={setCompany} placeholder="Company name (optional)" returnKeyType="next" />
            <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false}
            keyboardType="email-address" placeholder="you@company.com" returnKeyType="next" />
            <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Mobile number (optional)" returnKeyType="next" />
            <View>
              <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword}
              placeholder="At least 6 characters" returnKeyType="go" onSubmitEditing={submit} />
              <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={10} style={styles.eye}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.text3} />
              </Pressable>
            </View>

            <Button title="Create account" icon="person-add-outline" onPress={submit} loading={busy} style={{ marginTop: space.sm }} />

            <Pressable onPress={() => router.replace('/(auth)/login')} style={styles.altRow} hitSlop={8}>
              <Muted>Already have an account? </Muted>
              <Text style={styles.link}>Sign in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>);

}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.brand, paddingTop: 64, paddingBottom: 52, paddingHorizontal: space.xl, alignItems: 'center', borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  mark: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  markText: { color: colors.inverse, fontSize: 30, fontWeight: '800' },
  title: { color: colors.inverse, fontSize: 24, fontWeight: '800', marginTop: space.lg },
  tag: { color: 'rgba(255,255,255,0.8)', marginTop: 4, fontSize: 12.5 },
  card: { marginTop: -28, marginHorizontal: space.lg, backgroundColor: colors.surface, borderRadius: radius.xl, padding: space.xl, borderWidth: 1, borderColor: colors.border, elevation: 4, shadowColor: '#161B2E', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  error: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.dangerSoft, padding: 10, borderRadius: radius.md, marginBottom: space.md },
  errorText: { color: colors.danger, fontSize: 13, flex: 1 },
  eye: { position: 'absolute', right: 14, top: 36 },
  link: { color: colors.brandText, fontSize: 13, fontWeight: '700' },
  altRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: space.lg }
});
