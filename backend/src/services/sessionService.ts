import { Session } from '../models/Session.js';
import { Movie } from '../models/Movie.js';
import { tmdbService } from './tmdbService.js';
import { CreateSessionDTO, PopulatedSession, SessionFilterQuery } from '../types/index.js';

export class SessionService {
  /**
   * Busca a próxima sessão agendada (data >= hoje)
   */
  async getNextSession(): Promise<PopulatedSession | null> {
    const now = new Date();
    // Início do dia de hoje (com margem de segurança de fuso horário)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    startOfToday.setDate(startOfToday.getDate() - 1); // Permite sessões de hoje mesmo com timezone UTC

    const nextSession = await Session.findOne({
      exhibitionDate: { $gte: startOfToday },
    })
      .populate('movieId')
      .populate('memberId')
      .sort({ exhibitionDate: 1 })
      .lean();

    return nextSession as unknown as PopulatedSession | null;
  }

  /**
   * Cria ou localiza o filme no banco de dados e registra a nova Session vinculada
   */
  async createSession(data: CreateSessionDTO): Promise<PopulatedSession> {
    const { movie, tmdbId, memberId, drawnCategory, exhibitionDate, notes } = data;

    const targetTmdbId = movie?.tmdbId || tmdbId;

    if (!targetTmdbId) {
      throw new Error('tmdbId ou objeto movie com tmdbId é obrigatório para cadastrar a sessão.');
    }

    if (!memberId || !drawnCategory || !exhibitionDate) {
      throw new Error('memberId, drawnCategory e exhibitionDate são campos obrigatórios.');
    }

    let dbMovie = await Movie.findOne({ tmdbId: targetTmdbId });

    if (!dbMovie) {
      let movieDataToSave = {
        tmdbId: targetTmdbId,
        title: movie?.title || 'Filme sem Título',
        originalTitle: movie?.originalTitle || movie?.title || '',
        director: movie?.director || 'Desconhecido',
        posterUrl: movie?.posterUrl || '',
        releaseYear: movie?.releaseYear || new Date().getFullYear(),
        genres: movie?.genres || [],
        runtime: movie?.runtime || 0,
      };

      try {
        const fullDetails = await tmdbService.getMovieDetails(targetTmdbId);
        movieDataToSave = {
          ...movieDataToSave,
          director: fullDetails.director || movieDataToSave.director,
          genres: fullDetails.genres.length > 0 ? fullDetails.genres : movieDataToSave.genres,
          runtime: fullDetails.runtime || movieDataToSave.runtime,
          posterUrl: fullDetails.posterUrl || movieDataToSave.posterUrl,
          releaseYear: fullDetails.releaseYear || movieDataToSave.releaseYear,
        };
      } catch (err: any) {
        console.warn('[SessionService] Prosseguindo com metadados básicos do filme:', err.message);
      }

      dbMovie = await Movie.create(movieDataToSave);
    }

    const session = new Session({
      movieId: dbMovie._id,
      memberId,
      drawnCategory: drawnCategory.trim(),
      exhibitionDate: new Date(exhibitionDate),
      notes: (notes || '').trim(),
    });

    const saved = await session.save();

    const populated = await Session.findById(saved._id)
      .populate('movieId')
      .populate('memberId')
      .lean();

    return populated as unknown as PopulatedSession;
  }

