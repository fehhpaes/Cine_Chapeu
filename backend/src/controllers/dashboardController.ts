import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboardService.js';

export class DashboardController {
  /**
   * GET /api/admin/dashboard?year=YYYY
   */
  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const yearQuery = req.query.year || req.params.year;
      const year = yearQuery ? parseInt(yearQuery as string, 10) : new Date().getFullYear();

      if (isNaN(year)) {
        res.status(400).json({ success: false, message: 'Ano inválido.' });
        return;
      }

      const data = await dashboardService.getPresenterDashboard(year);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error('[DashboardController.getDashboard] Erro:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao gerar dados do Dashboard de Apresentação.',
        error: error.message,
      });
    }
  }
}

export const dashboardController = new DashboardController();
