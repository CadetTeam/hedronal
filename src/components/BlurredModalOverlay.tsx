import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { Platform } from 'react-native';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface BlurredModalOverlayProps {
  children: React.ReactNode;
  onClose?: () => void;
  visible: boolean;
}

export function BlurredModalOverlay({ children, onClose, visible }: BlurredModalOverlayProps) {
  const { isDark } = useTheme();
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Start fade-in 1s after modal has fully loaded (slide animation completes)
      const timer = setTimeout(() => {
        opacity.value = withTiming(1, {
          duration: 1000,
          easing: Easing.out(Easing.ease),
        });
      }, 300); // Wait for slide animation to complete, then fade in over 1s

      return () => clearTimeout(timer);
    } else {
      opacity.value = 0;
    }
  }, [visible, opacity]);

  const blurStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const gradientStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      <AnimatedBlurView
        intensity={Platform.OS === 'ios' ? 80 : 20}
        tint={isDark ? 'dark' : 'light'}
        style={[styles.blurView, blurStyle]}
      />
      {onClose && (
        <TouchableOpacity
          style={styles.touchableOverlay}
          activeOpacity={1}
          onPress={onClose}
        />
      )}
      <View style={styles.contentContainer} pointerEvents="box-none">
        <AnimatedLinearGradient
          colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.2)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.gradient, gradientStyle]}
          pointerEvents="none"
        />
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  touchableOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  gradient: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    height: 40,
    zIndex: 1,
  },
});

