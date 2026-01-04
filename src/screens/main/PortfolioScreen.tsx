import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useTabBar } from '../../context/TabBarContext';
import { EmptyState } from '../../components/EmptyState';
import { SkeletonCard } from '../../components/Skeleton';
import { Button } from '../../components/Button';

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
  const [entities, setEntities] = useState<any[]>([]); // Will be populated with dummy data
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<string | null>(null);

  async function onRefresh() {
    setRefreshing(true);
    triggerRefresh(); // Trigger bubble animation reload
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setRefreshing(false);
  }

  function handleAddEntity() {
    // Navigate to add entity screen/modal
  }

  function handleFilter() {
    setShowFilters(!showFilters);
  }

  function handleSort() {
    // Show sort options
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
        <View style={styles.entityHeader}>
          <Text style={[styles.entityName, { color: theme.colors.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.entityType, { color: theme.colors.textSecondary }]}>
            {item.type}
          </Text>
        </View>
        <View style={styles.entityDetails}>
          <Text style={[styles.entityDetail, { color: theme.colors.textTertiary }]}>
            Owner: {item.owner}
          </Text>
          <Text style={[styles.entityDetail, { color: theme.colors.textTertiary }]}>
            Location: {item.location}
          </Text>
          <Text style={[styles.entityDetail, { color: theme.colors.textTertiary }]}>
            Created: {item.date}
          </Text>
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
      <EmptyState
        title="No entities yet"
        message="Tap the + button to add your first entity"
      />
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Portfolio</Text>
        <TouchableOpacity
          style={[
            styles.addButton,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={handleAddEntity}
        >
          <Ionicons name="add" size={24} color={theme.colors.background} />
        </TouchableOpacity>
      </View>

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
        keyExtractor={(item, index) => `entity-${index}`}
        contentContainerStyle={entities.length === 0 ? styles.emptyContainer : styles.listContent}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
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
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  entityHeader: {
    marginBottom: 12,
  },
  entityName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  entityType: {
    fontSize: 14,
  },
  entityDetails: {
    gap: 4,
  },
  entityDetail: {
    fontSize: 12,
  },
});
