import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface SwipeableEntityCardProps {
  entity: any;
  onPress: (entity: any) => void;
  onArchive: (entity: any) => void;
}

export function SwipeableEntityCard({ entity, onPress, onArchive }: SwipeableEntityCardProps) {
  const { theme } = useTheme();

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        style={[
          styles.rightAction,
          {
            backgroundColor: theme.colors.error || '#ff3b30',
          },
        ]}
        onPress={() => onArchive(entity)}
        activeOpacity={0.7}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name="archive-outline" size={24} color="#fff" />
          <Text style={styles.actionText}>Archive</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <TouchableOpacity
        style={[
          styles.entityCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
        activeOpacity={0.7}
        onPress={() => onPress(entity)}
      >
        {entity.banner && (
          <Image source={{ uri: entity.banner }} style={styles.entityBanner} resizeMode="cover" />
        )}
        <View style={styles.entityCardContent}>
          {entity.avatar ? (
            <Image source={{ uri: entity.avatar }} style={styles.entityAvatar} />
          ) : (
            <View
              style={[
                styles.entityAvatar,
                styles.entityAvatarPlaceholder,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text style={[styles.entityAvatarText, { color: theme.colors.background }]}>
                {entity.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.entityInfo}>
            <Text style={[styles.entityName, { color: theme.colors.text }]}>{entity.name}</Text>
            {entity.handle && (
              <Text style={[styles.entityHandle, { color: theme.colors.textSecondary }]}>
                @{entity.handle}
              </Text>
            )}
            {entity.brief && (
              <Text
                style={[styles.entityBrief, { color: theme.colors.textSecondary }]}
                numberOfLines={2}
              >
                {entity.brief}
              </Text>
            )}
            {entity.type && (
              <Text style={[styles.entityType, { color: theme.colors.textTertiary }]}>
                {entity.type}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  entityCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  entityBanner: {
    width: '100%',
    height: 120,
  },
  entityCardContent: {
    padding: 16,
    flexDirection: 'row',
  },
  entityAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  entityAvatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  entityAvatarText: {
    fontSize: 24,
    fontWeight: '700',
  },
  entityInfo: {
    flex: 1,
  },
  entityName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  entityHandle: {
    fontSize: 14,
    marginBottom: 8,
  },
  entityBrief: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  entityType: {
    fontSize: 12,
    fontWeight: '500',
  },
  rightAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    marginBottom: 16,
    borderRadius: 12,
    paddingHorizontal: 20,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
