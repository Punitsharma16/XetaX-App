import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { api } from '@/lib/api';
import { useAuth } from '@/state/auth';
import { useToast } from '@/state/toast';
import { Button, Input, Muted, Screen } from '@/ui';
import { colors, radius, space } from '@/ui/theme';

/** Confirm the 6-digit sign-up code; success signs the user in. */
export default function VerifyEmailScreen() {
  const router = useRouter();
  const toast = useToast();
  const { acceptTokens } = useAuth();
  const params = useLocalSearchParams();
  const email = String(params.email || '').toLowerCase();
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!email) {router.replace('/(auth)/register');return;}
    if (params.sent !== '1') resend(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resend = async (silent = false) => {
    setResending(true);
    try {
      await api.post('auth/v1/verify-email/send', { email });
      if (!silent) toast.show('Code sent — check your inbox (and spam).');
    } catch (e) {
      setError(e?.status === 429 ? 'Too many requests — wait a few minutes.' : e?.message || 'Could not send the code.');
    } finally {setResending(false);}
  };

  const confirm = async () => {
    setError(null);
    if (!/^\d{6}$/.test(otp)) {setError('Enter the 6-digit code from the email.');return;}
    setBusy(true);
    try {
      const res = await api.post('auth/v1/verify-email/confirm', { email, otp });
      toast.show('Email confirmed — welcome!');
      await acceptTokens(res);
    } catch (e) {
      setError(e?.status === 429 ? 'Too many attempts — wait a few minutes.' : e?.message || 'Could not verify the code.');
    } finally {setBusy(false);}
  };

  return (
    <Screen padded={false} style={{ flex: 1 }}>
      <View style={styles.hero}>
        <View style={styles.mark}><Ionicons name="mail-open-outline" size={30} color="#fff" /></View>
        <Text style={styles.title}>Confirm your email</Text>
        <Text style={styles.tag}>Code sent to {email}</Text>
      </View>
      <View style={styles.card}>
        <Muted style={{ marginBottom: space.md }}>Enter the 6-digit code. It expires in 15 minutes.</Muted>
        {error ?
        <View style={styles.error}><Ionicons name="alert-circle" size={16} color={colors.danger} /><Text style={styles.errorText}>{error}</Text></View> :
        null}
        <Input label="6-digit code" value={otp} onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad" placeholder="e.g. 483920" maxLength={6} returnKeyType="go" onSubmitEditing={confirm}
        style={{ letterSpacing: 6, fontSize: 22, textAlign: 'center' }} />
        <Button title="Confirm & continue" icon="checkmark-circle-outline" onPress={confirm} loading={busy} />
        <Pressable onPress={() => resend()} disabled={resending} style={styles.altRow} hitSlop={8}>
          <Text style={styles.link}>{resending ? 'Sending…' : "Didn't get the code? Send it again"}</Text>
        </Pressable>
        <Pressable onPress={() => router.replace('/(auth)/register')} style={styles.altRow} hitSlop={8}>
          <Muted>Wrong email? </Muted><Text style={styles.link}>Back to sign up</Text>
        </Pressable>
      </View>
    </Screen>);

}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.brand, paddingTop: 84, paddingBottom: 56, paddingHorizontal: space.xl, alignItems: 'center', borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  mark: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  title: { color: colors.inverse, fontSize: 24, fontWeight: '800', marginTop: space.lg },
  tag: { color: 'rgba(255,255,255,0.85)', marginTop: 4, fontSize: 13 },
  card: { marginTop: -28, marginHorizontal: space.lg, backgroundColor: colors.surface, borderRadius: radius.xl, padding: space.xl, borderWidth: 1, borderColor: colors.border, elevation: 4, shadowColor: colors.text, shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  error: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.dangerSoft, padding: 10, borderRadius: radius.md, marginBottom: space.md },
  errorText: { color: colors.danger, fontSize: 13, flex: 1 },
  link: { color: colors.brandText, fontSize: 13, fontWeight: '700' },
  altRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: space.md }
});
