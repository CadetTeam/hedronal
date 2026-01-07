import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import { useTheme } from '../../context/ThemeContext';
import { useTabBar } from '../../context/TabBarContext';
import { Header } from '../../components/Header';
import { EmptyState } from '../../components/EmptyState';
import { SkeletonCard } from '../../components/Skeleton';
import { Button } from '../../components/Button';
import { InvitePeopleModal } from '../../components/InvitePeopleModal';
import { WalletModal } from '../../components/WalletModal';
import { NotificationsModal } from '../../components/NotificationsModal';
import { UserProfileModal } from '../../components/UserProfileModal';
import { getInvites } from '../../services/inviteService';

export function PeopleScreen() {
  const { theme } = useTheme();
  const { triggerRefresh } = useTabBar();
  const { getToken } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [people, setPeople] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showPersonMenu, setShowPersonMenu] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);

  useEffect(() => {
    loadPeople();
  }, []);

  async function loadPeople() {
    try {
      setLoading(true);
      const token = await getToken();
      const result = await getInvites(token || undefined);
      if (result.success && result.invites) {
        // Transform invites to people format
        const peopleList = result.invites.map((invite: any) => ({
          id: invite.id,
          name: invite.name,
          email: invite.email,
          phone: invite.phone,
          company: invite.company || '',
          location: invite.location || '',
          status: invite.status || 'pending', // pending, accepted, rejected
          profileId: invite.profile_id, // If they have a profile
        }));
        setPeople(peopleList);
      }
    } catch (error) {
      console.error('[PeopleScreen] Error loading people:', error);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    triggerRefresh(); // Trigger bubble animation reload
    await loadPeople();
    setRefreshing(false);
  }

  function handleAddPerson() {
    setShowInviteModal(true);
  }

  function handleInviteComplete(
    invitedContacts: Array<{ id: string; name: string; phone?: string; email?: string }>
  ) {
    // Reload people list to show new invites
    loadPeople();
    setShowInviteModal(false);
  }

  function handlePersonClick(person: any) {
    // If person has a profileId, show their profile
    if (person.profileId) {
      setSelectedUserId(person.profileId);
      setShowUserProfileModal(true);
    } else {
      // Otherwise, just show menu or do nothing
      handlePersonMenu(person);
    }
  }

  function handleFilter() {
    setShowFilters(!showFilters);
  }

  function handleSort() {
    // Show sort options
  }

  function handleChat(person: any) {
    // Navigate to chat
  }

  function handlePersonMenu(person: any) {
    setSelectedPerson(person);
    setShowPersonMenu(true);
  }

  function handleMenuAction(action: string) {
    // Handle follow/unfollow, block, report, delete
    setShowPersonMenu(false);
    setSelectedPerson(null);
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'accepted':
        return theme.colors.primary;
      case 'rejected':
        return '#ef4444';
      default:
        return theme.colors.textSecondary;
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending';
    }
  }

  function renderPerson({ item }: { item: any }) {
    return (
      <TouchableOpacity
        onPress={() => handlePersonClick(item)}
        style={[
          styles.personCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.personRow}>
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
            <Text style={[styles.avatarText, { color: theme.colors.background }]}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>

          {/* Info Section */}
          <View style={styles.personInfo}>
            <View style={styles.personNameRow}>
              <Text style={[styles.personName, { color: theme.colors.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              {item.status && (
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: getStatusColor(item.status) + '20',
                      borderColor: getStatusColor(item.status),
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: getStatusColor(item.status),
                      },
                    ]}
                  >
                    {getStatusLabel(item.status)}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.personMetaRow}>
              {item.company && (
                <Text
                  style={[styles.personMeta, { color: theme.colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {item.company}
                </Text>
              )}
              {item.location && (
                <>
                  {item.company && (
                    <Text style={[styles.metaSeparator, { color: theme.colors.textTertiary }]}>
                      •
                    </Text>
                  )}
                  <Text
                    style={[styles.personMeta, { color: theme.colors.textTertiary }]}
                    numberOfLines={1}
                  >
                    {item.location}
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.personActions}>
            <TouchableOpacity
              style={[
                styles.iconButton,
                {
                  backgroundColor: theme.colors.primary,
                },
              ]}
              onPress={() => handleChat(item)}
            >
              <Ionicons name="chatbubble-outline" size={18} color={theme.colors.background} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.iconButton,
                {
                  backgroundColor: item.following
                    ? theme.colors.surfaceVariant
                    : theme.colors.secondary,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Ionicons
                name={item.following ? 'checkmark' : 'add'}
                size={18}
                color={theme.colors.text}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handlePersonMenu(item)}
              style={[
                styles.iconButton,
                {
                  backgroundColor: 'transparent',
                },
              ]}
            >
              <Ionicons name="ellipsis-horizontal" size={18} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  function renderProfileSkeleton() {
    return (
      <View
        style={[
          styles.personCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            opacity: 0.1,
          },
        ]}
      >
        <View style={styles.personRow}>
          {/* Avatar skeleton */}
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: theme.colors.surfaceVariant,
              },
            ]}
          />
          <View style={styles.personInfo}>
            {/* Name skeleton */}
            <View
              style={[
                {
                  height: 15,
                  width: '60%',
                  backgroundColor: theme.colors.surfaceVariant,
                  borderRadius: 4,
                  marginBottom: 6,
                },
              ]}
            />
            {/* Meta skeleton */}
            <View
              style={[
                {
                  height: 12,
                  width: '50%',
                  backgroundColor: theme.colors.surfaceVariant,
                  borderRadius: 4,
                },
              ]}
            />
          </View>
          {/* Action buttons skeleton */}
          <View style={styles.personActions}>
            <View
              style={[
                styles.iconButton,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                },
              ]}
            />
            <View
              style={[
                styles.iconButton,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                },
              ]}
            />
            <View
              style={[
                styles.iconButton,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                },
              ]}
            />
          </View>
        </View>
      </View>
    );
  }

  function renderEmpty() {
    return (
      <View style={styles.emptyContainer}>
        {/* Skeleton cards */}
        {[1, 2, 3].map(i => (
          <View key={i}>{renderProfileSkeleton()}</View>
        ))}
        {/* CTA Overlay */}
        <View style={styles.emptyStateOverlay}>
          <TouchableOpacity
            style={styles.ctaContainer}
            activeOpacity={0.9}
            onPress={() => setShowInviteModal(true)}
          >
            <EmptyState
              title="Start Building Your Network"
              message="Invite people to connect and collaborate"
              icon="people-outline"
              transparent
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView
      edges={[]}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Header
        title="People"
        leftAction={{
          icon: 'wallet-outline',
          onPress: () => setShowWalletModal(true),
        }}
        rightAction={{
          icon: 'add',
          onPress: handleAddPerson,
        }}
        rightSideAction={{
          icon: 'notifications-outline',
          onPress: () => setShowNotificationsModal(true),
        }}
      />

      <View style={styles.actionsBar}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={handleFilter}
          >
            <Ionicons name="filter" size={16} color={theme.colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={handleSort}
          >
            <Ionicons name="swap-vertical" size={16} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.connectionsValue}>
          <Text style={[styles.connectionsLabel, { color: theme.colors.textSecondary }]}>
            Total Connections
          </Text>
          <Text style={[styles.connectionsAmount, { color: theme.colors.text }]}>
            {people.length}
          </Text>
        </View>
      </View>

      <FlatList
        data={people}
        renderItem={renderPerson}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          people.length === 0 ? styles.emptyContainer : styles.listContent,
          { paddingBottom: 100 },
        ]}
        ListEmptyComponent={loading ? (
          <View style={styles.loadingContainer}>
            {[1, 2, 3].map(i => (
              <View key={i}>{renderProfileSkeleton()}</View>
            ))}
          </View>
        ) : (
          renderEmpty()
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Person Menu Modal */}
      <Modal
        visible={showPersonMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPersonMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPersonMenu(false)}
        >
          <View
            style={[
              styles.menuContainer,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                handleMenuAction('follow');
              }}
            >
              <Text style={[styles.menuItemText, { color: theme.colors.text }]}>Follow</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                handleMenuAction('message');
              }}
            >
              <Text style={[styles.menuItemText, { color: theme.colors.text }]}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                handleMenuAction('block');
              }}
            >
              <Text style={[styles.menuItemText, { color: theme.colors.error }]}>Block</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Invite People Modal */}
      <InvitePeopleModal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onComplete={handleInviteComplete}
      />

      {/* Wallet Modal */}
      <WalletModal visible={showWalletModal} onClose={() => setShowWalletModal(false)} />

      {/* Notifications Modal */}
      <NotificationsModal
        visible={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  actionsLeft: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
  },
  connectionsValue: {
    alignItems: 'flex-end',
    borderWidth: 0,
  },
  connectionsLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  connectionsAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    position: 'relative',
  },
  emptyStateOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    backgroundColor: 'transparent',
  },
  ctaContainer: {
    width: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    padding: 16,
  },
  personCard: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  personInfo: {
    flex: 1,
    minWidth: 0, // Allows text truncation
  },
  personNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  personName: {
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  personMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  personMeta: {
    fontSize: 12,
    flexShrink: 1,
  },
  metaSeparator: {
    fontSize: 12,
    marginHorizontal: 2,
  },
  personActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    minWidth: 200,
  },
  menuItem: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  menuItemText: {
    fontSize: 16,
  },
});
