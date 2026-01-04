import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '../context/ThemeContext';
import { useTabBar } from '../context/TabBarContext';
import { Ionicons } from '@expo/vector-icons';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

interface TabIcon {
  name: keyof typeof Ionicons.glyphMap;
  label: string;
}

const TAB_ICONS: TabIcon[] = [
  { name: 'home-outline', label: 'Feed' },
  { name: 'compass-outline', label: 'Explore' },
  { name: 'briefcase-outline', label: 'Portfolio' },
  { name: 'people-outline', label: 'People' },
  { name: 'person-outline', label: 'Profile' },
];

const ACTIVE_TAB_ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  'home',
  'compass',
  'briefcase',
  'people',
  'person',
];

function animateBubbles(bubbleAnimations: any[]) {
  bubbleAnimations.forEach((anim) => {
    anim.translateY.value = 100;
    anim.scale.value = 0.8;
    anim.opacity.value = 0;

    anim.translateY.value = withSpring(
      0,
      {
        damping: 15,
        stiffness: 150,
        mass: 0.8,
      },
      () => {
        // Bounce effect
        anim.scale.value = withSpring(1.1, { damping: 8 }, () => {
          anim.scale.value = withSpring(1, { damping: 10 });
        });
      }
    );
    anim.opacity.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.ease),
    });
  });
}

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme, isDark } = useTheme();
  const { refreshKey } = useTabBar();
  const bubbleAnimations = TAB_ICONS.map(() => ({
    translateY: useSharedValue(100),
    scale: useSharedValue(0.8),
    opacity: useSharedValue(0),
  }));

  useEffect(() => {
    // Animate bubbles in from bottom on mount
    animateBubbles(bubbleAnimations);
  }, []);

  useEffect(() => {
    // Re-animate bubbles when refreshKey changes (triggered by pull-to-refresh)
    if (refreshKey > 0) {
      animateBubbles(bubbleAnimations);
    }
  }, [refreshKey]);

  // Determine icon color based on background
  const getIconColor = (isFocused: boolean, isDarkMode: boolean) => {
    if (isFocused) {
      return isDarkMode ? theme.colors.accent : theme.colors.primaryDark;
    }
    return isDarkMode ? theme.colors.textSecondary : theme.colors.textTertiary;
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <AnimatedBlurView
        intensity={Platform.OS === 'ios' ? 80 : 20}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.blurContainer,
          {
            backgroundColor: isDark
              ? 'rgba(45, 45, 45, 0.7)'
              : 'rgba(245, 245, 220, 0.7)',
            shadowColor: theme.colors.text,
          },
        ]}
      >
        <View style={styles.tabContainer}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const iconName = isFocused
              ? ACTIVE_TAB_ICONS[index]
              : TAB_ICONS[index].name;
            const iconColor = getIconColor(isFocused, isDark);

            const animatedStyle = useAnimatedStyle(() => {
              return {
                transform: [
                  { translateY: bubbleAnimations[index].translateY.value },
                  { scale: bubbleAnimations[index].scale.value },
                ],
                opacity: bubbleAnimations[index].opacity.value,
              };
            });

            return (
              <Animated.View key={route.key} style={animatedStyle}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={options.tabBarAccessibilityLabel}
                  onPress={onPress}
                  style={[
                    styles.tabButton,
                    isFocused && {
                      backgroundColor: isDark
                        ? 'rgba(212, 175, 55, 0.2)'
                        : 'rgba(139, 105, 20, 0.15)',
                    },
                  ]}
                >
                  <Ionicons name={iconName} size={24} color={iconColor} />
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </AnimatedBlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  blurContainer: {
    flexDirection: 'row',
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  tabButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
});
