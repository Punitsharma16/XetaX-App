import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { displayValue } from '@/features/fields';
import { useAsync } from '@/lib/use-async';
import { desk, forms, records, recordTitle, tasks } from '@/services';
import { useToast } from '@/state/toast';
import { Button, Caption, Card, Chip, ErrorState, KeyValue, Loading, Muted, Pill, Screen, SectionTitle } from '@/ui';
import { colors, formatDate, radius, space } from '@/ui/theme';

export default function RecordDetailScreen() {
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams();
  const id = String(params.id);
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  const rec = useAsync(() => records.get(id), [id, tick]);
  const formId = rec.data?.formId ?? (params.formId ? Number(params.formId) : null);
  const fields = useAsync(() => formId ? forms.fields(formId) : Promise.resolve([]), [formId]);
  const stages = useAsync(() => formId ? forms.stages(formId) : Promise.resolve([]), [formId]);
  const activity = useAsync(() => records.activity(id).catch(() => []), [id, tick]);
  const recTasks = useAsync(() => tasks.forRecord(id).catch(() => []), [id, tick]);
  const aiCard = useAsync(() => desk.recordAi(id).catch(() => ({ session: null })), [id, tick]);
  const [changing, setChanging] = useState(false);

  const visibleFields = useMemo(() => (fields.data || []).filter((f) => !f.hidden).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)), [fields.data]);
  const stage = (stages.data || []).find((s) => s.id === rec.data?.stageId);
  const title = rec.data ? recordTitle(rec.data, visibleFields) : 'Record';
  const phone = visibleFields.find((f) => f.fieldType === 'PHONE');
  const email = visibleFields.find((f) => f.fieldType === 'EMAIL');
  const phoneVal = phone ? String(rec.data?.data?.[phone.fieldKey] || '') : '';
  const emailVal = email ? String(rec.data?.data?.[email.fieldKey] || '') : '';

  const moveStage = async (stageId) => {
    if (!rec.data || stageId === rec.data.stageId) return;
    setChanging(true);
    try {await records.changeStage(id, stageId);toast.success('Stage updated');refresh();}
    catch (e) {toast.error(e?.message || 'Could not change stage');} finally
    {setChanging(false);}
  };

  const remove = () => {
    const go = async () => {
      try {await records.remove(id);toast.success('Record deleted');router.back();}
      catch (e) {toast.error(e?.message || 'Could not delete');}
    };
    if (Platform.OS === 'web') {go();return;}
    Alert.alert('Delete record', 'This cannot be undone.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: go }]);
  };

  const session = aiCard.data?.session;

  return (
    <Screen refreshing={rec.loading && !!rec.data} onRefresh={refresh}>
      <Stack.Screen options={{ title, headerRight: () => rec.data ?
        <Pressable onPress={() => router.push({ pathname: '/record/edit', params: { id, formId: String(formId || ''), slug: params.slug || '' } })} hitSlop={8} style={{ paddingHorizontal: 6 }}>
          <Ionicons name="create-outline" size={24} color={colors.brand} />
        </Pressable> :
        null }} />
      {rec.loading && !rec.data ? <Loading /> : null}
      {rec.error && !rec.data ? <ErrorState message={rec.error} onRetry={refresh} /> : null}
      {rec.data ?
      <>
          <Card>
            <Text style={styles.title}>{title}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              {stage ? <Pill text={stage.name} style={stage.color ? { backgroundColor: stage.color + '22' } : undefined} /> : <Pill text="No stage" tone="muted" />}
              <Caption>Created {formatDate(rec.data.createdAt)}</Caption>
            </View>
            {phoneVal || emailVal ?
          <View style={styles.actions}>
                {phoneVal ? <ActionBtn icon="call-outline" label="Call" onPress={() => Linking.openURL(`tel:${phoneVal}`)} /> : null}
                {phoneVal ? <ActionBtn icon="logo-whatsapp" label="WhatsApp" color={colors.whatsapp} onPress={() => Linking.openURL(`https://wa.me/${phoneVal.replace(/\D/g, '')}`)} /> : null}
                {emailVal ? <ActionBtn icon="mail-outline" label="Email" onPress={() => Linking.openURL(`mailto:${emailVal}`)} /> : null}
              </View> :
          null}
          </Card>

          {(stages.data || []).length ?
        <>
              <SectionTitle title="Stage" />
              <View style={styles.chips}>
                {(stages.data || []).sort((a, b) => a.sequence - b.sequence).map((s) =>
            <Chip key={s.id} text={s.name} active={s.id === rec.data.stageId} onPress={() => !changing && moveStage(s.id)} />
            )}
              </View>
            </> :
        null}

          {session ?
        <>
              <SectionTitle title="AI conversation" />
              <Card>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name={session.channel === 'WHATSAPP' ? 'logo-whatsapp' : 'globe-outline'} size={16} color={session.channel === 'WHATSAPP' ? colors.whatsapp : colors.brand} />
                  <Caption>{session.channel === 'WHATSAPP' ? 'WhatsApp' : 'Website'} · {session.status === 'HUMAN' ? `with ${session.acceptedByName || 'a teammate'}` : session.status === 'WAITING_HUMAN' ? 'waiting for your team' : session.status === 'RESOLVED' ? 'closed' : 'assistant is handling'}</Caption>
                </View>
                {session.pendingStageId ?
            <View style={styles.suggest}>
                    <Text style={{ fontWeight: '600', color: colors.text, marginBottom: 8 }}>AI suggests moving to “{session.pendingStageName}”</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Button title="Apply" small onPress={async () => {try {await desk.applySuggestion(session.id);toast.success('Applied');refresh();} catch (e) {toast.error(e?.message);}}} />
                      <Button title="Dismiss" small variant="secondary" onPress={async () => {try {await desk.dismissSuggestion(session.id);refresh();} catch (e) {toast.error(e?.message);}}} />
                    </View>
                  </View> :
            null}
                <Muted style={{ marginTop: 8 }}>{session.summary || 'Conversation in progress — a summary is saved once the chat goes quiet.'}</Muted>
              </Card>
            </> :
        null}

          <SectionTitle title="Details" />
          <Card>
            {visibleFields.map((f, i) => <KeyValue key={f.id} label={f.label} value={displayValue(f, rec.data.data?.[f.fieldKey])} last={i === visibleFields.length - 1} />)}
            {!visibleFields.length ? <Muted>No fields defined for this form.</Muted> : null}
          </Card>

          <SectionTitle title="Tasks" action="Add" onAction={() => router.push({ pathname: '/task/new', params: { recordId: id, linkedName: title } })} />
          <Card style={{ padding: 0 }}>
            {(recTasks.data || []).length === 0 ? <Muted style={{ padding: space.md }}>No tasks linked to this record.</Muted> : null}
            {(recTasks.data || []).map((t, i) =>
          <Pressable key={t.id} onPress={async () => {try {await tasks.setDone(t.id, t.status !== 'DONE');refresh();} catch (e) {toast.error(e?.message);}}} style={[styles.taskRow, i > 0 && styles.sep]}>
                <Ionicons name={t.status === 'DONE' ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={t.status === 'DONE' ? colors.success : colors.text3} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.taskTitle, t.status === 'DONE' && { textDecorationLine: 'line-through', color: colors.text3 }]}>{t.title}</Text>
                  {t.dueAt ? <Caption>Due {formatDate(t.dueAt, true)}</Caption> : null}
                </View>
              </Pressable>
          )}
          </Card>

          <SectionTitle title="Activity" />
          <Card style={{ padding: 0 }}>
            {(activity.data || []).length === 0 ? <Muted style={{ padding: space.md }}>No activity yet.</Muted> : null}
            {(activity.data || []).slice(0, 20).map((a, i) =>
          <View key={a.id} style={[styles.taskRow, i > 0 && styles.sep]}>
                <Ionicons name={iconFor(a.type)} size={18} color={colors.brand} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 14 }}>{a.detail || a.type}</Text>
                  <Caption>{a.actorName ? a.actorName + ' · ' : ''}{formatDate(a.createdAt, true)}</Caption>
                </View>
              </View>
          )}
          </Card>

          <Button title="Delete record" icon="trash-outline" variant="danger" onPress={remove} style={{ marginTop: space.lg }} />
        </> :
      null}
    </Screen>);

}

function iconFor(type) {
  const t = type.toUpperCase();
  if (t.includes('STAGE')) return 'git-branch-outline';
  if (t.includes('AI_SUMMARY')) return 'sparkles-outline';
  if (t.includes('AI_SUGGESTION')) return 'bulb-outline';
  if (t.includes('CREATED')) return 'add-circle-outline';
  if (t.includes('WHATSAPP')) return 'logo-whatsapp';
  if (t.includes('EMAIL')) return 'mail-outline';
  if (t.includes('ASSIGN')) return 'person-outline';
  return 'time-outline';
}

function ActionBtn({ icon, label, onPress, color = colors.brand }) {
  return (
    <Pressable onPress={onPress} style={styles.actionBtn}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
    </Pressable>);

}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  actions: { flexDirection: 'row', gap: 8, marginTop: space.md },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt },
  actionLabel: { fontSize: 13, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: space.sm },
  suggest: { marginTop: space.md, backgroundColor: colors.warningSoft, borderRadius: radius.md, padding: space.md },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: space.lg, paddingVertical: 12 },
  sep: { borderTopWidth: 1, borderTopColor: colors.border },
  taskTitle: { color: colors.text, fontSize: 14.5, fontWeight: '600' }
});
