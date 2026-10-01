import { Request, Response } from 'express';
import { tierConfigService } from '../services/tierConfigService.js';

export class TierConfigController {
  /**
   * GET /api/tierconfig
   */
  async get(_req: Request, res: Response): Promise<void> {
    try {
      const config = await tierConfigService.getConfig();
      res.status(200).json({
        success: true,
        data: config,
      });
    } catch (error: any) {
      console.error('[TierConfigController.get] Erro:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar configurações da Tier List.',
        error: error.message,
      });
    }
  }

  /**
   * PUT /api/tierconfig
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { rows } = req.body;

      if (!rows || !Array.isArray(rows)) {
        res.status(400).json({
          success: false,
          message: 'Parâmetro rows deve ser um array de categorias de tier.',
        });
        return;
      }

      const updated = await tierConfigService.updateConfig(rows);
      res.status(200).json({
        success: true,
        message: 'Configuração da Tier List salva com sucesso!',
        data: updated,
      });
    } catch (error: any) {
      console.error('[TierConfigController.update] Erro:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar configuração da Tier List.',
        error: error.message,
      });
    }
  }
}

export const tierConfigController = new TierConfigController();
