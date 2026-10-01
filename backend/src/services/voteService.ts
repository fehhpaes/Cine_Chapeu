import { Vote } from '../models/Vote.js';
import { IVoteDocument, IVoteSelection } from '../types/index.js';

export class VoteService {
  /**
   * Salva ou atualiza a cédula de votação de um membro no Oscar
   */
  async submitVote(data: {
    year: number;
    memberId: string;
    selections: IVoteSelection[];
    feedback?: string;
  }): Promise<IVoteDocument> {
    const { year, memberId, selections, feedback } = data;

    if (!year || !memberId || !selections || !Array.isArray(selections) || selections.length === 0) {
      throw new Error('Ano, membro e seleções de voto são obrigatórios.');
    }

    // Upsert garantindo que o membro vote apenas uma vez por ano
    const vote = await Vote.findOneAndUpdate(
      { year: Number(year), memberId },
      {
        year: Number(year),
        memberId,
        selections,
        feedback: (feedback || '').trim(),
      },
      { upsert: true, new: true, runValidators: true }
    );

    return vote;
  }

  /**
   * Busca o voto de um membro específico no ano
   */
  async getVoteByMemberAndYear(year: number, memberId: string): Promise<IVoteDocument | null> {
    const vote = await Vote.findOne({ year: Number(year), memberId }).lean();
    return vote as unknown as IVoteDocument | null;
  }
}

export const voteService = new VoteService();
