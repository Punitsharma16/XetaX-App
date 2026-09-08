import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius } from '@/ui/theme';

const Ctx = createContext({ show: () => {}, success: () => {}, error: () => {} });
export const useToast = () => useContext(Ctx);

/** Tiny non-blocking toast — one at a time, slides in from the bottom. */
export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef(null);
  const insets = useSafeAreaInsets();

  const show = useCallback((text, tone = 'info') => {
    if (timer.current) clearTimeout(timer.current);
    setMsg({ text, tone });
    Animated.timing(anim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    timer.current = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setMsg(null));
    }, 2600);
  }, [anim]);

  const api = useMemo(() => ({
    show, success: (m) => show(m, 'success'), error: (m) => show(m, 'error')
  }), [show]);

  const bg = msg?.tone === 'success' ? colors.success : msg?.tone === 'error' ? colors.danger : colors.text;
  return (
    <Ctx.Provider value={api}>
      {children}
      {msg ?
      <Animated.View pointerEvents="none" style={[styles.toast, { bottom: insets.bottom + 72, backgroundColor: bg, opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>
          <Text style={styles.text}>{msg.text}</Text>
        </Animated.View> :
      null}
    </Ctx.Provider>);

}

const styles = StyleSheet.create({
  toast: { position: 'absolute', left: 16, right: 16, paddingVertical: 12, paddingHorizontal: 16, borderRadius: radius.md, elevation: 6 },
  text: { color: '#fff', fontWeight: '600', fontSize: 14, textAlign: 'center' }
});
