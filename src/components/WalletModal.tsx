import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { BlurredModalOverlay } from './BlurredModalOverlay';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityTransactions } from './wallet/ActivityTransactions';
import { Credit } from './wallet/Credit';
import { Cards } from './wallet/Cards';
import { Members } from './wallet/Members';
import { Subscriptions } from './wallet/Subscriptions';

interface BankCard {
  id: string;
  bankName: string;
  entityName: string;
  cardNumber: string;
  balance: number;
  currency: string;
}

interface WalletModalProps {
  visible: boolean;
  onClose: () => void;
}

const MOCK_CARDS: BankCard[] = [
  {
    id: '1',
    bankName: 'Chase Bank',
    entityName: 'Acme Capital',
    cardNumber: '**** 1234',
    balance: 125000.5,
    currency: 'USD',
  },
  {
    id: '2',
    bankName: 'Bank of America',
    entityName: 'Acme Capital',
    cardNumber: '**** 5678',
    balance: 85000.0,
    currency: 'USD',
  },
];

const TABS = ['Activity', 'Credit', 'Cards', 'Members', 'Subscriptions'];

export function WalletModal({ visible, onClose }: WalletModalProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('Activity');

  function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  }

  function renderCard({ item }: { item: BankCard }) {
    return (
      <View
        style={[
          styles.cardContainer,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.bankName, { color: theme.colors.text }]}>{item.bankName}</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
        </View>
        <Text style={[styles.entityName, { color: theme.colors.textSecondary }]}>
          {item.entityName}
        </Text>
        <View style={styles.cardFooter}>
          <Text style={[styles.cardNumber, { color: theme.colors.textTertiary }]}>
            {item.cardNumber}
          </Text>
          <Text style={[styles.balance, { color: theme.colors.text }]}>
            {formatCurrency(item.balance, item.currency)}
          </Text>
        </View>
      </View>
    );
  }

  function renderTabContent() {
    switch (activeTab) {
      case 'Activity':
        return (
          <ActivityTransactions
            onTransactionPress={transaction => {
              console.log('Transaction pressed:', transaction);
            }}
          />
        );
      case 'Credit':
        return (
          <Credit
            onAccountPress={account => {
              console.log('Credit account pressed:', account);
            }}
          />
        );
      case 'Cards':
        return (
          <Cards
            onCardPress={card => {
              console.log('Card pressed:', card);
            }}
          />
        );
      case 'Members':
        return (
          <Members
            onMemberPress={member => {
              console.log('Member pressed:', member);
            }}
            onInvitePress={() => {
              console.log('Invite member pressed');
            }}
          />
        );
      case 'Subscriptions':
        return (
          <Subscriptions
            onSubscriptionPress={subscription => {
              console.log('Subscription pressed:', subscription);
            }}
          />
        );
      default:
        return null;
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <BlurredModalOverlay visible={visible} onClose={onClose}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.colors.surface,
              minHeight: 500 + insets.bottom * 2,
              maxHeight: 650 + insets.bottom * 2,
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <LinearGradient
              colors={
                isDark
                  ? [theme.colors.surface, `${theme.colors.surface}00`]
                  : [theme.colors.surface, `${theme.colors.surface}00`]
              }
              style={styles.modalHeaderGradient}
              pointerEvents="none"
            />
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Wallet</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {/* Bank Cards Row */}
          <View style={styles.cardsSection}>
            <FlatList
              data={MOCK_CARDS}
              renderItem={renderCard}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardsList}
            />
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsList}
            >
              {TABS.map(tab => (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tab,
                    {
                      backgroundColor:
                        activeTab === tab ? theme.colors.primary : theme.colors.surfaceVariant,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color:
                          activeTab === tab ? theme.colors.background : theme.colors.textSecondary,
                      },
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Tab Content */}
          <View style={styles.content}>{renderTabContent()}</View>
        </View>
      </BlurredModalOverlay>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    position: 'relative',
    zIndex: 2,
  },
  modalHeaderGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    zIndex: 10,
    flex: 1,
    textAlign: 'center',
  },
  cardsSection: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  cardsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  cardContainer: {
    width: 280,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '600',
  },
  entityName: {
    fontSize: 14,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardNumber: {
    fontSize: 12,
  },
  balance: {
    fontSize: 18,
    fontWeight: '700',
  },
  tabsContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  tabsList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
});
