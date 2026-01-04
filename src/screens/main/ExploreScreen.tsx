import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useTabBar } from '../../context/TabBarContext';
import { EmptyState } from '../../components/EmptyState';
import { SkeletonCard } from '../../components/Skeleton';
import { LoadingSpinner } from '../../components/LoadingSpinner';

const TOPICS = [
  'Private Equity',
  'Family Offices',
  'Non-Profits',
  'Tax Mitigation',
  'Acquisitions',
  'Fund Formations',
  'SPVs',
  'Trust Structures',
];

export function ExploreScreen() {
  const { theme } = useTheme();
  const { triggerRefresh } = useTabBar();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [articles, setArticles] = useState<any[]>([]); // Will be populated with dummy data

  async function onRefresh() {
    setRefreshing(true);
    triggerRefresh(); // Trigger bubble animation reload
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setRefreshing(false);
  }

  function renderTopic(topic: string) {
    const isSelected = selectedTopic === topic;
    return (
      <TouchableOpacity
        key={topic}
        style={[
          styles.topicChip,
          {
            backgroundColor: isSelected
              ? theme.colors.primary
              : theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
        onPress={() => setSelectedTopic(isSelected ? null : topic)}
      >
        <Text
          style={[
            styles.topicText,
            {
              color: isSelected
                ? theme.colors.background
                : theme.colors.text,
            },
          ]}
        >
          {topic}
        </Text>
      </TouchableOpacity>
    );
  }

  function renderArticle(article: any, index: number) {
    return (
      <View
        key={index}
        style={[
          styles.articleCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.articleTitle, { color: theme.colors.text }]}>
          {article.title}
        </Text>
        <Text
          style={[styles.articleDescription, { color: theme.colors.textSecondary }]}
        >
          {article.description}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Explore</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topicsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Topics
          </Text>
          <View style={styles.topicsContainer}>
            {TOPICS.map(renderTopic)}
          </View>
        </View>

        <View style={styles.articlesSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Tips & Tricks
          </Text>
          {loading ? (
            <View>
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : articles.length === 0 ? (
            <EmptyState
              title="No articles yet"
              message="Browse topics to discover helpful content"
            />
          ) : (
            articles.map(renderArticle)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  topicsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  topicText: {
    fontSize: 14,
    fontWeight: '500',
  },
  articlesSection: {
    marginBottom: 16,
  },
  articleCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  articleDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});
