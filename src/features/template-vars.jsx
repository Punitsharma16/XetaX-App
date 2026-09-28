import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Caption, Input, Label } from '@/ui';
import { colors, radius, space } from '@/ui/theme';

/**
 * Every value a WhatsApp template needs before it can be sent — header, body,
 * each button, each carousel card. Mirrors the web panel's template-variables
 * component and the backend's WhatsAppTemplateVariables, so the app asks for
 * exactly what a send accepts. The backend rejects a template whose variables
 * are missing, so this is what keeps a template send from failing.
 */

const VAR = /\{\{(\d+)\}\}/g;
const MEDIA = ['IMAGE', 'VIDEO', 'DOCUMENT'];

function maxVar(text) {
  let max = 0;
  for (const m of String(text || '').matchAll(VAR)) max = Math.max(max, Number(m[1]));
  return max;
}

function buttonSlots(buttons) {
  return (buttons || []).map((b, index) => {
    const type = String(b?.type || '').toUpperCase();
    const url = String(b?.url || '');
    return {
      index,
      type,
      label: b?.text || type,
      url,
      needsValue: type === 'URL' && /\{\{\d+\}\}/.test(url) || type === 'OTP' || type === 'COPY_CODE'
    };
  });
}

/** Reads a template's saved components into the shape of its variables. */
export function templateSlots(template) {
  if (!template) return null;
  const slots = {
    headerFormat: null, headerText: '', headerVars: 0, bodyText: '', bodyVars: 0,
    buttons: [], cards: [], authentication: String(template.category || '').toUpperCase() === 'AUTHENTICATION'
  };
  let components = [];
  try {
    components = JSON.parse(template.componentsJson || '[]');
  } catch {components = [];}

  for (const c of Array.isArray(components) ? components : []) {
    const type = String(c?.type || '').toUpperCase();
    if (type === 'HEADER') {
      slots.headerFormat = String(c.format || 'TEXT').toUpperCase();
      if (slots.headerFormat === 'TEXT') {
        slots.headerText = c.text || '';
        slots.headerVars = maxVar(c.text);
      }
    } else if (type === 'BODY') {
      slots.bodyText = c.text || '';
      slots.bodyVars = maxVar(c.text);
    } else if (type === 'BUTTONS') {
      slots.buttons = buttonSlots(c.buttons);
    } else if (type === 'CAROUSEL') {
      (c.cards || []).forEach((card, index) => {
        const slot = { index, headerFormat: 'IMAGE', bodyText: '', bodyVars: 0, buttons: [] };
        for (const part of card?.components || []) {
          const t = String(part?.type || '').toUpperCase();
          if (t === 'HEADER') slot.headerFormat = String(part.format || 'IMAGE').toUpperCase();
          else if (t === 'BODY') {slot.bodyText = part.text || '';slot.bodyVars = maxVar(part.text);}
          else if (t === 'BUTTONS') slot.buttons = buttonSlots(part.buttons);
        }
        slots.cards.push(slot);
      });
    }
  }
  // An OTP body always carries the code, even when it has no {{1}}.
  if (slots.authentication && slots.bodyVars === 0) slots.bodyVars = 1;
  return slots;
}

/** A blank set of values shaped like the template. */
export function emptyVariables(slots) {
  const buttons = {};
  // For an OTP template the code is typed once, in the body.
  if (slots && !slots.authentication) {
    for (const b of slots.buttons) if (b.needsValue) buttons[String(b.index)] = '';
  }
  return {
    header: Array(slots?.headerVars || 0).fill(''),
    headerMediaUrl: '',
    body: Array(slots?.bodyVars || 0).fill(''),
    buttons,
    cards: (slots?.cards || []).map((card) => {
      const cardButtons = {};
      for (const b of card.buttons) if (b.needsValue) cardButtons[String(b.index)] = '';
      return { headerMediaUrl: '', body: Array(card.bodyVars).fill(''), buttons: cardButtons };
    })
  };
}

/** True when the template asks for anything at all. */
export function hasVariables(slots, template) {
  if (!slots) return false;
  const mediaWithoutLink = !!slots.headerFormat && MEDIA.includes(slots.headerFormat) && !template?.headerMediaUrl;
  return mediaWithoutLink || slots.headerVars > 0 || slots.bodyVars > 0 || slots.cards.length > 0 ||
  slots.buttons.some((b) => b.needsValue);
}

