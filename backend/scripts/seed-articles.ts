// Load environment variables FIRST, before any other imports
// Use require to ensure this runs before imports are processed
const dotenv = require('dotenv');
const path = require('path');

// When running from backend/ directory, process.cwd() is backend/
// So we need to go up one level to get to project root
const rootEnvPath = path.resolve(process.cwd(), '..', '.env');
const backendEnvPath = path.resolve(process.cwd(), '.env');

// Load environment variables - try root first, then backend
console.log('Loading .env from:', rootEnvPath);
const rootResult = dotenv.config({ path: rootEnvPath });
if (rootResult.error) {
  console.log('Root .env not found, trying backend/.env');
  dotenv.config({ path: backendEnvPath });
}

// Verify env vars are loaded
if (!process.env.SUPABASE_URL && !process.env.EXPO_PUBLIC_SUPABASE_URL) {
  console.error('ERROR: SUPABASE_URL not found in environment variables');
  console.error('Please ensure .env file exists in the project root with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Now import supabase after env vars are loaded
import { supabase } from '../src/config/supabase';

// Mock articles data from ExploreScreen.tsx
const MOCK_ARTICLES = [
  {
    id: '1',
    title: 'Understanding Private Equity Fund Structures',
    description:
      'A comprehensive guide to structuring private equity funds, including LP/GP relationships, fee structures, and regulatory considerations.',
    content:
      "Private equity funds are investment vehicles that pool capital from limited partners (LPs) to invest in private companies. The general partner (GP) manages the fund and makes investment decisions. Key considerations include management fees (typically 2% of committed capital), carried interest (usually 20% of profits), and the fund's investment period and term. Regulatory compliance varies by jurisdiction, with SEC registration required for funds with over $150M in assets under management.",
    topic: 'Private Equity',
    author: 'Sarah Chen',
    date: '2024-01-15',
    readTime: '5 min',
  },
  {
    id: '2',
    title: 'Family Office Best Practices',
    description: 'Essential strategies for managing multi-generational wealth through family office structures.',
    content:
      'Family offices serve as private wealth management advisory firms that handle investments and financial planning for ultra-high-net-worth families. Single-family offices (SFOs) serve one family, while multi-family offices (MFOs) serve multiple families. Key functions include investment management, tax planning, estate planning, philanthropy, and family governance. Successful family offices balance investment returns with family values and long-term legacy goals.',
    topic: 'Family Offices',
    author: 'Michael Rodriguez',
    date: '2024-01-14',
    readTime: '7 min',
  },
  {
    id: '3',
    title: 'Tax Mitigation Strategies for High Net Worth',
    description: 'Advanced tax planning techniques for preserving wealth across generations.',
    content:
      "Effective tax mitigation requires a comprehensive approach combining multiple strategies. These include charitable giving through Donor Advised Funds (DAFs), estate planning with trusts, tax-loss harvesting, qualified opportunity zone investments, and international tax planning. Each strategy must be tailored to the individual's specific circumstances, risk tolerance, and long-term goals. Regular review with tax advisors is essential as tax laws evolve.",
    topic: 'Tax Mitigation',
    author: 'Emily Watson',
    date: '2024-01-13',
    readTime: '6 min',
  },
  {
    id: '4',
    title: 'SPV Formation for Acquisitions',
    description: 'How to structure Special Purpose Vehicles for clean deal execution.',
    content:
      'Special Purpose Vehicles (SPVs) are legal entities created for a specific transaction or purpose. In acquisitions, SPVs provide liability protection, tax efficiency, and deal flexibility. Key considerations include jurisdiction selection, capital structure, and regulatory compliance. SPVs can be structured as corporations, LLCs, or partnerships depending on tax and legal requirements. Proper documentation and governance are critical for maintaining the SPV\'s legal separation from the parent entity.',
    topic: 'Acquisitions',
    author: 'David Kim',
    date: '2024-01-12',
    readTime: '4 min',
  },
  {
    id: '5',
    title: 'Fund Formation Checklist',
    description: 'A step-by-step guide to launching your first investment fund.',
    content:
      'Fund formation requires careful planning across multiple dimensions. Legal structure selection (LLC, LP, or corporation) impacts tax treatment and investor relations. Regulatory requirements include SEC registration for larger funds, state securities law compliance, and potential CFTC registration for commodity pools. Key documents include the Private Placement Memorandum (PPM), Limited Partnership Agreement (LPA), and subscription documents. Operational considerations include fund administration, accounting, and investor reporting systems.',
    topic: 'Fund Formations',
    author: 'Jennifer Martinez',
    date: '2024-01-11',
    readTime: '8 min',
  },
  {
    id: '6',
    title: 'Trust Structures for Asset Protection',
    description: 'Understanding revocable vs irrevocable trusts and their applications.',
    content:
      'Trusts are powerful estate planning tools that provide asset protection, tax benefits, and control over asset distribution. Revocable trusts allow the grantor to maintain control and make changes, while irrevocable trusts provide stronger asset protection and tax benefits but limit flexibility. Common trust types include revocable living trusts, irrevocable life insurance trusts (ILITs), grantor retained annuity trusts (GRATs), and charitable remainder trusts. Selection depends on goals, tax situation, and family dynamics.',
    topic: 'Trust Structures',
    author: 'Robert Thompson',
    date: '2024-01-10',
    readTime: '6 min',
  },
  {
    id: '7',
    title: 'Due Diligence Best Practices',
    description: 'Comprehensive due diligence framework for acquisitions and investments.',
    content:
      'Effective due diligence requires a systematic approach across financial, legal, operational, and strategic dimensions. Financial due diligence includes reviewing historical financials, projections, working capital requirements, and debt structure. Legal due diligence covers contracts, intellectual property, regulatory compliance, and litigation. Operational due diligence examines management team, systems, processes, and culture. Strategic due diligence assesses market position, competitive dynamics, and growth opportunities.',
    topic: 'Due Diligence',
    author: 'Lisa Anderson',
    date: '2024-01-09',
    readTime: '9 min',
  },
  {
    id: '8',
    title: 'Estate Planning Fundamentals',
    description: 'Core concepts for preserving and transferring wealth effectively.',
    content:
      'Estate planning involves creating a comprehensive plan for managing and distributing assets during life and after death. Key components include wills, trusts, powers of attorney, healthcare directives, and beneficiary designations. Tax considerations include estate tax, gift tax, and generation-skipping transfer tax. Strategies like annual gifting, charitable giving, and trust structures can minimize tax exposure. Regular review and updates are essential as family circumstances and tax laws change.',
    topic: 'Estate Planning',
    author: 'James Wilson',
    date: '2024-01-08',
    readTime: '7 min',
  },
  {
    id: '9',
    title: 'Donor Advised Funds Explained',
    description: 'How DAFs provide flexibility for charitable giving.',
    content:
      'Donor Advised Funds (DAFs) are charitable giving vehicles that offer tax benefits and flexibility. Contributions are immediately tax-deductible, and assets can grow tax-free while the donor recommends grants to charities over time. DAFs are simpler and less expensive than private foundations, with lower minimum contribution requirements. They provide anonymity options and can accept various asset types including appreciated securities. DAFs are managed by sponsoring organizations like community foundations or financial institutions.',
    topic: 'Donor Advised Funds',
    author: 'Amanda Lee',
    date: '2024-01-07',
    readTime: '5 min',
  },
  {
    id: '10',
    title: 'Portfolio Construction for Family Offices',
    description: 'Balancing risk, return, and liquidity across asset classes.',
    content:
      'Family office portfolio construction requires balancing multiple objectives including capital preservation, growth, income generation, and liquidity needs. Asset allocation typically includes public equities, fixed income, private equity, real estate, hedge funds, and alternative investments. Diversification across geographies, sectors, and investment styles helps manage risk. Liquidity planning is critical, with sufficient reserves for operating expenses and opportunities. Regular rebalancing and risk monitoring ensure the portfolio stays aligned with family goals.',
    topic: 'Portfolio Management',
    author: 'Christopher Brown',
    date: '2024-01-06',
    readTime: '8 min',
  },
  {
    id: '11',
    title: 'M&A Integration Strategies',
    description: 'Post-acquisition integration best practices for successful deals.',
    content:
      'Successful M&A integration requires careful planning and execution across people, processes, and systems. Cultural integration is often the most challenging aspect, requiring clear communication, shared values, and respect for both organizations. Operational integration involves combining systems, processes, and facilities while maintaining business continuity. Financial integration includes accounting system consolidation, reporting alignment, and performance tracking. Early wins and quick decisions help build momentum and reduce uncertainty.',
    topic: 'Acquisitions',
    author: 'Patricia Davis',
    date: '2024-01-05',
    readTime: '6 min',
  },
  {
    id: '12',
    title: 'Regulatory Compliance for Fund Managers',
    description: 'Navigating SEC requirements and ongoing reporting obligations.',
    content:
      'Fund managers face complex regulatory requirements that vary by fund size, structure, and investment strategy. SEC registration is required for funds with over $150M in assets, while smaller funds may qualify for exemptions. Registered investment advisers must file Form ADV, maintain compliance programs, and adhere to fiduciary duties. Ongoing requirements include annual updates, custody rule compliance, and marketing rule adherence. State securities laws also apply, requiring careful coordination across jurisdictions.',
    topic: 'Compliance',
    author: 'Daniel Garcia',
    date: '2024-01-04',
    readTime: '7 min',
  },
  {
    id: '13',
    title: 'Valuation Methods for Private Companies',
    description: 'Understanding different valuation approaches and when to use them.',
    content:
      'Private company valuation requires different approaches than public companies due to lack of market pricing. Common methods include discounted cash flow (DCF), comparable company analysis, precedent transactions, and asset-based valuation. DCF models project future cash flows and discount them to present value. Comparable analysis uses public company multiples adjusted for size, growth, and risk differences. Precedent transactions analyze similar M&A deals. Selection depends on company stage, industry, and purpose of valuation.',
    topic: 'Valuation',
    author: 'Michelle White',
    date: '2024-01-03',
    readTime: '6 min',
  },
  {
    id: '14',
    title: 'Succession Planning Essentials',
    description: 'Preparing for leadership transitions in family businesses.',
    content:
      'Effective succession planning ensures smooth leadership transitions while preserving family harmony and business value. Key steps include identifying potential successors, providing training and development, establishing clear governance structures, and creating transition timelines. Family dynamics must be carefully managed, with open communication and fair processes. Legal structures like trusts and buy-sell agreements can facilitate transitions. External advisors can provide objectivity and expertise throughout the process.',
    topic: 'Succession Planning',
    author: 'Kevin Johnson',
    date: '2024-01-02',
    readTime: '5 min',
  },
  {
    id: '15',
    title: 'International Tax Planning',
    description: 'Strategies for cross-border investments and tax efficiency.',
    content:
      "International tax planning requires understanding tax treaties, transfer pricing rules, and foreign tax credits. Key considerations include entity structure, jurisdiction selection, and repatriation strategies. Tax treaties can reduce withholding taxes on dividends, interest, and royalties. Transfer pricing rules require arm's-length pricing for intercompany transactions. Foreign tax credits can offset U.S. tax on foreign income. BEPS (Base Erosion and Profit Shifting) initiatives have increased compliance requirements globally.",
    topic: 'International Tax',
    author: 'Nicole Taylor',
    date: '2024-01-01',
    readTime: '8 min',
  },
  {
    id: '16',
    title: 'Real Estate Investment Structures',
    description: 'SPVs, REITs, and other vehicles for real estate investing.',
    content:
      'Real estate investments can be structured through various vehicles depending on objectives. Direct ownership provides full control but requires active management. Real Estate Investment Trusts (REITs) offer liquidity and diversification but limited control. Limited partnerships provide passive investment with liability protection. Delaware Statutory Trusts (DSTs) enable 1031 exchanges for tax deferral. Special Purpose Vehicles (SPVs) can isolate risk for specific properties. Selection depends on investment size, risk tolerance, tax situation, and management preferences.',
    topic: 'Real Estate',
    author: 'Thomas Anderson',
    date: '2023-12-31',
    readTime: '7 min',
  },
  {
    id: '17',
    title: 'Hedge Fund Strategies Overview',
    description: 'Understanding different hedge fund investment approaches.',
    content:
      'Hedge funds employ diverse strategies to generate returns regardless of market direction. Long/short equity funds take both long and short positions. Event-driven strategies focus on mergers, bankruptcies, and other corporate events. Global macro funds trade based on economic trends. Relative value strategies exploit pricing inefficiencies. Distressed debt funds invest in troubled companies. Each strategy has different risk-return profiles, liquidity terms, and fee structures. Due diligence is critical given limited transparency.',
    topic: 'Hedge Funds',
    author: 'Rachel Green',
    date: '2023-12-30',
    readTime: '6 min',
  },
  {
    id: '18',
    title: 'ESG Investing Framework',
    description: 'Integrating environmental, social, and governance factors.',
    content:
      'ESG investing considers environmental, social, and governance factors alongside financial returns. Environmental factors include climate change, pollution, and resource use. Social factors cover labor practices, community relations, and product safety. Governance factors examine board composition, executive compensation, and shareholder rights. Integration approaches range from negative screening to impact investing. Measurement and reporting standards are evolving, with frameworks like SASB, GRI, and TCFD providing guidance.',
    topic: 'ESG Investing',
    author: 'William Park',
    date: '2023-12-29',
    readTime: '7 min',
  },
  {
    id: '19',
    title: 'Venture Capital Fundraising',
    description: 'Best practices for raising capital from institutional LPs.',
    content:
      'Venture capital fundraising requires demonstrating track record, team strength, and market opportunity. Key materials include pitch deck, fund terms, and track record documentation. Target LPs include pension funds, endowments, family offices, and high-net-worth individuals. Fund terms like management fees, carry, and key person provisions are negotiated. Fundraising cycles typically take 6-12 months. Building relationships with LPs before fundraising is crucial. Transparency and communication throughout the process build trust.',
    topic: 'Capital Raising',
    author: 'Sophia Martinez',
    date: '2023-12-28',
    readTime: '6 min',
  },
  {
    id: '20',
    title: 'Asset Protection Strategies',
    description: 'Legal structures to shield assets from creditors and lawsuits.',
    content:
      'Asset protection involves legal strategies to shield assets from potential creditors while remaining compliant with fraudulent transfer laws. Common structures include domestic asset protection trusts (DAPTs), offshore trusts, family limited partnerships (FLPs), and LLCs. Timing is critical - structures must be established before claims arise. Jurisdiction selection matters, with some states offering stronger protections. Insurance remains the first line of defense. Asset protection must be coordinated with estate planning and tax strategies.',
    topic: 'Asset Protection',
    author: 'Benjamin Clark',
    date: '2023-12-27',
    readTime: '5 min',
  },
];

async function seedArticles() {
  console.log('Starting article seeding...');

  try {
    // Extract unique topics and insert them into article_topics table
    const uniqueTopics = Array.from(new Set(MOCK_ARTICLES.map((article) => article.topic)));

    console.log('Inserting topics...');
    for (const topicName of uniqueTopics) {
      const { error: topicError } = await supabase.from('article_topics').upsert(
        { name: topicName },
        {
          onConflict: 'name',
          ignoreDuplicates: false,
        }
      );

      if (topicError) {
        console.error(`Error inserting topic "${topicName}":`, topicError);
      } else {
        console.log(`Topic "${topicName}" inserted/updated`);
      }
    }

    // Insert articles
    console.log('Inserting articles...');
    for (const article of MOCK_ARTICLES) {
      const { data, error } = await supabase
        .from('articles')
        .upsert(
          {
            id: article.id,
            title: article.title,
            description: article.description,
            content: article.content,
            topic: article.topic,
            author: article.author,
            date: article.date,
            read_time: article.readTime,
          },
          {
            onConflict: 'id',
            ignoreDuplicates: false,
          }
        )
        .select();

      if (error) {
        console.error(`Error inserting article "${article.title}":`, error);
      } else {
        console.log(`Article "${article.title}" inserted/updated`);
      }
    }

    console.log('Article seeding complete!');
    console.log(`Inserted ${MOCK_ARTICLES.length} articles and ${uniqueTopics.length} topics`);
  } catch (error) {
    console.error('Error seeding articles:', error);
    process.exit(1);
  }
}

seedArticles()
  .then(() => {
    console.log('Seeding script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding script failed:', error);
    process.exit(1);
  });
