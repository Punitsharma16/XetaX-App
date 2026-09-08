import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAsync } from '@/lib/use-async';
import { whatsapp } from '@/services';
import { useToast } from '@/state/toast';
import { Caption, Chip, Loading, Muted } from '@/ui';
import { colors, formatDate, radius, space } from '@/ui/theme';

/** One WhatsApp conversation — bubbles, ticks, free-text or template reply. */
export default function ChatScreen() {
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const id = Number(params.id);
  const windowOpen = params.window !== '0';
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [template, setTemplate] = useState(null);
  const templates = useAsync(() => windowOpen ? Promise.resolve([]) : whatsapp.templates().catch(() => []), [windowOpen]);
  const listRef = useRef(null);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const page = await whatsapp.messages(id, 0, 60);
      const sorted = [...page.content].sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
      setMessages(sorted);
    } catch (e) {if (!quiet) toast.error(e?.message || 'Could not load messages');} finally
    {setLoading(false);}
  }, [id, toast]);

  useEffect(() => {load();const t = setInterval(() => load(true), 8000);return () => clearInterval(t);}, [load]);

  const send = async () => {
    if (windowOpen ? !text.trim() : !template) return;
    setSending(true);
    try {
      const approved = (templates.data || []).find((t) => t.name === template);
      await whatsapp.send(windowOpen ? { conversationId: id, message: text.trim() } : { conversationId: id, templateName: template, templateLanguage: approved?.language || 'en' });
      setText('');setTemplate(null);
      await load(true);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {toast.error(e?.message || 'Could not send');} finally
    {setSending(false);}
  };

  const tick = (m) => m.status === 'READ' ? { name: 'checkmark-done', color: '#53BDEB' } : m.status === 'DELIVERED' ? { name: 'checkmark-done', color: 'rgba(255,255,255,0.8)' } : m.status === 'FAILED' ? { name: 'alert-circle', color: '#FFB4B4' } : m.status === 'SENT' ? { name: 'checkmark', color: 'rgba(255,255,255,0.8)' } : { name: 'time-outline', color: 'rgba(255,255,255,0.7)' };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: '#EFE7DD' }} keyboardVerticalOffset={90}>
      <Stack.Screen options={{ title: params.name || 'Chat', headerRight: () => <Caption style={{ marginRight: 4 }}>{params.phone}</Caption> }} />
      {loading && messages.length === 0 ? <Loading /> : null}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={{ padding: space.md, gap: 6 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={!loading ? <Muted style={{ textAlign: 'center', marginTop: space.xl }}>No messages yet.</Muted> : null}
        renderItem={({ item: m }) => {
          const out = m.direction === 'OUTBOUND';
          return (
            <View style={[styles.bubble, out ? styles.out : styles.in]}>
              {m.templateName ? <Text style={[styles.tpl, out && { color: 'rgba(255,255,255,0.8)' }]}>template · {m.templateName}</Text> : null}
              <Text style={[styles.body, out && { color: '#fff' }]}>{m.body || (m.messageType !== 'text' ? `[${m.messageType}]` : '')}</Text>
              <View style={styles.meta}>
                <Text style={[styles.time, out && { color: 'rgba(255,255,255,0.75)' }]}>{formatDate(m.createdAt, true).split(', ')[1] || ''}</Text>
                {out ? <Ionicons name={tick(m).name} size={14} color={tick(m).color} /> : null}
              </View>
              {m.status === 'FAILED' && m.errorMessage ? <Text style={styles.err}>{m.errorMessage}</Text> : null}
            </View>);

        }} />
      
      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {windowOpen ?
        <>
            <TextInput value={text} onChangeText={setText} placeholder="Type a message…" style={styles.input} multiline maxLength={1500} />
            <Pressable onPress={send} disabled={sending || !text.trim()} style={[styles.send, (!text.trim() || sending) && { opacity: 0.5 }]}>
              <Ionicons name="send" size={18} color="#fff" />
            </Pressable>
          </> :

        <View style={{ flex: 1 }}>
            <Caption style={{ marginBottom: 6 }}>24-hour window closed — only an approved template can be sent.</Caption>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {(templates.data || []).filter((t) => t.status === 'APPROVED').map((t) => <Chip key={t.name} text={t.name} active={template === t.name} onPress={() => setTemplate(t.name)} />)}
              {templates.data && !templates.data.some((t) => t.status === 'APPROVED') ? <Muted>No approved templates.</Muted> : null}
            </View>
            <Pressable onPress={send} disabled={sending || !template} style={[styles.send, { alignSelf: 'flex-end', marginTop: 8, width: 'auto', paddingHorizontal: 14, flexDirection: 'row', gap: 6 }, (!template || sending) && { opacity: 0.5 }]}>
              <Ionicons name="send" size={16} color="#fff" /><Text style={{ color: '#fff', fontWeight: '700' }}>Send template</Text>
            </Pressable>
          </View>
        }
      </View>
    </KeyboardAvoidingView>);

}

const styles = StyleSheet.create({
  bubble: { maxWidth: '82%', padding: 10, borderRadius: 14 },
  in: { alignSelf: 'flex-start', backgroundColor: '#fff', borderBottomLeftRadius: 4 },
  out: { alignSelf: 'flex-end', backgroundColor: colors.brand, borderBottomRightRadius: 4 },
  tpl: { fontSize: 10, color: colors.text3, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.4 },
  body: { fontSize: 14.5, color: colors.text, lineHeight: 20 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 },
  time: { fontSize: 10.5, color: colors.text3 },
  err: { fontSize: 11, color: '#FFD0D0', marginTop: 4 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: space.sm, paddingHorizontal: space.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, maxHeight: 120, backgroundColor: colors.surfaceAlt },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }
});
