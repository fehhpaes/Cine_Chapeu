import { Award } from '../models/Award.js';
import { PopulatedAward } from '../types/index.js';

export class AwardService {
  /**
   * Busca todas as categorias do Oscar de um determinado ano,
   * realizando populate aninhado em profundidade para nominees e winner:
   * Session -> movieId (Movie) e memberId (Member)
   */
  async getAwardsByYear(year: number): Promise<PopulatedAward[]> {
    const awards = await Award.find({ year })
      .populate({
        path: 'nominees',
        populate: [
          { path: 'movieId', select: 'title originalTitle director posterUrl releaseYear genres runtime tmdbId' },
          { path: 'memberId', select: 'name active avatarUrl' },
        ],
      })
      .populate({
        path: 'winner',
        populate: [
          { path: 'movieId', select: 'title originalTitle director posterUrl releaseYear genres runtime tmdbId' },
          { path: 'memberId', select: 'name active avatarUrl' },
        ],
      })
      .sort({ categoryName: 1 })
      .lean();

    return awards as unknown as PopulatedAward[];
  }

  /**
   * Retorna os anos que possuem premiações cadastradas
   */
  async getAvailableYears(): Promise<number[]> {
    const years = await Award.distinct('year');
    return years.sort((a, b) => b - a);
  }

  /**
   * Cria uma nova categoria de Award
   */
  async createAward(data: {
    year: number;
    categoryName: string;
    nominees: string[];
    winner: string;
  }) {
    const award = new Award(data);
    return await award.save();
  }
}

export const awardService = new AwardService();
