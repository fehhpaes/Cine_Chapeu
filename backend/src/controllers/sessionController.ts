import { Request, Response } from 'express';
import { sessionService } from '../services/sessionService.js';
import { tmdbService } from '../services/tmdbService.js';

export class SessionController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { movieTitle, memberId, year, category } = req.query;

      const filters = {
        movieTitle: movieTitle as string | undefined,
        memberId: memberId as string | undefined,
        year: year ? parseInt(year as string, 10) : undefined,
        category: category as string | undefined,
      };

      const sessions = await sessionService.getSessions(filters);
      res.status(200).json({
        success: true,
        count: sessions.length,
        data: sessions,
      });
    } catch (error: any) {
      console.error('[SessionController.getAll] Erro:', error);
      res.status(500).json({ success: false, message: 'Erro ao buscar sessões.', error: error.message });
    }
  }

  async getFilterOptions(_req: Request, res: Response): Promise<void> {
    try {
      const options = await sessionService.getFilterOptions();
      res.status(200).json({ success: true, data: options });
    } catch (error: any) {
      console.error('[SessionController.getFilterOptions] Erro:', error);
      res.status(500).json({ success: false, message: 'Erro ao buscar opções de filtro.', error: error.message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const session = await sessionService.getSessionById(id);

      if (!session) {
        res.status(404).json({ success: false, message: 'Sessão não encontrada.' });
        return;
      }

      res.status(200).json({ success: true, data: session });
    } catch (error: any) {
      console.error('[SessionController.getById] Erro:', error);
      res.status(500).json({ success: false, message: 'Erro ao buscar sessão.', error: error.message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { tmdbId, movieData, memberId, drawnCategory, exhibitionDate, notes } = req.body;

      if ((!tmdbId && !movieData) || !memberId || !drawnCategory || !exhibitionDate) {
        res.status(400).json({
          success: false,
          message: 'Campos obrigatórios ausentes (filme, membro, categoria ou data).',
        });
        return;
      }

      const session = await sessionService.createSession({
        tmdbId,
        movieData,
        memberId,
        drawnCategory,
        exhibitionDate,
        notes,
      });

      res.status(201).json({
        success: true,
        message: 'Sessão registrada com sucesso!',
        data: session,
      });
    } catch (error: any) {
      console.error('[SessionController.create] Erro:', error);
      res.status(500).json({ success: false, message: 'Erro ao criar sessão.', error: error.message });
    }
  }

  async searchTMDB(req: Request, res: Response): Promise<void> {
    try {
      const query = (req.query.q as string) || '';
      if (!query || query.trim().length === 0) {
        res.status(200).json({ success: true, data: [] });
        return;
      }

      const results = await tmdbService.searchMovies(query);
      res.status(200).json({ success: true, data: results });
    } catch (error: any) {
      console.error('[SessionController.searchTMDB] Erro:', error);
      res.status(500).json({ success: false, message: 'Erro ao buscar filmes no TMDB.', error: error.message });
    }
  }
}

export const sessionController = new SessionController();
