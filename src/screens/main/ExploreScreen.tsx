import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  FlatList,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useTabBar } from '../../context/TabBarContext';
import { Header } from '../../components/Header';
import { EmptyState } from '../../components/EmptyState';
import { SkeletonCard } from '../../components/Skeleton';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { BlurredModalOverlay } from '../../components/BlurredModalOverlay';
import { LinearGradient } from 'expo-linear-gradient';
import { NotificationsModal } from '../../components/NotificationsModal';

const TOPICS = [
  'Private Equity',
  'Family Offices',
  'Non-Profits',
  'Tax Mitigation',
  'Acquisitions',
  'Fund Formations',
  'SPVs',
  'Trust Structures',
  'Estate Planning',
  'Wealth Management',
  'Venture Capital',
  'Real Estate',
  'Hedge Funds',
  'Private Credit',
  'Infrastructure',
  'Commodities',
  'Cryptocurrency',
  'ESG Investing',
  'Impact Investing',
  'Angel Investing',
  'M&A Advisory',
  'Due Diligence',
  'Portfolio Management',
  'Risk Management',
  'Compliance',
  'Regulatory Affairs',
  'Fund Administration',
  'Investor Relations',
  'Capital Raising',
  'Deal Structuring',
  'Asset Allocation',
  'Diversification',
  'Market Analysis',
  'Financial Modeling',
  'Valuation',
  'Exit Strategies',
  'Succession Planning',
  'Philanthropy',
  'Charitable Giving',
  'Donor Advised Funds',
  'Foundations',
  'Trust Administration',
  'Tax Planning',
  'International Tax',
  'Transfer Pricing',
  'Estate Tax',
  'Gift Tax',
  'Generation Skipping',
  'Asset Protection',
  'Business Succession',
];