  /**
   * Lista todas as sessões com filtros dinâmicos
   */
  async getSessions(filters: SessionFilterQuery): Promise<PopulatedSession[]> {
    const query: any = {};

    if (filters.category && filters.category.trim() !== '') {
      query.drawnCategory = { $regex: new RegExp(filters.category.trim(), 'i') };
    }

    if (filters.memberId && filters.memberId.trim() !== '') {
      query.memberId = filters.memberId;
    }

    if (filters.startDate || filters.endDate) {
      query.exhibitionDate = query.exhibitionDate || {};
      if (filters.startDate) {
        query.exhibitionDate.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        if (typeof filters.endDate === 'string' && filters.endDate.length === 10) {
          end.setHours(23, 59, 59, 999);
        }
        query.exhibitionDate.$lte = end;
      }
    } else if (filters.year) {
      const yearNum = typeof filters.year === 'string' ? parseInt(filters.year, 10) : filters.year;
      if (!isNaN(yearNum)) {
        const startOfYear = new Date(yearNum, 0, 1);
        const endOfYear = new Date(yearNum, 11, 31, 23, 59, 59, 999);
        query.exhibitionDate = { $gte: startOfYear, $lte: endOfYear };
      }
    }

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
   * Opções para os selects de filtro
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
   * Busca sessão por ID
   */
  async getSessionById(id: string): Promise<PopulatedSession | null> {
    const session = await Session.findById(id)
      .populate('movieId')
      .populate('memberId')
      .lean();

    return session as unknown as PopulatedSession | null;
  }

  /**
   * Atualiza uma sessão existente (incluindo substituição de filme via TMDB)
   */
  async updateSession(
    id: string,
    updateData: {
      memberId?: string;
      drawnCategory?: string;
      exhibitionDate?: Date | string;
      notes?: string;
      tier?: string;
      tmdbData?: any;
      movie?: any;
      tmdbId?: number;
    }
  ): Promise<PopulatedSession | null> {
    const fieldsToUpdate: any = {};

    // 1. Processa atualização do Filme via TMDB caso fornecido
    const targetTmdbId = updateData.tmdbData?.id || updateData.tmdbId || updateData.movie?.tmdbId;

    if (targetTmdbId) {
      const rawMovie = updateData.tmdbData || updateData.movie;
      const posterPath = rawMovie?.poster_path || rawMovie?.posterUrl;
      const posterUrl = posterPath
        ? (posterPath.startsWith('http') ? posterPath : `https://image.tmdb.org/t/p/w500${posterPath}`)
        : '';

      const releaseYear = rawMovie?.release_date
        ? parseInt(rawMovie.release_date.slice(0, 4), 10)
        : (rawMovie?.releaseYear || new Date().getFullYear());

      let movieDataToSave: any = {
        tmdbId: targetTmdbId,
        title: rawMovie?.title || 'Filme sem Título',
        originalTitle: rawMovie?.original_title || rawMovie?.originalTitle || rawMovie?.title || '',
        director: rawMovie?.director || 'Desconhecido',
        posterUrl,
        releaseYear: isNaN(releaseYear) ? new Date().getFullYear() : releaseYear,
        genres: rawMovie?.genres || [],
        runtime: rawMovie?.runtime || 0,
      };

      try {
        const fullDetails = await tmdbService.getMovieDetails(targetTmdbId);
        movieDataToSave = {
          ...movieDataToSave,
          title: fullDetails.title || movieDataToSave.title,
          originalTitle: fullDetails.originalTitle || movieDataToSave.originalTitle,
          director: fullDetails.director || movieDataToSave.director,
          genres: fullDetails.genres.length > 0 ? fullDetails.genres : movieDataToSave.genres,
          runtime: fullDetails.runtime || movieDataToSave.runtime,
          posterUrl: fullDetails.posterUrl || movieDataToSave.posterUrl,
          releaseYear: fullDetails.releaseYear || movieDataToSave.releaseYear,
        };
      } catch (err: any) {
        console.warn('[SessionService.updateSession] Prosseguindo com dados TMDB fornecidos:', err.message);
      }

      const dbMovie = await Movie.findOneAndUpdate(
        { tmdbId: targetTmdbId },
        { $set: movieDataToSave },
        { upsert: true, new: true, runValidators: true }
      );

      if (dbMovie) {
        fieldsToUpdate.movieId = dbMovie._id;
      }
    }

    if (updateData.memberId) {
      fieldsToUpdate.memberId = updateData.memberId;
    }
    if (updateData.drawnCategory !== undefined) {
      fieldsToUpdate.drawnCategory = updateData.drawnCategory.trim();
    }
    if (updateData.exhibitionDate) {
      fieldsToUpdate.exhibitionDate = new Date(updateData.exhibitionDate);
    }
    if (updateData.notes !== undefined) {
      fieldsToUpdate.notes = updateData.notes.trim();
    }
    if (updateData.tier !== undefined) {
      fieldsToUpdate.tier = updateData.tier.trim();
    }

    const updated = await Session.findByIdAndUpdate(
      id,
      { $set: fieldsToUpdate },
      { new: true, runValidators: true }
    )
      .populate('movieId')
      .populate('memberId')
      .lean();

    return updated as unknown as PopulatedSession | null;
  }

  /**
   * Remove uma sessão por ID
   */
  async deleteSession(id: string): Promise<boolean> {
    const result = await Session.findByIdAndDelete(id);
    return !!result;
  }

  /**
   * Atualiza o tier de classificação de uma sessão (aceita qualquer categoria customizada)
   */
  async updateTier(id: string, tier: string): Promise<PopulatedSession | null> {
    const normalizedTier = (tier || 'Unranked').trim();

    const updated = await Session.findByIdAndUpdate(
      id,
      { tier: normalizedTier },
      { new: true, runValidators: true }
    )
      .populate('movieId')
      .populate('memberId')
      .lean();

    return updated as unknown as PopulatedSession | null;
  }
}

export const sessionService = new SessionService();
