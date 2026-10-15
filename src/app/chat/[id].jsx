import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Image, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TemplateVariablesForm, emptyVariables, hasVariables, templateSlots, variablesComplete } from '@/features/template-vars';
import { useAsync } from '@/lib/use-async';
import { whatsapp } from '@/services';
import { useToast } from '@/state/toast';
import { Caption, Chip, Loading, Muted } from '@/ui';
import { colors, formatDate, radius, space } from '@/ui/theme';

/**
 * The file on a message. The backend pulls each inbound file off Meta once and
 * serves it from a public link, so a plain <Image> uri works with no token —
 * and the same link opens in a browser for anything React Native cannot show.
 */
function Media({ message, out }) {
  const url = message.mediaUrl;
  if (!url) return null;
  const mime = (message.mediaMimeType || '').toLowerCase();
  const type = (message.messageType || '').toUpperCase();
  const isImage = mime.startsWith('image/') || type === 'IMAGE' || type === 'STICKER';

  if (isImage) {
    return (
      <Pressable onPress={() => Linking.openURL(url)}>
        <Image source={{ uri: url }} style={styles.media} resizeMode="cover" />
      </Pressable>);

  }
  const icon = mime.startsWith('video/') || type === 'VIDEO' ? 'play-circle-outline' :
  mime.startsWith('audio/') || type === 'AUDIO' ? 'musical-notes-outline' : 'document-outline';
  return (
    <Pressable onPress={() => Linking.openURL(url)} style={[styles.file, out && styles.fileOut]}>
      <Ionicons name={icon} size={18} color={out ? '#fff' : colors.text2} />
      <Text numberOfLines={1} style={[styles.fileName, out && { color: '#fff' }]}>
        {message.mediaFilename || 'Attachment'}
      </Text>
    </Pressable>);

}

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
  const [vars, setVars] = useState(null);
  const templates = useAsync(() => windowOpen ? Promise.resolve([]) : whatsapp.templates().catch(() => []), [windowOpen]);
  const listRef = useRef(null);

  const selected = (templates.data || []).find((t) => t.name === template) || null;
  const slots = useMemo(() => templateSlots(selected), [selected]);
  const needsVars = hasVariables(slots, selected);
  // The backend refuses a template whose variables are not all filled.
  const ready = !!template && (!needsVars || variablesComplete(slots, selected, vars));

  /** Choosing a template starts a fresh set of values shaped like that template. */
  const chooseTemplate = (t) => {
    const next = template === t.name ? null : t.name;
    setTemplate(next);
    setVars(next ? emptyVariables(templateSlots(t)) : null);
  };

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
    if (windowOpen ? !text.trim() : !ready) return;
    setSending(true);
    try {
      await whatsapp.send(windowOpen ?
      { conversationId: id, message: text.trim() } :
      {
        conversationId: id, templateName: template, templateLanguage: selected?.language || 'en',
        ...needsVars ? { templateVariables: vars } : {}
      });
      setText('');setTemplate(null);setVars(null);
      await load(true);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {toast.error(e?.message || 'Could not send');} finally
    {setSending(false);}
  };

  /*
   * WhatsApp's own palette, on purpose: the read-tick blue and the wallpaper
   * beige below are what a customer sees in WhatsApp itself. Swapping them for
   * XetaX brand tokens would make this screen look like a different app than
   * the conversation it is mirroring.
   */
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
              <Media message={m} out={out} />
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
              {(templates.data || []).filter((t) => t.status === 'APPROVED').map((t) => <Chip key={t.name} text={t.name} active={template === t.name} onPress={() => chooseTemplate(t)} />)}
              {templates.data && !templates.data.some((t) => t.status === 'APPROVED') ? <Muted>No approved templates.</Muted> : null}
            </View>
            {needsVars ?
          <ScrollView style={{ maxHeight: 240 }} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                <TemplateVariablesForm slots={slots} template={selected} value={vars} onChange={setVars} />
              </ScrollView> :
          null}
            <Pressable onPress={send} disabled={sending || !ready} style={[styles.send, { alignSelf: 'flex-end', marginTop: 8, width: 'auto', paddingHorizontal: 14, flexDirection: 'row', gap: 6 }, (!ready || sending) && { opacity: 0.5 }]}>
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
  media: { width: 200, height: 200, borderRadius: 10, marginBottom: 4 },
  file: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 8,
    borderRadius: 8, backgroundColor: colors.surfaceAlt, marginBottom: 4, maxWidth: 220 },
  fileOut: { backgroundColor: 'rgba(255,255,255,0.18)' },
  fileName: { fontSize: 13, color: colors.text, flexShrink: 1 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: space.sm, paddingHorizontal: space.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, maxHeight: 120, backgroundColor: colors.surfaceAlt },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }
});
