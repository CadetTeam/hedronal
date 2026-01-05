import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { SkeletonCard, Skeleton } from '../../components/Skeleton';
import { Button } from '../../components/Button';
import { EntityCreationModal } from '../../components/EntityCreationModal';
import { EntityProfileModal } from '../../components/EntityProfileModal';
import { WalletModal } from '../../components/WalletModal';
import { NotificationsModal } from '../../components/NotificationsModal';
import { fetchEntities, fetchEntityById } from '../../services/entityService';
import { useClerkContext } from '../../context/ClerkContext';
import { useAuth } from '@clerk/clerk-expo';
import { formatPortfolioValue } from '../../utils/currencyFormatter';

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
  const { userId, organizationList, isLoaded: clerkLoaded } = useClerkContext();
  const { getToken } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [entities, setEntities] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [showEntityModal, setShowEntityModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  // Calculate total portfolio value (mock for now - can be replaced with actual calculation)
  const totalPortfolioValue = useMemo(() => {
    // TODO: Calculate from actual entity values when available
    // For now, using a mock value based on number of entities
    const baseValue = entities.length * 250000; // $250k per entity as placeholder
    return baseValue || 0;
  }, [entities.length]);

  // Fetch entities from backend
  async function loadEntities() {
    if (!userId) {
      console.log('[loadEntities] No userId, skipping');
      return;
    }

    // Check if user has organizations
    const hasOrgs = organizationList && organizationList.length > 0;
    console.log('[loadEntities] User organizations:', {
      count: organizationList?.length || 0,
      orgIds: organizationList?.map((org: any) => org.id) || [],
      hasOrgs,
    });

    if (!hasOrgs) {
      console.log('[loadEntities] User has no organizations yet');
      setEntities([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Get a fresh token - Clerk will handle token refresh automatically
      let token = await getToken({ template: 'default' });

      // If token is null, try to get it without template
      if (!token) {
        token = await getToken();
      }

      console.log('[loadEntities] Token retrieved:', token ? 'Token exists' : 'No token');

      if (!token) {
        console.warn('[loadEntities] No token available, user may need to sign in again');
        setLoading(false);
        return;
      }

      console.log(
        '[loadEntities] Fetching entities for organizations:',
        organizationList.map((org: any) => org.id)
      );

      const fetchedEntities = await fetchEntities(token);

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

      setEntities(transformedEntities);
    } catch (error: any) {
      console.error('Error loading entities:', error);
      // If it's a token error, try to get a fresh token and retry once
      if (error?.message?.includes('token') || error?.message?.includes('401')) {
        console.log('[loadEntities] Token error detected, attempting to refresh...');
        try {
          const freshToken = await getToken({ template: 'default' });
          if (freshToken) {
            const retryEntities = await fetchEntities(freshToken);
            const transformedEntities = retryEntities.map((entity: any) => {
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
            setEntities(transformedEntities);
            return;
          }
        } catch (retryError) {
          console.error('[loadEntities] Retry failed:', retryError);
        }
      }
      // If all else fails, set empty array
      setEntities([]);
    } finally {
      setLoading(false);
    }
  }

  // Track previous org count to detect changes
  const prevOrgCountRef = useRef<number>(0);
  const prevOrgIdsRef = useRef<string>('');

  // Create a stable string of org IDs for dependency tracking
  const orgIdsString = useMemo(
    () =>
      organizationList
        ?.map((org: any) => org.id)
        .sort()
        .join(',') || '',
    [organizationList]
  );

  // Load entities when user or organizations change
  useEffect(() => {
    if (clerkLoaded && userId) {
      const currentOrgCount = organizationList?.length || 0;
      const orgCountChanged = currentOrgCount !== prevOrgCountRef.current;
      const orgIdsChanged = orgIdsString !== prevOrgIdsRef.current;

      console.log('[PortfolioScreen] Clerk loaded, checking organizations and loading entities', {
        userId,
        orgCount: currentOrgCount,
        orgCountChanged,
        orgIdsChanged,
        orgIds: organizationList?.map((org: any) => org.id) || [],
      });

      // Update refs
      prevOrgCountRef.current = currentOrgCount;
      prevOrgIdsRef.current = orgIdsString;

      // Always try to load entities when clerk is loaded and user exists
      // This ensures we fetch entities even if org count is 0 (might have entities without orgs)
      // or if orgs were just added
      loadEntities();
    }
  }, [userId, clerkLoaded, orgIdsString]);

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
      // Get a fresh token
      let token = await getToken({ template: 'default' });
      if (!token) {
        token = await getToken();
      }

      if (!token) {
        console.warn('[handleEntityPress] No token available, using entity from list');
        setSelectedEntity(entity);
        setShowProfileModal(true);
        return;
      }

      const fullEntity = await fetchEntityById(entity.id, token);
      if (fullEntity) {
        // Transform entity_configurations array to object
        const step2Data: { [key: string]: any } = {};
        if (fullEntity.entity_configurations && Array.isArray(fullEntity.entity_configurations)) {
          fullEntity.entity_configurations.forEach((config: any) => {
            step2Data[config.config_type] = config.config_data;
          });
        }

        // Get completed items from configurations
        const completedItems =
          fullEntity.entity_configurations
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
    } catch (error: any) {
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
        </View>
      </TouchableOpacity>
    );
  }

  function renderOrganizationSkeleton() {
    return (
      <View
        style={[
          styles.entityCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            opacity: 0.1,
          },
        ]}
      >
        {/* Banner skeleton */}
        <View
          style={[
            styles.entityBanner,
            {
              backgroundColor: theme.colors.surfaceVariant,
            },
          ]}
        />

        <View style={styles.entityCardContent}>
          {/* Avatar skeleton */}
          <View
            style={[
              styles.entityAvatar,
              styles.entityAvatarPlaceholder,
              {
                backgroundColor: theme.colors.surfaceVariant,
              },
            ]}
          />

          <View style={styles.entityInfo}>
            {/* Name skeleton */}
            <View
              style={[
                {
                  height: 18,
                  width: '65%',
                  backgroundColor: theme.colors.surfaceVariant,
                  borderRadius: 4,
                  marginBottom: 6,
                },
              ]}
            />

            {/* Handle skeleton */}
            <View
              style={[
                {
                  height: 14,
                  width: '45%',
                  backgroundColor: theme.colors.surfaceVariant,
                  borderRadius: 4,
                  marginBottom: 10,
                },
              ]}
            />

            {/* Bio skeleton - 2 lines */}
            <View
              style={[
                {
                  height: 14,
                  width: '100%',
                  backgroundColor: theme.colors.surfaceVariant,
                  borderRadius: 4,
                  marginBottom: 4,
                },
              ]}
            />
            <View
              style={[
                {
                  height: 14,
                  width: '85%',
                  backgroundColor: theme.colors.surfaceVariant,
                  borderRadius: 4,
                  marginBottom: 12,
                },
              ]}
            />

            {/* Type skeleton */}
            <View
              style={[
                {
                  height: 12,
                  width: '35%',
                  backgroundColor: theme.colors.surfaceVariant,
                  borderRadius: 4,
                  marginBottom: 12,
                },
              ]}
            />

            {/* Counters skeleton */}
            <View style={styles.skeletonCounters}>
              <View
                style={[
                  {
                    height: 16,
                    width: 50,
                    backgroundColor: theme.colors.surfaceVariant,
                    borderRadius: 4,
                  },
                ]}
              />
              <View
                style={[
                  {
                    height: 16,
                    width: 50,
                    backgroundColor: theme.colors.surfaceVariant,
                    borderRadius: 4,
                  },
                ]}
              />
              <View
                style={[
                  {
                    height: 16,
                    width: 50,
                    backgroundColor: theme.colors.surfaceVariant,
                    borderRadius: 4,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </View>
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
      <View style={styles.emptyContainer}>
        {/* Skeleton cards in background */}
        <View style={styles.listContent}>
          {renderOrganizationSkeleton()}
          {renderOrganizationSkeleton()}
          {renderOrganizationSkeleton()}
        </View>
        {/* CTA overlay on top */}
        <View style={styles.emptyStateOverlay}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleAddEntity}
            style={styles.ctaContainer}
          >
            <EmptyState
              title="No entities yet"
              message="Tap here to add your first entity"
              transparent={true}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView
      edges={[]}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Header
        title="Portfolio"
        leftAction={{
          icon: 'wallet-outline',
          onPress: () => setShowWalletModal(true),
        }}
        rightAction={{
          icon: 'add',
          onPress: handleAddEntity,
        }}
        rightSideAction={{
          icon: 'notifications-outline',
          onPress: () => setShowNotificationsModal(true),
        }}
      />

      <View style={styles.actionsBar}>
        <View style={styles.actionsLeft}>
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
            <Ionicons name="filter" size={16} color={theme.colors.text} />
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
            <Ionicons name="swap-vertical" size={16} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.portfolioValue}>
          <Text style={[styles.portfolioLabel, { color: theme.colors.textSecondary }]}>
            Total Portfolio
          </Text>
          <Text style={[styles.portfolioAmount, { color: theme.colors.text }]}>
            {formatPortfolioValue(totalPortfolioValue)}
          </Text>
        </View>
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
          <Text style={[styles.filterLabel, { color: theme.colors.text }]}>Filter by Type:</Text>
          <View style={styles.filterChips}>
            {ENTITY_TYPES.map(type => (
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
                      color: filterType === type ? theme.colors.background : theme.colors.text,
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
        keyExtractor={item => item.id || `entity-${item.name}`}
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
          onUpdate={updatedEntity => {
            setEntities(entities.map(e => (e.id === updatedEntity.id ? updatedEntity : e)));
            setSelectedEntity(updatedEntity);
          }}
        />
      )}

      {/* Wallet Modal */}
      <WalletModal visible={showWalletModal} onClose={() => setShowWalletModal(false)} />

      {/* Notifications Modal */}
      <NotificationsModal
        visible={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  actionsLeft: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
  },
  portfolioValue: {
    alignItems: 'flex-end',
  },
  portfolioLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  portfolioAmount: {
    fontSize: 18,
    fontWeight: '700',
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
    position: 'relative',
  },
  emptyStateOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    backgroundColor: 'transparent',
  },
  ctaContainer: {
    width: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  skeletonCounters: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
});
