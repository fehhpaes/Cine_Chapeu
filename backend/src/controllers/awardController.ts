import { Request, Response } from 'express';
import { awardService } from '../services/awardService.js';

export class AwardController {
  async getByYear(req: Request, res: Response): Promise<void> {
    try {
      const year = parseInt(req.params.year, 10);
      if (isNaN(year)) {
        res.status(400).json({ success: false, message: 'Ano inválido fornecido.' });
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

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { year, categoryName, nominees, winner } = req.body;

      if (!year || !categoryName || !nominees || !winner) {
        res.status(400).json({ success: false, message: 'Campos obrigatórios ausentes.' });
        return;
      }

      const award = await awardService.createAward({ year, categoryName, nominees, winner });
      res.status(201).json({ success: true, data: award });
    } catch (error: any) {
      console.error('[AwardController.create] Erro:', error);
      res.status(500).json({ success: false, message: 'Erro ao criar premiação.', error: error.message });
    }
  }
}

export const awardController = new AwardController();
