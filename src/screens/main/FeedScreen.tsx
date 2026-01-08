import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useTabBar } from '../../context/TabBarContext';
import { Header } from '../../components/Header';
import { EmptyState } from '../../components/EmptyState';
import { SkeletonCard } from '../../components/Skeleton';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { NotificationsModal } from '../../components/NotificationsModal';
import { WalletModal } from '../../components/WalletModal';
import { UserProfileModal } from '../../components/UserProfileModal';
import { PostCreationModal } from '../../components/PostCreationModal';
import { PostImageGallery } from '../../components/PostImageGallery';
import { PostLikesModal } from '../../components/PostLikesModal';
import { PostCommentsModal } from '../../components/PostCommentsModal';
import { PostMenuPopover } from '../../components/PostMenuPopover';
import { ShareModal } from '../../components/ShareModal';
import { TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchPosts, Post, togglePostLike, deletePost } from '../../services/postService';
import { useAuth } from '@clerk/clerk-expo';
import { getProfile } from '../../services/profileService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MOCK_POSTS = [
  {
    id: '1',
    author: 'Sarah Chen',
    authorCompany: 'Acme Capital',
    content:
      'Just closed our first $50M fund! Excited to start deploying capital into innovative startups. The private equity landscape is evolving rapidly.',
    timestamp: '2 hours ago',
    likes: 42,
    comments: 8,
  },
  {
    id: '2',
    author: 'Michael Rodriguez',
    authorCompany: 'Family Office Partners',
    content:
      'Tax mitigation strategies for family offices: Key considerations when structuring multi-generational wealth. Always consult with your tax advisor.',
    timestamp: '4 hours ago',
    likes: 28,
    comments: 5,
  },
  {
    id: '3',
    author: 'Emily Watson',
    authorCompany: 'NonProfit Ventures',
    content:
      'Formed a new Donor Advised Fund to support education initiatives. The DAF structure provides excellent flexibility for charitable giving.',
    timestamp: '6 hours ago',
    likes: 35,
    comments: 12,
  },
  {
    id: '4',
    author: 'David Kim',
    authorCompany: 'SPV Capital',
    content:
      'Launching a new SPV for our portfolio company acquisition. The special purpose vehicle structure allows for clean deal execution.',
    timestamp: '8 hours ago',
    likes: 19,
    comments: 3,
  },
  {
    id: '5',
    author: 'Jennifer Martinez',
    authorCompany: 'Trust Advisors',
    content:
      'Trust structures for asset protection: Understanding the difference between revocable and irrevocable trusts. Each has its place in estate planning.',
    timestamp: '12 hours ago',
    likes: 56,
    comments: 9,
  },
  {
    id: '6',
    author: 'Robert Thompson',
    authorCompany: 'Fund Formation Group',
    content:
      'Fund formation checklist: Legal structure, regulatory compliance, and investor documentation. Getting these right from the start saves time and money.',
    timestamp: '1 day ago',
    likes: 31,
    comments: 7,
  },
  {
    id: '7',
    author: 'Lisa Anderson',
    authorCompany: 'Acquisition Partners',
    content:
      'Due diligence best practices for acquisitions: Financial, legal, and operational reviews. Never skip the operational due diligence phase.',
    timestamp: '1 day ago',
    likes: 24,
    comments: 4,
  },
  {
    id: '8',
    author: 'James Wilson',
    authorCompany: 'Private Equity Insights',
    content:
      'The role of family offices in private equity: How single-family and multi-family offices are reshaping the investment landscape.',
    timestamp: '2 days ago',
    likes: 67,
    comments: 15,
  },
  {
    id: '9',
    author: 'Amanda Lee',
    authorCompany: 'Tax Strategy Group',
    content:
      'Tax-efficient structures for international investments: Understanding treaty benefits and withholding tax implications.',
    timestamp: '2 days ago',
    likes: 43,
    comments: 11,
  },
  {
    id: '10',
    author: 'Christopher Brown',
    authorCompany: 'Software Ventures',
    content:
      'Our software company just hit $10M ARR! Building a sustainable SaaS business requires focus on customer success and retention.',
    timestamp: '3 days ago',
    likes: 89,
    comments: 22,
  },
  {
    id: '11',
    author: 'Patricia Davis',
    authorCompany: 'Service Organization',
    content:
      'Service organizations in the fund space: Providing back-office support, compliance, and administrative services to fund managers.',
    timestamp: '3 days ago',
    likes: 15,
    comments: 2,
  },
  {
    id: '12',
    author: 'Daniel Garcia',
    authorCompany: 'Fund Managers',
    content:
      'Fund performance metrics that matter: IRR, MOIC, and TVPI. Understanding these metrics helps investors make informed decisions.',
    timestamp: '4 days ago',
    likes: 52,
    comments: 13,
  },
  {
    id: '13',
    author: 'Michelle White',
    authorCompany: 'Estate Planning Group',
    content:
      'Estate planning for high-net-worth individuals: Trusts, foundations, and other structures to preserve and transfer wealth effectively.',
    timestamp: '4 days ago',
    likes: 38,
    comments: 6,
  },
  {
    id: '14',
    author: 'Kevin Johnson',
    authorCompany: 'Investment Advisors',
    content:
      'Portfolio construction for family offices: Balancing risk, return, and liquidity needs across multiple asset classes and investment strategies.',
    timestamp: '5 days ago',
    likes: 27,
    comments: 5,
  },
  {
    id: '15',
    author: 'Nicole Taylor',
    authorCompany: 'Compliance Solutions',
    content:
      'Regulatory compliance for fund managers: SEC registration, Form ADV, and ongoing reporting requirements. Stay ahead of regulatory changes.',
    timestamp: '5 days ago',
    likes: 34,
    comments: 8,
  },
];

