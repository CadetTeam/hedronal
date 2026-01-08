import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface PostImageGalleryProps {
  images: string[];
  onImagePress?: (index: number) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function PostImageGallery({ images, onImagePress }: PostImageGalleryProps) {
  const { theme } = useTheme();
  const [fullImageIndex, setFullImageIndex] = useState<number | null>(null);

  function handleImagePress(index: number) {
    if (onImagePress) {
      onImagePress(index);
    } else {
      setFullImageIndex(index);
    }
  }

  function closeFullImage() {
    setFullImageIndex(null);
  }

  if (images.length === 0) return null;

  // 1 image: full square with rounded edges
  if (images.length === 1) {
    return (
      <>
        <TouchableOpacity
          style={styles.singleImageContainer}
          onPress={() => handleImagePress(0)}
          activeOpacity={0.9}
        >
          <Image source={{ uri: images[0] }} style={styles.singleImage} />
        </TouchableOpacity>
        {fullImageIndex !== null && (
          <FullImageViewer images={images} initialIndex={fullImageIndex} onClose={closeFullImage} />
        )}
      </>
    );
  }

  // 2 images: side by side
  if (images.length === 2) {
    return (
      <>
        <View style={styles.twoImageContainer}>
          {images.map((uri, index) => (
            <TouchableOpacity
              key={index}
              style={styles.twoImage}
              onPress={() => handleImagePress(index)}
              activeOpacity={0.9}
            >
              <Image source={{ uri }} style={styles.twoImage} />
            </TouchableOpacity>
          ))}
        </View>
        {fullImageIndex !== null && (
          <FullImageViewer images={images} initialIndex={fullImageIndex} onClose={closeFullImage} />
        )}
      </>
    );
  }

  // 3 images: 1 tall on left, 2 stacked on right
  if (images.length === 3) {
    return (
      <>
        <View style={styles.threeImageContainer}>
          <TouchableOpacity
            style={styles.threeImageLeft}
            onPress={() => handleImagePress(0)}
            activeOpacity={0.9}
          >
            <Image source={{ uri: images[0] }} style={styles.threeImageLeft} />
          </TouchableOpacity>
          <View style={styles.threeImageRight}>
            {images.slice(1).map((uri, index) => (
              <TouchableOpacity
                key={index + 1}
                style={styles.threeImageRightItem}
                onPress={() => handleImagePress(index + 1)}
                activeOpacity={0.9}
              >
                <Image source={{ uri }} style={styles.threeImageRightItem} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {fullImageIndex !== null && (
          <FullImageViewer images={images} initialIndex={fullImageIndex} onClose={closeFullImage} />
        )}
      </>
    );
  }

  // 4 images: grid
  if (images.length === 4) {
    return (
      <>
        <View style={styles.fourImageContainer}>
          {images.map((uri, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.fourImageItem,
                index % 2 === 0 && styles.fourImageItemLeft, // Left column
                index % 2 === 1 && styles.fourImageItemRight, // Right column
                index >= images.length - 2 && styles.fourImageItemBottom, // Bottom row
              ]}
              onPress={() => handleImagePress(index)}
              activeOpacity={0.9}
            >
              <Image source={{ uri }} style={styles.fourImageItem} />
            </TouchableOpacity>
          ))}
        </View>
        {fullImageIndex !== null && (
          <FullImageViewer images={images} initialIndex={fullImageIndex} onClose={closeFullImage} />
        )}
      </>
    );
  }

  // 5+ images: carousel with overflow hidden
  return (
    <>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.carouselContainer}
        contentContainerStyle={styles.carouselContent}
      >
        {images.map((uri, index) => (
          <TouchableOpacity
            key={index}
            style={styles.carouselItem}
            onPress={() => handleImagePress(index)}
            activeOpacity={0.9}
          >
            <Image source={{ uri }} style={styles.carouselImage} />
            {images.length > 5 && (
              <View style={styles.carouselOverlay}>
                <View style={[styles.carouselIndicator, { backgroundColor: theme.colors.surface }]}>
                  <Ionicons name="images" size={16} color={theme.colors.text} />
                  <View style={styles.carouselCount}>
                    <View
                      style={[styles.carouselCountBadge, { backgroundColor: theme.colors.primary }]}
                    >
                      <Text style={styles.carouselCountText}>{images.length}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
      {fullImageIndex !== null && (
        <FullImageViewer images={images} initialIndex={fullImageIndex} onClose={closeFullImage} />
      )}
    </>
  );
}

interface FullImageViewerProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

function FullImageViewer({ images, initialIndex, onClose }: FullImageViewerProps) {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  return (
    <Modal visible={true} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.fullImageContainer}>
        <TouchableOpacity style={styles.fullImageClose} onPress={onClose}>
          <Ionicons name="close" size={32} color={theme.colors.background} />
        </TouchableOpacity>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: currentIndex * SCREEN_WIDTH, y: 0 }}
          onMomentumScrollEnd={e => {
            const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setCurrentIndex(index);
          }}
        >
          {images.map((uri, index) => (
            <View key={index} style={styles.fullImageItem}>
              <Image source={{ uri }} style={styles.fullImage} resizeMode="contain" />
            </View>
          ))}
        </ScrollView>
        <View style={styles.fullImageIndicator}>
          <View
            style={[styles.fullImageIndicatorDot, { backgroundColor: theme.colors.background }]}
          >
            <Text style={styles.fullImageIndicatorText}>
              {currentIndex + 1} / {images.length}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Single image
  singleImageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 12,
  },
  singleImage: {
    width: '100%',
    height: '100%',
  },
  // Two images
  twoImageContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  twoImage: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  // Three images
  threeImageContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
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
  // Four images
  fourImageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    width: '100%',
  },
  fourImageItem: {
    width: (SCREEN_WIDTH - 64 - 8) / 2, // Account for list padding (32) + post padding (32) = 64, plus gap (8), divided by 2
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  fourImageItemLeft: {
    marginRight: 8,
  },
  fourImageItemRight: {
    marginRight: 0,
  },
  fourImageItemBottom: {
    marginBottom: 0,
  },
  // Carousel (5+ images)
  carouselContainer: {
    marginTop: 12,
  },
  carouselContent: {
    paddingRight: 8,
  },
  carouselItem: {
    width: (SCREEN_WIDTH - 48) / 2 - 4, // Same size as 4-image grid items
    marginRight: 8,
    position: 'relative',
  },
  carouselImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  carouselOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  carouselIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  carouselCount: {
    position: 'relative',
  },
  carouselCountBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  carouselCountText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  // Full image viewer
  fullImageContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  fullImageClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  fullImageItem: {
    width: SCREEN_WIDTH,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  fullImageIndicator: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
  },
  fullImageIndicatorDot: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  fullImageIndicatorText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
