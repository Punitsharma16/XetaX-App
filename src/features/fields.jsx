import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { fieldOptions } from '@/services';
import { Chip, Input, Label } from '@/ui';
import { colors, formatDate, radius, space } from '@/ui/theme';

/** Human display of one field value. */
export function displayValue(f, v) {
  if (v === null || v === undefined || v === '') return '—';
  switch (f.fieldType) {
    case 'BOOLEAN':return v === true || v === 'true' ? 'Yes' : 'No';
    case 'DATE':return formatDate(String(v));
    case 'DATETIME':return formatDate(String(v), true);
    case 'MULTI_SELECT':case 'CHECKBOX':return Array.isArray(v) ? v.join(', ') : String(v);
    case 'PASSWORD':return '••••••';
    default:return String(v);
  }
}

/** Editable control for one field — keeps the value in the same shape the web panel stores. */
export function FieldInput({ field, value, onChange }) {
  const label = field.label + (field.required ? ' *' : '');
  const options = fieldOptions(field);

  switch (field.fieldType) {
    case 'BOOLEAN':
      return (
        <View style={styles.row}>
          <Label>{label}</Label>
          <Switch value={value === true || value === 'true'} onValueChange={(b) => onChange(b)} trackColor={{ true: colors.brand }} />
        </View>);

    case 'SELECT':
    case 'RADIO':
      return (
        <View style={{ marginBottom: space.md }}>
          <Label>{label}</Label>
          <View style={styles.chips}>
            {options.map((o) => <Chip key={o} text={o} active={value === o} onPress={() => onChange(value === o ? '' : o)} />)}
          </View>
        </View>);

    case 'MULTI_SELECT':
    case 'CHECKBOX':{
        const arr = Array.isArray(value) ? value : value ? String(value).split(',').map((s) => s.trim()) : [];
        return (
          <View style={{ marginBottom: space.md }}>
          <Label>{label}</Label>
          <View style={styles.chips}>
            {options.map((o) =>
              <Chip key={o} text={o} active={arr.includes(o)} onPress={() => onChange(arr.includes(o) ? arr.filter((x) => x !== o) : [...arr, o])} />
              )}
          </View>
        </View>);

      }
    case 'TEXTAREA':
      return <Input label={label} value={value == null ? '' : String(value)} onChangeText={onChange} placeholder={field.placeholder} multiline numberOfLines={4} style={{ minHeight: 96, textAlignVertical: 'top' }} />;
    case 'NUMBER':
    case 'DECIMAL':
      return <Input label={label} value={value == null ? '' : String(value)} onChangeText={(t) => onChange(t === '' ? '' : Number(t))} placeholder={field.placeholder} keyboardType={field.fieldType === 'DECIMAL' ? 'decimal-pad' : 'number-pad'} />;
    case 'EMAIL':
      return <Input label={label} value={value == null ? '' : String(value)} onChangeText={onChange} placeholder={field.placeholder || 'name@company.com'} keyboardType="email-address" autoCapitalize="none" />;
    case 'PHONE':
      return <Input label={label} value={value == null ? '' : String(value)} onChangeText={onChange} placeholder={field.placeholder || '98xxxxxxxx'} keyboardType="phone-pad" />;
    case 'DATE':
    case 'DATETIME':
    case 'TIME':
      return <Input label={label} value={value == null ? '' : String(value)} onChangeText={onChange} placeholder={field.fieldType === 'DATE' ? 'YYYY-MM-DD' : field.fieldType === 'TIME' ? 'HH:MM' : 'YYYY-MM-DDTHH:MM'} hint={field.fieldType === 'DATE' ? 'Format: 2026-09-30' : undefined} />;
    case 'FILE':
      return (
        <View style={{ marginBottom: space.md }}>
          <Label>{label}</Label>
          <Pressable style={styles.fileBox}><Text style={{ color: colors.text3, fontSize: 13 }}>{value ? String(value) : 'File uploads are done from the web panel'}</Text></Pressable>
        </View>);

    default:
      return <Input label={label} value={value == null ? '' : String(value)} onChangeText={onChange} placeholder={field.placeholder} secureTextEntry={field.fieldType === 'PASSWORD'} />;
  }
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md, paddingVertical: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  fileBox: { borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', borderRadius: radius.md, padding: space.md, marginTop: 6, backgroundColor: colors.surfaceAlt }
});
