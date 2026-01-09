import React, { useState, useEffect, useRef } from 'react';
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
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@clerk/clerk-expo';
import { useTheme } from '../../context/ThemeContext';
import { useTabBar } from '../../context/TabBarContext';
import { EmptyState } from '../../components/EmptyState';
import { BlurredModalOverlay } from '../../components/BlurredModalOverlay';
import { Logo } from '../../components/Logo';
import { SocialLinksModal } from '../../components/SocialLinksModal';
import { ArchivedEntitiesModal } from '../../components/ArchivedEntitiesModal';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Skeleton } from '../../components/Skeleton';
import { XIcon } from '../../components/XIcon';
import { WebViewModal } from '../../components/WebViewModal';
import { getProfile, updateProfile } from '../../services/profileService';
import { uploadProfileImages } from '../../utils/imageUpload';

const SOCIAL_ICONS = [
  { name: 'x-icon', label: 'X.com', type: 'x' },
  { name: 'logo-linkedin', label: 'LinkedIn' },
  { name: 'logo-github', label: 'GitHub' },
  { name: 'logo-instagram', label: 'Instagram' },
  { name: 'globe-outline', label: 'Website' },
  { name: 'mail-outline', label: 'Email' },
];

export function ProfileScreen() {
  const { theme, setColorScheme, colorScheme, isDark } = useTheme();
  const { triggerRefresh } = useTabBar();
  const { getToken } = useAuth();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showArchivedEntitiesModal, setShowArchivedEntitiesModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showPostsModal, setShowPostsModal] = useState(false);
  const [activity, setActivity] = useState<any[]>([]);

  // Stats state
  const [stats, setStats] = useState({
    followers: 0,
    following: 0,
    posts: 0,
    points: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Modal data state
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Profile data state
  const [profileData, setProfileData] = useState({
    name: 'User Name',
    username: '@username',
    bio: 'Bio goes here. This is where users can describe themselves.',
    avatar: null as string | null,
    banner: null as string | null,
    socialLinks: [
      { type: 'x', url: '' },
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
  const [showFullBioModal, setShowFullBioModal] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState<string | null>(null);
  const [webViewTitle, setWebViewTitle] = useState<string>('');
  const [bioHasChanged, setBioHasChanged] = useState(false);
  const [bioSaving, setBioSaving] = useState(false);
  const [bioSaved, setBioSaved] = useState(false);

  // Edit states
  const [editingBio, setEditingBio] = useState(profileData.bio);
  const [editingName, setEditingName] = useState(profileData.name);
  const [editingUsername, setEditingUsername] = useState(profileData.username);
  const [editingSocialLinks, setEditingSocialLinks] = useState(profileData.socialLinks);

  // For sticky settings button
  const namePositionRef = useRef<View>(null);
  const [nameYPosition, setNameYPosition] = useState(200); // Default fallback position
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  // Keyboard listeners
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

  // Load modal data when modals open
  useEffect(() => {
    if (showFollowersModal) {
      loadModalData('followers');
    }
  }, [showFollowersModal]);

  useEffect(() => {
    if (showFollowingModal) {
      loadModalData('following');
    }
  }, [showFollowingModal]);

  useEffect(() => {
    if (showPostsModal) {
      loadModalData('posts');
    }
  }, [showPostsModal]);

  async function loadStats() {
    try {
      setStatsLoading(true);
      const token = await getToken();
      if (!token) return;

      // Get current user profile ID
      const profileResult = await getProfile(token);
      const currentUserProfileId = profileResult.profile?.id;

      if (!currentUserProfileId) {
        setStats({ followers: 0, following: 0, posts: 0, points: 0 });
        return;
      }

      // Load posts count
      const postService = require('../../services/postService');
      const allPosts = await postService.fetchPosts(1000, 0, token);
      const userPostsCount = allPosts.filter(
        (p: any) => p.authorId === currentUserProfileId
      ).length;

      // TODO: Replace with actual API calls when endpoints are available
      // For now, using placeholder data
      setStats({
        followers: 0, // TODO: Fetch from /profiles/me/followers
        following: 0, // TODO: Fetch from /profiles/me/following
        posts: userPostsCount,
        points: 0, // TODO: Calculate from user activity
      });
    } catch (error) {
      console.error('[ProfileScreen] Error loading stats:', error);
      setStats({ followers: 0, following: 0, posts: 0, points: 0 });
    } finally {
      setStatsLoading(false);
    }
  }

  async function loadModalData(modalType: 'followers' | 'following' | 'posts') {
    try {
      setModalLoading(true);
      const token = await getToken();
      if (!token) return;

      const profileResult = await getProfile(token);
      const currentUserProfileId = profileResult.profile?.id;
      if (!currentUserProfileId) return;

      if (modalType === 'posts') {
        const postService = require('../../services/postService');
        const allPosts = await postService.fetchPosts(100, 0, token);
        const userPosts = allPosts.filter((p: any) => p.authorId === currentUserProfileId);
        setUserPosts(userPosts);
      } else {
        // TODO: Fetch followers/following when endpoints are available
        if (modalType === 'followers') {
          setFollowersList([]);
        } else {
          setFollowingList([]);
        }
      }
    } catch (error) {
      console.error(`[ProfileScreen] Error loading ${modalType}:`, error);
    } finally {
      setModalLoading(false);
    }
  }

  async function loadProfile() {
    try {
      setLoading(true);
      const token = await getToken();
      const result = await getProfile(token || undefined);
      if (result.success && result.profile) {
        const loadedSocialLinks = result.profile.socialLinks || [];
        // Preserve bio value (including empty string, null, or undefined)
        const bioValue =
          result.profile.bio !== undefined && result.profile.bio !== null ? result.profile.bio : '';
        setProfileData({
          name: result.profile.full_name || 'User Name',
          username: result.profile.username || '@username',
          bio: bioValue,
          avatar: result.profile.avatar_url || null,
          banner: result.profile.banner_url || null,
          socialLinks: loadedSocialLinks,
        });
        setEditingName(result.profile.full_name || 'User Name');
        setEditingUsername(result.profile.username || '@username');
        setEditingBio(bioValue);
        setEditingSocialLinks(loadedSocialLinks);
        setBioHasChanged(false);
        setBioSaved(false);

        // Load stats after profile is loaded
        await loadStats();
      }
    } catch (error) {
      console.error('[ProfileScreen] Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    triggerRefresh();
    await loadProfile();
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
      try {
        const token = await getToken();
        // Upload image to Supabase
        const imageUrl = await uploadProfileImages(
          type === 'avatar' ? result.assets[0].uri : undefined,
          type === 'banner' ? result.assets[0].uri : undefined,
          token || undefined
        );

        // Update local state - preserve all existing data including bio and socialLinks
        if (type === 'avatar') {
          const newAvatar = imageUrl.avatar_url || result.assets[0].uri;
          setProfileData({
            ...profileData,
            avatar: newAvatar,
            // Explicitly preserve bio
            bio: profileData.bio || editingBio || '',
          });
          setShowAvatarModal(false);
          // Save to backend - only update avatar_url, preserve other fields
          await saveProfileUpdate({ avatar_url: newAvatar });
        } else {
          const newBanner = imageUrl.banner_url || result.assets[0].uri;
          setProfileData({
            ...profileData,
            banner: newBanner,
            // Explicitly preserve bio
            bio: profileData.bio || editingBio || '',
          });
          setShowBannerModal(false);
          // Save to backend - only update banner_url, preserve other fields
          await saveProfileUpdate({ banner_url: newBanner });
        }
      } catch (error: any) {
        console.error('[ProfileScreen] Error uploading image:', error);
        Alert.alert('Error', 'Failed to upload image. Please try again.');
      }
    }
  }

  async function removeImage(type: 'avatar' | 'banner') {
    try {
      const token = await getToken();
      if (type === 'avatar') {
        setProfileData({
          ...profileData,
          avatar: null,
          // Explicitly preserve bio
          bio: profileData.bio || editingBio || '',
        });
        await saveProfileUpdate({ avatar_url: null });
        setShowAvatarModal(false);
      } else {
        setProfileData({
          ...profileData,
          banner: null,
          // Explicitly preserve bio
          bio: profileData.bio || editingBio || '',
        });
        await saveProfileUpdate({ banner_url: null });
        setShowBannerModal(false);
      }
    } catch (error: any) {
      console.error('[ProfileScreen] Error removing image:', error);
      Alert.alert('Error', 'Failed to remove image. Please try again.');
    }
  }

  async function saveProfileUpdate(updateData: any) {
    try {
      const token = await getToken();
      const result = await updateProfile(updateData, token || undefined);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('[ProfileScreen] Error saving profile:', error);
      throw error;
    }
  }

  async function saveBio() {
    if (editingBio.length > 750) {
      Alert.alert('Error', 'Bio must be 750 characters or less.');
      return;
    }
    setBioSaving(true);
    setBioSaved(false);
    try {
      await saveProfileUpdate({ bio: editingBio });
      setProfileData({ ...profileData, bio: editingBio });
      setBioHasChanged(false);
      setBioSaved(true);
      // Hide checkmark after 2 seconds
      setTimeout(() => {
        setBioSaved(false);
        setShowBioModal(false);
      }, 2000);
    } catch (error: any) {
      setBioSaving(false);
      Alert.alert('Error', 'Failed to save bio. Please try again.');
    }
  }

  async function saveName() {
    try {
      await saveProfileUpdate({ full_name: editingName });
      setProfileData({ ...profileData, name: editingName });
      setShowNameModal(false);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to save name. Please try again.');
    }
  }

  async function saveUsername() {
    let username = editingUsername;
    if (!username.startsWith('@')) {
      username = '@' + username.replace(/^@+/, '');
      setEditingUsername(username);
    }
    try {
      await saveProfileUpdate({ username });
      setProfileData({ ...profileData, username });
      setShowUsernameModal(false);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to save username. Please try again.');
    }
  }

  async function handleSaveSocialLinks(socialLinks: Array<{ type: string; url: string }>) {
    try {
      // Filter out social links with empty URLs and normalize URLs
      const validSocialLinks = socialLinks
        .filter(link => link.url && link.url.trim().length > 0)
        .map(link => {
          let url = link.url.trim();

          // Automatically add https:// if missing
          if (url && !/^https?:\/\//i.test(url)) {
            url = `https://${url}`;
          }

          return {
            ...link,
            url,
          };
        });

      await saveProfileUpdate({ socialLinks: validSocialLinks });
      setProfileData({ ...profileData, socialLinks: validSocialLinks });
      setEditingSocialLinks(validSocialLinks);
      setShowSocialLinksModal(false);
    } catch (error: any) {
      console.error('[ProfileScreen] Error saving social links:', error);
      Alert.alert('Error', 'Failed to save social links. Please try again.');
    }
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
          <Text style={[styles.activityText, { color: theme.colors.text }]}>{item.text}</Text>
          <Text style={[styles.activityDate, { color: theme.colors.textTertiary }]}>
            {item.date}
          </Text>
        </View>
      </View>
    );
  }

  function getSocialIcon(type: string) {
    if (type === 'x') return 'x-icon';
    const icon = SOCIAL_ICONS.find(i => i.name.includes(type.toLowerCase()));
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
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top * 1.5, paddingBottom: 100 },
        ]}
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
        <TouchableOpacity activeOpacity={0.8} onPress={() => setShowBannerModal(true)}>
          <View
            style={[
              styles.banner,
              {
                backgroundColor: profileData.banner
                  ? theme.colors.background
                  : theme.colors.primary,
              },
            ]}
          >
            {profileData.banner ? (
              <Image source={{ uri: profileData.banner }} style={styles.bannerImage} />
            ) : (
              <View style={styles.bannerPlaceholder}>
                <Ionicons name="image-outline" size={32} color={theme.colors.background} />
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <TouchableOpacity activeOpacity={0.8} onPress={() => setShowAvatarModal(true)}>
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
            <View
              ref={namePositionRef}
              style={styles.editableField}
              onLayout={() => {
                namePositionRef.current?.measureInWindow((x, y, width, height) => {
                  // y is the position on screen, use it directly
                  setNameYPosition(y);
                });
              }}
            >
              <Text style={[styles.name, { color: theme.colors.text }]}>{profileData.name}</Text>
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
              // Use editingBio if available, otherwise use profileData.bio
              const currentBio = editingBio || profileData.bio || '';
              setEditingBio(currentBio);
              setBioHasChanged(false);
              setBioSaved(false);
              setBioSaving(false);
              setShowBioModal(true);
            }}
          >
            <View style={styles.editableField}>
              {profileData.bio || editingBio ? (
                <>
                  <Text
                    style={[styles.bio, { color: theme.colors.textSecondary }]}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {profileData.bio || editingBio}
                  </Text>
                  {(profileData.bio || editingBio || '').length > 80 && (
                    <TouchableOpacity
                      onPress={e => {
                        e.stopPropagation();
                        setShowFullBioModal(true);
                      }}
                      style={styles.readMoreButton}
                    >
                      <Text style={[styles.readMoreText, { color: theme.colors.primary }]}>
                        Read more
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <Text style={[styles.bio, { color: theme.colors.textTertiary }]}>Add a bio...</Text>
              )}
            </View>
          </TouchableOpacity>

          {/* Social Links */}
          <View style={styles.socialLinks}>
            {profileData.socialLinks.map((link, index) =>
              link.url ? (
                <TouchableOpacity
                  key={index}
                  style={styles.socialLink}
                  onPress={() => {
                    const normalizedUrl = link.url.startsWith('http')
                      ? link.url
                      : `https://${link.url}`;
                    const socialName =
                      SOCIAL_ICONS.find(s => s.type === link.type)?.label || 'Link';
                    setWebViewTitle(socialName);
                    setWebViewUrl(normalizedUrl);
                  }}
                >
                  {link.type === 'x' ? (
                    <XIcon size={20} />
                  ) : (
                    <Ionicons
                      name={getSocialIcon(link.type) as any}
                      size={20}
                      color={theme.colors.text}
                    />
                  )}
                </TouchableOpacity>
              ) : null
            )}
            <TouchableOpacity
              style={styles.socialLink}
              onPress={() => {
                setEditingSocialLinks([...profileData.socialLinks]);
                setShowSocialLinksModal(true);
              }}
            >
              <Ionicons name="add" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.stats}>
            <TouchableOpacity
              style={[
                styles.statItem,
                { backgroundColor: 'transparent', borderColor: theme.colors.border },
              ]}
              onPress={() => setShowFollowersModal(true)}
            >
              <Text style={[styles.statNumber, { color: theme.colors.text }]}>
                {statsLoading ? '...' : stats.followers}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Followers
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.statItem,
                { backgroundColor: 'transparent', borderColor: theme.colors.border },
              ]}
              onPress={() => setShowFollowingModal(true)}
            >
              <Text style={[styles.statNumber, { color: theme.colors.text }]}>
                {statsLoading ? '...' : stats.following}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Following
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.statItem,
                { backgroundColor: 'transparent', borderColor: theme.colors.border },
              ]}
              onPress={() => setShowPostsModal(true)}
            >
              <Text style={[styles.statNumber, { color: theme.colors.text }]}>
                {statsLoading ? '...' : stats.posts}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Posts</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.statItem,
                { backgroundColor: 'transparent', borderColor: theme.colors.border },
              ]}
              onPress={() => setShowPointsModal(true)}
            >
              <Text style={[styles.statNumber, { color: theme.colors.text }]}>
                {statsLoading ? '...' : stats.points}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Points</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Activity Feed */}
        <View style={styles.activitySection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Activity</Text>
          {activity.length === 0 ? (
            <EmptyState title="No activity yet" message="Your activity will appear here" />
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

      {/* Sticky Settings Button */}
      <View
        style={[
          styles.stickySettingsButton,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            top: nameYPosition,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.stickySettingsButtonInner}
          onPress={() => setShowSettingsModal(true)}
        >
          <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Avatar Modal */}
      <Modal
        visible={showAvatarModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAvatarModal(false)}
      >
        <BlurredModalOverlay visible={showAvatarModal} onClose={() => setShowAvatarModal(false)}>
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
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
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
                    style={[styles.modalButton, { backgroundColor: theme.colors.secondary }]}
                    onPress={() => pickImage('avatar')}
                  >
                    <Ionicons name="create-outline" size={20} color={theme.colors.text} />
                    <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: theme.colors.error }]}
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
        <BlurredModalOverlay visible={showBannerModal} onClose={() => setShowBannerModal(false)}>
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
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
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
                    style={[styles.modalButton, { backgroundColor: theme.colors.secondary }]}
                    onPress={() => pickImage('banner')}
                  >
                    <Ionicons name="create-outline" size={20} color={theme.colors.text} />
                    <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: theme.colors.error }]}
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
        <BlurredModalOverlay visible={showBioModal} onClose={() => setShowBioModal(false)}>
          <View
            style={[
              styles.bioModalContent,
              {
                backgroundColor: theme.colors.surface,
                paddingBottom: keyboardVisible ? keyboardHeight : insets.bottom + 40,
                maxHeight: '85%',
                minHeight: 300,
              },
            ]}
          >
            {/* Header */}
            <View style={[styles.bioModalHeader, { borderBottomColor: theme.colors.border }]}>
              <View style={styles.bioModalCloseButton} />
              <Text style={[styles.bioModalTitle, { color: theme.colors.text }]}>Edit Bio</Text>
              <View style={styles.bioModalRight}>
                {bioHasChanged && !bioSaving && !bioSaved && (
                  <TouchableOpacity onPress={saveBio} style={styles.bioModalSaveButton}>
                    <Text style={[styles.bioModalSaveButtonText, { color: theme.colors.primary }]}>
                      Save
                    </Text>
                  </TouchableOpacity>
                )}
                {bioSaving && (
                  <View style={styles.bioModalStatusIcon}>
                    <LoadingSpinner size="small" />
                  </View>
                )}
                {bioSaved && (
                  <View style={styles.bioModalStatusIcon}>
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                  </View>
                )}
                {!bioHasChanged && !bioSaving && !bioSaved && (
                  <Text style={[styles.charCount, { color: theme.colors.textTertiary }]}>
                    {editingBio.length}/750
                  </Text>
                )}
              </View>
            </View>

            <ScrollView
              style={styles.bioModalScrollView}
              contentContainerStyle={[styles.bioModalScrollContent, { paddingBottom: 20 }]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <TextInput
                style={[styles.bioModalTextInput, { color: theme.colors.text }]}
                placeholder="Write your bio..."
                placeholderTextColor={theme.colors.textTertiary}
                value={editingBio}
                onChangeText={text => {
                  setEditingBio(text);
                  setBioHasChanged(text !== (profileData.bio || ''));
                  setBioSaved(false);
                }}
                multiline
                maxLength={750}
                autoFocus
                textAlignVertical="top"
              />
            </ScrollView>
          </View>
        </BlurredModalOverlay>
      </Modal>

      {/* Name Modal - Sticky Input Bar */}
      {showNameModal && (
        <>
          <TouchableOpacity
            style={styles.inputOverlay}
            activeOpacity={1}
            onPress={() => {
              setShowNameModal(false);
              Keyboard.dismiss();
            }}
          />
          <View
            style={[
              styles.stickyInputBar,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                bottom: keyboardVisible ? keyboardHeight : insets.bottom,
              },
            ]}
          >
            <Text style={[styles.stickyInputLabel, { color: theme.colors.text }]}>Name</Text>
            <TextInput
              style={[styles.stickyInput, { color: theme.colors.text }]}
              placeholder="Enter your name"
              placeholderTextColor={theme.colors.textTertiary}
              value={editingName}
              onChangeText={setEditingName}
              autoFocus
              onBlur={() => {
                setShowNameModal(false);
                saveName();
              }}
            />
            {editingName.length > 0 && (
              <TouchableOpacity onPress={() => setEditingName('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color={theme.colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </>
      )}

      {/* Username Modal - Sticky Input Bar */}
      {showUsernameModal && (
        <>
          <TouchableOpacity
            style={styles.inputOverlay}
            activeOpacity={1}
            onPress={() => {
              setShowUsernameModal(false);
              Keyboard.dismiss();
            }}
          />
          <View
            style={[
              styles.stickyInputBar,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                bottom: keyboardVisible ? keyboardHeight : insets.bottom,
              },
            ]}
          >
            <Text style={[styles.stickyInputLabel, { color: theme.colors.text }]}>Username</Text>
            <TextInput
              style={[styles.stickyInput, { color: theme.colors.text }]}
              placeholder="@username"
              placeholderTextColor={theme.colors.textTertiary}
              value={editingUsername}
              onChangeText={setEditingUsername}
              autoFocus
              onBlur={() => {
                setShowUsernameModal(false);
                saveUsername();
              }}
            />
            {editingUsername.length > 0 && (
              <TouchableOpacity onPress={() => setEditingUsername('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color={theme.colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </>
      )}

      {/* Social Links Modal */}
      <SocialLinksModal
        visible={showSocialLinksModal}
        onClose={() => setShowSocialLinksModal(false)}
        socialLinks={editingSocialLinks}
        onSave={handleSaveSocialLinks}
      />

      {/* Full Bio Modal */}
      <Modal
        visible={showFullBioModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFullBioModal(false)}
      >
        <BlurredModalOverlay visible={showFullBioModal} onClose={() => setShowFullBioModal(false)}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.surface,
                minHeight: 200 + insets.bottom * 2,
                maxHeight: 500 + insets.bottom * 2,
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
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Bio</Text>
              <TouchableOpacity onPress={() => setShowFullBioModal(false)}>
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
              <Text style={[styles.modalText, { color: theme.colors.text }]}>
                {profileData.bio || editingBio || 'No bio'}
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
        <BlurredModalOverlay visible={showPointsModal} onClose={() => setShowPointsModal(false)}>
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
              <View style={styles.emptyStateContainer}>
                <Ionicons
                  name="trophy-outline"
                  size={64}
                  color={theme.colors.textTertiary}
                  style={{ marginBottom: 16 }}
                />
                <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>
                  Points tracker coming soon
                </Text>
                <Text style={[styles.emptyStateMessage, { color: theme.colors.textSecondary }]}>
                  Earn points by engaging with the community, creating content, and building your
                  network. Your points will appear here once the feature launches.
                </Text>
                <TouchableOpacity
                  style={[styles.emptyStateCTA, { backgroundColor: theme.colors.primary }]}
                  onPress={() => {
                    setShowPointsModal(false);
                  }}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color={theme.colors.background}
                  />
                  <Text style={[styles.emptyStateCTAText, { color: theme.colors.background }]}>
                    Got it
                  </Text>
                </TouchableOpacity>
              </View>
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
                  {
                    label: 'Archived',
                    onPress: () => {
                      setShowSettingsModal(false);
                      setShowArchivedEntitiesModal(true);
                    },
                  },
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
                {showFollowersModal ? 'Followers' : showFollowingModal ? 'Following' : 'Posts'}
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
              {modalLoading ? (
                <View style={styles.modalSkeletonContainer}>
                  {showPostsModal ? (
                    // Post skeletons
                    <>
                      {[1, 2, 3].map(i => (
                        <View
                          key={i}
                          style={[
                            styles.skeletonPostCard,
                            {
                              backgroundColor: theme.colors.surface,
                              borderColor: theme.colors.border,
                            },
                          ]}
                        >
                          <View style={styles.skeletonPostHeader}>
                            <Skeleton width={40} height={40} borderRadius={20} />
                            <View style={styles.skeletonPostHeaderText}>
                              <Skeleton width={120} height={16} style={{ marginBottom: 8 }} />
                              <Skeleton width={80} height={12} />
                            </View>
                          </View>
                          <Skeleton
                            width="100%"
                            height={200}
                            borderRadius={8}
                            style={{ marginTop: 12 }}
                          />
                          <Skeleton width="90%" height={16} style={{ marginTop: 12 }} />
                          <Skeleton width="70%" height={16} style={{ marginTop: 8 }} />
                        </View>
                      ))}
                    </>
                  ) : (
                    // User card skeletons
                    <>
                      {[1, 2, 3, 4, 5].map(i => (
                        <View
                          key={i}
                          style={[
                            styles.skeletonUserCard,
                            {
                              backgroundColor: theme.colors.surface,
                              borderColor: theme.colors.border,
                            },
                          ]}
                        >
                          <Skeleton width={60} height={60} borderRadius={30} />
                          <View style={styles.skeletonUserInfo}>
                            <Skeleton width={150} height={18} style={{ marginBottom: 8 }} />
                            <Skeleton width={100} height={14} />
                          </View>
                        </View>
                      ))}
                    </>
                  )}
                </View>
              ) : (
                <>
                  {showPostsModal && userPosts.length === 0 && (
                    <View style={styles.emptyStateContainer}>
                      <Ionicons
                        name="document-text-outline"
                        size={64}
                        color={theme.colors.textTertiary}
                        style={{ marginBottom: 16 }}
                      />
                      <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>
                        No posts yet
                      </Text>
                      <Text
                        style={[styles.emptyStateMessage, { color: theme.colors.textSecondary }]}
                      >
                        Share your thoughts, updates, and insights with the community. Your first
                        post is just a tap away!
                      </Text>
                      <TouchableOpacity
                        style={[styles.emptyStateCTA, { backgroundColor: theme.colors.primary }]}
                        onPress={() => {
                          setShowPostsModal(false);
                          // Navigate to post creation - you may need to adjust this based on your navigation setup
                        }}
                      >
                        <Ionicons
                          name="add-circle-outline"
                          size={20}
                          color={theme.colors.background}
                        />
                        <Text
                          style={[styles.emptyStateCTAText, { color: theme.colors.background }]}
                        >
                          Create Your First Post
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {showFollowersModal && followersList.length === 0 && (
                    <View style={styles.emptyStateContainer}>
                      <Ionicons
                        name="people-outline"
                        size={64}
                        color={theme.colors.textTertiary}
                        style={{ marginBottom: 16 }}
                      />
                      <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>
                        No followers yet
                      </Text>
                      <Text
                        style={[styles.emptyStateMessage, { color: theme.colors.textSecondary }]}
                      >
                        Build your network by sharing great content and engaging with others.
                        Followers will appear here as your community grows.
                      </Text>
                      <TouchableOpacity
                        style={[styles.emptyStateCTA, { backgroundColor: theme.colors.primary }]}
                        onPress={() => {
                          setShowFollowersModal(false);
                          // Navigate to explore or feed
                        }}
                      >
                        <Ionicons
                          name="compass-outline"
                          size={20}
                          color={theme.colors.background}
                        />
                        <Text
                          style={[styles.emptyStateCTAText, { color: theme.colors.background }]}
                        >
                          Explore Community
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {showFollowingModal && followingList.length === 0 && (
                    <View style={styles.emptyStateContainer}>
                      <Ionicons
                        name="person-add-outline"
                        size={64}
                        color={theme.colors.textTertiary}
                        style={{ marginBottom: 16 }}
                      />
                      <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>
                        Not following anyone yet
                      </Text>
                      <Text
                        style={[styles.emptyStateMessage, { color: theme.colors.textSecondary }]}
                      >
                        Discover interesting people and organizations to follow. Stay updated with
                        their latest posts and updates.
                      </Text>
                      <TouchableOpacity
                        style={[styles.emptyStateCTA, { backgroundColor: theme.colors.primary }]}
                        onPress={() => {
                          setShowFollowingModal(false);
                          // Navigate to explore or people screen
                        }}
                      >
                        <Ionicons name="search-outline" size={20} color={theme.colors.background} />
                        <Text
                          style={[styles.emptyStateCTAText, { color: theme.colors.background }]}
                        >
                          Discover People
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </BlurredModalOverlay>
      </Modal>

      {/* Archived Entities Modal */}
      <ArchivedEntitiesModal
        visible={showArchivedEntitiesModal}
        onClose={() => setShowArchivedEntitiesModal(false)}
        onUnarchive={() => {
          // Refresh could be handled here if needed
        }}
      />

      {/* WebView Modal */}
      <WebViewModal
        visible={!!webViewUrl}
        url={webViewUrl || ''}
        title={webViewTitle}
        onClose={() => {
          setWebViewUrl(null);
          setWebViewTitle('');
        }}
      />
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
                color: item.destructive ? theme.colors.error : theme.colors.text,
              },
            ]}
          >
            {item.label}
          </Text>
          {item.selected && <Ionicons name="checkmark" size={20} color={theme.colors.primary} />}
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
  bannerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
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
    marginBottom: 8,
    lineHeight: 20,
    width: '100%',
    paddingHorizontal: 36,
  },
  readMoreButton: {
    marginTop: 4,
    alignItems: 'center',
    padding: 0,
    backgroundColor: 'transparent',
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: '500',
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
  statsSection: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    flexShrink: 0,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'transparent',
    marginHorizontal: 2,
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
    justifyContent: 'center',
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
  stickySettingsButton: {
    position: 'absolute',
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  stickySettingsButtonInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
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
  inputOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 998,
  },
  stickyInputBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  stickyInputBarMultiline: {
    paddingBottom: 0, // Will be set dynamically via style prop
  },
  stickyInputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bioHeaderLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  bioHeaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bioHeaderRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  saveBioButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  saveBioButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bioStatusIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stickyInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
    minHeight: 20,
  },
  stickyInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
    maxHeight: 200, // Allow scrolling if content is long
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  // Bio Modal Styles (matching PostCreationModal pattern)
  bioModalContent: {
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    alignSelf: 'flex-end',
    flexDirection: 'column',
  },
  bioModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexShrink: 0,
  },
  bioModalCloseButton: {
    padding: 4,
  },
  bioModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  bioModalRight: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  bioModalSaveButton: {
    padding: 8,
  },
  bioModalSaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  bioModalStatusIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bioModalScrollView: {
    flex: 1,
    flexShrink: 1,
  },
  bioModalScrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  bioModalTextInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 200,
    textAlignVertical: 'top',
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
  // Modal skeleton styles
  modalSkeletonContainer: {
    padding: 16,
    gap: 16,
  },
  skeletonUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  skeletonUserInfo: {
    flex: 1,
  },
  skeletonPostCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  skeletonPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skeletonPostHeaderText: {
    flex: 1,
  },
  // Empty state styles
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    minHeight: 300,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 280,
  },
  emptyStateCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  emptyStateCTAText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
