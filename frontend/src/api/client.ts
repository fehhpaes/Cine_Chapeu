import axios from 'axios';
import { Member, Session, Award, FilterOptions, TMDBMovieSearchItem } from '../types/index.ts';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
});

export const membersApi = {
  getAll: async (): Promise<Member[]> => {
    const res = await api.get<{ success: boolean; data: Member[] }>('/members');
    return res.data.data;
  },
  getActive: async (): Promise<Member[]> => {
    const res = await api.get<{ success: boolean; data: Member[] }>('/members/active');
    return res.data.data;
  },
  drawRandom: async (): Promise<{ member: Member; message: string }> => {
    const res = await api.get<{ success: boolean; message: string; data: Member }>('/members/draw');
    return { member: res.data.data, message: res.data.message };
  },
  create: async (data: { name: string; avatarUrl?: string }): Promise<Member> => {
    const res = await api.post<{ success: boolean; data: Member }>('/members', data);
    return res.data.data;
  },
  toggleActive: async (id: string): Promise<Member> => {
    const res = await api.patch<{ success: boolean; data: Member }>(`/members/${id}/toggle`);
    return res.data.data;
  },
};

export const sessionsApi = {
  getAll: async (params?: {
    movieTitle?: string;
    memberId?: string;
    year?: string | number;
    category?: string;
  }): Promise<Session[]> => {
    const res = await api.get<{ success: boolean; count: number; data: Session[] }>('/sessions', {
      params,
    });
    return res.data.data;
  },
  getFilterOptions: async (): Promise<FilterOptions> => {
    const res = await api.get<{ success: boolean; data: FilterOptions }>('/sessions/filter-options');
    return res.data.data;
  },
  searchTMDB: async (query: string): Promise<TMDBMovieSearchItem[]> => {
    const res = await api.get<{ success: boolean; data: TMDBMovieSearchItem[] }>('/sessions/tmdb-search', {
      params: { q: query },
    });
    return res.data.data;
  },
  create: async (payload: {
    tmdbId: number;
    memberId: string;
    drawnCategory: string;
    exhibitionDate: string;
    notes?: string;
  }): Promise<Session> => {
    const res = await api.post<{ success: boolean; data: Session }>('/sessions', payload);
    return res.data.data;
  },
};

export const awardsApi = {
  getYears: async (): Promise<number[]> => {
    const res = await api.get<{ success: boolean; data: number[] }>('/awards/years');
    return res.data.data;
  },
  getByYear: async (year: number): Promise<Award[]> => {
    const res = await api.get<{ success: boolean; data: Award[]; year: number }>(`/awards/${year}`);
    return res.data.data;
  },
};

export default api;
