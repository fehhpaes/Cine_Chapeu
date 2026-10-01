import { Session } from '../models/Session.js';
import { Movie } from '../models/Movie.js';
import { tmdbService } from './tmdbService.js';
import { CreateSessionDTO, PopulatedSession, SessionFilterQuery } from '../types/index.js';

export class SessionService {
  /**
   * Cria ou atualiza o filme no cache de Movies e registra a nova Session vinculada
   */
  async createSession(data: CreateSessionDTO): Promise<PopulatedSession> {
    let movieId = '';

    // Se forneceu tmdbId, obtém detalhes e salva/atualiza no cache
    if (data.tmdbId) {
      let movie = await Movie.findOne({ tmdbId: data.tmdbId });

      if (!movie) {
        const details = await tmdbService.getMovieDetails(data.tmdbId);
        movie = await Movie.create(details);
      }
      movieId = movie._id.toString();
    } else if (data.movieData) {
      // Caso dados customizados sejam fornecidos diretamente
      let movie = await Movie.findOne({ tmdbId: data.movieData.tmdbId });
      if (!movie) {
        movie = await Movie.create(data.movieData);
      } else {
        Object.assign(movie, data.movieData);
        await movie.save();
      }
      movieId = movie._id.toString();
    } else {
      throw new Error('tmdbId ou movieData é obrigatório para cadastrar a sessão.');
    }

    const session = new Session({
      movieId,
      memberId: data.memberId,
      drawnCategory: data.drawnCategory,
      exhibitionDate: new Date(data.exhibitionDate),
      notes: data.notes || '',
    });

    const saved = await session.save();

    const populated = await Session.findById(saved._id)
      .populate('movieId')
      .populate('memberId')
      .lean();

    return populated as unknown as PopulatedSession;
  }

  /**
   * Lista todas as sessões com filtros dinâmicos:
   * - nome do filme (movieTitle)
   * - membro responsável (memberId)
   * - ano de exibição (year)
   * - categoria sorteada (category)
   */
  async getSessions(filters: SessionFilterQuery): Promise<PopulatedSession[]> {
    const query: any = {};

    // Filtro por categoria sorteada
    if (filters.category && filters.category.trim() !== '') {
      query.drawnCategory = { $regex: new RegExp(filters.category.trim(), 'i') };
    }

    // Filtro por membro responsável
    if (filters.memberId && filters.memberId.trim() !== '') {
      query.memberId = filters.memberId;
    }

    // Filtro por ano de exibição da sessão
    if (filters.year) {
      const yearNum = typeof filters.year === 'string' ? parseInt(filters.year, 10) : filters.year;
      if (!isNaN(yearNum)) {
        const startOfYear = new Date(yearNum, 0, 1);
        const endOfYear = new Date(yearNum, 11, 31, 23, 59, 59, 999);
        query.exhibitionDate = { $gte: startOfYear, $lte: endOfYear };
      }
    }

    // Se houver filtro por título de filme, encontramos os IDs dos filmes correspondentes
    if (filters.movieTitle && filters.movieTitle.trim() !== '') {
      const matchedMovies = await Movie.find({
        $or: [
          { title: { $regex: new RegExp(filters.movieTitle.trim(), 'i') } },
          { originalTitle: { $regex: new RegExp(filters.movieTitle.trim(), 'i') } },
        ],
      }).select('_id');

      const movieIds = matchedMovies.map((m) => m._id);
      query.movieId = { $in: movieIds };
    }

    const sessions = await Session.find(query)
      .populate('movieId')
      .populate('memberId')
      .sort({ exhibitionDate: -1 })
      .lean();

    return sessions as unknown as PopulatedSession[];
  }

  /**
   * Retorna lista de categorias e anos únicos para popular opções de filtro
   */
  async getFilterOptions(): Promise<{ categories: string[]; years: number[] }> {
    const categories = await Session.distinct('drawnCategory');
    const sessions = await Session.find().select('exhibitionDate').lean();
    
    const yearsSet = new Set<number>();
    sessions.forEach((s) => {
      if (s.exhibitionDate) {
        yearsSet.add(new Date(s.exhibitionDate).getFullYear());
      }
    });

    return {
      categories: categories.sort(),
      years: Array.from(yearsSet).sort((a, b) => b - a),
    };
  }

  /**
   * Busca detalhes de uma sessão por ID
   */
  async getSessionById(id: string): Promise<PopulatedSession | null> {
    const session = await Session.findById(id)
      .populate('movieId')
      .populate('memberId')
      .lean();

    return session as unknown as PopulatedSession | null;
  }
}

export const sessionService = new SessionService();