const MOCK_ARTICLES = [
  {
    id: '1',
    title: 'Understanding Private Equity Fund Structures',
    description: 'A comprehensive guide to structuring private equity funds, including LP/GP relationships, fee structures, and regulatory considerations.',
    content: 'Private equity funds are investment vehicles that pool capital from limited partners (LPs) to invest in private companies. The general partner (GP) manages the fund and makes investment decisions. Key considerations include management fees (typically 2% of committed capital), carried interest (usually 20% of profits), and the fund\'s investment period and term. Regulatory compliance varies by jurisdiction, with SEC registration required for funds with over $150M in assets under management.',
    topic: 'Private Equity',
    author: 'Sarah Chen',
    date: '2024-01-15',
    readTime: '5 min',
  },
  {
    id: '2',
    title: 'Family Office Best Practices',
    description: 'Essential strategies for managing multi-generational wealth through family office structures.',
    content: 'Family offices serve as private wealth management advisory firms that handle investments and financial planning for ultra-high-net-worth families. Single-family offices (SFOs) serve one family, while multi-family offices (MFOs) serve multiple families. Key functions include investment management, tax planning, estate planning, philanthropy, and family governance. Successful family offices balance investment returns with family values and long-term legacy goals.',
    topic: 'Family Offices',
    author: 'Michael Rodriguez',
    date: '2024-01-14',
    readTime: '7 min',
  },
  {
    id: '3',
    title: 'Tax Mitigation Strategies for High Net Worth',
    description: 'Advanced tax planning techniques for preserving wealth across generations.',
    content: 'Effective tax mitigation requires a comprehensive approach combining multiple strategies. These include charitable giving through Donor Advised Funds (DAFs), estate planning with trusts, tax-loss harvesting, qualified opportunity zone investments, and international tax planning. Each strategy must be tailored to the individual\'s specific circumstances, risk tolerance, and long-term goals. Regular review with tax advisors is essential as tax laws evolve.',
    topic: 'Tax Mitigation',
    author: 'Emily Watson',
    date: '2024-01-13',
    readTime: '6 min',
  },
  {
    id: '4',
    title: 'SPV Formation for Acquisitions',
    description: 'How to structure Special Purpose Vehicles for clean deal execution.',
    content: 'Special Purpose Vehicles (SPVs) are legal entities created for a specific transaction or purpose. In acquisitions, SPVs provide liability protection, tax efficiency, and deal flexibility. Key considerations include jurisdiction selection, capital structure, and regulatory compliance. SPVs can be structured as corporations, LLCs, or partnerships depending on tax and legal requirements. Proper documentation and governance are critical for maintaining the SPV\'s legal separation from the parent entity.',
    topic: 'Acquisitions',
    author: 'David Kim',
    date: '2024-01-12',
    readTime: '4 min',
  },
  {
    id: '5',
    title: 'Fund Formation Checklist',
    description: 'A step-by-step guide to launching your first investment fund.',
    content: 'Fund formation requires careful planning across multiple dimensions. Legal structure selection (LLC, LP, or corporation) impacts tax treatment and investor relations. Regulatory requirements include SEC registration for larger funds, state securities law compliance, and potential CFTC registration for commodity pools. Key documents include the Private Placement Memorandum (PPM), Limited Partnership Agreement (LPA), and subscription documents. Operational considerations include fund administration, accounting, and investor reporting systems.',
    topic: 'Fund Formations',
    author: 'Jennifer Martinez',
    date: '2024-01-11',
    readTime: '8 min',
  },
  {
    id: '6',
    title: 'Trust Structures for Asset Protection',
    description: 'Understanding revocable vs irrevocable trusts and their applications.',
    content: 'Trusts are powerful estate planning tools that provide asset protection, tax benefits, and control over asset distribution. Revocable trusts allow the grantor to maintain control and make changes, while irrevocable trusts provide stronger asset protection and tax benefits but limit flexibility. Common trust types include revocable living trusts, irrevocable life insurance trusts (ILITs), grantor retained annuity trusts (GRATs), and charitable remainder trusts. Selection depends on goals, tax situation, and family dynamics.',
    topic: 'Trust Structures',
    author: 'Robert Thompson',
    date: '2024-01-10',
    readTime: '6 min',
  },
  {
    id: '7',
    title: 'Due Diligence Best Practices',
    description: 'Comprehensive due diligence framework for acquisitions and investments.',
    content: 'Effective due diligence requires a systematic approach across financial, legal, operational, and strategic dimensions. Financial due diligence includes reviewing historical financials, projections, working capital requirements, and debt structure. Legal due diligence covers contracts, intellectual property, regulatory compliance, and litigation. Operational due diligence examines management team, systems, processes, and culture. Strategic due diligence assesses market position, competitive dynamics, and growth opportunities.',
    topic: 'Due Diligence',
    author: 'Lisa Anderson',
    date: '2024-01-09',
    readTime: '9 min',
  },
  {
    id: '8',
    title: 'Estate Planning Fundamentals',
    description: 'Core concepts for preserving and transferring wealth effectively.',
    content: 'Estate planning involves creating a comprehensive plan for managing and distributing assets during life and after death. Key components include wills, trusts, powers of attorney, healthcare directives, and beneficiary designations. Tax considerations include estate tax, gift tax, and generation-skipping transfer tax. Strategies like annual gifting, charitable giving, and trust structures can minimize tax exposure. Regular review and updates are essential as family circumstances and tax laws change.',
    topic: 'Estate Planning',
    author: 'James Wilson',
    date: '2024-01-08',
    readTime: '7 min',
  },
  {
    id: '9',
    title: 'Donor Advised Funds Explained',
    description: 'How DAFs provide flexibility for charitable giving.',
    content: 'Donor Advised Funds (DAFs) are charitable giving vehicles that offer tax benefits and flexibility. Contributions are immediately tax-deductible, and assets can grow tax-free while the donor recommends grants to charities over time. DAFs are simpler and less expensive than private foundations, with lower minimum contribution requirements. They provide anonymity options and can accept various asset types including appreciated securities. DAFs are managed by sponsoring organizations like community foundations or financial institutions.',
    topic: 'Donor Advised Funds',
    author: 'Amanda Lee',
    date: '2024-01-07',
    readTime: '5 min',
  },
  {
    id: '10',
    title: 'Portfolio Construction for Family Offices',
    description: 'Balancing risk, return, and liquidity across asset classes.',
    content: 'Family office portfolio construction requires balancing multiple objectives including capital preservation, growth, income generation, and liquidity needs. Asset allocation typically includes public equities, fixed income, private equity, real estate, hedge funds, and alternative investments. Diversification across geographies, sectors, and investment styles helps manage risk. Liquidity planning is critical, with sufficient reserves for operating expenses and opportunities. Regular rebalancing and risk monitoring ensure the portfolio stays aligned with family goals.',
    topic: 'Portfolio Management',
    author: 'Christopher Brown',
    date: '2024-01-06',
    readTime: '8 min',
  },
  {
    id: '11',
    title: 'M&A Integration Strategies',
    description: 'Post-acquisition integration best practices for successful deals.',
    content: 'Successful M&A integration requires careful planning and execution across people, processes, and systems. Cultural integration is often the most challenging aspect, requiring clear communication, shared values, and respect for both organizations. Operational integration involves combining systems, processes, and facilities while maintaining business continuity. Financial integration includes accounting system consolidation, reporting alignment, and performance tracking. Early wins and quick decisions help build momentum and reduce uncertainty.',
    topic: 'Acquisitions',
    author: 'Patricia Davis',
    date: '2024-01-05',
    readTime: '6 min',
  },
  {
    id: '12',
    title: 'Regulatory Compliance for Fund Managers',
    description: 'Navigating SEC requirements and ongoing reporting obligations.',
    content: 'Fund managers face complex regulatory requirements that vary by fund size, structure, and investment strategy. SEC registration is required for funds with over $150M in assets, while smaller funds may qualify for exemptions. Registered investment advisers must file Form ADV, maintain compliance programs, and adhere to fiduciary duties. Ongoing requirements include annual updates, custody rule compliance, and marketing rule adherence. State securities laws also apply, requiring careful coordination across jurisdictions.',
    topic: 'Compliance',
    author: 'Daniel Garcia',
    date: '2024-01-04',
    readTime: '7 min',
  },
  {
    id: '13',
    title: 'Valuation Methods for Private Companies',
    description: 'Understanding different valuation approaches and when to use them.',
    content: 'Private company valuation requires different approaches than public companies due to lack of market pricing. Common methods include discounted cash flow (DCF), comparable company analysis, precedent transactions, and asset-based valuation. DCF models project future cash flows and discount them to present value. Comparable analysis uses public company multiples adjusted for size, growth, and risk differences. Precedent transactions analyze similar M&A deals. Selection depends on company stage, industry, and purpose of valuation.',
    topic: 'Valuation',
    author: 'Michelle White',
    date: '2024-01-03',
    readTime: '6 min',
  },
  {
    id: '14',
    title: 'Succession Planning Essentials',
    description: 'Preparing for leadership transitions in family businesses.',
    content: 'Effective succession planning ensures smooth leadership transitions while preserving family harmony and business value. Key steps include identifying potential successors, providing training and development, establishing clear governance structures, and creating transition timelines. Family dynamics must be carefully managed, with open communication and fair processes. Legal structures like trusts and buy-sell agreements can facilitate transitions. External advisors can provide objectivity and expertise throughout the process.',
    topic: 'Succession Planning',
    author: 'Kevin Johnson',
    date: '2024-01-02',
    readTime: '5 min',
  },
  {
    id: '15',
    title: 'International Tax Planning',
    description: 'Strategies for cross-border investments and tax efficiency.',
    content: 'International tax planning requires understanding tax treaties, transfer pricing rules, and foreign tax credits. Key considerations include entity structure, jurisdiction selection, and repatriation strategies. Tax treaties can reduce withholding taxes on dividends, interest, and royalties. Transfer pricing rules require arm\'s-length pricing for intercompany transactions. Foreign tax credits can offset U.S. tax on foreign income. BEPS (Base Erosion and Profit Shifting) initiatives have increased compliance requirements globally.',
    topic: 'International Tax',
    author: 'Nicole Taylor',
    date: '2024-01-01',
    readTime: '8 min',
  },
  {
    id: '16',
    title: 'Real Estate Investment Structures',
    description: 'SPVs, REITs, and other vehicles for real estate investing.',
    content: 'Real estate investments can be structured through various vehicles depending on objectives. Direct ownership provides full control but requires active management. Real Estate Investment Trusts (REITs) offer liquidity and diversification but limited control. Limited partnerships provide passive investment with liability protection. Delaware Statutory Trusts (DSTs) enable 1031 exchanges for tax deferral. Special Purpose Vehicles (SPVs) can isolate risk for specific properties. Selection depends on investment size, risk tolerance, tax situation, and management preferences.',
    topic: 'Real Estate',
    author: 'Thomas Anderson',
    date: '2023-12-31',
    readTime: '7 min',
  },
  {
    id: '17',
    title: 'Hedge Fund Strategies Overview',
    description: 'Understanding different hedge fund investment approaches.',
    content: 'Hedge funds employ diverse strategies to generate returns regardless of market direction. Long/short equity funds take both long and short positions. Event-driven strategies focus on mergers, bankruptcies, and other corporate events. Global macro funds trade based on economic trends. Relative value strategies exploit pricing inefficiencies. Distressed debt funds invest in troubled companies. Each strategy has different risk-return profiles, liquidity terms, and fee structures. Due diligence is critical given limited transparency.',
    topic: 'Hedge Funds',
    author: 'Rachel Green',
    date: '2023-12-30',
    readTime: '6 min',
  },
  {
    id: '18',
    title: 'ESG Investing Framework',
    description: 'Integrating environmental, social, and governance factors.',
    content: 'ESG investing considers environmental, social, and governance factors alongside financial returns. Environmental factors include climate change, pollution, and resource use. Social factors cover labor practices, community relations, and product safety. Governance factors examine board composition, executive compensation, and shareholder rights. Integration approaches range from negative screening to impact investing. Measurement and reporting standards are evolving, with frameworks like SASB, GRI, and TCFD providing guidance.',
    topic: 'ESG Investing',
    author: 'William Park',
    date: '2023-12-29',
    readTime: '7 min',
  },
  {
    id: '19',
    title: 'Venture Capital Fundraising',
    description: 'Best practices for raising capital from institutional LPs.',
    content: 'Venture capital fundraising requires demonstrating track record, team strength, and market opportunity. Key materials include pitch deck, fund terms, and track record documentation. Target LPs include pension funds, endowments, family offices, and high-net-worth individuals. Fund terms like management fees, carry, and key person provisions are negotiated. Fundraising cycles typically take 6-12 months. Building relationships with LPs before fundraising is crucial. Transparency and communication throughout the process build trust.',
    topic: 'Capital Raising',
    author: 'Sophia Martinez',
    date: '2023-12-28',
    readTime: '6 min',
  },
  {
    id: '20',
    title: 'Asset Protection Strategies',
    description: 'Legal structures to shield assets from creditors and lawsuits.',
    content: 'Asset protection involves legal strategies to shield assets from potential creditors while remaining compliant with fraudulent transfer laws. Common structures include domestic asset protection trusts (DAPTs), offshore trusts, family limited partnerships (FLPs), and LLCs. Timing is critical - structures must be established before claims arise. Jurisdiction selection matters, with some states offering stronger protections. Insurance remains the first line of defense. Asset protection must be coordinated with estate planning and tax strategies.',
    topic: 'Asset Protection',
    author: 'Benjamin Clark',
    date: '2023-12-27',
    readTime: '5 min',
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = 8;
const CARD_WIDTH = (SCREEN_WIDTH - 32 - CARD_MARGIN) / 2; // 32 for padding, divided by 2 columns

export function ExploreScreen() {
  const { theme, isDark } = useTheme();
  const { triggerRefresh } = useTabBar();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [articles, setArticles] = useState<any[]>(MOCK_ARTICLES);
  const [showTopicsModal, setShowTopicsModal] = useState(false);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'readTime'>('date');
  const [filterTopic, setFilterTopic] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const filteredAndSortedArticles = useMemo(() => {
    let filtered = articles;
    
    if (filterTopic) {
      filtered = filtered.filter((article) => article.topic === filterTopic);
    }
    
    if (selectedTopic) {
      filtered = filtered.filter((article) => article.topic === selectedTopic);
    }

    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(searchLower) ||
          article.description.toLowerCase().includes(searchLower) ||
          article.content.toLowerCase().includes(searchLower) ||
          article.topic.toLowerCase().includes(searchLower) ||
          article.author.toLowerCase().includes(searchLower)
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'readTime':
          return parseInt(a.readTime) - parseInt(b.readTime);
        default:
          return 0;
      }
    });

    return sorted;
  }, [articles, selectedTopic, filterTopic, sortBy, searchText]);

  async function onRefresh() {
    setRefreshing(true);
    triggerRefresh();
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setRefreshing(false);
  }

  function handleArticlePress(article: any) {
    setSelectedArticle(article);
    setShowArticleModal(true);
  }

  function renderTopic(topic: string, isModal = false) {
    const isSelected = selectedTopic === topic || filterTopic === topic;
    return (
      <TouchableOpacity
        key={topic}
        style={[
          isModal ? styles.modalTopicChip : styles.topicChip,
          {
            backgroundColor: isSelected
              ? theme.colors.primary
              : theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
        onPress={() => {
          if (isModal) {
            setFilterTopic(filterTopic === topic ? null : topic);
            setShowTopicsModal(false);
          } else {
            setSelectedTopic(isSelected ? null : topic);
          }
        }}
      >
        <Text
          style={[
            isModal ? styles.modalTopicText : styles.topicText,
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

  function renderArticle({ item, index, key }: { item: any; index: number; key?: string }) {
    return (
      <TouchableOpacity
        key={key}
        style={[
          styles.articleCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            width: CARD_WIDTH,
            marginLeft: index % 2 === 0 ? 0 : CARD_MARGIN,
          },
        ]}
        onPress={() => handleArticlePress(item)}
      >
        <Text style={[styles.articleTitle, { color: theme.colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text
          style={[styles.articleDescription, { color: theme.colors.textSecondary }]}
          numberOfLines={3}
        >
          {item.description}
        </Text>
        <View style={styles.articleMeta}>
          <Text style={[styles.articleTopic, { color: theme.colors.primary }]}>
            {item.topic}
          </Text>
          <Text style={[styles.articleReadTime, { color: theme.colors.textTertiary }]}>
            {item.readTime}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
      <SafeAreaView
        edges={[]}
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Header
          title="Explore"
          rightSideAction={{
            icon: 'notifications-outline',
            onPress: () => setShowNotificationsModal(true),
          }}
        />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.topicsScrollContent}
          >
            {TOPICS.slice(0, 15).map((topic) => (
              <React.Fragment key={topic}>
                {renderTopic(topic, false)}
              </React.Fragment>
            ))}
            <TouchableOpacity
              style={[
                styles.topicChip,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => setShowTopicsModal(true)}
            >
              <Text style={[styles.topicText, { color: theme.colors.text }]}>
                View All
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.articlesSection}>
          <View style={styles.articlesHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Tips & Tricks
            </Text>
            <View style={styles.sortFilterContainer}>
              <TouchableOpacity
                style={[
                  styles.searchButton,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => {
                  setShowSearch(true);
                }}
              >
                <Ionicons name="search" size={16} color={theme.colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => {
                  const options = ['date', 'title', 'readTime'];
                  const currentIndex = options.indexOf(sortBy);
                  const nextIndex = (currentIndex + 1) % options.length;
                  setSortBy(options[nextIndex] as 'date' | 'title' | 'readTime');
                }}
              >
                <Ionicons name="swap-vertical" size={16} color={theme.colors.text} />
                <Text style={[styles.sortButtonText, { color: theme.colors.text }]}>
                  {sortBy === 'date' ? 'Date' : sortBy === 'title' ? 'Title' : 'Read Time'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {searchText.trim() && (
            <View style={styles.searchTermContainer}>
              <Text style={[styles.searchTermText, { color: theme.colors.textSecondary }]}>
                "{searchText}"
              </Text>
            </View>
          )}
          {loading ? (
            <View>
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : filteredAndSortedArticles.length === 0 ? (
            <EmptyState
              title="No articles yet"
              message="Browse topics to discover helpful content"
            />
          ) : (
            <View style={styles.masonryContainer}>
              {filteredAndSortedArticles.map((article, index) =>
                renderArticle({ item: article, index, key: article.id })
              )}
            </View>
          )}
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Sticky Search Bar - appears above keyboard */}
      {showSearch && (
        <>
          <TouchableOpacity
            style={styles.searchOverlay}
            activeOpacity={1}
            onPress={() => {
              setShowSearch(false);
              setSearchText('');
              Keyboard.dismiss();
            }}
          />
          <View
            style={[
              styles.stickySearchBar,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                bottom: keyboardVisible ? keyboardHeight : insets.bottom,
              },
            ]}
          >
            <Ionicons name="search" size={20} color={theme.colors.textTertiary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Search articles..."
              placeholderTextColor={theme.colors.textTertiary}
              value={searchText}
              onChangeText={setSearchText}
              autoFocus
            />
            {searchText.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchText('')}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color={theme.colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </>
      )}

      {/* Topics Modal */}
      <Modal
        visible={showTopicsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTopicsModal(false)}
      >
        <BlurredModalOverlay
          visible={showTopicsModal}
          onClose={() => setShowTopicsModal(false)}
        >
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
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                All Topics
              </Text>
              <TouchableOpacity onPress={() => setShowTopicsModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={[
                styles.modalTopicsList,
                { paddingBottom: insets.bottom * 2 },
              ]}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.masonryTopicsContainer}>
                {TOPICS.map((topic) => (
                  <React.Fragment key={topic}>
                    {renderTopic(topic, true)}
                  </React.Fragment>
                ))}
              </View>
            </ScrollView>
          </View>
        </BlurredModalOverlay>
      </Modal>

      {/* Article Modal */}
      <Modal
        visible={showArticleModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowArticleModal(false)}
      >
        <BlurredModalOverlay
          visible={showArticleModal}
          onClose={() => setShowArticleModal(false)}
        >
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
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {selectedArticle?.title}
              </Text>
              <TouchableOpacity onPress={() => setShowArticleModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={[
                styles.articleModalContent,
                { paddingBottom: insets.bottom * 2 },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {selectedArticle && (
                <>
                  <View style={styles.articleModalMeta}>
                    <Text style={[styles.articleModalAuthor, { color: theme.colors.textSecondary }]}>
                      By {selectedArticle.author}
                    </Text>
                    <Text style={[styles.articleModalDate, { color: theme.colors.textTertiary }]}>
                      {new Date(selectedArticle.date).toLocaleDateString()} • {selectedArticle.readTime}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.articleModalTopic,
                      { backgroundColor: theme.colors.primary + '20' },
                    ]}
                  >
                    <Text style={[styles.articleModalTopicText, { color: theme.colors.primary }]}>
                      {selectedArticle.topic}
                    </Text>
                  </View>
                  <Text style={[styles.articleModalText, { color: theme.colors.text }]}>
                    {selectedArticle.content}
                  </Text>
                </>
              )}
            </ScrollView>
          </View>
        </BlurredModalOverlay>
      </Modal>

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
  keyboardAvoid: {
    flex: 1,
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
  topicsScrollContent: {
    paddingRight: 16,
  },
  topicChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    marginRight: 4,
    alignSelf: 'flex-start',
  },
  topicText: {
    fontSize: 11,
    fontWeight: '500',
  },
  articlesSection: {
    marginBottom: 16,
  },
  articlesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sortFilterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  searchButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  searchTermContainer: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  searchTermText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  searchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 998,
  },
  stickySearchBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  masonryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -CARD_MARGIN / 2,
  },
  articleCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 22,
  },
  articleDescription: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  articleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  articleTopic: {
    fontSize: 10,
    fontWeight: '600',
  },
  articleReadTime: {
    fontSize: 10,
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: 650,
    width: '100%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    position: 'relative',
  },
  modalHeaderGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    zIndex: -1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    zIndex: 1,
    flex: 1,
    marginRight: 8,
  },
  modalBody: {
    flexGrow: 1,
    flexShrink: 1,
  },
  modalTopicsList: {
    padding: 16,
  },
  masonryTopicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  modalTopicChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    margin: 4,
    alignSelf: 'flex-start',
  },
  modalTopicText: {
    fontSize: 14,
    fontWeight: '500',
  },
  articleModalContent: {
    padding: 16,
  },
  articleModalMeta: {
    marginBottom: 16,
  },
  articleModalAuthor: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  articleModalDate: {
    fontSize: 12,
  },
  articleModalTopic: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  articleModalTopicText: {
    fontSize: 12,
    fontWeight: '600',
  },
  articleModalText: {
    fontSize: 16,
    lineHeight: 24,
  },
});
