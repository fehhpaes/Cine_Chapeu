import { Request, Response } from 'express';
import { awardService } from '../services/awardService.js';

export class AwardController {
  /**
   * GET /api/awards?year=YYYY ou GET /api/awards/:year
   * Retorna os prêmios do ano com Deep Populate
   */
  async getByYear(req: Request, res: Response): Promise<void> {
    try {
      const yearQuery = req.query.year || req.params.year;
      const year = parseInt(yearQuery as string, 10);

      if (isNaN(year)) {
        res.status(400).json({ success: false, message: 'Parâmetro de ano inválido ou ausente.' });
        return;
      }

      const awards = await awardService.getAwardsByYear(year);
      res.status(200).json({
        success: true,
        data: awards,
        count: awards.length,
        year,
      });
    } catch (error: any) {
      console.error('[AwardController.getByYear] Erro:', error);
      res.status(500).json({ success: false, message: 'Erro ao buscar dados do Oscar.', error: error.message });
    }
  }

  /**
   * GET /api/awards/years
   * Retorna lista de anos disponíveis em ordem decrescente
   */
  async getYears(_req: Request, res: Response): Promise<void> {
    try {
      const years = await awardService.getAvailableYears();
      res.status(200).json({
        success: true,
        data: years,
      });
    } catch (error: any) {
      console.error('[AwardController.getYears] Erro:', error);
      res.status(500).json({ success: false, message: 'Erro ao buscar anos do Oscar.', error: error.message });
    }
  }

  /**
   * POST /api/awards
   * Cadastra uma nova categoria de premiação
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { year, categoryName, nominees, winner } = req.body;

      if (!year || !categoryName || !nominees || !Array.isArray(nominees) || nominees.length === 0 || !winner) {
        res.status(400).json({
          success: false,
          message: 'Campos obrigatórios ausentes (ano, nome da categoria, lista de indicados e vencedor).',
        });
        return;
      }

      const award = await awardService.createAward({
        year: parseInt(year, 10),
        categoryName: categoryName.trim(),
        nominees,
        winner,
      });

      const populated = await awardService.getAwardsByYear(parseInt(year, 10));
      const createdItem = populated.find((a) => a._id.toString() === award._id.toString()) || award;

      res.status(201).json({
        success: true,
        message: 'Prêmio registrado com sucesso!',
        data: createdItem,
      });
    } catch (error: any) {
      console.error('[AwardController.create] Erro:', error);
      res.status(500).json({ success: false, message: 'Erro ao criar premiação.', error: error.message });
    }
  }
}

export const awardController = new AwardController();
