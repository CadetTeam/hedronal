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
import { PlaidModal } from './PlaidModal';
import { UserProfileModal } from './UserProfileModal';

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

const INITIAL_CARDS: BankCard[] = [
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
  const [showPlaidModal, setShowPlaidModal] = useState(false);
  const [accounts, setAccounts] = useState<BankCard[]>(INITIAL_CARDS);
  const [selectedAccount, setSelectedAccount] = useState<BankCard | null>(INITIAL_CARDS[0] || null);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  }

  function handleAccountPress(account: BankCard) {
    // Reorder accounts to put selected account first
    const reorderedAccounts = [account, ...accounts.filter(acc => acc.id !== account.id)];
    setAccounts(reorderedAccounts);
    setSelectedAccount(account);
  }

  function renderCard({ item }: { item: BankCard }) {
    const isSelected = selectedAccount?.id === item.id;
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleAccountPress(item)}
        style={[
          styles.cardContainer,
          {
            backgroundColor: theme.colors.surface,
            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
            borderWidth: isSelected ? 2 : 1,
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
      </TouchableOpacity>
    );
  }

  function renderTabContent() {
    if (!selectedAccount) {
      return null;
    }

    switch (activeTab) {
      case 'Activity':
        return (
          <ActivityTransactions
            selectedAccount={selectedAccount}
            onTransactionPress={transaction => {
              console.log('Transaction pressed:', transaction);
            }}
          />
        );
      case 'Credit':
        return (
          <Credit
            selectedAccount={selectedAccount}
            onAccountPress={account => {
              console.log('Credit account pressed:', account);
            }}
          />
        );
      case 'Cards':
        return (
          <Cards
            selectedAccount={selectedAccount}
            onCardPress={card => {
              console.log('Card pressed:', card);
            }}
          />
        );
      case 'Members':
        return (
          <Members
            selectedAccount={selectedAccount}
            onMemberPress={member => {
              // If member has profileId, open user profile modal
              if ((member as any).profileId) {
                setSelectedUserId((member as any).profileId);
                setShowUserProfileModal(true);
              } else {
                console.log('Member pressed:', member);
              }
            }}
            onInvitePress={() => {
              console.log('Invite member pressed');
            }}
          />
        );
      case 'Subscriptions':
        return (
          <Subscriptions
            selectedAccount={selectedAccount}
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
            <View style={styles.cardsRowContainer}>
              <TouchableOpacity
                style={[
                  styles.addAccountButton,
                  {
                    backgroundColor: theme.colors.surfaceVariant,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => setShowPlaidModal(true)}
              >
                <Ionicons name="add" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
              <FlatList
                data={accounts}
                renderItem={renderCard}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsList}
              />
            </View>
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

      {/* Plaid Modal */}
      <PlaidModal
        visible={showPlaidModal}
        onClose={() => setShowPlaidModal(false)}
        onSuccess={accountData => {
          console.log('Account linked successfully:', accountData);
          // Create new account from Plaid data
          const newAccount: BankCard = {
            id: Date.now().toString(),
            bankName: accountData.bankName,
            entityName: 'New Account', // TODO: Get from entity context
            cardNumber: '**** ****',
            balance: 0,
            currency: 'USD',
          };
          // Add to accounts and select it
          const updatedAccounts = [newAccount, ...accounts];
          setAccounts(updatedAccounts);
          setSelectedAccount(newAccount);
          setShowPlaidModal(false);
        }}
      />

      {/* User Profile Modal */}
      {selectedUserId && (
        <UserProfileModal
          visible={showUserProfileModal}
          onClose={() => {
            setShowUserProfileModal(false);
            setSelectedUserId(null);
          }}
          userId={selectedUserId}
        />
      )}
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
  cardsRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addAccountButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
    flexShrink: 0,
  },
  cardsList: {
    paddingRight: 16,
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
