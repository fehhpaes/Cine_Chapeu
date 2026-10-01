import axios from 'axios';
import { IMovie, TMDBMovieSearchItem } from '../types/index.js';

const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

export class TMDBService {
  /**
   * Pesquisa filmes no TMDB por termo de busca
   */
  async searchMovies(query: string): Promise<TMDBMovieSearchItem[]> {
    if (!query || query.trim().length === 0) return [];

    if (TMDB_API_KEY && TMDB_API_KEY !== 'your_tmdb_api_key_here') {
      try {
        const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
          params: {
            api_key: TMDB_API_KEY,
            query: query.trim(),
            language: 'pt-BR',
            include_adult: false,
          },
          timeout: 5000,
        });

        return (response.data.results || []).map((item: any) => ({
          id: item.id,
          title: item.title,
          original_title: item.original_title,
          release_date: item.release_date,
          poster_path: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : '',
          overview: item.overview,
          genre_ids: item.genre_ids,
          vote_average: item.vote_average,
        }));
      } catch (err: any) {
        console.warn('[TMDBService] Falha ao consultar TMDB API externa, usando fallback:', err.message);
      }
    }

    // Fallback de demonstração offline / sem chave TMDB configurada
    return this.getMockSearchResults(query);
  }

  /**
   * Busca detalhes completos do filme (diretor, gêneros, duração)
   */
  async getMovieDetails(tmdbId: number): Promise<IMovie> {
    if (TMDB_API_KEY && TMDB_API_KEY !== 'your_tmdb_api_key_here') {
      try {
        const [detailsRes, creditsRes] = await Promise.all([
          axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
            params: { api_key: TMDB_API_KEY, language: 'pt-BR' },
          }),
          axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}/credits`, {
            params: { api_key: TMDB_API_KEY, language: 'pt-BR' },
          }),
        ]);

        const details = detailsRes.data;
        const credits = creditsRes.data;

        const directorObj = (credits.crew || []).find((c: any) => c.job === 'Director');
        const director = directorObj ? directorObj.name : 'Desconhecido';
        const genres = (details.genres || []).map((g: any) => g.name);
        const releaseYear = details.release_date ? new Date(details.release_date).getFullYear() : new Date().getFullYear();

        return {
          tmdbId: details.id,
          title: details.title,
          originalTitle: details.original_title || details.title,
          director,
          posterUrl: details.poster_path ? `${TMDB_IMAGE_BASE}${details.poster_path}` : '',
          releaseYear,
          genres,
          runtime: details.runtime || 120,
        };
      } catch (err: any) {
        console.warn('[TMDBService] Falha ao obter detalhes do TMDB, usando fallback:', err.message);
      }
    }

    return this.getMockMovieDetails(tmdbId);
  }

  private getMockSearchResults(query: string): TMDBMovieSearchItem[] {
    const database: TMDBMovieSearchItem[] = [
      {
        id: 27205,
        title: 'A Origem',
        original_title: 'Inception',
        release_date: '2010-07-16',
        poster_path: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
        overview: 'Um ladrão que invade os sonhos das pessoas para roubar segredos corporativos.',
        vote_average: 8.4,
      },
      {
        id: 157336,
        title: 'Interestelar',
        original_title: 'Interstellar',
        release_date: '2014-11-05',
        poster_path: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
        overview: 'Uma equipe de exploradores viaja através de um buraco de minhoca no espaço.',
        vote_average: 8.6,
      },
      {
        id: 496243,
        title: 'Parasita',
        original_title: 'Gisaengchung',
        release_date: '2019-05-30',
        poster_path: 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
        overview: 'Toda a família de Ki-taek está desempregada, vivendo num porão sujo.',
        vote_average: 8.5,
      },
      {
        id: 77,
        title: 'Amnésia',
        original_title: 'Memento',
        release_date: '2000-10-11',
        poster_path: 'https://image.tmdb.org/t/p/w500/yuNs09hvpHVU1cBTCAk9z9L2AhW.jpg',
        overview: 'Leonard sofre de perda de memória recente e investiga o assassinato de sua esposa.',
        vote_average: 8.2,
      },
      {
        id: 603,
        title: 'Matrix',
        original_title: 'The Matrix',
        release_date: '1999-03-30',
        poster_path: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
        overview: 'Um hacker descobre a chocante verdade sobre sua realidade simulada.',
        vote_average: 8.2,
      },
      {
        id: 155,
        title: 'Batman: O Cavaleiro das Trevas',
        original_title: 'The Dark Knight',
        release_date: '2008-07-16',
        poster_path: 'https://image.tmdb.org/t/p/w500/i0xD490z4mQKLg1g7v7g3xLhC2B.jpg',
        overview: 'Batman enfrenta o Coringa em uma batalha pelo destino de Gotham City.',
        vote_average: 8.5,
      },
      {
        id: 680,
        title: 'Pulp Fiction: Tempo de Violência',
        original_title: 'Pulp Fiction',
        release_date: '1994-09-10',
        poster_path: 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
        overview: 'Histórias interligadas de criminosos de Los Angeles.',
        vote_average: 8.5,
      },
      {
        id: 120467,
        title: 'O Grande Hotel Budapeste',
        original_title: 'The Grand Budapest Hotel',
        release_date: '2014-02-26',
        poster_path: 'https://image.tmdb.org/t/p/w500/nX5XotM9yprCKarRH4rl2Ngz1Wn.jpg',
        overview: 'As aventuras de Gustave H, um lendário concierge em um famoso hotel europeu.',
        vote_average: 8.1,
      }
    ];

    const q = query.toLowerCase();
    const filtered = database.filter(
      (m) => m.title.toLowerCase().includes(q) || m.original_title.toLowerCase().includes(q)
    );

    return filtered.length > 0 ? filtered : database.slice(0, 4);
  }

  private getMockMovieDetails(tmdbId: number): IMovie {
    const lookup: Record<number, IMovie> = {
      27205: {
        tmdbId: 27205,
        title: 'A Origem',
        originalTitle: 'Inception',
        director: 'Christopher Nolan',
        posterUrl: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
        releaseYear: 2010,
        genres: ['Ficção Científica', 'Ação', 'Aventura'],
        runtime: 148,
      },
      157336: {
        tmdbId: 157336,
        title: 'Interestelar',
        originalTitle: 'Interstellar',
        director: 'Christopher Nolan',
        posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
        releaseYear: 2014,
        genres: ['Ficção Científica', 'Drama', 'Aventura'],
        runtime: 169,
      },
      496243: {
        tmdbId: 496243,
        title: 'Parasita',
        originalTitle: 'Gisaengchung',
        director: 'Bong Joon-ho',
        posterUrl: 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
        releaseYear: 2019,
        genres: ['Drama', 'Comédia', 'Suspense'],
        runtime: 132,
      },
    };

    if (lookup[tmdbId]) return lookup[tmdbId];

    return {
      tmdbId,
      title: 'Filme Selecionado',
      originalTitle: 'Selected Movie',
      director: 'Diretor Renomado',
      posterUrl: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
      releaseYear: 2024,
      genres: ['Cinema', 'Drama'],
      runtime: 120,
    };
  }
}

export const tmdbService = new TMDBService();
