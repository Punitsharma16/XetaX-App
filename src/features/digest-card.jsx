import React, { useEffect, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { settings } from '@/services';
import { useToast } from '@/state/toast';
import { Button, Caption, Card, Label, Muted, SectionTitle } from '@/ui';
import { colors, space } from '@/ui/theme';

/**
 * The 9 AM morning digest, with the same switches as the web panel's profile
 * card. The bell has no switch on purpose: while the digest is on it always
 * appears there. Email and WhatsApp can be turned off on their own, or the
 * whole digest can be.
 */
export function DigestCard() {
  const toast = useToast();
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    settings.digest().
    then((s) => {if (alive) setState(s || null);}).
    catch(() => {}).
    finally(() => {if (alive) setLoading(false);});
    return () => {alive = false;};
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const saved = await settings.saveDigest({
        enabled: !!state.enabled,
        emailEnabled: !!state.emailEnabled,
        whatsappEnabled: !!state.whatsappEnabled
      });
      if (saved) setState((s) => ({ ...s, ...saved }));
      toast.success('Digest settings saved');
    } catch (e) {toast.error(e?.message || 'Could not save');} finally
    {setSaving(false);}
  };

  if (loading || !state) return null;

  const row = (label, key, disabled) =>
  <View style={[styles.row, disabled && { opacity: 0.5 }]}>
      <Label style={{ marginBottom: 0, flex: 1 }}>{label}</Label>
      <Switch
      value={!!state[key]}
      disabled={disabled}
      onValueChange={(b) => setState((s) => ({ ...s, [key]: b }))}
      trackColor={{ true: colors.brand }} />
    </View>;


  return (
    <View>
      <SectionTitle title="Morning digest" />
      <Card>
        <Muted style={{ marginBottom: space.sm }}>
          Every day at 9:00 AM: leads untouched for 3+ days, WhatsApp chats waiting for a reply,
          and tasks due today. While it is on, it always appears in your notification bell.
        </Muted>

        {!state.canEdit ?
        <Caption>The morning digest goes to the workspace owner. Only they can change where it is sent.</Caption> :

        <View>
            {row('Send me the morning digest', 'enabled', false)}
            {row('Also email it to me', 'emailEnabled', !state.enabled)}
            {!state.emailReady ?
          <Caption style={styles.hint}>Add your email (SMTP) in the panel first — until then nothing is emailed.</Caption> :
          null}

            {row('Also send it on WhatsApp', 'whatsappEnabled', !state.enabled)}
            <Caption style={styles.hint}>
              Goes to the phone number on your profile. WhatsApp only delivers it if you messaged your
              business number in the last 24 hours.
              {' From 1 October 2026, Meta charges for each WhatsApp digest (at the utility rate).'}
              {!state.phoneOnProfile ? ' Add a phone number to your profile first.' : ''}
              {!state.whatsappConnected ? ' Connect WhatsApp first.' : ''}
            </Caption>

            <Button title="Save digest settings" icon="checkmark" onPress={save} loading={saving} style={{ marginTop: space.md }} />
          </View>
        }
      </Card>
    </View>);

}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm, paddingVertical: 6 },
  hint: { marginBottom: space.sm }
});
