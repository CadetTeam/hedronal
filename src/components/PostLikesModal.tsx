import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { BlurredModalOverlay } from './BlurredModalOverlay';
import { useAuth } from '@clerk/clerk-expo';
import { fetchPostLikes } from '../services/postService';

interface PostLikesModalProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
}

interface Like {
  id: string;
  user_id: string;
  profile: {
    id: string;
    full_name: string;
    username?: string;
    avatar_url?: string;
  } | null;
  created_at: string;
}

export function PostLikesModal({ visible, onClose, postId }: PostLikesModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const [likes, setLikes] = useState<Like[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && postId) {
      loadLikes();
    }
  }, [visible, postId]);

  async function loadLikes() {
    try {
      setLoading(true);
      const token = await getToken();
      const fetchedLikes = await fetchPostLikes(postId, token || undefined);
      setLikes(fetchedLikes);
    } catch (error: any) {
      console.error('[PostLikesModal] Error loading likes:', error);
      setLikes([]);
    } finally {
      setLoading(false);
    }
  }

  function renderLike({ item }: { item: Like }) {
    const profileName = item.profile?.full_name || 'Unknown User';
    const profileUsername = item.profile?.username;
    const profileAvatar = item.profile?.avatar_url;

    return (
      <TouchableOpacity
        style={[
          styles.likeItem,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
        activeOpacity={0.7}
      >
        {profileAvatar ? (
          <Image
            source={{ uri: profileAvatar }}
            style={styles.avatar}
          />
        ) : (
          <View
            style={[
              styles.avatar,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Text style={[styles.avatarText, { color: theme.colors.background }]}>
              {profileName.charAt(0)}
            </Text>
          </View>
        )}
        <View style={styles.likeInfo}>
          <Text style={[styles.likeName, { color: theme.colors.text }]}>
            {profileName}
          </Text>
          {profileUsername && (
            <Text style={[styles.likeUsername, { color: theme.colors.textSecondary }]}>
              @{profileUsername}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <BlurredModalOverlay visible={visible} onClose={onClose}>
      <View
        style={[
          styles.modalContent,
          {
            backgroundColor: theme.colors.surface,
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 20,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Likes</Text>
          <View style={styles.closeButton} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : likes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={48} color={theme.colors.textTertiary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No likes yet
            </Text>
          </View>
        ) : (
          <FlatList
            data={likes}
            renderItem={renderLike}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </BlurredModalOverlay>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  closeButton: {
    padding: 4,
    width: 32,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
  likeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
  },
  likeInfo: {
    flex: 1,
  },
  likeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  likeUsername: {
    fontSize: 14,
  },
});

