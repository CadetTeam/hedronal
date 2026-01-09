import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { BlurredModalOverlay } from './BlurredModalOverlay';
import { EmptyState } from './EmptyState';
import { Skeleton, SkeletonCard } from './Skeleton';
import { fetchArchivedEntities, unarchiveEntity, deleteEntityPermanently } from '../services/entityService';
import { useAuth } from '@clerk/clerk-expo';

interface ArchivedEntitiesModalProps {
  visible: boolean;
  onClose: () => void;
  onUnarchive?: () => void;
}

export function ArchivedEntitiesModal({
  visible,
  onClose,
  onUnarchive,
}: ArchivedEntitiesModalProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const [archivedEntities, setArchivedEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadArchivedEntities();
    }
  }, [visible]);

  async function loadArchivedEntities() {
    setLoading(true);
    try {
      const token = await getToken();
      if (token) {
        const entities = await fetchArchivedEntities(token);
        // Transform entities to match the format expected by the UI
        const transformedEntities = entities.map((entity: any) => {
          const step2Data: { [key: string]: any } = {};
          if (entity.entity_configurations && Array.isArray(entity.entity_configurations)) {
            entity.entity_configurations.forEach((config: any) => {
              step2Data[config.config_type] = config.config_data;
            });
          }
          const completedItems =
            entity.entity_configurations
              ?.filter((config: any) => config.is_completed)
              .map((config: any) => config.config_type) || [];
          return {
            id: entity.id,
            name: entity.name,
            handle: entity.handle,
            type: entity.type || 'Entity',
            banner: entity.banner_url,
            avatar: entity.avatar_url,
            brief: entity.brief,
            clerkOrgId: entity.clerk_organization_id,
            createdAt: entity.created_at,
            step2Data,
            completedItems,
            socialLinks: entity.entity_social_links || [],
          };
        });
        setArchivedEntities(transformedEntities);
      }
    } catch (error) {
      console.error('[ArchivedEntitiesModal] Error loading archived entities:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUnarchive(entity: any) {
    try {
      setRestoringId(entity.id);
      const token = await getToken();
      if (!token) {
        Alert.alert('Error', 'Authentication required. Please try again.');
        setRestoringId(null);
        return;
      }

      const result = await unarchiveEntity(entity.id, token);
      if (result.success) {
        // Remove from list
        setArchivedEntities(archivedEntities.filter(e => e.id !== entity.id));
        // Notify parent to refresh
        if (onUnarchive) {
          onUnarchive();
        }
      } else {
        console.error('[ArchivedEntitiesModal] Failed to unarchive:', result.error);
        Alert.alert('Error', result.error || 'Failed to restore entity. Please try again.');
      }
    } catch (error: any) {
      console.error('[ArchivedEntitiesModal] Error unarchiving entity:', error);
      Alert.alert('Error', 'Failed to restore entity. Please try again.');
    } finally {
      setRestoringId(null);
    }
  }

  async function handleDeletePermanently(entity: any) {
    Alert.alert(
      'Delete Permanently',
      `Are you sure you want to permanently delete "${entity.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(entity.id);
              const token = await getToken();
              if (!token) {
                Alert.alert('Error', 'Authentication required. Please try again.');
                setDeletingId(null);
                return;
              }

              const result = await deleteEntityPermanently(entity.id, token);
              if (result.success) {
                // Remove from list
                setArchivedEntities(archivedEntities.filter(e => e.id !== entity.id));
              } else {
                Alert.alert('Error', result.error || 'Failed to delete entity. Please try again.');
              }
            } catch (error: any) {
              console.error('[ArchivedEntitiesModal] Error deleting entity:', error);
              Alert.alert('Error', 'Failed to delete entity. Please try again.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadArchivedEntities();
    setRefreshing(false);
  }

  function renderEntity(entity: any) {
    const isDeleting = deletingId === entity.id;
    const isRestoring = restoringId === entity.id;
    const isProcessing = isDeleting || isRestoring;

    return (
      <View
        key={entity.id}
        style={[
          styles.entityCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            opacity: isProcessing ? 0.6 : 1,
          },
        ]}
      >
        {entity.banner && (
          <Image source={{ uri: entity.banner }} style={styles.entityBanner} resizeMode="cover" />
        )}
        <View style={styles.entityCardContent}>
          {entity.avatar ? (
            <Image source={{ uri: entity.avatar }} style={styles.entityAvatar} />
          ) : (
            <View
              style={[
                styles.entityAvatar,
                styles.entityAvatarPlaceholder,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text style={[styles.entityAvatarText, { color: theme.colors.background }]}>
                {entity.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.entityInfo}>
            <Text style={[styles.entityName, { color: theme.colors.text }]}>{entity.name}</Text>
            {entity.handle && (
              <Text style={[styles.entityHandle, { color: theme.colors.textSecondary }]}>
                @{entity.handle}
              </Text>
            )}
            {entity.brief && (
              <Text
                style={[styles.entityBrief, { color: theme.colors.textSecondary }]}
                numberOfLines={2}
              >
                {entity.brief}
              </Text>
            )}
            {entity.type && (
              <Text style={[styles.entityType, { color: theme.colors.textTertiary }]}>
                {entity.type}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.entityActions}>
          <TouchableOpacity
            style={[
              styles.restoreButton,
              {
                backgroundColor: theme.colors.primary,
                opacity: isProcessing ? 0.5 : 1,
              },
            ]}
            onPress={() => handleUnarchive(entity)}
            disabled={isProcessing}
          >
            {isRestoring ? (
              <Ionicons name="hourglass-outline" size={18} color={theme.colors.background} />
            ) : (
              <Ionicons name="arrow-undo-outline" size={18} color={theme.colors.background} />
            )}
            <Text style={[styles.actionButtonText, { color: theme.colors.background }]}>
              Restore
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.deleteButton,
              {
                backgroundColor: theme.colors.error,
                opacity: isProcessing ? 0.5 : 1,
              },
            ]}
            onPress={() => handleDeletePermanently(entity)}
            disabled={isProcessing}
          >
            {isDeleting ? (
              <Ionicons name="hourglass-outline" size={18} color={theme.colors.background} />
            ) : (
              <Ionicons name="trash-outline" size={18} color={theme.colors.background} />
            )}
            <Text style={[styles.actionButtonText, { color: theme.colors.background }]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function renderSkeleton() {
    return (
      <View style={styles.skeletonContainer}>
        {[1, 2, 3].map(i => (
          <View key={i} style={styles.skeletonCard}>
            <SkeletonCard />
          </View>
        ))}
      </View>
    );
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
              maxHeight: '85%',
              minHeight: 500,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Archived Entities</Text>
            <View style={styles.closeButton} />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: 20 },
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
            {loading ? (
              renderSkeleton()
            ) : archivedEntities.length === 0 ? (
              <EmptyState
                title="No archived entities"
                message="Entities you archive will appear here. You can restore them or delete them permanently."
                icon="archive-outline"
              />
            ) : (
              archivedEntities.map(entity => renderEntity(entity))
            )}
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
    flexShrink: 0,
  },
  closeButton: {
    padding: 4,
    width: 32,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
    flexShrink: 1,
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  skeletonContainer: {
    gap: 16,
  },
  skeletonCard: {
    marginBottom: 16,
  },
  entityCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  entityBanner: {
    width: '100%',
    height: 120,
  },
  entityCardContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  entityAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  entityAvatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  entityAvatarText: {
    fontSize: 24,
    fontWeight: '700',
  },
  entityInfo: {
    flex: 1,
  },
  entityName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  entityHandle: {
    fontSize: 14,
    marginBottom: 8,
  },
  entityBrief: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  entityType: {
    fontSize: 12,
    fontWeight: '500',
  },
  entityActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
  restoreButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
