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

export interface ISession {
  movieId: Types.ObjectId | IMovieDocument;
  memberId: Types.ObjectId | IMemberDocument;
  drawnCategory: string;
  exhibitionDate: Date;
  notes: string;
}

export interface ISessionDocument extends Omit<ISession, 'movieId' | 'memberId'>, Document {
  _id: Types.ObjectId;
  movieId: Types.ObjectId | IMovieDocument;
  memberId: Types.ObjectId | IMemberDocument;
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

// ==========================================
// DTOs & Interfaces de População / Retorno
// ==========================================

export interface PopulatedSession {
  _id: string | Types.ObjectId;
  movieId: IMovie;
  memberId: IMember;
  drawnCategory: string;
  exhibitionDate: Date;
  notes: string;
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
}

export interface CreateSessionDTO {
  tmdbId?: number;
  movieData?: {
    tmdbId: number;
    title: string;
    originalTitle: string;
    director: string;
    posterUrl: string;
    releaseYear: number;
    genres: string[];
    runtime: number;
  };
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
  poster_path?: string;
  overview?: string;
  genre_ids?: number[];
  vote_average?: number;
}
