import axios from 'axios';
import { IMovie, TMDBMovieSearchItem } from '../types/index.js';

const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

export class TMDBService {
  /**
   * Executa a chamada HTTP ao TMDB com suporte inteligente a Bearer Token e API Key
   */
  private async fetchTMDB(endpoint: string, params: Record<string, any> = {}) {
    const token = process.env.TMDB_TOKEN;
    const apiKey = process.env.TMDB_API_KEY;

    const requestParams = {
      language: 'pt-BR',
      include_adult: false,
      ...params,
    };

    // Tenta primeiro com Bearer Token caso configurado
    if (token) {
      try {
        const res = await axios.get(`${TMDB_BASE_URL}${endpoint}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: 'application/json',
          },
          params: requestParams,
          timeout: 8000,
        });
        return res.data;
      } catch (err: any) {
        // Se falhar a autenticação Bearer mas tiver API Key, faz fallback para api_key
        if (!apiKey) throw err;
      }
    }

    // Fallback ou padrão com API Key v3
    if (apiKey) {
      const res = await axios.get(`${TMDB_BASE_URL}${endpoint}`, {
        headers: { accept: 'application/json' },
        params: {
          ...requestParams,
          api_key: apiKey,
        },
        timeout: 8000,
      });
      return res.data;
    }

    throw new Error('Nenhuma chave ou token de autorização do TMDB configurado no .env.');
  }

  /**
   * Pesquisa filmes na API oficial do TMDB por termo de busca em português (pt-BR)
   */
  async searchMovies(query: string): Promise<TMDBMovieSearchItem[]> {
    if (!query || query.trim().length === 0) return [];

    try {
      const data = await this.fetchTMDB('/search/movie', {
        query: query.trim(),
      });

      return (data.results || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        original_title: item.original_title,
        release_date: item.release_date || '',
        poster_path: item.poster_path || null,
        overview: item.overview || '',
        genre_ids: item.genre_ids || [],
        vote_average: item.vote_average || 0,
      }));
    } catch (err: any) {
      console.error('[TMDBService.searchMovies] Erro ao consultar TMDB:', err.response?.data || err.message);
      throw new Error(`Falha ao buscar filmes no TMDB: ${err.response?.data?.status_message || err.message}`);
    }
  }

  /**
   * Busca detalhes completos do filme (diretor, gêneros, duração) no TMDB em pt-BR
   */
  async getMovieDetails(tmdbId: number): Promise<IMovie> {
    try {
      const [details, credits] = await Promise.all([
        this.fetchTMDB(`/movie/${tmdbId}`),
        this.fetchTMDB(`/movie/${tmdbId}/credits`),
      ]);

      const directorObj = (credits.crew || []).find((c: any) => c.job === 'Director');
      const director = directorObj ? directorObj.name : 'Desconhecido';
      const genres = (details.genres || []).map((g: any) => g.name);
      const releaseYear = details.release_date
        ? new Date(details.release_date).getFullYear()
        : new Date().getFullYear();

      return {
        tmdbId: details.id,
        title: details.title,
        originalTitle: details.original_title || details.title,
        director,
        posterUrl: details.poster_path ? `${TMDB_IMAGE_BASE}${details.poster_path}` : '',
        releaseYear,
        genres,
        runtime: details.runtime || 0,
      };
    } catch (err: any) {
      console.error('[TMDBService.getMovieDetails] Erro ao obter detalhes do TMDB:', err.response?.data || err.message);
      throw new Error(`Falha ao obter detalhes do filme no TMDB: ${err.message}`);
    }
  }
}

export const tmdbService = new TMDBService();
