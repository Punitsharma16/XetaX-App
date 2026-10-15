import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { api } from '@/lib/api';
import { useToast } from '@/state/toast';
import { Button, Input, Muted, Screen } from '@/ui';
import { colors, radius, space } from '@/ui/theme';

/** Two steps on one card: email → 6-digit code + new password. */
export default function ForgotScreen() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const sendCode = async () => {
    setError(null);
    if (!email.trim()) {setError('Enter your sign-in email.');return;}
    setBusy(true);
    try {
      await api.post('auth/v1/forgot-password', { email: email.trim().toLowerCase() });
      toast.show('If the account exists, a 6-digit code is on its way.');
      setStep('reset');
    } catch (e) {
      setError(e?.status === 429 ? 'Too many requests — wait a few minutes.' : e?.message || 'Could not send the code.');
    } finally {setBusy(false);}
  };

  const reset = async () => {
    setError(null);
    if (!/^\d{6}$/.test(otp)) {setError('Enter the 6-digit code from the email.');return;}
    if (password.length < 6) {setError('Use at least 6 characters for the new password.');return;}
    setBusy(true);
    try {
      await api.post('auth/v1/reset-password', { email: email.trim().toLowerCase(), otp, newPassword: password });
      toast.show('Password changed — sign in with the new password.');
      router.replace('/(auth)/login');
    } catch (e) {
      setError(e?.message || 'Could not reset the password. Request a new code.');
    } finally {setBusy(false);}
  };

  return (
    <Screen padded={false} style={{ flex: 1 }}>
      <View style={styles.hero}>
        <View style={styles.mark}><Ionicons name="key-outline" size={30} color="#fff" /></View>
        <Text style={styles.title}>{step === 'email' ? 'Forgot your password?' : 'Check your email'}</Text>
        <Text style={styles.tag}>{step === 'email' ? "We'll email you a 6-digit reset code" : `Code sent to ${email.trim()}`}</Text>
      </View>
      <View style={styles.card}>
        {error ?
        <View style={styles.error}><Ionicons name="alert-circle" size={16} color={colors.danger} /><Text style={styles.errorText}>{error}</Text></View> :
        null}
        {step === 'email' ?
        <>
            <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@company.com" returnKeyType="go" onSubmitEditing={sendCode} />
            <Button title="Send reset code" icon="send-outline" onPress={sendCode} loading={busy} />
          </> :

        <>
            <Input label="6-digit code" value={otp} onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" maxLength={6} placeholder="e.g. 483920" />
            <Input label="New password" value={password} onChangeText={setPassword} secureTextEntry placeholder="At least 6 characters" returnKeyType="go" onSubmitEditing={reset} />
            <Button title="Change password" icon="checkmark-circle-outline" onPress={reset} loading={busy} />
            <Pressable onPress={() => {setStep('email');setError(null);}} style={styles.altRow} hitSlop={8}>
              <Text style={styles.link}>Didn't get the code? Send it again</Text>
            </Pressable>
          </>
        }
        <Pressable onPress={() => router.replace('/(auth)/login')} style={styles.altRow} hitSlop={8}>
          <Muted>Remembered it? </Muted><Text style={styles.link}>Back to sign in</Text>
        </Pressable>
      </View>
    </Screen>);

}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.brand, paddingTop: 84, paddingBottom: 56, paddingHorizontal: space.xl, alignItems: 'center', borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  mark: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  title: { color: colors.inverse, fontSize: 24, fontWeight: '800', marginTop: space.lg, textAlign: 'center' },
  tag: { color: 'rgba(255,255,255,0.85)', marginTop: 4, fontSize: 13, textAlign: 'center' },
  card: { marginTop: -28, marginHorizontal: space.lg, backgroundColor: colors.surface, borderRadius: radius.xl, padding: space.xl, borderWidth: 1, borderColor: colors.border, elevation: 4, shadowColor: colors.text, shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  error: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.dangerSoft, padding: 10, borderRadius: radius.md, marginBottom: space.md },
  errorText: { color: colors.danger, fontSize: 13, flex: 1 },
  link: { color: colors.brandText, fontSize: 13, fontWeight: '700' },
  altRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: space.md }
});
