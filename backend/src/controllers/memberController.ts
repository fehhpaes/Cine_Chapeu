import { Request, Response } from 'express';
import { memberService } from '../services/memberService.js';

export class MemberController {
  async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const members = await memberService.getAllMembers();
      res.status(200).json({ success: true, data: members });
    } catch (error: any) {
      console.error('[MemberController.getAll] Erro:', error);
      res.status(500).json({ success: false, message: 'Erro ao buscar membros.', error: error.message });
    }
  }

  async getActive(_req: Request, res: Response): Promise<void> {
    try {
      const members = await memberService.getActiveMembers();
      res.status(200).json({ success: true, data: members });
    } catch (error: any) {
      console.error('[MemberController.getActive] Erro:', error);
      res.status(500).json({ success: false, message: 'Erro ao buscar membros ativos.', error: error.message });
    }
  }

  async drawRandom(_req: Request, res: Response): Promise<void> {
    try {
      const chosenMember = await memberService.drawRandomMember();
      res.status(200).json({
        success: true,
        message: `Membro sorteado com sucesso: ${chosenMember.name}!`,
        data: chosenMember,
      });
    } catch (error: any) {
      console.error('[MemberController.drawRandom] Erro:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, active, avatarUrl } = req.body;
      if (!name) {
        res.status(400).json({ success: false, message: 'O nome do membro é obrigatório.' });
        return;
      }
      const member = await memberService.createMember({ name, active, avatarUrl });
      res.status(201).json({ success: true, data: member });
    } catch (error: any) {
      console.error('[MemberController.create] Erro:', error);
      res.status(500).json({ success: false, message: 'Erro ao criar membro.', error: error.message });
    }
  }

  async toggle(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await memberService.toggleActive(id);
      if (!updated) {
        res.status(404).json({ success: false, message: 'Membro não encontrado.' });
        return;
      }
      res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      console.error('[MemberController.toggle] Erro:', error);
      res.status(500).json({ success: false, message: 'Erro ao alterar status do membro.', error: error.message });
    }
  }
}

export const memberController = new MemberController();
