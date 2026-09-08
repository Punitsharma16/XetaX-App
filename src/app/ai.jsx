import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ai } from '@/services';
import { Caption, Chip, Muted } from '@/ui';
import { colors, radius, space } from '@/ui/theme';

const STARTERS = ['How many records came in this week?', 'Show my open tasks', 'Which stage has the most leads?', 'Draft a follow-up WhatsApp message'];

/** AI Assistant — same /api/ai/chat the web panel uses (tools + your CRM data). */
export default function AiScreen() {
  const insets = useSafeAreaInsets();
  const [lines, setLines] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const convId = useRef('m' + Date.now().toString(36));
  const listRef = useRef(null);

  const ask = async (q) => {
    const question = q.trim();
    if (!question || busy) return;
    setText('');
    setLines((l) => [...l, { id: Date.now(), role: 'me', text: question }, { id: Date.now() + 1, role: 'ai', text: '', pending: true }]);
    setBusy(true);
    try {
      const res = await ai.chat(question, convId.current);
      const answer = res?.data?.response ?? res?.response ?? res?.data ?? 'No reply.';
      setLines((l) => l.map((x) => x.pending ? { ...x, text: typeof answer === 'string' ? answer : JSON.stringify(answer), pending: false } : x));
    } catch (e) {
      setLines((l) => l.map((x) => x.pending ? { ...x, text: e?.message || 'Something went wrong — try again.', pending: false } : x));
    } finally {setBusy(false);}
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.bg }} keyboardVerticalOffset={90}>
      <FlatList ref={listRef} data={lines} keyExtractor={(l) => String(l.id)} contentContainerStyle={{ padding: space.lg, gap: 8, flexGrow: 1 }}
      onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      ListEmptyComponent={
      <View style={{ flex: 1, justifyContent: 'center' }}>
            <View style={styles.heroIcon}><Ionicons name="sparkles" size={28} color={colors.brand} /></View>
            <Text style={styles.heroTitle}>What should we do in your CRM?</Text>
            <Muted style={{ textAlign: 'center', marginBottom: space.lg }}>Ask about records, tasks, pipelines — or tell me what to change.</Muted>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {STARTERS.map((s) => <Chip key={s} text={s} onPress={() => ask(s)} />)}
            </View>
          </View>
      }
      renderItem={({ item }) =>
      <View style={[styles.bubble, item.role === 'me' ? styles.me : styles.ai]}>
            {item.pending ? <Caption>Thinking…</Caption> : <Text style={[styles.body, item.role === 'me' && { color: '#fff' }]}>{item.text}</Text>}
          </View>
      } />
      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <TextInput value={text} onChangeText={setText} placeholder="Ask anything about your CRM…" style={styles.input} multiline onSubmitEditing={() => ask(text)} blurOnSubmit />
        <Pressable onPress={() => ask(text)} disabled={busy || !text.trim()} style={[styles.send, (busy || !text.trim()) && { opacity: 0.5 }]}><Ionicons name="arrow-up" size={20} color="#fff" /></Pressable>
      </View>
    </KeyboardAvoidingView>);

}

const styles = StyleSheet.create({
  heroIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: space.md },
  heroTitle: { fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 4 },
  bubble: { maxWidth: '88%', padding: 12, borderRadius: 16 },
  me: { alignSelf: 'flex-end', backgroundColor: colors.brand, borderBottomRightRadius: 4 },
  ai: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  body: { fontSize: 14.5, color: colors.text, lineHeight: 21 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: space.sm, paddingHorizontal: space.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, maxHeight: 120, backgroundColor: colors.surfaceAlt },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }
});
