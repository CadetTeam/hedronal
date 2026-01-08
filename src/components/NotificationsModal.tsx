import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { BlurredModalOverlay } from './BlurredModalOverlay';
import { LinearGradient } from 'expo-linear-gradient';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'New Entity Created',
    message: 'Acme Capital has been created successfully',
    timestamp: '2 hours ago',
    read: false,
  },
  {
    id: '2',
    title: 'Invitation Sent',
    message: 'You have been invited to join Tech Ventures',
    timestamp: '5 hours ago',
    read: false,
  },
  {
    id: '3',
    title: 'Payment Received',
    message: '$10,000 has been deposited to your account',
    timestamp: '1 day ago',
    read: true,
  },
];

export function NotificationsModal({ visible, onClose }: NotificationsModalProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Memoize notifications to prevent unnecessary re-renders
  const notifications = useMemo(() => MOCK_NOTIFICATIONS, []);

  function renderNotification({ item }: { item: Notification }) {
    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          {
            backgroundColor: item.read ? theme.colors.surface : theme.colors.surfaceVariant,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.notificationContent}>
          <Text style={[styles.notificationTitle, { color: theme.colors.text }]}>
            {item.title}
          </Text>
          <Text style={[styles.notificationMessage, { color: theme.colors.textSecondary }]}>
            {item.message}
          </Text>
          <Text style={[styles.notificationTimestamp, { color: theme.colors.textTertiary }]}>
            {item.timestamp}
          </Text>
        </View>
        {!item.read && (
          <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />
        )}
      </TouchableOpacity>
    );
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
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Notifications</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              notifications.length === 0 && styles.emptyContainer,
              styles.contentContainer,
              { paddingBottom: insets.bottom * 2 + 100 },
            ]}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  No notifications yet
                </Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  emptyText: {
    fontSize: 14,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    marginBottom: 8,
  },
  notificationTimestamp: {
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 12,
    alignSelf: 'center',
  },
});

