import React, { useState } from 'react';
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
import { useTheme } from '../../context/ThemeContext';
import { useTabBar } from '../../context/TabBarContext';
import { Header } from '../../components/Header';
import { EmptyState } from '../../components/EmptyState';
import { SkeletonCard } from '../../components/Skeleton';
import { Button } from '../../components/Button';
import { InvitePeopleModal } from '../../components/InvitePeopleModal';

export function PeopleScreen() {
  const { theme } = useTheme();
  const { triggerRefresh } = useTabBar();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [people, setPeople] = useState<any[]>([]); // Will be populated with dummy data
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
  const [showPersonMenu, setShowPersonMenu] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    triggerRefresh(); // Trigger bubble animation reload
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setRefreshing(false);
  }

  function handleAddPerson() {
    setShowInviteModal(true);
  }

  function handleInviteComplete(invitedContacts: Array<{ id: string; name: string; phone?: string; email?: string }>) {
    // Invites sent - could add to people list if needed
    console.log('Invites sent to:', invitedContacts);
    setShowInviteModal(false);
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

  function renderPerson({ item }: { item: any }) {
    return (
      <View
        style={[
          styles.personCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.personHeader}>
          <View style={styles.personInfo}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text style={[styles.avatarText, { color: theme.colors.background }]}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.personDetails}>
              <Text style={[styles.personName, { color: theme.colors.text }]}>
                {item.name}
              </Text>
              <Text style={[styles.personCompany, { color: theme.colors.textSecondary }]}>
                {item.company}
              </Text>
              <Text style={[styles.personLocation, { color: theme.colors.textTertiary }]}>
                {item.location}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => handlePersonMenu(item)}
            style={styles.menuButton}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.personActions}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: theme.colors.primary,
              },
            ]}
            onPress={() => handleChat(item)}
          >
            <Ionicons name="chatbubble-outline" size={18} color={theme.colors.background} />
            <Text style={[styles.actionButtonText, { color: theme.colors.background }]}>
              Chat
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
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
            <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
              {item.following ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function renderEmpty() {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      );
    }
    return (
      <EmptyState
        title="No people yet"
        message="Tap the + button to invite people"
      />
    );
  }

  return (
    <SafeAreaView
      edges={[]}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Header
        title="People"
        rightAction={{
          icon: 'add',
          onPress: handleAddPerson,
        }}
      />

      <View style={styles.actionsBar}>
        <TouchableOpacity
          style={[
            styles.actionButtonSmall,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={handleFilter}
        >
          <Ionicons name="filter" size={20} color={theme.colors.text} />
          <Text style={[styles.actionText, { color: theme.colors.text }]}>Filter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButtonSmall,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={handleSort}
        >
          <Ionicons name="swap-vertical" size={20} color={theme.colors.text} />
          <Text style={[styles.actionText, { color: theme.colors.text }]}>Sort</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={people}
        renderItem={renderPerson}
        keyExtractor={(item, index) => `person-${index}`}
        contentContainerStyle={[
          people.length === 0 ? styles.emptyContainer : styles.listContent,
          { paddingBottom: 100 },
        ]}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />

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
              onPress={() => handleMenuAction('follow')}
            >
              <Text style={[styles.menuItemText, { color: theme.colors.text }]}>
                {selectedPerson?.following ? 'Unfollow' : 'Follow'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuAction('block')}
            >
              <Text style={[styles.menuItemText, { color: theme.colors.error }]}>
                Block
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuAction('report')}
            >
              <Text style={[styles.menuItemText, { color: theme.colors.warning }]}>
                Report
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuAction('delete')}
            >
              <Text style={[styles.menuItemText, { color: theme.colors.error }]}>
                Delete
              </Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  actionsBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  actionButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
  },
  loadingContainer: {
    padding: 16,
  },
  personCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  personHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  personInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
  },
  personDetails: {
    flex: 1,
  },
  personName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  personCompany: {
    fontSize: 14,
    marginBottom: 2,
  },
  personLocation: {
    fontSize: 12,
  },
  menuButton: {
    padding: 4,
  },
  personActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
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
