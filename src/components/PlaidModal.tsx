import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { BlurredModalOverlay } from './BlurredModalOverlay';
import { LinearGradient } from 'expo-linear-gradient';

interface PlaidModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (accountData: any) => void;
}

export function PlaidModal({ visible, onClose, onSuccess }: PlaidModalProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);

  // Mock bank list - in production, this would come from Plaid API
  const banks = [
    { id: 'chase', name: 'Chase', icon: '🏦' },
    { id: 'bofa', name: 'Bank of America', icon: '🏦' },
    { id: 'wells', name: 'Wells Fargo', icon: '🏦' },
    { id: 'citi', name: 'Citibank', icon: '🏦' },
    { id: 'usbank', name: 'U.S. Bank', icon: '🏦' },
    { id: 'pnc', name: 'PNC Bank', icon: '🏦' },
    { id: 'td', name: 'TD Bank', icon: '🏦' },
    { id: 'capital', name: 'Capital One', icon: '🏦' },
  ];

  async function handleLinkAccount() {
    if (!selectedBank) {
      Alert.alert('Select Bank', 'Please select a bank to link your account.');
      return;
    }

    setLoading(true);
    try {
      // TODO: Integrate with Plaid Link SDK
      // For now, simulate a successful connection
      await new Promise(resolve => setTimeout(resolve, 1500));

      const accountData = {
        bankId: selectedBank,
        bankName: banks.find(b => b.id === selectedBank)?.name || 'Unknown Bank',
        linkedAt: new Date().toISOString(),
      };

      onSuccess(accountData);
      Alert.alert('Success', 'Your bank account has been linked successfully!');
    } catch (error) {
      console.error('Error linking account:', error);
      Alert.alert('Error', 'Failed to link account. Please try again.');
    } finally {
      setLoading(false);
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
              minHeight: 400 + insets.bottom * 2,
              maxHeight: 600 + insets.bottom * 2,
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
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Link Bank Account</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            contentContainerStyle={[styles.modalBodyContent, { paddingBottom: insets.bottom * 2 }]}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
              Select your bank to securely link your account using Plaid.
            </Text>

            <View style={styles.banksList}>
              {banks.map(bank => (
                <TouchableOpacity
                  key={bank.id}
                  style={[
                    styles.bankItem,
                    {
                      backgroundColor:
                        selectedBank === bank.id
                          ? theme.colors.primary
                          : theme.colors.surfaceVariant,
                      borderColor:
                        selectedBank === bank.id ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                  onPress={() => setSelectedBank(bank.id)}
                >
                  <Text style={styles.bankIcon}>{bank.icon}</Text>
                  <Text
                    style={[
                      styles.bankName,
                      {
                        color:
                          selectedBank === bank.id ? theme.colors.background : theme.colors.text,
                      },
                    ]}
                  >
                    {bank.name}
                  </Text>
                  {selectedBank === bank.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={theme.colors.background}
                      style={styles.checkIcon}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.linkButton,
                {
                  backgroundColor: selectedBank
                    ? theme.colors.primary
                    : theme.colors.surfaceVariant,
                  opacity: selectedBank && !loading ? 1 : 0.5,
                },
              ]}
              onPress={handleLinkAccount}
              disabled={!selectedBank || loading}
            >
              {loading ? (
                <Text style={[styles.linkButtonText, { color: theme.colors.background }]}>
                  Linking...
                </Text>
              ) : (
                <>
                  <Ionicons name="link" size={20} color={theme.colors.background} />
                  <Text style={[styles.linkButtonText, { color: theme.colors.background }]}>
                    Link Account
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={[styles.disclaimer, { color: theme.colors.textTertiary }]}>
              Your bank credentials are encrypted and never stored. We use Plaid to securely connect
              your accounts.
            </Text>
          </ScrollView>
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
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    padding: 16,
  },
  description: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  banksList: {
    gap: 12,
    marginBottom: 24,
  },
  bankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  bankIcon: {
    fontSize: 24,
  },
  bankName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  checkIcon: {
    marginLeft: 'auto',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  linkButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});
