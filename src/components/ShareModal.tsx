import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Share as RNShare,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { BlurredModalOverlay } from './BlurredModalOverlay';
import { LinearGradient } from 'expo-linear-gradient';

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  post: {
    id: string;
    content?: string;
    images?: string[];
    author: string;
  } | null;
}

export function ShareModal({ visible, onClose, post }: ShareModalProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [sharing, setSharing] = useState(false);

  if (!visible || !post) return null;

  async function handleShare(method: 'native' | 'copy' | 'link') {
    if (!post) return;
    try {
      setSharing(true);
      const postUrl = `https://hedronal.com/post/${post.id}`;
      const shareText = post.content 
        ? `${post.content}\n\n${postUrl}`
        : `Check out this post by ${post.author}\n\n${postUrl}`;

      if (method === 'native') {
        await RNShare.share({
          message: shareText,
          title: 'Share Post',
        });
      } else if (method === 'copy') {
        // TODO: Implement copy to clipboard
        Alert.alert('Copied', 'Post link copied to clipboard');
      } else if (method === 'link') {
        // TODO: Implement custom link sharing
        await RNShare.share({
          message: postUrl,
          title: 'Share Post Link',
        });
      }
    } catch (error: any) {
      console.error('[ShareModal] Error sharing:', error);
      Alert.alert('Error', 'Failed to share post. Please try again.');
    } finally {
      setSharing(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <BlurredModalOverlay visible={visible} onClose={onClose}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.colors.surface,
              paddingBottom: insets.bottom + 40,
              maxHeight: '70%',
              minHeight: 400,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Share Post</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {/* Share Options */}
            <TouchableOpacity
              style={[styles.shareOption, { borderBottomColor: theme.colors.border }]}
              onPress={() => handleShare('native')}
              disabled={sharing}
            >
              <Ionicons name="share-outline" size={24} color={theme.colors.primary} />
              <View style={styles.shareOptionContent}>
                <Text style={[styles.shareOptionTitle, { color: theme.colors.text }]}>
                  Share via...
                </Text>
                <Text style={[styles.shareOptionSubtitle, { color: theme.colors.textSecondary }]}>
                  Share using your device's share options
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.shareOption, { borderBottomColor: theme.colors.border }]}
              onPress={() => handleShare('copy')}
              disabled={sharing}
            >
              <Ionicons name="copy-outline" size={24} color={theme.colors.primary} />
              <View style={styles.shareOptionContent}>
                <Text style={[styles.shareOptionTitle, { color: theme.colors.text }]}>
                  Copy Link
                </Text>
                <Text style={[styles.shareOptionSubtitle, { color: theme.colors.textSecondary }]}>
                  Copy post link to clipboard
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareOption}
              onPress={() => handleShare('link')}
              disabled={sharing}
            >
              <Ionicons name="link-outline" size={24} color={theme.colors.primary} />
              <View style={styles.shareOptionContent}>
                <Text style={[styles.shareOptionTitle, { color: theme.colors.text }]}>
                  Share Link
                </Text>
                <Text style={[styles.shareOptionSubtitle, { color: theme.colors.textSecondary }]}>
                  Share just the post link
                </Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </BlurredModalOverlay>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    alignSelf: 'flex-end',
    flexDirection: 'column',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
    flexShrink: 1,
  },
  scrollContent: {
    padding: 16,
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 16,
  },
  shareOptionContent: {
    flex: 1,
  },
  shareOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  shareOptionSubtitle: {
    fontSize: 14,
  },
});

