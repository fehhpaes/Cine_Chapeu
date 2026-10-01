import { Request, Response } from 'express';
import { ceremonyService } from '../services/ceremonyService.js';

export class CeremonyController {
  /**
   * GET /api/ceremonies/active
   */
  async getActive(_req: Request, res: Response): Promise<void> {
    try {
      const activeCeremony = await ceremonyService.getActiveCeremony();
      res.status(200).json({
        success: true,
        data: activeCeremony,
        isOpen: !!activeCeremony,
      });
    } catch (error: any) {
      console.error('[CeremonyController.getActive] Erro:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao verificar votação ativa do Oscar.',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/ceremonies/:year ou GET /api/ceremonies?year=YYYY
   */
  async getByYear(req: Request, res: Response): Promise<void> {
    try {
      const yearQuery = req.params.year || req.query.year;
      const year = parseInt(yearQuery as string, 10);

      if (isNaN(year)) {
        res.status(400).json({ success: false, message: 'Ano inválido.' });
        return;
      }

      const ceremony = await ceremonyService.getCeremonyByYear(year);
      res.status(200).json({
        success: true,
        data: ceremony,
      });
    } catch (error: any) {
      console.error('[CeremonyController.getByYear] Erro:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar dados da cerimônia.',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/ceremonies
   */
  async save(req: Request, res: Response): Promise<void> {
    try {
      const { year, votingStartDate, votingEndDate } = req.body;

      if (!year || !votingStartDate || !votingEndDate) {
        res.status(400).json({
          success: false,
          message: 'Campos ano, data inicial e data final de votação são obrigatórios.',
        });
        return;
      }

      const saved = await ceremonyService.saveCeremony({
        year,
        votingStartDate,
        votingEndDate,
      });

      res.status(200).json({
        success: true,
        message: 'Período da cerimônia configurado com sucesso!',
        data: saved,
      });
    } catch (error: any) {
      console.error('[CeremonyController.save] Erro:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao salvar cerimônia.',
      });
    }
  }
}

export const ceremonyController = new CeremonyController();
