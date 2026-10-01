import { Router, Request, Response } from 'express';
import { tmdbService } from '../services/tmdbService.js';

const router = Router();

/**
 * GET /api/tmdb/search?query=nome_do_filme
 * Realiza a busca oficial na API do TMDB em pt-BR
 */
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = (req.query.query as string) || (req.query.q as string) || '';

    if (!query || query.trim().length === 0) {
      res.status(200).json({ success: true, data: [] });
      return;
    }

    const results = await tmdbService.searchMovies(query.trim());
    res.status(200).json({ success: true, data: results });
  } catch (error: any) {
    console.error('[tmdbRoutes.search] Erro:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao consultar filmes no TMDB.',
    });
  }
});

export default router;
