import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View,
  KeyboardAvoidingView, Platform, ScrollView, RefreshControl } from
'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, space, type, shadow, hueFor, initials } from './theme';

export { colors, radius, space, type, shadow, hueFor, initials } from './theme';

/* ------------------------------------------------------------------ Screen */

export function Screen({
  children, scroll = true, padded = true, refreshing, onRefresh, style, footer

}) {
  const inner =
  <View style={[padded && { padding: space.lg }, style]}>{children}</View>;

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ?
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: space.xxl }}
          keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.brand} /> : undefined}>
          
            {inner}
          </ScrollView> :

        <View style={{ flex: 1 }}>{inner}</View>
        }
        {footer}
      </KeyboardAvoidingView>
    </SafeAreaView>);

}

/* -------------------------------------------------------------------- Text */

export function H1(p) {return <Text style={[type.h1, p.style]}>{p.children}</Text>;}
export function H2(p) {return <Text style={[type.h2, p.style]}>{p.children}</Text>;}
export function H3(p) {return <Text style={[type.h3, p.style]}>{p.children}</Text>;}
export function Body(p) {return <Text numberOfLines={p.numberOfLines} style={[type.body, p.style]}>{p.children}</Text>;}
export function Muted(p) {return <Text numberOfLines={p.numberOfLines} style={[type.body2, p.style]}>{p.children}</Text>;}
export function Caption(p) {return <Text style={[type.caption, p.style]}>{p.children}</Text>;}
export function Label(p) {return <Text style={[type.label, p.style]}>{p.children}</Text>;}

/* -------------------------------------------------------------------- Card */

export function Card({ children, style, onPress }) {
  const content = <View style={[styles.card, style]}>{children}</View>;
  if (!onPress) return content;
  return <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.85 }]}>{content}</Pressable>;
}

export function SectionTitle({ title, action, onAction }) {
  return (
    <View style={styles.sectionTitle}>
      <Label>{title}</Label>
      {action ? <Pressable onPress={onAction} hitSlop={8}><Text style={styles.link}>{action}</Text></Pressable> : null}
    </View>);

}

/* ------------------------------------------------------------------ Button */

export function Button({
  title, onPress, variant = 'primary', icon, loading, disabled, style, small

}) {
  const bg = { primary: colors.brand, secondary: colors.surface, ghost: 'transparent', danger: colors.danger, success: colors.success }[variant];
  const fg = { primary: colors.inverse, secondary: colors.text, ghost: colors.brand, danger: colors.inverse, success: colors.inverse }[variant];
  const border = variant === 'secondary' ? colors.borderStrong : 'transparent';
  const off = disabled || loading;
  return (
    <Pressable
      onPress={off ? undefined : onPress}
      style={({ pressed }) => [
      styles.btn, small && styles.btnSmall,
      { backgroundColor: bg, borderColor: border, opacity: off ? 0.55 : pressed ? 0.85 : 1 }, style]
      }>
      
      {loading ? <ActivityIndicator color={fg} /> :
      <>
          {icon ? <Ionicons name={icon} size={small ? 15 : 17} color={fg} style={{ marginRight: 6 }} /> : null}
          <Text style={[styles.btnText, small && { fontSize: 13 }, { color: fg }]}>{title}</Text>
        </>
      }
    </Pressable>);

}

export function IconButton({ icon, onPress, color = colors.text2, size = 20, style }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={({ pressed }) => [styles.iconBtn, pressed && { backgroundColor: colors.surfaceAlt }, style]}>
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>);

}

/* ------------------------------------------------------------------- Input */

export function Input({ label, error, hint, style, ...rest }) {
  return (
    <View style={{ marginBottom: space.md }}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.text3}
        style={[styles.input, rest.multiline && { minHeight: 90, textAlignVertical: 'top' }, error && { borderColor: colors.danger }, style]}
        {...rest} />
      
      {error ? <Text style={styles.inputError}>{error}</Text> : hint ? <Caption style={{ marginTop: 4 }}>{hint}</Caption> : null}
    </View>);

}

Input.ErrorText = function ErrorText({ text }) {
  return <Text style={[styles.inputError, { marginTop: -8, marginBottom: 10 }]}>{text}</Text>;
};

export function SearchBar({ value, onChangeText, placeholder = 'Search…', onSubmit }) {
  return (
    <View style={styles.search}>
      <Ionicons name="search" size={18} color={colors.text3} />
      <TextInput
        value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.text3}
        style={styles.searchInput} returnKeyType="search" onSubmitEditing={onSubmit} autoCapitalize="none" />
      
      {value ? <Pressable onPress={() => onChangeText('')} hitSlop={8}><Ionicons name="close-circle" size={18} color={colors.text3} /></Pressable> : null}
    </View>);

}

/* -------------------------------------------------------------------- Pill */

export function Pill({ text, tone, style, small }) {
  let bg = colors.surfaceAlt,fg = colors.text2;
  if (!tone || tone === 'auto') ({ bg, fg } = hueFor(text));else
  if (tone === 'brand') {bg = colors.brandSoft;fg = colors.brandText;} else
  if (tone === 'success') {bg = colors.successSoft;fg = colors.success;} else
  if (tone === 'warning') {bg = colors.warningSoft;fg = colors.warning;} else
  if (tone === 'danger') {bg = colors.dangerSoft;fg = colors.danger;} else
  if (tone === 'info') {bg = colors.infoSoft;fg = colors.info;}
  return (
    <View style={[styles.pill, small && { paddingVertical: 2, paddingHorizontal: 8 }, { backgroundColor: bg }, style]}>
      <Text numberOfLines={1} style={[styles.pillText, small && { fontSize: 11 }, { color: fg }]}>{text}</Text>
    </View>);

}

