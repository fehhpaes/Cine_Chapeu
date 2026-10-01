import { Request, Response } from 'express';
import { voteService } from '../services/voteService.js';

export class VoteController {
  /**
   * POST /api/votes
   */
  async submit(req: Request, res: Response): Promise<void> {
    try {
      const { year, memberId, selections, feedback } = req.body;

      if (!year || !memberId || !selections || !Array.isArray(selections) || selections.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Campos obrigatórios ausentes para registrar o voto.',
        });
        return;
      }

      const vote = await voteService.submitVote({
        year: Number(year),
        memberId,
        selections,
        feedback,
      });

      res.status(201).json({
        success: true,
        message: 'Voto registrado com sucesso no Oscar do Cine Chapéu!',
        data: vote,
      });
    } catch (error: any) {
      console.error('[VoteController.submit] Erro:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao registrar voto.',
      });
    }
  }

  /**
   * GET /api/votes/my-vote?year=YYYY&memberId=ID
   */
  async getMyVote(req: Request, res: Response): Promise<void> {
    try {
      const { year, memberId } = req.query;

      if (!year || !memberId) {
        res.status(400).json({ success: false, message: 'Ano e membro são obrigatórios.' });
        return;
      }

      const vote = await voteService.getVoteByMemberAndYear(Number(year), memberId as string);
      res.status(200).json({
        success: true,
        hasVoted: !!vote,
        data: vote,
      });
    } catch (error: any) {
      console.error('[VoteController.getMyVote] Erro:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao verificar voto do membro.',
        error: error.message,
      });
    }
  }
}

export const voteController = new VoteController();
