import { Types, Document } from 'mongoose';

// ==========================================
// Entidades do Domínio (TypeScript Interfaces)
// ==========================================

export interface IMember {
  name: string;
  active: boolean;
  avatarUrl: string;
  createdAt?: Date;
}

export interface IMemberDocument extends IMember, Document {
  _id: Types.ObjectId;
}

export interface IMovie {
  tmdbId: number;
  title: string;
  originalTitle: string;
  director: string;
  posterUrl: string;
  releaseYear: number;
  genres: string[];
  runtime: number; // em minutos
}

export interface IMovieDocument extends IMovie, Document {
  _id: Types.ObjectId;
}

export type SessionTier = string;

export interface ITierRow {
  name: string;
  color: string;
  order: number;
}

export interface ITierConfig {
  rows: ITierRow[];
}

export interface ITierConfigDocument extends ITierConfig, Document {
  _id: Types.ObjectId;
}

export interface ISession {
  movieId: Types.ObjectId | IMovieDocument;
  memberId: Types.ObjectId | IMemberDocument;
  drawnCategory: string;
  exhibitionDate: Date;
  notes: string;
  tier?: string;
}

export interface ISessionDocument extends Omit<ISession, 'movieId' | 'memberId'>, Document {
  _id: Types.ObjectId;
  movieId: Types.ObjectId | IMovieDocument;
  memberId: Types.ObjectId | IMemberDocument;
  tier: string;
}

export interface IAward {
  year: number;
  categoryName: string;
  nominees: (Types.ObjectId | ISessionDocument)[];
  winner: Types.ObjectId | ISessionDocument;
}

export interface IAwardDocument extends Omit<IAward, 'nominees' | 'winner'>, Document {
  _id: Types.ObjectId;
  nominees: (Types.ObjectId | ISessionDocument)[];
  winner: Types.ObjectId | ISessionDocument;
}

export interface ICustomPeriod {
  name: string;
  year: number;
  startDate: Date;
  endDate: Date;
}

export interface ICustomPeriodDocument extends ICustomPeriod, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOscarCeremony {
  year: number;
  votingStartDate: Date;
  votingEndDate: Date;
}

export interface IOscarCeremonyDocument extends IOscarCeremony, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVoteSelection {
  awardId: Types.ObjectId;
  sessionId: Types.ObjectId;
}

export interface IVote {
  year: number;
  memberId: Types.ObjectId;
  selections: IVoteSelection[];
  feedback?: string;
}

export interface IVoteDocument extends IVote, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// DTOs & Interfaces de População / Retorno
// ==========================================

export interface NomineeVoteStats {
  session: PopulatedSession;
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
  createdAt: Date;
}

export interface PresenterDashboardData {
  year: number;
  totalVotes: number;
  totalSessionsInYear: number;
  totalDistinctMembersInYear: number;
  categories: CategoryVoteStats[];
  feedbacks: MemberFeedback[];
}

export interface PopulatedSession {
  _id: string | Types.ObjectId;
  movieId: IMovie;
  memberId: IMember;
  drawnCategory: string;
  exhibitionDate: Date;
  notes: string;
  tier?: string;
}

export interface PopulatedAward {
  _id: string | Types.ObjectId;
  year: number;
  categoryName: string;
  nominees: PopulatedSession[];
  winner: PopulatedSession;
}

export interface SessionFilterQuery {
  movieTitle?: string;
  memberId?: string;
  year?: string | number;
  category?: string;
  startDate?: string | Date;
  endDate?: string | Date;
}

export interface MoviePayloadDTO {
  tmdbId: number;
  title: string;
  originalTitle?: string;
  posterUrl?: string;
  releaseYear: number;
  director?: string;
  genres?: string[];
  runtime?: number;
}

export interface CreateSessionDTO {
  movie?: MoviePayloadDTO;
  tmdbId?: number;
  memberId: string;
  drawnCategory: string;
  exhibitionDate: string | Date;
  notes?: string;
}

export interface TMDBMovieSearchItem {
  id: number;
  title: string;
  original_title: string;
  release_date?: string;
  poster_path?: string | null;
  overview?: string;
  genre_ids?: number[];
  vote_average?: number;
}
