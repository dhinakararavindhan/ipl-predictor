/** Design tokens (UI/UX Spec §1.1) + tiny UI atoms for React Native. */
import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

export const C = {
  bg: '#0B0E14',
  surface: '#131826',
  surface2: '#1C2333',
  text: '#F2F5FA',
  dim: '#8A93A6',
  accent: '#6C5CE7',
  accent2: '#00D2A8',
  warn: '#FFB020',
  danger: '#FF5C7A',
  info: '#4DA3FF',
  border: 'rgba(255,255,255,0.06)',
};

export const s = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  card2: {
    backgroundColor: C.surface2,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 14,
  },
  h1: { color: C.text, fontSize: 26, fontWeight: '800' },
  h2: { color: C.text, fontSize: 17, fontWeight: '700' },
  body: { color: C.text, fontSize: 14 },
  dim: { color: C.dim, fontSize: 12 },
  label: { color: C.dim, fontSize: 10, fontWeight: '700', letterSpacing: 2 },
});

export function Card({
  children,
  style,
  onPress,
  active,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  active?: boolean;
}) {
  const base = [s.card, active ? { borderColor: C.accent } : null, style];
  if (onPress)
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [...base, pressed && { opacity: 0.8 }]}>
        {children}
      </Pressable>
    );
  return <View style={base}>{children}</View>;
}

export function Btn({
  title,
  onPress,
  kind = 'primary',
  disabled,
  style,
  textStyle,
}: {
  title: string;
  onPress: () => void;
  kind?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  const bg = kind === 'primary' ? C.accent : kind === 'danger' ? C.danger : C.surface2;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderRadius: 14,
          paddingVertical: 13,
          alignItems: 'center',
          opacity: disabled ? 0.35 : pressed ? 0.8 : 1,
          borderWidth: kind === 'ghost' ? 1 : 0,
          borderColor: C.border,
        },
        style,
      ]}
    >
      <Text style={[{ color: C.text, fontWeight: '700', fontSize: 14 }, textStyle]}>{title}</Text>
    </Pressable>
  );
}

export function Chip({
  title,
  active,
  onPress,
  disabled,
}: {
  title: string;
  active?: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        backgroundColor: active ? C.accent : C.surface2,
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: active ? C.accent : C.border,
        opacity: disabled ? 0.35 : pressed ? 0.8 : 1,
      })}
    >
      <Text style={{ color: C.text, fontSize: 12, fontWeight: '600' }}>{title}</Text>
    </Pressable>
  );
}
