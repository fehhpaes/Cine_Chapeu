import { Request, Response } from 'express';
import { sessionService } from '../services/sessionService.js';
import { tmdbService } from '../services/tmdbService.js';

export class SessionController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { movieTitle, memberId, year, category, startDate, endDate } = req.query;

      const filters = {
        movieTitle: movieTitle as string | undefined,
        memberId: memberId as string | undefined,
        year: year ? parseInt(year as string, 10) : undefined,
        category: category as string | undefined,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
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

  /**
   * GET /api/sessions/next
   * Retorna a próxima sessão agendada (exhibitionDate >= hoje)
   */
  async getNext(_req: Request, res: Response): Promise<void> {
    try {
      const nextSession = await sessionService.getNextSession();
      res.status(200).json({
        success: true,
        data: nextSession,
      });
    } catch (error: any) {
      console.error('[SessionController.getNext] Erro:', error);
      res.status(500).json({ success: false, message: 'Erro ao buscar próxima sessão.', error: error.message });
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
      const { movie, tmdbId, memberId, drawnCategory, exhibitionDate, notes } = req.body;

      if ((!movie && !tmdbId) || !memberId || !drawnCategory || !exhibitionDate) {
        res.status(400).json({
          success: false,
          message: 'Campos obrigatórios ausentes (filme, membro, categoria ou data de exibição).',
        });
        return;
      }

      const session = await sessionService.createSession({
        movie,
        tmdbId,
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
      res.status(500).json({ success: false, message: error.message || 'Erro ao criar sessão.' });
    }
  }

  async searchTMDB(req: Request, res: Response): Promise<void> {
    try {
      const query = (req.query.q as string) || (req.query.query as string) || '';
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

  async updateTier(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { tier } = req.body;

      if (!tier) {
        res.status(400).json({ success: false, message: 'Campo tier é obrigatório.' });
        return;
      }

      const updatedSession = await sessionService.updateTier(id, tier);

      if (!updatedSession) {
        res.status(404).json({ success: false, message: 'Sessão não encontrada.' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Tier atualizado com sucesso!',
        data: updatedSession,
      });
    } catch (error: any) {
      console.error('[SessionController.updateTier] Erro:', error);
      res.status(500).json({ success: false, message: error.message || 'Erro ao atualizar tier.' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { memberId, drawnCategory, exhibitionDate, notes, tier, tmdbData, movie, tmdbId } = req.body;

      const updated = await sessionService.updateSession(id, {
        memberId,
        drawnCategory,
        exhibitionDate,
        notes,
        tier,
        tmdbData,
        movie,
        tmdbId,
      });

      if (!updated) {
        res.status(404).json({ success: false, message: 'Sessão não encontrada para atualização.' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Sessão atualizada com sucesso!',
        data: updated,
      });
    } catch (error: any) {
      console.error('[SessionController.update] Erro:', error);
      res.status(500).json({ success: false, message: error.message || 'Erro ao atualizar sessão.' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await sessionService.deleteSession(id);

      if (!deleted) {
        res.status(404).json({ success: false, message: 'Sessão não encontrada para exclusão.' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Sessão excluída com sucesso!',
      });
    } catch (error: any) {
      console.error('[SessionController.delete] Erro:', error);
      res.status(500).json({ success: false, message: error.message || 'Erro ao excluir sessão.' });
    }
  }
}

export const sessionController = new SessionController();
