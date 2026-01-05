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

interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

export function UserProfileModal({ visible, onClose, userId }: UserProfileModalProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && userId) {
      loadProfile();
    } else {
      setProfile(null);
      setError(null);
      setLoading(true);
    }
  }, [visible, userId]);

  async function loadProfile() {
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <BlurredModalOverlay visible={visible} onClose={onClose}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: theme.colors.background,
              paddingTop: insets.top + 20,
              paddingBottom: insets.bottom + 20,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>PROFILE</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
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
                <EmptyState title="Profile not found" message="This user profile could not be loaded." />
              </View>
            ) : (
              <>
                {/* Banner */}
                <View
                  style={[
                    styles.banner,
                    {
                      backgroundColor: profile.banner_url
                        ? 'transparent'
                        : theme.colors.primary,
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

                {/* Profile Info */}
                <View style={styles.profileSection}>
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

                  <Text style={[styles.name, { color: theme.colors.text }]}>
                    {profile.full_name || 'User'}
                  </Text>

                  {profile.username && (
                    <Text style={[styles.handle, { color: theme.colors.textSecondary }]}>
                      {profile.username}
                    </Text>
                  )}

                  {profile.bio && (
                    <Text style={[styles.bio, { color: theme.colors.text }]}>{profile.bio}</Text>
                  )}

                  {/* Stats */}
                  <View style={styles.statsContainer}>
                    <TouchableOpacity style={styles.statItem}>
                      <Text style={[styles.statValue, { color: theme.colors.text }]}>
                        {profile.posts_count || 0}
                      </Text>
                      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                        Posts
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.statItem}>
                      <Text style={[styles.statValue, { color: theme.colors.text }]}>
                        {profile.followers_count || 0}
                      </Text>
                      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                        Followers
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.statItem}>
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
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  closeButton: {
    padding: 4,
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
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -50,
    marginBottom: 16,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 46,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '600',
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  handle: {
    fontSize: 16,
    marginBottom: 12,
  },
  bio: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  statItem: {
    alignItems: 'center',
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