/* ------------------------------------------------------------------ Avatar */

export function Avatar({ name, size = 40, color }) {
  const hue = hueFor(name);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color || hue.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: color ? colors.inverse : hue.fg, fontWeight: '700', fontSize: size * 0.38 }}>{initials(name)}</Text>
    </View>);

}

/* ---------------------------------------------------------------- ListRow */

export function ListRow({ title, subtitle, right, leading, onPress, chevron = true, style

}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && onPress && { backgroundColor: colors.surfaceAlt }, style]}>
      {leading}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text numberOfLines={1} style={styles.rowSub}>{subtitle}</Text> : null}
      </View>
      {right}
      {onPress && chevron ? <Ionicons name="chevron-forward" size={18} color={colors.text3} /> : null}
    </Pressable>);

}

export function KeyValue({ label, value, last }) {
  return (
    <View style={[styles.kv, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.kvLabel}>{label}</Text>
      {typeof value === 'string' || typeof value === 'number' || !value ?
      <Text style={styles.kvValue} selectable>{value === undefined || value === null || value === '' ? '—' : String(value)}</Text> :
      <View style={{ flex: 1, alignItems: 'flex-end' }}>{value}</View>}
    </View>);

}

/* ------------------------------------------------------------------ States */

export function Loading({ text = 'Loading…' }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.brand} size="large" />
      <Muted style={{ marginTop: space.md }}>{text}</Muted>
    </View>);

}

export function Empty({ icon = 'file-tray-outline', title, text, action }) {
  return (
    <View style={styles.center}>
      <View style={styles.emptyIcon}><Ionicons name={icon} size={28} color={colors.brand} /></View>
      <H3 style={{ marginTop: space.md, textAlign: 'center' }}>{title}</H3>
      {text ? <Muted style={{ marginTop: 6, textAlign: 'center', maxWidth: 280 }}>{text}</Muted> : null}
      {action ? <View style={{ marginTop: space.lg }}>{action}</View> : null}
    </View>);

}

export function ErrorState({ message, onRetry }) {
  return (
    <Empty icon="alert-circle-outline" title="Something went wrong" text={message}
    action={onRetry ? <Button title="Try again" variant="secondary" icon="refresh" onPress={onRetry} /> : undefined} />);

}

/**
 * A tinted rounded square behind a list icon.
 *
 * <p>A bare outline icon in every row reads as a prototype: nothing separates
 * one module from the next and the eye has no anchor to scan down. A tinted
 * tile gives each row a shape of its own and lets the tone carry meaning —
 * money is green, something destructive is red.
 */
export function IconTile({ icon, tone = 'brand', size = 36 }) {
  const soft = { brand: colors.brandSoft, success: colors.successSoft, warning: colors.warningSoft, danger: colors.dangerSoft, info: colors.infoSoft, muted: colors.surfaceAlt }[tone] || colors.brandSoft;
  const fg = { brand: colors.brand, success: colors.success, warning: colors.warning, danger: colors.danger, info: colors.info, muted: colors.text2 }[tone] || colors.brand;
  return (
    <View style={{ width: size, height: size, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: soft }}>
      <Ionicons name={icon} size={Math.round(size * 0.52)} color={fg} />
    </View>);

}

export function StatTile({ label, value, icon, tone = 'brand', onPress }) {
  const soft = { brand: colors.brandSoft, success: colors.successSoft, warning: colors.warningSoft, danger: colors.dangerSoft, info: colors.infoSoft }[tone];
  const fg = { brand: colors.brand, success: colors.success, warning: colors.warning, danger: colors.danger, info: colors.info }[tone];
  return (
    <Card onPress={onPress} style={styles.stat}>
      <View style={[styles.statIcon, { backgroundColor: soft }]}><Ionicons name={icon} size={18} color={fg} /></View>
      <Text style={styles.statValue}>{value}</Text>
      <Caption>{label}</Caption>
    </Card>);

}

export function Divider({ style }) {return <View style={[styles.divider, style]} />;}

export function Chip({ text, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && { backgroundColor: colors.brand, borderColor: colors.brand }]}>
      <Text style={[styles.chipText, active && { color: colors.inverse }]}>{text}</Text>
    </Pressable>);

}

/* ------------------------------------------------------------------ styles */

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.lg, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm, marginTop: space.sm },
  link: { color: colors.brand, fontWeight: '600', fontSize: 13 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13, paddingHorizontal: 18, borderRadius: radius.md, borderWidth: 1 },
  btnSmall: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.sm },
  btnText: { fontWeight: '700', fontSize: 15 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  inputLabel: { ...type.label, marginBottom: 6 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text },
  inputError: { color: colors.danger, fontSize: 12, marginTop: 4 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 14, height: 44 },
  searchInput: { flex: 1, fontSize: 15, color: colors.text, paddingVertical: 0 },
  pill: { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 10, borderRadius: radius.pill, maxWidth: 180 },
  pillText: { fontSize: 12, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: space.lg, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowSub: { fontSize: 13, color: colors.text3, marginTop: 2 },
  kv: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  kvLabel: { fontSize: 13, color: colors.text3, flex: 0.8 },
  kvValue: { fontSize: 14, color: colors.text, fontWeight: '500', flex: 1.2, textAlign: 'right' },
  center: { alignItems: 'center', justifyContent: 'center', padding: space.xxl, flex: 1 },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  stat: { flex: 1, minWidth: '46%', padding: space.md, gap: 6 },
  statIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: space.md },
  chip: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surface },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.text2 }
});
