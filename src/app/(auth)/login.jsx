import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { API_BASE_URL, API_BASE_URL_LOCAL, APP_NAME, APP_TAGLINE } from '@/lib/config';
import { EmailNotVerifiedError, useAuth } from '@/state/auth';
import { Button, Caption, Input, Muted, Screen } from '@/ui';
import { colors, radius, space } from '@/ui/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { status, login, server, setServer } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (status === 'signedIn') return <Redirect href="/(tabs)" />;

  const submit = async () => {
    setError(null);
    if (!email.trim() || !password) {setError('Enter your email and password.');return;}
    setBusy(true);
    try {
      await login(email, password);
    } catch (e) {
      if (e instanceof EmailNotVerifiedError) {
        router.push({ pathname: '/(auth)/verify-email', params: { email: e.email } });
      } else {
        setError(e?.message || 'Unable to sign in right now.');
      }
    } finally {
      setBusy(false);
    }
  };

  const isLocal = server === API_BASE_URL_LOCAL;

  return (
    <Screen padded={false} style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.hero}>
            <View style={styles.mark}><Text style={styles.markText}>X</Text></View>
            <Text style={styles.title}>{APP_NAME}</Text>
            <Text style={styles.tag}>{APP_TAGLINE}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.heading}>Welcome back</Text>
            <Muted style={{ marginBottom: space.lg }}>Sign in with the same account as the web panel.</Muted>

            {error ?
            <View style={styles.error}>
                <Ionicons name="alert-circle" size={16} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View> :
            null}

            <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false}
            keyboardType="email-address" placeholder="you@company.com" returnKeyType="next" />
            <View>
              <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword}
              placeholder="••••••••" returnKeyType="go" onSubmitEditing={submit} />
              <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={10} style={styles.eye}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.text3} />
              </Pressable>
            </View>

            <Pressable onPress={() => router.push('/(auth)/forgot')} style={{ alignSelf: 'flex-end', marginBottom: space.md }} hitSlop={8}>
              <Text style={styles.link}>Forgot password?</Text>
            </Pressable>

            <Button title="Sign in" icon="log-in-outline" onPress={submit} loading={busy} />

            <Pressable onPress={() => router.push('/(auth)/register')} style={styles.altRow} hitSlop={8}>
              <Muted>New to XetaX? </Muted>
              <Text style={styles.link}>Create a workspace</Text>
            </Pressable>

            <Pressable onPress={() => setServer(isLocal ? API_BASE_URL : API_BASE_URL_LOCAL)} style={styles.serverToggle} hitSlop={8}>
              <Ionicons name="server-outline" size={12} color={colors.text3} />
              <Caption> Server: {isLocal ? 'Local (dev)' : 'Production'} · tap to switch</Caption>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>);

}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.brand, paddingTop: 84, paddingBottom: 60, paddingHorizontal: space.xl, alignItems: 'center', borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  mark: { width: 68, height: 68, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  markText: { color: colors.inverse, fontSize: 34, fontWeight: '800' },
  title: { color: colors.inverse, fontSize: 26, fontWeight: '800', marginTop: space.lg, letterSpacing: -0.3 },
  tag: { color: 'rgba(255,255,255,0.8)', marginTop: 4, fontSize: 13, letterSpacing: 0.4 },
  card: { marginTop: -28, marginHorizontal: space.lg, marginBottom: space.xl, backgroundColor: colors.surface, borderRadius: radius.xl, padding: space.xl, borderWidth: 1, borderColor: colors.border, elevation: 4, shadowColor: colors.text, shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  heading: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 2 },
  error: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.dangerSoft, padding: 10, borderRadius: radius.md, marginBottom: space.md },
  errorText: { color: colors.danger, fontSize: 13, flex: 1 },
  eye: { position: 'absolute', right: 14, top: 36 },
  link: { color: colors.brandText, fontSize: 13, fontWeight: '700' },
  altRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: space.lg },
  serverToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: space.md }
});
