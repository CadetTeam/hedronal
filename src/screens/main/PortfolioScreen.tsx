import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useTabBar } from '../../context/TabBarContext';
import { Header } from '../../components/Header';
import { EmptyState } from '../../components/EmptyState';
import { SkeletonCard } from '../../components/Skeleton';
import { Button } from '../../components/Button';
import { EntityCreationModal } from '../../components/EntityCreationModal';
import { EntityProfileModal } from '../../components/EntityProfileModal';
import { fetchEntities, fetchEntityById } from '../../services/entityService';
import { useClerkContext } from '../../context/ClerkContext';
import { useAuth } from '@clerk/clerk-expo';

const ENTITY_TYPES = [
  'Fund',
  'SPV',
  'Software Company',
  'Service Org',
  'NonProfit',
  'Trust',
  'Donor Advised Fund',
];

export function PortfolioScreen() {
  const { theme } = useTheme();
  const { triggerRefresh } = useTabBar();
  const { userId } = useClerkContext();
  const { getToken } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [entities, setEntities] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [showEntityModal, setShowEntityModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);

  // Fetch entities from backend
  async function loadEntities() {
    if (!userId) return;
    
    setLoading(true);
    try {
      const token = await getToken();
      const fetchedEntities = await fetchEntities(token || undefined);
      
      // Transform entities to match the expected format
      const transformedEntities = fetchedEntities.map((entity: any) => {
        // Transform entity_configurations array to object
        const step2Data: { [key: string]: any } = {};
        if (entity.entity_configurations && Array.isArray(entity.entity_configurations)) {
          entity.entity_configurations.forEach((config: any) => {
            step2Data[config.config_type] = config.config_data;
          });
        }
        
        // Get completed items from configurations
        const completedItems = entity.entity_configurations
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
      
      setEntities(transformedEntities);
    } catch (error) {
      console.error('Error loading entities:', error);
    } finally {
      setLoading(false);
    }
  }

  // Load entities on mount
  useEffect(() => {
    loadEntities();
  }, [userId]);

  async function onRefresh() {
    setRefreshing(true);
    triggerRefresh(); // Trigger bubble animation reload
    await loadEntities();
    setRefreshing(false);
  }

  function handleAddEntity() {
    setShowEntityModal(true);
  }

  async function handleEntityComplete(entity: any) {
    // Refresh entities list to get the newly created entity from backend
    await loadEntities();
    setShowEntityModal(false);
  }

  async function handleEntityPress(entity: any) {
    // Fetch full entity data from backend if needed
    try {
      const token = await getToken();
      const fullEntity = await fetchEntityById(entity.id, token || undefined);
      if (fullEntity) {
        // Transform entity_configurations array to object
        const step2Data: { [key: string]: any } = {};
        if (fullEntity.entity_configurations && Array.isArray(fullEntity.entity_configurations)) {
          fullEntity.entity_configurations.forEach((config: any) => {
            step2Data[config.config_type] = config.config_data;
          });
        }
        
        // Get completed items from configurations
        const completedItems = fullEntity.entity_configurations
          ?.filter((config: any) => config.is_completed)
          .map((config: any) => config.config_type) || [];

        // Transform to match expected format
        const transformedEntity = {
          id: fullEntity.id,
          name: fullEntity.name,
          handle: fullEntity.handle,
          type: fullEntity.type || 'Entity',
          banner: fullEntity.banner_url,
          avatar: fullEntity.avatar_url,
          brief: fullEntity.brief,
          clerkOrgId: fullEntity.clerk_organization_id,
          createdAt: fullEntity.created_at,
          step2Data,
          completedItems,
          socialLinks: fullEntity.entity_social_links || [],
        };
        setSelectedEntity(transformedEntity);
        setShowProfileModal(true);
      } else {
        // Fallback to entity from list
        setSelectedEntity(entity);
        setShowProfileModal(true);
      }
    } catch (error) {
      console.error('Error fetching entity:', error);
      // Fallback to entity from list
      setSelectedEntity(entity);
      setShowProfileModal(true);
    }
  }

  function handleFilter() {
    setShowFilters(!showFilters);
  }

  function handleSort() {
    // Show sort options
  }

  function renderEntity({ item }: { item: any }) {
    return (
      <TouchableOpacity
        style={[
          styles.entityCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
        activeOpacity={0.7}
        onPress={() => handleEntityPress(item)}
      >
        {item.banner && (
          <Image
            source={{ uri: item.banner }}
            style={styles.entityBanner}
            resizeMode="cover"
          />
        )}
        <View style={styles.entityCardContent}>
          {item.avatar ? (
            <Image
              source={{ uri: item.avatar }}
              style={styles.entityAvatar}
            />
          ) : (
            <View
              style={[
                styles.entityAvatar,
                styles.entityAvatarPlaceholder,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.entityAvatarText,
                  { color: theme.colors.background },
                ]}
              >
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.entityInfo}>
            <Text style={[styles.entityName, { color: theme.colors.text }]}>
              {item.name}
            </Text>
            {item.handle && (
              <Text
                style={[styles.entityHandle, { color: theme.colors.textSecondary }]}
              >
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
              <Text
                style={[styles.entityType, { color: theme.colors.textTertiary }]}
              >
                {item.type}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  function renderEmpty() {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      );
    }
    return (
      <EmptyState
        title="No entities yet"
        message="Tap the + button to add your first entity"
      />
    );
  }

  return (
    <SafeAreaView
      edges={[]}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Header
        title="Portfolio"
        rightAction={{
          icon: 'add',
          onPress: handleAddEntity,
        }}
      />

      <View style={styles.actionsBar}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={handleFilter}
        >
          <Ionicons
            name="filter"
            size={20}
            color={theme.colors.text}
          />
          <Text style={[styles.actionText, { color: theme.colors.text }]}>
            Filter
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={handleSort}
        >
          <Ionicons
            name="swap-vertical"
            size={20}
            color={theme.colors.text}
          />
          <Text style={[styles.actionText, { color: theme.colors.text }]}>
            Sort
          </Text>
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View
          style={[
            styles.filtersContainer,
            {
              backgroundColor: theme.colors.surface,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.filterLabel, { color: theme.colors.text }]}>
            Filter by Type:
          </Text>
          <View style={styles.filterChips}>
            {ENTITY_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor:
                      filterType === type ? theme.colors.primary : theme.colors.surfaceVariant,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => setFilterType(filterType === type ? null : type)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color:
                        filterType === type
                          ? theme.colors.background
                          : theme.colors.text,
                    },
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <FlatList
        data={entities}
        renderItem={renderEntity}
        keyExtractor={(item) => item.id || `entity-${item.name}`}
        contentContainerStyle={[
          entities.length === 0 ? styles.emptyContainer : styles.listContent,
          { paddingBottom: 100 },
        ]}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Entity Creation Modal */}
      <EntityCreationModal
        visible={showEntityModal}
        onClose={() => setShowEntityModal(false)}
        onComplete={handleEntityComplete}
      />

      {/* Entity Profile Modal */}
      {selectedEntity && (
        <EntityProfileModal
          visible={showProfileModal}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedEntity(null);
          }}
          entity={selectedEntity}
          onUpdate={(updatedEntity) => {
            setEntities(entities.map((e) => (e.id === updatedEntity.id ? updatedEntity : e)));
            setSelectedEntity(updatedEntity);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  actionsBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filtersContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
  },
  loadingContainer: {
    padding: 16,
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
});
