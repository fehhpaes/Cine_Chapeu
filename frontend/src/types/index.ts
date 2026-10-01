export interface Member {
  _id: string;
  name: string;
  active: boolean;
  avatarUrl: string;
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

export interface Session {
  _id: string;
  movieId: Movie;
  memberId: Member;
  drawnCategory: string;
  exhibitionDate: string;
  notes: string;
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

export interface FilterOptions {
  categories: string[];
  years: number[];
}

export interface TMDBMovieSearchItem {
  id: number;
  title: string;
  original_title: string;
  release_date?: string;
  poster_path?: string;
  overview?: string;
  vote_average?: number;
}
