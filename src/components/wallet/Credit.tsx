import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { EmptyState } from '../EmptyState';

export interface CreditAccount {
  id: string;
  provider: string;
  accountName: string;
  creditLimit: number;
  currentBalance: number;
  availableCredit: number;
  currency: string;
  utilization: number; // percentage
  paymentDueDate: string;
  minimumPayment: number;
  status: 'active' | 'closed' | 'suspended';
}

interface BankCard {
  id: string;
  bankName: string;
  entityName: string;
  cardNumber: string;
  balance: number;
  currency: string;
}

interface CreditProps {
  selectedAccount?: BankCard | null;
  accounts?: CreditAccount[];
  onAccountPress?: (account: CreditAccount) => void;
}

const MOCK_CREDIT_ACCOUNTS: CreditAccount[] = [
  {
    id: '1',
    provider: 'American Express',
    accountName: 'Business Platinum',
    creditLimit: 50000,
    currentBalance: 12500,
    availableCredit: 37500,
    currency: 'USD',
    utilization: 25,
    paymentDueDate: '2024-02-01',
    minimumPayment: 375,
    status: 'active',
  },
  {
    id: '2',
    provider: 'Chase',
    accountName: 'Ink Business Preferred',
    creditLimit: 25000,
    currentBalance: 8500,
    availableCredit: 16500,
    currency: 'USD',
    utilization: 34,
    paymentDueDate: '2024-01-28',
    minimumPayment: 255,
    status: 'active',
  },
  {
    id: '3',
    provider: 'Capital One',
    accountName: 'Spark Cash Plus',
    creditLimit: 100000,
    currentBalance: 45000,
    availableCredit: 55000,
    currency: 'USD',
    utilization: 45,
    paymentDueDate: '2024-02-05',
    minimumPayment: 1350,
    status: 'active',
  },
];

export function Credit({
  selectedAccount,
  accounts = MOCK_CREDIT_ACCOUNTS,
  onAccountPress,
}: CreditProps) {
  const { theme } = useTheme();

  function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function getUtilizationColor(utilization: number) {
    if (utilization < 30) return theme.colors.success || '#10b981';
    if (utilization < 70) return theme.colors.warning || '#f59e0b';
    return theme.colors.error || '#ef4444';
  }

  function renderAccount({ item }: { item: CreditAccount }) {
    const utilizationColor = getUtilizationColor(item.utilization);

    return (
      <TouchableOpacity
        style={[
          styles.accountCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
        onPress={() => onAccountPress?.(item)}
        activeOpacity={0.7}
      >
        <View style={styles.accountHeader}>
          <View style={styles.accountHeaderLeft}>
            <View
              style={[
                styles.providerIcon,
                {
                  backgroundColor: `${theme.colors.primary}20`,
                },
              ]}
            >
              <Ionicons name="card" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.accountInfo}>
              <Text style={[styles.providerName, { color: theme.colors.text }]}>
                {item.provider}
              </Text>
              <Text style={[styles.accountName, { color: theme.colors.textSecondary }]}>
                {item.accountName}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  item.status === 'active'
                    ? `${theme.colors.success || '#10b981'}20`
                    : `${theme.colors.textTertiary}20`,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    item.status === 'active'
                      ? theme.colors.success || '#10b981'
                      : theme.colors.textTertiary,
                },
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.balanceSection}>
          <View style={styles.balanceRow}>
            <Text style={[styles.balanceLabel, { color: theme.colors.textSecondary }]}>
              Current Balance
            </Text>
            <Text style={[styles.balanceAmount, { color: theme.colors.text }]}>
              {formatCurrency(item.currentBalance, item.currency)}
            </Text>
          </View>
          <View style={styles.balanceRow}>
            <Text style={[styles.balanceLabel, { color: theme.colors.textSecondary }]}>
              Available Credit
            </Text>
            <Text style={[styles.balanceAmount, { color: theme.colors.success || '#10b981' }]}>
              {formatCurrency(item.availableCredit, item.currency)}
            </Text>
          </View>
        </View>

        <View style={styles.utilizationSection}>
          <View style={styles.utilizationHeader}>
            <Text style={[styles.utilizationLabel, { color: theme.colors.textSecondary }]}>
              Credit Utilization
            </Text>
            <Text style={[styles.utilizationPercent, { color: utilizationColor }]}>
              {item.utilization}%
            </Text>
          </View>
          <View
            style={[
              styles.utilizationBar,
              {
                backgroundColor: theme.colors.surfaceVariant,
              },
            ]}
          >
            <View
              style={[
                styles.utilizationFill,
                {
                  width: `${item.utilization}%`,
                  backgroundColor: utilizationColor,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.paymentSection}>
          <View style={styles.paymentRow}>
            <View style={styles.paymentInfo}>
              <Ionicons name="calendar-outline" size={16} color={theme.colors.textTertiary} />
              <Text style={[styles.paymentLabel, { color: theme.colors.textSecondary }]}>
                Payment Due
              </Text>
              <Text style={[styles.paymentValue, { color: theme.colors.text }]}>
                {formatDate(item.paymentDueDate)}
              </Text>
            </View>
            <View style={styles.paymentInfo}>
              <Ionicons name="cash-outline" size={16} color={theme.colors.textTertiary} />
              <Text style={[styles.paymentLabel, { color: theme.colors.textSecondary }]}>
                Min Payment
              </Text>
              <Text style={[styles.paymentValue, { color: theme.colors.text }]}>
                {formatCurrency(item.minimumPayment, item.currency)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  if (accounts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          title="No credit accounts"
          message="Add a credit account to track your credit utilization and payments"
          icon="card-outline"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={accounts}
        renderItem={renderAccount}
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
    gap: 16,
  },
  accountCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  accountHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  providerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  accountName: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  balanceSection: {
    marginBottom: 16,
    gap: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  utilizationSection: {
    marginBottom: 16,
  },
  utilizationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  utilizationLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  utilizationPercent: {
    fontSize: 14,
    fontWeight: '700',
  },
  utilizationBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  utilizationFill: {
    height: '100%',
    borderRadius: 4,
  },
  paymentSection: {
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paymentLabel: {
    fontSize: 12,
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
});
