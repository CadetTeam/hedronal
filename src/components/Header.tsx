import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface HeaderProps {
  title: string;
  leftAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
  rightSideAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
}

export function Header({ title, leftAction, rightAction, rightSideAction }: HeaderProps) {
  const { theme } = useTheme();

  return (
    <SafeAreaView
      edges={['top']}
      style={[
        styles.header,
        {
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <View style={styles.headerContent}>
        {leftAction ? (
          <TouchableOpacity style={styles.leftActionButton} onPress={leftAction.onPress}>
            <Ionicons name={leftAction.icon} size={18} color={theme.colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.leftActionButton} />
        )}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{title.toUpperCase()}</Text>
          {rightAction && (
            <TouchableOpacity style={styles.inlineActionButton} onPress={rightAction.onPress}>
              <Ionicons name={rightAction.icon} size={18} color={theme.colors.text} />
            </TouchableOpacity>
          )}
        </View>
        {rightSideAction ? (
          <TouchableOpacity style={styles.rightSideActionButton} onPress={rightSideAction.onPress}>
            <Ionicons name={rightSideAction.icon} size={18} color={theme.colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.rightSideActionButton} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  inlineActionButton: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftActionButton: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSideActionButton: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
