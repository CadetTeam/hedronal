import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Keyboard,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '@clerk/clerk-expo';
import { BlurredModalOverlay } from './BlurredModalOverlay';
import { LinearGradient } from 'expo-linear-gradient';
import { uploadImageToSupabase } from '../utils/imageUpload';
import { createPost } from '../services/postService';

interface PostCreationModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const MAX_IMAGES = 10;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function PostCreationModal({ visible, onClose, onComplete }: PostCreationModalProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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

  useEffect(() => {
    if (!visible) {
      setContent('');
      setImages([]);
    }
  }, [visible]);

  async function pickImages() {
    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) {
      Alert.alert('Limit Reached', `You can only add up to ${MAX_IMAGES} images.`);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need camera roll permissions to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: remainingSlots,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(asset => asset.uri);
      setImages(prev => [...prev, ...newImages].slice(0, MAX_IMAGES));
    }
  }

  function removeImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index));
  }

  async function handlePost() {
    if (!content.trim() && images.length === 0) {
      Alert.alert('Empty Post', 'Please add some text or images to your post.');
      return;
    }

    try {
      setUploading(true);
      const token = await getToken();

      // Upload images to Supabase
      const imageUrls: string[] = [];
      for (const imageUri of images) {
        try {
          const url = await uploadImageToSupabase(
            imageUri,
            'post-images', // New bucket for post images
            `post-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`,
            token || undefined
          );
          imageUrls.push(url);
        } catch (error: any) {
          console.error('[PostCreationModal] Error uploading image:', error);
          Alert.alert('Upload Error', `Failed to upload image: ${error.message}`);
          setUploading(false);
          return;
        }
      }

      // Create post with content and image URLs
      const post = await createPost(content.trim(), undefined, imageUrls, token || undefined);
      
      if (post) {
        onComplete();
        onClose();
      } else {
        Alert.alert('Error', 'Failed to create post. Please try again.');
      }
    } catch (error: any) {
      console.error('[PostCreationModal] Error creating post:', error);
      Alert.alert('Error', error.message || 'Failed to create post. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  function renderImageGrid() {
    if (images.length === 0) return null;

    // Layout rules based on image count
    if (images.length === 1) {
      return (
        <TouchableOpacity
          style={styles.singleImageContainer}
          onPress={() => {
            // TODO: Open full image viewer
          }}
        >
          <Image source={{ uri: images[0] }} style={styles.singleImage} />
          <TouchableOpacity
            style={styles.removeImageButton}
            onPress={() => removeImage(0)}
          >
            <Ionicons name="close-circle" size={24} color={theme.colors.error} />
          </TouchableOpacity>
        </TouchableOpacity>
      );
    }

    if (images.length === 2) {
      return (
        <View style={styles.twoImageContainer}>
          {images.map((uri, index) => (
            <TouchableOpacity
              key={index}
              style={styles.twoImage}
              onPress={() => {
                // TODO: Open full image viewer
              }}
            >
              <Image source={{ uri }} style={styles.twoImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => removeImage(index)}
              >
                <Ionicons name="close-circle" size={24} color={theme.colors.error} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    if (images.length === 3) {
      return (
        <View style={styles.threeImageContainer}>
          <TouchableOpacity
            style={styles.threeImageLeft}
            onPress={() => {
              // TODO: Open full image viewer
            }}
          >
            <Image source={{ uri: images[0] }} style={styles.threeImageLeft} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => removeImage(0)}
            >
              <Ionicons name="close-circle" size={24} color={theme.colors.error} />
            </TouchableOpacity>
          </TouchableOpacity>
          <View style={styles.threeImageRight}>
            {images.slice(1).map((uri, index) => (
              <TouchableOpacity
                key={index + 1}
                style={styles.threeImageRightItem}
                onPress={() => {
                  // TODO: Open full image viewer
                }}
              >
                <Image source={{ uri }} style={styles.threeImageRightItem} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index + 1)}
                >
                  <Ionicons name="close-circle" size={24} color={theme.colors.error} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    if (images.length === 4) {
      return (
        <View style={styles.fourImageContainer}>
          {images.map((uri, index) => (
            <TouchableOpacity
              key={index}
              style={styles.fourImageItem}
              onPress={() => {
                // TODO: Open full image viewer
              }}
            >
              <Image source={{ uri }} style={styles.fourImageItem} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => removeImage(index)}
              >
                <Ionicons name="close-circle" size={24} color={theme.colors.error} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    // 5+ images: carousel
    return (
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.carouselContainer}
      >
        {images.map((uri, index) => (
          <TouchableOpacity
            key={index}
            style={styles.carouselItem}
            onPress={() => {
              // TODO: Open full image viewer
            }}
          >
            <Image source={{ uri }} style={styles.carouselImage} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => removeImage(index)}
            >
              <Ionicons name="close-circle" size={24} color={theme.colors.error} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
            paddingBottom: keyboardVisible ? keyboardHeight : insets.bottom + 20,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Create Post</Text>
          <TouchableOpacity
            onPress={handlePost}
            disabled={uploading || (!content.trim() && images.length === 0)}
            style={[
              styles.postButton,
              {
                opacity: uploading || (!content.trim() && images.length === 0) ? 0.5 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.postButtonText,
                { color: uploading ? theme.colors.textSecondary : theme.colors.primary },
              ]}
            >
              {uploading ? 'Posting...' : 'Post'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Text Input */}
          <TextInput
            style={[styles.textInput, { color: theme.colors.text }]}
            placeholder="What's on your mind?"
            placeholderTextColor={theme.colors.textTertiary}
            value={content}
            onChangeText={setContent}
            multiline
            autoFocus
          />

          {/* Image Grid */}
          {renderImageGrid()}

          {/* Add Images Button */}
          {images.length < MAX_IMAGES && (
            <TouchableOpacity
              style={[
                styles.addImageButton,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={pickImages}
            >
              <Ionicons name="image-outline" size={24} color={theme.colors.text} />
              <Text style={[styles.addImageText, { color: theme.colors.text }]}>
                Add Images ({images.length}/{MAX_IMAGES})
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  postButton: {
    padding: 8,
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  textInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 100,
    marginBottom: 16,
  },
  // Image layouts
  singleImageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  singleImage: {
    width: '100%',
    height: '100%',
  },
  twoImageContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  twoImage: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  threeImageContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  threeImageLeft: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  threeImageRight: {
    flex: 1,
    gap: 8,
  },
  threeImageRightItem: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  fourImageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  fourImageItem: {
    width: (SCREEN_WIDTH - 48) / 2 - 4, // Account for padding and gap
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  carouselContainer: {
    marginBottom: 16,
  },
  carouselItem: {
    width: SCREEN_WIDTH - 32,
    marginRight: 8,
  },
  carouselImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  addImageText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

