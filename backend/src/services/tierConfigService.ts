import { TierConfig } from '../models/TierConfig.js';
import { ITierRow } from '../types/index.js';

export const DEFAULT_TIER_ROWS: ITierRow[] = [
  { name: 'S', color: '#ef4444', order: 0 },
  { name: 'A', color: '#f97316', order: 1 },
  { name: 'B', color: '#f59e0b', order: 2 },
  { name: 'C', color: '#eab308', order: 3 },
  { name: 'D', color: '#22c55e', order: 4 },
  { name: 'Lixeira', color: '#52525b', order: 5 },
];

export class TierConfigService {
  /**
   * Obtém a configuração salva dos tiers ou retorna o padrão inicial
   */
  async getConfig(): Promise<{ rows: ITierRow[] }> {
    const config = await TierConfig.findOne().lean();

    if (!config || !config.rows || config.rows.length === 0) {
      return { rows: DEFAULT_TIER_ROWS };
    }

    const sortedRows = [...config.rows].sort((a, b) => a.order - b.order);
    return { rows: sortedRows };
  }

  /**
   * Atualiza ou cria a configuração dos tiers
   */
  async updateConfig(rows: ITierRow[]): Promise<{ rows: ITierRow[] }> {
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      throw new Error('Lista de linhas do Tier é obrigatória.');
    }

    // Normaliza a ordem
    const normalizedRows = rows.map((row, index) => ({
      name: (row.name || 'Tier').trim(),
      color: (row.color || '#52525b').trim(),
      order: typeof row.order === 'number' ? row.order : index,
    }));

    let config = await TierConfig.findOne();

    if (config) {
      config.rows = normalizedRows;
      await config.save();
    } else {
      config = await TierConfig.create({ rows: normalizedRows });
    }

    return { rows: config.rows };
  }
}

export const tierConfigService = new TierConfigService();
