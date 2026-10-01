import { CustomPeriod } from '../models/CustomPeriod.js';
import { ICustomPeriodDocument } from '../types/index.js';

export class PeriodService {
  /**
   * Busca períodos cadastrados para um determinado ano (ou todos)
   */
  async getPeriodsByYear(year?: number): Promise<ICustomPeriodDocument[]> {
    const query: any = {};
    if (year && !isNaN(year)) {
      query.year = year;
    }

    const periods = await CustomPeriod.find(query).sort({ startDate: 1 }).lean();
    return periods as unknown as ICustomPeriodDocument[];
  }

  /**
   * Cria um novo período customizado
   */
  async createPeriod(data: {
    name: string;
    year: number;
    startDate: string | Date;
    endDate: string | Date;
  }): Promise<ICustomPeriodDocument> {
    const { name, year, startDate, endDate } = data;

    if (!name || !year || !startDate || !endDate) {
      throw new Error('Todos os campos (nome, ano, data inicial e data final) são obrigatórios.');
    }

    const period = new CustomPeriod({
      name: name.trim(),
      year: Number(year),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });

    return await period.save();
  }

  /**
   * Remove um período por ID
   */
  async deletePeriod(id: string): Promise<boolean> {
    const result = await CustomPeriod.findByIdAndDelete(id);
    return !!result;
  }
}

export const periodService = new PeriodService();
