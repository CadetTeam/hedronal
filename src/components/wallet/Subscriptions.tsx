import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { EmptyState } from '../EmptyState';

export interface Subscription {
  id: string;
  name: string;
  provider: string;
  category: string;
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly' | 'quarterly' | 'one-time';
  nextBillingDate: string;
  status: 'active' | 'cancelled' | 'paused' | 'expired';
  icon?: string;
  description?: string;
  autoRenew: boolean;
}

interface SubscriptionsProps {
  subscriptions?: Subscription[];
  onSubscriptionPress?: (subscription: Subscription) => void;
}

const MOCK_SUBSCRIPTIONS: Subscription[] = [
  {
    id: '1',
    name: 'Adobe Creative Cloud',
    provider: 'Adobe',
    category: 'Software',
    amount: 52.99,
    currency: 'USD',
    billingCycle: 'monthly',
    nextBillingDate: '2024-02-01',
    status: 'active',
    autoRenew: true,
    description: 'All Apps Plan',
  },
  {
    id: '2',
    name: 'AWS Enterprise',
    provider: 'Amazon Web Services',
    category: 'Cloud Services',
    amount: 1250.0,
    currency: 'USD',
    billingCycle: 'monthly',
    nextBillingDate: '2024-02-05',
    status: 'active',
    autoRenew: true,
  },
  {
    id: '3',
    name: 'Slack Workspace',
    provider: 'Slack',
    category: 'Communication',
    amount: 12.5,
    currency: 'USD',
    billingCycle: 'monthly',
    nextBillingDate: '2024-01-28',
    status: 'active',
    autoRenew: true,
    description: 'Business+ Plan',
  },
  {
    id: '4',
    name: 'Microsoft 365',
    provider: 'Microsoft',
    category: 'Software',
    amount: 22.0,
    currency: 'USD',
    billingCycle: 'monthly',
    nextBillingDate: '2024-02-10',
    status: 'active',
    autoRenew: true,
    description: 'Business Standard',
  },
  {
    id: '5',
    name: 'Zoom Pro',
    provider: 'Zoom',
    category: 'Communication',
    amount: 14.99,
    currency: 'USD',
    billingCycle: 'monthly',
    nextBillingDate: '2024-02-03',
    status: 'cancelled',
    autoRenew: false,
  },
  {
    id: '6',
    name: 'Netflix Business',
    provider: 'Netflix',
    category: 'Entertainment',
    amount: 19.99,
    currency: 'USD',
    billingCycle: 'monthly',
    nextBillingDate: '2024-02-15',
    status: 'paused',
    autoRenew: false,
  },
];

export function Subscriptions({
  subscriptions = MOCK_SUBSCRIPTIONS,
  onSubscriptionPress,
}: SubscriptionsProps) {
  const { theme } = useTheme();

  function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const today = new Date();
    const daysUntil = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return 'Overdue';
    if (daysUntil === 0) return 'Today';
    if (daysUntil === 1) return 'Tomorrow';
    if (daysUntil <= 7) return `In ${daysUntil} days`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function getBillingCycleText(cycle: string) {
    switch (cycle) {
      case 'monthly':
        return '/month';
      case 'yearly':
        return '/year';
      case 'quarterly':
        return '/quarter';
      case 'one-time':
        return 'one-time';
      default:
        return '';
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'active':
        return theme.colors.success || '#10b981';
      case 'cancelled':
        return theme.colors.error || '#ef4444';
      case 'paused':
        return theme.colors.warning || '#f59e0b';
      case 'expired':
        return theme.colors.textTertiary;
      default:
        return theme.colors.textSecondary;
    }
  }

  function getCategoryIcon(category: string) {
    switch (category.toLowerCase()) {
      case 'software':
        return 'laptop-outline';
      case 'cloud services':
        return 'cloud-outline';
      case 'communication':
        return 'chatbubbles-outline';
      case 'entertainment':
        return 'play-outline';
      case 'saas':
        return 'apps-outline';
      default:
        return 'receipt-outline';
    }
  }

  function renderSubscription({ item }: { item: Subscription }) {
    const statusColor = getStatusColor(item.status);
    const categoryIcon = getCategoryIcon(item.category);

    return (
      <TouchableOpacity
        style={[
          styles.subscriptionCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
        onPress={() => onSubscriptionPress?.(item)}
        activeOpacity={0.7}
      >
        <View style={styles.subscriptionLeft}>
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: `${theme.colors.primary}20`,
              },
            ]}
          >
            <Ionicons name={categoryIcon} size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.subscriptionInfo}>
            <View style={styles.subscriptionHeader}>
              <Text style={[styles.subscriptionName, { color: theme.colors.text }]}>
                {item.name}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: `${statusColor}20`,
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: statusColor,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    {
                      color: statusColor,
                    },
                  ]}
                >
                  {item.status}
                </Text>
              </View>
            </View>
            {item.description && (
              <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                {item.description}
              </Text>
            )}
            <View style={styles.metaRow}>
              <Text style={[styles.provider, { color: theme.colors.textTertiary }]}>
                {item.provider}
              </Text>
              <Text style={[styles.category, { color: theme.colors.textTertiary }]}>
                {item.category}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.subscriptionRight}>
          <Text style={[styles.amount, { color: theme.colors.text }]}>
            {formatCurrency(item.amount, item.currency)}
            <Text style={[styles.billingCycle, { color: theme.colors.textTertiary }]}>
              {getBillingCycleText(item.billingCycle)}
            </Text>
          </Text>
          {item.status === 'active' && (
            <View style={styles.billingInfo}>
              <Ionicons name="calendar-outline" size={14} color={theme.colors.textTertiary} />
              <Text style={[styles.nextBilling, { color: theme.colors.textSecondary }]}>
                {formatDate(item.nextBillingDate)}
              </Text>
            </View>
          )}
          {item.autoRenew && item.status === 'active' && (
            <View style={styles.autoRenewBadge}>
              <Ionicons name="refresh" size={12} color={theme.colors.success || '#10b981'} />
              <Text
                style={[
                  styles.autoRenewText,
                  {
                    color: theme.colors.success || '#10b981',
                  },
                ]}
              >
                Auto-renew
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          title="No subscriptions"
          message="Track your recurring subscriptions and manage billing"
          icon="receipt-outline"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={subscriptions}
        renderItem={renderSubscription}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    gap: 12,
  },
  subscriptionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  subscriptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  subscriptionName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 14,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  provider: {
    fontSize: 12,
  },
  category: {
    fontSize: 12,
  },
  subscriptionRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
  },
  billingCycle: {
    fontSize: 12,
    fontWeight: '400',
  },
  billingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nextBilling: {
    fontSize: 12,
  },
  autoRenewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    gap: 4,
  },
  autoRenewText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
});
