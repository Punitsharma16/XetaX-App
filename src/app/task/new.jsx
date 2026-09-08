import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { tasks } from '@/services';
import { useToast } from '@/state/toast';
import { Button, Card, Chip, Input, Label, Muted, Screen } from '@/ui';
import { colors, space } from '@/ui/theme';

function at(daysFromNow, hour = 10) {
  const d = new Date();d.setDate(d.getDate() + daysFromNow);d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export default function NewTaskScreen() {
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueAt, setDueAt] = useState(at(0, 17));
  const [custom, setCustom] = useState('');
  const [remindEmail, setRemindEmail] = useState(false);
  const [remindWhatsApp, setRemindWhatsApp] = useState(false);
  const [busy, setBusy] = useState(false);

  const quick = [['Today 5pm', at(0, 17)], ['Tomorrow 10am', at(1)], ['In 3 days', at(3)], ['Next week', at(7)], ['No date', null]];

  const save = async () => {
    if (!title.trim()) {toast.error('Give the task a title');return;}
    let due = dueAt;
    if (custom.trim()) {
      const d = new Date(custom.trim());
      if (isNaN(d.getTime())) {toast.error('Custom date must look like 2026-09-30 15:00');return;}
      due = d.toISOString();
    }
    setBusy(true);
    try {
      await tasks.create({ title: title.trim(), notes: notes.trim() || undefined, dueAt: due, remindEmail, remindWhatsApp,
        recordId: params.recordId || null, contactId: params.contactId ? Number(params.contactId) : null, linkedName: params.linkedName || null });
      toast.success('Task added');
      router.back();
    } catch (e) {toast.error(e?.message || 'Could not add the task');} finally
    {setBusy(false);}
  };

  return (
    <Screen footer={<Button title="Add task" icon="checkmark" onPress={save} loading={busy} />}>
      {params.linkedName ? <Muted style={{ marginBottom: space.sm }}>Linked to: {params.linkedName}</Muted> : null}
      <Card>
        <Input label="Task *" value={title} onChangeText={setTitle} placeholder="Call Ramesh about the quotation" autoFocus />
        <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="Anything to remember" multiline style={{ minHeight: 72, textAlignVertical: 'top' }} />
        <Label>Due</Label>
        <View style={styles.chips}>
          {quick.map(([l, v]) => <Chip key={l} text={l} active={dueAt === v && !custom} onPress={() => {setDueAt(v);setCustom('');}} />)}
        </View>
        <Input label="Or a custom date/time" value={custom} onChangeText={setCustom} placeholder="2026-09-30 15:00" />
        <View style={styles.switchRow}><Text style={styles.switchLabel}>Remind me by email</Text><Switch value={remindEmail} onValueChange={setRemindEmail} trackColor={{ true: colors.brand }} /></View>
        <View style={styles.switchRow}><Text style={styles.switchLabel}>Remind me on WhatsApp</Text><Switch value={remindWhatsApp} onValueChange={setRemindWhatsApp} trackColor={{ true: colors.brand }} /></View>
      </Card>
    </Screen>);

}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6, marginBottom: space.md },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  switchLabel: { color: colors.text, fontSize: 14.5 }
});
