import { Vote } from '../models/Vote.js';
import { Award } from '../models/Award.js';
import { Session } from '../models/Session.js';
import { PresenterDashboardData, CategoryVoteStats, NomineeVoteStats, PopulatedSession } from '../types/index.js';

export class DashboardService {
  /**
   * Coleta e agrega todas as estatísticas para o Dashboard do Apresentador no dia do evento
   */
  async getPresenterDashboard(year: number): Promise<PresenterDashboardData> {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    // 1. Total de Votos registrados no ano
    const totalVotes = await Vote.countDocuments({ year });

    // 2. Feedbacks dos membros
    const votesWithFeedback = await Vote.find({
      year,
      feedback: { $exists: true, $ne: '' },
    })
      .populate('memberId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const feedbacks = votesWithFeedback.map((v: any) => ({
      memberId: v.memberId?._id?.toString() || '',
      memberName: v.memberId?.name || 'Membro do Clube',
      feedback: v.feedback,
      createdAt: v.createdAt || new Date(),
    }));

    // 3. Estatísticas gerais do ano (Sessões e Membros distintos que trouxeram filmes)
    const totalSessionsInYear = await Session.countDocuments({
      exhibitionDate: { $gte: startOfYear, $lte: endOfYear },
    });

    const distinctMembers = await Session.distinct('memberId', {
      exhibitionDate: { $gte: startOfYear, $lte: endOfYear },
    });
    const totalDistinctMembersInYear = distinctMembers.length;

    // 4. Categorias e Distribuição de Votos por Indicado
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

    // Busca todos os votos do ano para contagem por categoria
    const allVotes = await Vote.find({ year }).lean();

    // Mapeia votos por awardId -> sessionId -> count
    const voteMatrix: Record<string, Record<string, number>> = {};
    for (const v of allVotes) {
      if (v.selections && Array.isArray(v.selections)) {
        for (const sel of v.selections) {
          const aId = sel.awardId?.toString();
          const sId = sel.sessionId?.toString();
          if (aId && sId) {
            if (!voteMatrix[aId]) {
              voteMatrix[aId] = {};
            }
            voteMatrix[aId][sId] = (voteMatrix[aId][sId] || 0) + 1;
          }
        }
      }
    }

    const categories: CategoryVoteStats[] = awards.map((award: any) => {
      const awardId = award._id.toString();
      const categoryVotes = voteMatrix[awardId] || {};
      const winnerSessionId = award.winner?._id ? award.winner._id.toString() : undefined;

      // Calcula total de votos nesta categoria
      const totalCategoryVotes = Object.values(categoryVotes).reduce((sum, count) => sum + count, 0);

      const nominees: NomineeVoteStats[] = (award.nominees || []).map((session: any) => {
        const sessionId = session._id.toString();
        const voteCount = categoryVotes[sessionId] || 0;
        const percentage = totalCategoryVotes > 0 ? Math.round((voteCount / totalCategoryVotes) * 100) : 0;
        const isWinner = sessionId === winnerSessionId;

        return {
          session: session as PopulatedSession,
          voteCount,
          percentage,
          isWinner,
        };
      });

      // Ordena indicados por quantidade de votos decrescente para o apresentador criar suspense
      nominees.sort((a, b) => b.voteCount - a.voteCount);

      return {
        awardId,
        categoryName: award.categoryName,
        totalCategoryVotes,
        winnerSessionId,
        nominees,
      };
    });

    return {
      year,
      totalVotes,
      totalSessionsInYear,
      totalDistinctMembersInYear,
      categories,
      feedbacks,
    };
  }
}

export const dashboardService = new DashboardService();
