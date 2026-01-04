import React, { useRef } from 'react';
import { View, Image, StyleSheet, Pressable, ImageSourcePropType } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface LogoProps {
  size?: number;
  onLongPressStart?: () => void;
  onLongPressEnd?: () => void;
}

const darkLogo = require('../../assets/dark.png');
const lightLogo = require('../../assets/light.png');

export function Logo({ size = 80, onLongPressStart, onLongPressEnd }: LogoProps) {
  const { theme, isDark } = useTheme();
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

  // Use dark logo on light mode, light logo on dark mode
  const logoSource: ImageSourcePropType = isDark ? lightLogo : darkLogo;

  const content = (
    <Image
      source={logoSource}
      style={[
        styles.logo,
        {
          width: size,
          height: size,
        },
      ]}
      resizeMode="contain"
    />
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
  logo: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
