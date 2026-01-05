import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { EmptyState } from '../EmptyState';

export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  currency: string;
  description: string;
  category: string;
  date: string;
  bankName: string;
  status: 'completed' | 'pending' | 'failed';
}

interface ActivityTransactionsProps {
  transactions?: Transaction[];
  onTransactionPress?: (transaction: Transaction) => void;
}

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    type: 'expense',
    amount: -2500.0,
    currency: 'USD',
    description: 'Office Rent Payment',
    category: 'Rent',
    date: '2024-01-15T10:30:00Z',
    bankName: 'Chase Bank',
    status: 'completed',
  },
  {
    id: '2',
    type: 'income',
    amount: 50000.0,
    currency: 'USD',
    description: 'Investment Return',
    category: 'Investment',
    date: '2024-01-14T14:20:00Z',
    bankName: 'Bank of America',
    status: 'completed',
  },
  {
    id: '3',
    type: 'expense',
    amount: -1200.0,
    currency: 'USD',
    description: 'Software Subscription',
    category: 'Software',
    date: '2024-01-13T09:15:00Z',
    bankName: 'Chase Bank',
    status: 'pending',
  },
  {
    id: '4',
    type: 'transfer',
    amount: -10000.0,
    currency: 'USD',
    description: 'Transfer to Savings',
    category: 'Transfer',
    date: '2024-01-12T16:45:00Z',
    bankName: 'Chase Bank',
    status: 'completed',
  },
  {
    id: '5',
    type: 'expense',
    amount: -450.0,
    currency: 'USD',
    description: 'Legal Services',
    category: 'Legal',
    date: '2024-01-11T11:00:00Z',
    bankName: 'Bank of America',
    status: 'completed',
  },
];

export function ActivityTransactions({
  transactions = MOCK_TRANSACTIONS,
  onTransactionPress,
}: ActivityTransactionsProps) {
  const { theme } = useTheme();

  function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(Math.abs(amount));
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function getTransactionIcon(type: string) {
    switch (type) {
      case 'income':
        return 'arrow-down-circle';
      case 'expense':
        return 'arrow-up-circle';
      case 'transfer':
        return 'swap-horizontal';
      default:
        return 'ellipse-outline';
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed':
        return theme.colors.success || '#10b981';
      case 'pending':
        return theme.colors.warning || '#f59e0b';
      case 'failed':
        return theme.colors.error || '#ef4444';
      default:
        return theme.colors.textTertiary;
    }
  }

  function renderTransaction({ item }: { item: Transaction }) {
    const isIncome = item.type === 'income';
    const amountColor = isIncome ? theme.colors.success || '#10b981' : theme.colors.text;

    return (
      <TouchableOpacity
        style={[
          styles.transactionItem,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
        onPress={() => onTransactionPress?.(item)}
        activeOpacity={0.7}
      >
        <View style={styles.transactionLeft}>
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: isIncome
                  ? `${theme.colors.success || '#10b981'}20`
                  : `${theme.colors.error || '#ef4444'}20`,
              },
            ]}
          >
            <Ionicons
              name={getTransactionIcon(item.type)}
              size={20}
              color={isIncome ? theme.colors.success || '#10b981' : theme.colors.error || '#ef4444'}
            />
          </View>
          <View style={styles.transactionInfo}>
            <Text style={[styles.description, { color: theme.colors.text }]}>
              {item.description}
            </Text>
            <View style={styles.metaRow}>
              <Text style={[styles.category, { color: theme.colors.textSecondary }]}>
                {item.category}
              </Text>
              <Text style={[styles.date, { color: theme.colors.textTertiary }]}>
                {formatDate(item.date)}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.transactionRight}>
          <Text style={[styles.amount, { color: amountColor }]}>
            {isIncome ? '+' : '-'}
            {formatCurrency(item.amount, item.currency)}
          </Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: `${getStatusColor(item.status)}20`,
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: getStatusColor(item.status),
                },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                {
                  color: getStatusColor(item.status),
                },
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  if (transactions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          title="No transactions yet"
          message="Your transaction history will appear here"
          icon="receipt-outline"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
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
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  category: {
    fontSize: 12,
    fontWeight: '500',
  },
  date: {
    fontSize: 12,
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
});
