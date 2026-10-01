import { Member } from '../models/Member.js';
import { IMember, IMemberDocument } from '../types/index.js';

export class MemberService {
  /**
   * Retorna todos os membros cadastrados
   */
  async getAllMembers(): Promise<IMemberDocument[]> {
    return await Member.find().sort({ name: 1 });
  }

  /**
   * Retorna todos os membros ativos
   */
  async getActiveMembers(): Promise<IMemberDocument[]> {
    return await Member.find({ active: true }).sort({ name: 1 });
  }

  /**
   * Sorteia aleatoriamente um membro ativo para escolher o próximo filme
   */
  async drawRandomMember(): Promise<IMemberDocument> {
    const activeMembers = await Member.find({ active: true });

    if (!activeMembers || activeMembers.length === 0) {
      throw new Error('Nenhum membro ativo encontrado para o sorteio.');
    }

    const randomIndex = Math.floor(Math.random() * activeMembers.length);
    return activeMembers[randomIndex];
  }

  /**
   * Cria um novo membro
   */
  async createMember(data: Partial<IMember>): Promise<IMemberDocument> {
    const member = new Member(data);
    return await member.save();
  }

  /**
   * Atualiza status ativo/inativo
   */
  async toggleActive(memberId: string): Promise<IMemberDocument | null> {
    const member = await Member.findById(memberId);
    if (!member) return null;
    member.active = !member.active;
    return await member.save();
  }
}

export const memberService = new MemberService();
