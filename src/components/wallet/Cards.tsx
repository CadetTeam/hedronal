import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { EmptyState } from '../EmptyState';
import { LinearGradient } from 'expo-linear-gradient';

export interface Card {
  id: string;
  type: 'debit' | 'credit';
  cardNumber: string;
  cardholderName: string;
  bankName: string;
  expiryDate: string;
  cvv?: string;
  balance?: number;
  creditLimit?: number;
  availableCredit?: number;
  currency: string;
  status: 'active' | 'blocked' | 'expired';
  cardDesign: 'default' | 'premium' | 'black';
}

interface BankCard {
  id: string;
  bankName: string;
  entityName: string;
  cardNumber: string;
  balance: number;
  currency: string;
}

interface CardsProps {
  selectedAccount?: BankCard | null;
  cards?: Card[];
  onCardPress?: (card: Card) => void;
}

const MOCK_CARDS: Card[] = [
  {
    id: '1',
    type: 'credit',
    cardNumber: '4532 1234 5678 9010',
    cardholderName: 'ACME CAPITAL',
    bankName: 'Chase',
    expiryDate: '12/26',
    currency: 'USD',
    creditLimit: 25000,
    availableCredit: 18500,
    status: 'active',
    cardDesign: 'premium',
  },
  {
    id: '2',
    type: 'debit',
    cardNumber: '5421 9876 5432 1098',
    cardholderName: 'ACME CAPITAL',
    bankName: 'Bank of America',
    expiryDate: '08/25',
    currency: 'USD',
    balance: 125000.5,
    status: 'active',
    cardDesign: 'default',
  },
  {
    id: '3',
    type: 'credit',
    cardNumber: '3789 4567 8901 2345',
    cardholderName: 'ACME CAPITAL',
    bankName: 'American Express',
    expiryDate: '03/27',
    currency: 'USD',
    creditLimit: 50000,
    availableCredit: 37500,
    status: 'active',
    cardDesign: 'black',
  },
];

export function Cards({ selectedAccount, cards = MOCK_CARDS, onCardPress }: CardsProps) {
  const { theme, isDark } = useTheme();

  // Filter cards by selected account's bank
  const filteredCards = selectedAccount
    ? cards.filter(card => card.bankName === selectedAccount.bankName)
    : cards;

  function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  }

  function maskCardNumber(cardNumber: string) {
    const cleaned = cardNumber.replace(/\s/g, '');
    const lastFour = cleaned.slice(-4);
    return `**** **** **** ${lastFour}`;
  }

  function getCardGradient(design: string): [string, string] {
    switch (design) {
      case 'premium':
        return ['#667eea', '#764ba2'];
      case 'black':
        return ['#1a1a1a', '#2d2d2d'];
      default:
        return isDark ? ['#2d2d2d', '#1a1a1a'] : ['#667eea', '#764ba2'];
    }
  }

  function renderCard({ item }: { item: Card }) {
    const gradientColors = getCardGradient(item.cardDesign);
    const isCredit = item.type === 'credit';

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onCardPress?.(item)}
        style={styles.cardWrapper}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.chipContainer}>
                <View style={styles.chip} />
              </View>
            </View>
            <View
              style={[
                styles.statusIndicator,
                {
                  backgroundColor:
                    item.status === 'active'
                      ? theme.colors.success || '#10b981'
                      : theme.colors.error || '#ef4444',
                },
              ]}
            />
          </View>

          <View style={styles.cardBody}>
            <Text style={styles.cardNumber}>{maskCardNumber(item.cardNumber)}</Text>
            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.cardholderLabel}>CARDHOLDER</Text>
                <Text style={styles.cardholderName}>{item.cardholderName}</Text>
              </View>
              <View style={styles.expiryContainer}>
                <Text style={styles.expiryLabel}>EXPIRES</Text>
                <Text style={styles.expiryDate}>{item.expiryDate}</Text>
              </View>
            </View>
          </View>

          <View style={styles.cardBack}>
            <View style={styles.cardInfo}>
              <View style={styles.bankInfo}>
                <Text style={styles.bankName}>{item.bankName}</Text>
                <Text style={styles.cardType}>{isCredit ? 'Credit Card' : 'Debit Card'}</Text>
              </View>
              {isCredit && item.availableCredit !== undefined ? (
                <View style={styles.balanceInfo}>
                  <Text style={styles.balanceLabel}>Available</Text>
                  <Text style={styles.balanceAmount}>
                    {formatCurrency(item.availableCredit, item.currency)}
                  </Text>
                </View>
              ) : item.balance !== undefined ? (
                <View style={styles.balanceInfo}>
                  <Text style={styles.balanceLabel}>Balance</Text>
                  <Text style={styles.balanceAmount}>
                    {formatCurrency(item.balance, item.currency)}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (filteredCards.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          title="No cards"
          message={
            selectedAccount
              ? `No cards found for ${selectedAccount.bankName}`
              : 'Add a card to manage your payments and transactions'
          }
          icon="card-outline"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        pagingEnabled={false}
        snapToInterval={336}
        decelerationRate="fast"
      >
        {filteredCards.map(card => (
          <View key={card.id}>{renderCard({ item: card })}</View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  cardWrapper: {
    width: 320,
    marginRight: 16,
    marginLeft: 0,
  },
  card: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    padding: 20,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipContainer: {
    width: 40,
    height: 30,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chip: {
    width: 30,
    height: 20,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
  },
  cardNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 2,
    marginBottom: 24,
    fontFamily: 'monospace',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardholderLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardholderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 1,
  },
  expiryContainer: {
    alignItems: 'flex-end',
  },
  expiryLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  expiryDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  cardBack: {
    marginTop: 12,
  },
  cardInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  cardType: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  balanceInfo: {
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
});
