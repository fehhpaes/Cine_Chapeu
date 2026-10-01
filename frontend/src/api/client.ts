import axios from 'axios';
import {
  Member,
  Session,
  Award,
  FilterOptions,
  TMDBMovieSearchItem,
  TierRow,
  TierConfig,
  CustomPeriod,
  OscarCeremony,
  Vote,
  PresenterDashboardData,
} from '../types/index.ts';

const getBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/$/, '')}/api`;
  }
  return import.meta.env.DEV ? 'http://localhost:5000/api' : '/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
});

// Interceptor para injetar automaticamente o PIN de administrador se salvo no localStorage
api.interceptors.request.use((config) => {
  const pin = localStorage.getItem('admin_pin');
  if (pin) {
    config.headers['x-admin-pin'] = pin;
  }
  return config;
});

export const authApi = {
  verify: async (pin: string): Promise<{ isValid: boolean; message?: string }> => {
    const res = await api.post<{ success: boolean; isValid: boolean; message: string }>('/auth/verify', { pin });
    return { isValid: res.data.isValid, message: res.data.message };
  },
};

export const tmdbApi = {
  search: async (query: string): Promise<TMDBMovieSearchItem[]> => {
    const res = await api.get<{ success: boolean; data: TMDBMovieSearchItem[] }>('/tmdb/search', {
      params: { query },
    });
    return res.data.data;
  },
};

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

export interface CreateSessionPayload {
  movie: {
    tmdbId: number;
    title: string;
    originalTitle?: string;
    posterUrl?: string;
    releaseYear: number;
  };
  memberId: string;
  drawnCategory: string;
  exhibitionDate: string;
  notes?: string;
}

export const sessionsApi = {
  getNext: async (): Promise<Session | null> => {
    const res = await api.get<{ success: boolean; data: Session | null }>('/sessions/next');
    return res.data.data;
  },
  getAll: async (params?: {
    movieTitle?: string;
    memberId?: string;
    year?: string | number;
    category?: string;
    startDate?: string;
    endDate?: string;
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
    return await tmdbApi.search(query);
  },
  create: async (payload: CreateSessionPayload): Promise<Session> => {
    const res = await api.post<{ success: boolean; message: string; data: Session }>('/sessions', payload);
    return res.data.data;
  },
  updateTier: async (id: string, tier: string): Promise<Session> => {
    const res = await api.patch<{ success: boolean; message: string; data: Session }>(`/sessions/${id}/tier`, {
      tier,
    });
    return res.data.data;
  },
};

export interface CreateAwardPayload {
  year: number;
  categoryName: string;
  nominees: string[];
  winner: string;
}

export const awardsApi = {
  getYears: async (): Promise<number[]> => {
    const res = await api.get<{ success: boolean; data: number[] }>('/awards/years');
    return res.data.data;
  },
  getByYear: async (year: number): Promise<Award[]> => {
    const res = await api.get<{ success: boolean; data: Award[]; year: number }>('/awards', {
      params: { year },
    });
    return res.data.data;
  },
  create: async (payload: CreateAwardPayload): Promise<Award> => {
    const res = await api.post<{ success: boolean; message: string; data: Award }>('/awards', payload);
    return res.data.data;
  },
};

export const tierConfigApi = {
  get: async (): Promise<TierConfig> => {
    const res = await api.get<{ success: boolean; data: TierConfig }>('/tierconfig');
    return res.data.data;
  },
  update: async (rows: TierRow[]): Promise<TierConfig> => {
    const res = await api.put<{ success: boolean; message: string; data: TierConfig }>('/tierconfig', {
      rows,
    });
    return res.data.data;
  },
};

export const periodsApi = {
  getByYear: async (year?: number): Promise<CustomPeriod[]> => {
    const res = await api.get<{ success: boolean; data: CustomPeriod[] }>('/periods', {
      params: year ? { year } : {},
    });
    return res.data.data;
  },
  create: async (data: {
    name: string;
    year: number;
    startDate: string;
    endDate: string;
  }): Promise<CustomPeriod> => {
    const res = await api.post<{ success: boolean; message: string; data: CustomPeriod }>('/periods', data);
    return res.data.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/periods/${id}`);
  },
};

export const ceremoniesApi = {
  getActive: async (): Promise<{ ceremony: OscarCeremony | null; isOpen: boolean }> => {
    const res = await api.get<{ success: boolean; data: OscarCeremony | null; isOpen: boolean }>('/ceremonies/active');
    return { ceremony: res.data.data, isOpen: res.data.isOpen };
  },
  getByYear: async (year: number): Promise<OscarCeremony | null> => {
    const res = await api.get<{ success: boolean; data: OscarCeremony | null }>(`/ceremonies/${year}`);
    return res.data.data;
  },
  save: async (data: {
    year: number;
    votingStartDate: string;
    votingEndDate: string;
  }): Promise<OscarCeremony> => {
    const res = await api.post<{ success: boolean; message: string; data: OscarCeremony }>('/ceremonies', data);
    return res.data.data;
  },
};

export const votesApi = {
  submit: async (data: {
    year: number;
    memberId: string;
    selections: { awardId: string; sessionId: string }[];
    feedback?: string;
  }): Promise<Vote> => {
    const res = await api.post<{ success: boolean; message: string; data: Vote }>('/votes', data);
    return res.data.data;
  },
  getMyVote: async (year: number, memberId: string): Promise<{ hasVoted: boolean; data: Vote | null }> => {
    const res = await api.get<{ success: boolean; hasVoted: boolean; data: Vote | null }>('/votes/my-vote', {
      params: { year, memberId },
    });
    return { hasVoted: res.data.hasVoted, data: res.data.data };
  },
};

export const adminApi = {
  getDashboard: async (year?: number): Promise<PresenterDashboardData> => {
    const res = await api.get<{ success: boolean; data: PresenterDashboardData }>('/admin/dashboard', {
      params: year ? { year } : {},
    });
    return res.data.data;
  },
};

export default api;
