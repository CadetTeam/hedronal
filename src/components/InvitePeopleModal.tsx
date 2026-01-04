import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  Keyboard,
  Platform,
  ScrollView,
} from 'react-native';
import { Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Contacts from 'expo-contacts';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { BlurredModalOverlay } from './BlurredModalOverlay';

interface InvitePeopleModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete?: (
    invitedContacts: Array<{ id: string; name: string; phone?: string; email?: string }>
  ) => void;
}

export function InvitePeopleModal({ visible, onClose, onComplete }: InvitePeopleModalProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [contacts, setContacts] = useState<
    Array<{ id: string; name: string; phone?: string; email?: string }>
  >([]);
  const [people, setPeople] = useState<
    Array<{ id: string; name: string; phone?: string; email?: string }>
  >([]);
  const [selectedContacts, setSelectedContacts] = useState<
    Array<{ id: string; name: string; phone?: string; email?: string }>
  >([]);
  const [showInviteMessage, setShowInviteMessage] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteSource, setInviteSource] = useState<'contacts' | 'people' | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const inviteMessageInputRef = useRef<TextInput>(null);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      e => {
        setKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  useEffect(() => {
    // Generate invite message when contacts are selected
    if (selectedContacts.length > 0 && !inviteMessage) {
      const deepLink = 'https://apps.apple.com/app/hedronal';
      const message = `Hi! I'd like to invite you to join Hedronal, a platform for managing entities, portfolios, and connections. Download the app here: ${deepLink}`;
      setInviteMessage(message);
    }
  }, [selectedContacts]);

  useEffect(() => {
    if (!visible) {
      // Reset state when modal closes
      setContacts([]);
      setPeople([]);
      setSelectedContacts([]);
      setShowInviteMessage(false);
      setInviteMessage('');
      setInviteSource(null);
    } else {
      // Auto-load contacts when modal opens if permission already granted
      checkAndLoadContacts();
    }
  }, [visible]);

  async function checkAndLoadContacts() {
    try {
      // Check if permission is already granted
      const { status } = await Contacts.getPermissionsAsync();
      if (status === 'granted') {
        // Permission already granted, load contacts automatically
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
        });
        if (data && data.length > 0) {
          setContacts(
            data.map(contact => ({
              id: contact.id,
              name: contact.name || 'Unknown',
              phone: contact.phoneNumbers?.[0]?.number,
              email: contact.emails?.[0]?.email,
            }))
          );
          setInviteSource('contacts');
        }
      }
    } catch (error) {
      // Silently fail - user can still manually import
      console.log('[InvitePeopleModal] Could not auto-load contacts:', error);
    }
  }

  async function requestContactsPermission() {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === 'granted') {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
      });
      setContacts(
        data.map(contact => ({
          id: contact.id,
          name: contact.name || 'Unknown',
          phone: contact.phoneNumbers?.[0]?.number,
          email: contact.emails?.[0]?.email,
        }))
      );
      setInviteSource('contacts');
    } else {
      Alert.alert('Permission Denied', 'Please grant contacts permission to import contacts.');
    }
  }

  function loadPeople() {
    // TODO: Load people from People screen/context
    // For now, this is a placeholder
    setInviteSource('people');
  }

  function toggleContactSelection(contact: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
  }) {
    const isSelected = selectedContacts.some(c => c.id === contact.id);
    if (isSelected) {
      setSelectedContacts(selectedContacts.filter(c => c.id !== contact.id));
    } else {
      setSelectedContacts([...selectedContacts, contact]);
    }
  }

  async function handleSendInvites() {
    setShowInviteMessage(true);
    // Focus the message input after a short delay to ensure it's rendered
    setTimeout(() => {
      inviteMessageInputRef.current?.focus();
    }, 100);
  }

  async function sendInvites() {
    // In a real app, you would send the invites via SMS/Email
    Alert.alert('Invites Sent', `${selectedContacts.length} invitation(s) sent successfully.`);
    setShowInviteMessage(false);
    if (onComplete) {
      onComplete(selectedContacts);
    }
    onClose();
  }

  function handleClose() {
    if (showInviteMessage) {
      setShowInviteMessage(false);
    } else {
      onClose();
    }
  }

  const displayList =
    inviteSource === 'contacts' ? contacts : inviteSource === 'people' ? people : [];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <BlurredModalOverlay visible={visible} onClose={handleClose}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.colors.surface,
              minHeight: 500 + insets.bottom * 2,
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
            <View style={styles.headerLeft}>
              {showInviteMessage ? (
                <TouchableOpacity onPress={() => setShowInviteMessage(false)}>
                  <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              ) : (
                <View style={{ width: 24 }} />
              )}
            </View>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {showInviteMessage ? 'Invitation Message' : 'Invite People'}
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={[
              styles.contentContainer,
              {
                paddingBottom:
                  insets.bottom * 2 +
                  (selectedContacts.length > 0 ? 80 : 0) +
                  (showInviteMessage ? 200 : 0),
              },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
              Invite people to join Hedronal
            </Text>

            {inviteSource === null ? (
              <View style={styles.inviteSourceButtons}>
                <TouchableOpacity
                  style={[styles.importButton, { backgroundColor: theme.colors.primary }]}
                  onPress={requestContactsPermission}
                >
                  <Ionicons name="person-add-outline" size={20} color={theme.colors.background} />
                  <Text style={[styles.importButtonText, { color: theme.colors.background }]}>
                    Import Contacts
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.importButton,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      borderWidth: 1,
                    },
                  ]}
                  onPress={loadPeople}
                >
                  <Ionicons name="people-outline" size={20} color={theme.colors.text} />
                  <Text style={[styles.importButtonText, { color: theme.colors.text }]}>
                    From People List
                  </Text>
                </TouchableOpacity>
              </View>
            ) : displayList.length === 0 ? (
              <View style={styles.emptyContacts}>
                <Text style={[styles.emptyContactsText, { color: theme.colors.textSecondary }]}>
                  {inviteSource === 'contacts' ? 'No contacts found' : 'No people in your list'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={displayList}
                keyExtractor={item => item.id}
                renderItem={({ item }) => {
                  const isSelected = selectedContacts.some(c => c.id === item.id);
                  return (
                    <TouchableOpacity
                      style={[
                        styles.contactItem,
                        {
                          backgroundColor: theme.colors.surfaceVariant,
                          borderColor: theme.colors.border,
                        },
                      ]}
                      onPress={() => toggleContactSelection(item)}
                    >
                      <View
                        style={[
                          styles.contactAvatar,
                          {
                            backgroundColor: isSelected
                              ? theme.colors.primary
                              : theme.colors.surface,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.contactAvatarText,
                            { color: isSelected ? theme.colors.background : theme.colors.text },
                          ]}
                        >
                          {item.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.contactInfo}>
                        <Text style={[styles.contactName, { color: theme.colors.text }]}>
                          {item.name}
                        </Text>
                        {item.phone && (
                          <Text
                            style={[styles.contactDetail, { color: theme.colors.textSecondary }]}
                          >
                            {item.phone}
                          </Text>
                        )}
                        {item.email && (
                          <Text
                            style={[styles.contactDetail, { color: theme.colors.textSecondary }]}
                          >
                            {item.email}
                          </Text>
                        )}
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                }}
                scrollEnabled={false}
              />
            )}
          </ScrollView>

          {/* Send Invite Button - Floating */}
          {selectedContacts.length > 0 && !showInviteMessage && (
            <TouchableOpacity
              style={[
                styles.sendInviteButtonFloating,
                {
                  backgroundColor: theme.colors.primary,
                  shadowColor: '#000',
                  shadowOffset: {
                    width: 0,
                    height: 2,
                  },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                  bottom: keyboardVisible ? keyboardHeight : insets.bottom + 16,
                },
              ]}
              onPress={handleSendInvites}
            >
              <Text style={[styles.sendInviteButtonText, { color: theme.colors.background }]}>
                Send Invite ({selectedContacts.length})
              </Text>
            </TouchableOpacity>
          )}

          {/* Invite Message - Sticky to Keyboard */}
          {showInviteMessage && (
            <View
              style={[
                styles.inviteMessageContainer,
                {
                  backgroundColor: 'transparent',
                  bottom: keyboardVisible ? keyboardHeight : insets.bottom,
                },
              ]}
            >
              <View
                style={[styles.deepLinkContainer, { backgroundColor: theme.colors.surfaceVariant }]}
              >
                <Text
                  style={[styles.deepLinkText, { color: theme.colors.textSecondary }]}
                  numberOfLines={1}
                >
                  https://apps.apple.com/app/hedronal
                </Text>
                <Ionicons name="lock-closed" size={16} color={theme.colors.textTertiary} />
              </View>
              <TextInput
                ref={inviteMessageInputRef}
                style={[
                  styles.inviteMessageInput,
                  {
                    backgroundColor: theme.colors.surfaceVariant,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                value={inviteMessage}
                onChangeText={setInviteMessage}
                placeholder="Edit your invitation message..."
                placeholderTextColor={theme.colors.textTertiary}
                multiline
              />
              <TouchableOpacity
                style={[
                  styles.sendButtonMinimized,
                  {
                    backgroundColor: theme.colors.primary,
                    shadowColor: '#000',
                    shadowOffset: {
                      width: 0,
                      height: 2,
                    },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  },
                ]}
                onPress={sendInvites}
              >
                <Text style={[styles.sendButtonTextMinimized, { color: theme.colors.background }]}>
                  Send
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </BlurredModalOverlay>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 500,
    maxHeight: 650,
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
  headerLeft: {
    width: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
  },
  inviteSourceButtons: {
    gap: 12,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  importButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContacts: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyContactsText: {
    fontSize: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactAvatarText: {
    fontSize: 20,
    fontWeight: '600',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactDetail: {
    fontSize: 14,
  },
  sendInviteButtonFloating: {
    position: 'absolute',
    left: 20,
    right: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendInviteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  inviteMessageContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  deepLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  deepLinkText: {
    flex: 1,
    fontSize: 12,
    marginRight: 8,
  },
  inviteMessageInput: {
    minHeight: 100,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    textAlignVertical: 'top',
    marginBottom: 12,
    fontSize: 16,
  },
  sendButtonMinimized: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  sendButtonTextMinimized: {
    fontSize: 14,
    fontWeight: '600',
  },
});
