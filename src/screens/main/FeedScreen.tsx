import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useTabBar } from '../../context/TabBarContext';
import { Header } from '../../components/Header';
import { EmptyState } from '../../components/EmptyState';
import { SkeletonCard } from '../../components/Skeleton';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { NotificationsModal } from '../../components/NotificationsModal';

const MOCK_POSTS = [
  {
    id: '1',
    author: 'Sarah Chen',
    authorCompany: 'Acme Capital',
    content: 'Just closed our first $50M fund! Excited to start deploying capital into innovative startups. The private equity landscape is evolving rapidly.',
    timestamp: '2 hours ago',
    likes: 42,
    comments: 8,
  },
  {
    id: '2',
    author: 'Michael Rodriguez',
    authorCompany: 'Family Office Partners',
    content: 'Tax mitigation strategies for family offices: Key considerations when structuring multi-generational wealth. Always consult with your tax advisor.',
    timestamp: '4 hours ago',
    likes: 28,
    comments: 5,
  },
  {
    id: '3',
    author: 'Emily Watson',
    authorCompany: 'NonProfit Ventures',
    content: 'Formed a new Donor Advised Fund to support education initiatives. The DAF structure provides excellent flexibility for charitable giving.',
    timestamp: '6 hours ago',
    likes: 35,
    comments: 12,
  },
  {
    id: '4',
    author: 'David Kim',
    authorCompany: 'SPV Capital',
    content: 'Launching a new SPV for our portfolio company acquisition. The special purpose vehicle structure allows for clean deal execution.',
    timestamp: '8 hours ago',
    likes: 19,
    comments: 3,
  },
  {
    id: '5',
    author: 'Jennifer Martinez',
    authorCompany: 'Trust Advisors',
    content: 'Trust structures for asset protection: Understanding the difference between revocable and irrevocable trusts. Each has its place in estate planning.',
    timestamp: '12 hours ago',
    likes: 56,
    comments: 9,
  },
  {
    id: '6',
    author: 'Robert Thompson',
    authorCompany: 'Fund Formation Group',
    content: 'Fund formation checklist: Legal structure, regulatory compliance, and investor documentation. Getting these right from the start saves time and money.',
    timestamp: '1 day ago',
    likes: 31,
    comments: 7,
  },
  {
    id: '7',
    author: 'Lisa Anderson',
    authorCompany: 'Acquisition Partners',
    content: 'Due diligence best practices for acquisitions: Financial, legal, and operational reviews. Never skip the operational due diligence phase.',
    timestamp: '1 day ago',
    likes: 24,
    comments: 4,
  },
  {
    id: '8',
    author: 'James Wilson',
    authorCompany: 'Private Equity Insights',
    content: 'The role of family offices in private equity: How single-family and multi-family offices are reshaping the investment landscape.',
    timestamp: '2 days ago',
    likes: 67,
    comments: 15,
  },
  {
    id: '9',
    author: 'Amanda Lee',
    authorCompany: 'Tax Strategy Group',
    content: 'Tax-efficient structures for international investments: Understanding treaty benefits and withholding tax implications.',
    timestamp: '2 days ago',
    likes: 43,
    comments: 11,
  },
  {
    id: '10',
    author: 'Christopher Brown',
    authorCompany: 'Software Ventures',
    content: 'Our software company just hit $10M ARR! Building a sustainable SaaS business requires focus on customer success and retention.',
    timestamp: '3 days ago',
    likes: 89,
    comments: 22,
  },
  {
    id: '11',
    author: 'Patricia Davis',
    authorCompany: 'Service Organization',
    content: 'Service organizations in the fund space: Providing back-office support, compliance, and administrative services to fund managers.',
    timestamp: '3 days ago',
    likes: 15,
    comments: 2,
  },
  {
    id: '12',
    author: 'Daniel Garcia',
    authorCompany: 'Fund Managers',
    content: 'Fund performance metrics that matter: IRR, MOIC, and TVPI. Understanding these metrics helps investors make informed decisions.',
    timestamp: '4 days ago',
    likes: 52,
    comments: 13,
  },
  {
    id: '13',
    author: 'Michelle White',
    authorCompany: 'Estate Planning Group',
    content: 'Estate planning for high-net-worth individuals: Trusts, foundations, and other structures to preserve and transfer wealth effectively.',
    timestamp: '4 days ago',
    likes: 38,
    comments: 6,
  },
  {
    id: '14',
    author: 'Kevin Johnson',
    authorCompany: 'Investment Advisors',
    content: 'Portfolio construction for family offices: Balancing risk, return, and liquidity needs across multiple asset classes and investment strategies.',
    timestamp: '5 days ago',
    likes: 27,
    comments: 5,
  },
  {
    id: '15',
    author: 'Nicole Taylor',
    authorCompany: 'Compliance Solutions',
    content: 'Regulatory compliance for fund managers: SEC registration, Form ADV, and ongoing reporting requirements. Stay ahead of regulatory changes.',
    timestamp: '5 days ago',
    likes: 34,
    comments: 8,
  },
];

export function FeedScreen() {
  const { theme } = useTheme();
  const { triggerRefresh } = useTabBar();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<any[]>(MOCK_POSTS);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    triggerRefresh(); // Trigger bubble animation reload
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setRefreshing(false);
  }

  function renderItem({ item }: { item: any }) {
    return (
      <View
        style={[
          styles.postCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.postHeader}>
          <View style={styles.authorInfo}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text style={[styles.avatarText, { color: theme.colors.background }]}>
                {item.author.charAt(0)}
              </Text>
            </View>
            <View>
              <Text style={[styles.authorName, { color: theme.colors.text }]}>
                {item.author}
              </Text>
              <Text style={[styles.authorCompany, { color: theme.colors.textSecondary }]}>
                {item.authorCompany}
              </Text>
            </View>
          </View>
          <Text style={[styles.timestamp, { color: theme.colors.textTertiary }]}>
            {item.timestamp}
          </Text>
        </View>
        <Text style={[styles.postText, { color: theme.colors.text }]}>
          {item.content}
        </Text>
        <View
          style={[
            styles.postFooter,
            { borderTopColor: theme.colors.borderLight },
          ]}
        >
          <View style={styles.postAction}>
            <Text style={[styles.actionText, { color: theme.colors.textSecondary }]}>
              ❤️ {item.likes}
            </Text>
          </View>
          <View style={styles.postAction}>
            <Text style={[styles.actionText, { color: theme.colors.textSecondary }]}>
              💬 {item.comments}
            </Text>
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
          <SkeletonCard />
        </View>
      );
    }
    return (
      <EmptyState
        title="No posts yet"
        message="Start following people to see posts in your feed"
      />
    );
  }

  return (
    <SafeAreaView
      edges={[]}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Header
        title="Feed"
        rightSideAction={{
          icon: 'notifications-outline',
          onPress: () => setShowNotificationsModal(true),
        }}
      />
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          posts.length === 0 ? styles.emptyContainer : styles.listContent,
          { paddingBottom: 100 }, // Space for floating tab bar
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  postCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  authorCompany: {
    fontSize: 12,
  },
  timestamp: {
    fontSize: 12,
  },
  postText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
  },
});
