export interface DashboardSummary {
  totalEntries: number;
  totalVotes: number;
  totalBudget: number;
  budgetCurrency: string;
  totalComments: number;
  totalLocations: number;
  totalInvestmentInterests: number;
  publishedEntries: number;
}

export interface TopVotedEntry {
  id: string;
  title: string;
  slug: string;
  voteCount: number;
  authorName: string | null;
}

export interface CategoryDistribution {
  name: string;
  slug: string;
  count: number;
  fill?: string;
}

export interface TagFrequency {
  name: string;
  slug: string;
  count: number;
  weight: number;
}

export interface ActivityEvent {
  id: string;
  type: "create" | "vote" | "comment" | "budget" | "investment";
  description: string;
  entityId: string;
  entityTitle: string;
  userName: string | null;
  timestamp: string;
}

export interface TrendPoint {
  date: string;
  count: number;
}

export interface TrendsData {
  entriesOverTime: TrendPoint[];
  votesOverTime: TrendPoint[];
}

export interface DashboardData {
  summary: DashboardSummary;
  topVoted: TopVotedEntry[];
  categoryDistribution: CategoryDistribution[];
  tagCloud: TagFrequency[];
  activityFeed: ActivityEvent[];
  trends: TrendsData;
}
