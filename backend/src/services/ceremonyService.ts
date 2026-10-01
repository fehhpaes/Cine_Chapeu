import { OscarCeremony } from '../models/OscarCeremony.js';
import { IOscarCeremonyDocument } from '../types/index.js';

export class CeremonyService {
  /**
   * Retorna a cerimônia do Oscar cujo período de votação esteja aberto no momento
   */
  async getActiveCeremony(): Promise<IOscarCeremonyDocument | null> {
    const now = new Date();

    const activeCeremony = await OscarCeremony.findOne({
      votingStartDate: { $lte: now },
      votingEndDate: { $gte: now },
    }).lean();

    return activeCeremony as unknown as IOscarCeremonyDocument | null;
  }

  /**
   * Retorna a cerimônia cadastrada para um determinado ano
   */
  async getCeremonyByYear(year: number): Promise<IOscarCeremonyDocument | null> {
    const ceremony = await OscarCeremony.findOne({ year }).lean();
    return ceremony as unknown as IOscarCeremonyDocument | null;
  }

  /**
   * Cria ou atualiza as datas de uma cerimônia do Oscar
   */
  async saveCeremony(data: {
    year: number;
    votingStartDate: string | Date;
    votingEndDate: string | Date;
  }): Promise<IOscarCeremonyDocument> {
    const { year, votingStartDate, votingEndDate } = data;

    const start = new Date(votingStartDate);
    const end = new Date(votingEndDate);
    // Se a data de fim for enviada como string YYYY-MM-DD, ajusta para 23:59:59.999
    if (typeof votingEndDate === 'string' && votingEndDate.length === 10) {
      end.setHours(23, 59, 59, 999);
    }

    const ceremony = await OscarCeremony.findOneAndUpdate(
      { year: Number(year) },
      {
        year: Number(year),
        votingStartDate: start,
        votingEndDate: end,
      },
      { upsert: true, new: true, runValidators: true }
    );

    return ceremony;
  }
}

export const ceremonyService = new CeremonyService();
