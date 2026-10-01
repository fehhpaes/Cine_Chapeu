export interface Member {
  _id: string;
  name: string;
  active: boolean;
  avatarUrl?: string;
  createdAt?: string;
}

export interface Movie {
  _id?: string;
  tmdbId: number;
  title: string;
  originalTitle: string;
  director: string;
  posterUrl: string;
  releaseYear: number;
  genres: string[];
  runtime: number;
}

export type SessionTier = string;

export interface TierRow {
  name: string;
  color: string;
  order: number;
}

export interface TierConfig {
  rows: TierRow[];
}

export interface CustomTierItem {
  id: string;
  title: string;
  imageUrl?: string;
  tier: string;
}

export interface CustomPeriod {
  _id: string;
  name: string;
  year: number;
  startDate: string;
  endDate: string;
  createdAt?: string;
}

export interface Session {
  _id: string;
  movieId: Movie;
  memberId: Member;
  drawnCategory: string;
  exhibitionDate: string;
  notes: string;
  tier?: string;
  createdAt?: string;
}

export interface Award {
  _id: string;
  year: number;
  categoryName: string;
  nominees: Session[];
  winner: Session;
  createdAt?: string;
}

export interface OscarCeremony {
  _id?: string;
  year: number;
  votingStartDate: string;
  votingEndDate: string;
}

export interface VoteSelection {
  awardId: string;
  sessionId: string;
}

export interface Vote {
  _id?: string;
  year: number;
  memberId: string | Member;
  selections: VoteSelection[];
  feedback?: string;
  createdAt?: string;
}

export interface NomineeVoteStats {
  session: Session;
  voteCount: number;
  percentage: number;
  isWinner: boolean;
}

export interface CategoryVoteStats {
  awardId: string;
  categoryName: string;
  totalCategoryVotes: number;
  winnerSessionId?: string;
  nominees: NomineeVoteStats[];
}

export interface MemberFeedback {
  memberId: string;
  memberName: string;
  feedback: string;
  createdAt: string;
}

export interface PresenterDashboardData {
  year: number;
  totalVotes: number;
  totalSessionsInYear: number;
  totalDistinctMembersInYear: number;
  categories: CategoryVoteStats[];
  feedbacks: MemberFeedback[];
}

export interface FilterOptions {
  categories: string[];
  years: number[];
}

export interface TMDBMovieSearchItem {
  id: number;
  title: string;
  original_title: string;
  release_date?: string;
  poster_path?: string | null;
  overview?: string;
  vote_average?: number;
}
