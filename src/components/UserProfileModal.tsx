import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Platform,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { BlurredModalOverlay } from './BlurredModalOverlay';
import { LinearGradient } from 'expo-linear-gradient';
import { getProfileById } from '../services/profileService';
import { useAuth } from '@clerk/clerk-expo';
import { EmptyState } from './EmptyState';
import { XIcon } from './XIcon';
import { WebViewModal } from './WebViewModal';

const SOCIAL_ICONS: { [key: string]: keyof typeof Ionicons.glyphMap } = {
  x: 'close-circle-outline', // Not used, XIcon component handles this
  linkedin: 'logo-linkedin',
  github: 'logo-github',
  instagram: 'logo-instagram',
  website: 'globe-outline',
  email: 'mail-outline',
};

function getSocialIcon(type: string): keyof typeof Ionicons.glyphMap {
  return SOCIAL_ICONS[type.toLowerCase()] || 'globe-outline';
}

interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
  userId?: string;
}

export function UserProfileModal({ visible, onClose, userId }: UserProfileModalProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFullBioModal, setShowFullBioModal] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState<string | null>(null);
  const [webViewTitle, setWebViewTitle] = useState<string>('');

  useEffect(() => {
    if (visible && userId) {
      loadProfile();
    } else {
      setProfile(null);
      setError(userId ? null : 'No profile ID provided');
      setLoading(false);
    }
  }, [visible, userId]);

  // If no userId provided, show empty state
  // This allows the modal to be opened even when profile doesn't exist yet

  async function loadProfile() {
    if (!userId) {
      setError('No profile ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      const result = await getProfileById(userId, token || undefined);

      if (result.success && result.profile) {
        setProfile(result.profile);
      } else {
        setError(result.error || 'Failed to load profile');
      }
    } catch (err: any) {
      console.error('[UserProfileModal] Error loading profile:', err);
      setError(err?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  if (!visible) {
    return null;
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
          {/* Header */}
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
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Profile</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom * 2 }]}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                  Loading profile...
                </Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <EmptyState title="Error" message={error} />
              </View>
            ) : !profile ? (
              <View style={styles.emptyContainer}>
                <EmptyState
                  title="Profile not found"
                  message="This user profile could not be loaded."
                />
              </View>
            ) : (
              <>
                {/* Banner */}
                <TouchableOpacity activeOpacity={0.8}>
                  <View
                    style={[
                      styles.banner,
                      {
                        backgroundColor: profile.banner_url ? 'transparent' : theme.colors.primary,
                      },
                    ]}
                  >
                    {profile.banner_url ? (
                      <Image source={{ uri: profile.banner_url }} style={styles.bannerImage} />
                    ) : (
                      <View style={styles.bannerPlaceholder}>
                        <Ionicons name="image-outline" size={32} color={theme.colors.background} />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Profile Info */}
                <View style={styles.profileSection}>
                  <TouchableOpacity activeOpacity={0.8}>
                    <View
                      style={[
                        styles.avatar,
                        {
                          backgroundColor: profile.avatar_url
                            ? 'transparent'
                            : theme.colors.primary,
                          borderColor: theme.colors.background,
                        },
                      ]}
                    >
                      {profile.avatar_url ? (
                        <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
                      ) : (
                        <Text style={[styles.avatarText, { color: theme.colors.background }]}>
                          {profile.full_name?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>

                  <Text style={[styles.name, { color: theme.colors.text }]}>
                    {profile.full_name || 'User'}
                  </Text>

                  {profile.username && (
                    <Text style={[styles.handle, { color: theme.colors.textSecondary }]}>
                      {profile.username}
                    </Text>
                  )}

                  {profile.bio && (
                    <>
                      <Text
                        style={[styles.bio, { color: theme.colors.text }]}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {profile.bio}
                      </Text>
                      {profile.bio.length > 100 && (
                        <TouchableOpacity
                          onPress={() => {
                            // Open full bio modal - for now just show full bio
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
                  )}

                  {/* Social Links */}
                  {profile.socialLinks && profile.socialLinks.length > 0 && (
                    <View style={styles.socialLinks}>
                      {profile.socialLinks.map((link: any, index: number) => {
                        const iconName = getSocialIcon(link.type);
                        return (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.socialLink,
                              {
                                backgroundColor: theme.colors.surfaceVariant,
                                borderColor: theme.colors.border,
                              },
                            ]}
                            onPress={() => {
                              if (link.url) {
                                const normalizedUrl = link.url.startsWith('http')
                                  ? link.url
                                  : `https://${link.url}`;
                                const socialName = SOCIAL_ICONS[link.type]
                                  ? link.type === 'x'
                                    ? 'X.com'
                                    : link.type === 'linkedin'
                                      ? 'LinkedIn'
                                      : link.type === 'github'
                                        ? 'GitHub'
                                        : link.type === 'instagram'
                                          ? 'Instagram'
                                          : link.type === 'website'
                                            ? 'Website'
                                            : link.type === 'email'
                                              ? 'Email'
                                              : 'Link'
                                  : 'Link';
                                setWebViewTitle(socialName);
                                setWebViewUrl(normalizedUrl);
                              }
                            }}
                          >
                            {link.type === 'x' ? (
                              <XIcon size={20} />
                            ) : (
                              <Ionicons name={iconName} size={20} color={theme.colors.text} />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {/* Stats */}
                  <View style={styles.statsContainer}>
                    <TouchableOpacity
                      style={[
                        styles.statItem,
                        { backgroundColor: 'transparent', borderColor: theme.colors.border },
                      ]}
                    >
                      <Text style={[styles.statValue, { color: theme.colors.text }]}>
                        {profile.posts_count || 0}
                      </Text>
                      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                        Posts
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.statItem,
                        { backgroundColor: 'transparent', borderColor: theme.colors.border },
                      ]}
                    >
                      <Text style={[styles.statValue, { color: theme.colors.text }]}>
                        {profile.followers_count || 0}
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
                    >
                      <Text style={[styles.statValue, { color: theme.colors.text }]}>
                        {profile.following_count || 0}
                      </Text>
                      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                        Following
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </BlurredModalOverlay>

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
              style={styles.scrollView}
              contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom * 2 }]}
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.modalTitle, { color: theme.colors.text, marginBottom: 16 }]}>
                {profile?.bio || 'No bio'}
              </Text>
            </ScrollView>
          </View>
        </BlurredModalOverlay>
      </Modal>

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    paddingVertical: 60,
  },
  emptyContainer: {
    flex: 1,
    paddingVertical: 60,
  },
  banner: {
    width: '100%',
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
    overflow: 'hidden',
    borderWidth: 4,
    marginBottom: 12,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 46,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  handle: {
    fontSize: 16,
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
    maxWidth: '90%',
  },
  readMoreButton: {
    marginTop: 4,
    alignItems: 'center',
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
    borderWidth: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 24,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
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
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
