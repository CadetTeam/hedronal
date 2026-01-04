import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface LogoProps {
  size?: number;
  onLongPressStart?: () => void;
  onLongPressEnd?: () => void;
}

export function Logo({ size = 80, onLongPressStart, onLongPressEnd }: LogoProps) {
  const { theme } = useTheme();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  function handlePressIn() {
    if (onLongPressStart) {
      timerRef.current = setTimeout(() => {
        onLongPressStart();
      }, 6000);
    }
  }

  function handlePressOut() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (onLongPressEnd) {
      onLongPressEnd();
    }
  }

  const content = (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.colors.primary,
          borderWidth: 2,
          borderColor: theme.colors.primaryDark,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            fontSize: size * 0.4,
            color: theme.colors.background,
          },
        ]}
      >
        H
      </Text>
    </View>
  );

  if (onLongPressStart) {
    return (
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} style={styles.pressable}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '700',
  },
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
