import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Modal,
  FlatList,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useTabBar } from '../../context/TabBarContext';
import { EmptyState } from '../../components/EmptyState';
import { Button } from '../../components/Button';
import { BlurredModalOverlay } from '../../components/BlurredModalOverlay';
import { Logo } from '../../components/Logo';

const SOCIAL_ICONS = [
  { name: 'logo-twitter', label: 'Twitter' },
  { name: 'logo-linkedin', label: 'LinkedIn' },
  { name: 'logo-github', label: 'GitHub' },
  { name: 'logo-instagram', label: 'Instagram' },
  { name: 'globe-outline', label: 'Website' },
  { name: 'mail-outline', label: 'Email' },
];

export function ProfileScreen() {
  const { theme, setColorScheme, colorScheme, isDark } = useTheme();
  const { triggerRefresh } = useTabBar();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showPostsModal, setShowPostsModal] = useState(false);
  const [activity, setActivity] = useState<any[]>([]);

  // Profile data state
  const [profileData, setProfileData] = useState({
    name: 'User Name',
    username: '@username',
    bio: 'Bio goes here. This is where users can describe themselves.',
    avatar: null as string | null,
    banner: null as string | null,
    socialLinks: [
      { type: 'twitter', url: '' },
      { type: 'linkedin', url: '' },
      { type: 'website', url: '' },
    ],
  });

  // Modal states
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [showBioModal, setShowBioModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showSocialLinksModal, setShowSocialLinksModal] = useState(false);

  // Edit states
  const [editingBio, setEditingBio] = useState(profileData.bio);
  const [editingName, setEditingName] = useState(profileData.name);
  const [editingUsername, setEditingUsername] = useState(profileData.username);
  const [editingSocialLinks, setEditingSocialLinks] = useState(profileData.socialLinks);
  const [newSocialLink, setNewSocialLink] = useState({ type: 'website', url: '' });

  async function onRefresh() {
    setRefreshing(true);
    triggerRefresh();
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setRefreshing(false);
  }

  async function pickImage(type: 'avatar' | 'banner') {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need camera roll permissions to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'avatar' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === 'avatar') {
        setProfileData({ ...profileData, avatar: result.assets[0].uri });
        setShowAvatarModal(false);
      } else {
        setProfileData({ ...profileData, banner: result.assets[0].uri });
        setShowBannerModal(false);
      }
    }
  }

  function removeImage(type: 'avatar' | 'banner') {
    if (type === 'avatar') {
      setProfileData({ ...profileData, avatar: null });
    } else {
      setProfileData({ ...profileData, banner: null });
    }
    if (type === 'avatar') {
      setShowAvatarModal(false);
    } else {
      setShowBannerModal(false);
    }
  }

  function saveBio() {
    if (editingBio.length > 120) {
      Alert.alert('Error', 'Bio must be 120 characters or less.');
      return;
    }
    setProfileData({ ...profileData, bio: editingBio });
    setShowBioModal(false);
  }

  function saveName() {
    setProfileData({ ...profileData, name: editingName });
    setShowNameModal(false);
  }

  function saveUsername() {
    if (!editingUsername.startsWith('@')) {
      setEditingUsername('@' + editingUsername.replace(/^@+/, ''));
    }
    setProfileData({ ...profileData, username: editingUsername });
    setShowUsernameModal(false);
  }

  function addSocialLink() {
    if (!newSocialLink.url.trim()) {
      Alert.alert('Error', 'Please enter a URL');
      return;
    }
    setEditingSocialLinks([...editingSocialLinks, { ...newSocialLink }]);
    setNewSocialLink({ type: 'website', url: '' });
  }

  function removeSocialLink(index: number) {
    setEditingSocialLinks(editingSocialLinks.filter((_, i) => i !== index));
  }

  function saveSocialLinks() {
    setProfileData({ ...profileData, socialLinks: editingSocialLinks });
    setShowSocialLinksModal(false);
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

  function getSocialIcon(type: string) {
    const icon = SOCIAL_ICONS.find((i) => i.name.includes(type.toLowerCase()));
    return icon?.name || 'globe-outline';
  }

  // Calculate gradient colors - convert hex to rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  const gradientStart = hexToRgba(theme.colors.background, 0.5);
  const gradientEnd = hexToRgba(theme.colors.background, 0);

  return (
    <SafeAreaView
      edges={[]}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Top Gradient for Notch Area */}
      <LinearGradient
        colors={[gradientStart, gradientEnd]}
        style={[styles.topGradient, { height: insets.top }]}
        pointerEvents="none"
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top * 1.5, paddingBottom: 100 }]}
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
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowBannerModal(true)}
        >
          <View
            style={[
              styles.banner,
              { backgroundColor: theme.colors.background },
            ]}
          >
            {profileData.banner ? (
              <Image source={{ uri: profileData.banner }} style={styles.bannerImage} />
            ) : (
              <Image
                source={isDark ? require('../../../assets/light.png') : require('../../../assets/dark.png')}
                style={styles.bannerLogo}
                resizeMode="contain"
              />
            )}
          </View>
        </TouchableOpacity>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowAvatarModal(true)}
          >
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: profileData.avatar ? 'transparent' : theme.colors.primary,
                  borderColor: theme.colors.background,
                },
              ]}
            >
              {profileData.avatar ? (
                <Image source={{ uri: profileData.avatar }} style={styles.avatarImage} />
              ) : (
                <Text style={[styles.avatarText, { color: theme.colors.background }]}>
                  {profileData.name.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setEditingName(profileData.name);
              setShowNameModal(true);
            }}
          >
            <View style={styles.editableField}>
              <Text style={[styles.name, { color: theme.colors.text }]}>
                {profileData.name}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setEditingUsername(profileData.username);
              setShowUsernameModal(true);
            }}
          >
            <View style={styles.editableField}>
              <Text style={[styles.username, { color: theme.colors.textSecondary }]}>
                {profileData.username}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setEditingBio(profileData.bio);
              setShowBioModal(true);
            }}
          >
            <View style={styles.editableField}>
              <Text style={[styles.bio, { color: theme.colors.textSecondary }]}>
                {profileData.bio}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Social Links */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setEditingSocialLinks([...profileData.socialLinks]);
              setShowSocialLinksModal(true);
            }}
          >
            <View style={styles.socialLinks}>
              {profileData.socialLinks.map((link, index) => (
                link.url ? (
                  <TouchableOpacity key={index} style={styles.socialLink}>
                    <Ionicons name={getSocialIcon(link.type) as any} size={20} color={theme.colors.text} />
                  </TouchableOpacity>
                ) : null
              ))}
              <TouchableOpacity style={styles.socialLink}>
                <Ionicons name="add" size={20} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

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

      {/* Avatar Modal */}
      <Modal
        visible={showAvatarModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAvatarModal(false)}
      >
        <BlurredModalOverlay
          visible={showAvatarModal}
          onClose={() => setShowAvatarModal(false)}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.surface,
                minHeight: 200 + insets.bottom * 2,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <LinearGradient
                colors={
                  isDark
                    ? ['rgba(30, 30, 30, 1)', 'rgba(30, 30, 30, 0)']
                    : ['rgba(245, 245, 220, 1)', 'rgba(245, 245, 220, 0)']
                }
                style={styles.modalHeaderGradient}
                pointerEvents="none"
              />
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Edit Avatar</Text>
              <TouchableOpacity onPress={() => setShowAvatarModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={[
                styles.modalBodyContent,
                { paddingBottom: insets.bottom * 2 },
              ]}
              showsVerticalScrollIndicator={false}
            >
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={() => pickImage('avatar')}
              >
                <Ionicons name="image-outline" size={20} color={theme.colors.background} />
                <Text style={[styles.modalButtonText, { color: theme.colors.background }]}>
                  Upload Image
                </Text>
              </TouchableOpacity>
              {profileData.avatar && (
                <>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      { backgroundColor: theme.colors.secondary },
                    ]}
                    onPress={() => pickImage('avatar')}
                  >
                    <Ionicons name="create-outline" size={20} color={theme.colors.text} />
                    <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>
                      Edit
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      { backgroundColor: theme.colors.error },
                    ]}
                    onPress={() => removeImage('avatar')}
                  >
                    <Ionicons name="trash-outline" size={20} color={theme.colors.background} />
                    <Text style={[styles.modalButtonText, { color: theme.colors.background }]}>
                      Remove
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </BlurredModalOverlay>
      </Modal>

      {/* Banner Modal */}
      <Modal
        visible={showBannerModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBannerModal(false)}
      >
        <BlurredModalOverlay
          visible={showBannerModal}
          onClose={() => setShowBannerModal(false)}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.surface,
                minHeight: 200 + insets.bottom * 2,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <LinearGradient
                colors={
                  isDark
                    ? ['rgba(30, 30, 30, 1)', 'rgba(30, 30, 30, 0)']
                    : ['rgba(245, 245, 220, 1)', 'rgba(245, 245, 220, 0)']
                }
                style={styles.modalHeaderGradient}
                pointerEvents="none"
              />
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Edit Banner</Text>
              <TouchableOpacity onPress={() => setShowBannerModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={[
                styles.modalBodyContent,
                { paddingBottom: insets.bottom * 2 },
              ]}
              showsVerticalScrollIndicator={false}
            >
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={() => pickImage('banner')}
              >
                <Ionicons name="image-outline" size={20} color={theme.colors.background} />
                <Text style={[styles.modalButtonText, { color: theme.colors.background }]}>
                  Upload Image
                </Text>
              </TouchableOpacity>
              {profileData.banner && (
                <>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      { backgroundColor: theme.colors.secondary },
                    ]}
                    onPress={() => pickImage('banner')}
                  >
                    <Ionicons name="create-outline" size={20} color={theme.colors.text} />
                    <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>
                      Edit
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      { backgroundColor: theme.colors.error },
                    ]}
                    onPress={() => removeImage('banner')}
                  >
                    <Ionicons name="trash-outline" size={20} color={theme.colors.background} />
                    <Text style={[styles.modalButtonText, { color: theme.colors.background }]}>
                      Remove
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </BlurredModalOverlay>
      </Modal>

      {/* Bio Modal */}
      <Modal
        visible={showBioModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBioModal(false)}
      >
        <BlurredModalOverlay
          visible={showBioModal}
          onClose={() => setShowBioModal(false)}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.surface,
                minHeight: 200 + insets.bottom * 2,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <LinearGradient
                colors={
                  isDark
                    ? ['rgba(30, 30, 30, 1)', 'rgba(30, 30, 30, 0)']
                    : ['rgba(245, 245, 220, 1)', 'rgba(245, 245, 220, 0)']
                }
                style={styles.modalHeaderGradient}
                pointerEvents="none"
              />
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Edit Bio</Text>
              <TouchableOpacity onPress={() => setShowBioModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={[
                styles.modalBodyContent,
                { paddingBottom: insets.bottom * 2 },
              ]}
              showsVerticalScrollIndicator={false}
            >
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.colors.surfaceVariant,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                value={editingBio}
                onChangeText={setEditingBio}
                placeholder="Write your bio..."
                placeholderTextColor={theme.colors.textTertiary}
                multiline
                maxLength={120}
                autoFocus
              />
              <Text style={[styles.charCount, { color: theme.colors.textTertiary }]}>
                {editingBio.length}/120
              </Text>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={saveBio}
              >
                <Ionicons name="checkmark" size={20} color={theme.colors.background} />
                <Text style={[styles.saveButtonText, { color: theme.colors.background }]}>
                  Save
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </BlurredModalOverlay>
      </Modal>

      {/* Name Modal */}
      <Modal
        visible={showNameModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNameModal(false)}
      >
        <BlurredModalOverlay
          visible={showNameModal}
          onClose={() => setShowNameModal(false)}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.surface,
                minHeight: 200 + insets.bottom * 2,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <LinearGradient
                colors={
                  isDark
                    ? ['rgba(30, 30, 30, 1)', 'rgba(30, 30, 30, 0)']
                    : ['rgba(245, 245, 220, 1)', 'rgba(245, 245, 220, 0)']
                }
                style={styles.modalHeaderGradient}
                pointerEvents="none"
              />
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Edit Name</Text>
              <TouchableOpacity onPress={() => setShowNameModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={[
                styles.modalBodyContent,
                { paddingBottom: insets.bottom * 2 },
              ]}
              showsVerticalScrollIndicator={false}
            >
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.colors.surfaceVariant,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                value={editingName}
                onChangeText={setEditingName}
                placeholder="Enter your name"
                placeholderTextColor={theme.colors.textTertiary}
                autoFocus
              />
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={saveName}
              >
                <Ionicons name="checkmark" size={20} color={theme.colors.background} />
                <Text style={[styles.saveButtonText, { color: theme.colors.background }]}>
                  Save
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </BlurredModalOverlay>
      </Modal>

      {/* Username Modal */}
      <Modal
        visible={showUsernameModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowUsernameModal(false)}
      >
        <BlurredModalOverlay
          visible={showUsernameModal}
          onClose={() => setShowUsernameModal(false)}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.surface,
                minHeight: 200 + insets.bottom * 2,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <LinearGradient
                colors={
                  isDark
                    ? ['rgba(30, 30, 30, 1)', 'rgba(30, 30, 30, 0)']
                    : ['rgba(245, 245, 220, 1)', 'rgba(245, 245, 220, 0)']
                }
                style={styles.modalHeaderGradient}
                pointerEvents="none"
              />
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Edit Username</Text>
              <TouchableOpacity onPress={() => setShowUsernameModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={[
                styles.modalBodyContent,
                { paddingBottom: insets.bottom * 2 },
              ]}
              showsVerticalScrollIndicator={false}
            >
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.colors.surfaceVariant,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                value={editingUsername}
                onChangeText={setEditingUsername}
                placeholder="@username"
                placeholderTextColor={theme.colors.textTertiary}
                autoFocus
              />
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={saveUsername}
              >
                <Ionicons name="checkmark" size={20} color={theme.colors.background} />
                <Text style={[styles.saveButtonText, { color: theme.colors.background }]}>
                  Save
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </BlurredModalOverlay>
      </Modal>

      {/* Social Links Modal */}
      <Modal
        visible={showSocialLinksModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSocialLinksModal(false)}
      >
        <BlurredModalOverlay
          visible={showSocialLinksModal}
          onClose={() => setShowSocialLinksModal(false)}
        >
          <View
            style={[
              styles.modalContent,
              styles.socialLinksModalContent,
              {
                backgroundColor: theme.colors.surface,
                minHeight: 200 + insets.bottom * 2,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <LinearGradient
                colors={
                  isDark
                    ? ['rgba(30, 30, 30, 1)', 'rgba(30, 30, 30, 0)']
                    : ['rgba(245, 245, 220, 1)', 'rgba(245, 245, 220, 0)']
                }
                style={styles.modalHeaderGradient}
                pointerEvents="none"
              />
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Edit Social Links</Text>
              <TouchableOpacity onPress={() => setShowSocialLinksModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={[
                styles.modalBodyContent,
                { paddingBottom: insets.bottom * 2 },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {editingSocialLinks.map((link, index) => (
                <View
                  key={index}
                  style={[
                    styles.socialLinkItem,
                    {
                      backgroundColor: theme.colors.surfaceVariant,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={getSocialIcon(link.type) as any}
                    size={24}
                    color={theme.colors.text}
                  />
                  <TextInput
                    style={[
                      styles.socialLinkInput,
                      { color: theme.colors.text },
                    ]}
                    value={link.url}
                    onChangeText={(url) => {
                      const updated = [...editingSocialLinks];
                      updated[index].url = url;
                      setEditingSocialLinks(updated);
                    }}
                    placeholder="Enter URL"
                    placeholderTextColor={theme.colors.textTertiary}
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => removeSocialLink(index)}>
                    <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
              <View
                style={[
                  styles.addSocialLinkContainer,
                  {
                    backgroundColor: theme.colors.surfaceVariant,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.addSocialLinkButton}
                  onPress={() => {
                    const types = ['twitter', 'linkedin', 'github', 'instagram', 'website', 'email'];
                    const currentType = newSocialLink.type;
                    const currentIndex = types.indexOf(currentType);
                    const nextType = types[(currentIndex + 1) % types.length];
                    setNewSocialLink({ ...newSocialLink, type: nextType });
                  }}
                >
                  <Ionicons
                    name={getSocialIcon(newSocialLink.type) as any}
                    size={24}
                    color={theme.colors.text}
                  />
                  <Ionicons name="add" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
                <TextInput
                  style={[
                    styles.socialLinkInput,
                    { color: theme.colors.text },
                  ]}
                  value={newSocialLink.url}
                  onChangeText={(url) => setNewSocialLink({ ...newSocialLink, url })}
                  placeholder="Enter URL"
                  placeholderTextColor={theme.colors.textTertiary}
                  keyboardType="url"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={addSocialLink}
                >
                  <Ionicons name="add" size={20} color={theme.colors.background} />
                </TouchableOpacity>
              </View>
            </ScrollView>
            <View
              style={[
                styles.floatingSaveButton,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <TouchableOpacity
                style={styles.floatingSaveButtonInner}
                onPress={saveSocialLinks}
              >
                <Text style={[styles.floatingSaveButtonText, { color: theme.colors.background }]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurredModalOverlay>
      </Modal>

      {/* Wallet Modal */}
      <Modal
        visible={showWalletModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowWalletModal(false)}
      >
        <BlurredModalOverlay
          visible={showWalletModal}
          onClose={() => setShowWalletModal(false)}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.surface,
                minHeight: 200 + insets.bottom * 2,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <LinearGradient
                colors={
                  isDark
                    ? ['rgba(30, 30, 30, 1)', 'rgba(30, 30, 30, 0)']
                    : ['rgba(245, 245, 220, 1)', 'rgba(245, 245, 220, 0)']
                }
                style={styles.modalHeaderGradient}
                pointerEvents="none"
              />
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Wallet</Text>
              <TouchableOpacity onPress={() => setShowWalletModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={[
                styles.modalBodyContent,
                { paddingBottom: insets.bottom * 2 },
              ]}
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.modalText, { color: theme.colors.textSecondary }]}>
                Wallet functionality coming soon
              </Text>
            </ScrollView>
          </View>
        </BlurredModalOverlay>
      </Modal>

      {/* Points Modal */}
      <Modal
        visible={showPointsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPointsModal(false)}
      >
        <BlurredModalOverlay
          visible={showPointsModal}
          onClose={() => setShowPointsModal(false)}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.surface,
                minHeight: 200 + insets.bottom * 2,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <LinearGradient
                colors={
                  isDark
                    ? ['rgba(30, 30, 30, 1)', 'rgba(30, 30, 30, 0)']
                    : ['rgba(245, 245, 220, 1)', 'rgba(245, 245, 220, 0)']
                }
                style={styles.modalHeaderGradient}
                pointerEvents="none"
              />
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Points</Text>
              <TouchableOpacity onPress={() => setShowPointsModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={[
                styles.modalBodyContent,
                { paddingBottom: insets.bottom * 2 },
              ]}
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.modalText, { color: theme.colors.textSecondary }]}>
                Points tracker coming soon
              </Text>
            </ScrollView>
          </View>
        </BlurredModalOverlay>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <BlurredModalOverlay
          visible={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.surface,
                minHeight: 200 + insets.bottom * 2,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <LinearGradient
                colors={
                  isDark
                    ? ['rgba(30, 30, 30, 1)', 'rgba(30, 30, 30, 0)']
                    : ['rgba(245, 245, 220, 1)', 'rgba(245, 245, 220, 0)']
                }
                style={styles.modalHeaderGradient}
                pointerEvents="none"
              />
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Settings</Text>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={[
                styles.modalBodyContent,
                { paddingBottom: insets.bottom * 2 },
              ]}
              showsVerticalScrollIndicator={false}
            >
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
              <View style={styles.settingsFooter}>
                <Logo size={60} />
                <Text style={[styles.appVersion, { color: theme.colors.textTertiary }]}>
                  Version 1.0.0
                </Text>
              </View>
            </ScrollView>
          </View>
        </BlurredModalOverlay>
      </Modal>

      {/* Followers/Following/Posts Modals */}
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
        <BlurredModalOverlay
          visible={showFollowersModal || showFollowingModal || showPostsModal}
          onClose={() => {
            setShowFollowersModal(false);
            setShowFollowingModal(false);
            setShowPostsModal(false);
          }}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.surface,
                minHeight: 200 + insets.bottom * 2,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <LinearGradient
                colors={
                  isDark
                    ? ['rgba(30, 30, 30, 1)', 'rgba(30, 30, 30, 0)']
                    : ['rgba(245, 245, 220, 1)', 'rgba(245, 245, 220, 0)']
                }
                style={styles.modalHeaderGradient}
                pointerEvents="none"
              />
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
            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={[
                styles.modalBodyContent,
                { paddingBottom: insets.bottom * 2 },
              ]}
              showsVerticalScrollIndicator={false}
            >
              <EmptyState
                title="Empty"
                message={`No ${showFollowersModal ? 'followers' : showFollowingModal ? 'following' : 'posts'} yet`}
              />
            </ScrollView>
          </View>
        </BlurredModalOverlay>
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  banner: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bannerLogo: {
    width: 120,
    height: 120,
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
    position: 'relative',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
  },
  editableField: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
  },
  username: {
    fontSize: 16,
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
    maxWidth: '90%',
  },
  socialLinks: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
    alignItems: 'center',
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
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 200,
    maxHeight: 650,
    width: '100%',
    overflow: 'hidden',
  },
  socialLinksModalContent: {
    // Same as modalContent, no special height needed
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    position: 'relative',
  },
  modalHeaderGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    zIndex: -1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    zIndex: 1,
  },
  modalBody: {
    flexGrow: 1,
    flexShrink: 1,
  },
  modalBodyContent: {
    padding: 16,
  },
  modalText: {
    fontSize: 14,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  socialLinkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  socialLinkInput: {
    flex: 1,
    fontSize: 16,
  },
  addSocialLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  addSocialLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingSaveButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  floatingSaveButtonInner: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  floatingSaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
  settingsFooter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 32,
    paddingBottom: 16,
  },
  appVersion: {
    fontSize: 12,
    marginTop: 8,
  },
});
