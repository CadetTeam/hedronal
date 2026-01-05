import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: React.ReactNode;
}

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: React.ReactNode;
  transparent?: boolean;
}

export function EmptyState({ title, message, icon, transparent = false }: EmptyStateProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: transparent ? 'transparent' : theme.colors.background },
      ]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
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
