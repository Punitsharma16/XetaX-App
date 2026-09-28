import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { PANEL_URL } from '@/lib/config';
import { useAsync } from '@/lib/use-async';
import { emailCampaigns, forms } from '@/services';
import { useToast } from '@/state/toast';
import { Button, Caption, Card, Chip, Input, Label, Muted, Screen } from '@/ui';
import { colors, radius, space } from '@/ui/theme';

/** Placeholder keys every contact carries — the CONTACTS audience has no form fields. */
const CONTACT_KEYS = ['name', 'email', 'phone', 'company'];

/**
 * Create an email campaign from the phone: audience (records of a form with
 * an email field, or every contact with an email) → subject + body with
 * {placeholders} → send now / schedule / save as draft.
 *
 * CSV audiences are deliberately web-only: they need a file picker and a
 * multipart upload the app does not ship, and a phone is the wrong place to
 * pick a spreadsheet anyway. The wizard says so instead of hiding the option.
 */
export default function NewEmailCampaignScreen() {
  const router = useRouter();
  const toast = useToast();

  const sender = useAsync(() => emailCampaigns.status(), []);
  const formList = useAsync(() => forms.list(), []);

  const [source, setSource] = useState('RECORDS');
  const [formId, setFormId] = useState(null);
  const [fields, setFields] = useState([]);
  const [emailFieldKey, setEmailFieldKey] = useState('');
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [scheduleAt, setScheduleAt] = useState('');
  const [busy, setBusy] = useState(false);

  const selectedForm = useMemo(() => (formList.data || []).find((f) => f.id === formId) || null, [formList.data, formId]);

  useEffect(() => {
    let live = true;
    setFields([]);setEmailFieldKey('');
    if (formId == null) return undefined;
    forms.fields(formId).then((list) => {
      if (!live) return;
      setFields(list || []);
      const emailLike = (list || []).find((f) => String(f.fieldType) === 'EMAIL' || /e-?mail/i.test(f.label || '') || /e-?mail/i.test(f.fieldKey || ''));
      if (emailLike) setEmailFieldKey(emailLike.fieldKey);
    }).catch(() => {if (live) setFields([]);});
    return () => {live = false;};
  }, [formId]);

  const placeholderKeys = source === 'CONTACTS' ? CONTACT_KEYS : fields.map((f) => f.fieldKey);
  const notConfigured = sender.data && !sender.data.configured;

  const submit = async (start) => {
    if (notConfigured) {toast.error('Add your email account under Profile → Email (SMTP) on the web panel first');return;}
    if (source === 'RECORDS' && (!selectedForm || !emailFieldKey)) {toast.error('Pick the form and its email field');return;}
    if (!name.trim()) {toast.error('Give the campaign a name');return;}
    if (!subject.trim()) {toast.error('Write the email subject');return;}
    if (!body.trim()) {toast.error('Write the email message');return;}
    let scheduledAt;
    if (start && scheduleAt.trim()) {
      const d = new Date(scheduleAt.trim());
      if (isNaN(d.getTime())) {toast.error('Schedule must look like 2026-09-30 15:00');return;}
      scheduledAt = d.toISOString();
    }
    setBusy(true);
    try {
      const campaign = await emailCampaigns.create({
        name: name.trim(), subject: subject.trim(), body, sourceType: source,
        formSlug: source === 'RECORDS' ? selectedForm.slug : undefined,
        emailFieldKey: source === 'RECORDS' ? emailFieldKey : undefined
      });
      if (start) {
        await emailCampaigns.start(campaign.id, scheduledAt);
        toast.success(scheduledAt ? 'Campaign scheduled' : 'Campaign started');
      } else {
        toast.success('Draft saved');
      }
      router.replace({ pathname: '/email-campaign/[id]', params: { id: String(campaign.id) } });
    } catch (e) {toast.error(e?.message || 'Could not create the campaign');} finally
    {setBusy(false);}
  };

  return (
    <Screen
      footer={
      <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Button title="Save draft" variant="secondary" onPress={() => submit(false)} disabled={busy} style={{ flex: 1 }} />
          <Button title={scheduleAt.trim() ? 'Schedule' : 'Create & start'} icon="paper-plane-outline" onPress={() => submit(true)} loading={busy} style={{ flex: 1.4 }} />
        </View>
      }>

      {notConfigured ?
      <Card style={styles.notice}>
          <Ionicons name="warning-outline" size={20} color={colors.warning} />
          <View style={{ flex: 1 }}>
            <Text style={styles.noticeTitle}>No sender email yet</Text>
            <Muted>Campaigns go out from your own email account. Add it on the web panel under Profile → Email (SMTP).</Muted>
            <Pressable onPress={() => Linking.openURL(`${PANEL_URL}/app/profile`)} hitSlop={6}><Text style={styles.link}>Open web panel</Text></Pressable>
          </View>
        </Card> :
      sender.data?.fromEmail ?
      <Caption style={{ marginBottom: space.sm }}>Will be sent as {sender.data.fromEmail}</Caption> :
      null}

      <Card>
        <Label>Audience</Label>
        <View style={styles.sources}>
          <SourceCard icon="albums-outline" title="CRM records" text="Records of one form" active={source === 'RECORDS'} onPress={() => setSource('RECORDS')} />
          <SourceCard icon="people-outline" title="All contacts" text="Everyone with an email" active={source === 'CONTACTS'} onPress={() => setSource('CONTACTS')} />
        </View>

        {source === 'RECORDS' ?
        <>
            <Label>Form</Label>
            <View style={styles.chips}>
              {(formList.data || []).map((f) => <Chip key={f.id} text={f.name} active={formId === f.id} onPress={() => setFormId(f.id)} />)}
              {formList.data && formList.data.length === 0 ? <Muted>No forms yet.</Muted> : null}
            </View>
            {formId != null ?
          <>
                <Label>Email field</Label>
                <View style={styles.chips}>
                  {fields.map((f) => <Chip key={f.id} text={f.label} active={emailFieldKey === f.fieldKey} onPress={() => setEmailFieldKey(f.fieldKey)} />)}
                </View>
                <Caption style={{ marginBottom: space.sm }}>Records without a valid email address are skipped automatically.</Caption>
              </> :
          null}
          </> :
        <Caption style={{ marginBottom: space.sm }}>Every contact with an email address will be included.</Caption>}

        <Caption style={{ marginBottom: space.md }}>Need to email a CSV list? Upload it from the web panel — it is not available in the app.</Caption>
      </Card>

      <Card>
        <Input label="Campaign name *" value={name} onChangeText={setName} placeholder="Diwali offer mailer" />
        <Input label="Subject *" value={subject} onChangeText={setSubject} placeholder="{name}, a special offer for you" />
        <Input label="Message *" value={body} onChangeText={setBody} placeholder={'Hi {name},\n\nWe have an offer for you…'} multiline style={{ minHeight: 140, textAlignVertical: 'top' }} />
        {placeholderKeys.length ?
        <>
            <Caption>Insert field</Caption>
            <View style={styles.chips}>
              {placeholderKeys.map((k) => <Chip key={k} text={`{${k}}`} onPress={() => setBody((b) => `${b}{${k}}`)} />)}
            </View>
          </> :
        null}
        <Caption style={{ marginBottom: space.md }}>Plain text. Placeholders work in the subject too — each recipient gets their own values.</Caption>
        <Input label="Schedule (optional)" value={scheduleAt} onChangeText={setScheduleAt} placeholder="2026-09-30 15:00" hint="Leave empty to start right away." />
      </Card>
    </Screen>);

}

function SourceCard({ icon, title, text, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.source, active && styles.sourceOn]}>
      <Ionicons name={icon} size={20} color={active ? colors.brand : colors.text2} />
      <Text style={[styles.sourceTitle, active && { color: colors.brandText }]}>{title}</Text>
      <Caption>{text}</Caption>
    </Pressable>);

}

const styles = StyleSheet.create({
  notice: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start', backgroundColor: colors.warningSoft, borderColor: colors.warningSoft },
  noticeTitle: { fontWeight: '700', color: colors.text, marginBottom: 2 },
  link: { color: colors.brand, fontWeight: '600', marginTop: 6 },
  sources: { flexDirection: 'row', gap: space.sm, marginTop: 6, marginBottom: space.md },
  source: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: space.md, gap: 4 },
  sourceOn: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  sourceTitle: { fontWeight: '700', color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6, marginBottom: space.md }
});