/** True when every required value is filled — the same rule the backend enforces. */
export function variablesComplete(slots, template, v) {
  if (!slots || !v) return !slots;
  const filled = (s) => !!s && !!String(s).trim();
  if (slots.headerFormat && MEDIA.includes(slots.headerFormat) && !template?.headerMediaUrl && !filled(v.headerMediaUrl)) {
    return false;
  }
  if (v.header.length !== slots.headerVars || !v.header.every(filled)) return false;
  if (v.body.length !== slots.bodyVars || !v.body.every(filled)) return false;
  if (!slots.authentication && !slots.buttons.filter((b) => b.needsValue).every((b) => filled(v.buttons[String(b.index)]))) {
    return false;
  }
  return slots.cards.every((card, i) => {
    const cv = v.cards[i];
    if (!cv) return card.bodyVars === 0 && card.buttons.every((b) => !b.needsValue);
    return cv.body.length === card.bodyVars && cv.body.every(filled) &&
    card.buttons.filter((b) => b.needsValue).every((b) => filled(cv.buttons[String(b.index)]));
  });
}

const mediaLabel = (format) => format === 'VIDEO' ? 'Video' : format === 'DOCUMENT' ? 'Document' : 'Image';

/** Asks for each value the chosen template needs. */
export function TemplateVariablesForm({ slots, template, value, onChange }) {
  if (!slots || !value || !hasVariables(slots, template)) return null;

  const patch = (change) => onChange({ ...value, ...change });
  const setAt = (list, i, v) => list.map((old, idx) => idx === i ? v : old);
  const setCard = (ci, change) => patch({ cards: value.cards.map((c, i) => i === ci ? { ...c, ...change } : c) });
  const mediaHeader = slots.headerFormat && MEDIA.includes(slots.headerFormat) && !template?.headerMediaUrl;

  return (
    <View style={styles.box}>
      <Caption style={styles.title}>Template variables</Caption>

      {mediaHeader ?
      <Input
        label={`${mediaLabel(slots.headerFormat)} to send in the header`}
        value={value.headerMediaUrl}
        onChangeText={(t) => patch({ headerMediaUrl: t })}
        placeholder="https://… public link"
        autoCapitalize="none" /> :
      null}

      {slots.headerVars > 0 ?
      <View>
          <Label>Header</Label>
          {slots.headerText ? <Caption style={styles.preview}>{slots.headerText}</Caption> : null}
          {value.header.map((v, i) =>
        <Input
          key={`h${i}`}
          label={`{{${i + 1}}}`}
          value={v}
          onChangeText={(t) => patch({ header: setAt(value.header, i, t) })} />
        )}
        </View> :
      null}

      {slots.bodyVars > 0 ?
      <View>
          <Label>{slots.authentication ? 'Verification code' : 'Body'}</Label>
          {!slots.authentication && slots.bodyText ? <Caption style={styles.preview}>{slots.bodyText}</Caption> : null}
          {value.body.map((v, i) =>
        <Input
          key={`b${i}`}
          label={slots.authentication ? 'Code' : `{{${i + 1}}}`}
          value={v}
          onChangeText={(t) => patch({ body: setAt(value.body, i, t) })} />
        )}
        </View> :
      null}

      {!slots.authentication ?
      slots.buttons.filter((b) => b.needsValue).map((b) =>
      <Input
        key={`btn${b.index}`}
        label={`Button ${b.index + 1} “${b.label}”`}
        hint={b.type === 'URL' ? b.url : b.type === 'COPY_CODE' ? 'Coupon code' : undefined}
        value={value.buttons[String(b.index)] || ''}
        onChangeText={(t) => patch({ buttons: { ...value.buttons, [String(b.index)]: t } })}
        autoCapitalize="none" />
      ) :
      null}

      {slots.cards.map((card, ci) =>
      <View key={`c${card.index}`} style={styles.card}>
          <Label>{`Card ${card.index + 1}`}</Label>
          <Input
          label={`${mediaLabel(card.headerFormat)} link`}
          hint="Leave blank to use the saved one"
          value={value.cards[ci]?.headerMediaUrl || ''}
          onChangeText={(t) => setCard(ci, { headerMediaUrl: t })}
          autoCapitalize="none" />
          {card.bodyText ? <Caption style={styles.preview}>{card.bodyText}</Caption> : null}
          {(value.cards[ci]?.body || []).map((v, i) =>
        <Input
          key={`c${ci}b${i}`}
          label={`{{${i + 1}}}`}
          value={v}
          onChangeText={(t) => setCard(ci, { body: setAt(value.cards[ci].body, i, t) })} />
        )}
          {card.buttons.filter((b) => b.needsValue).map((b) =>
        <Input
          key={`c${ci}btn${b.index}`}
          label={`Button ${b.index + 1} “${b.label}”`}
          hint={b.type === 'URL' ? b.url : undefined}
          value={value.cards[ci]?.buttons?.[String(b.index)] || ''}
          onChangeText={(t) => setCard(ci, { buttons: { ...value.cards[ci].buttons, [String(b.index)]: t } })}
          autoCapitalize="none" />
        )}
        </View>
      )}
    </View>);

}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: space.sm, marginTop: space.sm },
  title: { fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  preview: { marginBottom: 6, color: colors.text3 },
  card: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: space.sm, marginTop: space.sm }
});
