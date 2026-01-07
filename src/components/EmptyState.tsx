import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: React.ReactNode | string; // Can be a React component or an Ionicons name string
  transparent?: boolean;
}

export function EmptyState({ title, message, icon, transparent = false }: EmptyStateProps) {
  const { theme } = useTheme();

  // Render icon - if it's a string, treat it as an Ionicons name
  const renderIcon = () => {
    if (!icon) return null;
    
    if (typeof icon === 'string') {
      return (
        <Ionicons
          name={icon as keyof typeof Ionicons.glyphMap}
          size={48}
          color={theme.colors.textSecondary}
        />
      );
    }
    
    // If it's already a React component, render it as-is
    return icon;
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: transparent ? 'transparent' : theme.colors.background },
      ]}
    >
      {icon && <View style={styles.iconContainer}>{renderIcon()}</View>}
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      {message && (
        <Text style={[styles.message, { color: theme.colors.textSecondary }]}>{message}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
