import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { desk } from '@/services';
import { useToast } from '@/state/toast';
import { Caption, Loading, Muted } from '@/ui';
import { colors, formatDate, radius, space } from '@/ui/theme';

/** Live chat desk session: customer ↔ AI/human thread with reply + resolve. */
export default function DeskChatScreen() {
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const sessionId = Number(id);
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const listRef = useRef(null);
  const lastId = useRef(0);

  const load = useCallback(async (incremental) => {
    try {
      const res = await desk.messages(sessionId, incremental ? lastId.current : undefined);
      setSession(res.session);
      if (res.messages.length) {
        lastId.current = Math.max(lastId.current, ...res.messages.map((m) => m.id));
        setMessages((prev) => incremental ? [...prev, ...res.messages.filter((m) => !prev.some((p) => p.id === m.id))] : res.messages);
      }
    } catch (e) {if (!incremental) toast.error(e?.message || 'Could not load chat');}
  }, [sessionId, toast]);

  useEffect(() => {load(false);const t = setInterval(() => load(true), 3000);return () => clearInterval(t);}, [load]);

  const reply = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {await desk.reply(sessionId, text.trim());setText('');await load(true);}
    catch (e) {toast.error(e?.message || 'Could not send');} finally
    {setSending(false);}
  };

  const finish = (resumeAi) => {
    const go = async () => {
      try {await desk.resolve(sessionId, resumeAi);toast.success(resumeAi ? 'Handed back to the assistant' : 'Chat closed — a summary will be saved on the record');router.back();}
      catch (e) {toast.error(e?.message);}
    };
    if (Platform.OS === 'web') {go();return;}
    Alert.alert(resumeAi ? 'Back to AI' : 'Resolve chat', resumeAi ? 'Let the assistant continue this conversation?' : 'Close this chat?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Yes', onPress: go }]);
  };

  const canReply = session?.status === 'HUMAN';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.bg }} keyboardVerticalOffset={90}>
      <Stack.Screen options={{ title: session?.customer || 'Live chat', headerRight: () => session?.recordId ?
        <Pressable onPress={() => router.push({ pathname: '/record/[id]', params: { id: session.recordId } })} hitSlop={8} style={{ paddingHorizontal: 6 }}>
          <Ionicons name="document-text-outline" size={22} color={colors.brand} />
        </Pressable> :
        null }} />
      {session ?
      <View style={styles.head}>
          <Ionicons name={session.channel === 'WHATSAPP' ? 'logo-whatsapp' : 'globe-outline'} size={14} color={session.channel === 'WHATSAPP' ? colors.whatsapp : colors.brand} />
          <Caption> {session.channel === 'WHATSAPP' ? session.phone || 'WhatsApp' : 'Website visitor'} · {session.status === 'HUMAN' ? `with ${session.acceptedByName || 'you'}` : session.status.replace('_', ' ').toLowerCase()}</Caption>
          {session.summary ? <Pressable onPress={() => setShowSummary((s) => !s)} style={{ marginLeft: 'auto' }}><Caption style={{ color: colors.brandText, fontWeight: '600' }}>{showSummary ? 'Hide summary' : 'AI summary'}</Caption></Pressable> : null}
        </View> :
      null}
      {showSummary && session?.summary ? <View style={styles.summary}><Muted>{session.summary}</Muted></View> : null}
      {!session ? <Loading /> : null}
      <FlatList ref={listRef} data={messages} keyExtractor={(m) => String(m.id)} contentContainerStyle={{ padding: space.md, gap: 6 }}
      onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      renderItem={({ item: m }) => m.role === 'SYSTEM' ?
      <Caption style={{ alignSelf: 'center', fontStyle: 'italic' }}>{m.text}</Caption> :

      <View style={[styles.bubble, m.role === 'CUSTOMER' ? styles.in : styles.out, m.role === 'AI' && styles.ai]}>
            <Text style={styles.who}>{m.role === 'CUSTOMER' ? session?.customer || 'Customer' : m.role === 'AI' ? 'Assistant' : m.sender || 'You'}</Text>
            <Text style={[styles.body, m.role !== 'CUSTOMER' && m.role !== 'AI' && { color: '#fff' }]}>{m.text}</Text>
            <Text style={[styles.time, m.role === 'HUMAN' && { color: 'rgba(255,255,255,0.75)' }]}>{formatDate(m.at, true).split(', ')[1] || ''}</Text>
          </View>
      } />
      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {canReply ?
        <>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
              <TextInput value={text} onChangeText={setText} placeholder="Type a reply…" style={styles.input} multiline />
              <Pressable onPress={reply} disabled={sending || !text.trim()} style={[styles.send, (!text.trim() || sending) && { opacity: 0.5 }]}><Ionicons name="send" size={18} color="#fff" /></Pressable>
            </View>
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 8, justifyContent: 'flex-end' }}>
              <Pressable onPress={() => finish(true)}><Caption style={{ color: colors.brandText, fontWeight: '700' }}>Back to AI</Caption></Pressable>
              <Pressable onPress={() => finish(false)}><Caption style={{ color: colors.success, fontWeight: '700' }}>Resolve</Caption></Pressable>
            </View>
          </> :

        <Muted style={{ textAlign: 'center' }}>{session?.status === 'RESOLVED' ? 'This chat is closed.' : session?.status === 'WAITING_HUMAN' ? 'Accept this request from the Inbox → Requests tab to reply.' : 'The assistant is handling this chat.'}</Muted>
        }
      </View>
    </KeyboardAvoidingView>);

}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.md, paddingVertical: 8, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  summary: { backgroundColor: colors.brandSoft, padding: space.md },
  bubble: { maxWidth: '84%', padding: 10, borderRadius: 14 },
  in: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  out: { alignSelf: 'flex-end', backgroundColor: colors.brand, borderBottomRightRadius: 4 },
  ai: { backgroundColor: colors.brandSoft, borderWidth: 0 },
  who: { fontSize: 10.5, color: colors.text3, marginBottom: 2, fontWeight: '600' },
  body: { fontSize: 14.5, color: colors.text, lineHeight: 20 },
  time: { fontSize: 10.5, color: colors.text3, marginTop: 4, alignSelf: 'flex-end' },
  composer: { padding: space.sm, paddingHorizontal: space.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, maxHeight: 120, backgroundColor: colors.surfaceAlt },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }
});
