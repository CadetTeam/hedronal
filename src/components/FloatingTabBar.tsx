import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
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

function animateBubbles(
  bubbleAnimations: Array<{
    translateY: ReturnType<typeof useSharedValue<number>>;
    opacity: ReturnType<typeof useSharedValue<number>>;
  }>,
  baseDelay: number = 0
) {
  bubbleAnimations.forEach((anim, index) => {
    // Start from bottom (off-screen)
    anim.translateY.value = 200;
    anim.opacity.value = 0;

    // Calculate delay for each bubble (left to right)
    const bubbleDelay = baseDelay + index * 80; // 80ms delay between each bubble

    // Slide up from bottom, then fall down with bounce
    anim.translateY.value = withDelay(
      bubbleDelay,
      withTiming(
        -10, // Slightly above final position
        {
          duration: 400,
          easing: Easing.out(Easing.cubic),
        },
        (finished) => {
          'worklet';
          if (finished) {
            // Fall down into place with bounce
            anim.translateY.value = withSpring(
              0,
              {
                damping: 12,
                stiffness: 200,
                mass: 0.8,
              }
            );
          }
        }
      )
    );

    // Fade in
    anim.opacity.value = withDelay(
      bubbleDelay,
      withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      })
    );
  });
}

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme, isDark } = useTheme();
  const { refreshKey } = useTabBar();
  const bubbleAnimations = TAB_ICONS.map(() => ({
    translateY: useSharedValue(200),
    opacity: useSharedValue(0),
  }));

  useEffect(() => {
    // Animate bubbles in from bottom on mount (left to right, sequential)
    animateBubbles(bubbleAnimations, 0);
  }, []);

  useEffect(() => {
    // Re-animate bubbles when refreshKey changes (triggered by pull-to-refresh)
    if (refreshKey > 0) {
      animateBubbles(bubbleAnimations, 0);
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
    <SafeAreaView edges={['bottom']} style={styles.safeArea} pointerEvents="box-none">
      <View style={styles.container} pointerEvents="box-none">
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
                    isFocused && styles.activeTabButton,
                  ]}
                >
                  <View
                    style={[
                      styles.circleContainer,
                      {
                        backgroundColor: 'transparent',
                        shadowColor: theme.colors.text,
                        shadowOffset: {
                          width: 0,
                          height: isFocused ? 2 : 1,
                        },
                        shadowOpacity: isFocused ? 0.2 : 0.1,
                        shadowRadius: isFocused ? 4 : 2,
                        elevation: isFocused ? 4 : 2,
                      },
                    ]}
                  >
                    {/* Background circle with opacity */}
                    <View
                      style={[
                        styles.circleBackground,
                        {
                          opacity: isFocused ? 1.0 : 0.8,
                        },
                      ]}
                    >
                      <AnimatedBlurView
                        intensity={Platform.OS === 'ios' ? (isFocused ? 40 : 20) : (isFocused ? 10 : 5)}
                        tint={isDark ? 'dark' : 'light'}
                        style={styles.activeTabBlur}
                      />
                    </View>
                    {/* Icon - always fully visible */}
                    <Ionicons name={iconName} size={24} color={iconColor} style={styles.icon} />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: 'transparent',
  },
  tabButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  activeTabButton: {
    // Additional styles for active tab if needed
  },
  circleContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  circleBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 24,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  activeTabBlur: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  icon: {
    zIndex: 1,
  },
});