export function FeedScreen() {
  const { theme } = useTheme();
  const { triggerRefresh } = useTabBar();
  const { getToken } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showPostCreationModal, setShowPostCreationModal] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'foryou' | 'following'>('foryou');
  const [currentUserProfileId, setCurrentUserProfileId] = useState<string | null>(null);
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [menuAnchorPosition, setMenuAnchorPosition] = useState({ x: 0, y: 0 });
  const [selectedPostForMenu, setSelectedPostForMenu] = useState<Post | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Load current user profile ID on mount
  useEffect(() => {
    loadCurrentUserProfile();
  }, []);

  async function loadCurrentUserProfile() {
    try {
      const token = await getToken();
      if (token) {
        const result = await getProfile(token);
        if (result.success && result.profile?.id) {
          setCurrentUserProfileId(result.profile.id);
        }
      }
    } catch (error: any) {
      console.error('[FeedScreen] Error loading current user profile:', error);
    }
  }

  // Load posts on mount - wait a bit to ensure Clerk is initialized
  useEffect(() => {
    // Add a small delay to ensure Clerk is fully initialized
    const timer = setTimeout(() => {
      loadPosts();
    }, 200);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadPosts() {
    try {
      setLoading(true);
      // Safely get token - handle case where Clerk might not be ready
      let token: string | null = null;
      try {
        token = await getToken();
      } catch (tokenError: any) {
        console.warn('[FeedScreen] Error getting token (non-fatal):', tokenError?.message);
        // Continue without token - posts endpoint might work without auth
      }

      const fetchedPosts = await fetchPosts(50, 0, token || undefined);

      // Filter posts based on active tab
      if (activeTab === 'following') {
        // TODO: Filter to only show posts from users the current user is following
        // For now, show empty array until backend supports following filter
        setPosts([]);
      } else {
        // "For you" - show all public posts
        setPosts(fetchedPosts);
      }
    } catch (error: any) {
      console.error('[FeedScreen] Error loading posts:', error?.message);
      // Fallback to empty array on error
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  // Reload posts when tab changes
  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function onRefresh() {
    setRefreshing(true);
    triggerRefresh(); // Trigger bubble animation reload
    await loadPosts();
    setRefreshing(false);
  }

  const isOwnPost = (post: Post): boolean => {
    return !!(currentUserProfileId && post.authorId === currentUserProfileId);
  };

  async function handleEditPost() {
    if (selectedPostForMenu) {
      setEditingPost(selectedPostForMenu);
      setShowPostCreationModal(true);
    }
  }

  function handleSharePost() {
    if (selectedPostForMenu) {
      setShowShareModal(true);
    }
  }

  async function handleDeletePost() {
    if (!selectedPostForMenu) return;

    try {
      const token = await getToken();
      const success = await deletePost(selectedPostForMenu.id, token || undefined);
      if (success) {
        // Remove post from local state
        setPosts(posts.filter(p => p.id !== selectedPostForMenu.id));
      }
    } catch (error: any) {
      console.error('[FeedScreen] Error deleting post:', error);
    }
  }

  async function handleHidePost() {
    if (!selectedPostForMenu) return;
    // TODO: Implement hide post functionality
    setPosts(posts.filter(p => p.id !== selectedPostForMenu.id));
  }

  async function handleBlockUser() {
    if (!selectedPostForMenu?.authorId) return;
    // TODO: Implement block user functionality
    setPosts(posts.filter(p => p.authorId !== selectedPostForMenu.authorId));
  }

  async function handleReportPost() {
    if (!selectedPostForMenu) return;
    // TODO: Implement report post functionality
    console.log('Report post:', selectedPostForMenu.id);
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
          <TouchableOpacity
            style={styles.authorInfo}
            activeOpacity={0.7}
            onPress={() => {
              // Use authorId from the post
              if (item.authorId) {
                setSelectedUserId(item.authorId);
                setShowUserProfileModal(true);
              }
            }}
          >
            {item.authorProfile?.avatar ? (
              <Image source={{ uri: item.authorProfile.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
                <Text style={[styles.avatarText, { color: theme.colors.background }]}>
                  {item.author.charAt(0)}
                </Text>
              </View>
            )}
            <View>
              <Text style={[styles.authorName, { color: theme.colors.text }]}>{item.author}</Text>
              <Text style={[styles.authorCompany, { color: theme.colors.textSecondary }]}>
                {item.authorCompany}
              </Text>
            </View>
          </TouchableOpacity>
          <View style={styles.postHeaderRight}>
            <Text style={[styles.timestamp, { color: theme.colors.textTertiary }]}>
              {item.timestamp}
            </Text>
            {isOwnPost(item) && (
              <View
                ref={ref => {
                  if (ref) {
                    (item as any)._ellipsisRef = ref;
                  }
                }}
              >
                <TouchableOpacity
                  style={styles.ellipsisButton}
                  onPress={() => {
                    // Only show menu for user's own posts
                    const ref = (item as any)._ellipsisRef;
                    if (ref) {
                      ref.measureInWindow((x: number, y: number, width: number, height: number) => {
                        setMenuAnchorPosition({ x: x + width, y: y });
                        setSelectedPostForMenu(item);
                        setShowPostMenu(true);
                      });
                    } else {
                      // Fallback: estimate position
                      setMenuAnchorPosition({ x: SCREEN_WIDTH - 50, y: 100 });
                      setSelectedPostForMenu(item);
                      setShowPostMenu(true);
                    }
                  }}
                >
                  <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        {item.content ? (
          <Text style={[styles.postText, { color: theme.colors.text }]}>{item.content}</Text>
        ) : null}
        {item.images && item.images.length > 0 && <PostImageGallery images={item.images} />}
        <View style={[styles.postFooter, { borderTopColor: theme.colors.borderLight }]}>
          <TouchableOpacity
            style={styles.postAction}
            onPress={async () => {
              try {
                const token = await getToken();
                const result = await togglePostLike(item.id, token || undefined);
                if (result) {
                  // Update local state optimistically
                  setPosts(prevPosts =>
                    prevPosts.map(post =>
                      post.id === item.id
                        ? {
                            ...post,
                            isLiked: result.liked,
                            likes: result.liked ? post.likes + 1 : Math.max(0, post.likes - 1),
                          }
                        : post
                    )
                  );
                }
              } catch (error: any) {
                console.error('[FeedScreen] Error toggling like:', error);
              }
            }}
          >
            <Ionicons
              name={item.isLiked ? 'heart' : 'heart-outline'}
              size={20}
              color={item.isLiked ? theme.colors.error : theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.actionText,
                {
                  color: item.isLiked ? theme.colors.error : theme.colors.textSecondary,
                  marginLeft: 4,
                },
              ]}
            >
              {item.likes}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.postAction}
            onPress={() => {
              setSelectedPostId(item.id);
              setShowCommentsModal(true);
            }}
          >
            <Ionicons name="chatbubble-outline" size={20} color={theme.colors.textSecondary} />
            <Text style={[styles.actionText, { color: theme.colors.textSecondary, marginLeft: 4 }]}>
              {item.comments}
            </Text>
          </TouchableOpacity>
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
      <EmptyState title="No posts yet" message="Start following people to see posts in your feed" />
    );
  }

  return (
    <SafeAreaView
      edges={[]}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Header
        title="Feed"
        leftAction={{
          icon: 'wallet-outline',
          onPress: () => setShowWalletModal(true),
        }}
        rightAction={{
          icon: 'add',
          onPress: () => setShowPostCreationModal(true),
        }}
        rightSideAction={{
          icon: 'notifications-outline',
          onPress: () => setShowNotificationsModal(true),
        }}
      />

      {/* Tabs */}
      <View
        style={[
          styles.tabsContainer,
          {
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'foryou' && {
              borderBottomWidth: 2,
              borderBottomColor: theme.colors.primary,
            },
          ]}
          onPress={() => setActiveTab('foryou')}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'foryou' ? theme.colors.primary : theme.colors.textSecondary,
                fontWeight: activeTab === 'foryou' ? '600' : '400',
              },
            ]}
          >
            For you
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'following' && {
              borderBottomWidth: 2,
              borderBottomColor: theme.colors.primary,
            },
          ]}
          onPress={() => setActiveTab('following')}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === 'following' ? theme.colors.primary : theme.colors.textSecondary,
                fontWeight: activeTab === 'following' ? '600' : '400',
              },
            ]}
          >
            Following
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={item => item.id}
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

      <WalletModal visible={showWalletModal} onClose={() => setShowWalletModal(false)} />

      <NotificationsModal
        visible={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
      />

      {selectedUserId && (
        <UserProfileModal
          visible={showUserProfileModal}
          onClose={() => {
            setShowUserProfileModal(false);
            setSelectedUserId(null);
          }}
          userId={selectedUserId}
        />
      )}

      <PostCreationModal
        visible={showPostCreationModal}
        onClose={() => {
          setShowPostCreationModal(false);
          setEditingPost(null);
        }}
        onComplete={() => {
          loadPosts(); // Refresh posts after creation
          setEditingPost(null);
        }}
        editingPost={editingPost}
      />

      <PostMenuPopover
        visible={showPostMenu}
        onClose={() => {
          setShowPostMenu(false);
          setSelectedPostForMenu(null);
        }}
        anchorPosition={menuAnchorPosition}
        isOwnPost={selectedPostForMenu ? isOwnPost(selectedPostForMenu) : false}
        onEdit={handleEditPost}
        onShare={handleSharePost}
        onDelete={handleDeletePost}
        onHide={handleHidePost}
        onBlock={handleBlockUser}
        onReport={handleReportPost}
      />

      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        post={selectedPostForMenu}
      />

      {selectedPostId && (
        <>
          <PostLikesModal
            visible={showLikesModal}
            onClose={() => {
              setShowLikesModal(false);
              setSelectedPostId(null);
            }}
            postId={selectedPostId}
          />
          <PostCommentsModal
            visible={showCommentsModal}
            onClose={() => {
              setShowCommentsModal(false);
              setSelectedPostId(null);
            }}
            postId={selectedPostId}
          />
        </>
      )}
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
    overflow: 'hidden',
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
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 16,
  },
  postHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ellipsisButton: {
    padding: 4,
  },
});
