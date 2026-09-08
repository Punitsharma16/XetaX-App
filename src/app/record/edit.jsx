import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';

import { FieldInput } from '@/features/fields';
import { useAsync } from '@/lib/use-async';
import { forms, records } from '@/services';
import { useToast } from '@/state/toast';
import { Button, Card, ErrorState, Loading, Muted, Screen } from '@/ui';
import { space } from '@/ui/theme';

/** Create (slug+formId) or edit (id) a record with the form's own fields. */
export default function RecordEditScreen() {
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams();
  const editing = !!params.id;
  const [formId, setFormId] = useState(params.formId ? Number(params.formId) : null);
  const [slug, setSlug] = useState(params.slug || '');
  const [data, setData] = useState({});
  const [busy, setBusy] = useState(false);

  const existing = useAsync(() => editing ? records.get(String(params.id)) : Promise.resolve(null), [params.id]);
  const formList = useAsync(() => forms.list(), []);
  useEffect(() => {
    if (existing.data) {setData(existing.data.data || {});setFormId(existing.data.formId);}
  }, [existing.data]);
  useEffect(() => {
    if (!slug && formId && formList.data) {const f = formList.data.find((x) => x.id === formId);if (f) setSlug(f.slug);}
  }, [slug, formId, formList.data]);

  const fields = useAsync(() => formId ? forms.fields(formId) : Promise.resolve([]), [formId]);
  const visible = useMemo(() => (fields.data || []).filter((f) => !f.hidden && f.fieldType !== 'FILE').sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)), [fields.data]);

  const save = async () => {
    for (const f of visible) {
      const v = data[f.fieldKey];
      if (f.required && (v === undefined || v === null || v === '' || Array.isArray(v) && !v.length)) {toast.error(`${f.label} is required`);return;}
    }
    setBusy(true);
    try {
      if (editing) {await records.update(String(params.id), data);toast.success('Record updated');router.back();} else
      {
        const created = await records.create(slug, data);
        toast.success('Record created');
        router.replace({ pathname: '/record/[id]', params: { id: created.id, formId: String(formId || ''), slug } });
      }
    } catch (e) {toast.error(e?.message || 'Could not save');} finally
    {setBusy(false);}
  };

  const loading = editing && existing.loading || fields.loading;
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <Screen>
        <Stack.Screen options={{ title: editing ? 'Edit record' : 'New record' }} />
        {loading && !visible.length ? <Loading /> : null}
        {fields.error ? <ErrorState message={fields.error} /> : null}
        {visible.length ?
        <Card>
            {visible.map((f) => <FieldInput key={f.id} field={f} value={data[f.fieldKey]} onChange={(v) => setData((d) => ({ ...d, [f.fieldKey]: v }))} />)}
          </Card> :
        !loading ? <Card><Muted>This form has no fields yet — add them in the web panel.</Muted></Card> : null}
        <Button title={editing ? 'Save changes' : 'Create record'} icon="save-outline" onPress={save} loading={busy} style={{ marginTop: space.md }} />
      </Screen>
    </KeyboardAvoidingView>);

}
