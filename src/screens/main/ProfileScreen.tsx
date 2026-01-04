import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  SafeAreaView,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useTabBar } from '../../context/TabBarContext';
import { EmptyState } from '../../components/EmptyState';
import { Button } from '../../components/Button';

export function ProfileScreen() {
  const { theme, setColorScheme, colorScheme } = useTheme();
  const { triggerRefresh } = useTabBar();
  const [refreshing, setRefreshing] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showPostsModal, setShowPostsModal] = useState(false);
  const [activity, setActivity] = useState<any[]>([]); // Will be populated with dummy data

  async function onRefresh() {
    setRefreshing(true);
    triggerRefresh(); // Trigger bubble animation reload
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setRefreshing(false);
  }

  function renderActivityItem({ item }: { item: any }) {
    return (
      <View
        style={[
          styles.activityItem,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Ionicons
          name={item.icon}
          size={24}
          color={theme.colors.primary}
          style={styles.activityIcon}
        />
        <View style={styles.activityContent}>
          <Text style={[styles.activityText, { color: theme.colors.text }]}>
            {item.text}
          </Text>
          <Text style={[styles.activityDate, { color: theme.colors.textTertiary }]}>
            {item.date}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <View
          style={[
            styles.banner,
            { backgroundColor: theme.colors.primary },
          ]}
        >
          <Text style={[styles.bannerText, { color: theme.colors.background }]}>
            H
          </Text>
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: theme.colors.primary,
                borderColor: theme.colors.background,
              },
            ]}
          >
            <Text style={[styles.avatarText, { color: theme.colors.background }]}>
              U
            </Text>
          </View>

          <Text style={[styles.name, { color: theme.colors.text }]}>User Name</Text>
          <Text style={[styles.bio, { color: theme.colors.textSecondary }]}>
            Bio goes here. This is where users can describe themselves.
          </Text>

          {/* Social Links */}
          <View style={styles.socialLinks}>
            <TouchableOpacity style={styles.socialLink}>
              <Ionicons name="logo-twitter" size={20} color={theme.colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialLink}>
              <Ionicons name="logo-linkedin" size={20} color={theme.colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialLink}>
              <Ionicons name="globe-outline" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.stats}>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => setShowFollowersModal(true)}
            >
              <Text style={[styles.statNumber, { color: theme.colors.text }]}>0</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Followers
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => setShowFollowingModal(true)}
            >
              <Text style={[styles.statNumber, { color: theme.colors.text }]}>0</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Following
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => setShowPostsModal(true)}
            >
              <Text style={[styles.statNumber, { color: theme.colors.text }]}>0</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Posts
              </Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              title="Wallet"
              onPress={() => setShowWalletModal(true)}
              variant="outline"
              style={styles.actionButton}
            />
            <Button
              title="Points"
              onPress={() => setShowPointsModal(true)}
              variant="outline"
              style={styles.actionButton}
            />
            <TouchableOpacity
              style={[
                styles.settingsButton,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => setShowSettingsModal(true)}
            >
              <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Activity Feed */}
        <View style={styles.activitySection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Activity</Text>
          {activity.length === 0 ? (
            <EmptyState
              title="No activity yet"
              message="Your activity will appear here"
            />
          ) : (
            <FlatList
              data={activity}
              renderItem={renderActivityItem}
              keyExtractor={(item, index) => `activity-${index}`}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Wallet Modal */}
      <Modal
        visible={showWalletModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowWalletModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Wallet</Text>
              <TouchableOpacity onPress={() => setShowWalletModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={[styles.modalText, { color: theme.colors.textSecondary }]}>
                Wallet functionality coming soon
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Points Modal */}
      <Modal
        visible={showPointsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPointsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Points</Text>
              <TouchableOpacity onPress={() => setShowPointsModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={[styles.modalText, { color: theme.colors.textSecondary }]}>
                Points tracker coming soon
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Settings</Text>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <SettingsSection
                title="Data Management"
                items={[
                  { label: 'Export Data', onPress: () => {} },
                  { label: 'Delete Account', onPress: () => {}, destructive: true },
                ]}
              />
              <SettingsSection
                title="Notifications"
                items={[
                  { label: 'Push Notifications', onPress: () => {} },
                  { label: 'Email Notifications', onPress: () => {} },
                ]}
              />
              <SettingsSection
                title="Legal"
                items={[
                  { label: 'Terms of Service', onPress: () => {} },
                  { label: 'Privacy Policy', onPress: () => {} },
                ]}
              />
              <SettingsSection
                title="Theme"
                items={[
                  {
                    label: 'Light Mode',
                    onPress: () => setColorScheme('light'),
                    selected: colorScheme === 'light',
                  },
                  {
                    label: 'Dark Mode',
                    onPress: () => setColorScheme('dark'),
                    selected: colorScheme === 'dark',
                  },
                  {
                    label: 'Device Default',
                    onPress: () => setColorScheme('auto'),
                    selected: colorScheme === 'auto',
                  },
                ]}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Followers/Following/Posts Modals - Similar structure, simplified for now */}
      <Modal
        visible={showFollowersModal || showFollowingModal || showPostsModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowFollowersModal(false);
          setShowFollowingModal(false);
          setShowPostsModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {showFollowersModal
                  ? 'Followers'
                  : showFollowingModal
                    ? 'Following'
                    : 'Posts'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowFollowersModal(false);
                  setShowFollowingModal(false);
                  setShowPostsModal(false);
                }}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <EmptyState
                title="Empty"
                message={`No ${showFollowersModal ? 'followers' : showFollowingModal ? 'following' : 'posts'} yet`}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SettingsSection({
  title,
  items,
}: {
  title: string;
  items: Array<{
    label: string;
    onPress: () => void;
    selected?: boolean;
    destructive?: boolean;
  }>;
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.settingsSection}>
      <Text style={[styles.settingsSectionTitle, { color: theme.colors.textSecondary }]}>
        {title}
      </Text>
      {items.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.settingsItem,
            {
              backgroundColor: theme.colors.surfaceVariant,
              borderBottomColor: theme.colors.border,
            },
            index === items.length - 1 && { borderBottomWidth: 0 },
          ]}
          onPress={item.onPress}
        >
          <Text
            style={[
              styles.settingsItemText,
              {
                color: item.destructive
                  ? theme.colors.error
                  : theme.colors.text,
              },
            ]}
          >
            {item.label}
          </Text>
          {item.selected && (
            <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 100,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  banner: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    fontSize: 64,
    fontWeight: '700',
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    marginTop: -50,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  socialLinks: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  socialLink: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  stats: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  activitySection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  activityIcon: {
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalBody: {
    padding: 16,
  },
  modalText: {
    fontSize: 14,
  },
  settingsSection: {
    marginBottom: 24,
  },
  settingsSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingsItemText: {
    fontSize: 16,
  },
});
