import { Request, Response } from 'express';
import { periodService } from '../services/periodService.js';

export class PeriodController {
  /**
   * GET /api/periods?year=YYYY
   */
  async getByYear(req: Request, res: Response): Promise<void> {
    try {
      const yearQuery = req.query.year as string | undefined;
      const year = yearQuery ? parseInt(yearQuery, 10) : undefined;

      const periods = await periodService.getPeriodsByYear(year);
      res.status(200).json({
        success: true,
        count: periods.length,
        data: periods,
      });
    } catch (error: any) {
      console.error('[PeriodController.getByYear] Erro:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar períodos.',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/periods
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, year, startDate, endDate } = req.body;

      if (!name || !year || !startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'Campos obrigatórios ausentes (nome, ano, data inicial ou data final).',
        });
        return;
      }

      const period = await periodService.createPeriod({
        name,
        year,
        startDate,
        endDate,
      });

      res.status(201).json({
        success: true,
        message: 'Período cadastrado com sucesso!',
        data: period,
      });
    } catch (error: any) {
      console.error('[PeriodController.create] Erro:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao criar período.',
      });
    }
  }

  /**
   * DELETE /api/periods/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await periodService.deletePeriod(id);

      if (!deleted) {
        res.status(404).json({ success: false, message: 'Período não encontrado.' });
        return;
      }

      res.status(200).json({ success: true, message: 'Período removido com sucesso!' });
    } catch (error: any) {
      console.error('[PeriodController.delete] Erro:', error);
      res.status(500).json({ success: false, message: 'Erro ao remover período.', error: error.message });
    }
  }
}

export const periodController = new PeriodController();
