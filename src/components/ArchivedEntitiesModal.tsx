import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { BlurredModalOverlay } from './BlurredModalOverlay';
import { LinearGradient } from 'expo-linear-gradient';
import { EmptyState } from './EmptyState';
import { fetchArchivedEntities, unarchiveEntity } from '../services/entityService';
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
      const token = await getToken();
      if (!token) {
        console.error('[ArchivedEntitiesModal] No token available');
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
      }
    } catch (error) {
      console.error('[ArchivedEntitiesModal] Error unarchiving entity:', error);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadArchivedEntities();
    setRefreshing(false);
  }

  function renderEntity({ item }: { item: any }) {
    return (
      <View
        style={[
          styles.entityCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        {item.banner && (
          <Image source={{ uri: item.banner }} style={styles.entityBanner} resizeMode="cover" />
        )}
        <View style={styles.entityCardContent}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.entityAvatar} />
          ) : (
            <View
              style={[
                styles.entityAvatar,
                styles.entityAvatarPlaceholder,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text style={[styles.entityAvatarText, { color: theme.colors.background }]}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.entityInfo}>
            <Text style={[styles.entityName, { color: theme.colors.text }]}>{item.name}</Text>
            {item.handle && (
              <Text style={[styles.entityHandle, { color: theme.colors.textSecondary }]}>
                @{item.handle}
              </Text>
            )}
            {item.brief && (
              <Text
                style={[styles.entityBrief, { color: theme.colors.textSecondary }]}
                numberOfLines={2}
              >
                {item.brief}
              </Text>
            )}
            {item.type && (
              <Text style={[styles.entityType, { color: theme.colors.textTertiary }]}>
                {item.type}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.unarchiveButton,
              {
                backgroundColor: theme.colors.primary,
              },
            ]}
            onPress={() => handleUnarchive(item)}
          >
            <Ionicons name="arrow-undo-outline" size={20} color={theme.colors.background} />
            <Text style={[styles.unarchiveButtonText, { color: theme.colors.background }]}>
              Unarchive
            </Text>
          </TouchableOpacity>
        </View>
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
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Archived Entities</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={archivedEntities}
            renderItem={renderEntity}
            keyExtractor={item => item.id || `archived-entity-${item.name}`}
            contentContainerStyle={[
              styles.listContent,
              archivedEntities.length === 0 && styles.emptyContainer,
              { paddingBottom: insets.bottom * 2 },
            ]}
            ListEmptyComponent={
              !loading ? (
                <EmptyState
                  title="No archived entities"
                  message="Entities you archive will appear here"
                  icon="archive-outline"
                />
              ) : null
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        </View>
      </BlurredModalOverlay>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    position: 'relative',
  },
  modalHeaderGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: -1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
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
  unarchiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  unarchiveButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
