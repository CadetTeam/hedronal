import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { BlurredModalOverlay } from './BlurredModalOverlay';
import { useAuth } from '@clerk/clerk-expo';
import { fetchPostComments, createPostComment } from '../services/postService';

interface PostCommentsModalProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  profile: {
    id: string;
    full_name: string;
    username?: string;
    avatar_url?: string;
  } | null;
  created_at: string;
}

export function PostCommentsModal({ visible, onClose, postId }: PostCommentsModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible && postId) {
      loadComments();
    }
  }, [visible, postId]);

  async function loadComments() {
    try {
      setLoading(true);
      const token = await getToken();
      const fetchedComments = await fetchPostComments(postId, token || undefined);
      setComments(fetchedComments);
    } catch (error: any) {
      console.error('[PostCommentsModal] Error loading comments:', error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitComment() {
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      const token = await getToken();
      const comment = await createPostComment(postId, newComment.trim(), undefined, token || undefined);
      
      if (comment) {
        setNewComment('');
        // Reload comments after submission
        await loadComments();
      } else {
        // Show error message
        console.error('[PostCommentsModal] Failed to create comment');
      }
    } catch (error: any) {
      console.error('[PostCommentsModal] Error submitting comment:', error);
    } finally {
      setSubmitting(false);
    }
  }

  function renderComment({ item }: { item: Comment }) {
    const profileName = item.profile?.full_name || 'Unknown User';
    const profileUsername = item.profile?.username;
    const profileAvatar = item.profile?.avatar_url;

    return (
      <View
        style={[
          styles.commentItem,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
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
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={[styles.commentName, { color: theme.colors.text }]}>
              {profileName}
            </Text>
            {profileUsername && (
              <Text style={[styles.commentUsername, { color: theme.colors.textSecondary }]}>
                @{profileUsername}
              </Text>
            )}
          </View>
          <Text style={[styles.commentText, { color: theme.colors.text }]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <BlurredModalOverlay visible={visible} onClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.colors.surface,
              paddingTop: insets.top + 20,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Comments</Text>
            <View style={styles.closeButton} />
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : comments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-outline" size={48} color={theme.colors.textTertiary} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No comments yet
              </Text>
            </View>
          ) : (
            <FlatList
              data={comments}
              renderItem={renderComment}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
            />
          )}

          {/* Comment Input */}
          <View
            style={[
              styles.commentInputContainer,
              {
                backgroundColor: theme.colors.surface,
                borderTopColor: theme.colors.border,
                paddingBottom: insets.bottom + 8,
              },
            ]}
          >
            <TextInput
              style={[
                styles.commentInput,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
              placeholder="Add a comment..."
              placeholderTextColor={theme.colors.textTertiary}
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: newComment.trim() ? theme.colors.primary : theme.colors.surfaceVariant,
                  opacity: newComment.trim() ? 1 : 0.5,
                },
              ]}
              onPress={handleSubmitComment}
              disabled={!newComment.trim() || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={theme.colors.background} />
              ) : (
                <Ionicons
                  name="send"
                  size={20}
                  color={newComment.trim() ? theme.colors.background : theme.colors.textTertiary}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  commentItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  commentName: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentUsername: {
    fontSize: 12,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    fontSize: 14,
  },
  submitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

