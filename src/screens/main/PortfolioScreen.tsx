import React, { useState } from 'react';
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
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [entities, setEntities] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [showEntityModal, setShowEntityModal] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    triggerRefresh(); // Trigger bubble animation reload
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setRefreshing(false);
  }

  function handleAddEntity() {
    setShowEntityModal(true);
  }

  function handleEntityComplete(entity: any) {
    // Add the new entity to the list
    const newEntity = {
      id: `entity-${Date.now()}`,
      name: entity.name,
      handle: entity.handle,
      type: 'Entity', // You can customize this based on entity data
      banner: entity.banner,
      avatar: entity.avatar,
      brief: entity.brief,
      createdAt: new Date().toISOString(),
      ...entity,
    };
    setEntities([newEntity, ...entities]);
    setShowEntityModal(false);
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
